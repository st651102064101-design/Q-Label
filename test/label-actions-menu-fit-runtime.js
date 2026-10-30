'use strict';
const {app}=require('electron');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-menu-fit-')));
const timeout=setTimeout(()=>{console.error('Label actions menu runtime timed out');app.exit(1);},30000);
app.on('browser-window-created',(_event,win)=>{
  const hide=()=>win.hide();win.on('show',hide);win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        hideProjectHome();autoSaveEnabled=false;
        editing={name:'Label actions fit fixture',width_mm:100,height_mm:50,dpi:203,elements:[]};
        refreshEditorUI();drawEditorCanvas();
        const frame=document.getElementById('previewFrame');
        const r=frame.getBoundingClientRect();
        (frame.querySelector('.canvaswrap > svg')||frame).dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:window.innerHeight-20}));
        await new Promise(resolve=>setTimeout(resolve,200));
        const menu=document.querySelector('.object-context-menu');
        if(!menu||menu.hidden)throw Error('Label actions menu did not open');
        const m=menu.getBoundingClientRect();
        return {top:m.top,bottom:m.bottom,innerHeight:window.innerHeight,conn:menu.isConnected,open:menu.matches(":popover-open"),disp:getComputedStyle(menu).display,hidden:menu.hidden,h:m.height,ev:editing?.elements?.length,txt:menu.textContent.slice(0,80)};
      })()`);
      if(result.bottom>result.innerHeight||result.top<0)throw Error('Label actions menu is clipped: '+JSON.stringify(result));
      win.removeListener('show',hide);win.showInactive();
      console.log('PASS label actions menu fits '+JSON.stringify(result));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack);clearTimeout(timeout);app.exit(1);}
  });
});
require('../gui/main');
