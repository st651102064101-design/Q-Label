'use strict';
// Electron runtime: every Page Setup tab shows exactly one preview on a blue-grey gradient: soft roll slivers for a roll, one sheet for sheet stock.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-setup-preview-')));
const timer=setTimeout(()=>app.exit(1),90000);
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{
  try{
    const run=code=>win.webContents.executeJavaScript(code);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
    const inspect=tab=>run(`(async()=>{[...document.querySelectorAll('#pageSetupDialog nav button')].find(b=>b.textContent.trim()==='${tab}')?.click();await new Promise(r=>setTimeout(r,300));const aside=document.querySelector('#pageSetupDialog .modal-paper-preview'),svg=aside.querySelector('svg');return JSON.stringify({svgs:aside.querySelectorAll('svg').length,slivers:aside.querySelectorAll('[data-paper-sliver]').length,rollers:aside.querySelectorAll('[data-paper-roller],[data-paper-stack-outline]').length,stockPreviews:aside.querySelectorAll('#nwPreview,.nw-stock-preview').length,background:svg.style.background,fullRect:svg.querySelector(':scope > rect').getAttribute('fill'),caption:aside.querySelector('small')?.innerText||'',cells:aside.querySelectorAll('[data-preview-cell]').length,stockLabels:aside.querySelectorAll('[data-stock-label]').length,aspect:svg.getAttribute('preserveAspectRatio'),stops:[...aside.querySelectorAll('linearGradient[id$="background"] stop')].map(stop=>getComputedStyle(stop).stopColor)});})()`).then(JSON.parse);
    const tabs=['Stock','Page','Layout','Shape','Media Handling','Printing Order','Templates','Background'];

    // Roll: a single 4 x 4 in label.
    await run("hideProjectHome();editing={name:'roll',width_mm:101.6,height_mm:101.6,dpi:203,elements:[]};refreshEditorUI();drawEditorCanvas();document.querySelector('[aria-label=\"Page Setup\"]').click();0");await wait(500);
    for(const tab of tabs){
      const r=await inspect(tab);
      assert.equal(r.svgs,1,tab+': one preview only');
      assert.equal(r.slivers,2,tab+': BarTender top and bottom slivers for a roll');
      assert.equal(r.rollers,0,tab+': no mechanical rollers');
      assert.equal(r.stockPreviews,0,tab+': the wizard stock preview is never mixed in');
      assert.match(r.background,/linear-gradient/,tab+': blue-grey gradient: '+r.background);
      assert.equal(r.fullRect,'none',tab+': the dark workspace rectangle is gone');
      assert.match(r.caption,/Template Size:/,tab+': caption');
    }

    // Sheet stock: 2 x 10 labels of 3 x 1 in on a Letter page keeps a single sheet and reports both sizes.
    await run("document.getElementById('setupClose')?.click();0");await wait(200);
    await run("editing={name:'sheet',width_mm:76.2,height_mm:25.4,dpi:203,elements:[],page:{enabled:true,manual_template:false,width_mm:215.9,height_mm:279.4,rows:10,columns:2,left_mm:6.35,right_mm:6.35,top_mm:12.7,bottom_mm:12.7,gap_x_mm:3,gap_y_mm:0}};refreshEditorUI();drawEditorCanvas();document.querySelector('[aria-label=\"Page Setup\"]').click();0");await wait(500);
    const sheet=await inspect('Layout');
    assert.equal(sheet.svgs,1);assert.equal(sheet.slivers,0,'sheet stock has no roll slivers');
    assert.equal(sheet.cells,20,'twenty labels drawn on one sheet');
    assert.match(sheet.caption,/Page Size:.*\n?.*Template Size:/s,'sheet stock shows Page Size and Template Size: '+JSON.stringify(sheet.caption));
    // Applying a catalog stock while the dialog is open must replace the preview, not stack a second one.
    await run("editing.stock={name:'T',manufacturer:'Avery',printer_type:'Sheet',paper_width_mm:215.9,paper_height_mm:279.4,width_mm:76.2,height_mm:25.4,rows:10,columns:2,margin_left_mm:6.35,margin_top_mm:12.7,gap_x_mm:3,gap_y_mm:0,shape:0,corners_or_hole:0,border_or_diameter_mm:0};document.dispatchEvent(new Event('preview-updated'));0");await wait(300);
    const catalog=await inspect('Stock');
    assert.equal(catalog.svgs,1,'one preview after a catalog stock is applied');assert.equal(catalog.stockPreviews,1,'the stock preview replaces, not joins, the sheet preview');assert.equal(catalog.stockLabels,20);assert.match(catalog.caption,/Page Size:.*Template Size:/s,'catalog sheet reports both sizes: '+JSON.stringify(catalog.caption));assert.equal(catalog.aspect,'xMidYMid slice','no letterbox strips');assert.deepEqual(catalog.stops,['rgb(196, 213, 236)','rgb(138, 162, 196)'],'stock preview uses the blue-grey backdrop');
    console.log('PASS page setup single preview',JSON.stringify({tabs:tabs.length,cells:sheet.cells}));
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
