'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const handles=require('../gui/svg-selection-handles');
const objectDistanceGuides=require('../gui/object-distance-guides');
const barcodeHriResize=require('../gui/barcode-hri-resize');

test('selected barcode shows the yellow HRI drag marker and hides it while moving',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../gui/index.html'),'utf8');
  const dom=new JSDOM(html),document=dom.window.document,overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');
  overlay.classList.add('overlay');
  overlay.innerHTML='<g data-editor-overlay="0" class="is-selected"><circle class="hri-handle-dot"/></g><g data-editor-overlay="1"><circle class="hri-handle-dot"/></g>';
  document.body.append(overlay);
  const selected=overlay.querySelector('[data-editor-overlay="0"] .hri-handle-dot'),unselected=overlay.querySelector('[data-editor-overlay="1"] .hri-handle-dot');
  assert.equal(dom.window.getComputedStyle(selected).visibility,'visible','selected barcode exposes its HRI drag position');
  assert.equal(dom.window.getComputedStyle(unselected).visibility,'hidden','unselected barcode does not show a drag marker');
  overlay.classList.add('is-object-moving');
  assert.equal(dom.window.getComputedStyle(selected).visibility,'hidden','marker hides during object movement');
  overlay.classList.add('is-hri-moving');
  assert.equal(dom.window.getComputedStyle(selected).visibility,'visible','yellow marker stays visible when moving the HRI itself');
  const hit=document.createElementNS('http://www.w3.org/2000/svg','circle');hit.setAttribute('class','hri-handle-hit');overlay.append(hit);
  assert.equal(dom.window.getComputedStyle(hit).cursor,'move','HRI drag uses the four-direction move cursor');
  dom.window.close();
});

test('redrawing barcode controls during HRI drag keeps the green selection frame',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g class="is-selected"><rect class="sel"/><circle class="hri-handle-dot"/></g></svg>'),controls=dom.window.document.querySelector('g');
  const frame=handles.updateHriControls(controls,'<circle class="handle-dot"/><circle class="hri-handle-dot"/><circle class="hri-handle-hit"/>',{x:12,y:8,w:42,h:19},0,{x:33,y:17.5});
  assert.ok(frame,'the live HRI controls still contain the selection rectangle');
  assert.deepEqual(['x','y','width','height'].map(key=>frame.getAttribute(key)),['12','8','42','19'],'the retained frame follows the current object bounds');
  assert.equal(controls.querySelector('.hri-handle-hit')!==null,true,'the yellow drag target is redrawn alongside the frame');
  assert.equal(controls.classList.contains('is-selected'),true,'the selected overlay styling remains active during the gesture');
  dom.window.close();
});

test('live rotation updates barcode overflow highlight geometry and hides it when rotation returns inside the paper',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g data-overflow-highlight="0" display="none"><path data-overflow-highlight-shape="0" d="original"/></g></svg>'),document=dom.window.document,group=document.querySelector('g'),path=group.querySelector('path'),paper={x:0,y:0,width:100,height:60},box={x:69,y:24,w:30.78,h:10,rotationCenter:{x:84.39,y:29}};
  const outside=(bounds,page)=>bounds.left<page.x-.001||bounds.top<page.y-.001||bounds.right>page.x+page.width+.001||bounds.bottom>page.y+page.height+.001;
  assert.equal(handles.updateOverflowHighlight(group,path,box,0,paper,objectDistanceGuides.bounds,outside),false,'unrotated barcode fits inside the paper');
  const originalPath=path.getAttribute('d');
  assert.equal(group.getAttribute('display'),'none','in-bounds barcode highlight stays hidden');
  assert.equal(handles.updateOverflowHighlight(group,path,box,20,paper,objectDistanceGuides.bounds,outside),true,'rotation moves barcode beyond the paper edge');
  const rotatedPath=path.getAttribute('d');
  assert.notEqual(rotatedPath,originalPath,'highlight outline follows the live rotation angle');
  assert.equal(group.hasAttribute('display'),false,'overflow highlight becomes visible during rotation preview');
  assert.equal(handles.updateOverflowHighlight(group,path,box,0,paper,objectDistanceGuides.bounds,outside),false,'returning to zero degrees removes the overflow');
  assert.equal(path.getAttribute('d'),originalPath,'highlight outline returns to the unrotated position');
  assert.equal(group.getAttribute('display'),'none','highlight hides again while the object is back inside the paper');
  dom.window.close();
});

