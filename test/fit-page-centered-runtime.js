'use strict';
const {app}=require('electron');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const appData=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-fit-page-'));
app.setPath('appData',appData);
const timeout=setTimeout(()=>{console.error('Fit page runtime timed out');app.exit(1);},30000);
app.on('browser-window-created',(_event,win)=>{
  const hide=()=>win.hide();win.on('show',hide);win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        hideProjectHome();autoSaveEnabled=false;
        editing={name:'Fit page centre fixture',width_mm:100,height_mm:50,dpi:203,elements:[]};
        refreshEditorUI();drawEditorCanvas();
        const button=[...document.querySelectorAll('.ribbon-command')].find(item=>item.title==='Fit page');
        if(!button)throw Error('Fit page button missing');
        button.click();
        await new Promise(resolve=>setTimeout(resolve,300));
        const frame=document.getElementById('previewFrame'),svg=frame.querySelector('.canvaswrap > svg');
        const f=frame.getBoundingClientRect(),p=svg.getBoundingClientRect();
        return {dx:(f.left+f.width/2)-(p.left+p.width/2),dy:(f.top+f.height/2)-(p.top+p.height/2)};
      })()`);
      if(Math.abs(result.dx)>2||Math.abs(result.dy)>2)throw Error('Fit page is not centred: '+JSON.stringify(result));
      win.removeListener('show',hide);win.showInactive();
      console.log('PASS fit page centred '+JSON.stringify(result));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
