'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const QRCode = require('qrcode');
const vm = require('node:vm');

function previewWindow() {
  const dom = new JSDOM('', { runScripts: 'outside-only' });
  const w = dom.window;
  for (const file of ['object-data', 'preview']) {
    w.eval(fs.readFileSync(require.resolve(`../gui/${file}`), 'utf8'));
  }
  return { dom, w };
}

test('empty Data Matrix uses a sample in editor but does not print it',()=>{
  const {dom,w}=previewWindow();
  const template={width_mm:60,height_mm:30,elements:[{type:'datamatrix',x_mm:3,y_mm:3,magnification:3,text:''}]};
  const cache={'dm: ':'data:image/png;base64,fixture'};
  const editor=w.LabelPreview.renderPreviewSVG(template,{},null,cache,{editorPlaceholders:true,mode:'design'});
  assert.match(editor,/href="data:image\/png;base64,fixture"/);
  assert.doesNotMatch(editor,/>DM<\/text>/);
  const print=w.LabelPreview.renderPreviewSVG(template,{},null,cache,{mode:'print'});
  assert.doesNotMatch(print,/data:image\/png;base64,fixture|>DM<\/text>/);
  dom.window.close();
});

test('Data Matrix preview requests sample data and retries a failed encode',async()=>{
  const {dom,w}=previewWindow();w.qrCache={};let attempts=0;
  w.zebra={dmImage:async()=>++attempts===1?'':'data:image/png;base64,fixture'};
  const renderer=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
  w.eval(renderer.slice(renderer.indexOf('function dmValuesOf('),renderer.indexOf('// Parser CSV'))+'\nwindow.dmValuesForTest=dmValuesOf;window.ensureQRForTest=ensureQR;');
  const tpl={elements:[{type:'datamatrix',text:''}]};
  assert.deepEqual(Array.from(w.dmValuesForTest(tpl,{},true)),[' ']);
  await w.ensureQRForTest([],null,[' ']);assert.equal(Object.hasOwn(w.qrCache,'dm: '),false);
  await w.ensureQRForTest([],null,[' ']);assert.equal(attempts,2);assert.equal(w.qrCache['dm: '],'data:image/png;base64,fixture');
  dom.window.close();
});

test('editor preview renders actual QR modules for two empty QR objects, without a QR text placeholder', () => {
  const { dom, w } = previewWindow();
  const matrix = QRCode.create(' ', { errorCorrectionLevel: 'M' });
  const cache = { ' ': { size: matrix.modules.size, data: Array.from(matrix.modules.data) } };
  const template = {
    width_mm: 60, height_mm: 30, dpi: 203,
    elements: [
      { type: 'qrcode', x_mm: 3, y_mm: 3, width_mm: 12, height_mm: 12 },
      { type: 'qrcode', x_mm: 24, y_mm: 3, width_mm: 12, height_mm: 12 },
    ],
  };

  const svg = w.LabelPreview.renderPreviewSVG(template, {}, [0, 1], cache, { editorPlaceholders: true });
  const objects = [...svg.matchAll(/<g data-label-element="\d+">([\s\S]*?)<\/g>/g)];
  assert.equal(objects.length, 2, 'both QR objects remain separate');
  assert.ok(objects.every(([_, markup]) => (markup.match(/fill="#111"/g) || []).length > 20), 'both objects contain encoded dark modules');
  assert.doesNotMatch(svg, />QR<\/text>/, 'design canvas does not substitute text for the QR symbol');

  const printSvg = w.LabelPreview.renderPreviewSVG(template, {}, [0, 1], cache, { mode: 'print' });
  assert.ok([...printSvg.matchAll(/<g data-label-element="\d+">([\s\S]*?)<\/g>/g)].every(([_, markup]) => markup === ''), 'an empty QR object does not print a fake/sample code');
  dom.window.close();
});

test('QR generation failures are not cached and the same QR payload is retried', async () => {
  const { dom, w } = previewWindow();
  w.qrCache = {};
  let attempts = 0;
  w.zebra = {
    qrMatrix: async () => ++attempts === 1 ? { size: 0, data: [] } : { size: 1, data: [1] },
    dmImage: async () => '',
  };
  const renderer = fs.readFileSync(require.resolve('../gui/renderer'), 'utf8');
  const start = renderer.indexOf('async function ensureQR(');
  const end = renderer.indexOf('// Parser CSV', start);
  assert.ok(start >= 0 && end > start, 'ensureQR source is available for isolated unit coverage');
  w.eval(`${renderer.slice(start, end)}\nwindow.ensureQRForTest = ensureQR;`);

  await w.ensureQRForTest(['retry-me']);
  assert.equal(Object.hasOwn(w.qrCache, 'retry-me'), false, 'failed generation does not leave a cached empty sentinel');
  await w.ensureQRForTest(['retry-me']);
  assert.equal(attempts, 2, 'a later render retries QR generation');
  assert.deepEqual({ ...w.qrCache['retry-me'] }, { size: 1, data: [1] });
  dom.window.close();
});

