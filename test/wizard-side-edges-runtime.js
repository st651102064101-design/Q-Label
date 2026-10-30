'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-wizard-side-edges-'));
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
    for(let step=0;step<4;step++){
      if(step===1)for(let wait=0;wait<100&&await win.webContents.executeJavaScript('nwNext.disabled');wait++)await new Promise(resolve=>setTimeout(resolve,10));
      if(step===2)await win.webContents.executeJavaScript('nwStockCustom.click()');
      await win.webContents.executeJavaScript('nwNext.click();new Promise(r=>setTimeout(r,0))');
    }
    await win.webContents.executeJavaScript("nwSideEdgesYes.click();nwUnit.value='in';nwUnit.dispatchEvent(new Event('change',{bubbles:true}));new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
    const sideEdges=await win.webContents.executeJavaScript(`(()=>{const d=document.querySelector('#newLabelWizard').getBoundingClientRect(),b=document.querySelector('.nw-body'),a=b.querySelector(':scope > aside'),p=document.querySelector('#nwPreview'),s=document.querySelector('#nwSize'),ar=a.getBoundingClientRect(),pr=p.getBoundingClientRect(),sr=s.getBoundingClientRect(),edgeFields=[...document.querySelectorAll('.nw-edge-row')].map(row=>({label:row.querySelector('.nw-edge-text').textContent.trim(),value:row.querySelector('input').value,unit:row.querySelector('.nw-edge-unit').textContent}));return {heading:document.querySelector('.nw-heading strong').textContent,step:b.dataset.step,previewHidden:a.hidden,dialogRight:d.right,paneRight:ar.right,paneWidth:ar.width,previewRight:pr.right,previewBottom:pr.bottom,sizeTop:sr.top,sizeRight:sr.right,sizeHeight:sr.height,yesSelected:nwSideEdgesYes.checked,widthsEnabled:!nwEdgeWidths.disabled,edgeFields}})()`);
    assert.equal(sideEdges.heading,'Side Edges',`runtime reaches the Side Edges reference page: ${JSON.stringify(sideEdges)}`);
    assert.equal(sideEdges.step,'4');assert.equal(sideEdges.previewHidden,false);assert.equal(sideEdges.yesSelected,true);assert.equal(sideEdges.widthsEnabled,true);
    assert.ok(sideEdges.paneWidth>=190,`Side Edges preview pane is at least 190px wide: ${JSON.stringify(sideEdges)}`);
    assert.ok(sideEdges.dialogRight-sideEdges.paneRight>=14&&sideEdges.dialogRight-sideEdges.paneRight<=22,`Side Edges pane keeps the reference right gutter: ${JSON.stringify(sideEdges)}`);
    assert.ok(Math.abs(sideEdges.previewRight-sideEdges.paneRight)<2&&sideEdges.sizeTop>=sideEdges.previewBottom-1&&Math.abs(sideEdges.sizeRight-sideEdges.paneRight)<2&&sideEdges.sizeHeight<=15,`preview and Template Size align within the pane: ${JSON.stringify(sideEdges)}`);
    assert.deepEqual(sideEdges.edgeFields,[{label:'Left:',value:'0.05',unit:'in'},{label:'Right:',value:'0.05',unit:'in'}]);
    const geometry=await win.webContents.executeJavaScript(`(()=>{const initial={width:+nwWidth.value,left:+nwEdgeLeft.value,right:+nwEdgeRight.value};for(const id of ['nwEdgeLeft','nwEdgeRight']){const f=document.getElementById(id);f.value='1.05';f.dispatchEvent(new Event('input',{bubbles:true}));}const svg=document.querySelector('#nwPreview'),a=svg.querySelector('[data-liner="left"]'),b=svg.querySelector('[data-liner="right"]'),cell=svg.querySelector('[data-preview-cell]');return {initial,left:+a.getAttribute('width'),right:+b.getAttribute('width'),width:+cell.getAttribute('width'),height:+cell.getAttribute('height'),radius:+cell.getAttribute('rx'),fill:a.getAttribute('fill'),backing:svg.querySelector('[data-reference-liner]')?.getAttribute('fill'),size:document.getElementById('nwSize').textContent,actual:+nwWidth.value};})()`);assert.equal(geometry.initial.width,4);assert.ok(Math.abs(geometry.actual-2)<.001,JSON.stringify(geometry));assert.ok(Math.abs(geometry.left-geometry.right)<.01,JSON.stringify(geometry));assert.ok(Math.abs(geometry.left/geometry.width-1.05/2)<.001,JSON.stringify(geometry));assert.ok(Math.abs(geometry.width/geometry.height-.5)<.001,JSON.stringify(geometry));assert.ok(geometry.radius>5,JSON.stringify(geometry));assert.equal(geometry.fill,'#e9e9e9');assert.equal(geometry.backing,'#e9e9e9');assert.match(geometry.size,/2.*4/);
    const invalid=await win.webContents.executeJavaScript(`(()=>{nwEdgeLeft.value='5.05';nwEdgeLeft.dispatchEvent(new Event('input',{bubbles:true}));const result={message:nwError.textContent,disabled:nwNext.disabled,preview:getComputedStyle(nwPreview).visibility};nwNext.click();result.heading=document.querySelector('.nw-heading strong').textContent;return result})()`);assert.match(invalid.message,/insufficient template width/i);assert.equal(invalid.disabled,true);assert.equal(invalid.preview,'hidden');assert.equal(invalid.heading,'Side Edges');
    const corrected=await win.webContents.executeJavaScript(`(()=>{nwEdgeLeft.value='1.05';nwEdgeLeft.dispatchEvent(new Event('input',{bubbles:true}));return {message:nwError.textContent,disabled:nwNext.disabled,preview:getComputedStyle(nwPreview).visibility}})()`);assert.equal(corrected.message,'');assert.equal(corrected.disabled,false);assert.equal(corrected.preview,'visible');
    await win.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    const screenshot=path.join(output,'new-label-side-edges-preview.png');fs.writeFileSync(screenshot,(await win.webContents.capturePage()).toPNG());
    console.log(JSON.stringify({status:'PASS',sideEdges,screenshot}));win.destroy();app.exit(0);
  }catch(error){console.error(error);win.destroy();app.exit(1);}
});
