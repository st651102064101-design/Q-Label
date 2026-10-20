'use strict';
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-named-delete-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_event,win)=>win.webContents.once('did-finish-load',async()=>{try{
 const result=await win.webContents.executeJavaScript(`(async()=>{
   while(appInitializing)await new Promise(r=>setTimeout(r,30));
   hideProjectHome();autoSaveEnabled=false;
   window.confirmAction=async()=>true;persistEditor=async()=>{};readEditorIntoDraft=()=>{};
   renderEditorValues=()=>{};updateEditorPreview=()=>{};
   const fixture=()=>SourceModel.migrate({elements:[{type:'text',text:'{{Lot}}'}],data_sources:{Lot:{type:'constant',value:'OLD',category:'Named Data Sources'}},values:{Lot:'OLD'}});
   const check=()=>({sidebar:!!document.querySelector('[data-source-field="Lot"]'),named:Object.values(editing.sourceDefinitions).some(s=>s.name==='Lot'),text:SourceResolver.evaluateDocument(editing).objects[editing.elements[0].id].text,value:editing.values.Lot??null});
   editing=fixture();DataSourcesUI.render();
   document.querySelector('[data-source-field="Lot"]').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,clientX:50,clientY:100}));
   document.querySelector('.source-context-menu [data-action="delete"]').click();await new Promise(r=>setTimeout(r,80));const sidebar=check();
   editing=fixture();DataSourcesUI.render();DataSourcesUI.open('Named Data Sources','Lot');document.querySelector('#dataSourceDialog .delete').click();await new Promise(r=>setTimeout(r,80));const dialog=check();
   return {sidebar,dialog};
 })()`);
 const expected={sidebar:false,named:false,text:'',value:null};assert.deepEqual(result,{sidebar:expected,dialog:expected});
 console.log('PASS named source deletion Electron '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
 }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}}));require('../gui/main');
