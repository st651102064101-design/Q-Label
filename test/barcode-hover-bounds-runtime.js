'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-barcode-hover-')));
const timeout=setTimeout(()=>{console.error('Barcode hover runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_event,win)=>{win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{try{
 const result=await win.webContents.executeJavaScript(`(async()=>{
 while(appInitializing)await new Promise(r=>setTimeout(r,25));hideProjectHome();autoSaveEnabled=false;
 editing={name:'hover bounds',width_mm:100,height_mm:60,dpi:203,elements:[{type:'barcode128',text:'000',x_mm:5,y_mm:5,bar_height_mm:20,module_width:3,font_family:'Arial',font_size_pt:30,show_text:true,corner_radius_mm:2}],values:{}};
 editorSel=null;editorSelection=new Set();drawEditorCanvas();const frame=document.querySelector('#previewFrame'),hover=frame.querySelector('.hover-outline'),barcode=frame.querySelector('[data-label-element="0"]');
 if(!hover||!barcode?.querySelector('[data-barcode-hri] text'))throw Error('Barcode hover or text unavailable');
 const bounds=n=>['x','y','width','height'].map(k=>Number(n.getAttribute(k))),unselected=bounds(hover),ink=textInkBounds(frame.querySelector('svg'),0);if(!ink)throw Error('Text ink could not be measured');
 const bottom=unselected[1]+unselected[3];if(Math.abs(bottom-(ink.y+ink.h))>.08)throw Error('Hover bottom does not hug HRI: '+JSON.stringify({bottom,ink}));
 editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();const selected=bounds(frame.querySelector('.sel'));if(selected.some((value,i)=>Math.abs(value-unselected[i])>.08))throw Error('Hover differs from selection: '+JSON.stringify({unselected,selected}));
 [...document.querySelectorAll('.ribbon-tabs [role=tab]')].find(b=>b.textContent.trim()==='Insert').click();if(document.querySelector('#ribbon-insert [data-insert-tool="svg"]'))throw Error('SVG ribbon button still present');if(!document.querySelector('#insertPictureTool'))throw Error('Picture tool is missing');
 return {unselected,selected,inkBottom:ink.y+ink.h,svgRibbonRemoved:true,picturePresent:true};
 })()`);
 assert.ok(result.svgRibbonRemoved&&result.picturePresent);console.log('PASS barcode hover matches selection and HRI ink; standalone SVG ribbon button removed',JSON.stringify(result));clearTimeout(timeout);app.exit(0);
 }catch(e){console.error(e.stack||e);clearTimeout(timeout);app.exit(1);}});});
require('../gui/main');
