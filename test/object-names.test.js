'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const Names=require('../gui/object-names');

test('typed real names survive refresh while old generic defaults use the object type',()=>{
 const objects=[{type:'barcode128',label:'barcode 1'},{type:'text',label:'text 1'},{type:'image',label:'Logo'},{type:'text',label:'object 7'}];
 Names.normalizeDefaults(objects);
 assert.deepEqual(objects.map(item=>item.label),['barcode 1','text 1','Logo','text 2']);
 Names.normalizeDefaults(objects);
 assert.deepEqual(objects.map(item=>item.label),['barcode 1','text 1','Logo','text 2'],'normalizing twice does not change names');
});

test('new typed objects receive independent sequences and skip used names',()=>{
  const elements=[];
  assert.equal(Names.nextName(elements),'object 1');
  const first={type:'text'};Names.assign(first,elements);elements.push(first);assert.equal(first.label,'text 1');
  const barcode={type:'barcode128'};Names.assign(barcode,elements);elements.push(barcode);assert.equal(barcode.label,'barcode 1');
  const third={type:'qrcode'};Names.assign(third,elements);
  assert.equal(third.label,'barcode 2');
  const custom=[{label:'Logo'},{label:'object 1'}];
  assert.equal(Names.nextName(custom),'object 2');
});

test('typed copy names skip collisions and barcode pictures use barcode names',()=>{
  const items=[{type:'text',label:'text 1'},{type:'image',barcode_spec:{bcid:'code128'},label:'barcode 1'},{type:'image',label:'picture 1'}];
  const copies=structuredClone(items);Names.assignMany(copies,items);
  assert.deepEqual(copies.map(e=>e.label),['text 2','barcode 2','picture 2']);
  const saved=[{type:'text',label:'Text 27'},{type:'text',label:'Product Name'}];Names.normalizeDefaults(saved);
  assert.deepEqual(saved.map(e=>e.label),['Text 27','Product Name']);
  assert.equal(Names.firstConflict([...items,...copies]),null);
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
