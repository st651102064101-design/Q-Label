'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');

function loadNavigation(){
  const dom=new JSDOM('',{runScripts:'outside-only'});
  dom.window.eval(require('node:fs').readFileSync(require.resolve('../gui/preview-navigation'),'utf8'));
  return {dom,api:dom.window.PreviewNavigation};
}

test('preview middle-pan state blocks wheel zoom and pan until its pointer ends',()=>{
  const {dom,api}=loadNavigation(),state=api.createMiddlePanState();
  assert.equal(state.active(),false);
  assert.equal(state.begin({button:0,pointerId:4}),false);
  assert.equal(api.wheelAction({ctrlKey:true},state.active()),'zoom');
  assert.equal(state.begin({button:1,pointerId:7}),true);
  assert.equal(state.active(),true);
  assert.equal(api.wheelAction({ctrlKey:true,deltaY:-120},state.active()),'ignore');
  assert.equal(api.wheelAction({ctrlKey:false,deltaY:120},state.active()),'ignore');
  assert.equal(state.end({pointerId:8}),false);
  assert.equal(state.active(),true);
  assert.equal(state.end({pointerId:7}),true);
  assert.equal(state.active(),false);
  assert.equal(api.wheelAction({ctrlKey:false},state.active()),'pan');
  dom.window.close();
});

test('preview navigation module is available in the browser renderer',()=>{
  const {dom,api}=loadNavigation();
  assert.equal(typeof api.createMiddlePanState,'function');
  assert.equal(typeof api.wheelAction,'function');
  dom.window.close();
});

test('zoom anchor mapping is computed from the starting geometry without per-frame layout reads',()=>{
  const {dom,api}=loadNavigation();
  const start=api.captureZoomAnchor({left:120,top:80,width:600,height:400},{left:0,top:0,width:900,height:700},{x:390,y:260});
  assert.deepEqual({...start},{ratioX:.45,ratioY:.45,pointX:390,pointY:260});
  const next=api.mapZoomAnchor(start,{width:900,height:600},{marginLeft:0,marginTop:50},{x:0,y:0});
  assert.deepEqual({...next},{x:-15,y:-60});
  dom.window.close();
});
