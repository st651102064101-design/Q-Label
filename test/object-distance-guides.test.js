const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const guides=require('../gui/object-distance-guides');
const box=(left,top,right,bottom)=>({left,top,right,bottom});
test('horizontal movement measures only closest overlapping left/right objects',()=>{
  const result=guides.nearest(box(20,20,30,30),[box(0,20,10,30),box(12,22,18,28),box(35,20,40,30),box(31,0,40,10),box(22,22,25,25)],'x');
  assert.deepEqual(result,[{axis:'x',from:18,to:20,cross:25,distance:2},{axis:'x',from:30,to:35,cross:25,distance:5}]);
});
test('vertical movement measures above/below and excludes diagonal neighbors',()=>{
  assert.deepEqual(guides.nearest(box(20,20,30,30),[box(22,0,28,15),box(20,34,30,40),box(40,31,50,40)],'y').map(m=>m.distance),[5,4]);
  assert.deepEqual(guides.nearest(box(20,20,30,30),[],'x'),[]);
});
test('touching edges have zero gap and selected group bounds support neighboring objects',()=>{
  assert.equal(guides.nearest(box(10,10,40,40),[box(40,20,50,30)],'x')[0].distance,0);
  assert.equal(guides.nearest(box(10,10,40,40),[box(0,25,5,35)],'x')[0].cross,30);
});
test('rotated objects use axis aligned visible bounds',()=>{
  const result=guides.bounds({x:10,y:20,w:20,h:10,rotation_deg:90});
  for(const [key,value]of Object.entries({left:15,right:25,top:15,bottom:35}))assert.ok(Math.abs(result[key]-value)<1e-9);
});
test('SVG renders double arrows and configured unit labels, replaces stale guides',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>');
  const group=dom.window.document.querySelector('g');
  guides.draw(group,[{axis:'x',from:0,to:25.4,cross:10,distance:25.4}],2,mm=>`${mm/25.4} in`);
  assert.equal(group.querySelectorAll('path').length,2);
  assert.equal(group.querySelector('text').textContent,'1 in');
  assert.equal(group.querySelector('text').getAttribute('font-size'),'5.5');
  guides.draw(group,[{axis:'y',from:0,to:10,cross:10,distance:10}],1,mm=>`${mm/10} cm`);
  assert.equal(group.querySelector('text').textContent,'1 cm');
  assert.equal(group.querySelectorAll('line').length,1);
  guides.draw(group,[],1,String);assert.equal(group.children.length,0);
});
