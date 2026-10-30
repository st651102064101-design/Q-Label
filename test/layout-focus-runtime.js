'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-layout-focus-')));
const output=path.join(__dirname,'../test-results/layout-focus');fs.mkdirSync(output,{recursive:true});
const timer=setTimeout(()=>{console.error('Layout focus runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_event,win)=>{const hide=()=>win.hide();win.on('show',hide);win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{try{
  const run=code=>win.webContents.executeJavaScript(code),wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
  await run(`window.prepareHotReload=()=>false;hideProjectHome();autoSaveEnabled=false;settings.unit='in';editing={name:'Layout focus fixture',width_mm:49.53,height_mm:50.8,dpi:203,elements:[],label_shape:'rounded',corner_radius_mm:3.175,stock:{printer_type:'Roll',type:'die-cut'},page:{enabled:true,width_mm:101.6,height_mm:101.6,rows:2,columns:2,left_mm:1.27,right_mm:1.27,top_mm:0,bottom_mm:0,gap_x_mm:0,gap_y_mm:0,manual_template:true,manual_gap:true}};refreshEditorUI();updateMeasureLabels();drawEditorCanvas();document.getElementById('pageSetupOpen').click();document.getElementById('tabLayout').click();0`);await wait(150);
  const before=await run('JSON.stringify(editing)'),fields=['pageTop','pageLeft','pageBottom','pageRight','edW','edH','pageGapX','pageGapY'];
  for(const field of fields){
    await run(`(()=>{const n=document.getElementById(${JSON.stringify(field)});n.focus();if(!document.hasFocus())n.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));})()`);await wait(90);
    const state=await run(`(()=>{const p=document.querySelector('#pageSetupDialog .modal-paper-preview'),g=p.querySelector('[data-layout-dimension]');return {count:p.querySelectorAll('[data-layout-dimension]').length,field:g?.dataset.layoutDimension,extensions:g?.querySelectorAll('[data-dimension-extension][stroke-dasharray="2 2"]').length,external:g?.querySelectorAll('[data-external-arrow]').length};})()`);
    assert.equal(state.count,1);assert.equal(state.field,field);assert.equal(state.extensions,2);if(['pageTop','pageBottom','pageGapX','pageGapY'].includes(field))assert.equal(state.external,2,'zero distances stay visible');
    const bounds=await run(`(()=>{const r=document.getElementById('pageSetupDialog').getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};})()`);
    win.removeListener('show',hide);win.showInactive();await run('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');await wait(150);fs.writeFileSync(path.join(output,field+'.png'),(await win.webContents.capturePage(bounds)).toPNG());win.hide();win.on('show',hide);
  }
  assert.equal(await run('JSON.stringify(editing)'),before,'focus does not mutate document');
  await run(`(()=>{const n=document.getElementById('pageGapX');n.focus();n.value='0.2';n.dispatchEvent(new Event('input',{bubbles:true}));})()`);await wait(150);
  assert.equal(await run(`editing.page.gap_x_mm`),5.08);assert.equal(await run(`document.querySelector('[data-layout-dimension]')?.dataset.layoutDimension`),'pageGapX');
  await run(`document.activeElement.blur();document.getElementById('pageSetupDialog').dispatchEvent(new FocusEvent('focusout',{bubbles:true}));0`);await wait(100);assert.equal(await run(`document.querySelector('[data-layout-dimension]')===null`),true,'blur clears measurement');
  await run(`document.getElementById('tabPage').click();0`);await wait(80);assert.equal(await run(`document.querySelector('[data-layout-dimension]')===null`),true);
  console.log('PASS all eight focus guides, dashed references, zero arrows, live inch gap edit, focus immutability, blur and tab cleanup; captures '+output);clearTimeout(timer);app.exit(0);
}catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});});
require('../gui/main');
