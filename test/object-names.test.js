'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const Names=require('../gui/object-names');

test('legacy typed default names migrate to a single object sequence while custom names remain',()=>{
 const objects=[{type:'barcode128',label:'barcode 1'},{type:'text',label:'text 1'},{type:'image',label:'Logo'},{type:'text',label:'object 7'}];
 Names.normalizeDefaults(objects);
 assert.deepEqual(objects.map(item=>item.label),['object 1','object 2','Logo','object 3']);
 Names.normalizeDefaults(objects);
 assert.deepEqual(objects.map(item=>item.label),['object 1','object 2','Logo','object 3'],'normalizing twice does not change names');
});

test('new objects get object 1, 2, 3 and skip used numbers',()=>{
  const elements=[];
  assert.equal(Names.nextName(elements),'object 1');
  Names.assign({type:'text'},elements);elements.push({label:'object 1'});
  Names.assign({type:'barcode128'},elements);elements.push({label:'object 2'});
  const third={type:'qrcode'};Names.assign(third,elements);
  assert.equal(third.label,'object 3');
  const custom=[{label:'Logo'},{label:'object 1'}];
  assert.equal(Names.nextName(custom),'object 2');
});

test('delete recounts remaining sequential names and leaves custom names',()=>{
  const elements=[{label:'object 1'},{label:'Logo'},{label:'object 3'},{label:'object 4'}];
  elements.splice(0,1);
  Names.compactSequential(elements);
  assert.deepEqual(elements.map(item=>item.label),['Logo','object 1','object 2']);
  const numbered=[{label:'object 1'},{label:'object 2'},{label:'object 3'}];
  numbered.splice(1,1);
  Names.compactSequential(numbered);
  assert.deepEqual(numbered.map(item=>item.label),['object 1','object 2']);
});

test('duplicate and empty names are rejected, including case and spacing',()=>{
  const elements=[{label:'object 1'},{label:'Second'}];
  const duplicate=Names.validateName('Object  1',elements,1);
  assert.equal(duplicate.ok,false);
  assert.equal(duplicate.code,'duplicate');
  assert.match(duplicate.message,/The name 'Object 1' is already in use or reserved/);
  assert.equal(Names.validateName('Second',elements,1).ok,true);
  assert.equal(Names.validateName('   ',elements,0).ok,false);
  assert.equal(Names.firstConflict([{label:'object 1'},{label:'object 1'}]).code,'duplicate');
});

test('paste copies receive the next free object names',()=>{
  const existing=[{label:'object 1'},{label:'object 2'}];
  const copies=[{label:'object 1'},{label:'object 2'}];
  Names.assignMany(copies,existing);
  assert.deepEqual(copies.map(item=>item.label),['object 3','object 4']);
  assert.deepEqual(existing.map(item=>item.label),['object 1','object 2']);
});

test('renderer delete recounts remaining object names from 1',()=>{
  const source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
  const context={window:{ObjectNames:Names},editing:{elements:[{label:'object 1'},{label:'object 2'},{label:'object 3'}]},editorSelection:new Set([1]),editorSel:1,readEditorIntoDraft(){},pushSnapshot(){},refreshEditorUI(){},updateUndoButtons(){},touchEditor(){}};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function deleteSelectedElement('),source.indexOf('function replaceTemplateText(')),context);
  assert.equal(context.deleteSelectedElement(),true);
  assert.deepEqual(context.editing.elements.map(item=>item.label),['object 1','object 2']);
});

test('duplicate-name alert is a modern dialog, not a native window',()=>{
  const dom=new JSDOM('<body></body>');
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const dialog=Names.showAlert(dom.window.document,'Text 1');
  assert.equal(dialog.className,'modern-name-alert');
  assert.equal(dialog.getAttribute('role'),'alertdialog');
  assert.equal(dialog.querySelector('#modern-name-alert-title').textContent,'Object name');
  assert.equal(dialog.querySelector('#modern-name-alert-message').textContent,"The name 'Text 1' is already in use or reserved.");
  assert.ok(dialog.querySelector('svg'),'uses an SVG error icon instead of a system bitmap');
  assert.match(dialog.style.cssText,/border-radius:\s*16px/);
  assert.equal(dialog.querySelector('[data-alert-ok]').textContent,'OK');
  dialog.querySelector('[data-alert-ok]').click();
  assert.equal(dom.window.document.querySelector('.modern-name-alert'),null);
  dom.window.close();
});
