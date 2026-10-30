'use strict';
const {app}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-recent-clear-'));app.setPath('appData',profile);
const timeout=setTimeout(()=>{console.error('Recent Clear runtime timed out');app.exit(1);},45000);
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        hideProjectHome();autoSaveEnabled=false;
        const element={type:'box',width_mm:10,height_mm:10,thickness_mm:.3};
        settings.recentObjectEntries=normalizeRecentObjectEntries([{key:recentObjectIdentity(element),name:'Rectangle',element}]);settings.recentObjectTools=['text'];
        await zebra.saveSettings({recentObjectEntries:settings.recentObjectEntries,recentObjectTools:settings.recentObjectTools});renderRecentToolButtons();
        const before=JSON.stringify(editing),area=document.querySelector('.insert-recent-objects'),grid=document.getElementById('recentObjectTools');
        grid.querySelector('.insert-tool').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
        const menu=document.querySelector('.recent-objects-menu');if(!menu.hidden)throw Error('Object right click opened blank-space menu');
        area.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:80,clientY:180}));
        if(menu.hidden||menu.querySelector('button').disabled)throw Error('Clear menu is not enabled on blank space');
        menu.querySelector('button').click();await new Promise(resolve=>setTimeout(resolve,100));
        if(settings.recentObjectEntries.length||settings.recentObjectTools.length||grid.querySelector('.insert-tool'))throw Error('Recent lists were not cleared');
        if(JSON.stringify(editing)!==before)throw Error('Clear changed the current label');
        area.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:80,clientY:180}));
        if(!menu.querySelector('button').disabled)throw Error('Clear is enabled with empty lists');
        document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));if(!menu.hidden)throw Error('Escape did not close menu');
        return {blankSpaceMenu:true,objectIgnored:true,cleared:true,labelPreserved:true,emptyDisabled:true,escapeCloses:true};
      })()`);
      const saved=JSON.parse(fs.readFileSync(path.join(profile,'Bratender','settings.json'),'utf8'));
      if(saved.recentObjectEntries.length||saved.recentObjectTools.length)throw Error('Clear was not persisted to settings');
      console.log('PASS '+JSON.stringify({...result,persisted:true}));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
