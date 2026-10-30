const test=require('node:test');
const assert=require('node:assert/strict');
const previewSnap=require('../gui/preview-snap');

test('workspace preview coordinates snap to the configured grid pitch',()=>{
  assert.deepEqual(previewSnap.coordinates(34.17,10.61,true,.5),{xMm:34,yMm:10.5});
  assert.deepEqual(previewSnap.coordinates(34.17,10.61,true,1),{xMm:34,yMm:11});
});

test('workspace preview retains unsnapped pointer coordinates when Snap is off',()=>{
  assert.deepEqual(previewSnap.coordinates(34.17,10.61,false,.5),{xMm:34.2,yMm:10.6});
});

test('preview snapping module is available in the browser renderer',()=>{
  const fs=require('node:fs');
  const {JSDOM}=require('jsdom');
  const dom=new JSDOM('',{runScripts:'outside-only'});
  dom.window.eval(fs.readFileSync(require.resolve('../gui/design-grid'),'utf8'));
  dom.window.eval(fs.readFileSync(require.resolve('../gui/preview-snap'),'utf8'));
  assert.deepEqual({...dom.window.PreviewSnap.coordinates(34.17,10.61,true,.5)},{xMm:34,yMm:10.5});
});
