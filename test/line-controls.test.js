const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const geometry=require('../gui/line-geometry');
const controls=require('../gui/line-controls');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const samePoints=(actual,expected)=>actual.forEach((point,i)=>{near(point.x,expected[i].x);near(point.y,expected[i].y);});
function harness(points=[{x:100,y:100},{x:200,y:100}]){
  const dom=new JSDOM('<div id="previewFrame"><svg xmlns="http://www.w3.org/2000/svg"><g data-label-element="0"></g><g data-editor-overlay="0"></g></svg></div>'),window=dom.window,svg=window.document.querySelector('svg');
  const element={type:'line',thickness_mm:.3,...geometry.fromEndpoints(...points)};
  svg._editorBoxes=[{index:0,type:'line',x:element.x_mm,y:element.y_mm,w:element.width_mm,h:.3}];svg.getScreenCTM=()=>null;
  window.LineGeometry=geometry;
  window.EditHistory=require('../gui/edit-history');
  window.FrameInput={create(apply){return{push:event=>apply(event),flush:event=>{if(event!==undefined)apply(event);}};}};
  window.GestureGeometry=require('../gui/gesture-geometry');
  window.ObjectDistanceGuides={bounds:box=>({left:box.x,top:box.y,right:box.x+box.w,bottom:box.y+box.h}),nearest:()=>null,draw:()=>{}};
  window.LabelPreview={computeBoxes:(template)=>template.elements.map((item,index)=>({index,type:item.type,x:Number(item.x_mm)||0,y:Number(item.y_mm)||0,w:Number(item.width_mm)||1,h:Math.max(Number(item.height_mm)||0,Number(item.thickness_mm)||.3)})),renderElement:()=>'',updateTableSVG:()=>false};
  window.TransformHistory=require('../gui/transform-history').create();
  const context={window,document:window.document,el:id=>window.document.getElementById(id),structuredClone,performance,setTimeout,clearTimeout,DOMPoint:window.DOMPoint||class{constructor(x=0,y=0){this.x=x;this.y=y;}matrixTransform(){return this;}},
    editing:{width_mm:1000,height_mm:1000,elements:[element]},editorGrid:{snap:false,step:.5},DesignGrid:require('../gui/design-grid'),editorSelection:new Set([0]),editorSel:0,undoStack:[],redoStack:[],previewPan:{x:0,y:0},
    liveOverlay:()=>svg,clientToMm:event=>({x:event.clientX,y:event.clientY}),lineWorldEndpoints:(box,e)=>geometry.endpoints(e,box),
    selectionVisualBounds:()=>({x:100,y:100,w:100,h:.3}),designPaperBounds:()=>({x:0,y:0,width:1000,height:1000,minX:0,minY:0}),
    selectElement:()=>{},sampleData:()=>({}),pushSnapshot:()=>{},recordEditRevision:()=>{},flushPendingGestureRevision:()=>{},noteRecentObjectUsage:()=>{},renderEditorElements:()=>{},drawEditorCanvas:()=>{},touchEditor:()=>{},updateUndoButtons:()=>{},
    elementHandlesSVG:()=>'',objectOverflowsPaperShape:()=>false,overflowHighlightPath:()=>'',
    requestAnimationFrame:fn=>setTimeout(fn,0),cancelAnimationFrame:id=>clearTimeout(id),snapVal:x=>x,updatePreviewRuler:()=>{},activeObjectGesture:false,deferredGestureDraw:false,pendingGestureRevision:null,qrCache:{}};
  vm.createContext(context);const source=fs.readFileSync(require.resolve('../gui/renderer.js'),'utf8');vm.runInContext(source.slice(source.indexOf('function startDrag('),source.indexOf('let statusBadgeTimer;')),context);
  const pointer=(type,x,y,options={})=>new window.MouseEvent(type,{clientX:x,clientY:y,button:0,buttons:1,...options});
  return {context,window,element,start:(mode,anchor,x,y,placement=false)=>context.startDrag(pointer('pointerdown',x,y),0,mode,anchor,null,placement),move:(x,y,options)=>window.dispatchEvent(pointer('pointermove',x,y,options)),up:(x,y)=>window.dispatchEvent(pointer('pointerup',x,y)),points:()=>geometry.endpoints(context.editing.elements[0])};
}
test('rotate and move controls show a clear green border during mouse or pen hover',()=>{
  const dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${controls.render([{x:0,y:0},{x:100,y:0}],0,1)}</svg>`),document=dom.window.document,svg=document.querySelector('svg'),style=document.createElement('style');
  style.textContent=controls.hoverStyle;document.head.append(style);controls.bindToolHover(svg);
  for(const selector of ['.rotation-hit','.line-move-hit']){
    const tool=svg.querySelector(selector),circle=tool.querySelector('circle'),enter=pointerType=>{const event=new dom.window.Event('pointerenter');Object.defineProperty(event,'pointerType',{value:pointerType});tool.dispatchEvent(event);};
    enter('mouse');assert.equal(tool.classList.contains('is-tool-hover'),true,`${selector} enters hover state`);
    assert.equal(dom.window.getComputedStyle(circle).stroke,'rgb(22, 163, 74)',`${selector} gets the green outline`);
    assert.equal(dom.window.getComputedStyle(circle).strokeWidth,'2',`${selector} outline is visibly thicker`);
    tool.dispatchEvent(new dom.window.Event('pointerleave'));assert.equal(tool.classList.contains('is-tool-hover'),false,`${selector} clears hover state`);
    enter('pen');assert.equal(tool.classList.contains('is-tool-hover'),true,`${selector} also responds to pen hover`);
    tool.dispatchEvent(new dom.window.Event('pointerleave'));enter('touch');assert.equal(tool.classList.contains('is-tool-hover'),false,`${selector} ignores touch compatibility hover`);
  }
  dom.window.close();
});
test('selection renders only two endpoint handles and no rectangular selection or Line badge',()=>{
  const dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${controls.render([{x:0,y:0},{x:100,y:0}],3,2)}</svg>`),svg=dom.window.document.querySelector('svg');
  assert.equal(svg.querySelectorAll('[data-handle]').length,2);assert.equal(svg.querySelector('.sel'),null);assert.equal(svg.querySelector('.selection-tag'),null);
  assert.deepEqual([...svg.querySelectorAll('[data-line-action]')].map(n=>n.dataset.command),['lock','duplicate','delete']);
  assert.equal(svg.querySelector('[data-command="more"]'),null);
  assert.equal(svg.querySelector('.line-controls rect[width="108"]')?.getAttribute('height'),'36');
  assert.equal(svg.querySelectorAll('.rotation-hit,.line-move-hit').length,2);
});
test('control size stays fixed in screen pixels across zoom levels',()=>{
  for(const zoom of [.5,1,4,12]){const markup=controls.render([{x:20,y:30},{x:60,y:30}],0,zoom);assert.ok(markup.includes(`scale(${1/zoom})`));assert.ok(markup.includes('width="108" height="36"'));}
});
test('Reset appears only after modifying an existing object, not on initial placement or a plain click',()=>{
  const fresh=harness();assert.equal(fresh.window.TransformHistory.has(fresh.element),false);fresh.start('move',null,150,100,true);fresh.move(160,110);fresh.up(160,110);assert.equal(fresh.window.TransformHistory.has(fresh.element),false);
  const click=harness();click.start('resize','line-end',200,100);click.up(200,100);assert.equal(click.window.TransformHistory.has(click.element),false);
  const edited=harness(),before=structuredClone(edited.element);edited.start('resize','line-end',200,100);edited.move(240,150);edited.up(240,150);assert.equal(edited.window.TransformHistory.has(edited.element),true);assert.equal(JSON.stringify(edited.window.TransformHistory.take(edited.element)[0].before),JSON.stringify(before));
});
test('Reset SVG is conditional and positioned next to the move control',()=>{
  const points=[{x:0,y:0},{x:100,y:0}],plain=new JSDOM(`<svg>${controls.render(points,0,1)}</svg>`),edited=new JSDOM(`<svg>${controls.render(points,0,1,false,{showReset:true})}</svg>`);
  assert.equal(plain.window.document.querySelector('[data-command="reset"]'),null);const reset=edited.window.document.querySelector('[data-command="reset"]');assert.ok(reset);assert.equal(reset.getAttribute('aria-label'),'Reset to previous');assert.ok(reset.querySelector('path'));
});
test('pictures and text reuse floating actions without line endpoint handles',()=>{
  for(const kind of ['picture','text']){const dom=new JSDOM(`<svg>${controls.render([{x:10,y:20},{x:70,y:80}],2,3,false,{showEndpoints:false,kind})}</svg>`),svg=dom.window.document.querySelector('svg');
    assert.equal(svg.querySelectorAll('[data-handle]').length,0);assert.equal(svg.querySelectorAll('[data-line-action]').length,3);assert.equal(svg.querySelector('[data-command="more"]'),null);assert.ok(svg.querySelector(`[aria-label="Rotate ${kind}"]`));assert.ok(svg.querySelector(`[aria-label="Move ${kind}"]`));assert.equal(svg.querySelector('[data-command="comment"]'),null);
  }
});
test('locked lines keep toolbar but disable endpoint dragging, movement and rotation',()=>{
  const dom=new JSDOM(`<svg>${controls.render([{x:0,y:0},{x:100,y:0}],0,1,true)}</svg>`);assert.equal(dom.window.document.querySelectorAll('.handle-hit,.rotation-hit,.line-move-hit').length,0);assert.ok(dom.window.document.querySelector('[aria-label="Unlock line"]'));
  const h=harness();h.element.locked=true;h.start('resize','line-end',200,100);h.move(250,150);samePoints(h.points(),[{x:100,y:100},{x:200,y:100}]);
});
test('actual endpoint drag follows mouse vertically without changing stroke or fixed endpoint',()=>{
  const h=harness();h.start('resize','line-end',200,100);h.move(160,180);h.up(160,180);samePoints(h.points(),[{x:100,y:100},{x:160,y:180}]);near(h.element.thickness_mm,.3);
});
test('actual start-endpoint drag and Shift angle snapping preserve opposite endpoint',()=>{
  const h=harness();h.start('resize','line-start',100,100);h.move(150,160,{shiftKey:true});const p=h.points();samePoints([p[1]],[{x:200,y:100}]);near(Math.abs(p[0].x-p[1].x),Math.abs(p[0].y-p[1].y));
});
test('actual rotation preserves midpoint and length',()=>{
  const h=harness();h.start('rotate','rotate',150,150);h.move(100,100,{altKey:true});h.up(100,100);samePoints(h.points(),[{x:150,y:50},{x:150,y:150}]);
});
test('actual movement translates both endpoints and right-click reset restores complete original state',()=>{
  const h=harness(),before=structuredClone(h.element);h.start('move',null,150,100);h.move(157,109);h.up(157,109);samePoints(h.points(),[{x:107,y:109},{x:207,y:109}]);
  const r=harness();r.start('resize','line-end',200,100);r.move(240,150);const reset=r.window.pauseEditorTransform();r.move(900,900);reset();assert.equal(JSON.stringify(r.context.editing.elements[0]),JSON.stringify(before));
});
test('moving a placed diagonal line preserves its angle and both endpoints before and after commit',()=>{
  const start={x:100,y:80},end={x:180,y:160},h=harness([start,end]),before=h.points(),angle=h.element.rotation_deg;
  samePoints(before,[start,end]);
  h.start('move',null,140,120);h.move(147,129);samePoints(h.points(),[{x:before[0].x+7,y:before[0].y+9},{x:before[1].x+7,y:before[1].y+9}]);
  near(h.element.rotation_deg,angle);h.up(147,129);samePoints(h.points(),[{x:before[0].x+7,y:before[0].y+9},{x:before[1].x+7,y:before[1].y+9}]);near(h.element.rotation_deg,angle);
});
test('floating toolbar actions run once, support keyboard lock, and omit the unused More action',()=>{
  const dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${controls.render([{x:100,y:100},{x:200,y:100}],0,1)}</svg>`),window=dom.window,svg=window.document.querySelector('svg'),element={type:'line'},calls=[];
  window.prompt=()=> 'Review this line';
  const context={window,document:window.document,MouseEvent:window.MouseEvent,editing:{elements:[element]},editorSelection:new Set([0]),editorSel:0,
    selectElement:()=>{},duplicateSelectedElement:()=>calls.push('duplicate'),deleteSelectedElement:()=>calls.push('delete'),pushSnapshot:()=>{},touchEditor:()=>{},renderEditorElements:()=>{},drawEditorCanvas:()=>{},startDrag:()=>{}};
  vm.createContext(context);const source=fs.readFileSync(require.resolve('../gui/renderer.js'),'utf8');vm.runInContext(source.slice(source.indexOf('function bindLineSelectionControls('),source.indexOf('function attachCanvasHandlers()')),context);
  context.bindLineSelectionControls(svg);context.bindLineSelectionControls(svg);
  for(const command of ['duplicate','delete'])svg.querySelector(`[data-command="${command}"]`).dispatchEvent(new window.MouseEvent('pointerdown',{bubbles:true,button:0}));
  assert.equal(svg.querySelector('[data-command="comment"]'),null);assert.deepEqual(calls,['duplicate','delete']);
  svg.querySelector('[data-command="lock"]').dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(element.locked,true);
  let menus=0;svg.addEventListener('contextmenu',()=>menus++);assert.equal(svg.querySelector('[data-command="more"]'),null);assert.equal(menus,0);
});
test('Reset pointerdown restores the last transform even when object identity changes',()=>{
  const history=require('../gui/transform-history').create();
  const before={type:'text',x_mm:4,y_mm:5,text_scale_x:1},after={type:'text',x_mm:10,y_mm:12,text_scale_x:2};
  const current={...after};
  history.remember([{element:after,index:0,before}]);
  const dom=new JSDOM(`<svg xmlns="http://www.w3.org/2000/svg">${controls.render([{x:0,y:0},{x:20,y:10}],0,1,false,{showEndpoints:false,kind:'text',showReset:true})}</svg>`),window=dom.window,svg=window.document.querySelector('svg');
  const context={window,document:window.document,MouseEvent:window.MouseEvent,structuredClone,editing:{elements:[current]},editorSelection:new Set([0]),editorSel:0,
    selectElement:()=>{},pushSnapshot:()=>{},touchEditor:()=>{},updateUndoButtons:()=>{},renderEditorElements:()=>{},drawEditorCanvas:()=>{},startDrag:()=>{}};
  window.TransformHistory=history;
  vm.createContext(context);const source=fs.readFileSync(require.resolve('../gui/renderer.js'),'utf8');vm.runInContext(source.slice(source.indexOf('function bindLineSelectionControls('),source.indexOf('function attachCanvasHandlers()')),context);
  context.bindLineSelectionControls(svg);
  svg.querySelector('[data-command="reset"]').dispatchEvent(new window.MouseEvent('pointerdown',{bubbles:true,button:0}));
  assert.deepEqual(context.editing.elements[0],before);
  assert.equal(history.has(context.editing.elements[0],0),false);
});
