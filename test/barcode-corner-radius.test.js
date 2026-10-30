'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { isBarcodeElement, catalogBarHeightMm, catalogHriTextSpec } = require('../gui/barcode-element');

function previewWindow() {
  const dom = new JSDOM('<body></body>', { runScripts: 'outside-only' });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: text => ({ width: String(text).length * 5, actualBoundingBoxDescent: 2 }) });
  w.ObjectData = require('../gui/object-data');
  w.Barcode = require('../gui/barcode');
  Object.assign(w, { isBarcodeElement, catalogBarHeightMm, catalogHriGapMm: require('../gui/barcode-element').catalogHriGapMm, catalogHriOffsetMm: require('../gui/barcode-element').catalogHriOffsetMm, catalogHriTextSpec });
  w.eval(fs.readFileSync(require.resolve('../gui/preview'), 'utf8'));
  return { dom, w };
}

test('isBarcodeElement covers linear and catalog barcodes', () => {
  assert.equal(isBarcodeElement({ type: 'barcode128' }), true);
  assert.equal(isBarcodeElement({ type: 'image', barcode_spec: { bcid: 'code128' } }), true);
  assert.equal(isBarcodeElement({ type: 'image' }), false);
  assert.equal(isBarcodeElement({ type: 'box' }), false);
});

test('catalog HRI text spec ignores object text box height that would overlap bars', () => {
  const spec = catalogHriTextSpec({
    type: 'image',
    width_mm: 40,
    text_box_height_mm: 25,
    vertical_align: 'bottom',
    font_family: 'Arial',
    hri_align: 'center',
  }, 40);
  assert.equal(spec.text_box_height_mm, 0);
  assert.equal(spec.vertical_align, 'top');
  assert.equal(spec.text_box_width_mm, 40);
});

test('catalog bar height prefers bars-only bitmap over stale height_mm', () => {
  assert.ok(Math.abs(catalogBarHeightMm({
    type: 'image',
    width_mm: 40,
    height_mm: 8,
    barcode_bars: { bitmap_width: 80, bitmap_height: 20 },
  }, 40) - 10) < 0.01);
});

test('linear barcode corner radius clips preview SVG like pictures', () => {
  const { dom, w } = previewWindow();
  const template = {
    width_mm: 50,
    height_mm: 30,
    dpi: 203,
    margin_mm: { left: 0, top: 0 },
    elements: [{
      type: 'barcode128',
      x_mm: 5,
      y_mm: 5,
      width_mm: 30,
      bar_height_mm: 10,
      module_width: 2,
      show_text: true,
      text: '12345678',
      corner_radius_mm: 4,
    }],
  };
  const svg = w.LabelPreview.renderPreviewSVG(template, {}, null, {});
  assert.match(svg, /image-corner-clip-0/);
  assert.match(svg, /clip-path="url\(#image-corner-clip-0\)"/);
  dom.window.close();
});

test('barcode clipping rounds all four corners of the bars while preserving readable text', () => {
  const { dom, w } = previewWindow();
  const template={width_mm:70,height_mm:40,dpi:203,elements:[{type:'barcode128',x_mm:5,y_mm:5,bar_height_mm:10,module_width:2,show_text:true,text:'12345678',corner_radius_mm:4}]};
  const svg=w.LabelPreview.renderPreviewSVG(template,{},null,{mode:'print'}),parsed=new w.DOMParser().parseFromString(svg,'image/svg+xml');
  const clip=parsed.querySelector('#image-corner-clip-0'),regions=[...clip.querySelectorAll('rect')];
  assert.equal(regions.length,2,'bar and HRI areas need separate clip regions');assert.equal(Number(regions[0].getAttribute('height')),10,'bottom corners are at the end of the bars, not the HRI');assert.equal(Number(regions[0].getAttribute('rx')),4);
  assert.equal(Number(regions[1].getAttribute('y')),15,'readable text region begins after the bars');assert.ok(Number(regions[1].getAttribute('height'))>0);assert.ok(parsed.querySelector('[data-barcode-hri="true"]'),'readable text is retained');
  dom.window.close();
});

test('barcode without readable text clips exactly the bar area and zero radius disables clipping',()=>{
  const {dom,w}=previewWindow(),el={type:'barcode128',x_mm:1,y_mm:2,bar_height_mm:12,module_width:2,show_text:false,text:'123',corner_radius_mm:3},template={width_mm:70,height_mm:40,dpi:203,elements:[el]};
  let doc=new w.DOMParser().parseFromString(w.LabelPreview.renderPreviewSVG(template,{},null,{}),'image/svg+xml');assert.equal(doc.querySelectorAll('#image-corner-clip-0 rect').length,1);assert.equal(Number(doc.querySelector('#image-corner-clip-0 rect').getAttribute('height')),12);
  el.corner_radius_mm=0;doc=new w.DOMParser().parseFromString(w.LabelPreview.renderPreviewSVG(template,{},null,{}),'image/svg+xml');assert.equal(doc.querySelector('#image-corner-clip-0'),null);dom.window.close();
});
test('canvas raster uses the bar height for rounded clipping and keeps a separate HRI area',()=>{
  const {dom,w}=previewWindow(),ops=[],context=new Proxy({measureText:text=>({width:String(text).length*5,actualBoundingBoxDescent:2}),roundRect:(...args)=>ops.push(['roundRect',...args]),rect:(...args)=>ops.push(['rect',...args])},{get:(o,k)=>k in o?o[k]:()=>{}});
  w.HTMLCanvasElement.prototype.getContext=()=>context;
  const template={width_mm:70,height_mm:40,dpi:254,elements:[{type:'barcode128',x_mm:5,y_mm:5,bar_height_mm:10,module_width:2,show_text:true,text:'12345678',corner_radius_mm:4}]};w.LabelPreview.rasterizeCanvas(template,{},null,{});
  const rounded=ops.find(x=>x[0]==='roundRect');assert.ok(rounded);assert.equal(rounded[4],100,'bar clip height is 10 mm at 254 dpi');assert.ok(ops.some(x=>x[0]==='rect'&&x[2]===150&&x[4]>0),'HRI has an unclipped rectangular region below bars');dom.window.close();
});
test('catalog barcode with separate HRI rounds the bars, not the entire object',()=>{
  const {dom,w}=previewWindow();w.LabelBitmap=require('../gui/bitmap');
  const el={type:'image',x_mm:2,y_mm:3,width_mm:40,height_mm:15,font_family:'Arial',font_size_pt:9,barcode_spec:{bcid:'code128',show_text:true,text:'123'},barcode_bars:{bitmap_width:8,bitmap_height:2,bitmap_hex:'FFFF'},bitmap_width:8,bitmap_height:2,bitmap_hex:'FFFF',corner_radius_mm:3};
  const doc=new w.DOMParser().parseFromString(w.LabelPreview.renderPreviewSVG({width_mm:80,height_mm:60,dpi:203,elements:[el]},{}),'image/svg+xml'),regions=[...doc.querySelectorAll('#image-corner-clip-0 rect')];
  assert.equal(regions.length,2);assert.equal(Number(regions[0].getAttribute('height')),10);assert.equal(Number(regions[0].getAttribute('rx')),3);assert.equal(Number(regions[1].getAttribute('y')),13);assert.ok(doc.querySelector('[data-barcode-hri="true"]'));dom.window.close();
});
