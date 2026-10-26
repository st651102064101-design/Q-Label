'use strict';
// Electron runtime: the File menu keeps Export template, image and PDF together under one expandable Export entry.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-export-group-')));
const timer=setTimeout(()=>app.exit(1),60000);
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.setBackgroundThrottling(false);win.webContents.once('did-finish-load',async()=>{
  try{
    const run=code=>win.webContents.executeJavaScript(code);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
    await run("hideProjectHome();editing={name:'export-group',width_mm:100,height_mm:50,dpi:203,elements:[]};refreshEditorUI();drawEditorCanvas();0");
    await run("[...document.querySelectorAll('.ribbon-tabs [role=tab],.ribbon-tabs button')].find(t=>t.textContent.trim()==='File').click()");await wait(200);
    const state=()=>run(`JSON.stringify((()=>{const menu=document.querySelector('.ribbon-file-menu'),group=menu.querySelector('.fm-group'),parent=group.querySelector('.fm-parent'),subs=[...group.querySelectorAll('.fm-submenu button')];return {menuOpen:!menu.hidden,top:[...menu.children].map(c=>c.classList.contains('fm-group')?'Export*':(c.textContent||'').trim().replace(/Ctrl\\+\\S+$/,'').trim()).filter(Boolean),expanded:parent.getAttribute('aria-expanded'),parentVisible:parent.getBoundingClientRect().height>0,subLabels:subs.map(b=>b.querySelector('.fm-label').textContent),subVisible:subs.map(b=>b.getBoundingClientRect().height>0),geometry:(()=>{const m=menu.getBoundingClientRect(),sub=group.querySelector('.fm-submenu').getBoundingClientRect(),p=parent.getBoundingClientRect();return {menuRight:m.right,subLeft:sub.left,subTop:sub.top,parentTop:p.top};})(),loose:[...menu.querySelectorAll(':scope > [role=menuitem]')].map(b=>b.querySelector('.fm-label')?.textContent).filter(t=>/^Export/.test(t))};})())`).then(JSON.parse);

    let s=await state();
    assert.equal(s.menuOpen,true,'File menu opens');
    assert.deepEqual(s.loose,[],'no loose Export items remain at the top level');
    assert.ok(s.top.includes('Export*'),'one Export group entry: '+s.top.join('|'));
    assert.equal(s.expanded,'false');assert.equal(s.parentVisible,true);
    assert.deepEqual(s.subLabels,['Export template…','Export image…','Export PDF…']);
    assert.deepEqual(s.subVisible,[false,false,false],'collapsed by default');

    await run("document.querySelector('.fm-group').dispatchEvent(new PointerEvent('pointerenter'))");await wait(50);
    s=await state();assert.equal(s.expanded,'true','hovering Export opens it');assert.deepEqual(s.subVisible,[true,true,true],'all three are shown');
    assert.ok(s.geometry.subLeft>=s.geometry.menuRight-1,'the list opens to the right of the File menu: sub '+s.geometry.subLeft+' vs menu '+s.geometry.menuRight);
    assert.ok(Math.abs(s.geometry.subTop-s.geometry.parentTop)<=12,'the list is level with the Export entry');
    const hit=await run("(()=>{const sub=document.querySelector('.fm-submenu').getBoundingClientRect();const el=document.elementFromPoint(sub.left+30,sub.top+20);return !!el?.closest('.fm-submenu');})()");
    assert.equal(hit,true,'the flyout is on top and not clipped by the scrolling File menu');
    await run("document.querySelector('.fm-group').dispatchEvent(new PointerEvent('pointerleave'))");await wait(450);
    assert.equal((await state()).expanded,'false','leaving Export closes it after a short delay');
    await run("document.querySelector('.fm-parent').click()");await wait(50);
    assert.equal((await state()).expanded,'true','clicking Export opens it too');

    await run("document.querySelector('.fm-parent').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}))");await wait(30);
    assert.equal((await state()).expanded,'false','ArrowLeft collapses');
    await run("document.querySelector('.fm-parent').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}))");await wait(30);
    s=await state();assert.equal(s.expanded,'true','ArrowRight expands');
    assert.equal(await run("document.activeElement.querySelector?.('.fm-label')?.textContent"),'Export template…','focus moves into the group');

    await run("[...document.querySelectorAll('.fm-submenu button')].find(b=>b.textContent.includes('Export PDF')).click()");await wait(300);
    const after=JSON.parse(await run("JSON.stringify({dialog:document.getElementById('imageExportDialog').open,title:document.querySelector('#imageExportDialog header strong').textContent,destination:document.querySelector('#imageExportDialog [name=destination]:checked').value,expanded:document.querySelector('.fm-parent').getAttribute('aria-expanded')})"));
    assert.deepEqual(after,{dialog:true,title:'Export PDF',destination:'pdf',expanded:'false'},'PDF export opens and the group collapses');
    console.log('PASS file menu export group');
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
