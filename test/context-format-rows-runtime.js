'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-format-rows-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_,win)=>win.webContents.once('did-finish-load',async()=>{try{
 const result=await win.webContents.executeJavaScript(`(async()=>{while(appInitializing)await new Promise(r=>setTimeout(r,30));hideProjectHome();autoSaveEnabled=false;editing={width_mm:60,height_mm:40,dpi:203,elements:[{type:'text',label:'text 1',text:'A',x_mm:3,y_mm:3,height_mm:4,font_family:'Arial',font_size_pt:11.5}]};editorSel=0;editorSelection=new Set([0]);refreshEditorUI();
 const host=document.createElement('div');host.className='object-context-menu';host.style.cssText='display:block;position:fixed;top:80px;left:20px;width:290px';document.body.append(host);buildContextFormattingTools(host);
 const rows=[...host.querySelectorAll('.ocm-home-format-scroll > .text-format-line')],widths=rows.map(r=>r.getBoundingClientRect().width),tops=rows.map(r=>r.getBoundingClientRect().top);
 if(rows.length!==3||!(tops[0]<tops[1]&&tops[1]<tops[2]))throw Error('Expected three visible rows');
 if(Math.max(...widths)>450)throw Error('Formatting rows remain too wide: '+widths);
 const bold=host.querySelector('[aria-label="Bold"]');bold.click();await new Promise(r=>setTimeout(r,40));if(!editing.elements[0].bold)throw Error('Bold command lost');
 return {rows:rows.length,widths,tops,bold:true};})()`);
 assert.equal(result.rows,3);console.log('PASS context format rows '+JSON.stringify(result));clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e.stack);clearTimeout(timer);app.exit(1);}}));require('../gui/main');
