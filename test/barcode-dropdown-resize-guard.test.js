'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..','gui',name),'utf8');

test('ribbon Barcode button opens its dropdown instead of arming placement',()=>{
  const source=read('renderer.js');
  assert.match(source,/closest\?\.\('#insertBarcodeTool,#insertTextTool,#insertPictureTool'\)\)return;/);
});

test('canvas resize caret state is declared before resize gestures read it',()=>{
  assert.match(read('renderer.js'),/^let pendingCanvasResizeCaret=null;/m);
});

test('EAN-13 editor raster uses run lengths, not the raw bit string',()=>{
  assert.match(read('preview.js'),/String\(enc\.bits\)\.match\(\/1\+\|0\+\/g\)/);
});

test('live barcode resize frames skip per-width PNG rasterisation',()=>{
  assert.match(read('barcode-hri-resize.js'),/liveGesture:true/);
  assert.match(read('preview.js'),/!options\?\.liveGesture&&widths\?\.length/);
});
