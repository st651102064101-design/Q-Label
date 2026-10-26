'use strict';
// Electron runtime: renaming a template page with real keyboard input commits on Enter, cancels on Escape and commits on blur.
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('appData',fs.mkdtempSync(path.join(os.tmpdir(),'qlabel-page-rename-')));
const timer=setTimeout(()=>app.exit(1),90000);
app.on('browser-window-created',(_e,win)=>{win.on('show',()=>win.hide());win.webContents.once('did-finish-load',async()=>{
  try{
    const run=code=>win.webContents.executeJavaScript(code);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const key=async(keyCode,modifiers=[])=>{win.webContents.sendInputEvent({type:'keyDown',keyCode,modifiers});if(keyCode.length===1)win.webContents.sendInputEvent({type:'char',keyCode,modifiers});win.webContents.sendInputEvent({type:'keyUp',keyCode,modifiers});await wait(25);};
    const type=async text=>{for(const ch of text)await key(ch);};
    for(let i=0;i<100;i++){if(await run('!appInitializing'))break;await wait(100);}
    await run('window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16);window.cancelAnimationFrame=id=>clearTimeout(id);0');// hidden windows get no animation frames
    await run("hideProjectHome();editing={name:'rename-check',width_mm:100,height_mm:50,dpi:203,elements:[],template_pages:[{name:'Template 1',design:{elements:[]}},{name:'Template 2',design:{elements:[]}}]};refreshEditorUI();drawEditorCanvas();0");
    await wait(300);
    const names=()=>run("JSON.stringify(editing.template_pages.map(p=>p.name))").then(JSON.parse);
    const openRename=async(index)=>{
      await run(`(()=>{const tab=document.querySelectorAll('.template-page-tabs [role=tab]')[${index}];tab.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:60,clientY:60}));})()`);await wait(100);
      await run("[...document.querySelectorAll('.template-page-menu [role=menuitem]')].find(i=>/^Rename/.test(i.textContent.trim())).click()");await wait(200);
    };
    const waitFocus=async()=>{for(let i=0;i<40;i++){if(await run("document.activeElement?.classList.contains('template-page-rename-input')")){await wait(150);return true;}await wait(50);}return false;};// settle: the pending animation-frame select() must run before typing
    const inputState=()=>run("JSON.stringify({exists:!!document.querySelector('.template-page-rename-input'),focused:document.activeElement?.classList.contains('template-page-rename-input'),value:document.querySelector('.template-page-rename-input')?.value})").then(JSON.parse);

    // 1. Type a new name with real key events and press Enter.
    await openRename(1);
    await waitFocus();let state=await inputState();
    assert.deepEqual({exists:state.exists,focused:state.focused},{exists:true,focused:true},'rename input is focused: '+JSON.stringify(state));
    await key('A',['control']);await type('Pack');win.webContents.sendInputEvent({type:'char',keyCode:' '});await wait(25);await type('B');
    assert.equal((await inputState()).value,'Pack B','typing reaches the input');
    await key('Return');await wait(200);
    assert.deepEqual(await names(),['Template 1','Pack B'],'Enter commits the new name');
    assert.equal((await inputState()).exists,false,'input closes after Enter');

    // 2. Escape cancels.
    await openRename(0);await waitFocus();await key('A',['control']);await type('Nope');await key('Escape');await wait(150);
    assert.deepEqual(await names(),['Template 1','Pack B'],'Escape keeps the old name');

    // 3. Clicking elsewhere commits.
    await openRename(0);await waitFocus();await key('A',['control']);await type('First');
    await run("document.querySelector('.template-page-rename-input').dispatchEvent(new FocusEvent('blur'));0");await wait(200);
    assert.deepEqual(await names(),['First','Pack B'],'blur commits the new name');

    // 4. Home/End/Arrow keys move the caret instead of switching tabs.
    await openRename(1);await waitFocus();await key('Home');await type('X');
    state=await inputState();assert.equal(state.value,'XPack B','Home moves the caret inside the input');
    await key('Escape');await wait(100);
    console.log('PASS template page rename',JSON.stringify(await names()));
    clearTimeout(timer);app.exit(0);
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});});
require('../gui/main.js');
