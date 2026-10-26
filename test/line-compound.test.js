'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const LineCompound=require('../gui/line-compound'),Layout=require('../gui/object-layout');
const {buildLabel}=require('../lib/render');
const zpl=el=>buildLabel({dpi:203,width_mm:60,height_mm:40,elements:[el]},[{}]).toString();
const bars=text=>[...text.matchAll(/\^FO(\d+),(\d+)\^GB(\d+),(\d+),(\d+)\^FS/g)].map(m=>m.slice(1).map(Number));

test('compound profiles match the Border line table',()=>{
  assert.deepEqual(LineCompound.COMPOUNDS,Layout.compounds);
  assert.equal(LineCompound.keyOf({compound:'nonsense'}),'single');
  assert.equal(LineCompound.isCompound({}),false);
  assert.equal(LineCompound.isCompound({compound:'double'}),true);
});

test('stripes fit inside the line thickness with gaps between them',()=>{
  for(const key of LineCompound.KEYS){
    const stripes=LineCompound.stripes({compound:key,thickness_mm:.9});
    const last=stripes.at(-1);
    assert.ok(Math.abs(last.from+last.width-.9)<1e-9,key+' spans the full thickness');
    for(let i=1;i<stripes.length;i++)assert.ok(stripes[i].from>stripes[i-1].from+stripes[i-1].width-1e-9,key+' stripes do not overlap');
  }
  const thinThick=LineCompound.stripes({compound:'thin-thick',thickness_mm:.8});
  assert.ok(thinThick[1].width>thinThick[0].width*1.9);
});

test('ZPL prints a double horizontal line as two separated bars',()=>{
  const found=bars(zpl({type:'line',x_mm:5,y_mm:5,width_mm:30,height_mm:0,thickness_mm:.9,compound:'double'}));
  assert.equal(found.length,2);
  assert.ok(found[1][1]>=found[0][1]+found[0][3]+1,'gap between the two bars');
});

test('ZPL prints compound boxes as concentric frames and ellipses as concentric ^GE',()=>{
  const box=zpl({type:'box',x_mm:5,y_mm:5,width_mm:10,height_mm:6,thickness_mm:.9,compound:'double'});
  assert.equal(bars(box).length,8,'two frames of four sides');
  const ellipse=zpl({type:'ellipse',x_mm:5,y_mm:5,width_mm:10,height_mm:6,thickness_mm:.9,compound:'double'});
  assert.equal((ellipse.match(/\^GE/g)||[]).length,2);
});

test('single compound and unset compound are unchanged',()=>{
  const plain=zpl({type:'box',x_mm:5,y_mm:5,width_mm:10,height_mm:6,thickness_mm:.9});
  assert.equal(zpl({type:'box',x_mm:5,y_mm:5,width_mm:10,height_mm:6,thickness_mm:.9,compound:'single'}),plain);
  assert.equal(bars(plain).length,1);
});
