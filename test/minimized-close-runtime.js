'use strict';
const {app,ipcMain}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-minimized-close-'));app.setPath('appData',profile);
const timer=setTimeout(()=>{console.error('Minimized close runtime timed out');app.exit(1);},90000);
app.on('browser-window-created',(_,win)=>{win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{
  const run=code=>win.webContents.executeJavaScript(code),wait=()=>new Promise(resolve=>setTimeout(resolve,150));
  try{
    await run(`(async()=>{while(appInitializing)await new Promise(r=>setTimeout(r,30));hideProjectHome();editing={name:'Fixture',width_mm:50,height_mm:50,dpi:203,elements:[]};editorDirty=true;factoryEdited=false;})()`);
    win.minimize();await wait();assert.equal(win.isMinimized(),true,'fixture is minimized before close');win.close();
    for(let i=0;i<30&&win.isMinimized();i++)await wait();
    assert.equal(win.isMinimized(),false,'dirty close restores window');assert.equal(await run("!!document.querySelector('[data-close-cancel]')"),true,'save prompt appears');
    await run("document.querySelector('[data-close-cancel]').click()");await wait();assert.equal(win.isDestroyed(),false,'Cancel keeps window open');assert.equal(await run('getCloseState().dirty'),true,'Cancel preserves edits');
    console.log('PASS minimized close restores window, presents prompt, Cancel preserves draft');clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main');ipcMain.removeHandler('list-printers');ipcMain.handle('list-printers',()=>[]);
