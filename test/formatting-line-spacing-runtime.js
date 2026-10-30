'use strict';
const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'formatting-line-spacing-')));
app.on('browser-window-created',(_event,win)=>{
  win.webContents.once('did-finish-load',async()=>{
    try{
      for(let i=0;i<150;i++){if(await win.webContents.executeJavaScript('!appInitializing'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      const result=await win.webContents.executeJavaScript(`(()=>{
        const style=document.querySelector('#ribbon-home [aria-label="Line style"]');
        const thickness=document.querySelector('#ribbon-home [aria-label="Line thickness"]');
        const hint=thickness?.closest('label')?.querySelector('.format-unit-hint');
        if(!style||!thickness||!hint)throw Error('Line style, thickness field, or Line hint is missing');
        const styleRect=style.getBoundingClientRect(),hintRect=hint.getBoundingClientRect(),fieldRect=thickness.getBoundingClientRect();
        if(!(hintRect.left>=styleRect.right+4))throw Error('Line hint overlaps the line-style selector: '+JSON.stringify({styleRight:styleRect.right,hintLeft:hintRect.left}));
        if(!(hintRect.right<=fieldRect.left))throw Error('Line hint overlaps the thickness field: '+JSON.stringify({hintRight:hintRect.right,fieldLeft:fieldRect.left}));
        return {lineStyleRight:styleRect.right,lineHintLeft:hintRect.left,lineHintRight:hintRect.right,thicknessInputLeft:fieldRect.left,clearance:hintRect.left-styleRect.right};
      })()`);
      console.log(JSON.stringify(result));app.exit(0);
    }catch(error){console.error(error.stack||error);app.exit(1);}
  });
});
require('../gui/main');
