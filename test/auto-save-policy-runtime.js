'use strict';
const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
const data=fs.mkdtempSync(path.join(os.tmpdir(),'q-label-auto-save-'));
app.setPath('appData',data);
const userData=path.join(data,'Bratender');
fs.mkdirSync(path.join(userData,'templates'),{recursive:true});
fs.writeFileSync(path.join(userData,'templates','autosave-check.json'),JSON.stringify({name:'Auto Save check',width_mm:51,height_mm:25,dpi:300,elements:[],values:{}}));
fs.writeFileSync(path.join(userData,'settings.json'),JSON.stringify({lastTemplate:'autosave-check.json',connType:'ip',autoSaveEnabled:false}));
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error('RENDERER:',message);});
  win.webContents.once('did-finish-load',async()=>{
    const run=code=>win.webContents.executeJavaScript(code);
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const check=async(label,code)=>{if(!await run(code))throw Error(label);console.log('PASS '+label);};
    try{
      for(let i=0;i<150;i++){if(await run('!appInitializing'))break;await wait(100);}
      await check('System Settings reflects the saved manual mode',"document.getElementById('settingsBtn').click();document.getElementById('setAutoSave').checked===false");
      await run("(()=>{const input=document.getElementById('setAutoSave');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await wait(100);
      await check('enabling Auto Save persists the preference',"getAutoSaveEnabled()===true&&settings.autoSaveEnabled===true&&document.getElementById('setAutoSave').checked===true");
      if(JSON.parse(fs.readFileSync(path.join(userData,'settings.json'),'utf8')).autoSaveEnabled!==true)throw Error('Enabled Auto Save setting was not written to disk');
      await run("(()=>{const input=document.getElementById('setAutoSave');input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await wait(100);
      await check('disabling Auto Save persists the manual mode',"getAutoSaveEnabled()===false");
      await run("document.getElementById('settingsClose')?.click();hideProjectHome();openEditor(rawTemplate)");
      await run('touchEditor()');await wait(550);
      await check('edits remain dirty and unsaved in manual mode','editorDirty===true');
      await run("window.__navigationPromise=window.prepareEditorNavigation();'started'");
      await check('manual navigation asks how to handle unsaved edits',"!!document.querySelector('dialog [data-close-save]')");
      await run("document.querySelector('dialog [data-close-cancel]').click()");
      await check('Cancel keeps the edit and stays in manual mode','(async()=>await window.__navigationPromise===false&&editorDirty===true)()');
      await run("window.__navigationPromise=window.prepareEditorNavigation();'started'");
      await run("document.querySelector('dialog [data-close-save]').click()");
      await check('Save from the navigation prompt saves and allows navigation','(async()=>await window.__navigationPromise===true&&editorDirty===false)()');
      await run("touchEditor();window.__navigationPromise=window.prepareEditorNavigation();'started'");
      await run("document.querySelector('dialog [data-close-discard]').click()");
      await check('Don’t Save discards the edit and allows navigation','(async()=>await window.__navigationPromise===true&&editorDirty===false)()');
      await run('touchEditor()');
      await run("(()=>{const input=document.getElementById('setAutoSave');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));})()");await wait(100);
      await check('enabling Auto Save saves an existing dirty edit','editorDirty===false');
      console.log('AUTO SAVE SETTINGS RUNTIME PASSED (isolated userData; no printer used)');app.exit(0);
    }catch(error){console.error(error.stack||error);app.exit(1);}
  });
});
require('../gui/main');
