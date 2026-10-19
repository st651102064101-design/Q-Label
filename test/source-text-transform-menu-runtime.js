'use strict';
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-object-sources-'));app.setPath('appData',profile);
const timer=setTimeout(()=>{console.error('Object sources runtime timed out');app.exit(1);},45000);
app.on('browser-window-created',(_event,win)=>{
  win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);
  win.webContents.once('did-finish-load',async()=>{try{
    const result=await win.webContents.executeJavaScript(`(async()=>{
      while(appInitializing)await new Promise(r=>setTimeout(r,30));
      hideProjectHome();autoSaveEnabled=false;current=null;rawTemplate=null;undoStack=[];redoStack=[];editHistoryFile=null;
      editing={name:'Source fixture',width_mm:70,height_mm:40,dpi:203,elements:[{type:'barcode128',text:'12345678',x_mm:3,y_mm:3,module_width:2,bar_height_mm:10,show_text:true},{type:'text',text:'SECOND',x_mm:3,y_mm:25,width_mm:40,height_mm:4}]};
      refreshEditorUI();drawEditorCanvas();
      openObjectProperties(0);const properties=document.getElementById('objectProperties');
      const click=label=>{const button=[...properties.querySelectorAll('button')].find(b=>b.textContent===label);if(!button)throw Error('Missing '+label);button.click();};
      click('Data Sources');click('Transforms');
      const expected=["suppression","filter","truncation","length","search-replace","vbscript","serialization","character-template","prefix-suffix"];
      const rows=()=>[...properties.querySelectorAll('[data-transform-kind]')].map(row=>row.dataset.transformKind);
      if(JSON.stringify(rows())!==JSON.stringify(expected))throw Error('Incorrect Text menu '+rows());
      click('Data Type');let type=properties.querySelector('[name="type.kind"]');type.value='number';type.dispatchEvent(new Event('change',{bubbles:true}));click('Transforms');if(!rows().includes('offset'))throw Error('Number lost existing controls');
      click('Data Type');type=properties.querySelector('[name="type.kind"]');type.value='text';type.dispatchEvent(new Event('change',{bubbles:true}));click('Transforms');if(JSON.stringify(rows())!==JSON.stringify(expected))throw Error('Text menu did not refresh');
      properties.querySelector('[aria-label="Enable Prefix and Suffix"]').click();properties.querySelector('[data-transform-kind="prefix-suffix"] button').click();
      for(const [key,value]of [['prefix','A'],['suffix','Z']]){const input=properties.querySelector('[name="transform.prefix-suffix.'+key+'"]');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}
      await new Promise(r=>setTimeout(r,100));if(!properties.querySelector('.op-preview svg'))throw Error('Missing draft preview');
      properties.querySelector('[data-action="ok"]').click();await new Promise(r=>setTimeout(r,100));if(properties.open)throw Error('Properties failed to commit');
      const value=ObjectData.resolve(editing.elements[0],sampleData(editing));if(value!=='A12345678Z')throw Error('Incorrect configured value '+value);
      const prepared=await window.zebra.preparePrintJob({template:editing,connection:{type:'ip',ip:'127.0.0.1'}});if(!prepared.ok)throw Error(prepared.error);if(ObjectData.resolve(editing.elements[0],prepared.dataList[0],true)!==value)throw Error('Prepared print differs');
      const before=JSON.stringify(editing);openObjectProperties(0);click('Data Sources');click('Transforms');properties.querySelector('[aria-label="Enable Prefix and Suffix"]').click();properties.querySelector('[data-action="cancel"]').click();if(JSON.stringify(editing)!==before)throw Error('Cancel mutated document');
      return {textMenu:expected,typeSwitch:true,value,previewPrintMatch:true,cancelPreserved:true,noTransport:true};
    })()`);
    assert.equal(result.value,'A12345678Z');console.log('PASS object sources runtime '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});
});
require('../gui/main');
