(function(root){
  'use strict';
  function create(){
    const previous=new WeakMap(),byIndex=new Map();
    const signature=element=>JSON.stringify([element?.type,element?.label,element?.source_name,element?.shape_preset,element?.bcid,String(element?.text||'').slice(0,128),String(element?.text||'').length,element?.bitmap_hex?.length,!!element?.table_model]);
    const geometryKeys=['x_mm','y_mm','width_mm','height_mm','rotation_deg','rotation_pivot_x_mm','rotation_pivot_y_mm','text_scale_x','text_scale_y','text_width_percent','text_box_width_mm','text_box_height_mm','font_size_pt','thickness_mm','hri_offset_mm'];
    const storageKey='q-label-transform-baselines';
    try{for(const entry of JSON.parse(root.sessionStorage?.getItem(storageKey)||'[]'))byIndex.set(entry.index,[entry]);}catch(_){}
    const persist=()=>{try{root.sessionStorage?.setItem(storageKey,JSON.stringify([...byIndex].map(([index,group])=>{const entry=group.find(item=>item.index===index);return {index,signature:entry.signature,geometry:Object.fromEntries(geometryKeys.map(key=>[key,entry.before?.[key]??entry.geometry?.[key]??null]))};})));}catch(_){};};
    const clone=value=>root.EditHistory?.cloneForUndo?root.EditHistory.cloneForUndo(value):structuredClone(value);
    const lookup=(element,index)=>{const fromRef=element&&previous.get(element);if(fromRef)return fromRef;const group=byIndex.get(index);if(!group?.length)return null;if(!group.some(entry=>entry.element===element||entry.index===index&&entry.signature===signature(element)))return null;for(const entry of group)if(!entry.before&&entry.geometry){entry.element=element;entry.before={...clone(element),...entry.geometry};previous.set(element,group);}return group;};
    return {
      remember(entries){const group=entries.map(({element,before,index})=>({element,index,signature:signature(element),before:clone(before)}));for(const entry of group){previous.set(entry.element,group);if(entry.index!==undefined)byIndex.set(entry.index,group);}persist();},
      has(element,index){if(!element)return false;const group=lookup(element,index),entry=group?.find(item=>item.element===element||item.index===index);if(entry?.before){const transformKeys=geometryKeys.filter(key=>key!=='x_mm'&&key!=='y_mm');if(transformKeys.some(key=>{const current=element[key]??null,before=entry.before[key]??null;return typeof current==='number'||typeof before==='number'?Math.abs((Number(current)||0)-(Number(before)||0))>1e-7:current!==before;}))return true;}return !!Number(element.rotation_deg)||(Number(element.text_scale_x)||1)!==1||(Number(element.text_scale_y)||1)!==1;},
      clear(element,index){const group=lookup(element,index)||[];for(const entry of group)if(previous.get(entry.element)===group){previous.delete(entry.element);if(byIndex.get(entry.index)===group)byIndex.delete(entry.index);}},
      take(element,index){const group=lookup(element,index);if(!group){if(!element)return [];const rotated=!!Number(element.rotation_deg),scaled=(Number(element.text_scale_x)||1)!==1||(Number(element.text_scale_y)||1)!==1;if(!rotated&&!scaled)return [];return [{element,index,before:{...clone(element),rotation_deg:0,text_scale_x:1,text_scale_y:1}}];}for(const entry of group)if(previous.get(entry.element)===group){previous.delete(entry.element);if(byIndex.get(entry.index)===group)byIndex.delete(entry.index);}persist();return group;}
    };
  }
  if(typeof module!=='undefined')module.exports={create};root.TransformHistory=create();
})(typeof window!=='undefined'?window:globalThis);
