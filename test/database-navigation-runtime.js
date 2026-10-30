'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-db-navigation-'));app.setPath('appData',dir);
const profile=path.join(dir,'Bratender');fs.mkdirSync(path.join(profile,'templates'),{recursive:true});
fs.writeFileSync(path.join(profile,'templates','fixture.json'),JSON.stringify({name:'Navigation fixture',width_mm:50,height_mm:30,dpi:203,elements:[]}));
fs.writeFileSync(path.join(profile,'settings.json'),JSON.stringify({lastTemplate:'fixture.json',autoSaveEnabled:false}));
const timer=setTimeout(()=>{console.error('Database navigation runtime timed out');app.exit(1);},30000);
app.on('browser-window-created',(_event,win)=>{win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{try{
  const result=await win.webContents.executeJavaScript(`(async()=>{while(appInitializing)await new Promise(r=>setTimeout(r,25));hideProjectHome();DatabaseSetupUI.open();const d=document.getElementById('databaseSetupDialog'),next=d.querySelector('.db-next'),back=d.querySelector('.db-back');d.querySelector('[data-type=text]').click();await new Promise(r=>setTimeout(r,50));const svg=next.querySelector('svg'),r=svg?.getBoundingClientRect(),before=!!r&&r.width===16&&r.height===16&&getComputedStyle(svg).stroke==='rgb(255, 255, 255)'&&svg.dataset.icon==='arrow-right';next.click();const backWorks=!back.disabled;back.click();return {nextVisible:before,backWorks,backIcon:back.querySelector('svg')?.dataset.icon,returned:d.querySelector('h2').textContent==='Choose your data source',nextIconCount:next.querySelectorAll('svg').length};})()`);
  assert.equal(result.nextVisible,true);assert.equal(result.backWorks,true);assert.equal(result.backIcon,'arrow-left');assert.equal(result.returned,true);assert.equal(result.nextIconCount,1);
  console.log('PASS '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
}catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});});
require('../gui/main');