test('live rotation angle label shows whole degrees and updates at one-degree intervals',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g class="rotation-guides"/></svg>'),svg=dom.window.document.querySelector('svg'),guides=svg.querySelector('g');
  const first=handles.updateRotationAngleLabel(guides,14.2,{x:20,y:30});
  assert.equal(first.textContent,'14°','rotation angle label rounds to a whole degree');
  assert.deepEqual(['x','y'].map(key=>first.getAttribute(key)),['20','30'],'label follows the current rotation center');
  const next=handles.updateRotationAngleLabel(guides,15.1,{x:21,y:31});
  assert.equal(next.textContent,'15°','label updates when rotation advances by one degree');
  assert.equal(guides.querySelectorAll('.rotation-snap-label').length,1,'only one current-angle label is present');
  assert.deepEqual(['x','y'].map(key=>next.getAttribute(key)),['21','31'],'label position updates during the gesture');
  assert.equal(handles.updateRotationAngleLabel(guides,16.0,{x:22,y:32}).textContent,'16°','the next whole degree is displayed');
  assert.equal(handles.updateRotationAngleLabel(guides,359.6,{x:22,y:32}).textContent,'360°','rounding near a full turn displays 360° until the angle returns to zero');
  dom.window.close();
});

test('barcode HRI drag target stays a usable screen-sized target at every zoom',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../gui/renderer.js'),'utf8'),start=source.indexOf('function elementHandlesSVG('),end=source.indexOf('\nfunction elementTypeLabel(',start);
  assert.ok(start>=0&&end>start,'renderer selection markup can be loaded');
  const renderSource=source.slice(start,end),element={type:'barcode128',show_text:true,bar_height_mm:10,hri_height_mm:3,width_mm:40,height_mm:14},results=[];
  for(const pixelsPerMm of [.5,1,4,12]){
    const context={window:{LineControls:require('../gui/line-controls'),TransformHistory:{has:()=>false}},document:{},editing:{dpi:203},el:()=>({querySelector:()=>({getBoundingClientRect:()=>({width:120,height:120}),viewBox:{baseVal:{width:120/pixelsPerMm,height:120/pixelsPerMm}}})}),selectionNameSVG:()=>'',elementTypeLabel:()=> 'Barcode',liveOverlay:()=>null,resizeCursor:()=> 'ew-resize'};
    vm.createContext(context);vm.runInContext(renderSource,context);
    const markup=context.elementHandlesSVG(0,0,40,14,0,element,{x:0,y:0,w:40,h:14}),dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`),hit=dom.window.document.querySelector('.hri-handle-hit');
    assert.ok(hit,'barcode with readable text has an HRI drag target');
    const radiusMm=Number(hit.getAttribute('r'));
    assert.ok(Math.abs(radiusMm*pixelsPerMm-4)<1e-6,`HRI target radius is 4 screen pixels at ${pixelsPerMm}px/mm so it does not swallow the bottom resize handle`);
    results.push(radiusMm*pixelsPerMm);dom.window.close();
  }
  assert.ok(results.every(radius=>Math.abs(radius-4)<1e-9),`HRI radius remains 4 screen pixels at every zoom, got ${results}`);
});

test('selection markup renders visible corner grips and resize targets for every framed object type',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../gui/renderer.js'),'utf8'),start=source.indexOf('function elementHandlesSVG('),end=source.indexOf('\nfunction elementTypeLabel(',start),renderSource=source.slice(start,end);
  const types=[
    {type:'text'}, {type:'box'}, {type:'ellipse'}, {type:'image'}, {type:'image',source_format:'svg'},
    {type:'barcode128'}, {type:'qrcode'}, {type:'datamatrix'}, {type:'inverse'},
    {type:'image',table_model:{columns:[],rows:[]}}
  ];
  for(const element of types){
    const context={window:{LineControls:require('../gui/line-controls'),SvgSelectionHandles:handles,TransformHistory:{has:()=>false}},document:{},editing:{dpi:203},el:()=>null,selectionNameSVG:()=>'',elementTypeLabel:()=> 'Object',liveOverlay:()=>null,resizeCursor:()=> 'nwse-resize'};
    vm.createContext(context);vm.runInContext(renderSource,context);
    const markup=context.elementHandlesSVG(1,2,40,30,0,element,{x:1,y:2,w:40,h:30}),dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`),dots=[...dom.window.document.querySelectorAll('.handle-dot[data-anchor]')].filter(dot=>['nw','ne','se','sw'].includes(dot.dataset.anchor)),targets=[...dom.window.document.querySelectorAll('.handle-hit[data-anchor]')].filter(target=>['nw','ne','se','sw'].includes(target.dataset.anchor));
    const expected=['ne','nw','se','sw'];
    assert.deepEqual(dots.map(dot=>dot.dataset.anchor).sort(),expected,`${element.type}${element.table_model?' table':''} renders corner markers`);
    assert.deepEqual(dots.map(dot=>dot.getAttribute('style').match(/visibility:([^;]+)/)?.[1]),Array(4).fill('visible'),`${element.type} shows all corner markers`);
    assert.deepEqual(targets.map(target=>target.dataset.anchor).sort(),expected,`${element.type} keeps all four corner drag targets`);
    dom.window.close();
  }
});

