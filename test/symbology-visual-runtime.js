'use strict';
// Isolated offscreen rendering of the actual Properties controller and styles.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-sym-visual-')));
app.commandLine.appendSwitch('disable-gpu');
const timer=setTimeout(()=>{console.error('Visual capture timed out');app.exit(1);},30000);
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1000,height:650,show:false,webPreferences:{offscreen:true,contextIsolation:false,nodeIntegration:true}});
 win.webContents.on('console-message',(_event,_level,message)=>console.error(message));
 let ready=false;
 win.webContents.on('paint',(_e,_dirty,image)=>{if(!ready||image.isEmpty())return;const pixels=image.toBitmap();let ink=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<80&&pixels[i+1]<80&&pixels[i+2]<80)ink++;if(ink<500)return;ready=false;const output='D:/QLabel-agent-work/symbology-page-visual.png';fs.writeFileSync(output,image.toPNG());console.log('PASS visual '+output+' ink='+ink);clearTimeout(timer);app.exit(0);});
 const root=path.resolve(__dirname,'../gui');
 await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<html><head><style>body{margin:0;background:#d1deeb;--border:#ccc;--card:#fff;--text:#000}'+fs.readFileSync(path.join(root,'object-properties-modern.css'),'utf8')+fs.readFileSync(path.join(root,'object-properties-symbology.css'),'utf8')+'</style></head><body></body></html>'));
 await win.webContents.executeJavaScript(`(()=>{try{
 const fs=require('node:fs'),root=${JSON.stringify(root)};
 Object.defineProperty(window.crypto,'randomUUID',{value:require('node:crypto').randomUUID});
 Object.assign(window,{editing:{width_mm:80,height_mm:50,dpi:600,elements:[{type:'barcode128',label:'barcode 1',text:'12345678',module_width:6.906,bar_height_mm:12.6238}]},settings:{},qrCache:{},mmToUnit:Number,unitToMm:Number,unitSuffix:()=> 'mm',measureUnit:()=> 'mm',cancelTextClick(){},readEditorIntoDraft(){},ensureQR:async()=>{},qrValuesOf:()=>[],dmValuesOf:()=>[],pushSnapshot(){},refreshEditorUI(){},touchEditor(){},updateUndoButtons(){},persistEditor:async()=>{},sampleData:()=>({}),ObjectPropertiesSymbology:require(root+'/object-properties-symbology.js'),ObjectData:require(root+'/object-data.js'),ObjectPropertiesDocument:require(root+'/object-properties-document.js'),SourceModel:require(root+'/source-model.js'),ObjectNames:require(root+'/object-names.js'),LabelPreview:{computeBoxes:()=>[{w:25,h:15}],renderPreviewSVG:()=>'<svg></svg>'}});
 eval(fs.readFileSync(root+'/object-properties.js','utf8'));openObjectProperties(0);
 const d=document.getElementById('objectProperties');d.style.margin='10px';d.style.position='fixed';d.style.left='0';d.style.top='0';
 }catch(e){console.error(e.stack);throw e;}})()`);
 await new Promise(r=>setTimeout(r,500));ready=true;win.webContents.invalidate();
}).catch(error=>{console.error(error.stack);clearTimeout(timer);app.exit(1);});
