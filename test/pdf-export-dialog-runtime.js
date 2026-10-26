'use strict';
// Electron runtime: File > Export PDF… opens the export dialog in PDF mode and hands the main process an exact-size PNG.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-pdf-dialog-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.once('did-finish-load',async()=>{
  try{
    const run=code=>win.webContents.executeJavaScript(code);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
    await run("hideProjectHome();editing={name:'pdf-check',width_mm:100,height_mm:50,dpi:203,elements:[{type:'box',x_mm:5,y_mm:5,width_mm:30,height_mm:15,thickness_mm:.5}]};refreshEditorUI();drawEditorCanvas();window.__pdf=null;{const original=ImageExport.deliver;ImageExport.deliver=(plan,dataUrl,bridge,name)=>original(plan,dataUrl,{savePdf:async payload=>{window.__pdf=payload;return {canceled:false,path:'C:/tmp/pdf-check.pdf'};}},name);}0");
    const menu=await run("(()=>{const item=[...document.querySelectorAll('button,[role=menuitem]')].find(b=>(b.getAttribute('aria-label')||b.textContent||'').trim().startsWith('Export PDF'));return !!item;})()");
    assert.equal(menu,true,'File menu has Export PDF…');
    await run("openImageExport({destination:'pdf'})");await wait(100);
    const open=JSON.parse(await run("JSON.stringify({title:document.querySelector('#imageExportDialog header strong').textContent,destination:document.querySelector('#imageExportDialog [name=destination]:checked').value,open:document.getElementById('imageExportDialog').open})"));
    assert.deepEqual(open,{title:'Export PDF',destination:'pdf',open:true});
    await run("document.querySelector('#imageExportDialog form').requestSubmit()");
    for(let i=0;i<50&&!(await run('window.__pdf'));i++)await wait(100);
    const payload=JSON.parse(await run("JSON.stringify({...window.__pdf,dataUrl:window.__pdf.dataUrl.slice(0,22),size:window.__pdf.dataUrl.length})"));
    assert.equal(payload.defaultName,'pdf-check.pdf');
    assert.equal(payload.dataUrl,'data:image/png;base64,');
    assert.ok(Math.abs(payload.width_mm-100)<0.01&&Math.abs(payload.height_mm-50)<0.01,'page size follows the template: '+payload.width_mm+'x'+payload.height_mm);
    assert.ok(payload.size>500,'PNG data present');
    await wait(200);
    assert.equal(await run("document.getElementById('imageExportDialog').open"),false,'dialog closes after saving');
    console.log('PASS pdf export dialog',JSON.stringify({w:payload.width_mm,h:payload.height_mm,bytes:payload.size}));
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
