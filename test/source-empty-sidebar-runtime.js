'use strict';
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-empty-sidebar-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_event,win)=>win.webContents.once('did-finish-load',async()=>{try{
 const result=await win.webContents.executeJavaScript(`(async()=>{while(appInitializing)await new Promise(r=>setTimeout(r,30));hideProjectHome();autoSaveEnabled=false;editing={elements:[],data_sources:{}};DataSourcesUI.render();const group=()=>document.querySelector('#sidebarDataFields [data-group="Embedded Data"]');const arrow=()=>getComputedStyle(group().querySelector('summary'),'::before').visibility;const empty={arrow:arrow(),open:group().open,none:document.querySelectorAll('#sidebarDataFields .source-empty').length,add:!!group().querySelector('.source-add')};editing.data_sources.zero={type:'constant',value:0};DataSourcesUI.render();const populated=!!group().querySelector('[data-source-field="zero"]')&&arrow()==='visible';group().open=true;delete editing.data_sources.zero;DataSourcesUI.render();return {empty,populated,collapsed:!group().open};})()`);
 assert.deepEqual(result,{empty:{arrow:'hidden',open:false,none:0,add:true},populated:true,collapsed:true});console.log('PASS empty sidebar Electron '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
 }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}}));require('../gui/main');
