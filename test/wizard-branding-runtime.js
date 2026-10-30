'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-wizard-branding-'));
app.setPath('userData',profile);app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:900,height:720,show:false,webPreferences:{contextIsolation:true,backgroundThrottling:false,offscreen:true}});
  try{
    const gui=path.resolve(__dirname,'../gui'),fixture=path.join(profile,'fixture.html');
    fs.writeFileSync(fixture,`<!doctype html><html><head><base href="${pathToFileURL(gui+path.sep).href}"></head><body><select id="printerSelect"><option>Zebra ZT411 (600 dpi)</option></select></body></html>`);
    await win.loadFile(fixture);
    await win.webContents.executeJavaScript("window.settings={};window.el=id=>document.getElementById(id);window.zebra={getPrinterResolution:async()=>({dpi:600})};void 0;");
    for(const name of ['new-label-stock-mode','new-label-wizard','modal-windows'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(gui,name+'.js'),'utf8')+';void 0;');
    await win.webContents.executeJavaScript('openNewLabelWizard();');
    await win.webContents.executeJavaScript("Promise.all([...document.querySelectorAll('#newLabelWizard img')].map(image=>image.decode()))");
    const steps=await win.webContents.executeJavaScript(`(()=>{const out=[];for(let i=0;i<8;i++){const heading=document.querySelector('.nw-heading'),art=heading.querySelector('img');out.push({title:heading.querySelector('strong').textContent,loaded:art.complete&&art.naturalWidth===444});if(i<7)nwNext.click();}return out;})()`);
    assert.equal(new Set(steps.map(s=>s.title)).size,8);assert.ok(steps.every(s=>s.loaded));
    await win.webContents.executeJavaScript('nwBack.click();');
    const output=path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
    const captures=[];
    for(const width of [900,600]){
      win.setSize(width,720);
      await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
      const geometry=await win.webContents.executeJavaScript(`(()=>{const d=newLabelWizard.getBoundingClientRect(),h=document.querySelector('.nw-heading').getBoundingClientRect(),c=document.querySelector('.nw-heading-copy').getBoundingClientRect(),b=document.querySelector('.nw-brand-icon');return {rect:{x:Math.floor(d.x),y:Math.floor(d.y),width:Math.ceil(d.width),height:Math.ceil(d.height)},headingHeight:h.height,copyRight:c.right,artStart:h.right-145,brandLoaded:b.complete&&b.naturalWidth>0};})()`);
      assert.ok(geometry.headingHeight>=74);assert.ok(geometry.copyRight<=geometry.artStart,'heading copy does not overlap the printer and media');assert.ok(geometry.brandLoaded);
      const title=await win.webContents.executeJavaScript(`(()=>{const header=newLabelWizard.querySelector('header'),icon=header.querySelector('.nw-brand-icon'),label=header.querySelector('.nw-window-title'),style=getComputedStyle(icon),canvas=document.createElement('canvas');canvas.width=461;canvas.height=312;const context=canvas.getContext('2d');context.drawImage(icon,0,0,461,312);return {left:icon.getBoundingClientRect().left-header.getBoundingClientRect().left,background:style.backgroundColor,logoCorner:[...context.getImageData(0,0,1,1).data],padding:style.padding,textAlign:getComputedStyle(label).textAlign};})()`);
      assert.ok(title.left<=4.1,`wizard icon and title start at the left edge: ${JSON.stringify(title)}`);
      assert.deepEqual(title.logoCorner,[255,255,255,255],'the actual ABSS SVG canvas has an opaque white background');
      assert.equal(title.padding,'0px','the logo has no background padding');
      assert.equal(title.textAlign,'left');
      const capture=await win.webContents.capturePage(geometry.rect);assert.ok(!capture.isEmpty());
      const target=path.join(output,`wizard-branding-${width}.png`);fs.writeFileSync(target,capture.toPNG());captures.push(target);
    }
    console.log(JSON.stringify({status:'PASS',steps:steps.length,captures,profile}));win.destroy();app.exit(0);
  }catch(error){console.error(error);win.destroy();app.exit(1);}
});
