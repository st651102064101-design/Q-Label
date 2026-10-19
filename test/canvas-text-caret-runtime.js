'use strict';
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-caret-')));
const timer=setTimeout(()=>{console.error('Caret runtime timed out');app.exit(1);},90000);
app.on('browser-window-created',(_event,win)=>{win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{try{
 const result=await win.webContents.executeJavaScript(`(async()=>{
 while(appInitializing)await new Promise(r=>setTimeout(r,30));hideProjectHome();autoSaveEnabled=false;current=null;rawTemplate=null;
 const wait=()=>new Promise(r=>setTimeout(r,80)),results=[];
 for(const {rotation,zoom} of [{rotation:0,zoom:1},{rotation:0,zoom:1.5},{rotation:45,zoom:1},{rotation:90,zoom:1}]){
 document.getElementById('canvasTextEditor')?.blur();previewZoom=previewZoomTarget=zoom;editing={name:'Caret bounds',width_mm:60,height_mm:40,dpi:203,elements:[{type:'text',text:'1',x_mm:15,y_mm:15,font_family:'Arial',font_size_pt:28,bold:true,rotation_deg:rotation}]};refreshEditorUI();drawEditorCanvas();editorSel=0;editorSelection=new Set([0]);drawEditorCanvas();focusTextProperty(0,false);await wait();
 const input=document.getElementById('canvasTextEditor'),host=document.getElementById('canvasTextCaret');if(!host||getComputedStyle(input).caretColor!=='rgba(0, 0, 0, 0)')throw Error('Native caret still extends beyond the ink frame');
 const check=()=>{const line=host.firstElementChild.getBoundingClientRect(),frame=liveOverlay().querySelector('[data-editor-overlay="0"] .sel').getBoundingClientRect();if(line.left<frame.left-1||line.right>frame.right+1||line.top<frame.top-1||line.bottom>frame.bottom+1)throw Error('Caret outside green frame '+JSON.stringify({rotation,text:input.value,connected:host.isConnected,hidden:host.hidden,focus:document.activeElement.id,line:line.toJSON(),frame:frame.toJSON()}));results.push({rotation,inside:true});};check();
 input.value='12';input.dispatchEvent(new Event('input',{bubbles:true}));input.setSelectionRange(1,1);await wait();check();input.select();await wait();if(!host.hidden)throw Error('Caret must hide for range selection');input.setSelectionRange(2,2);await wait();if(host.hidden)throw Error('Collapsed caret missing');

 input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait();if(document.getElementById('canvasTextCaret'))throw Error('Caret leaked after editor closed');if(editing.elements[0].text!=='1')throw Error('Escape no longer restores the text');
 }
 return results;})()`);assert.equal(result.length,8);console.log('PASS canvas caret runtime '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e.stack);clearTimeout(timer);app.exit(1);}});});require('../gui/main');
