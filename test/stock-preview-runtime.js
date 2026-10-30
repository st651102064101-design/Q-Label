'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-stock-preview-'));
app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:900,height:720,show:false,webPreferences:{nodeIntegration:false,contextIsolation:true}});
  try{
    await win.loadURL('data:text/html,'+encodeURIComponent('<html><head></head><body><select id="printerSelect"><option value="Test 600dpi">Test 600dpi</option></select></body></html>'));
    await win.webContents.executeJavaScript(`window.settings={};window.el=id=>document.getElementById(id);window.zebra={getPrinterResolution:async()=>({dpi:600})};void 0;`);
    for(const name of ['stock-catalog','stock-preview','new-label-stock-mode','new-label-wizard'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../gui',name+'.js'),'utf8')+';void 0;');
    await win.webContents.executeJavaScript(`openNewLabelWizard();`);
    await new Promise(resolve=>setTimeout(resolve,100));
    const result=await win.webContents.executeJavaScript(`(()=>{nwNext.click();nwStockPredefined.checked=true;nwStockPredefined.dispatchEvent(new Event('change'));nwStockCategory.value='Advanced Labeling';nwStockCategory.dispatchEvent(new Event('change'));nwStockList.value='.75" Circle';nwStockList.dispatchEvent(new Event('change'));const e=document.querySelector('[data-stock-labels] ellipse');return {categories:nwStockCategory.options.length,size:nwSize.textContent,rx:e.getAttribute('rx'),ry:e.getAttribute('ry'),stockCount:QLabelStockCatalog.getManufacturers().reduce((n,m)=>n+QLabelStockCatalog.getStocks(m).length,0)}})()`);
    assert.ok(result.categories===54||result.categories===55);assert.equal(result.stockCount,7350);assert.equal(result.rx,result.ry);assert.equal(result.size,'Template Size: 19.05 × 19.05 mm');
    const visible=await win.webContents.executeJavaScript(`(()=>{const a=nwPreview.parentElement,r=a.getBoundingClientRect();return {hidden:a.hidden,display:getComputedStyle(a).display,width:r.width,height:r.height,disabled:nwStockCategory.disabled}})()`);
    assert.equal(visible.hidden,false);assert.notEqual(visible.display,'none');assert.ok(visible.width>180&&visible.height>240);assert.equal(visible.disabled,false);
    win.showInactive();await new Promise(resolve=>setTimeout(resolve,250));
    const output=path.resolve(process.argv[2]||path.join(profile,'stock-circle.png'));fs.mkdirSync(path.dirname(output),{recursive:true});
    const capture=await win.webContents.capturePage();assert.ok(!capture.isEmpty());fs.writeFileSync(output,capture.toPNG());
    const duplicate=await win.webContents.executeJavaScript(`(()=>{nwStockCategory.value='ADES AG';nwStockCategory.dispatchEvent(new Event('change'));const indices=[...nwStockList.options].flatMap((o,i)=>o.value==='45404'?[i]:[]);return indices.map(i=>{nwStockList.selectedIndex=i;nwStockList.dispatchEvent(new Event('change'));return Number(nwHeight.value);});})()`);
    assert.deepEqual(duplicate,[101.981,24.9936]);
    console.log(JSON.stringify({status:'PASS',...result,duplicateHeights:duplicate,screenshot:output,profile}));
    win.destroy();app.exit(0);
  }catch(error){console.error(error);win.destroy();app.exit(1);}
});
