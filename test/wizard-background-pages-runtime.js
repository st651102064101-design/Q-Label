'use strict';
// Electron runtime: ticking Color / Picture / Design Guide Image adds one wizard page each, in order.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-wizard-bg-'));
app.setPath('userData',profile);app.disableHardwareAcceleration();
const timer=setTimeout(()=>app.exit(1),90000);
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:900,height:780,show:false,webPreferences:{contextIsolation:true,backgroundThrottling:false,offscreen:true}});win.webContents.on('console-message',(_e,level,message)=>{if(level>=2&&!/Security|Policy/.test(message))console.log('RENDERER:',message.slice(0,300));});
  try{
    const gui=path.resolve(__dirname,'../gui'),fixture=path.join(profile,'fixture.html');
    fs.writeFileSync(fixture,`<!doctype html><html><head><base href="${pathToFileURL(gui+path.sep).href}"></head><body><select id="printerSelect"><option>Zebra ZT411 (600 dpi)</option></select></body></html>`);
    await win.loadFile(fixture);
    const run=code=>win.webContents.executeJavaScript(code);
    await run("window.settings={};window.el=id=>document.getElementById(id);window.mmToUnit=(v,u)=>u==='in'?v/25.4:v;window.zebra={getPrinterResolution:async()=>({dpi:600})};void 0;");
    for(const name of ['color-picker','stock-catalog','stock-apply','stock-preview','new-label-stock-mode','new-label-wizard','modal-preview','modal-windows'])await run(fs.readFileSync(path.join(gui,name+'.js'),'utf8')+';void 0;');
    await run('openNewLabelWizard();');
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const heading=()=>run("document.querySelector('.nw-heading strong').textContent");
    const next=async()=>{await run('nwNext.click()');await wait(30);};
    const back=async()=>{await run('nwBack.click()');await wait(30);};
    const greys=[];
    for(let i=0;i<14&&await heading()!=='Template Background';i++){
      greys.push(await run("getComputedStyle(document.querySelector('#newLabelWizard .nw-body')).backgroundColor"));
      if(await heading()==='Stock Selection')await run('nwStockCustom.click()');
      await run("(async()=>{for(let k=0;k<100&&nwNext.disabled;k++)await new Promise(r=>setTimeout(r,10));nwNext.click();})()");await wait(40);
    }
    assert.equal(await heading(),'Template Background');
    greys.push(await run("getComputedStyle(document.querySelector('#newLabelWizard .nw-body')).backgroundColor"));
    assert.ok(greys.length>=6,'visited the early pages: '+greys.length);
    assert.deepEqual([...new Set(greys)],['rgb(241, 241, 241)'],'every wizard page has the grey body');

    // Nothing ticked: straight to Finished and back.
    await next();assert.equal(await heading(),'Finished!');await back();assert.equal(await heading(),'Template Background');

    // All three ticked: three pages in order, Back retraces them.
    for(const id of ['nwBackgroundColorEnabled','nwBackgroundPictureEnabled','nwBackgroundGuideEnabled']){await run(`document.getElementById('${id}').click()`);}
    const forward=[];for(let i=0;i<4;i++){await next();forward.push(await heading());}
    assert.deepEqual(forward,['Template Background Color','Template Background Picture','Design Guide Image','Finished!']);
    const backward=[];for(let i=0;i<4;i++){await back();backward.push(await heading());}
    assert.deepEqual(backward,['Design Guide Image','Template Background Picture','Template Background Color','Template Background']);

    // Colour page: popup picks a color, None clears it.
    await next();
    const colorPage=JSON.parse(await run(`JSON.stringify({visible:!nwBgColorPage.hidden,mainHidden:document.querySelector('#nwTemplateBackground>fieldset').hidden,name:nwBgColorName.textContent,options:[...document.querySelectorAll('#nwBgColorPage fieldset input,#nwBgColorPage fieldset select')].every(i=>i.disabled)})`));
    assert.deepEqual(colorPage,{visible:true,mainHidden:true,name:'None',options:true});
    await run('nwBgColorButton.click()');await wait(50);
    await run("[...document.querySelectorAll('.color-picker-panel .cp-hex')].find(p=>p.dataset.color==='#ff0000').dispatchEvent(new MouseEvent('click',{bubbles:true}))");await wait(50);
    assert.equal(await run('nwBgColorName.textContent'),'#ff0000');
    await run('nwBgColorButton.click()');await wait(50);await run("document.querySelector('.color-picker-panel .cp-none').click()");await wait(50);
    assert.equal(await run('nwBgColorName.textContent'),'None');

    // Picture page: Embedded reveals the file row; Linked is not offered as selectable.
    await next();
    const picture=JSON.parse(await run(`JSON.stringify({linkedDisabled:nwBgPictureSource.querySelector('[value=linked]').disabled,rowHidden:nwBgPictureFileRow.hidden,sizeDisabled:nwBgSizeMethod.disabled,buttons:[...document.querySelectorAll('#nwBgPicturePage .nw-bg-buttons button')].every(b=>b.disabled)})`));
    assert.deepEqual(picture,{linkedDisabled:true,rowHidden:true,sizeDisabled:true,buttons:true});
    await run("nwBgPictureSource.value='embedded';nwBgPictureSource.dispatchEvent(new Event('change',{bubbles:true}))");await wait(30);
    assert.equal(await run('nwBgPictureFileRow.hidden'),false);

    // Design guide page: file chosen -> hide/remove enable; remove clears.
    await next();
    const before=JSON.parse(await run(`JSON.stringify({scannerDisabled:[...document.querySelectorAll('#nwBgGuidePage button')].find(b=>b.textContent.startsWith('Scanner')).disabled,hide:nwBgGuideHide.disabled,remove:nwBgGuideRemove.disabled})`));
    assert.deepEqual(before,{scannerDisabled:true,hide:true,remove:true});
    await run("(()=>{const dt=new DataTransfer();dt.items.add(new File(['x'],'guide.png',{type:'image/png'}));nwBackgroundGuide.files=dt.files;nwBackgroundGuide.dispatchEvent(new Event('change',{bubbles:true}));})()");await wait(30);
    assert.equal(await run('nwBgGuideName.textContent'),'guide.png');
    assert.equal(await run('nwBgGuideHide.disabled||nwBgGuideRemove.disabled'),false);
    await run('nwBgGuideRemove.click()');await wait(30);
    assert.equal(await run('nwBgGuideName.textContent'),'');assert.equal(await run('nwBgGuideRemove.disabled'),true);

    // Only Picture + Guide ticked: Color page is skipped.
    await back();await back();await back();assert.equal(await heading(),'Template Background');
    await run("document.getElementById('nwBackgroundColorEnabled').click()");
    await next();assert.equal(await heading(),'Template Background Picture');
    await next();assert.equal(await heading(),'Design Guide Image');
    console.log('PASS wizard background pages');
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});
