'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
function harness(){
 const dom=new JSDOM('<div class="ribbon-tabs"><button id="home" class="ribbon-tab">Home</button><button id="layout" class="ribbon-tab" aria-selected="true">Layout</button><button id="table" class="ribbon-tab" hidden>Table</button></div><div id="ribbon-table" hidden></div>');
 const d=dom.window.document,tableTab=d.getElementById('table'),tablePanel=d.getElementById('ribbon-table');
 for(const tab of d.querySelectorAll('.ribbon-tab'))tab.onclick=()=>{d.querySelectorAll('.ribbon-tab').forEach(b=>b.setAttribute('aria-selected',String(b===tab)));tablePanel.hidden=tab!==tableTab;};
 const tables=[{type:'image',table_model:{}},{type:'text'},{type:'image'},{type:'image',table_model:{}}];
 const context={document:d,Event:dom.window.Event,editing:{elements:tables},editorSel:1,editorSelection:new Set([0,1,2]),dialog:{open:false},tableTab,tablePanel,activeTable:null,priorTab:null,activeCell:null,selectedCells:new Set(),cellAnchor:null,buildTableRibbon:()=>{},paintTableSelection:()=>{},queueMicrotask:()=>{}};
 vm.createContext(context);
 const source=fs.readFileSync(require.resolve('../gui/table-tools'),'utf8'),start=source.indexOf("document.addEventListener('editor-selection-changed',()=>{");
 vm.runInContext(source.slice(start,source.indexOf("\nel('previewFrame').addEventListener",start)),context);
 return {dom,d,context,change:()=>d.dispatchEvent(new dom.window.Event('editor-selection-changed'))};
}
test('mixed table/text/picture selection preserves the existing ribbon tab and primary object',()=>{
 const h=harness();h.change();
 assert.equal(h.d.querySelector('[aria-selected="true"]').id,'layout');
 assert.equal(h.context.tablePanel.hidden,true);assert.equal(h.context.editorSel,1);
 h.context.editorSel=0;h.change();
 assert.equal(h.d.querySelector('[aria-selected="true"]').id,'layout','mixed selection stays on Layout even when the primary object is a table');
 assert.equal(h.context.tablePanel.hidden,true);assert.equal(h.context.editorSel,0);
 h.dom.window.close();
});
test('table-only selection auto-opens Table and mixed selection restores the previous tab after switching tables',()=>{
 const h=harness(),c=h.context;c.editorSelection=new Set([0,3]);c.editorSel=3;h.change();
 assert.equal(h.d.querySelector('[aria-selected="true"]').id,'table');
 assert.equal(c.priorTab.id,'layout');
 c.editorSelection=new Set([0]);c.editorSel=0;h.change();
 assert.equal(c.priorTab.id,'layout','switching tables must not replace the remembered normal tab with Table');
 c.editorSelection=new Set([0,1,2]);c.editorSel=1;h.change();
 assert.equal(h.d.querySelector('[aria-selected="true"]').id,'layout');assert.equal(c.tablePanel.hidden,true);
 h.dom.window.close();
});
test('empty and text-only selections do not open Table',()=>{
 const h=harness(),c=h.context;c.editorSelection=new Set([1]);c.editorSel=1;h.change();
 assert.equal(h.d.querySelector('[aria-selected="true"]').id,'layout');
 c.editorSelection.clear();c.editorSel=-1;h.change();
 assert.equal(h.d.querySelector('[aria-selected="true"]').id,'layout');assert.equal(c.tableTab.hidden,true);
 h.dom.window.close();
});
