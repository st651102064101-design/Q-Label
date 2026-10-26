'use strict';
// Electron runtime: Print dialog > Save as PDF… writes a real PDF with one page per label in the print job.
const electron=require('electron'),{app,dialog}=electron,fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-print-pdf-')),target=path.join(out,'job.pdf');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-print-pdf-data-')));
dialog.showSaveDialog=async()=>({canceled:false,filePath:target});// no interactive dialog in the test
const timer=setTimeout(()=>app.exit(1),90000);
const pageCount=file=>(fs.readFileSync(file).toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.once('did-finish-load',async()=>{
  try{
    const run=code=>win.webContents.executeJavaScript(code);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
    await run("hideProjectHome();editing={name:'print-pdf',width_mm:100,height_mm:50,dpi:203,elements:[{type:'text',text:'Hello',x_mm:5,y_mm:5,height_mm:6,width_mm:20,font:'0'},{type:'box',x_mm:5,y_mm:20,width_mm:30,height_mm:15,thickness_mm:.5}]};refreshEditorUI();drawEditorCanvas();0");
    await run("openPrintDialog()");await wait(400);
    await run("(()=>{const copies=document.getElementById('pdCopies');copies.value='3';copies.dispatchEvent(new Event('input',{bubbles:true}));})()");
    assert.equal(await run("!!document.getElementById('pdPdf')"),true,'Print dialog has Save as PDF…');
    await run("document.getElementById('pdPdf').click()");
    for(let i=0;i<100&&!fs.existsSync(target);i++)await wait(150);
    const message=await run("document.getElementById('pdMessage').textContent");
    assert.ok(fs.existsSync(target),'PDF written; dialog message: '+message);
    const bytes=fs.readFileSync(target);
    assert.ok(bytes.subarray(0,5).toString('latin1')==='%PDF-','valid PDF header');
    assert.equal(pageCount(target),3,'one page per copy');
    const box=/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(bytes.toString('latin1'));
    assert.ok(box&&Math.abs(Number(box[1])-100/25.4*72)<2&&Math.abs(Number(box[2])-50/25.4*72)<2,'page size follows the label: '+(box&&box.slice(1)));
    assert.match(await run("document.getElementById('pdMessage').textContent"),/PDF saved/);
    console.log('PASS print to pdf',JSON.stringify({bytes:bytes.length,pages:3,box:box.slice(1)}));
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
