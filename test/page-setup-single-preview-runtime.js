'use strict';
// Electron runtime: every Page Setup tab shows one sheet preview (no roll continuation) on a blue-grey gradient.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-setup-preview-')));
const timer=setTimeout(()=>app.exit(1),90000);
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{
  try{
    const run=code=>win.webContents.executeJavaScript(code);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
    const inspect=tab=>run(`(async()=>{[...document.querySelectorAll('#pageSetupDialog nav button')].find(b=>b.textContent.trim()==='${tab}')?.click();await new Promise(r=>setTimeout(r,300));const aside=document.querySelector('#pageSetupDialog .modal-paper-preview'),svg=aside.querySelector('svg');return JSON.stringify({svgs:aside.querySelectorAll('svg').length,continuation:aside.querySelectorAll('[data-paper-continuation],[data-paper-roller],[data-paper-sliver],[data-paper-stack-outline]').length,background:svg.style.background,fullRect:svg.querySelector(':scope > rect').getAttribute('fill'),caption:aside.querySelector('small')?.innerText||'',cells:aside.querySelectorAll('[data-preview-cell]').length});})()`).then(JSON.parse);
    const tabs=['Stock','Page','Layout','Shape','Media Handling','Printing Order','Templates','Background'];

    // Roll: a single 4 x 4 in label.
    await run("hideProjectHome();editing={name:'roll',width_mm:101.6,height_mm:101.6,dpi:203,elements:[]};refreshEditorUI();drawEditorCanvas();document.querySelector('[aria-label=\"Page Setup\"]').click();0");await wait(500);
    for(const tab of tabs){
      const r=await inspect(tab);
      assert.equal(r.svgs,1,tab+': one preview only');
      assert.equal(r.continuation,0,tab+': no roll continuation');
      assert.match(r.background,/linear-gradient/,tab+': blue-grey gradient: '+r.background);
      assert.equal(r.fullRect,'none',tab+': the dark workspace rectangle is gone');
      assert.match(r.caption,/Template Size:/,tab+': caption');
    }

    // Sheet stock: 2 x 10 labels of 3 x 1 in on a Letter page keeps a single sheet and reports both sizes.
    await run("document.getElementById('setupClose')?.click();0");await wait(200);
    await run("editing={name:'sheet',width_mm:76.2,height_mm:25.4,dpi:203,elements:[],page:{enabled:true,manual_template:false,width_mm:215.9,height_mm:279.4,rows:10,columns:2,left_mm:6.35,right_mm:6.35,top_mm:12.7,bottom_mm:12.7,gap_x_mm:3,gap_y_mm:0}};refreshEditorUI();drawEditorCanvas();document.querySelector('[aria-label=\"Page Setup\"]').click();0");await wait(500);
    const sheet=await inspect('Layout');
    assert.equal(sheet.svgs,1);assert.equal(sheet.continuation,0);
    assert.equal(sheet.cells,20,'twenty labels drawn on one sheet');
    assert.match(sheet.caption,/Page Size:.*\n?.*Template Size:/s,'sheet stock shows Page Size and Template Size: '+JSON.stringify(sheet.caption));
    console.log('PASS page setup single preview',JSON.stringify({tabs:tabs.length,cells:sheet.cells}));
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
