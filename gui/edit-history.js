(function(root){
  'use strict';
  // Large binary-ish strings are immutable during move/resize. Sharing their
  // references keeps undo capture off the gesture hot path without losing undo.
  const SHARED_STRING_KEYS=new Set(['bitmap_hex','rendered_bitmap','cached_preview']);
  // Gesture undo only mutates element geometry. Keep database rows / sources shared.
  const SHARED_TEMPLATE_KEYS=new Set(['database_connection','data_sources','field_meta','values','background','print_background']);

  function cloneForUndo(value,seen=new WeakMap()){
    if(value===null||typeof value!=='object')return value;
    if(seen.has(value))return seen.get(value);
    if(Array.isArray(value)){
      const copy=[];seen.set(value,copy);
      for(const item of value)copy.push(cloneForUndo(item,seen));
      return copy;
    }
    const copy={};seen.set(value,copy);
    for(const key of Object.keys(value)){
      const item=value[key];
      copy[key]=SHARED_STRING_KEYS.has(key)&&typeof item==='string'?item:cloneForUndo(item,seen);
    }
    return copy;
  }

  // Pointerdown capture for drag/resize: clone only elements that may change and
  // share every other object reference (including database rows).
  function cloneForGestureUndo(state,mutableIndices=null){
    if(!state||typeof state!=='object')return state;
    const copy={...state};
    for(const key of SHARED_TEMPLATE_KEYS)if(key in state)copy[key]=state[key];
    if(state.margin_mm&&typeof state.margin_mm==='object')copy.margin_mm={...state.margin_mm};
    if(state.page&&typeof state.page==='object')copy.page={...state.page};
    const elements=Array.isArray(state.elements)?state.elements:[];
    if(mutableIndices==null){
      copy.elements=elements.map(element=>cloneForUndo(element));
    }else{
      const mutable=new Set(mutableIndices);
      copy.elements=elements.map((element,index)=>mutable.has(index)?cloneForUndo(element):element);
    }
    return copy;
  }

  function revisionFingerprint(state){
    if(!state||typeof state!=='object')return '';
    const elements=Array.isArray(state.elements)?state.elements:[];
    let sig=`${elements.length}|${state.width_mm}|${state.height_mm}|${state.name||''}|`;
    for(const element of elements){
      if(!element||typeof element!=='object'){sig+='.;';continue;}
      sig+=`${element.type},${element.x_mm},${element.y_mm},${element.width_mm},${element.height_mm},${element.thickness_mm},${element.line_style||''},${element.dash_pattern||0},${element.compound||''},${element.rotation_deg},${element.text_scale_x},${element.text_scale_y},${element.text},${element.bitmap_width}x${element.bitmap_height}:${typeof element.bitmap_hex==='string'?element.bitmap_hex.length:0};`;
    }
    return sig;
  }

  function reviveUndoEntry(entry){
    if(entry==null)return entry;
    if(typeof entry==='string'){
      try{return JSON.parse(entry);}catch{return null;}
    }
    return cloneForUndo(entry);
  }

  function serializeUndoEntry(entry){
    if(entry==null)return entry;
    if(typeof entry==='string')return entry;
    return JSON.stringify(entry);
  }

  function serializeHistoryPayload(revisions,undoStack,redoStack,maxRevisions=5){
    return {
      revisions:(revisions||[]).slice(-maxRevisions).map(revision=>{
        if(!revision||typeof revision!=='object')return revision;
        const state=revision.state;
        return {
          ...revision,
          state:typeof state==='string'?JSON.parse(state):state,
          serialized:undefined,
        };
      }),
      undoStack:(undoStack||[]).slice(-50).map(serializeUndoEntry),
      redoStack:(redoStack||[]).slice(-50).map(serializeUndoEntry),
    };
  }

  function restoreStacks(saved){
    const asEntries=list=>Array.isArray(list)?list.filter(entry=>entry!=null&&(typeof entry==='string'||typeof entry==='object')).slice(-50):[];
    return {
      revisions:Array.isArray(saved?.revisions)?saved.revisions.filter(revision=>revision&&revision.state&&typeof revision.state==='object'):[],
      undoStack:asEntries(saved?.undoStack),
      redoStack:asEntries(saved?.redoStack),
    };
  }

  function sameRevisionState(left,right){
    if(left===right)return true;
    if(!left||!right)return false;
    if(left.serialized&&right.serialized)return left.serialized===right.serialized;
    // Never JSON.stringify whole templates here — bitmaps/rows freeze the UI.
    return revisionFingerprint(left)===revisionFingerprint(right);
  }

  function recordRevision(revisions,state,label='Edit',maxRevisions=5,options={}){
    if(!state||typeof state!=='object')return revisions;
    const copy=options.reuseState?state:cloneForUndo(state);
    const last=revisions.at(-1);
    if(last&&sameRevisionState(last.state,copy))return revisions;
    const next=revisions.concat([{
      id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      time:new Date().toISOString(),
      label,
      state:copy,
    }]);
    return next.length>maxRevisions?next.slice(-maxRevisions):next;
  }

  function pushUndoSnapshot(undoStack,redoStack,state,options={}){
    const snapshot=options.gesture
      ?cloneForGestureUndo(state,options.mutableIndices)
      :cloneForUndo(state);
    const nextUndo=undoStack.concat([snapshot]);
    if(nextUndo.length>50)nextUndo.shift();
    return {undoStack:nextUndo,redoStack:[],snapshot};
  }

  function sharedHeavyStrings(left,right){
    if(!left||!right)return false;
    const keys=[...SHARED_STRING_KEYS];
    return keys.every(key=>{
      if(typeof left[key]!=='string'||typeof right[key]!=='string')return true;
      return left[key]===right[key];
    });
  }

  const api={
    SHARED_STRING_KEYS,
    SHARED_TEMPLATE_KEYS,
    cloneForUndo,
    cloneForGestureUndo,
    revisionFingerprint,
    reviveUndoEntry,
    serializeUndoEntry,
    serializeHistoryPayload,
    restoreStacks,
    sameRevisionState,
    recordRevision,
    pushUndoSnapshot,
    sharedHeavyStrings,
  };
  if(typeof module!=='undefined')module.exports=api;
  root.EditHistory=api;
})(typeof window!=='undefined'?window:globalThis);
