'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),Tree=require('../gui/object-value-tree');

test('Object Values rows use type-specific SVGs and click to select their canvas object',()=>{
  const dom=new JSDOM('<details class="source-group" data-group="Object Values"><summary>Object Values</summary><button class="source-item" data-source-field="object.0">Text 1</button><button class="source-item" data-source-field="object.1">Barcode 1</button></details>'),host=dom.window.document.body;
  const elements=[{type:'text',label:'Text 1'},{type:'barcode128',label:'Barcode 1'}],selected=[];
  Tree.bind(host,index=>selected.push(index));Tree.decorate(host,elements,-1);
  const rows=[...host.querySelectorAll('[data-object-value-index]')];
  assert.deepEqual(rows.map(row=>row.dataset.objectValueType),['text','barcode']);
  assert.ok(rows.every(row=>row.querySelector(':scope > svg[data-object-icon]')),'every object row has a visible SVG icon');
  assert.notEqual(rows[0].querySelector('svg').innerHTML,rows[1].querySelector('svg').innerHTML,'icons identify different object types');
  assert.deepEqual(rows.map(row=>row.textContent),['Text 1','Barcode 1'],'object names remain the row labels');
  assert.ok(rows.every(row=>row.draggable),'object values remain available for drag-to-bind');
  rows[1].click();assert.deepEqual(selected,[1]);
  host.querySelector('summary').click();assert.deepEqual(selected,[1],'category header only expands or collapses');
  Tree.setSelected(host,0);assert.equal(rows[0].getAttribute('aria-current'),'true');assert.equal(rows[1].hasAttribute('aria-current'),false);
  dom.window.close();
});

test('icon kinds cover text, linear and matrix barcodes, pictures, tables, and shapes',()=>{
  const cases=[['text','text'],['barcode128','barcode'],['qrcode','qr'],['datamatrix','datamatrix'],['image','picture'],['table','table'],['rectangle','shape'],['line','line']];
  for(const [type,expected]of cases)assert.equal(Tree.kind({type}),expected);
  assert.equal(Tree.kind({type:'image',barcode_spec:{bcid:'qrcode'}}),'qr');
});

test('renderer connects sidebar rows to selection and keeps object clicks out of insert placement',()=>{
  const fs=require('node:fs'),source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
  assert.match(source,/ObjectValueTree\.bind\(host,selectElement,/);
  assert.match(source,/if\(source\?\.matches\('\.source-item\[data-object-value-index\]'\)\)return/);
  assert.match(source,/ObjectValueTree\?\.setSelected\(el\('sidebarDataFields'\),i\)/);
});


test('Object Values context and keyboard menus route properties/delete to the selected object only',()=>{
 const dom=new JSDOM('<details class="source-group" data-group="Object Values"><summary>Object Values</summary><button class="source-item" data-source-field="object.0">Barcode 1</button><button class="source-item" data-source-field="object.1">Barcode 2</button></details>'),host=dom.window.document.body,calls=[];
 Tree.decorate(host,[{type:'barcode128'},{type:'barcode128'}]);Tree.bind(host,i=>calls.push(['select',i]),{properties:i=>calls.push(['properties',i]),remove:i=>calls.push(['delete',i])});const row=host.querySelector('[data-object-value-index="1"]');
 row.oncontextmenu=()=>{throw Error('old source menu must not intercept object menu');};
 row.dispatchEvent(new dom.window.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:30,clientY:40}));assert.ok(host.querySelector('.object-value-menu'));host.querySelector('[data-action="properties"]').click();assert.deepEqual(calls,[['select',1],['properties',1]]);
 row.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'F10',shiftKey:true,bubbles:true,cancelable:true}));host.querySelector('.object-value-menu [data-action="delete"]').click();assert.deepEqual(calls.at(-1),['delete',1]);assert.equal(host.querySelector('.object-value-menu'),null);
 row.dispatchEvent(new dom.window.MouseEvent('contextmenu',{bubbles:true,cancelable:true}));host.querySelector('.object-value-menu').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(host.querySelector('.object-value-menu'),null);assert.equal(dom.window.document.activeElement,row);dom.window.close();
});
