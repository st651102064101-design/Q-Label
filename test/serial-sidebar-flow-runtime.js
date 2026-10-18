'use strict';
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-sidebar-serial-flow-'));app.setPath('appData',profile);
const timer=setTimeout(()=>{console.error('Serial preview runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_event,win)=>{
 win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);
 win.webContents.once('did-finish-load',async()=>{try{
  const result=await win.webContents.executeJavaScript(`(async()=>{
   while(appInitializing)await new Promise(r=>setTimeout(r,30));hideProjectHome();autoSaveEnabled=false;current=null;rawTemplate=null;
   editing={name:'Sidebar serial UI flow',width_mm:60,height_mm:40,dpi:203,elements:[]};refreshEditorUI();drawEditorCanvas();
   insertEditorElement('barcode128',null,'1');editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();
   DataSourcesUI.open('Serial Number');const sourceDialog=document.getElementById('dataSourceDialog');sourceDialog.querySelector('[name=name]').value='serial_runtime';await sourceDialog.querySelector('.bind').onclick();
   if(sourceDialog.open)throw Error(sourceDialog.querySelector('.source-error').textContent);if(editing.dataSourceSchemaVersion!==1)throw Error('Sidebar binding failed to migrate');
   getConnection=()=>({type:'ip',ip:'127.0.0.1',port:9100});
   await openPrintDialog();const q=id=>document.getElementById('pd'+id),p=id=>document.getElementById('pp'+id);
   if(q('SerialEnabled').disabled||!q('SerialEnabled').checked)throw Error('Serial quantity unavailable '+JSON.stringify({disabled:q('SerialEnabled').disabled,checked:q('SerialEnabled').checked,allow:q('AllowSerial').checked,has:DataSourceEngine.hasSerialization(editing),schema:editing.dataSourceSchemaVersion,defs:editing.sourceDefinitions,elements:editing.elements}));if(!q('SerialEnabled').closest('label').hidden)throw Error('Extra serial opt-in checkbox is visible');if(q('SerialCount').closest('label').firstChild.textContent!=='Serial numbers:')throw Error('Wrong serial quantity label');if(q('Copies').closest('label').firstChild.textContent!=='Copies per serial number:')throw Error('Wrong copies label');q('SerialCount').value='10';q('Copies').value='1';
   await q('Preview').onclick();if(!document.getElementById('printPreviewDialog').open)throw Error(q('Message').textContent);
   if(p('Count').textContent!=='of 10')throw Error('Incorrect page count');
   const images=[];for(const [button,value] of [[null,'0001'],['Next','0002'],['Last','0010'],['First','0001']]){
    if(button)p(button).click();await new Promise(r=>setTimeout(r,120));
    const image=p('Sheet').querySelector('svg');if(!image||!image.querySelector('path,rect,image'))throw Error('Missing graphic preview on '+value);images.push(image.outerHTML);
   }
   if(images[0]===images[1]||images[1]===images[2]||images[0]!==images[3])throw Error('Barcode image does not follow page changes');
   const job={template:editing,connection:getConnection(),serialization:{enabled:true,count:10},copies:1};
   const first=await zebra.preparePrintJob(job),second=await zebra.preparePrintJob(job);if(!first.ok||!second.ok)throw Error(first.error||second.error);
   const values=first.dataList.map(data=>ObjectData.resolve(editing.elements[0],data));if(values.join(',')!==Array.from({length:10},(_,i)=>String(i+1).toString()).join(','))throw Error('Incorrect sequence '+values);
   if(JSON.stringify(first.dataList)!==JSON.stringify(second.dataList))throw Error('Preview consumed serial values');
   return {values,imageChanges:true,pageCount:10};
  })()`);
  assert.equal(result.pageCount,10);assert.equal(result.imageChanges,true);console.log('PASS sidebar serial UI runtime '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
 }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});
});
require('../gui/main');
