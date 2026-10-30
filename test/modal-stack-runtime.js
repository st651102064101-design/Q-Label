'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-modal-stack-')));
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:true,webPreferences:{contextIsolation:true}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<button id="canvas">Canvas</button><dialog id="parent"><header>Properties</header><button id="opener">Name</button></dialog><dialog id="child"><header>Name</header><input id="name"><button id="done">Done</button></dialog>'));
 await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../gui/modal-windows.js'),'utf8'));
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const p=document.getElementById('parent'),c=document.getElementById('child'),opener=document.getElementById('opener');
 p.showModal();opener.focus();c.showModal();
 const visible=p.open&&getComputedStyle(p).display!=='none'&&p.getBoundingClientRect().height>0;
 document.getElementById('canvas').focus();const trapped=c.contains(document.activeElement);
 let canvasClicks=0;document.getElementById('canvas').onclick=()=>canvasClicks++;document.getElementById('canvas').click();
 document.getElementById('done').focus();document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
 const tabWrapped=document.activeElement.getAttribute('aria-label')==='Minimize window';
 document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
 await new Promise(resolve=>setTimeout(resolve,50));
 return {visible,trapped,tabWrapped,canvasClicks,parentOpen:p.open,childClosed:!c.open,restored:document.activeElement===opener,parentInert:p.inert};
 })()`);
 assert.deepEqual(result,{visible:true,trapped:true,tabWrapped:true,canvasClicks:0,parentOpen:true,childClosed:true,restored:true,parentInert:false});
 // Window controls join the tab order; ensure real browser focus stays in the child above.
 console.log('PASS modal stack '+JSON.stringify(result));app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
