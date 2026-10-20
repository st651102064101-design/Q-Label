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
  assert.match(source,/ObjectValueTree\.bind\(host,selectElement\)/);
  assert.match(source,/if\(source\?\.matches\('\.source-item\[data-object-value-index\]'\)\)return/);
  assert.match(source,/ObjectValueTree\?\.setSelected\(el\('sidebarDataFields'\),i\)/);
});
