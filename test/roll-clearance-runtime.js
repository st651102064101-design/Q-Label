'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-roll-clearance-')));
const timer=setTimeout(()=>{console.error('Roll clearance runtime timed out');app.exit(1);},60000),output=path.join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
app.on('browser-window-created',(_e,win)=>{const hide=()=>win.hide();win.on('show',hide);win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{try{
  const run=code=>win.webContents.executeJavaScript(code),wait=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
  await run(`window.prepareHotReload=()=>false;hideProjectHome();settings.unit='in';editing={name:'roll-clearance-runtime',width_mm:49.53,height_mm:50.8,dpi:203,elements:[],label_shape:'rounded',corner_radius_mm:3.175,stock:{printer_type:'Roll',type:'die-cut'},page:{enabled:true,width_mm:101.6,height_mm:101.6,rows:2,columns:2,left_mm:1.27,right_mm:1.27,top_mm:0,bottom_mm:0,gap_x_mm:0,gap_y_mm:0,manual_template:false}};refreshEditorUI();document.getElementById("edName").value=editing.name;updateMeasureLabels();drawEditorCanvas();0`);
  const file=await run(`(async()=>{const result=await zebra.createTemplate(editing);if(!result.ok)throw Error(result.error);current={file:result.file,editable:true};return result.file;})()`);assert.ok(file);
  await run(`document.getElementById('pageSetupOpen').click();document.getElementById('tabShape').click();for(const id of ['shapeRadius','shapeThickness']){const n=document.getElementById(id);n.value='0.125';n.dispatchEvent(new Event('input',{bubbles:true}));}0`);await wait(180);
  assert.equal(await run(`['shapeRadius','shapeRadiusSlider','shapeThickness'].every(id=>{const n=document.getElementById(id);return n.checkValidity()&&Number(n.value)===.125;})`),true,'all linked controls accept exact .125in');
  await run(`document.getElementById('setupDone').click();0`);await wait(300);
  assert.equal(await run(`document.getElementById('pageSetupDialog').open`),false,'OK closes after fractional inches');
  await run(`persistEditor(true)`);
  const raw=await run(`zebra.loadTemplateRaw(${JSON.stringify(file)})`);assert.equal(raw.corner_radius_mm,3.175);assert.equal(raw.border_width_mm,3.175);
  await run(`editing=${JSON.stringify(raw)};refreshEditorUI();drawEditorCanvas();document.getElementById('pageSetupOpen').click();document.getElementById('tabShape').click();0`);await wait(180);
  assert.equal(await run(`['shapeRadius','shapeThickness'].every(id=>document.getElementById(id).value==='0.125')`),true,'disk reopen preserves exact displayed values');
  const check=async expected=>{
    const geometry=await run(`(()=>{const p=document.querySelector('#pageSetupDialog .modal-paper-preview'),cells=[...p.querySelectorAll('[data-preview-cell]')],n=(e,k)=>Number(e.getAttribute(k)),first=cells[0],last=cells.at(-1);return {count:cells.length,top:n(first,'y')-Number(p.querySelector('[data-paper-sliver="top"]').dataset.seamY),bottom:Number(p.querySelector('[data-paper-sliver="bottom"]').dataset.seamY)-n(last,'y')-n(last,'height'),internal:cells.length===4?n(cells[2],'y')-n(first,'y')-n(first,'height'):0,linerTop:n(p.querySelector('[data-paper-liner]'),'y1'),linerBottom:n(p.querySelector('[data-paper-liner]'),'y2')};})()`);
    assert.equal(geometry.count,expected);assert.ok(geometry.top>=2.99&&geometry.bottom>=2.99);assert.ok(Math.abs(geometry.internal)<.001);assert.ok(geometry.linerTop>=0&&geometry.linerBottom<=340);return geometry;
  };
  const capture=async name=>{const bounds=await run(`(()=>{const r=document.getElementById('pageSetupDialog').getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};})()`);win.removeListener('show',hide);win.showInactive();await wait(150);fs.writeFileSync(path.join(output,name),(await win.webContents.capturePage(bounds)).toPNG());win.hide();win.on('show',hide);};
  const four=await check(4);await capture('roll-clearance-four.png');
  await run(`editing.page={...editing.page,rows:1,columns:1};editing.width_mm=99.06;editing.height_mm=101.6;refreshEditorUI();drawEditorCanvas();document.dispatchEvent(new Event('preview-updated'));0`);await wait(150);
  const single=await check(1);await capture('roll-clearance-single.png');
  console.log('PASS fractional inch OK/disk reopen and one/four-label outer clearance: '+JSON.stringify({four,single}));clearTimeout(timer);app.exit(0);
}catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}});});
require('../gui/main');
