'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {dismissOnEmptyPreviewPointerDown}=require('../gui/canvas-selection-dismiss');

function target(selector){return{closest(value){return value.split(',').some(item=>item.trim()===selector)?this:null;}};}
function pointer(overrides={}){return{button:0,shiftKey:false,ctrlKey:false,metaKey:false,target:target('blank'),...overrides};}

test('primary click on blank preview clears selection immediately on pointerdown',()=>{
  let cleared=0;
  assert.equal(dismissOnEmptyPreviewPointerDown(pointer(),{hasSelection:true,clearSelection:()=>cleared++}),true);
  assert.equal(cleared,1);
});

test('blank preview click does nothing when no object is selected',()=>{
  let cleared=0;
  assert.equal(dismissOnEmptyPreviewPointerDown(pointer(),{hasSelection:false,clearSelection:()=>cleared++}),false);
  assert.equal(cleared,0);
});

test('clicking an object or its manipulation controls preserves selection',()=>{
  for(const selector of ['[data-editor-overlay]','.hit','.handle-hit','.line-controls','#previewZoomControl','.preview-scrollbar']){
    let cleared=0;
    assert.equal(dismissOnEmptyPreviewPointerDown(pointer({target:target(selector)}),{hasSelection:true,clearSelection:()=>cleared++}),false,selector);
    assert.equal(cleared,0,selector);
  }
});

test('modified pointerdown preserves the current selection for additive marquee gestures',()=>{
  for(const modifier of ['shiftKey','ctrlKey','metaKey']){
    let cleared=0;
    assert.equal(dismissOnEmptyPreviewPointerDown(pointer({[modifier]:true}),{hasSelection:true,clearSelection:()=>cleared++}),false,modifier);
    assert.equal(cleared,0,modifier);
  }
});

test('non-primary pointerdown does not clear selection',()=>{
  let cleared=0;
  assert.equal(dismissOnEmptyPreviewPointerDown(pointer({button:1}),{hasSelection:true,clearSelection:()=>cleared++}),false);
  assert.equal(cleared,0);
});
