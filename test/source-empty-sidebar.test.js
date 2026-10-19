'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
test('empty sidebar groups collapse without None rows and recover when populated',()=>{
 const dom=new JSDOM('<div id="sidebarDataFields"></div>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 try{
 w.editing={data_sources:{},elements:[]};w.settings={};w.ResizeObserver=class{observe(){} disconnect(){}};w.placeholderNames=()=>[];
 w.eval(fs.readFileSync(require.resolve('../gui/data-sources'),'utf8'));
 const embedded=()=>w.document.querySelector('[data-group="Embedded Data"]');
 assert.equal(w.document.querySelectorAll('.source-empty').length,0);
 assert.equal(embedded().open,false);assert.ok(embedded().querySelector('.source-add'));
 w.editing.data_sources.zero={type:'constant',value:0};w.DataSourcesUI.render();
 assert.equal(embedded().querySelector('.source-item').dataset.sourceField,'zero');
 embedded().open=true;w.DataSourcesUI.render();assert.equal(embedded().open,true);
 delete w.editing.data_sources.zero;w.DataSourcesUI.render();
 assert.equal(embedded().open,false);assert.equal(w.document.querySelectorAll('.source-empty').length,0);
 }finally{dom.window.close();}
});
