'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-category-scroll-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({width:900,height:720,show:false,webPreferences:{contextIsolation:true}});try{
  await win.loadURL('data:text/html,<html><head></head><body><select id="printerSelect"><option>Test 600dpi</option></select></body></html>');
  await win.webContents.executeJavaScript("window.settings={};window.el=id=>document.getElementById(id);window.zebra={getPrinterResolution:async()=>({dpi:600})};void 0;");
  for(const name of ['stock-catalog','stock-preview','new-label-stock-mode','new-label-wizard'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../gui',name+'.js'),'utf8')+';void 0;');
  await win.webContents.executeJavaScript('openNewLabelWizard()');
  await win.webContents.executeJavaScript("nwNext.click();nwStockPredefined.checked=true;nwStockPredefined.dispatchEvent(new Event('change'));nwStockCategory.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0}));");
  const result=await win.webContents.executeJavaScript(`(()=>{const list=document.querySelector('.nw-category-popup');if(!list)throw Error('Category popup with a visible scrollbar is missing');const computed=getComputedStyle(list),style={overflowY:computed.overflowY,scrollbarWidth:computed.scrollbarWidth},before=nwStockCategory.value;list.scrollTop=list.scrollHeight;const scroll=list.scrollTop;list.selectedIndex=list.options.length-1;const selected=list.value;list.options[list.selectedIndex].dispatchEvent(new MouseEvent('click',{bubbles:true}));return {overflow:style.overflowY,scrollbar:style.scrollbarWidth,scroll,selected,actual:nwStockCategory.value,closed:!document.querySelector('.nw-category-popup'),stocks:nwStockList.options.length,before};})()`);
  assert.equal(result.overflow,'scroll');assert.equal(result.scrollbar,'auto');assert.ok(result.scroll>0);assert.equal(result.actual,result.selected);assert.ok(result.closed);assert.ok(result.stocks>0);
  const cancelled=await win.webContents.executeJavaScript(`(()=>{const previous=nwStockCategory.value;nwStockCategory.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}));const list=document.querySelector('.nw-category-popup');list.selectedIndex=0;list.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));return {previous,value:nwStockCategory.value,closed:!document.querySelector('.nw-category-popup')};})()`);
  assert.equal(cancelled.value,cancelled.previous);assert.ok(cancelled.closed);
  console.log(JSON.stringify({status:'PASS',...result}));
  app.exit(0);
}catch(error){console.error(error);app.exit(1);}});