test('all selected object types expose all four corner resize markers',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><circle class="handle-dot" data-anchor="nw"/><circle class="handle-dot" data-anchor="ne"/><circle class="handle-dot" data-anchor="sw"/><circle class="handle-dot" data-anchor="se"/></svg>'),dots=dom.window.document.querySelectorAll('circle');
  const objects=[
    {type:'image',source_format:'svg'}, {type:'image',source_format:'png'}, {type:'barcode128'},
    {type:'text'}, {type:'box'}, {type:'ellipse'}, {type:'qrcode'}, {type:'inverse'},
    {type:'image',table_model:{columns:[],rows:[]}}
  ];
  for(const object of objects){
    for(const dot of dots)dot.setAttribute('style',`visibility:${handles.cornerVisibility(object,dot.dataset.anchor)}`);
    assert.deepEqual([...dots].map(dot=>dom.window.getComputedStyle(dot).visibility),['visible','visible','visible','visible'],`${object.type}${object.source_format?` ${object.source_format}`:''}${object.table_model?' table':''} shows all four corner grips`);
  }
  assert.deepEqual([...dots].map(dot=>dot.dataset.anchor),['nw','ne','sw','se'],'resize markers cover every corner');
  dom.window.close();
});

test('selected barcodes show all four corner resize markers',()=>{
  const barcode={type:'barcode128'};
  assert.equal(handles.cornerVisibility(barcode,'sw'),'visible','lower-left corner marker is visible');
  assert.equal(handles.cornerVisibility(barcode,'ne'),'visible','upper-right corner marker is visible');
  assert.equal(handles.cornerVisibility(barcode,'nw'),'visible','upper-left corner marker is visible');
  assert.equal(handles.cornerVisibility(barcode,'se'),'visible','lower-right corner marker is visible');
});

test('resize keeps corner and tool controls at their original screen size',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g id="controls"><g class="frame" transform="rotate(25 10 10)"><circle class="handle-dot" cx="10" cy="10" r="5"/><rect class="handle-hit" x="7" y="8" width="6" height="4"/></g><g class="stroke-width-control" transform="translate(30 20) scale(2)"><circle cx="0" cy="0" r="8"/></g></g></svg>'),controls=dom.window.document.querySelector('#controls');
  controls.querySelector('.stroke-width-control').getBBox=()=>({x:-8,y:-8,width:16,height:16});
  handles.counterScaleResizeControls(controls,'matrix(3 0 0 0.5 -20 5)',3,0.5);
  assert.equal(controls.getAttribute('transform'),'matrix(3 0 0 0.5 -20 5)','selection frame follows the resized object geometry');
  const dot=controls.querySelector('.handle-dot'),hit=controls.querySelector('.handle-hit'),tool=controls.querySelector('.stroke-width-control');
  assert.equal(dot.getAttribute('transform'),'translate(10 10) scale(0.3333333333333333 2) translate(-10 -10)','corner marker cancels resize stretch at its own center');
  assert.equal(hit.getAttribute('transform'),'translate(10 10) scale(0.3333333333333333 2) translate(-10 -10)','corner hit target keeps its original screen dimensions');
  assert.match(tool.getAttribute('transform'),/scale\(0\.3333333333333333 2\)/,'floating tool cancels the object resize while retaining its anchor');
  handles.restoreResizeControlTransforms(controls);
  assert.equal(controls.hasAttribute('transform'),false,'selection overlay restores its original transform when the drag ends');
  assert.equal(dot.hasAttribute('transform'),false,'corner marker restores its original transform when the drag ends');
  assert.equal(tool.getAttribute('transform'),'translate(30 20) scale(2)','floating tool keeps its original placement and screen scale');
  dom.window.close();
});

