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
      click('Data Sources');
      const sourceRow=properties.querySelector('[role="option"]');sourceRow.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:innerWidth-10,clientY:innerHeight-10}));
      const sourceMenu=properties.querySelector('[role="menu"]');if(!sourceMenu||sourceMenu.querySelectorAll('[role="menuitem"]').length!==7)throw Error('Missing native source commands');
      const menuBounds=sourceMenu.getBoundingClientRect();if(menuBounds.right>innerWidth+1||menuBounds.bottom>innerHeight+1)throw Error('Source menu outside viewport');
      if(!sourceMenu.querySelector('[data-action="Move Up"]').disabled||!sourceMenu.querySelector('[data-action="Move Down"]').disabled)throw Error('Single source reorder should be disabled');
      editorSel=0;editorSelection=new Set([0]);const canvasBefore=JSON.stringify(editing.elements);
      sourceMenu.querySelector('[data-action="Copy"]').dispatchEvent(new KeyboardEvent('keydown',{key:'c',ctrlKey:true,bubbles:true,cancelable:true}));if(properties.querySelector('[role="menu"]'))throw Error('Copy shortcut intercepted outside source menu');if(JSON.stringify(editing.elements)!==canvasBefore)throw Error('Source copy changed canvas');
      properties.querySelector('[role="listbox"]').dispatchEvent(new KeyboardEvent('keydown',{key:'F10',shiftKey:true,bubbles:true,cancelable:true}));
      if(properties.querySelector('[role="menu"] [data-action="Paste"]').disabled)throw Error('Copied source cannot paste');
      properties.querySelector('[role="menu"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));if(properties.querySelector('[role="menu"]'))throw Error('Escape did not dismiss menu');
      click('Transforms');
      const expected=["suppression","filter","truncation","length","search-replace","vbscript","serialization","character-template","prefix-suffix"];
      const rows=()=>[...properties.querySelectorAll('[data-transform-kind]')].map(row=>row.dataset.transformKind);
      if(JSON.stringify(rows())!==JSON.stringify(expected))throw Error('Incorrect Text menu '+rows());
      const menus={"text":{"nativeType":0,"capabilityIds":[0,1,2,3,12,8,10,11,13],"displayKinds":["suppression","filter","truncation","length","search-replace","vbscript","serialization","character-template","prefix-suffix"]},"date":{"nativeType":1,"capabilityIds":[0,4,7,10,13],"displayKinds":["suppression","offset","range","vbscript","prefix-suffix"]},"time":{"nativeType":2,"capabilityIds":[0,4,10,13],"displayKinds":["suppression","offset","vbscript","prefix-suffix"]},"number":{"nativeType":3,"capabilityIds":[0,6,5,11,13],"displayKinds":["suppression","offset","range","serialization","prefix-suffix"]},"currency":{"nativeType":4,"capabilityIds":[0,6,5,13],"displayKinds":["suppression","offset","range","prefix-suffix"]},"percentage":{"nativeType":5,"capabilityIds":[0,6,5,13],"displayKinds":["suppression","offset","range","prefix-suffix"]},"fraction":{"nativeType":6,"capabilityIds":[0,6,5,13],"displayKinds":["suppression","offset","range","prefix-suffix"]},"binary":{"nativeType":7,"capabilityIds":[0,9,10,13],"displayKinds":["suppression","compression","vbscript","prefix-suffix"]},"picture":{"nativeType":8,"capabilityIds":[0,9,10,13],"displayKinds":["suppression","compression","vbscript","prefix-suffix"]}};
      for(const [kind,reference]of Object.entries(menus)){click('Data Type');const type=properties.querySelector('[name="type.kind"]');type.value=kind;type.dispatchEvent(new Event('change',{bubbles:true}));click('Transforms');if(JSON.stringify(rows())!==JSON.stringify(reference.displayKinds))throw Error('Incorrect '+kind+' menu '+rows());}
      click('Data Type');const type=properties.querySelector('[name="type.kind"]');type.value='text';type.dispatchEvent(new Event('change',{bubbles:true}));click('Transforms');
      properties.querySelector('[aria-label="Enable Prefix and Suffix"]').click();properties.querySelector('[data-transform-kind="prefix-suffix"] button').click();
      for(const [key,value]of [['prefix','A'],['suffix','Z']]){const input=properties.querySelector('[name="transform.prefix-suffix.'+key+'"]');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}
      await new Promise(r=>setTimeout(r,100));if(!properties.querySelector('.op-preview svg'))throw Error('Missing draft preview');
      properties.querySelector('[data-action="ok"]').click();await new Promise(r=>setTimeout(r,100));if(properties.open)throw Error('Properties failed to commit');
      const value=ObjectData.resolve(editing.elements[0],sampleData(editing));if(value!=='A12345678Z')throw Error('Incorrect configured value '+value);
      const prepared=await window.zebra.preparePrintJob({template:editing,connection:{type:'ip',ip:'127.0.0.1'}});if(!prepared.ok)throw Error(prepared.error);if(ObjectData.resolve(editing.elements[0],prepared.dataList[0],true)!==value)throw Error('Prepared print differs');
      openObjectProperties(1);click('Data Sources');const sourceKind=properties.querySelector('[name="source.kind"]');sourceKind.value='job';sourceKind.dispatchEvent(new Event('change',{bubbles:true}));click('Transforms');if(JSON.stringify(rows())!==JSON.stringify(['suppression']))throw Error('Print Job Field has unsupported new transforms');properties.querySelector('[data-action="cancel"]').click();
      const before=JSON.stringify(editing);openObjectProperties(0);click('Data Sources');click('Transforms');properties.querySelector('[aria-label="Enable Prefix and Suffix"]').click();properties.querySelector('[data-action="cancel"]').click();if(JSON.stringify(editing)!==before)throw Error('Cancel mutated document');
      return {textMenu:expected,typeCount:Object.keys(menus).length,typeSwitch:true,jobRestriction:true,value,previewPrintMatch:true,cancelPreserved:true,noTransport:true};
    })()`);
    assert.equal(result.value,'A12345678Z');console.log('PASS object sources runtime '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});
});
require('../gui/main');
