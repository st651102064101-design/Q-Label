'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {refreshSelectionPresentation}=require('../gui/editor-selection-render');
const fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');

function selectionUpdateAfterCanvasRedraw(nextSelection){
  const dom=new JSDOM('<svg><g data-editor-overlay="0" class="is-selected"><rect class="hit"/><rect class="sel"/><g class="line-controls"/></g><g data-editor-overlay="1"><rect class="hit"/></g></svg>');
  const svg=dom.window.document.querySelector('svg');
  svg._editorBoxes=[{index:0},{index:1}];
  const source=fs.readFileSync(require.resolve('../gui/renderer.js'),'utf8');
  const start=source.indexOf('function updateCanvasSelection(){'),end=source.indexOf('\nfunction bindOverlayHandlePointerDown(',start);
  assert.ok(start>=0&&end>start);
  const context={liveOverlay:()=>svg,editorSelectionIndices:()=>new Set(nextSelection),editorSel:nextSelection.at(-1)??-1,editorSelectionChromeKey:'',editing:{elements:[{},{}]},
    clearEditorOverlayChrome:group=>group.querySelectorAll('.sel,.line-controls').forEach(node=>node.remove()),
    refitBoxForSelectionChrome:box=>box,paintEditorOverlayChrome:box=>{const group=svg.querySelector(`[data-editor-overlay="${box.index}"]`);group.classList.add('is-selected');group.insertAdjacentHTML('beforeend','<rect class="sel"/><g class="line-controls"/>');},
    updateMultiSelectionFrame:()=>{},bindLineSelectionControls:()=>{},bindOverlayHandlePointerDown:()=>{},refreshObjectTools:()=>{},document:dom.window.document,Event:dom.window.Event};
  vm.runInNewContext(source.slice(start,end)+'\nupdateCanvasSelection();',context);
  return svg;
}

test('blank click clears selection chrome that was drawn before the selection cache was initialized',()=>{
  const svg=selectionUpdateAfterCanvasRedraw([]),previous=svg.querySelector('[data-editor-overlay="0"]');
  assert.equal(previous.classList.contains('is-selected'),false);
  assert.equal(previous.querySelector('.sel,.line-controls'),null);
});

test('selecting another object removes old canvas chrome after a redraw',()=>{
  const svg=selectionUpdateAfterCanvasRedraw([1]);
  assert.equal(svg.querySelector('[data-editor-overlay="0"].is-selected'),null);
  assert.ok(svg.querySelector('[data-editor-overlay="1"].is-selected .sel'));
});

test('repeated Text select and deselect refreshes only selection UI when one overlay is available',()=>{
  let inspectorRenders=0,syncRenders=0,selectionUpdates=0,fullCanvasDraws=0;
  const change=()=>refreshSelectionPresentation({
    renderInspector:()=>inspectorRenders++,
    syncInspector:()=>syncRenders++,
    updateCanvasSelection:()=>{selectionUpdates++;return true;},
    drawCanvas:()=>fullCanvasDraws++,
  });
  assert.deepEqual([change(),change(),change(),change()],Array(4).fill('selection-only'));
  assert.equal(inspectorRenders,0);
  assert.equal(syncRenders,4);
  assert.equal(selectionUpdates,4);
  assert.equal(fullCanvasDraws,0,'selection toggles do not rerender the canvas artwork');
});

test('light selection path updates canvas chrome before inspector sync',()=>{
  const order=[];
  refreshSelectionPresentation({
    syncInspector:()=>order.push('sync'),
    renderInspector:()=>order.push('full'),
    updateCanvasSelection:()=>{order.push('canvas');return true;},
  });
  assert.deepEqual(order,['canvas','sync']);
});

test('selection changes fall back to a full canvas render when the overlay cannot be updated',()=>{
  let draws=0;
  const result=refreshSelectionPresentation({updateCanvasSelection:()=>false,drawCanvas:()=>draws++});
  assert.equal(result,'full-canvas');
  assert.equal(draws,1);
});

test('multi-selection can stay on the light canvas path when overlay update succeeds',()=>{
  let draws=0,syncs=0;
  const result=refreshSelectionPresentation({allowLightCanvas:true,syncInspector:()=>syncs++,updateCanvasSelection:()=>true,drawCanvas:()=>draws++});
  assert.equal(result,'selection-only');
  assert.equal(syncs,1);
  assert.equal(draws,0);
});
