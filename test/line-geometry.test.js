const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const geometry=require('../gui/line-geometry');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const equalPoints=(actual,expected)=>actual.forEach((p,i)=>{close(p.x,expected[i].x);close(p.y,expected[i].y);});
test('endpoint round trips preserve all quadrants, vertical and horizontal lines',()=>{
  for(const end of [{x:50,y:10},{x:-30,y:10},{x:10,y:80},{x:10,y:-50},{x:-50,y:-30},{x:55,y:-20}]){
    const points=[{x:10,y:10},end];for(const thickness of [.1,.3,5])equalPoints(geometry.endpoints({...geometry.fromEndpoints(...points,thickness),thickness_mm:thickness}),points);
  }
});
test('drag either endpoint keeps the opposite endpoint fixed and never mutates input',()=>{
  const points=[{x:0,y:0},{x:20,y:10}];
  equalPoints(geometry.dragEndpoint(points,0,{x:-10,y:40}),[{x:-10,y:40},points[1]]);
  equalPoints(geometry.dragEndpoint(points,1,{x:0,y:-50}),[points[0],{x:0,y:-50}]);
  assert.deepEqual(points,[{x:0,y:0},{x:20,y:10}]);
});
test('an endpoint can cross the other endpoint without flipping the fixed point',()=>{
  equalPoints(geometry.dragEndpoint([{x:0,y:0},{x:20,y:0}],1,{x:-15,y:5}),[{x:0,y:0},{x:-15,y:5}]);
});
test('Shift snaps angle in 45 degree increments while preserving pointer distance',()=>{
  const p=geometry.dragEndpoint([{x:0,y:0},{x:10,y:0}],1,{x:12,y:10},{snap:true});close(p[1].x,p[1].y);close(Math.hypot(p[1].x,p[1].y),Math.hypot(12,10));
});
test('coincident pointer retains a small usable line',()=>{const p=geometry.dragEndpoint([{x:0,y:0},{x:20,y:0}],1,{x:0,y:0});close(Math.hypot(p[1].x,p[1].y),.1);});
test('translation moves both endpoints equally without changing length or direction',()=>{equalPoints(geometry.translate([{x:5,y:7},{x:20,y:-3}],-10,15),[{x:-5,y:22},{x:10,y:12}]);});
test('rotation keeps center and length fixed, and can be reversed',()=>{
  const original=[{x:10,y:20},{x:50,y:20}],rotated=geometry.rotate(original,90);equalPoints(rotated,[{x:30,y:0},{x:30,y:40}]);equalPoints(geometry.rotate(rotated,-90),original);
});
test('legacy rotated line endpoints follow the actual preview box pivot',()=>{
  equalPoints(geometry.endpoints({width_mm:20,height_mm:10,rotation_deg:90},{x:0,y:0,w:20,h:10}),[{x:15,y:-5},{x:5,y:15}]);
});
test('preview renders dragged diagonal line through its exact endpoints in every quadrant',()=>{
  const w=new JSDOM('',{runScripts:'outside-only'}).window;w.ObjectData=require('../gui/object-data');w.LineGeometry=geometry;w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
  for(const [start,end] of [[{x:10,y:20},{x:40,y:50}],[{x:40,y:50},{x:10,y:20}],[{x:10,y:50},{x:40,y:20}],[{x:40,y:20},{x:10,y:50}]]){
    const element={type:'line',thickness_mm:.3,...geometry.fromEndpoints(start,end,.3)},svg=w.LabelPreview.renderPreviewSVG({width_mm:100,height_mm:100,dpi:203,elements:[element]},{},[0],{}),doc=new w.DOMParser().parseFromString(svg,'image/svg+xml'),line=doc.querySelector('[data-label-element="0"] line');
    assert.ok(line,'diagonal line is included in the editor SVG');
    const actual=[{x:Number(line.getAttribute('x1')),y:Number(line.getAttribute('y1'))},{x:Number(line.getAttribute('x2')),y:Number(line.getAttribute('y2'))}];
    equalPoints(actual,[start,end]);
    assert.ok(Math.abs(actual[1].y-actual[0].y)>1,'diagonal endpoint delta remains visible in the rendered line');
  }
  w.close();
});