test('resize preview keeps artwork stroke bounded at any zoom and restores its SVG attributes',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g id="art"><rect stroke="#111" stroke-width="0.3"/><path stroke="#16a34a" stroke-width="0.2" vector-effect="non-scaling-stroke"/></g></svg>'),art=dom.window.document.querySelector('#art'),[rect,path]=art.children;
  handles.preserveResizeStrokes(art,2,node=>({stroke:node.getAttribute('stroke'),strokeWidth:node.getAttribute('stroke-width')}));
  assert.equal(rect.getAttribute('vector-effect'),'non-scaling-stroke','stroked artwork does not inherit the temporary non-uniform resize');
  assert.equal(rect.getAttribute('stroke-width'),'0.3','stroke width stays in bounded SVG units instead of being multiplied by canvas scale');
  assert.equal(path.getAttribute('stroke-width'),'0.2','existing non-scaling strokes keep their authored width during resize');
  handles.preserveResizeStrokes(art,1577,node=>({stroke:node.getAttribute('stroke'),strokeWidth:node.getAttribute('stroke-width')}));
  assert.equal(rect.getAttribute('stroke-width'),'0.3','large canvas zoom cannot turn the outline into a screen-filling stroke');
  handles.restoreResizeStrokes(art);
  assert.equal(rect.getAttribute('stroke-width'),'0.3','original stroke width returns after preview');
  assert.equal(rect.hasAttribute('vector-effect'),false,'temporary vector effect is removed after preview');
  assert.equal(path.getAttribute('vector-effect'),'non-scaling-stroke','pre-existing vector effect is restored');
  assert.equal(path.getAttribute('stroke-width'),'0.2','pre-existing stroke width is restored');
  dom.window.close();
});

test('barcode HRI vertical compensation keeps its screen height while its baseline follows the bars',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g id="art" transform="matrix(1 0 0 1.8 0 -12)"><g data-barcode-hri="true"><text x="20" y="30" font-size="3">12345678</text></g></g></svg>'),group=dom.window.document.querySelector('[data-barcode-hri]');
  group.getBBox=()=>({x:10,y:27,width:20,height:3});
  barcodeHriResize.preserveHeight(group,1.8);
  assert.equal(group.getAttribute('transform'),'translate(20 27) scale(1 0.5555555555555556) translate(-20 -27)','HRI shrinks locally by the inverse Y resize around its top edge');
  const parentScale=1.8,localScaleY=.5555555555555556;
  assert.ok(Math.abs(parentScale*localScaleY-1)<1e-12,'the full SVG transform leaves HRI height unchanged');
  barcodeHriResize.preserveHeight(group,1);
  assert.equal(group.hasAttribute('transform'),false,'the compensation clears when the vertical resize returns to its original size');
  dom.window.close();
});

test('barcode HRI size compensation counters both X and Y stretch during free resize',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g data-barcode-hri="true"><text x="20" y="30" font-size="3">12345678</text></g></svg>'),group=dom.window.document.querySelector('[data-barcode-hri]');
  group.getBBox=()=>({x:10,y:27,width:20,height:3});
  barcodeHriResize.preserveSize(group,1.5,2);
  assert.equal(group.getAttribute('transform'),'translate(20 27) scale(0.6666666666666666 0.5) translate(-20 -27)','HRI counters non-uniform X/Y resize around its top-center');
  assert.ok(Math.abs(1.5*(1/1.5)-1)<1e-12,'combined X scale leaves glyph width unchanged');
  assert.ok(Math.abs(2*(1/2)-1)<1e-12,'combined Y scale leaves glyph height unchanged');
  barcodeHriResize.preserveSize(group,1,1);
  assert.equal(group.hasAttribute('transform'),false,'compensation clears when both axes return to 1');
  dom.window.close();
});

test('barcode HRI vertical compensation stays aligned with rotated resize axes',()=>{
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g data-barcode-hri="true"><text x="20" y="30" font-size="3">12345678</text></g></svg>'),group=dom.window.document.querySelector('[data-barcode-hri]');
  group.getBBox=()=>({x:10,y:27,width:20,height:3});
  barcodeHriResize.preserveHeight(group,2);
  assert.equal(group.getAttribute('transform'),'translate(20 27) scale(1 0.5) translate(-20 -27)','HRI counter-scale uses barcode-local Y coordinates before its existing rotation');
  const angle=30*Math.PI/180,sx=1.4,sy=2,c=Math.cos(angle),s=Math.sin(angle),
    a=c*c*sx+s*s*sy,b=s*c*(sx-sy),d=s*s*sx+c*c*sy,
    localX=-s/sy,localY=c/sy,
    outX=a*localX+b*localY,outY=b*localX+d*localY;
  assert.ok(Math.abs(Math.hypot(outX,outY)-1)<1e-12,'the combined rotated resize and HRI counter-scale keeps glyph height unchanged');
  dom.window.close();
});
