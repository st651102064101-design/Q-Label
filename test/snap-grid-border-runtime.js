'use strict';
const {app}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-snap-grid-border-'));
app.setPath('appData',profile);
let finished=false;
const finish=error=>{if(finished)return;finished=true;if(error)console.error('FAIL '+error.stack);else console.log('PASS Snap to grid shows its border only while hovered');app.exit(error?1:0);};
app.on('will-quit',()=>{try{fs.rmSync(profile,{recursive:true,force:true});}catch{}});
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,50));
        hideProjectHome();document.querySelector('[aria-controls="ribbon-view"]').click();
        const button=document.querySelector('#ribbon-view .ribbon-command[title^="Snap to grid"]');if(!button)throw Error('Snap to grid command is missing');
        button.focus();await new Promise(resolve=>setTimeout(resolve,20));
        const focused={border:getComputedStyle(button).borderTopColor,outline:getComputedStyle(button).outlineStyle,active:button.classList.contains('is-active')};
        return {focused};
      })()`);
      if(result.focused.active&&result.focused.border==='rgb(22, 163, 74)')throw Error('Snap to grid keeps its green border after click/focus: '+JSON.stringify(result.focused));
      if(result.focused.outline!=='none')throw Error('Snap to grid keeps a focus outline after click: '+JSON.stringify(result.focused));
      const debuggerSession=win.webContents.debugger;debuggerSession.attach('1.3');
      await debuggerSession.sendCommand('DOM.enable');await debuggerSession.sendCommand('CSS.enable');
      const {root}=await debuggerSession.sendCommand('DOM.getDocument'),{nodeId}=await debuggerSession.sendCommand('DOM.querySelector',{nodeId:root.nodeId,selector:'#ribbon-view .ribbon-command[title^="Snap to grid"]'});
      await debuggerSession.sendCommand('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:['hover']});
      const hovered=await win.webContents.executeJavaScript(`(()=>{const button=document.querySelector('#ribbon-view .ribbon-command[title^="Snap to grid"]');return {border:getComputedStyle(button).borderTopColor,hovered:button.matches(':hover')}})()`);
      await debuggerSession.sendCommand('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]});debuggerSession.detach();
      if(!hovered.hovered||hovered.border!=='rgb(22, 163, 74)')throw Error('Snap to grid does not show its green border while hovered: '+JSON.stringify(hovered));
      result.hovered=hovered;console.log(JSON.stringify(result));finish();
    }catch(error){finish(error);}
  });
});
require('../gui/main');
setTimeout(()=>finish(Error('Timed out waiting for the Snap to grid control.')),20000).unref();
