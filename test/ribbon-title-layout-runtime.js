'use strict';
const {app}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-ribbon-title-')));
let runtimeContents=null;
const timeout=setTimeout(async()=>{let stage='window unavailable';try{stage=await runtimeContents?.executeJavaScript('window.__ribbonTitleStage')||stage;}catch{}console.error('Ribbon title runtime timed out at '+stage);app.exit(1);},45000);
app.on('browser-window-created',(_event,win)=>{
  runtimeContents=win.webContents;
  win.webContents.once('did-finish-load',async()=>{
    try{
      await win.webContents.executeJavaScript(`(async()=>{while(appInitializing)await new Promise(resolve=>setTimeout(resolve,100));const title=document.querySelector('.ribbon-document-title'),label=document.getElementById('edTitle'),search=document.querySelector('.tool-search');if(!title||!label||!search)throw Error('Ribbon title or Search control is missing');label.textContent='Editing: A very long project name that needs all available room before the centered Search tools input';window.__inspectRibbonTitle=()=>{const titleBounds=title.getBoundingClientRect(),searchBounds=search.getBoundingClientRect(),bounds={titleLeft:titleBounds.left,titleRight:titleBounds.right,titleWidth:titleBounds.width,searchLeft:searchBounds.left,availableWidth:searchBounds.left-titleBounds.left-8},textStyle=getComputedStyle(label);if(bounds.titleRight>bounds.searchLeft-7)return {ok:false,reason:'Project title overlaps Search',bounds};if(bounds.availableWidth>40&&bounds.titleWidth<bounds.availableWidth-2)return {ok:false,reason:'Project title does not use available space before Search',bounds};if(textStyle.textOverflow!=='ellipsis'||textStyle.whiteSpace!=='nowrap')return {ok:false,reason:'Long project title should truncate on one line',bounds,textOverflow:textStyle.textOverflow,whiteSpace:textStyle.whiteSpace};return {ok:true,bounds};};})()`);
      const [,height]=win.getSize();
      win.setSize(1400,height);await new Promise(resolve=>setTimeout(resolve,200));
      const wide=await win.webContents.executeJavaScript('window.__inspectRibbonTitle()');
      if(!wide.ok)throw Error(wide.reason+' at 1400px: '+JSON.stringify(wide.bounds));
      win.setSize(900,height);await new Promise(resolve=>setTimeout(resolve,200));
      const narrow=await win.webContents.executeJavaScript('window.__inspectRibbonTitle()');
      if(!narrow.ok)throw Error(narrow.reason+' at 900px: '+JSON.stringify(narrow.bounds));
      console.log(JSON.stringify({wide,narrow}));clearTimeout(timeout);app.exit(0);
    }catch(error){console.error(error.stack||error);clearTimeout(timeout);app.exit(1);}
  });
  if(win.isVisible())win.hide();
});
require('../gui/main');
