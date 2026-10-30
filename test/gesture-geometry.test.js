const test=require('node:test'),assert=require('node:assert/strict');const {resizeMatrix}=require('../gui/gesture-geometry');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`),point=(m,p)=>({x:m.a*p.x+m.c*p.y+m.e,y:m.b*p.x+m.d*p.y+m.f});
test('HRI drag reaches both barcode edges and preserves vertical positioning independently',()=>{
  const {hriPosition}=require('../gui/gesture-geometry');
  assert.equal(typeof hriPosition,'function');
  const base={width:40,alignment:'center',offset:2,gap:.6,maxOffset:80};
  assert.deepEqual(hriPosition({...base,dx:-25,dy:3}),{alignment:'left',offset:5});
  assert.deepEqual(hriPosition({...base,dx:25,dy:-50}),{alignment:'right',offset:-.6});
  assert.deepEqual(hriPosition({...base,dx:0,dy:90}),{alignment:'center',offset:80});
  assert.deepEqual(hriPosition({...base,alignment:'left',dx:40,dy:0}),{alignment:'right',offset:2});
  assert.deepEqual(hriPosition({...base,alignment:'right',dx:-40,dy:0}),{alignment:'left',offset:2});
  assert.deepEqual(hriPosition({...base,alignment:'left',dx:0,dy:2}),{alignment:'left',offset:4});
});
test('unchanged rotated artwork with an off-center text pivot has no visual jump',()=>{const box={x:4,y:8,w:15,h:9},m=resizeMatrix(box,box,37,{x:8,y:7});near(m.a,1);near(m.b,0);near(m.d,1);near(m.e,0);near(m.f,0);});
test('unrotated resize maps both opposite corners to the desired bounds',()=>{const original={x:5,y:8,w:20,h:10},target={x:2,y:3,w:40,h:5},m=resizeMatrix(original,target);assert.deepEqual(point(m,{x:5,y:8}),{x:2,y:3});assert.deepEqual(point(m,{x:25,y:18}),{x:42,y:8});});
test('rotated resize preserves angle and applies independent scales in object coordinates',()=>{const o={x:0,y:0,w:10,h:10},t={x:1,y:2,w:20,h:5},pivot={x:5,y:5},angle=37,r=angle*Math.PI/180,m=resizeMatrix(o,t,angle,pivot),center=point(m,pivot),end=point(m,{x:5+Math.cos(r)*10,y:5+Math.sin(r)*10});near(center.x,11);near(center.y,4.5);near(end.x-center.x,Math.cos(r)*20);near(end.y-center.y,Math.sin(r)*20);});
