'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {extractBtwPreview}=require('../lib/btw-preview');
const source='C:/ProgramData/Seagull/PrintStation/wwwroot/Templates/Military/MIL-STD-130/A4A Label.btw';
const art=extractBtwPreview(fs.readFileSync(source),{width_in:3,height_in:1});assert.ok(art);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-native-library-'));app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1000,height:700,show:false,webPreferences:{contextIsolation:true}});
 try{
  const fixture=path.join(profile,'fixture.html');fs.writeFileSync(fixture,'<!doctype html><base href="'+require('node:url').pathToFileURL(path.resolve(__dirname,'../gui')+path.sep).href+'"><body style="background:#bbb"><select id="printerSelect"><option>Zebra ZT411 (600 dpi)</option></select><div id="result" style="width:900px;margin:100px auto"></div></body>');await win.loadFile(fixture);
  await win.webContents.executeJavaScript(`window.settings={};window.current={};window.rawTemplate={};window.editing=null;window.el=id=>document.getElementById(id);window.blankTemplate=()=>({});window.prepareEditorNavigation=async()=>true;window.rememberPrintPage=()=>{};window.updateConnSummary=()=>{};window.reloadTemplates=async()=>{};window.rememberRecentTemplate=()=>{};window.openEditor=t=>{window.imported=t;result.innerHTML=LabelPreview.renderPreviewSVG(t,{},null,{});result.querySelector('svg').style.width='900px';result.querySelector('svg').style.height='300px';};window.zebra={getPrinterResolution:async()=>({dpi:600}),listPrinters:async()=>['Zebra ZT411 (600 dpi)'],saveSettings:async()=>({}),createTemplate:async t=>({ok:true,file:'isolated.json',name:t.name}),ensureBarTenderLibraryBtw:async()=>(${JSON.stringify({ok:true,path:source,artwork:art,metadata:{width_in:3,height_in:1,width_mm:76.2,height_mm:25.4}})})};window.openTemplateBrowser=async()=>({item:{name:'A4A Label',width_in:3,height_in:1}});void 0;`);
  for(const name of ['barcode','object-data','bitmap','preview','stock-catalog','stock-apply','new-label-stock-mode','new-label-wizard','modal-windows'])await win.webContents.executeJavaScript(fs.readFileSync(path.resolve(__dirname,'../gui/'+name+'.js'),'utf8')+';void 0;');
  await win.webContents.executeJavaScript(`(async()=>{openNewLabelWizard();await new Promise(r=>setTimeout(r,50));nwTemplateLibrary.click();for(let i=0;i<100&&!nwLibraryDocument.textContent;i++)await new Promise(r=>setTimeout(r,10));await document.querySelector('#newLabelWizard form').onsubmit({preventDefault(){}});})()`);
  const actual=await win.webContents.executeJavaScript(`({created:!!window.imported,error:nwError.textContent,selection:nwLibraryDocument.textContent})`);
  assert.equal(actual.created,false,'unverified BTW artwork cannot become an editable project');assert.match(actual.error,/editable.*conversion.*not.*verified/i);assert.match(actual.selection,/Preview only/i);  console.log(JSON.stringify({status:'PASS',previewOnly:true,...actual,source}));win.destroy();app.exit(0);
 }catch(e){console.error(e.stack||e);win.destroy();app.exit(1);}
});


