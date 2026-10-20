'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-fit-barcode-')));
const timer=setTimeout(()=>{console.error('Fit barcode runtime timed out');app.exit(1);},90000);
app.on('browser-window-created',(_event,win)=>win.webContents.once('did-finish-load',async()=>{try{
 const results=await win.webContents.executeJavaScript(`(async()=>{
  while(appInitializing)await new Promise(resolve=>setTimeout(resolve,30));
  hideProjectHome();autoSaveEnabled=false;
  const fit=async(element,maxWidth)=>{
   editing={name:'Fit barcode runtime',width_mm:60,height_mm:40,dpi:203,margin_mm:{left:0,top:0},elements:[element]};
   refreshEditorUI();drawEditorCanvas();openObjectProperties(0);
   const dialog=document.getElementById('objectProperties'),page=[...dialog.querySelectorAll('[data-property-page]')].find(button=>button.textContent==='Auto Fit');
   if(!page)throw Error('Auto Fit page is missing for '+element.type);page.click();
   const input=dialog.querySelector('input[type="number"]');if(!input)throw Error('Maximum width input is missing');input.value=String(maxWidth);
   const button=[...dialog.querySelectorAll('button')].find(item=>item.textContent==='Fit barcode width');if(!button)throw Error('Fit barcode width button is missing');button.click();
   for(let i=0;i<100;i++){await new Promise(resolve=>setTimeout(resolve,30));const current=editing.elements[0];if(element.barcode_spec?current.width_mm===maxWidth:current.module_width!==element.module_width)break;}
   await new Promise(resolve=>setTimeout(resolve,120));
   const current=structuredClone(editing.elements[0]),box=LabelPreview.computeBoxes(editing,sampleData(editing))[0],preview=dialog.querySelector('.op-preview svg');
   if(!preview)throw Error('Fitted barcode preview is missing: '+dialog.querySelector('.op-error').textContent);
   if(box.w>maxWidth+.02)throw Error('Fitted barcode is wider than the maximum: '+box.w+' > '+maxWidth+'; module_width='+current.module_width+'; error='+dialog.querySelector('.op-error').textContent);
   if(element.barcode_spec&&Math.abs(current.width_mm-maxWidth)>.001)throw Error('Catalog barcode width was not applied: '+current.width_mm);
   if(element.barcode_spec&&Math.abs(current.height_mm/current.width_mm-current.bitmap_height/current.bitmap_width)>.01)throw Error('Catalog barcode aspect ratio was not preserved');
   dialog.querySelector('header button[aria-label="Close"]').click();await new Promise(resolve=>setTimeout(resolve,120));
   return{type:element.type,width:box.w,module_width:current.module_width||null,bitmapWidth:current.width_mm||null,preview:true};
  };
  const linear=await fit({type:'barcode128',label:'Linear fixture',text:'12345678',x_mm:2,y_mm:2,module_width:4,bar_height_mm:10,show_text:true},22);
  const catalog=await fit({type:'image',label:'Catalog barcode fixture',x_mm:2,y_mm:2,width_mm:20,height_mm:8,auto_fit_width:true,barcode_spec:{bcid:'code128',text:'12345678',show_text:true}},42);
  return[linear,catalog];
 })()`);
 assert.equal(results.length,2);assert.ok(results.every(result=>result.preview));assert.ok(results.every(result=>result.width<= (result.type==='image'?42:22)+.02));
 console.log('PASS Fit barcode width runtime '+JSON.stringify(results));clearTimeout(timer);app.exit(0);
}catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}}));
require('../gui/main');
