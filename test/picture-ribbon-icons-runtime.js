'use strict';
const {app}=require('electron');
const fs=require('fs'),os=require('os'),path=require('path');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'picture-ribbon-icons-')));
app.on('browser-window-created',(_event,win)=>{
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error('RENDERER:',message);});
  win.webContents.once('did-finish-load',async()=>{
    try{
      for(let i=0;i<150;i++){if(await win.webContents.executeJavaScript('!appInitializing'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      const result=await win.webContents.executeJavaScript(`(()=>{
        window.hideProjectHome();
        editing={name:'Picture icon check',width_mm:50,height_mm:30,dpi:203,margin_mm:{left:0,top:0},elements:[{type:'image',label:'Picture',placeholder:true,x_mm:5,y_mm:5,width_mm:20,height_mm:20}],values:{}};
        editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
        const expected=['Delete picture','Lock picture','Replace picture','Remove background','Transparent background','Rotate left','Rotate right','Flip horizontal','Flip vertical'];
        const buttons=[...document.querySelectorAll('#ribbon-picture button')],found=expected.map(label=>{const button=buttons.find(item=>item.getAttribute('aria-label')===label||item.title===label);return {label,icon:button?.querySelector('svg')?.dataset.icon};});
        if(found.some(item=>!item.icon))throw Error('Picture command uses a missing or generic icon: '+JSON.stringify(found));
        if(new Set(found.map(item=>item.icon)).size!==expected.length)throw Error('Picture commands reuse an SVG: '+JSON.stringify(found));
        if(!document.querySelector('#ribbon-picture [data-icon="transparent-background"]')||!document.querySelector('#ribbon-picture [data-icon="flip-horizontal"]')||!document.querySelector('#ribbon-picture [data-icon="flip-vertical"]'))throw Error('Transparency or flip icon is missing');
        return {pictureCommands:found.length,uniqueIcons:new Set(found.map(item=>item.icon)).size,icons:found};
      })()`);
      console.log(JSON.stringify(result));app.exit(0);
    }catch(error){console.error(error.stack||error);app.exit(1);}
  });
});
require('../gui/main');
