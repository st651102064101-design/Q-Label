'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-wizard-layout-'));
app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:900,height:780,show:false,webPreferences:{contextIsolation:true,backgroundThrottling:false,offscreen:true}});
  try{
    const gui=path.resolve(__dirname,'../gui'),fixture=path.join(profile,'fixture.html'),output=path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
    fs.writeFileSync(fixture,`<!doctype html><html><head><base href="${pathToFileURL(gui+path.sep).href}"></head><body><select id="printerSelect"><option>Zebra ZT411 (600 dpi)</option></select></body></html>`);
    await win.loadFile(fixture);
    await win.webContents.executeJavaScript("window.settings={};window.el=id=>document.getElementById(id);window.mmToUnit=(v,u)=>u==='in'?v/25.4:v;window.zebra={listPrinters:async()=>['Zebra ZT411 (600 dpi)'],getPrinterResolution:async()=>({dpi:600}),saveSettings:async()=>({ok:true})};void 0;");
    for(const name of ['stock-catalog','stock-apply','stock-preview','new-label-stock-mode','new-label-wizard','modal-preview','modal-windows'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(gui,name+'.js'),'utf8')+';void 0;');
    await win.webContents.executeJavaScript('openNewLabelWizard();new Promise(r=>setTimeout(r,0))');
    await win.webContents.executeJavaScript('nwNext.click();new Promise(r=>setTimeout(r,0))');
    await win.webContents.executeJavaScript('new Promise(r=>setTimeout(r,30));nwNext.click();new Promise(r=>setTimeout(r,0))');
    await win.webContents.executeJavaScript("nwStockCustom.checked=true;nwStockCustom.dispatchEvent(new Event('change',{bubbles:true}));nwNext.click();new Promise(r=>setTimeout(r,0));nwNext.click();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
    const layout=await win.webContents.executeJavaScript(`(()=>{const b=document.querySelector('.nw-body'),aside=b.querySelector(':scope>aside');return {heading:document.querySelector('.nw-heading strong').textContent,step:b.dataset.step,layoutPage:!!document.querySelector('#nwLabelLayout'),layoutControls:!!document.querySelector('[name=nwOrientation],[name=nwLayoutPreview],#nwRotated'),dimensions:!document.querySelector('#nwWidth').closest('section').hidden,previewHidden:aside.hidden}})()`);
    assert.equal(layout.heading,'Side Edges',`Next after Items Per Page skips layout only: ${JSON.stringify(layout)}`);
    assert.equal(layout.step,'4');assert.equal(layout.previewHidden,false);
    assert.equal(layout.layoutPage,false);assert.equal(layout.layoutControls,false);assert.equal(layout.dimensions,true);
    await win.webContents.executeJavaScript('nwBack.click()');
    assert.equal(await win.webContents.executeJavaScript("document.querySelector('.nw-heading strong').textContent"),'Items Per Page','Back returns directly to Items Per Page');
    await win.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    fs.writeFileSync(path.join(output,'new-label-layout-page-removed.png'),(await win.webContents.capturePage()).toPNG());
    console.log(JSON.stringify({status:'PASS',layout,screenshot:path.join(output,'new-label-layout-page-removed.png')}));win.destroy();app.exit(0);
  }catch(error){console.error(error);win.destroy();app.exit(1);}
});
