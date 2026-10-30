'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

function previewWindow(){
  const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;
  for(const file of ['object-data','bitmap','preview'])w.eval(fs.readFileSync(require.resolve(`../gui/${file}`),'utf8'));
  return {dom,w};
}

test('picture placeholder uses the same non-scaling thin strokes before and during resize',()=>{
  const {dom,w}=previewWindow();
  for(const size of [12,40]){
    const template={width_mm:80,height_mm:80,dpi:203,elements:[{type:'image',placeholder:true,x_mm:5,y_mm:5,width_mm:size,height_mm:size*.75}]};
    const host=w.document.createElement('div');host.innerHTML=w.LabelPreview.renderPreviewSVG(template,{},[0],{}, {editorPlaceholders:true});
    const shapes=host.querySelectorAll('[data-label-element="0"] rect, [data-label-element="0"] circle, [data-label-element="0"] path');
    assert.equal(shapes.length,3);
    for(const shape of shapes)assert.equal(shape.getAttribute('vector-effect'),'non-scaling-stroke','placeholder stroke stays thin without a resize gesture');
  }
  dom.window.close();
});

test('editor preview replaces a malformed saved image with a recoverable placeholder and preserves its geometry',()=>{
  const {dom,w}=previewWindow(),template={width_mm:50,height_mm:30,dpi:203,elements:[{type:'image',label:'Damaged logo',x_mm:4,y_mm:6,width_mm:20,height_mm:12,bitmap_width:8,bitmap_height:2,bitmap_hex:'ff'}]};
  const svg=w.LabelPreview.renderPreviewSVG(template,{},[0],{}, {editorPlaceholders:true});
  assert.match(svg,/data-invalid-bitmap="true"/);
  assert.match(svg,/Invalid image bitmap\. Replace or remove this image\./);
  assert.match(svg,/<rect[^>]*x="4\.33"[^>]*y="6\.33"[^>]*width="19\.34"[^>]*height="11\.34"/);
  assert.equal(template.elements[0].bitmap_hex,'ff','drawing a placeholder does not mutate or discard recoverable project data');
  assert.throws(()=>w.LabelPreview.renderPreviewSVG(template,{},[0],{},{}),/Invalid image bitmap/,'non-editor output still refuses corrupt bitmap data');
  dom.window.close();
});

test('editor preview tolerates a malformed saved background bitmap without blocking the label',()=>{
  const {dom,w}=previewWindow(),template={width_mm:50,height_mm:30,dpi:203,background:{bitmap_width:10,bitmap_height:10,bitmap_hex:'bad'},elements:[{type:'box',x_mm:3,y_mm:4,width_mm:8,height_mm:5}]};
  const svg=w.LabelPreview.renderPreviewSVG(template,{},[0],{}, {editorPlaceholders:true});
  assert.match(svg,/data-invalid-bitmap="true"/);
  assert.match(svg,/data-label-element="0"/,'other artwork still renders');
  assert.equal(template.background.bitmap_hex,'bad','the original background stays available for replacement/removal');
  assert.throws(()=>w.LabelPreview.renderPreviewSVG(template,{},[0],{},{}),/Invalid image bitmap/);
  dom.window.close();
});

test('bitmap validator matches raster decoder limits and expected row-byte encoding',()=>{
  const bitmap=require('../gui/bitmap');
  for(const element of [
    {bitmap_width:8,bitmap_height:2,bitmap_hex:'ff00'},
    {bitmap_width:9,bitmap_height:1,bitmap_hex:'ff80'},
  ])assert.equal(bitmap.isValidRaster(element),true);
  for(const element of [
    {bitmap_width:8,bitmap_height:1,bitmap_hex:'f'},
    {bitmap_width:8,bitmap_height:1,bitmap_hex:'gg'},
    {bitmap_width:8193,bitmap_height:1,bitmap_hex:'00'},
    {bitmap_width:1,bitmap_height:0,bitmap_hex:'00'},
  ])assert.equal(bitmap.isValidRaster(element),false);
  assert.throws(()=>bitmap.raster({bitmap_width:8,bitmap_height:1,bitmap_hex:'f'},8,1),/Invalid image bitmap/);
});

test('print history thumbnail tolerates saved images missing their bitmap without blocking startup',()=>{
  const {dom,w}=previewWindow(),renderer=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
  w.qrCache={};
  w.eval(renderer.slice(renderer.indexOf('function historyPreviewTemplate('),renderer.indexOf('async function captureHistoryPreview(')));
  const entry={payload:{template:{width_mm:50,height_mm:30,dpi:203,elements:[{type:'image',x_mm:3,y_mm:4,width_mm:12,height_mm:8},{type:'box',x_mm:20,y_mm:5,width_mm:8,height_mm:6}]}}};
  const svg=w.liveHistorySvg(entry);
  assert.match(svg,/data-invalid-bitmap="true"/);
  assert.match(svg,/data-label-element="1"/);
  assert.equal(entry.payload.template.elements[0].bitmap_hex,undefined);
  dom.window.close();
});