test('QR edge resize updates the square size and moving retains it', () => {
  const dom=new JSDOM('<div id="previewFrame"><svg xmlns="http://www.w3.org/2000/svg"><g data-label-element="0"></g><g data-editor-overlay="0"><rect class="sel"/></g></svg></div>');
  const w=dom.window,svg=w.document.querySelector('svg'),element={type:'qrcode',x_mm:20,y_mm:20,width_mm:20,text:'QR'};
  svg._editorBoxes=[{index:0,type:'qrcode',x:20,y:20,w:20,h:20}];svg.getScreenCTM=()=>null;
  w.EditHistory=require('../gui/edit-history');w.GestureGeometry=require('../gui/gesture-geometry');
  w.SvgSelectionHandles={counterScaleResizeControls:(controls,transform)=>controls.setAttribute('transform',transform),preserveResizeStrokes:()=>{},restoreResizeControlTransforms:()=>{},restoreResizeStrokes:()=>{}};
  w.FrameInput={create(apply){return{push:apply,flush:event=>{if(event)apply(event);}};}};
  w.ObjectDistanceGuides={bounds:b=>({left:b.x,top:b.y,right:b.x+b.w,bottom:b.y+b.h}),nearest:()=>null,draw:()=>{}};
  w.LabelPreview={computeBoxes:t=>t.elements.map((e,index)=>({index,x:e.x_mm,y:e.y_mm,w:e.width_mm,h:e.width_mm})),renderElement:()=>''};
  w.TransformHistory=require('../gui/transform-history').create();
  const context={window:w,document:w.document,el:id=>w.document.getElementById(id),structuredClone,performance,setTimeout,clearTimeout,DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}},editing:{dpi:203,width_mm:200,height_mm:200,elements:[element]},editorGrid:{snap:false},DesignGrid:require('../gui/design-grid'),editorSelection:new Set([0]),editorSel:0,undoStack:[],redoStack:[],previewPan:{x:0,y:0},liveOverlay:()=>svg,clientToMm:e=>({x:e.clientX,y:e.clientY}),selectionVisualBounds:b=>b,designPaperBounds:()=>({x:0,y:0,width:200,height:200,minX:0,minY:0}),sampleData:()=>({}),renderEditorElements:()=>{},drawEditorCanvas:()=>{},touchEditor:()=>{},updateUndoButtons:()=>{},flushPendingGestureRevision:()=>{},elementHandlesSVG:()=>'',objectOverflowsPaperShape:()=>false,activeObjectGesture:false,deferredGestureDraw:false,pendingGestureRevision:null,qrCache:{},snapEditorValue:v=>v};
  const source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function boxFromAnchor('),source.indexOf('// Restituisce',source.indexOf('function boxFromAnchor('))),context);
  vm.runInContext(source.slice(source.indexOf('function startDrag('),source.indexOf('let statusBadgeTimer;')),context);
  const pointer=(type,x,y)=>new w.MouseEvent(type,{clientX:x,clientY:y,button:0,buttons:1});
  context.startDrag(pointer('pointerdown',40,30),0,'resize','e');w.dispatchEvent(pointer('pointermove',50,30));
  assert.equal(element.width_mm,30,'dragging the east handle changes the QR square size');
  assert.equal(svg.querySelector('[data-label-element]').getAttribute('transform'),svg.querySelector('[data-editor-overlay]').getAttribute('transform'),'artwork and selection use the same live transform');
  w.dispatchEvent(pointer('pointerup',50,30));
  svg._editorBoxes=[{index:0,type:'qrcode',x:element.x_mm,y:element.y_mm,w:element.width_mm,h:element.width_mm}];
  context.startDrag(pointer('pointerdown',30,30),0,'move');w.dispatchEvent(pointer('pointermove',35,35));w.dispatchEvent(pointer('pointerup',35,35));
  assert.equal(element.width_mm,30,'moving does not reset the resized square');dom.window.close();
});
