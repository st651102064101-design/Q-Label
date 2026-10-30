'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.disableHardwareAcceleration();
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-type-picker-')));
const timer=setTimeout(()=>{console.error('Data Type runtime timed out');app.exit(1);},60000);
app.on('browser-window-created',(_,win)=>win.webContents.once('did-finish-load',async()=>{
  const run=code=>win.webContents.executeJavaScript(code);
  const click=async selector=>{
    const point=await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);
    win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...point});
    win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...point});
    await new Promise(resolve=>setTimeout(resolve,80));
  };
  try{
    await run(`(async()=>{while(appInitializing)await new Promise(r=>setTimeout(r,30));hideProjectHome();autoSaveEnabled=false;editing={name:'Type picker fixture',width_mm:60,height_mm:40,dpi:203,elements:[{type:'text',label:'Text 1',text:'123',x_mm:3,y_mm:3,width_mm:40,height_mm:6,font_pt:12}]};editorSel=0;editorSelection=new Set([0]);refreshEditorUI();openObjectProperties(0);const d=document.getElementById('objectProperties');d.querySelector('[data-property-page="Data Sources"]').click();[...d.querySelectorAll('[role=tab]')].find(b=>b.textContent==='Data Type').click();const theme=document.getElementById('ose-modern-theme');if(theme&&!theme.sheet)await new Promise(r=>theme.onload=r);})()`);
    const trigger='[role="combobox"][aria-label="Data Type"]';
    for(let cycle=0;cycle<3;cycle++){
      await click(trigger);
      const state=await run(`(()=>{const t=document.querySelector('${trigger}'),m=document.querySelector('[aria-label="Data Types"]');if(!m)return{open:false};const a=t.getBoundingClientRect(),b=m.getBoundingClientRect(),items=[...m.querySelectorAll('[role=option]')];return{open:true,anchor:{left:a.left,bottom:a.bottom},menu:{left:b.left,top:b.top,right:b.right,bottom:b.bottom,height:b.height},width:innerWidth,height:innerHeight,items:items.map(e=>{const r=e.getBoundingClientRect();return{value:e.dataset.value,svg:!!e.querySelector('svg path'),h:r.height,hit:e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))}})}})()`);
      assert.equal(state.open,true,'a real mouse click opens the menu, cycle '+cycle);
      assert.ok(Math.abs(state.menu.left-state.anchor.left)<2&&Math.abs(state.menu.top-state.anchor.bottom-3)<2,`popup aligns beneath its trigger: ${JSON.stringify(state)}`);
      assert.deepEqual(state.items.map(e=>e.value),['text','date','time','number','currency','percentage','fraction','binary','picture']);
      assert.ok(state.items.every(e=>e.svg&&e.h>0&&e.hit),`all nine SVG options receive pointer input: ${JSON.stringify(state)}`);
      assert.ok(state.menu.right<=state.width&&state.menu.bottom<=state.height,'menu stays within viewport');
      assert.equal(await run(`(()=>{const m=document.querySelector('[aria-label="Data Types"]');return m.scrollHeight<=m.clientHeight})()`),true,'all nine choices fit without an unnecessary scrollbar');
      assert.equal(await run(`!!document.querySelector('${trigger} [data-picker-chevron] path')`),true,'chevron is SVG');
      if(cycle===0){
        await click('[aria-label="Data Types"] [data-value="number"]');
        assert.equal(await run(`editing.sourceDefinitions[editing.elements[0].dataSourceRefs[0]].dataType.kind`),'number','pointer selection updates the live object');
      }else if(cycle===1){
        win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
        await new Promise(resolve=>setTimeout(resolve,80));
        const focus=await run(`({restored:document.activeElement===document.querySelector('${trigger}'),active:document.activeElement.outerHTML.slice(0,350),dialogOpen:document.getElementById('objectProperties').open,menu:!!document.querySelector('[aria-label="Data Types"]')})`);
        assert.equal(focus.restored,true,'Escape restores trigger focus: '+JSON.stringify(focus));
      }else await click('#objectProperties header');
      assert.equal(await run(`document.querySelector('[aria-label="Data Types"]')===null`),true,'selection, Escape and outside click dismiss the menu');
    }
    await click(trigger);
    await run(`window.__typeKeys=[];document.addEventListener('keydown',e=>__typeKeys.push({key:e.key,code:e.code,target:e.target.dataset.value}),true)`);
    for(const keyCode of ['Down','Enter']){win.webContents.sendInputEvent({type:'keyDown',keyCode});win.webContents.sendInputEvent({type:'keyUp',keyCode});await new Promise(resolve=>setTimeout(resolve,60));}
    assert.equal(await run(`editing.sourceDefinitions[editing.elements[0].dataSourceRefs[0]].dataType.kind`),'currency','arrow and Enter select the next real data type: '+JSON.stringify(await run('__typeKeys')));
    await click(trigger);
    win.showInactive();await run('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    fs.mkdirSync(path.join(__dirname,'../test-results'),{recursive:true});
    const capture=(await win.webContents.capturePage()).toPNG();assert.ok(capture.length>1000,'runtime screenshot contains rendered pixels');
    fs.writeFileSync(path.join(__dirname,'../test-results/data-type-picker-runtime.png'),capture);
    console.log('PASS Data Type real-pointer popup, 9 SVG options, selection, Escape, outside dismissal and reopen');clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error.stack);clearTimeout(timer);app.exit(1);}
}));
require('../gui/main');
