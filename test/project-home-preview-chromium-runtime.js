'use strict';
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),QRCode=require('qrcode');
app.disableHardwareAcceleration();
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-thumb-chromium-')));
ipcMain.handle('fixture-qr',(_event,value)=>{const m=QRCode.create(value,{errorCorrectionLevel:'M'}).modules;return {size:m.size,data:Array.from(m.data)};});
setTimeout(()=>{console.error('Chromium preview fixture timed out');app.exit(1);},60000).unref();
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{nodeIntegration:true,contextIsolation:false}});
  try{
    await win.loadURL('data:text/html,<html><head></head><body></body></html>');
    await win.webContents.executeJavaScript("window.module=undefined;window.LineCompound={isCompound:()=>false,stripes:()=>[]};window.LineDash={dashArray:()=>[],svgAttr:()=>''};null;");
    for(const file of ['object-data','preview','project-home'])await win.webContents.executeJavaScript('(()=>{'+fs.readFileSync(path.join(__dirname,'../gui',file+'.js'),'utf8')+'\n;return null;})()');
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const source={width_mm:100,height_mm:100,dpi:203,elements:[
        {type:'qrcode',x_mm:5,y_mm:5,width_mm:20},{type:'qrcode',x_mm:30,y_mm:5,width_mm:20},
        {type:'qrcode',x_mm:55,y_mm:5,width_mm:20},{type:'image',placeholder:true,x_mm:5,y_mm:35,width_mm:25,height_mm:20}]};
      window.projectHomeData=()=>({templates:[{file:'fixture.json',name:'Fixture',editable:true,width_mm:100,height_mm:100}]});
      window.DataSourceEngine={resolve:()=>({})};
      window.zebra={loadTemplateRaw:async()=>source,qrMatrix:value=>require('electron').ipcRenderer.invoke('fixture-qr',value)};
      await window.showProjectHome();
      const list=document.querySelector('[data-home-view="list"]'),grid=document.querySelector('[data-home-view="grid"]'),recent=document.getElementById('phRecent');if(!list||!grid)throw Error('View controls missing');const rows=[...recent.querySelectorAll('.ph-project')];if(recent.dataset.view!=='list'||list.getAttribute('aria-pressed')!=='true'||!rows.length||getComputedStyle(recent).display!=='flex'||getComputedStyle(rows[0]).display!=='grid')throw Error('Default list layout not active');if(rows[0].getBoundingClientRect().width<500)throw Error('List row did not fill the available width');grid.click();if(recent.dataset.view!=='grid'||getComputedStyle(recent).display!=='grid')throw Error('Grid layout not restored');
      let objects;
      for(let i=0;i<200;i++){
        objects=document.querySelectorAll('#phRecent [data-label-element]');
        if(objects.length===4&&objects[0].querySelectorAll('rect[fill="#111"]').length>20)break;
        await new Promise(r=>setTimeout(r,25));
      }
      if(objects.length!==4||[...objects].slice(0,3).some(o=>o.querySelectorAll('rect[fill="#111"]').length<20))throw Error('QR artwork is missing');
      if(!objects[3].querySelector('circle')||!objects[3].querySelector('path'))throw Error('Picture placeholder is missing');
      return {objects:objects.length,qr:3,picture:1};
    })()`);
    console.log('Chromium preview fixture PASS '+JSON.stringify(result));win.destroy();app.exit(0);
  }catch(error){console.error(error);win.destroy();app.exit(1);}
});
