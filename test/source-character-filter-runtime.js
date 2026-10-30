'use strict';
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-native-filter-'));app.setPath('appData',profile);
const timer=setTimeout(()=>{console.error('Native filter runtime timed out');app.exit(1);},45000);
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{try{
    const result=await win.webContents.executeJavaScript(`(async()=>{
      while(appInitializing)await new Promise(r=>setTimeout(r,30));
      hideProjectHome();autoSaveEnabled=false;current=null;rawTemplate=null;
      editing={name:'Native filter fixture',width_mm:70,height_mm:40,dpi:203,elements:[{type:'text',text:'AZ12¢$',x_mm:2,y_mm:2,width_mm:3,height_mm:4}]};refreshEditorUI();drawEditorCanvas();
      openObjectProperties(0);const modal=document.getElementById('objectProperties');[...modal.querySelectorAll('nav button')].find(b=>b.textContent==='Data Sources').click();
      [...modal.querySelectorAll('button')].find(b=>b.textContent==='Transforms').click();modal.querySelector('[aria-label="Enable Character Filter"]').click();modal.querySelector('[data-transform-kind="filter"] button').click();
      const mode=modal.querySelector('[name="transform.filter.mode"]');if(mode.value!=='all')throw Error('New filter default is not All');
      mode.value='currency';mode.dispatchEvent(new Event('change',{bubbles:true}));[...modal.querySelectorAll('.source-transform-dialog button')].find(b=>b.textContent==='OK').click();await new Promise(r=>setTimeout(r,100));
      if(!modal.querySelector('.op-preview').textContent.includes('12¢$'))throw Error('Currency filter preview did not refresh');
      modal.querySelector('[data-action="ok"]').click();await new Promise(r=>setTimeout(r,100));if(modal.open)throw Error('Properties failed to commit');
      const value=ObjectData.resolve(editing.elements[0],sampleData(editing));if(value!=='12¢$')throw Error('Wrong filter result '+value);
      const prepared=await window.zebra.preparePrintJob({template:editing,connection:{type:'ip',ip:'127.0.0.1'}});if(!prepared.ok)throw Error(prepared.error);
      const printed=ObjectData.resolve(prepared.template.elements[0],prepared.dataList[0]);if(printed!==value)throw Error('Preview and prepared print differ');
      return {value,printed,mode:editing.sourceDefinitions[editing.elements[0].dataSourceRefs[0]].transforms[0].mode};
    })()`);
    assert.deepEqual(result,{value:'12¢$',printed:'12¢$',mode:'currency'});console.log('PASS native filter runtime '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});
});
require('../gui/main');
