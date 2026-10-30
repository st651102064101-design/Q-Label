'use strict';
const {app,ipcMain,dialog}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-server-dsn-runtime-'));app.setPath('appData',directory);
const profile=path.join(directory,'Bratender');fs.mkdirSync(path.join(profile,'templates'),{recursive:true});
fs.writeFileSync(path.join(profile,'templates','fixture.json'),JSON.stringify({name:'DSN runtime',width_mm:50,height_mm:30,dpi:203,elements:[]}));
fs.writeFileSync(path.join(profile,'settings.json'),JSON.stringify({lastTemplate:'fixture.json',autoSaveEnabled:false}));
const fixtures=[['firebird','Firebird ODBC Driver'],['db2','IBM DB2 ODBC DRIVER'],['informix','IBM INFORMIX ODBC DRIVER'],['mysql','MySQL ODBC 8.4 Unicode Driver'],['mariadb','MariaDB ODBC 3.2 Driver'],['postgresql','PostgreSQL Unicode(x64)'],['sap-hana','HDBODBC']];
let inspections=0,reads=0,done=false;
function finish(error){if(done)return;done=true;clearTimeout(timer);if(error){console.error(error.stack||error);console.error(JSON.stringify({inspections,reads}));}else console.log('PASS seven DSN wizard types → production IPC/provider → committed fields → refresh; controlled driver responses');app.exit(error?1:0);}
const timer=setTimeout(()=>finish(Error('DSN runtime timed out')),90000);
app.on('browser-window-created',(_event,win)=>{win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{try{
 const results=await win.webContents.executeJavaScript(`(async()=>{
  while(appInitializing)await new Promise(r=>setTimeout(r,25));hideProjectHome();autoSaveEnabled=false;
  const results=[];for(const id of ${JSON.stringify(fixtures.map(x=>x[0]))}){
   editing={name:'DSN '+id,width_mm:50,height_mm:30,dpi:203,elements:[],data_sources:{}};current={file:'fixture.json'};refreshEditorUI();DatabaseSetupWizardUI.open();
   let stage='detect';const d=document.getElementById('databaseSetupDialog');const wait=async predicate=>{for(let i=0;i<300;i++){if(predicate())return;await new Promise(r=>setTimeout(r,20));}const c=document.querySelector('.dbm-credentials'),m=document.getElementById('databaseManagerDialog');throw Error('Timed out on '+id+' at '+stage+': '+JSON.stringify({wizard:d.querySelector('.db-error').textContent,manager:m?.querySelector('[role=alert]')?.textContent,credentialExists:!!c,credentialOpen:c?.open,busy:m?.querySelector('[data-ok]')?.disabled}));};
   await wait(()=>!d.querySelector('[data-type="'+id+'"]').disabled);d.querySelector('[data-type="'+id+'"]').click();d.querySelector('.db-next').click();
   const ds=d.querySelector('[name=dsn]');ds.value=id;ds.dispatchEvent(new Event('change'));d.querySelector('[name=password]').value='fixture-secret';d.querySelector('[name=password]').dispatchEvent(new Event('input'));
   stage='connect';d.querySelector('.db-next').click();await wait(()=>!!d.querySelector('.db-fields')&&!d.querySelector('.db-finish').disabled);stage='commit';d.querySelector('.db-finish').click();await wait(()=>!d.open);
   if(JSON.stringify(editing).includes('fixture-secret'))throw Error('Password persisted');
   stage='manager';const before=editing.database_connection.rows[0].id;DatabaseSetupUI.open();const manager=document.getElementById('databaseManagerDialog');await wait(()=>!manager.querySelector('[data-ok]').disabled);stage='password';manager.querySelector('[aria-label="Refresh"]').click();await wait(()=>!!document.querySelector('.dbm-credentials'));
   const prompt=document.querySelector('.dbm-credentials');prompt.querySelector('input').value='fixture-secret';stage='refresh';prompt.querySelector('form').requestSubmit();await wait(()=>!manager.querySelector('[data-ok]').disabled&&!document.querySelector('.dbm-credentials'));
   if(manager.querySelector('[role=alert]').textContent)throw Error(manager.querySelector('[role=alert]').textContent);
   results.push({type:editing.database_connection.type,dsn:editing.database_connection.providerOptions.dsn,before,after:editing.database_connection.rows[0].id,secret:JSON.stringify(editing).includes('fixture-secret')});manager.close();
  }return results;
 })()`);
 assert.equal(results.length,7);for(let i=0;i<results.length;i++){const r=results[i];assert.equal(r.type,fixtures[i][0]);assert.equal(r.dsn,r.type);assert.notEqual(r.before,r.after);assert.equal(r.secret,false);}
 assert.ok(inspections>=1);assert.ok(reads>=21);console.log(JSON.stringify({types:results.map(r=>r.type),inspections,reads}));finish();
 }catch(error){finish(error);}});});
require('../gui/main');
for(const name of ['detect','list-databases','pick-connection-file','pick','open','schema','read','refresh','dispose'])ipcMain.removeHandler('database-'+name);
const {createProviderRegistry}=require('../lib/database/provider-registry');
const registry=createProviderRegistry({platform:'win32',inspectWindowsProviders:async()=>{inspections++;return {drivers:fixtures.map(x=>x[1]),dataSources:fixtures.map(x=>({name:x[0],driver:x[1],type:'User'}))};},readWindowsDatabase:async(_type,config)=>{assert.equal(config.password,'fixture-secret');return [{name:'Orders',columns:['id','name'],rows:[{id:String(++reads),name:config.dsn}]}];}});
require('../gui/database-ipc').registerDatabaseIpc({ipcMain,dialog,registry});
