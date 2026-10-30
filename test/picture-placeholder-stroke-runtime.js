'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-placeholder-stroke-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:700,height:500,webPreferences:{contextIsolation:true}});try{
  await win.loadURL('data:text/html,<body style="margin:0;background:white"><div id="host"></div></body>');
  const gui=path.resolve(__dirname,'../gui');for(const name of ['object-data','preview','svg-selection-handles'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(gui,name+'.js'),'utf8'));
  const result=await win.webContents.executeJavaScript(`(()=>{
    const t={width_mm:50,height_mm:35,dpi:203,elements:[{type:'image',placeholder:true,x_mm:4,y_mm:4,width_mm:30,height_mm:22}]};
    document.getElementById('host').innerHTML=LabelPreview.renderPreviewSVG(t,{},[0],{}, {editorPlaceholders:true});
    const svg=document.querySelector('svg');svg.setAttribute('width','500');svg.setAttribute('height','350');const art=svg.querySelector('[data-label-element]'),nodes=[...art.querySelectorAll('rect,circle,path')];
    const measure=()=>nodes.map(n=>({width:getComputedStyle(n).strokeWidth,effect:getComputedStyle(n).vectorEffect}));
    const selected=measure();art.setAttribute('transform','matrix(1.3 0 0 1.3 0 0)');SvgSelectionHandles.preserveResizeStrokes(art,10,n=>getComputedStyle(n));const resizing=measure();SvgSelectionHandles.restoreResizeStrokes(art);art.removeAttribute('transform');const after=measure();return {selected,resizing,after};
  })()`);
  for(const state of [result.selected,result.resizing,result.after])for(const stroke of state)assert.equal(stroke.effect,'non-scaling-stroke');assert.deepEqual(result.selected,result.resizing);assert.deepEqual(result.after,result.selected);
  console.log('PASS placeholder stroke Chromium fixture '+JSON.stringify(result));win.destroy();app.exit(0);
}catch(error){console.error(error);win.destroy();app.exit(1);}});
