'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-stock-geometry-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true,offscreen:true}});try{
await win.loadURL('data:text/html,<style>aside{width:200px}svg{display:block;width:200px;height:270px}</style><aside></aside>');
for(const name of ['stock-catalog','stock-apply','stock-preview'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../gui',name+'.js'),'utf8')+';void 0;');
const result=await win.webContents.executeJavaScript(`(()=>{const stock=QLabelStockCatalog.getStock('ADES AG','040312fo'),template={};StockApply.applyCatalogStockToTemplate(template,stock);StockPreview.render(document.querySelector('aside'),stock);const rect=document.querySelector('[data-stock-labels] rect');return {width:template.width_mm,height:template.height_mm,shape:template.label_shape,radius:template.corner_radius_mm,ratio:Number(rect.getAttribute('width'))/Number(rect.getAttribute('height')),previewRadius:Number(rect.getAttribute('rx'))};})()`);
assert.ok(Math.abs(result.width-79.9846)<1e-8);assert.ok(Math.abs(result.height-39.9796)<1e-8);assert.equal(result.shape,'rounded');assert.equal(result.radius,3.175);assert.ok(result.previewRadius>0);assert.ok(Math.abs(result.ratio-result.width/result.height)<1e-8);
await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
const output=path.join(__dirname,'../test-results/stock-geometry.png');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,(await win.webContents.capturePage()).toPNG());console.log(JSON.stringify({status:'PASS',...result,screenshot:output}));win.destroy();app.exit(0);
}catch(e){console.error(e);win.destroy();app.exit(1);}});
