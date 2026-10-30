'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function fixture() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="host"></div></body></html>', { pretendToBeVisual: true, runScripts: 'outside-only' });
  const { window } = dom;
  window.editorSelection = new Set([0]);
  window.editorSel = 0;
  window.editing = { elements: [{}] };
  window.LayerOrder = { reorder: () => ({ changed: false }) };
  const source = fs.readFileSync(path.join(__dirname, '../gui/layer-manager.js'), 'utf8');
  window.eval(source);
  const host = window.document.querySelector('#host');
  window.LayerManager.addMenuItem(host);
  return { dom, host, submenu: window.document.querySelector('.ql-layer-submenu') };
}

test('object context Layer submenu opens on hover without a click and remains open on click', () => {
  const { dom, host, submenu } = fixture();
  const trigger = host.querySelector('[aria-haspopup="menu"]');
  trigger.click();
  assert.equal(submenu.hidden, true, 'click alone does not open the nested menu');
  trigger.dispatchEvent(new dom.window.Event('pointerenter'));
  assert.equal(submenu.hidden, false, 'hover opens the nested menu');
  trigger.click();
  assert.equal(submenu.hidden, false, 'clicking the hovered trigger does not close the nested menu');
});

test('enabled layer choices preview on hover, restore on leave or close, and commit only on click', () => {
  const dom=new JSDOM('<!doctype html><body><div id="host"></div></body>',{pretendToBeVisual:true,runScripts:'outside-only'}),w=dom.window;
  w.editorSelection=new Set([1]);w.editorSel=1;w.editing={elements:['A','B','C','D']};
  w.LayerOrder=require('../gui/layer-order');const previews=[];let restores=0,commits=0;
  w.previewLayerOrder=action=>previews.push(action);w.clearLayerOrderPreview=()=>restores++;
  w.readEditorIntoDraft=()=>{};w.pushSnapshot=()=>{commits++};w.renderEditorElements=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.updateUndoButtons=()=>{};
  w.eval(fs.readFileSync(path.join(__dirname,'../gui/layer-manager.js'),'utf8'));
  w.LayerManager.addMenuItem(w.document.getElementById('host'));w.document.querySelector('#host button').dispatchEvent(new w.Event('pointerenter'));
  const menu=w.document.querySelector('.ql-layer-submenu'),items=[...menu.querySelectorAll('button')].slice(0,4);
  for(const [i,action] of ['front','forward','backward','back'].entries()){
    items[i].dispatchEvent(new w.Event('pointerenter'));assert.equal(previews.at(-1),action);assert.deepEqual([...w.editing.elements],['A','B','C','D']);assert.equal(commits,0);
    items[i].dispatchEvent(new w.Event('pointerleave'));assert.ok(restores>i);
  }
  items[0].dispatchEvent(new w.Event('pointerenter'));w.LayerManager.closeMenu();assert.ok(restores>=5);
  w.document.querySelector('#host button').dispatchEvent(new w.Event('pointerenter'));menu.querySelector('button').click();assert.deepEqual([...w.editing.elements],['A','C','D','B']);assert.equal(commits,1);
  dom.window.close();
});
