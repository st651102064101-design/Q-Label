'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const Color=require('../gui/picture-color');

test('imported picture color data survives canvas capture and document JSON round trip',()=>{
  const image={type:'image',bitmap_width:1,bitmap_height:1,bitmap_hex:'80'};
  const canvas={toDataURL:mime=>{assert.equal(mime,'image/png');return 'data:image/png;base64,iVBORw0KGgo=';}};
  assert.equal(Color.capture(image,canvas),image);
  assert.equal(JSON.parse(JSON.stringify(image)).color_image_data,'data:image/png;base64,iVBORw0KGgo=');
});

test('design preview shows the original color image while print preview keeps monochrome bitmap',()=>{
  const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;
  w.ObjectData=require('../gui/object-data');
  w.LabelBitmap=require('../gui/bitmap');
  w.PictureColor=Color;
  w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
  const template={width_mm:20,height_mm:10,dpi:203,elements:[{type:'image',x_mm:2,y_mm:2,width_mm:8,height_mm:5,bitmap_width:8,bitmap_height:1,bitmap_hex:'80',color_image_data:'data:image/png;base64,iVBORw0KGgo='}]};
  const design=w.LabelPreview.renderPreviewSVG(template,{},[0],{});
  assert.match(design,/<image[^>]*data-color-picture="true"[^>]*href="data:image\/png;base64,iVBORw0KGgo="/);
  assert.doesNotMatch(design,/<rect x="2[^"]*fill="#000"/,'design preview uses the colored source instead of the monochrome print mask');
  const printed=w.LabelPreview.renderPreviewSVG(template,{},[0],{}, {mode:'print'});
  assert.doesNotMatch(printed,/data-color-picture/);
  assert.match(printed,/<rect[^>]*fill="#000"/,'print preview retains the monochrome bitmap');
  dom.window.close();
});

test('page background uses its color source on design pages and stays monochrome in print preview',()=>{
  const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;
  w.ObjectData=require('../gui/object-data');w.LabelBitmap=require('../gui/bitmap');w.PictureColor=Color;
  w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
  const template={width_mm:20,height_mm:10,dpi:203,background:{bitmap_width:8,bitmap_height:1,bitmap_hex:'80',color_image_data:'data:image/png;base64,iVBORw0KGgo='},elements:[]};
  assert.match(w.LabelPreview.renderPreviewSVG(template,{},[],{}),/data-color-picture="true"/);
  assert.doesNotMatch(w.LabelPreview.renderPreviewSVG(template,{},[],{}, {mode:'print'}),/data-color-picture/);
  dom.window.close();
});

test('Zebra output still reads the monochrome bitmap rather than embedded color data',()=>{
  const {buildZpl}=require('../lib/zpl');
  const template={width_mm:20,height_mm:10,dpi:203,elements:[{type:'image',x_mm:2,y_mm:2,width_mm:8,height_mm:5,bitmap_width:8,bitmap_height:1,bitmap_hex:'80',color_image_data:'data:image/png;base64,iVBORw0KGgo='}]};
  const zpl=buildZpl(template,[{}]).toString();
  assert.match(zpl,/\^GFA,/);
  assert.doesNotMatch(zpl,/data:image\/png;base64/);
});

test('color capture rejects a canvas that cannot provide a PNG data URL',()=>{
  assert.throws(()=>Color.capture({type:'image'},{toDataURL:()=> 'data:image/svg+xml,<svg/>'}),/PNG/);
});
