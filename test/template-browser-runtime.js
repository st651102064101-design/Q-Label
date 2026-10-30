'use strict';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-template-browser-'));app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1560,height:960,show:false,webPreferences:{contextIsolation:true,backgroundThrottling:false}});
 try{
  const gui=path.resolve(__dirname,'../gui'),fixture=path.join(profile,'fixture.html');
  const globalStyles=[...fs.readFileSync(path.join(gui,'index.html'),'utf8').matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(m=>m[0]).join('');
  fs.writeFileSync(fixture,`<!doctype html><html><head><base href="${pathToFileURL(gui+'/').href}">${globalStyles}</head><body><script src="modal-windows.js"></script><script src="template-library-catalog.js"></script><script src="template-browser.js"></script></body></html>`);
  await win.loadFile(fixture);await win.webContents.executeJavaScript('void openTemplateBrowser()');
  await win.webContents.executeJavaScript(`Promise.all([...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.sheet?Promise.resolve():new Promise(r=>{l.onload=r;l.onerror=r})))`);
  const images=await win.webContents.executeJavaScript(`Promise.race([Promise.all([...document.querySelectorAll('.tb-thumb img')].slice(0,4).map(i=>i.decode().then(()=>true,()=>false))),new Promise(r=>setTimeout(()=>r([]),20000))])`);
  assert.ok(images.filter(Boolean).length>=1,'at least one actual Cloud thumbnail decodes through the public CDN');
  const status=await win.webContents.executeJavaScript(`document.querySelector('#tbStatus').textContent`);assert.match(status,/1 - 50, of 480 templates found/);
  const measurements=[];
  for(const width of [1560,1000,600]){
   win.setSize(width,960);await win.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
   const actual=await win.webContents.executeJavaScript(`(()=>{const d=document.querySelector('dialog'),g=d.querySelector('#tbGrid'),c=g.querySelector('.tb-card'),t=c.querySelector('.tb-thumb'),s=d.querySelector('.tb-search');return {card:c.getBoundingClientRect().height,thumb:t.getBoundingClientRect().height,grid:g.clientHeight,scroll:g.scrollHeight,overflow:g.scrollWidth>g.clientWidth,header:d.querySelector('.tb-header').getBoundingClientRect().height,searchRight:s.getBoundingClientRect().right,gridRight:g.getBoundingClientRect().right,rows:[...g.children].slice(0,5).map(x=>x.getBoundingClientRect().top)}})()`);
   assert.equal(actual.card,400,JSON.stringify(actual));assert.equal(actual.thumb,176);assert.ok(actual.scroll>actual.grid);assert.equal(actual.overflow,false);assert.equal(actual.header,80);measurements.push({width,...actual});
   const out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,`template-manager-${width}.png`),(await win.webContents.capturePage()).toPNG());
  }
  await win.webContents.executeJavaScript(`document.querySelector('#tbAddFilter').click();document.querySelector('[data-filter-category="Industries"]').click()`);
  const filter=await win.webContents.executeJavaScript(`(()=>{const d=document.querySelector('.tb-filter-dialog'),r=d.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,title:d.querySelector('#tbFilterTitle').textContent,tabs:[...d.querySelectorAll('[role=tab]')].map(x=>x.textContent.trim()),tiles:d.querySelectorAll('.tb-filter-option').length,industry:d.querySelector('h2').textContent}})()`);
  assert.equal(filter.title,'Add a filter');assert.deepEqual(filter.tabs,['Standards and Technology','Industries','Shapes and Orientation']);assert.equal(filter.industry,'Industries');assert.ok(filter.tiles>0);assert.ok(filter.width<800&&filter.height<550,JSON.stringify(filter));
  const out=path.resolve(__dirname,'../test-results');fs.writeFileSync(path.join(out,'template-manager-filter-dialog.png'),(await win.webContents.capturePage()).toPNG());
  console.log(JSON.stringify({status:'PASS',measurements,filter}));win.destroy();app.exit(0);
 }catch(e){console.error(e);win.destroy();app.exit(1);}
});
