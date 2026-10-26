'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildPdfHtml,pdfOptions,validateSize,validateSvgPage,MAX_PAGES}=require('../lib/export-pdf');
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
const SVG='<svg viewBox="0 0 10 5" xmlns="http://www.w3.org/2000/svg"><rect width="4" height="2"/></svg>';

test('PNG pages repeat once per copy and carry the physical page size',()=>{
  const html=buildPdfHtml({dataUrl:PNG,width_mm:100,height_mm:50,copies:3});
  assert.equal((html.match(/<section>/g)||[]).length,3);
  assert.match(html,/@page\{size:100mm 50mm;margin:0\}/);
  assert.match(html,/width:100mm;height:50mm/);
});

test('SVG pages become one section each and ignore the copies count',()=>{
  const html=buildPdfHtml({svgPages:[SVG,SVG.replace('width="4"','width="6"')],width_mm:60,height_mm:30,copies:9});
  assert.equal((html.match(/<section><svg/g)||[]).length,2);
  assert.ok(html.includes('width="6"'));
});

test('invalid sizes, images and page counts are refused',()=>{
  for(const bad of [[0,10],[10,-1],[NaN,5],[3000,10]])assert.throws(()=>validateSize(...bad),/size/);
  assert.throws(()=>buildPdfHtml({dataUrl:'data:text/html;base64,AAAA',width_mm:10,height_mm:10}),/PNG/);
  assert.throws(()=>buildPdfHtml({svgPages:[],width_mm:10,height_mm:10}),/page count/);
  assert.throws(()=>buildPdfHtml({svgPages:Array(MAX_PAGES+1).fill(SVG),width_mm:10,height_mm:10}),/page count/);
});

test('SVG pages with active content are rejected',()=>{
  assert.equal(validateSvgPage(SVG),SVG);
  for(const bad of ['<div></div>','<svg><script>alert(1)</script></svg>','<svg onload="x()"></svg>','<svg><foreignObject/></svg>','<svg><a href="javascript:x"/></svg>',42])assert.throws(()=>validateSvgPage(bad),/PDF/);
});

test('Chromium page size is given in inches without margins',()=>{
  const options=pdfOptions({width_mm:25.4,height_mm:50.8});
  assert.deepEqual(options.pageSize,{width:1,height:2});
  assert.deepEqual(options.margins,{marginType:'none'});
  assert.equal(options.printBackground,true);
});
