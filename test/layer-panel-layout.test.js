'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
test('Layers occupies workspace layout space and releases it when closed',()=>{
 const dom=new JSDOM('<body><main class="main"><div class="preview-pane"></div></main></body>',{runScripts:'outside-only'}),w=dom.window;
 Object.assign(w,{editing:{elements:[]},editorSelection:new Set(),editorSel:-1});w.eval(fs.readFileSync(require.resolve('../gui/layer-manager.js'),'utf8'));
 const panel=w.document.querySelector('.ql-layer-panel');w.LayerManager.show();assert.equal(panel.hidden,false);assert.equal(panel.parentElement,w.document.querySelector('.main'));
 assert.equal(w.getComputedStyle(panel).position,'relative');assert.equal(w.getComputedStyle(panel).flexShrink,'0');
 panel.querySelector('[aria-label="Close layers"]').click();assert.equal(panel.hidden,true);w.LayerManager.show();assert.equal(panel.hidden,false);w.close();
});
