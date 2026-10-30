'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

function preview(){
  const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.ObjectData=require('../gui/object-data');
  w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:value=>({width:String(value).length*6,actualBoundingBoxAscent:8,actualBoundingBoxDescent:2})});
  w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
  return {dom,w};
}

test('inverse object color-inverts later overlapping artwork inside its area',()=>{
  const {dom,w}=preview();
  const template={width_mm:50,height_mm:30,dpi:203,elements:[
    {type:'text',text:'Before',x_mm:4,y_mm:5,font_family:'Arial',font_size_pt:12,text_box_width_mm:20},
    {type:'inverse',x_mm:8,y_mm:4,width_mm:22,height_mm:18},
    {type:'text',text:'After',x_mm:10,y_mm:8,font_family:'Arial',font_size_pt:12,text_box_width_mm:20}
  ]};
  const markup=w.LabelPreview.renderPreviewSVG(template,{},null,{}),svg=new w.DOMParser().parseFromString(markup,'image/svg+xml'),copy=svg.querySelector('[data-inverse-element="2"]');
  assert.ok(svg.querySelector('[data-label-element="0"] text'),'artwork below the inverse object remains in the SVG');
  assert.ok(svg.querySelector('[data-label-element="2"] text'),'later artwork keeps its normal rendering');
  assert.ok(copy?.querySelector('text'),'later artwork receives a composited inverted copy');
  assert.equal(copy.querySelector('g[filter]')?.getAttribute('filter'),'url(#inverse-filter-2)','the copy uses the RGB inversion filter');
  const clip=svg.querySelector('#inverse-clip-2 rect');
  assert.deepEqual(['x','y','width','height'].map(key=>clip?.getAttribute(key)),['8','4','22','18'],'inversion is clipped to the earlier inverse object');
  assert.equal(clip?.parentElement.localName,'clipPath','the clip geometry is a direct shape so Chromium applies the clip to the filtered artwork');
  assert.equal(svg.querySelector('#inverse-filter-2 feColorMatrix')?.getAttribute('type'),'matrix');
  assert.equal(svg.querySelector('#inverse-filter-2 feColorMatrix')?.getAttribute('values'),'-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0');
  dom.window.close();
});
