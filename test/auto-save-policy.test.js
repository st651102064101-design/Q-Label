'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {create}=require('../gui/auto-save-policy');

function harness({saveSettings=async patch=>patch}={}){
  let next=1;const pending=new Map(),saved=[];
  const controller=create({save:()=>saved.push('save'),saveSettings,setTimeoutFn:(fn,delay)=>{const id=next++;pending.set(id,{fn,delay});return id;},clearTimeoutFn:id=>pending.delete(id)});
  return {controller,pending,saved,flush(delay){for(const [id,timer] of [...pending])if(delay===undefined||timer.delay===delay){pending.delete(id);timer.fn();}}};
}

test('automatic saving debounces edits, while manual mode cancels and blocks pending saves',async()=>{
  const state=harness();state.controller.configure(true);state.controller.markDirty();state.controller.markDirty();
  assert.equal(state.pending.size,1);assert.equal([...state.pending.values()][0].delay,400);
  await state.controller.setEnabled(false);
  assert.equal(state.controller.enabled,false);assert.equal(state.pending.size,0);
  state.controller.markDirty();assert.equal(state.pending.size,0);
  state.flush();assert.deepEqual(state.saved,[]);
});

test('a first-run preference defaults to manual saving until Auto Save is explicitly enabled',()=>{
  const state=harness();
  assert.equal(state.controller.configure(undefined),false);
  state.controller.markDirty();state.flush();
  assert.deepEqual(state.saved,[]);
});

test('turning Auto Save on with unsaved edits schedules an immediate save and persists the preference',async()=>{
  const patches=[],state=harness({saveSettings:async patch=>{patches.push(patch);}});
  state.controller.configure(false);
  await state.controller.setEnabled(true,{dirty:true});
  assert.equal(state.controller.enabled,true);assert.deepEqual(patches,[{autoSaveEnabled:true}]);
  assert.equal([...state.pending.values()][0].delay,0);state.flush(0);assert.deepEqual(state.saved,['save']);
});

test('System Settings checkbox reflects the preference and applies changes to the save policy',async()=>{
  const dom=new JSDOM('<!doctype html><input type="checkbox" id="auto">');
  const input=dom.window.document.querySelector('#auto'),patches=[],state=harness({saveSettings:async patch=>patches.push(patch)});
  state.controller.configure(false);let dirty=false;
  state.controller.bindCheckbox(input,()=>dirty);
  assert.equal(input.checked,false);
  dirty=true;input.checked=true;input.dispatchEvent(new dom.window.Event('change'));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state.controller.enabled,true);assert.deepEqual(patches,[{autoSaveEnabled:true}]);
  assert.equal([...state.pending.values()][0].delay,0);
  dom.window.close();
});

test('failed settings persistence restores the checkbox and previous save mode',async()=>{
  const dom=new JSDOM('<!doctype html><input type="checkbox" id="auto">');
  const input=dom.window.document.querySelector('#auto'),state=harness({saveSettings:async()=>{throw Error('disk full');}});
  state.controller.configure(false);let message='';state.controller.bindCheckbox(input,()=>false,error=>message=error.message);
  input.checked=true;input.dispatchEvent(new dom.window.Event('change'));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state.controller.enabled,false);assert.equal(input.checked,false);assert.equal(message,'disk full');
  dom.window.close();
});
