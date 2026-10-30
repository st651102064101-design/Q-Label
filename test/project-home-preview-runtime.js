'use strict';
const {app}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.disableHardwareAcceleration();
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-project-preview-'));
app.setPath('appData',profile);
const dir=path.join(profile,'Bratender','templates');fs.mkdirSync(dir,{recursive:true});
const source={name:'Preview fixture',width_mm:100,height_mm:100,dpi:203,elements:[
  {type:'qrcode',x_mm:5,y_mm:5,width_mm:20},
  {type:'qrcode',x_mm:30,y_mm:5,width_mm:20},
  {type:'qrcode',x_mm:55,y_mm:5,width_mm:20},
  {type:'image',placeholder:true,x_mm:5,y_mm:35,width_mm:25,height_mm:20}
]};
fs.writeFileSync(path.join(dir,'preview-fixture.json'),JSON.stringify(source));
fs.writeFileSync(path.join(profile,'Bratender','settings.json'),JSON.stringify({autoSaveEnabled:false}));
setTimeout(()=>{console.error('Project preview runtime timed out');app.exit(1);},60000).unref();
app.on('browser-window-created',(_,win)=>{
  console.log('Project preview: window created');
  win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.hide());
  win.webContents.once('dom-ready',async()=>{
    console.log('Project preview: DOM ready');
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        for(let i=0;i<400&&appInitializing;i++)await new Promise(r=>setTimeout(r,25));
        if(appInitializing)throw Error('Application did not finish initializing');
        const navigation=window.showProjectHome();
        document.querySelector('[data-close-discard]')?.click();
        await navigation;
        let card;
        for(let i=0;i<200;i++){
          card=document.querySelector('#phRecent [data-template-file="preview-fixture.json"]');
          if(card?.querySelectorAll('[data-label-element="0"] rect[fill="#111"]').length>20)break;
          await new Promise(r=>setTimeout(r,25));
        }
        const objects=card?.querySelectorAll('[data-label-element]');
        if(objects?.length!==4)throw Error('Expected four separate preview objects');
        for(let i=0;i<3;i++)if(objects[i].querySelectorAll('rect[fill="#111"]').length<20)throw Error('QR modules missing from preview '+i);
        if(!objects[3].querySelector('circle')||!objects[3].querySelector('path'))throw Error('Picture placeholder missing');
        return {objects:objects.length,qr:3,picture:1};
      })()`);
      console.log('Project Home preview runtime PASS '+JSON.stringify(result));win.destroy();app.exit(0);
    }catch(error){console.error(error);win.destroy();app.exit(1);}
  });
});
require('../gui/main');
