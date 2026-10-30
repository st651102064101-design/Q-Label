'use strict';
// Electron runtime: Text, Picture, Barcode and Table dropdowns open the instant the mouse reaches the button.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-hover-menus-')));
const timer=setTimeout(()=>app.exit(1),90000);
let lastCase='';
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);win.webContents.on('console-message',(_e,level,message)=>{if(level>=3)console.log('RENDERER:',message.slice(0,200));});win.webContents.once('did-finish-load',async()=>{
  try{
    const run=code=>win.webContents.executeJavaScript(code);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
    await run("hideProjectHome();editing={name:'hover',width_mm:100,height_mm:50,dpi:203,elements:[]};refreshEditorUI();drawEditorCanvas();[...document.querySelectorAll('.ribbon-tabs [role=tab],.ribbon-tabs button')].find(t=>t.textContent.trim()==='Insert')?.click();0");await wait(300);
    const tabs=await run(`(()=>{const all=[...document.querySelectorAll('.ribbon-tabs [role=tab]')],home=all.find(t=>t.textContent.trim()==='Home'),insert=all.find(t=>t.textContent.trim()==='Insert');insert.click();home.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));const homeHover=home.getAttribute('aria-selected');home.click();insert.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));const insertHover=insert.getAttribute('aria-selected');insert.click();return {homeHover,insertHover,insertClicked:insert.getAttribute('aria-selected')};})()`);assert.deepEqual(tabs,{homeHover:'false',insertHover:'false',insertClicked:'true'});
    const tabState=await run(`(()=>{const tabs=[...document.querySelectorAll('.ribbon-tabs [role=tab]')],insert=tabs.find(t=>t.textContent.trim()==='Insert'),layout=tabs.find(t=>t.textContent.trim()==='Layout');insert.click();layout.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));const before=layout.getAttribute('aria-selected');layout.click();const css=getComputedStyle(layout),result={before,selected:layout.getAttribute('aria-selected'),old:insert.getAttribute('aria-selected'),shadow:css.boxShadow,color:css.color};insert.click();return result;})()`);assert.equal(tabState.before,'false');assert.equal(tabState.selected,'true');assert.equal(tabState.old,'false');assert.match(tabState.shadow,/inset/);assert.notEqual(tabState.color,'');
    const hover=(selector)=>run(`document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}))`);
    const over=(selector)=>run(`document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}))`);
    const visible=selector=>run(`(()=>{const m=document.querySelector(${JSON.stringify(selector)});return !!m&&!m.hidden&&getComputedStyle(m).display!=='none'&&m.getBoundingClientRect().height>0;})()`);
    const cases=[
      {name:'Text',button:'#insertTextTool',menu:'.line-menu.tool-menu'},
      {name:'Picture',button:'#insertPictureTool',menu:'.line-menu.tool-menu'},
      {name:'Barcode',button:'#insertBarcodeTool',menu:'.barcode-menu'},
      {name:'Table',button:'#ribbon-insert .table-insert-command',menu:'.table-menu'}
    ];
    for(const c of cases){
      lastCase=c.name;
      await hover(c.button);assert.equal(await visible(c.menu),false,c.name+' stays closed on hover');
      await run(`document.querySelector(${JSON.stringify(c.button)}).click()`);await wait(80);
      assert.equal(await visible(c.menu),true,c.name+' opens on click');
      await run("document.body.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}))");await wait(350);
      assert.equal(await visible(c.menu),true,c.name+' stays open on pointer exit');
      await run(`document.querySelector(${JSON.stringify(c.button)}).click()`);await wait(80);
      assert.equal(await visible(c.menu),false,c.name+' closes on second click');
    }
    for(const c of cases){
      await run(`document.querySelector(${JSON.stringify(c.button)}).click()`);await wait(80);assert.equal(await visible(c.menu),true,c.name+' opens before hover switch');
      const switched=await run(`(()=>{const target=document.querySelector('#ribbon-insert [data-insert-tool="box"]');target.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));const m=document.querySelector(${JSON.stringify(c.menu)});return {closed:!m||m.hidden,rectangleActive:target.getAttribute('aria-pressed')};})()`);
      assert.equal(switched.closed,true,c.name+' closes in the hover event over Rectangle');
    }
    // Symbols requires a click and does not close merely because the pointer moves away.
    await hover('[aria-label="Insert Symbols"]');await wait(100);assert.equal(await visible('.symbols-menu'),false,'hover does not open Symbols');
    await run("document.querySelector('[aria-label=\"Insert Symbols\"]').click()");await wait(250);assert.equal(await visible('.symbols-menu'),true,'click opens Symbols');
    await run("document.body.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}))");await wait(400);assert.equal(await visible('.symbols-menu'),true,'moving away does not close a click-opened menu');
    await run("document.querySelector('[aria-label=\"Insert Symbols\"]').click()");assert.equal(await visible('.symbols-menu'),false,'second click closes Symbols');
    console.log('PASS ribbon hover menus');
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error('case:',lastCase);console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
