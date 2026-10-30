'use strict';
const {app,ipcMain}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-unsaved-'));app.setPath('appData',profile);
const data=path.join(profile,'Bratender'),dir=path.join(data,'templates');fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,'original.json'),baseline=JSON.stringify({name:'original',width_mm:51,height_mm:25,dpi:203,elements:[{type:'text',text:'ORIGINAL',x_mm:2,y_mm:2,width_mm:30,height_mm:5}]});fs.writeFileSync(file,baseline);
fs.writeFileSync(path.join(data,'settings.json'),JSON.stringify({lastTemplate:'original.json',autoSaveEnabled:false,printer:'Fixture printer'}));
const timer=setTimeout(()=>{console.error('Unsaved document runtime timed out');app.exit(1);},90000);
app.on('browser-window-created',(_,win)=>{win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{
  const run=code=>win.webContents.executeJavaScript(code),wait=()=>new Promise(resolve=>setTimeout(resolve,100));
  const prompt=async action=>{assert.equal(await run(`!!document.querySelector('[data-close-${action}]')`),true,'unsaved work prompts before navigation');await run(`document.querySelector('[data-close-${action}]').click()`);await wait();};
  const finish=()=>run(`(async()=>{for(let i=0;i<100&&nwNext.disabled;i++)await new Promise(r=>setTimeout(r,20));await document.querySelector('#newLabelWizard form').onsubmit({preventDefault(){}});if(newLabelWizard.open)throw Error(nwError.textContent||'Wizard remains open');})()`);
  try{
    await run(`(async()=>{while(appInitializing)await new Promise(r=>setTimeout(r,30));await selectTemplate('original.json',true);openEditor(rawTemplate);hideProjectHome();editing.elements[0].text='UNSAVED';refreshEditorUI();touchEditor();})()`);
    assert.equal(await run('prepareHotReload()'),false,'manual dirty work postpones reload instead of saving');assert.equal(fs.readFileSync(file,'utf8'),baseline);
    await run("window.__new=openNewLabelWizard();'pending'");await wait();await prompt('cancel');assert.equal(await run('newLabelWizard.open'),false,'Cancel does not open Wizard');
    assert.equal(await run('editing.elements[0].text'),'UNSAVED');
    await run("window.__new=openNewLabelWizard();'pending'");await wait();await prompt('discard');await run('Promise.resolve(window.__new)');
    assert.equal(fs.readFileSync(file,'utf8'),baseline,'Don’t Save leaves the original file byte-for-byte unchanged');
    assert.equal(await run('editing.elements[0].text'),'ORIGINAL','discard restores the saved document in memory');
    await finish();
    assert.equal(await run('current.file'),null,'Finish opens an unsaved document');assert.equal(await run('getCloseState().dirty'),true,'a new document needs a Save decision');
    assert.deepEqual(fs.readdirSync(dir),['original.json'],'Finish creates no label file');
    await run("window.__new=openNewLabelWizard();'pending'");await wait();await prompt('discard');await run('Promise.resolve(window.__new)');
    assert.deepEqual(fs.readdirSync(dir),['original.json'],'discarding the new document creates no phantom project');
    await finish();await run('saveEditor(false)');
    const saved=await run('current.file');assert.ok(saved&&saved!=='original.json');assert.equal(fs.existsSync(path.join(dir,saved)),true,'explicit Save writes the new document');
    await run("editing.elements.push({type:'text',text:'CANCELLED EDIT',x_mm:2,y_mm:2,height_mm:4});refreshEditorUI();touchEditor();window.__home=showProjectHome();'pending'");await wait();await prompt('cancel');
    assert.equal(await run('projectHome.hidden'),true,'Cancel keeps the editor visible');
    await run("window.__home=showProjectHome();'pending'");await wait();await prompt('save');await run('Promise.resolve(window.__home)');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir,saved),'utf8')).elements[0].text,'CANCELLED EDIT','Save writes before navigating Home');
    await run(`hideProjectHome();editing.elements[0].text='DO NOT SAVE';refreshEditorUI();touchEditor();window.__nav=prepareEditorNavigation();'pending'`);await prompt('discard');await run('window.__nav');
    assert.equal(await run('prepareHotReload()'),true,'clean discarded state can reload');
    await run('flushAllStateOnExit()');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir,saved),'utf8')).elements[0].text,'CANCELLED EDIT','discard remains discarded during reload and exit');
    console.log('PASS unsaved new/existing documents, Wizard/Home Save/Don’t Save/Cancel, reload and disk contents');clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main');ipcMain.removeHandler('list-printers');ipcMain.handle('list-printers',()=>['Fixture printer']);ipcMain.removeHandler('get-printer-resolution');ipcMain.handle('get-printer-resolution',()=>({dpi:203,source:'fixture'}));
