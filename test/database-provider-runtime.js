'use strict';
const {app,dialog}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-db-provider-runtime-'));app.setPath('appData',dir);
const profile=path.join(dir,'Bratender');fs.mkdirSync(path.join(profile,'templates'),{recursive:true});
fs.writeFileSync(path.join(profile,'templates','fixture.json'),JSON.stringify({name:'Provider fixture',width_mm:50,height_mm:30,dpi:203,elements:[]}));
fs.writeFileSync(path.join(profile,'settings.json'),JSON.stringify({lastTemplate:'fixture.json',autoSaveEnabled:false}));
const type=process.argv.includes('--import')?'import':process.argv.includes('--builder')?'builder':process.argv.includes('--xml')?'xml':process.argv.includes('--json')?'json':'text',builder=type==='builder',column=builder?'Field1':'id';
const nativeFixture=builder?fs.readFileSync(path.join(__dirname,'fixtures/databuilder/native-text.btdb'),'utf8'):null;
function fixtureContent(id,name){
 if(type==='import')return JSON.stringify({format:'ZebraBarConnection',version:1,connection:{tables:[{name:'Products',columns:['id','name'],rows:[{id,name}]}]}});
 if(builder)return nativeFixture.replace('<Field1>001 Tea</Field1>',`<Field1>${id} ${name}</Field1>`);
 if(type==='xml')return `<records><record><id>${id}</id><name>${name}</name></record><record><id>999</id><name>Reference</name></record></records>`;
 if(type==='json')return JSON.stringify([{id,name}]);
 return `id,name\n${id},${name}`;
}
const file=path.join(dir,'records.'+({import:'json',builder:'btdb',xml:'xml',json:'json',text:'csv'}[type]));fs.writeFileSync(file,fixtureContent('001','Tea'));
dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});
const timer=setTimeout(()=>{console.error('Database provider runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_event,win)=>{win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{try{
 const initial=await win.webContents.executeJavaScript(`(async()=>{while(appInitializing)await new Promise(r=>setTimeout(r,25));hideProjectHome();autoSaveEnabled=false;editing={name:'Provider fixture',width_mm:50,height_mm:30,dpi:203,elements:[],data_sources:{}};current={file:'fixture.json'};refreshEditorUI();DatabaseSetupUI.open();const d=document.getElementById('databaseSetupDialog');for(const selector of ['[data-type=${type}]','.db-next','.db-native-browse']){const button=d.querySelector(selector);if(!button)throw Error('Missing '+selector+'; open='+d.open+'; editor='+!!editing+'; title='+d.querySelector('main').textContent);button.click();}for(let i=0;i<200&&(!d.querySelector('.db-source-results table')||d.querySelector('.db-next').disabled);i++)await new Promise(r=>setTimeout(r,20));const loaded=d.querySelector('.db-source-results').textContent;d.querySelector('.db-next').click();d.querySelector('.db-finish').click();for(let i=0;i<200&&d.open;i++)await new Promise(r=>setTimeout(r,20));return {loaded,closed:!d.open,rows:editing.database_connection?.rows,sourcePath:editing.database_connection?.sourcePath};})()`);
 assert.match(initial.loaded,/001/);assert.equal(initial.closed,true);assert.equal(initial.sourcePath,file);assert.equal(initial.rows[0][column],builder?'001 Tea':'001');if(!builder)assert.equal(initial.rows[0].name,'Tea');
 fs.writeFileSync(file,fixtureContent('002','Coffee'));
 const refreshed=await win.webContents.executeJavaScript(`(async()=>{DatabaseSetupUI.open();const d=document.getElementById('databaseManagerDialog');for(let i=0;i<300&&d.querySelector('[data-ok]').disabled;i++)await new Promise(r=>setTimeout(r,20));if(d.querySelector('[data-ok]').disabled)throw Error('Manager busy: '+d.querySelector('[role=alert]').textContent);d.querySelector('[aria-label="Refresh"]').click();while(d.querySelector('[data-ok]').disabled)await new Promise(r=>setTimeout(r,20));return {rows:editing.database_connection.rows,error:d.querySelector('[role=alert]').textContent};})()`);
 assert.equal(refreshed.error,'');assert.equal(refreshed.rows[0][column],builder?'002 Coffee':'002');if(!builder)assert.equal(refreshed.rows[0].name,'Coffee');
 const reopened=await win.webContents.executeJavaScript(`(async()=>{document.getElementById('databaseManagerDialog').close();current.editable=true;el('edName').value='Provider fixture';editorDirty=true;if(!await persistEditor(true))throw Error('Explicit label save failed');const savedFile=current.file;editing=null;const loaded=await window.zebra.loadTemplateRaw(savedFile);if(!loaded)throw Error('Saved label missing');openEditor(loaded);return {file:savedFile,rows:editing.database_connection?.rows,sourcePath:editing.database_connection?.sourcePath,fields:editing.database_connection?.fields,sources:editing.data_sources};})()`);
 assert.equal(reopened.sourcePath,file);assert.equal(reopened.rows[0][column],builder?'002 Coffee':'002');if(!builder)assert.equal(reopened.rows[0].name,'Coffee');assert.ok(Object.keys(reopened.fields).length>0);for(const key of Object.keys(reopened.fields))assert.ok(reopened.sources[key]);
 console.log('PASS '+type+' native picker → committed document connection → real file refresh → disk save/reopen');clearTimeout(timer);app.exit(0);
}catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});});
require('../gui/main');
