'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-icons-')));
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:800,height:800});await win.loadURL('data:text/html,<div id="previewFrame"></div>');
 await win.webContents.executeJavaScript('window.editing={elements:[{type:"text",text:"A"}]};window.editorSel=0;window.editorSelection=new Set([0]);window.elementClipboard=[{type:"text"}];window.fitPreviewPage=()=>{};window.copied=0;window.copySelectedElement=()=>copied++;void 0;');
 await win.webContents.executeJavaScript(fs.readFileSync(require.resolve('../gui/object-context-menu.js'),'utf8'));
 const result=await win.webContents.executeJavaScript(`document.getElementById('previewFrame').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:200,clientY:50}));const menu=document.querySelector('.object-context-menu'),items=[...menu.querySelectorAll('[role="menuitem"]')],names=items.map(b=>b.querySelector('.ocm-label')?.textContent);for(const b of items){const svg=b.querySelector('.ocm-icon svg');if(!svg||svg.getBoundingClientRect().width<16)throw Error('Missing SVG '+b.textContent);const colored=svg.classList.contains('ribbon-color-icon');if(!colored&&getComputedStyle(svg).stroke==='none')throw Error('Missing SVG stroke '+b.textContent);}items.find(b=>b.querySelector('.ocm-label')?.textContent==='Copy').click();({names,copied});`);
 assert.equal(result.copied,1);assert.ok(result.names.includes('Copy'));console.log('PASS isolated Chromium context menu '+JSON.stringify(result));app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1);}});
