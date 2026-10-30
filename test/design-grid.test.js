const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const grid=require('../gui/design-grid');
test('hidden grid produces no artwork',()=>assert.equal(grid.render({show:false,width:72,height:50}),''));
test('visible grid uses dots, bounded paper and does not intercept dragging',()=>{
  const doc=new JSDOM(`<svg>${grid.render({show:true,width:72,height:50,x:-2,y:-3,pitch:1})}</svg>`).window.document;
  assert.equal(doc.querySelectorAll('circle').length,1);
  assert.equal(doc.querySelectorAll('line').length,0);
  const rect=doc.querySelector('rect');
  assert.equal(rect.getAttribute('width'),'72');assert.equal(rect.getAttribute('height'),'50');
  assert.equal(rect.getAttribute('x'),'-2');assert.equal(rect.getAttribute('y'),'-3');
  assert.equal(rect.getAttribute('pointer-events'),'none');
});
test('rounded paper clips grid artwork to the rounded paper bounds',()=>{
  const doc=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${grid.render({show:true,width:20,height:10,x:-2,y:-3,pitch:1,shape:'rounded',radius:4,id:'rounded-grid'})}</svg>`).window.document;
  const clip=doc.querySelector('#rounded-grid-clip'),shape=clip?.querySelector('rect'),gridRect=doc.querySelector('[data-design-grid="true"]');
  assert.ok(clip,'rounded paper receives an SVG clipping shape for the grid');
  assert.deepEqual(['x','y','width','height','rx','ry'].map(name=>shape.getAttribute(name)),['-2','-3','20','10','4','4'],'clip matches the paper rectangle and corner radius');
  assert.equal(gridRect.getAttribute('clip-path'),'url(#rounded-grid-clip)','the grid artwork uses the rounded paper clip');
});
test('editor grid uses the active label shape and clamps its paper corner radius',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../gui/renderer.js'),'utf8'),start=source.indexOf('function gridSVG('),end=source.indexOf('let paperCornerDragging',start);
  assert.ok(start>=0&&end>start,'renderer grid integration can be loaded');
  const context={DesignGrid:grid,editorGrid:{show:true,step:.5},designPaperBounds:()=>({x:-2,y:-3,width:20,height:10}),editing:{label_shape:'rounded',corner_radius_mm:8}};
  vm.createContext(context);vm.runInContext(source.slice(start,end),context);
  const doc=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${context.gridSVG(20,10)}</svg>`).window.document,clip=doc.querySelector('#editor-dot-grid-clip rect');
  assert.deepEqual(['x','y','width','height','rx','ry'].map(name=>clip.getAttribute(name)),['-2','-3','20','10','5','5'],'renderer clips grid to the same rounded bounds as paper, clamping radius to half the shorter side');
});
test('ellipse paper clips grid to the ellipse boundary',()=>{
  const markup=grid.render({show:true,width:20,height:10,x:-2,y:-3,pitch:1,shape:'ellipse',id:'ellipse-grid'}),doc=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`).window.document,clip=doc.querySelector('#ellipse-grid-clip ellipse');
  assert.ok(clip,'ellipse paper receives an ellipse clip shape');
  assert.deepEqual(['cx','cy','rx','ry'].map(name=>clip.getAttribute(name)),['8','2','10','5']);
  assert.equal(doc.querySelector('[data-design-grid="true"]').getAttribute('clip-path'),'url(#ellipse-grid-clip)');
});
test('dense grids have constant SVG size',()=>assert.ok(grid.render({show:true,width:10000,height:10000,pitch:.05}).length<1000));
test('invalid pitch defaults safely',()=>{for(const p of [0,-1,NaN,Infinity,'bad'])assert.equal(grid.step(p),.5);assert.equal(grid.step(.001),.05);});
test('invalid paper size produces no grid',()=>{for(const width of [0,-1,NaN,Infinity])assert.equal(grid.render({show:true,width,height:50}), '');});
test('snap handles positive and negative coordinates',()=>{assert.equal(grid.snap(1.26,true,.5),1.5);assert.equal(grid.snap(-1.26,true,.5),-1.5);});
test('movement snap aligns the moved edge to the grid phase and leaves free movement unchanged',()=>{
  assert.ok(Math.abs(grid.snapDelta(8.13,.23,true,.5)-.37)<1e-10);
  assert.ok(Math.abs(grid.snapDelta(10.23,.23,true,.5,10)-.27)<1e-10);
  assert.equal(grid.snapDelta(8.13,.234567,false,.5),.234567);
});
test('resize pointer snaps to grid only while Snap to grid is enabled',()=>{
  assert.deepEqual(grid.snapPoint({x:8.36,y:10.64},true,.5),{x:8.5,y:10.5});
  assert.deepEqual(grid.snapPoint({x:8.36,y:10.64},false,.5),{x:8.36,y:10.64});
});
test('snap remains independent of grid visibility',()=>{grid.render({show:false,width:72,height:50});assert.equal(grid.snap(1.26,true,.5),1.5);assert.equal(grid.snap(1.26,false,.5),1.3);});
test('module is available to browser renderer',()=>{const fs=require('node:fs');const dom=new JSDOM('',{runScripts:'outside-only'});dom.window.eval(fs.readFileSync(require.resolve('../gui/design-grid'),'utf8'));assert.equal(dom.window.DesignGrid.snap(1.26,true,.5),1.5);});
