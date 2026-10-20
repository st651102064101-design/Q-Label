'use strict';

const {app}=require('electron');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');

const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-font-catalog-'));
app.setPath('appData',profile);
let finished=false;
const finish=error=>{
  if(finished)return;
  finished=true;
  if(error)console.error('FAIL '+error.stack);else console.log('PASS Installed Windows font families flow through preload IPC and font picker styling');
  app.exit(error?1:0);
};
app.on('will-quit',()=>{try{fs.rmSync(profile,{recursive:true,force:true});}catch{}});
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());
  win.webContents.once('did-finish-load',async()=>{
    try{
      const result=await win.webContents.executeJavaScript(`(async()=>{
        while(appInitializing)await new Promise(resolve=>setTimeout(resolve,30));
        hideProjectHome();autoSaveEnabled=false;current=null;rawTemplate=null;
        editing={name:'Font picker fixture',width_mm:60,height_mm:40,dpi:203,elements:[{type:'text',text:'Sample',x_mm:4,y_mm:4,font_family:'Arial',font_size_pt:12}]};
        editorSel=0;editorSelection=new Set();refreshEditorUI();drawEditorCanvas();
        const families=await window.zebra.getInstalledFontFamilies();
        for(let i=0;i<60;i++){
          const picker=document.querySelector('.format-font');
          if(picker&&picker.options.length>12&&families.every(name=>[...picker.options].some(option=>option.value===name)))break;
          await new Promise(resolve=>setTimeout(resolve,50));
        }
        const picker=document.querySelector('.format-font');
        return {families,options:[...picker.options].map(option=>({name:option.value,face:option.style.fontFamily})),pickerFace:picker.style.fontFamily};
      })()`);
      assert.ok(result.families.length>12,'the Windows installed-font query returns more than the bundled fallback list');
      assert.ok(result.families.includes('Arial'),'the installed font collection includes Arial');
      assert.ok(result.families.every(name=>result.options.some(option=>option.name===name)), 'every installed family appears in the picker');
      const fontNameFromCss=value=>String(value).startsWith('"')?JSON.parse(value):value;
      assert.ok(result.options.every(option=>fontNameFromCss(option.face)===option.name), 'each option uses its font family for preview');
      assert.equal(fontNameFromCss(result.pickerFace),'Arial','the selected font face appears in the closed picker');
      console.log(JSON.stringify({installedCount:result.families.length,first:result.families.slice(0,8)}));
      finish();
    }catch(error){finish(error);}
  });
});
require('../gui/main');
