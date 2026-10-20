'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

function openPictureProperties(){
  const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.mmToUnit=value=>Number(value);w.unitSuffix=()=> 'mm';w.measureUnit=()=> 'mm';w.measureDpi=()=>203;
  w.structuredClone=global.structuredClone;
  w.editing={width_mm:50,height_mm:30,dpi:203,data_sources:{},elements:[{type:'image',label:'art.svg',x_mm:2,y_mm:3,width_mm:20,height_mm:10,bitmap_width:2,bitmap_height:1,bitmap_hex:'80'}]};
  w.settings={};w.qrCache={};w.cancelTextClick=()=>{};w.readEditorIntoDraft=()=>{};w.sampleData=()=>({});w.ensureQR=async()=>{};w.qrValuesOf=()=>[];w.dmValuesOf=()=>[];
  w.LabelPreview={computeBoxes:()=>[{w:20,h:10}],renderPreviewSVG:()=>'<svg></svg>'};w.DataSourceEngine={resolve:()=>({})};w.ObjectData={resolve:()=>{}};
  w.pushSnapshot=()=>{};w.refreshEditorUI=()=>{};w.touchEditor=()=>{};w.updateUndoButtons=()=>{};w.persistEditor=async()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  w.eval(fs.readFileSync(require.resolve('../gui/object-properties'),'utf8'));
  w.openObjectProperties(0);
  [...w.document.querySelectorAll('#objectProperties nav button')].find(button=>button.textContent==='Picture').click();
  return {dom,w};
}

test('Picture Properties can replace artwork with SVG files',()=>{
  const {dom,w}=openPictureProperties();
  const input=w.document.querySelector('#objectProperties input[type=file]');
  assert.ok(input.accept.includes('image/svg+xml'));
  assert.ok(input.accept.includes('.svg'));
  assert.equal(input.getAttribute('aria-label'),'Replace picture (including SVG)');
  dom.window.close();
});

test('Picture Properties applies transparent background to the selected image',async()=>{
  const {dom,w}=openPictureProperties();
  const control=w.document.querySelector('#objectProperties [name=transparent_background]');
  assert.ok(control);
  control.checked=true;control.dispatchEvent(new w.Event('input',{bubbles:true}));

  await new Promise(resolve=>w.setTimeout(resolve,0));
  assert.equal(w.editing.elements[0].transparent_background,true);
  dom.window.close();
});

test('catalog barcode Properties exposes real sections and regenerates the barcode immediately',async()=>{
  const {dom,w}=openPictureProperties();
  w.document.querySelector('#objectProperties [data-action=cancel]').click();await new Promise(resolve=>w.setTimeout(resolve,0));
  const barcode=w.editing.elements[0];barcode.barcode_spec={bcid:'code128',text:'12345678',show_text:true};
  w.openObjectProperties(0);
  assert.equal(w.document.querySelector('#objectProperties header strong').textContent,'Barcode Properties');
  for(const name of ['Symbology and Size','Human Readable','Font','Text Format','Auto Fit','Data Sources'])assert.ok([...w.document.querySelectorAll('#objectProperties nav button')].some(button=>button.textContent===name),name+' section is available');
  let encodedSpec;w.zebra={barcodeEncode:async spec=>(encodedSpec=spec,{ok:true,bitmap_width:120,bitmap_height:48,bitmap_hex:'AABB'})};
  w.DataSourceEngine={resolve:()=>({})};w.ObjectData={resolve:()=>{}};
  [...w.document.querySelectorAll('#objectProperties nav button')].find(button=>button.textContent==='Human Readable').click();
  w.document.querySelector('#objectProperties [name="barcode_spec.text"]').value='87654321';
  w.document.querySelector('#objectProperties [name="barcode_spec.text"]').dispatchEvent(new w.Event('input',{bubbles:true}));

  await new Promise(resolve=>w.setTimeout(resolve,0));
  assert.equal(encodedSpec.text,'87654321');
  assert.equal(w.editing.elements[0].bitmap_width,120);
  assert.equal(w.editing.elements[0].bitmap_hex,'AABB');
  dom.window.close();
});

test('catalog barcode Font controls change saved typography and expose the BarTender-style tabs',async()=>{
  const {dom,w}=openPictureProperties();w.document.querySelector('#objectProperties [data-action=cancel]').click();await new Promise(resolve=>w.setTimeout(resolve,0));
  const barcode=w.editing.elements[0];barcode.barcode_spec={bcid:'code128',text:'12345678',show_text:true};barcode.font_family='Arial';
  w.zebra={barcodeEncode:async()=>({ok:true,bitmap_width:120,bitmap_height:48,bitmap_hex:'AABB'})};w.DataSourceEngine={resolve:()=>({})};w.ObjectData={resolve:()=>{}};
  w.openObjectProperties(0);[...w.document.querySelectorAll('#objectProperties nav button')].find(button=>button.textContent==='Font').click();
  for(const name of ['Style','Underline','Strikethrough','Outline','Width','Advanced'])assert.ok([...w.document.querySelectorAll('.op-font-tabs button')].some(button=>button.textContent===name),`${name} tab exists`);
  const list=caption=>w.document.querySelector(`.op-font-lists [aria-label="${caption}"]`);
  list('Typeface').value='Bahnschrift';list('Typeface').dispatchEvent(new w.Event('change',{bubbles:true}));
  list('Font Style').value='Bold Italic';list('Font Style').dispatchEvent(new w.Event('change',{bubbles:true}));
  list('Point Size').value='18';list('Point Size').dispatchEvent(new w.Event('change',{bubbles:true}));
  [...w.document.querySelectorAll('.op-font-tabs button')].find(button=>button.textContent==='Underline').click();const underline=w.document.querySelector('#objectProperties [name=underline]');underline.checked=true;underline.dispatchEvent(new w.Event('input',{bubbles:true}));
  [...w.document.querySelectorAll('.op-font-tabs button')].find(button=>button.textContent==='Outline').click();const outline=w.document.querySelector('#objectProperties [name=text_outline]');outline.checked=true;outline.dispatchEvent(new w.Event('input',{bubbles:true}));
  [...w.document.querySelectorAll('.op-font-tabs button')].find(button=>button.textContent==='Width').click();const width=w.document.querySelector('#objectProperties [name=text_width_percent]');width.value='125';width.dispatchEvent(new w.Event('input',{bubbles:true}));
  [...w.document.querySelectorAll('.op-font-tabs button')].find(button=>button.textContent==='Advanced').click();const caps=w.document.querySelector('#objectProperties [name=small_caps]');caps.checked=true;caps.dispatchEvent(new w.Event('input',{bubbles:true}));
  await new Promise(resolve=>w.setTimeout(resolve,0));
  const saved=w.editing.elements[0];assert.equal(saved.font_family,'Bahnschrift');assert.equal(saved.font_size_pt,18);assert.equal(saved.bold,true);assert.equal(saved.italic,true);assert.equal(saved.underline,true);assert.equal(saved.text_outline,true);assert.equal(saved.text_width_percent,125);assert.equal(saved.small_caps,true);
  dom.window.close();
});
