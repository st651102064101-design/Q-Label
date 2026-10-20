'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-paper-margins-'));
app.setPath('userData',directory);app.setPath('sessionData',directory);
app.disableHardwareAcceleration();
const deadline=setTimeout(()=>{console.error('Paper margin Chromium fixture timed out');app.exit(1);},45000);
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:900,height:700,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false}});
  win.webContents.on('console-message',event=>console.log('Chromium: '+event.message));
  try{
    await win.loadURL('data:text/html,'+encodeURIComponent('<html><body style="margin:0;background:#c4c4c4;font:14px Segoe UI"><button id="gap"><span class="ribbon-caption"></span></button><div id="preview" style="width:700px;height:550px;margin:30px auto"></div></body></html>'));
    for(const file of ['object-data.js','object-layout.js','page-gap.js','preview.js'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../gui',file),'utf8'));
    const result=await win.webContents.executeJavaScript(`(()=>{
      const template={width_mm:50,height_mm:35,dpi:203,elements:[{type:'box',x_mm:3,y_mm:3,width_mm:10,height_mm:8,fill_color:'#111'}],page:{enabled:true,width_mm:53.56,height_mm:38.56,rows:1,columns:1,left_mm:1.78,right_mm:1.78,top_mm:1.78,bottom_mm:1.78,gap_x_mm:0,gap_y_mm:0}};
      const before=JSON.stringify(template),button=document.getElementById('gap'),preview=document.getElementById('preview');
      const paint=show=>{preview.innerHTML=LabelPreview.renderPreviewSVG(template,{},[0],{}, {paperPage:show,designSheet:true,before:PageGap.render({show,page:template.page,templateWidth:50,templateHeight:35})});const svg=preview.querySelector('svg');svg.style.width='100%';svg.style.height='100%';};
      const toggle=PageGap.bindToggle(button,paint,()=>PageGap.hasGap(template.page));paint(false);
      if(button.disabled||preview.querySelector('[data-paper-margin]'))throw Error('Incorrect single-column initial toggle state');
      button.click();
      const svg=preview.querySelector('svg'),edges=[...svg.querySelectorAll('[data-paper-margin]')];
      if(edges.length!==4||edges.some(edge=>!edge.querySelector('text').textContent.includes('1.78 mm')))throw Error('Four margin labels missing');
      if(svg.getAttribute('viewBox')!=='-1.78 -1.78 53.56 38.56')throw Error('Physical page viewBox incorrect');
      if(edges.some(edge=>{const r=edge.querySelector('rect').getBoundingClientRect();return r.width<=0||r.height<=0;}))throw Error('A margin is not visibly rendered');
      button.click();if(toggle.visible||preview.querySelector('[data-paper-margin]')||preview.querySelector('svg').getAttribute('viewBox')!=='0 0 50 35')throw Error('Hide gap does not restore the label');
      if(JSON.stringify(template)!==before)throw Error('Margin toggle changed document data');
      button.click();return {singleColumn:true,margins:4,distanceMm:1.78,toggleRoundTrip:true,modelUnchanged:true};
    })()`);
    const screenshot=path.join(os.tmpdir(),'qlabel-paper-margins-runtime.png');
    win.showInactive();await new Promise(resolve=>setTimeout(resolve,100));fs.writeFileSync(screenshot,(await win.capturePage()).toPNG());
    console.log('PASS '+JSON.stringify({...result,screenshot}));clearTimeout(deadline);app.exit(0);
  }catch(error){console.error(error.stack);clearTimeout(deadline);app.exit(1);}
});
