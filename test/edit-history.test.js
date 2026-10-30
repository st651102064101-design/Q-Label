const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../gui/edit-history');

function heavyTemplate(chars=400000,rows=0){
  const bitmap_hex='a'.repeat(chars);
  return {
    name:'heavy',
    width_mm:60,
    height_mm:40,
    dpi:203,
    margin_mm:{left:1,top:2},
    elements:[
      {type:'image',x_mm:3,y_mm:4,width_mm:20,height_mm:15,bitmap_width:100,bitmap_height:80,bitmap_hex},
      {type:'text',x_mm:1,y_mm:1,width_mm:10,height_mm:5,text:'Hi',font_size_pt:12},
      {type:'box',x_mm:8,y_mm:8,width_mm:6,height_mm:4,thickness_mm:.3},
    ],
    data_sources:{sku:{type:'table',column:'id'}},
    database_connection:{
      fields:{id:'Number',name:'Text'},
      rows:Array.from({length:rows},(_,i)=>({id:i,name:'Item '+i,note:'n'.repeat(24)})),
    },
  };
}

test('cloneForUndo shares heavy bitmap strings and copies mutable geometry',()=>{
  const state=heavyTemplate(50000);
  const clone=api.cloneForUndo(state);
  assert.notEqual(clone,state);
  assert.notEqual(clone.elements,state.elements);
  assert.notEqual(clone.elements[0],state.elements[0]);
  assert.equal(clone.elements[0].bitmap_hex,state.elements[0].bitmap_hex);
  assert.ok(api.sharedHeavyStrings(clone.elements[0],state.elements[0]));
  clone.elements[0].x_mm=99;
  clone.margin_mm.left=8;
  assert.equal(state.elements[0].x_mm,3);
  assert.equal(state.margin_mm.left,1);
  assert.equal(clone.elements[0].bitmap_hex.length,50000);
});

test('gesture undo shares database rows and untouched elements',()=>{
  const state=heavyTemplate(20000,4000);
  const gesture=api.cloneForGestureUndo(state,[0]);
  assert.equal(gesture.database_connection,state.database_connection);
  assert.equal(gesture.database_connection.rows,state.database_connection.rows);
  assert.equal(gesture.data_sources,state.data_sources);
  assert.notEqual(gesture.elements[0],state.elements[0]);
  assert.equal(gesture.elements[0].bitmap_hex,state.elements[0].bitmap_hex);
  assert.equal(gesture.elements[1],state.elements[1]);
  assert.equal(gesture.elements[2],state.elements[2]);
  gesture.elements[0].x_mm=40;
  assert.equal(state.elements[0].x_mm,3);
});

test('gesture-sized undo capture stays far cheaper than JSON.stringify of bitmaps',()=>{
  const state=heavyTemplate(800000,8000);
  const jsonStart=process.hrtime.bigint();
  JSON.stringify(state);
  const jsonMs=Number(process.hrtime.bigint()-jsonStart)/1e6;
  const fullStart=process.hrtime.bigint();
  api.cloneForUndo(state);
  const fullMs=Number(process.hrtime.bigint()-fullStart)/1e6;
  const cloneStart=process.hrtime.bigint();
  const snapshot=api.cloneForGestureUndo(state,[0]);
  const cloneMs=Number(process.hrtime.bigint()-cloneStart)/1e6;
  assert.equal(snapshot.elements[0].bitmap_hex,state.elements[0].bitmap_hex);
  assert.equal(snapshot.database_connection.rows,state.database_connection.rows);
  assert.ok(cloneMs<Math.max(5,jsonMs/50),`gesture clone ${cloneMs.toFixed(2)}ms should beat JSON ${jsonMs.toFixed(2)}ms`);
  assert.ok(cloneMs<Math.max(3,fullMs/5),`gesture clone ${cloneMs.toFixed(2)}ms should beat full clone ${fullMs.toFixed(2)}ms`);
  assert.ok(cloneMs<12,`gesture clone took ${cloneMs.toFixed(2)}ms`);
});

test('revision fingerprint avoids JSON.stringify of bitmaps and rows',()=>{
  const left=heavyTemplate(100000,2000);
  const right=api.cloneForGestureUndo(left,[0]);
  const start=process.hrtime.bigint();
  assert.equal(api.sameRevisionState(left,right),true);
  const ms=Number(process.hrtime.bigint()-start)/1e6;
  right.elements[0].x_mm=99;
  assert.equal(api.sameRevisionState(left,right),false);
  assert.ok(ms<8,`fingerprint compare took ${ms.toFixed(2)}ms`);
});

test('undo revive restores geometry without keeping live object identity',()=>{
  const state=heavyTemplate(2000);
  const {undoStack,snapshot}=api.pushUndoSnapshot([],[],state,{gesture:true,mutableIndices:[0]});
  state.elements[0].x_mm=40;
  state.elements[0].bitmap_hex='bb';
  const restored=api.reviveUndoEntry(undoStack[0]);
  assert.equal(restored.elements[0].x_mm,3);
  assert.equal(restored.elements[0].bitmap_hex,snapshot.elements[0].bitmap_hex);
  assert.notEqual(restored,snapshot);
  restored.elements[0].x_mm=7;
  assert.equal(snapshot.elements[0].x_mm,3);
});

test('history payload serializes undo entries for disk and restores mixed stacks',()=>{
  const state=heavyTemplate(100);
  const {undoStack}=api.pushUndoSnapshot([],[],state);
  const revisions=api.recordRevision([],state,'Before edit',5,{reuseState:true});
  const payload=api.serializeHistoryPayload(revisions,undoStack,[],5);
  assert.equal(typeof payload.undoStack[0],'string');
  assert.equal(payload.revisions[0].label,'Before edit');
  const restored=api.restoreStacks(payload);
  assert.equal(typeof restored.undoStack[0],'string');
  assert.equal(api.reviveUndoEntry(restored.undoStack[0]).elements[0].x_mm,3);
  const again=api.recordRevision(revisions,state,'Before edit',5,{reuseState:true});
  assert.equal(again.length,1);
});

test('deferred revision bookkeeping can reuse the captured before snapshot',()=>{
  const before=heavyTemplate(1000,500);
  const live=api.cloneForGestureUndo(before,[0]);
  live.elements[0].x_mm=22;
  const revisions=api.recordRevision([],before,'Before edit',5,{reuseState:true});
  assert.equal(revisions[0].state,before);
  assert.equal(revisions[0].state.elements[0].x_mm,3);
  assert.equal(live.elements[0].x_mm,22);
  assert.equal(revisions[0].state.database_connection.rows,before.database_connection.rows);
});
