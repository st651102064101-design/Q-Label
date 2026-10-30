'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

function textEditorKeydown(){
  const source=fs.readFileSync(require.resolve('../gui/renderer.js'),'utf8');
  const start=source.indexOf("input.addEventListener('keydown',event=>",source.indexOf('function focusTextProperty('));
  const end=source.indexOf("input.addEventListener('blur'",start);
  assert.ok(start>=0&&end>start,'inline text editor has a keydown and blur lifecycle');
  const handlerSource=source.slice(start,end).replace(/^input\.addEventListener\('keydown',/, '').replace(/\);\s*$/,'');
  const context={cancelled:false,blurred:false,stopped:false,prevented:false,selectionCleared:false,input:{blur(){context.blurred=true;}},event:{key:'Escape',stopPropagation(){context.stopped=true;},preventDefault(){context.prevented=true;}},queueMicrotask(callback){callback();},editing:{},editorSel:0,editorSelection:{clear(){context.selectionCleared=true;}},renderEditorElements(){},drawEditorCanvas(){}};
  vm.createContext(context);vm.runInContext(`(${handlerSource})(event)`,context);return context;
}

test('Escape in inline canvas text editing cancels the edit, closes the editor, and clears selection',async()=>{
  const state=textEditorKeydown();assert.equal(state.cancelled,true);assert.equal(state.blurred,true);assert.equal(state.prevented,true);assert.equal(state.stopped,true);await new Promise(resolve=>setImmediate(resolve));assert.equal(state.selectionCleared,true);
});

test('clicking outside the text object commits inline editing',()=>{
  const source=fs.readFileSync(require.resolve('../gui/renderer.js'),'utf8');
  const start=source.indexOf('const finishOnOutsideClick=event=>',source.indexOf('function focusTextProperty('));
  const end=source.indexOf(';window.addEventListener(\'pointerdown\',finishOnOutsideClick,true)',start);
  assert.ok(start>=0&&end>start,'inline editor registers outside-click dismissal');
  const handlerSource=source.slice(start,end).replace(/^const finishOnOutsideClick=/,'').replace(/;$/,'');
  const state={blurred:false,prevented:false,input:{contains:()=>false,selectionStart:0,selectionEnd:0,blur(){state.blurred=true;}},event:{target:{closest:()=>null},preventDefault(){state.prevented=true;}}};
  const context={input:state.input,event:state.event,index:0,canvasTextCaretForResize:()=>null,pendingCanvasResizeCaret:null,cancelled:false};vm.createContext(context);vm.runInContext(`(${handlerSource})(event)`,context);
  assert.equal(state.blurred,true);
  assert.equal(context.cancelled,false,'outside click commits rather than rolls back');
  assert.equal(context.pendingCanvasResizeCaret,null,'outside click does not preserve a resize caret');
});

test('clicking a text resize handle keeps editing active and restores the caret after resize',()=>{
  const source=fs.readFileSync(require.resolve('../gui/renderer.js'),'utf8');
  const start=source.indexOf('const finishOnOutsideClick=event=>',source.indexOf('function focusTextProperty('));
  const end=source.indexOf(';window.addEventListener(\'pointerdown\',finishOnOutsideClick,true)',start);
  const handlerSource=source.slice(start,end).replace(/^const finishOnOutsideClick=/,'').replace(/;$/,'');
  const target={closest:()=>({dataset:{handle:'se'}})},input={contains:()=>false,selectionStart:2,selectionEnd:2,blur(){state.blurred=true;}},state={blurred:false};
  const context={input,event:{target},index:3,canvasTextCaretForResize:()=>2,pendingCanvasResizeCaret:null,cancelled:false};vm.createContext(context);vm.runInContext(`(${handlerSource})(event)`,context);
  assert.equal(context.cancelled,false);
  assert.deepEqual(JSON.parse(JSON.stringify(context.pendingCanvasResizeCaret)),{index:3,caret:2});
});
