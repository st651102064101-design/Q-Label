'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const Names=require('../gui/object-names');
test('legacy global names migrate to type names and never return after refresh/save/reopen',()=>{
 const objects=[{type:'barcode128',label:'object 1'},{type:'text',label:'object 2'},{type:'image',label:'Logo'},{type:'text',label:'Text 7'}];
 for(let i=0;i<5;i++){Names.normalizeDefaults(objects);assert.deepEqual(objects.map(e=>e.label),['barcode 1','text 1','Logo','text 2']);objects.splice(0,objects.length,...JSON.parse(JSON.stringify(objects)));}
});
test('duplicate generated imports are repaired within their own type',()=>{
 const objects=[{type:'text',label:'text 1'},{type:'text',label:'Text 1'},{type:'code39',label:'object 1'}];Names.normalizeDefaults(objects);
 assert.deepEqual(objects.map(e=>e.label),['text 1','text 2','barcode 1']);assert.equal(Names.firstConflict(objects),null);
});
test('all barcode encodings share barcode numbering; other kinds count independently',()=>{
 const objects=[];for(const type of ['text','barcode128','qrcode','code39','code93','ean13','datamatrix','text','image','line','rectangle','ellipse']){const e={type};Names.assign(e,objects);objects.push(e);}
 assert.deepEqual(objects.map(e=>e.label),['text 1','barcode 1','barcode 2','barcode 3','barcode 4','barcode 5','barcode 6','text 2','picture 1','line 1','rectangle 1','ellipse 1']);
 const catalog={type:'image',barcode_spec:{bcid:'code128'}};Names.assign(catalog,objects);assert.equal(catalog.label,'barcode 7');
 const table={type:'image',table_model:{}};Names.assign(table,objects);assert.equal(table.label,'table 1');
 const shape={type:'image',shape_preset:'roundRect'};Names.assign(shape,objects);assert.equal(shape.label,'round rect 1');
 const symbol={type:'text',symbol_font:'Wingdings'};Names.assign(symbol,objects);assert.equal(symbol.label,'symbol 1');
});
test('copy and paste allocate unique names per type without renaming originals',()=>{
 const items=[{type:'text',label:'text 1'},{type:'image',barcode_spec:{bcid:'code128'},label:'barcode 1'},{type:'image',label:'picture 1'}],copies=structuredClone(items);Names.assignMany(copies,items);
 assert.deepEqual(copies.map(e=>e.label),['text 2','barcode 2','picture 2']);assert.deepEqual(items.map(e=>e.label),['text 1','barcode 1','picture 1']);assert.equal(Names.firstConflict([...items,...copies]),null);
});
test('delete compacts only its own kind and new insertion reuses available number',()=>{
 const elements=[{type:'text',label:'text 1'},{type:'barcode128',label:'barcode 1'},{type:'text',label:'text 2'},{type:'image',label:'Logo'}];elements.splice(0,1);Names.compactSequential(elements);
 assert.deepEqual(elements.map(e=>e.label),['barcode 1','text 1','Logo']);const e={type:'text'};Names.assign(e,elements);assert.equal(e.label,'text 2');
});
test('custom labels survive and duplicate/empty/case-normalized names remain rejected',()=>{
 const elements=[{type:'text',label:'Product Name'},{type:'image',label:'Logo'},{type:'text',label:'text 1'}];Names.normalizeDefaults(elements);assert.deepEqual(elements.map(e=>e.label),['Product Name','Logo','text 1']);
 assert.equal(Names.validateName('Text  1',elements,0).ok,false);assert.equal(Names.validateName('Logo',elements,1).ok,true);assert.equal(Names.validateName(' ',elements,0).ok,false);
});
test('renderer deletion uses typed numbering after repeated refreshes',()=>{
 const source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8'),context={window:{ObjectNames:Names},editing:{elements:[{type:'text',label:'text 1'},{type:'text',label:'text 2'},{type:'barcode128',label:'barcode 1'}]},editorSelection:new Set([0]),editorSel:0,readEditorIntoDraft(){},pushSnapshot(){},refreshEditorUI(){Names.normalizeDefaults(context.editing.elements);},updateUndoButtons(){},touchEditor(){}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function deleteSelectedElement('),source.indexOf('function replaceTemplateText(')),context);assert.equal(context.deleteSelectedElement(),true);assert.deepEqual(context.editing.elements.map(e=>e.label),['text 1','barcode 1']);
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

test('imported duplicate custom names remain rejected across different object types',()=>{
 const elements=[{type:'text',label:'Product Name'},{type:'barcode128',label:'product  name'}];Names.normalizeDefaults(elements);
 assert.equal(Names.firstConflict(elements).code,'duplicate');assert.equal(Names.firstConflict([{type:'text',label:''}]).code,'reserved');
});
