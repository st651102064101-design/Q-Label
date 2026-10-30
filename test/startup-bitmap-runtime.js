'use strict';
const {app}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const testData=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-startup-bitmap-'));
app.setPath('appData',testData);
const profile=path.join(testData,'Bratender');fs.mkdirSync(path.join(profile,'templates'),{recursive:true});
const template={name:'Damaged bitmap fixture',width_mm:50,height_mm:30,dpi:203,values:{},elements:[{type:'image',x_mm:3,y_mm:4,width_mm:12,height_mm:8},{type:'box',x_mm:20,y_mm:5,width_mm:8,height_mm:6}]};
fs.writeFileSync(path.join(profile,'templates','damaged.json'),JSON.stringify(template));
fs.writeFileSync(path.join(profile,'settings.json'),JSON.stringify({lastTemplate:'damaged.json',autoSaveEnabled:false,history:[{ts:new Date().toISOString(),count:1,templateName:'Damaged history fixture',payload:{template}}]}));
const timer=setTimeout(()=>{console.error('Startup bitmap runtime timed out');app.exit(1);},30000);
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{try{
    const result=await win.webContents.executeJavaScript(`(async()=>{while(appInitializing)await new Promise(r=>setTimeout(r,25));const result={error:document.querySelector('.workspace-startup-error-detail')?.textContent||'',placeholder:!!document.querySelector('#previewFrame [data-invalid-bitmap]'),historyPlaceholder:!!document.querySelector('#historyList [data-invalid-bitmap]'),other:!!document.querySelector('#previewFrame [data-label-element="1"]'),unchanged:editing.elements[0].bitmap_hex===undefined};const overlay=StartupErrorUI.show(new Error('Runtime icon fixture'),document),button=overlay.querySelector('button'),svg=button.querySelector('svg'),rect=svg?.getBoundingClientRect();result.reloadIconVisible=!!rect&&rect.width>=16&&rect.height>=16&&getComputedStyle(svg).stroke==='rgb(255, 255, 255)'&&getComputedStyle(button).backgroundColor==='rgb(22, 163, 74)';overlay.remove();return result;})()`);
    assert.equal(result.error,'');assert.equal(result.placeholder,true);assert.equal(result.historyPlaceholder,true);assert.equal(result.other,true);assert.equal(result.unchanged,true);assert.equal(result.reloadIconVisible,true);
    console.log('PASS full startup with a saved image missing bitmap data: '+JSON.stringify(result));
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});
});
require('../gui/main');
