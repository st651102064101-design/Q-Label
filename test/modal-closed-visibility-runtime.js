'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-modal-visibility-'));app.setPath('userData',profile);
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,webPreferences:{contextIsolation:true}});
 const html='<!doctype html><body><dialog id="footerFixture"><header>Fixture</header><main>Content</main><footer><button>OK</button></footer></dialog><dialog><form><header>Nested</header><main>Content</main><footer><button>OK</button></footer></form></dialog></body>';
 await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));
 await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../gui/modal-windows.js'),'utf8'));
 const result=await win.webContents.executeJavaScript(`(()=>{const dialogs=[...document.querySelectorAll('dialog')],bad=dialogs.filter(d=>!d.open&&(getComputedStyle(d).display!=='none'||d.getBoundingClientRect().height!==0)).map(d=>d.id);const d=dialogs.find(d=>d.querySelector('footer'));d.showModal();const opened=d.open&&getComputedStyle(d).display!=='none'&&d.getBoundingClientRect().height>0;d.close();return {total:dialogs.length,bad,opened,closed:getComputedStyle(d).display==='none'&&d.getBoundingClientRect().height===0};})()`);
 assert.equal(result.total,2);assert.deepEqual(result.bad,[]);assert.equal(result.opened,true);assert.equal(result.closed,true);console.log('PASS modal visibility '+JSON.stringify(result));app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
