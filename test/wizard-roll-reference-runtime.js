'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-roll-reference-'));app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({width:1000,height:780,show:false,webPreferences:{contextIsolation:true,backgroundThrottling:false}});try{
 const gui=path.resolve(__dirname,'../gui'),file=path.join(profile,'fixture.html'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(file,`<!doctype html><base href="${pathToFileURL(gui+path.sep).href}"><select id="printerSelect"><option>Zebra ZT411 (600 dpi)</option></select>`);await win.loadFile(file);win.showInactive();
 await win.webContents.executeJavaScript("window.settings={};window.el=id=>document.getElementById(id);window.mmToUnit=(v,u)=>u==='in'?v/25.4:v;window.zebra={getPrinterResolution:async()=>({dpi:600})};void 0;");
 for(const name of ['stock-catalog','stock-apply','stock-preview','new-label-stock-mode','new-label-wizard','modal-preview','modal-windows'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(gui,name+'.js'),'utf8')+';void 0;');
 await win.webContents.executeJavaScript('openNewLabelWizard();void 0;');
 const snapshots=[];
 for(let n=0;n<9;n++){
  await win.webContents.executeJavaScript('new Promise(r=>setTimeout(r,25))');
  const heading=await win.webContents.executeJavaScript("document.querySelector('.nw-heading strong').textContent");
  if(heading==='Stock Selection'){const colors=await win.webContents.executeJavaScript("(()=>{const a=document.createElement('aside');StockPreview.render(a,QLabelStockCatalog.getStock('ADES AG','040312fo'),'in');return [...a.querySelectorAll('linearGradient[id$=background] stop')].map(s=>s.getAttribute('stop-color'))})()");assert.deepEqual(colors,['#c7d9ee','#89a6c4']);}
  if(heading==='Printed Item Shape'){const e=await win.webContents.executeJavaScript("(()=>{nwPrintedShapeEllipse.click();return {width:+nwWidth.value,height:+nwHeight.value,caption:nwSize.textContent}})()");assert.equal(e.width,4.1);assert.equal(e.height,4);assert.match(e.caption,/4\.1 x 4 in/);await win.webContents.executeJavaScript('nwPrintedShapeRounded.click()');}
  if(['Items Per Page','Side Edges','Printed Item Shape','Template Size','Template Background','Finished!'].includes(heading)){
   await win.webContents.executeJavaScript("nwWidth.value='101.6';nwHeight.value='101.6';nwUnit.value='in';nwUnit.dispatchEvent(new Event('change',{bubbles:true}));nwWidth.value='4';nwHeight.value='4';nwWidth.dispatchEvent(new Event('input',{bubbles:true}));void 0;");
   const actual=await win.webContents.executeJavaScript(`(()=>{const s=nwPreview,r=s.getBoundingClientRect();return {heading:document.querySelector('.nw-heading strong').textContent,markup:s.innerHTML.replace(/referenceRoll[0-9]+/g,'roll'),viewBox:s.getAttribute('viewBox'),fill:s.querySelector('[data-reference-background]').getAttribute('fill'),radius:Number(s.querySelector('[data-preview-cell]').getAttribute('rx')),faceWidth:Number(s.querySelector('[data-preview-cell]').getAttribute('width')),width:r.width,height:r.height,x:r.x,y:r.y,caption:nwSize.textContent,captionAlign:getComputedStyle(nwSize).textAlign,dialogRight:document.querySelector('#newLabelWizard').getBoundingClientRect().right,previewRight:r.right,liner:s.querySelector('[data-reference-liner]')?.getAttribute('fill'),top:!!s.querySelector('[data-paper-sliver=top]'),bottom:!!s.querySelector('[data-paper-sliver=bottom]'),gap:!!s.querySelector('[data-gap-label]'),rollers:!!s.querySelector('[data-paper-roller]')}})()`);
   assert.match(actual.fill,/^url\(#/);assert.ok(actual.radius>=actual.faceWidth*.1,heading+' rounded label');assert.equal(actual.viewBox,'0 0 198 270');const singleSheet=heading==='Template Background'||heading==='Finished!';if(singleSheet){assert.equal(actual.liner,undefined);assert.equal(actual.top,false);assert.equal(actual.bottom,false);assert.equal(actual.captionAlign,'center');assert.ok(actual.dialogRight-actual.previewRight>=14);assert.equal(actual.width,198);assert.equal(actual.height,270);}else{assert.equal(actual.liner,'#e9e9e9');assert.equal(actual.top,true);assert.equal(actual.bottom,true);assert.equal(actual.width,198);assert.equal(actual.height,270);}assert.equal(actual.gap,false);assert.equal(actual.rollers,false);
   snapshots.push(actual);await win.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
   fs.writeFileSync(path.join(out,'wizard-roll-'+heading.toLowerCase().replaceAll(' ','-')+'.png'),(await win.webContents.capturePage({x:Math.floor(actual.x),y:Math.floor(actual.y),width:198,height:294})).toPNG());
  }
  if(heading==='Finished!')break;
  await win.webContents.executeJavaScript("(async()=>{if(document.querySelector('.nw-heading strong').textContent==='Stock Selection')nwStockCustom.click();for(let i=0;i<100&&nwNext.disabled;i++)await new Promise(r=>setTimeout(r,10));nwNext.click();})()");
 }
 assert.equal(snapshots.length,6);
 console.log(JSON.stringify({status:'PASS',pages:snapshots.map(({markup,...rest})=>rest),roundedBluePreviews:true}));win.destroy();app.exit(0);
 }catch(e){console.error(e.stack||e);win.destroy();app.exit(1);}});

