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
      // 1. Opens immediately: checked in the same tick as the hover, no waiting.
      const sameTick=await run(`(()=>{const b=document.querySelector(${JSON.stringify(c.button)});b.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));const m=document.querySelector(${JSON.stringify(c.menu)});return !!m&&!m.hidden&&m.getBoundingClientRect().height>0;})()`);
      assert.equal(sameTick,true,c.name+' opens immediately on hover');
      // 2. Moving onto the open menu keeps it open past the close delay.
      await run(`document.querySelector(${JSON.stringify(c.menu)}+' button').dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}))`);await wait(450);
      assert.equal(await visible(c.menu),true,c.name+' stays open while the mouse is on its menu');
      // 3. A click on the button must not shut the hover-opened menu.
      await run(`document.querySelector(${JSON.stringify(c.button)}).dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1}))`);await wait(60);
      assert.equal(await visible(c.menu),true,c.name+' is not toggled shut by a click');
      // 4. Leaving closes it after the grace period, not before.
      await run("document.body.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}))");await wait(80);
      assert.equal(await visible(c.menu),true,c.name+' survives a brief overshoot');
      await wait(400);
      assert.equal(await visible(c.menu),false,c.name+' closes once the mouse has left');
    }
    // 5. Moving from one button to another swaps the open menu.
    await hover('#insertTextTool');await hover('#insertBarcodeTool');
    assert.equal(await visible('.barcode-menu'),true,'Barcode menu is open');
    assert.equal(await run("document.getElementById('insertTextTool').getAttribute('aria-expanded')"),'false','Text menu closed when Barcode opened');
    await run("document.body.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}))");await wait(450);
    // 6. Touch input does not hover-open.
    await run("document.getElementById('insertTextTool').dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'touch'}))");
    assert.equal(await run("document.getElementById('insertTextTool').getAttribute('aria-expanded')"),'false','touch does not open on hover');
    // 7. Symbols and Shapes open modal dialogs and are not hover-driven.
    await run("document.querySelector('[aria-label=\"Insert Symbols\"]').dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}))");await wait(100);
    assert.equal(await run("!document.querySelector('.tis-picker')"),true,'hovering Symbols does not open its modal');
    console.log('PASS ribbon hover menus');
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error('case:',lastCase);console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
