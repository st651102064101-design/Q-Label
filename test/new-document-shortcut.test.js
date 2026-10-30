'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const vm=require('node:vm');
const {isNewDocumentShortcut}=require('../lib/new-document-shortcut');

function harness(t){
  const dom=new JSDOM('<button id="newTemplateBtn">New</button><input id="field"><textarea id="cell"></textarea><select id="select"><option>A</option></select><div id="text" contenteditable="true"></div><button id="menu">File menu</button><dialog id="modal"></dialog>',{runScripts:'dangerously'});
  t.after(()=>dom.window.close());
  const w=dom.window;let opens=0,nativeNew;
  w.el=id=>w.document.getElementById(id);
  w.editing={elements:[]};w.editorSelection=new Set();w.editorSel=-1;
  w.ModalWindowStack={top:()=>w.document.querySelector('dialog[open]'),blocksEditorInput:event=>!!event?.target?.closest?.('dialog[open]')};
  w.zebra={onPrintShortcut:()=>{},onNewShortcut:callback=>{nativeNew=callback;}};
  w.document.getElementById('newTemplateBtn').onclick=()=>opens++;
  const renderer=fs.readFileSync(path.join(__dirname,'../gui/renderer.js'),'utf8');
  const start=renderer.indexOf('  const shortcutKey=');
  const end=renderer.indexOf("  el('addFieldMetaBtn')",start);
  assert.ok(start>=0&&end>start);
  w.eval(renderer.slice(start,end));
  function press(args={},target=w.document.body){
    target.focus();
    const event=new w.KeyboardEvent('keydown',{key:'n',code:'KeyN',ctrlKey:true,bubbles:true,cancelable:true,...args});
    target.dispatchEvent(event);return event;
  }
  return {w,press,opens:()=>opens,native:()=>nativeNew?.()};
}

for(const id of ['field','cell','select','text','menu'])test(`Ctrl+N opens New once when ${id} stops bubbling`,t=>{
  const h=harness(t),target=h.w.document.getElementById(id);
  target.addEventListener('keydown',event=>event.stopPropagation());
  assert.equal(h.press({},target).defaultPrevented,true);
  assert.equal(h.opens(),1);
});

test('Ctrl+N uses the physical N key with Thai layout, including on Home',t=>{
  const h=harness(t);h.w.editing=null;
  h.press({key:'ท',code:'KeyN'});assert.equal(h.opens(),1);
});

test('Ctrl/Cmd+N falls back to the character only when no physical code is available',t=>{
  const h=harness(t);
  h.press({key:'N',code:''});h.press({ctrlKey:false,metaKey:true});
  assert.equal(h.opens(),2);
});

test('shift, alt, another physical key, and a bare N do not create documents',t=>{
  const h=harness(t);
  for(const args of [{shiftKey:true},{altKey:true},{key:'n',code:'KeyM'},{ctrlKey:false}])h.press(args);
  assert.equal(h.opens(),0);
});

test('holding Ctrl+N does not reopen New after Cancel; a fresh keypress does',t=>{
  const h=harness(t);h.press();h.press({repeat:true});h.press({repeat:true});
  assert.equal(h.opens(),1);h.press();assert.equal(h.opens(),2);
});

test('an active modal keeps Ctrl+N from opening another document wizard',t=>{
  const h=harness(t);h.w.document.getElementById('modal').setAttribute('open','');
  h.press();h.native();assert.equal(h.opens(),0);
});

test('the native New shortcut reaches the same command with focus in an editor',t=>{
  const h=harness(t);h.w.document.getElementById('cell').focus();
  h.native();assert.equal(h.opens(),1);
});

test('native New matches the physical key and consumes repeats without matching other chords',()=>{
  const input={type:'keyDown',control:true,key:'ท',code:'KeyN'};
  assert.equal(isNewDocumentShortcut(input),true);
  assert.equal(isNewDocumentShortcut({...input,isAutoRepeat:true}),true);
  assert.equal(isNewDocumentShortcut({...input,control:false,meta:true}),true);
  assert.equal(isNewDocumentShortcut({...input,code:'',key:'N'}),true);
  for(const changed of [{type:'keyUp'},{control:false},{alt:true},{shift:true},{code:'KeyM'},{code:'',key:'m'}])assert.equal(isNewDocumentShortcut({...input,...changed}),false);
});

test('preload delivers one native New notification and can unsubscribe it',()=>{
  const listeners=new Map();let bridge,called=0;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../gui/preload.js'),'utf8'),{require:()=>({
    contextBridge:{exposeInMainWorld:(_name,api)=>{bridge=api;}},
    ipcRenderer:{sendSync:()=>false,on:(name,listener)=>listeners.set(name,listener),removeListener:(name,listener)=>{if(listeners.get(name)===listener)listeners.delete(name);}}
  })});
  const unsubscribe=bridge.onNewShortcut(()=>called++);
  listeners.get('shortcut-new')({sender:'ignored'});assert.equal(called,1);
  unsubscribe();assert.equal(listeners.has('shortcut-new'),false);
});
