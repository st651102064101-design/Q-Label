'use strict';
// Electron runtime: every Page Setup tab shows exactly one preview on a blue-grey gradient: soft roll slivers for a roll, one sheet for sheet stock.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-setup-preview-')));
const timer=setTimeout(()=>app.exit(1),90000);
app.on('browser-window-created',(_e,win)=>{const hide=()=>win.hide();win.on('show',hide);win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{
  try{
    const run=async code=>{const r=await win.webContents.executeJavaScript('(async()=>{try{return {result:await eval('+JSON.stringify(code)+')};}catch(error){return {error:error.stack||String(error)};}})()');if(r.error)throw Error(r.error);return r.result;};
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
    const inspect=tab=>run(`(async()=>{document.getElementById('tab${tab}')?.click();await new Promise(r=>setTimeout(r,300));const aside=document.querySelector('#pageSetupDialog .modal-paper-preview'),svg=aside.querySelector('svg');return JSON.stringify({svgs:aside.querySelectorAll('svg').length,slivers:aside.querySelectorAll('[data-paper-sliver]').length,rollers:aside.querySelectorAll('[data-paper-roller],[data-paper-stack-outline]').length,stockPreviews:aside.querySelectorAll('#nwPreview,.nw-stock-preview').length,background:svg.style.background,fullRect:svg.querySelector(':scope > rect').getAttribute('fill'),caption:aside.querySelector('small')?.innerText||'',cells:aside.querySelectorAll('[data-preview-cell]').length,stockLabels:aside.querySelectorAll('[data-stock-label]').length,aspect:svg.getAttribute('preserveAspectRatio'),stops:[...aside.querySelectorAll('linearGradient[id$="background"] stop')].map(stop=>getComputedStyle(stop).stopColor)});})()`).then(JSON.parse);
    const tabs=['Stock','Page','Layout','Shape','Media Handling','Printing Order','Templates','Background'];
    const verifyEdges=()=>run(`(()=>{const pane=document.querySelector('#pageSetupDialog .modal-paper-preview'),faces=[...pane.querySelectorAll('[data-preview-cell]')];if(!faces.length||faces.some(face=>face.getAttribute('stroke')!=='#222'||face.getAttribute('stroke-width')!=='.8'||face.hasAttribute('stroke-dasharray')))throw Error('A Page Setup face has a missing, pale or dashed edge');return faces.length;})()`);

    // Roll: a single 4 x 4 in label.
    await run("window.prepareHotReload=()=>false;hideProjectHome();editing={name:'roll',width_mm:101.6,height_mm:101.6,dpi:203,elements:[]};refreshEditorUI();drawEditorCanvas();document.querySelector('[aria-label=\"Page Setup\"]').click();0");await wait(500);
    for(const tab of tabs){
      const r=await inspect(tab);
      assert.equal(r.svgs,1,tab+': one preview only');
      assert.equal(r.slivers,2,tab+': BarTender top and bottom slivers for a roll');
      assert.equal(r.rollers,0,tab+': no mechanical rollers');
      assert.equal(r.stockPreviews,0,tab+': the wizard stock preview is never mixed in');
      assert.match(r.background,/linear-gradient/,tab+': blue-grey gradient: '+r.background);
      assert.equal(r.fullRect,'none',tab+': the dark workspace rectangle is gone');
      assert.match(r.caption,/Template Size:/,tab+': caption');
      assert.equal(await verifyEdges(),1,tab+': single label has a visible solid outline');
    }

    // Multiple rows/columns are still a roll when Roll media is selected.
    await run("document.getElementById('setupCancel')?.click();0");await wait(200);
    await run("editing={name:'2x2 roll',width_mm:50.8,height_mm:50.8,dpi:203,elements:[],label_shape:'rounded',corner_radius_mm:6.35,stock:{printer_type:'Roll',type:'die-cut'},page:{enabled:true,manual_template:false,width_mm:104.14,height_mm:101.6,rows:2,columns:2,left_mm:1.27,right_mm:1.27,top_mm:0,bottom_mm:0,gap_x_mm:0,gap_y_mm:0}};refreshEditorUI();drawEditorCanvas();document.querySelector('[aria-label=\"Page Setup\"]').click();0");await wait(300);
    const roll=await inspect('Layout');assert.equal(await run("document.getElementById('pageSetupDialog').open"),true);assert.equal(roll.cells,4);assert.equal(roll.slivers,4,'roll has a previous/next label per column');assert.equal(roll.rollers,0);
    for(const tab of tabs){await inspect(tab);assert.equal(await verifyEdges(),4,tab+': four solid label outlines');}
    await inspect('Layout');
    const verifyRoll=()=>run(`(()=>{const pane=document.querySelector('#pageSetupDialog .modal-paper-preview'),cells=[...pane.querySelectorAll('[data-layout-cell] [data-preview-cell]')],n=(cell,key)=>+cell.getAttribute(key),scale=n(cells[0],'width')/((editing.page.width_mm-editing.page.left_mm-editing.page.right_mm-editing.page.gap_x_mm)/2);if(cells.some(c=>!(n(c,'rx')>0)))throw Error('Rounded cell corners missing');if(Math.abs(n(cells[1],'x')-n(cells[0],'x')-n(cells[0],'width')-editing.page.gap_x_mm*scale)>.01)throw Error('Gap differs from configured physical size');return true;})()`);
    await verifyRoll();
    const capture=async name=>{win.removeListener('show',hide);win.showInactive();await wait(200);const rect=await run("(()=>{const r=document.querySelector('#pageSetupDialog .modal-paper-preview').getBoundingClientRect();return {x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)}})()");fs.mkdirSync(path.join(__dirname,'../test-results'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../test-results',name),(await win.webContents.capturePage(rect)).toPNG());win.hide();win.on('show',hide);};
    await capture('page-setup-roll-2x2.png');
    await capture('page-setup-outlines-layout.png');await inspect('Page');await capture('page-setup-outlines-page.png');await inspect('Layout');
    await inspect('Shape');
    await run("const border=document.getElementById('shapeBorder');border.checked=true;border.dispatchEvent(new Event('change',{bubbles:true}));const width=document.getElementById('shapeThickness');width.value=1;width.dispatchEvent(new Event('input',{bubbles:true}));0");await wait(200);
    assert.equal(await run("(()=>{const pane=document.querySelector('#pageSetupDialog .modal-paper-preview'),borders=[...pane.querySelectorAll('[data-label-shape]:not([data-preview-cell])')];return borders.length===4&&borders.every(b=>+b.getAttribute('stroke-width')>.8);})()"),true,'enabled printed borders retain their configured width in the real preview');
    await run("const border=document.getElementById('shapeBorder');border.checked=false;border.dispatchEvent(new Event('change',{bubbles:true}));0");await wait(200);assert.equal(await verifyEdges(),4);await inspect('Layout');
    await run("for(const [id,value] of [['pageGapX',3],['pageGapY',2]]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));}0");await wait(200);await verifyRoll();await capture('page-setup-roll-2x2-gap.png');

    // Sheet stock: 2 x 10 labels of 3 x 1 in on a Letter page keeps a single sheet and reports both sizes.
    await run("document.getElementById('setupClose')?.click();0");await wait(200);
    await run("editing={name:'sheet',width_mm:76.2,height_mm:25.4,dpi:203,elements:[],stock:{printer_type:'Sheet'},page:{enabled:true,manual_template:false,width_mm:215.9,height_mm:279.4,rows:10,columns:2,left_mm:6.35,right_mm:6.35,top_mm:12.7,bottom_mm:12.7,gap_x_mm:3,gap_y_mm:0}};refreshEditorUI();drawEditorCanvas();document.querySelector('[aria-label=\"Page Setup\"]').click();0");await wait(500);
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
