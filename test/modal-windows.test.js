'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

const modalCases=[
  ['Page Setup','pageSetupDialog'],['History Preview','historyPreviewDialog'],['Project Workspace','workspaceProject'],['Data Workspace','workspaceData'],
  ['Advanced Barcode Picker','advancedBarcodePicker'],['Data Source Editor','dataSourceDialog'],['Barcode Picker','barcodePicker'],['New Label Wizard','newLabelWizard'],
  ['Object Properties','objectProperties'],['Database Setup','databaseSetupDialog'],['Print','printDialog'],['Print Auxiliary','printAux'],
  ['Print Preview','printPreviewDialog'],['Print Calibration','printCalibrationDialog'],['Shape Picker','shapePicker'],['Table Properties','tableDialog'],
  ['Table Size','tableSize'],['Open Label Library','fileLibrary'],['Role Dialog','genericRoleDialog'],
];

test('Settings keeps its title controls outside the scrolling settings content',()=>{
  const dom=new JSDOM(fs.readFileSync(require.resolve('../gui/index.html'),'utf8'));
  const w=dom.window,panel=w.document.querySelector('#settingsModal > div'),header=panel.firstElementChild,body=panel.querySelector('.settings-scroll-body');
  assert.ok(body,'Settings has a separate content scroll area');
  assert.equal(w.getComputedStyle(panel).display,'flex');
  assert.equal(w.getComputedStyle(panel).flexDirection,'column');
  assert.equal(w.getComputedStyle(panel).overflow,'hidden');
  assert.equal(w.getComputedStyle(header).flexShrink,'0');
  assert.equal(w.getComputedStyle(body).overflow,'auto');
  assert.ok(body.contains(w.document.getElementById('connType')));
  assert.equal(body.contains(w.document.getElementById('settingsClose')),false);
  dom.window.close();
});

test('floating window controls keep the wider spacing shown in the reference',async()=>{
  const dom=new JSDOM('<!doctype html><body><dialog id="fixture"><header><strong>Fixture</strong><button aria-label="Close">×</button></header><main></main></dialog></body>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));
  await new Promise(resolve=>setTimeout(resolve,0));
  const controls=w.document.querySelector('#fixture .modal-window-controls');
  assert.ok(controls,'floating window has minimize, maximize, and close controls');
  assert.equal(controls.children.length,3);
  assert.equal(w.getComputedStyle(controls).gap,'8px','the controls have the reference spacing');
  dom.window.close();
});

test('every resizable modal pins its footer below a flexible scrolling content area',async()=>{
  const dom=new JSDOM('<!doctype html><body><dialog id="direct"><header>Direct</header><main></main><footer><button>OK</button></footer></dialog><dialog id="nested"><form><header>Nested</header><div class="modal-content"><section></section><footer><button>OK</button></footer></div></form></dialog><section id="role" role="dialog"><header>Custom</header><main></main><footer><button>OK</button></footer></section><dialog id="withoutFooter"><header>Tool</header><main></main></dialog></body>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));
  await new Promise(resolve=>setTimeout(resolve,0));
  for(const id of ['direct','nested','role'])assert.ok(w.document.getElementById(id).classList.contains('modal-footer-pinned'),`${id} gets the pinned-footer layout`);
  assert.equal(w.document.getElementById('withoutFooter').classList.contains('modal-footer-pinned'),false,'dialogs without action footers keep their layout');
  const direct=w.document.getElementById('direct'),nested=w.document.getElementById('nested'),form=nested.querySelector('form'),content=form.querySelector('.modal-content');
  assert.equal(w.getComputedStyle(direct).display,'flex');assert.equal(w.getComputedStyle(direct).flexDirection,'column');
  assert.equal(w.getComputedStyle(direct.querySelector('main')).overflow,'auto');assert.equal(w.getComputedStyle(direct.querySelector('footer')).position,'sticky');
  assert.equal(w.getComputedStyle(form).display,'flex');assert.equal(w.getComputedStyle(content).display,'flex');assert.equal(w.getComputedStyle(form.querySelector('section')).overflow,'auto');assert.equal(w.getComputedStyle(form.querySelector('footer')).position,'sticky');
  dom.window.close();
});

test('every app modal resizes freely while retaining usable minimum dimensions',async()=>{
  const fixtures=modalCases.map(([name,id])=>{if(id==='printAux')return `<dialog id="${id}"><main>${name}</main></dialog>`;const classes={'workspaceProject':'workspace-dialog','workspaceData':'workspace-dialog','tableDialog':'table-dialog','tableSize':'table-dialog table-size','shapePicker':'shape-picker','barcodePicker':'barcode-picker','historyPreviewDialog':'hist-preview-dialog'};return `<dialog id="${id}"${classes[id]?` class="${classes[id]}"`:''}><header><strong>${name}</strong><button aria-label="Close">×</button></header><main></main></dialog>`;}).join('');
  const tis='<div class="tis-picker-backdrop"><section class="tis-picker" role="dialog"><header><h2>TIS Symbols</h2><button class="tis-close" aria-label="Close">×</button></header><main></main></section></div>';
  const settings='<div id="settingsModal"><div><header class="modal-header"><strong>Settings</strong><button aria-label="Close">×</button></header><main></main></div></div>';
  const help='<div id="helpModal"><div><header class="modal-header"><strong>Help</strong><button aria-label="Close">×</button></header><main></main></div></div>';
  const dom=new JSDOM(`<!doctype html><html><head></head><body>${fixtures}${tis}${settings}${help}</body></html>`,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));
  await new Promise(resolve=>setTimeout(resolve,0));
  const panels=[...w.document.querySelectorAll('dialog,[role="dialog"]')];assert.ok(panels.length>=modalCases.length+3);
  for(const [index,panel]of panels.entries()){
    const width=760+(index%3)*80,height=580+(index%2)*45,left=20,top=20,rect={left,top,right:left+width,bottom:top+height,width,height};
    panel.getBoundingClientRect=()=>rect;panel.setPointerCapture=()=>{};panel.hasPointerCapture=()=>false;panel.releasePointerCapture=()=>{};
    const x=rect.right-2,y=rect.bottom-2;panel.dispatchEvent(new w.MouseEvent('pointerdown',{button:0,clientX:x,clientY:y,bubbles:true,cancelable:true}));
    panel.dispatchEvent(new w.MouseEvent('pointermove',{button:0,buttons:1,clientX:x-10000,clientY:y-10000,bubbles:true}));panel.dispatchEvent(new w.MouseEvent('pointerup',{button:0,clientX:x-10000,clientY:y-10000,bubbles:true}));
    const actualWidth=Number.parseFloat(panel.style.width),actualHeight=Number.parseFloat(panel.style.height);
    assert.ok(panel.classList.contains('modal-window-resized'),`${panel.id||panel.className} gets the app resizer`);
    assert.ok(actualWidth>=499&&actualHeight>=379,`${panel.id||panel.className} cannot collapse below the minimum: ${actualWidth}x${actualHeight}`);
    assert.equal(actualWidth,Number.parseFloat(panel.style.minWidth),'corner drag reaches the independent width minimum');assert.equal(actualHeight,Number.parseFloat(panel.style.minHeight),'corner drag reaches the independent height minimum');if(panel.id==='objectProperties')assert.ok(actualWidth>=700&&actualHeight>=560,'Properties retains usable navigation and content');
    assert.ok(Number.parseFloat(panel.style.minWidth)>0&&Number.parseFloat(panel.style.minHeight)>0,`${panel.id||panel.className} has real CSS minimum dimensions`);
  }
  dom.window.close();
});

test('resizing each edge changes only its own axes and stays inside the viewport',()=>{
  const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));
  const rect={left:100,top:80,right:900,bottom:680,width:800,height:600};
  for(const edge of ['n','s','e','w','ne','nw','se','sw']){const next=w.ModalWindowSizing.resizeRect(rect,edge,-10000,10000,1024,768);if(edge==='e'||edge==='w')assert.equal(next.height,600,'horizontal edge preserves height');if(edge==='n'||edge==='s')assert.equal(next.width,800,'vertical edge preserves width');assert.ok(next.left>=0&&next.top>=0&&next.left+next.width<=1024.001&&next.top+next.height<=768.001,`${edge} stays visible`);assert.ok(next.width>=499&&next.height>=379,`${edge} keeps minimum dimensions`);}
  dom.window.close();
});
test('minimum resize bounds adapt to a viewport smaller than the content minimum',()=>{
  const dom=new JSDOM('<body></body>',{runScripts:'dangerously'}),w=dom.window;w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));const rect={left:100,top:80,right:920,bottom:800,width:820,height:720};const result=w.ModalWindowSizing.resizeRect(rect,'se',-5000,-5000,640,450,700,560);assert.equal(result.width,640);assert.equal(result.height,450);assert.equal(result.left,0);assert.equal(result.top,0);dom.window.close();
});
test('resize continues when the pointer leaves the panel and stops on document pointerup',()=>{
  const dom=new JSDOM('<dialog id="objectProperties"><header>Properties</header></dialog>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window,panel=w.document.querySelector('dialog');w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));panel.getBoundingClientRect=()=>({left:20,top:20,right:840,bottom:740,width:820,height:720});panel.setPointerCapture=()=>{};panel.hasPointerCapture=()=>false;
  panel.dispatchEvent(new w.MouseEvent('pointerdown',{button:0,clientX:838,clientY:300,bubbles:true,cancelable:true}));w.document.dispatchEvent(new w.MouseEvent('pointermove',{buttons:1,clientX:938,clientY:300,bubbles:true}));w.document.dispatchEvent(new w.MouseEvent('pointerup',{button:0,clientX:938,clientY:300,bubbles:true}));assert.equal(Number.parseFloat(panel.style.width),920);assert.equal(Number.parseFloat(panel.style.height),720);assert.equal(panel.style.willChange,'');dom.window.close();
});
test('expanding a small dialog does not raise its minimum on the next resize',()=>{
  const dom=new JSDOM('<dialog><header>Small tool</header></dialog>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window,panel=w.document.querySelector('dialog');w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));let width=300;panel.getBoundingClientRect=()=>({left:20,top:20,right:20+width,bottom:240,width,height:220});panel.setPointerCapture=()=>{};panel.hasPointerCapture=()=>false;const drag=dx=>{const x=20+width-2;panel.dispatchEvent(new w.MouseEvent('pointerdown',{button:0,clientX:x,clientY:100,bubbles:true,cancelable:true}));w.document.dispatchEvent(new w.MouseEvent('pointermove',{buttons:1,clientX:x+dx,clientY:100,bubbles:true}));w.document.dispatchEvent(new w.MouseEvent('pointerup',{button:0,bubbles:true}));width=Number.parseFloat(panel.style.width);};drag(100);assert.equal(width,400);drag(-200);assert.equal(width,300);assert.equal(Number.parseFloat(panel.style.minWidth),300);dom.window.close();
});

test('opening a floating dialog suspends the prior dialog and closing it restores the prior dialog',()=>{
  const dom=new JSDOM('<!doctype html><body><div class="edbar" style="position:fixed;z-index:50"></div><dialog id="first"></dialog><dialog id="second"></dialog></body>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.HTMLDialogElement.prototype.show=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));
  const first=w.document.getElementById('first'),second=w.document.getElementById('second');
  first.showModal();second.showModal();
  assert.ok(first.open&&second.open,'suspending a dialog preserves its state for restoration');
  assert.ok(first.classList.contains('modal-window-suspended'),'the earlier dialog is hidden while the new one is active');
  assert.equal(w.getComputedStyle(first).display,'none','the suspended dialog cannot render over the active dialog');
  assert.ok(!second.classList.contains('modal-window-suspended'));
  assert.ok(first.classList.contains('workspace-floating-window'));
  assert.ok(Number(first.style.zIndex)>50,'floating dialogs stay above the fixed navbar');
  second.close();
  assert.ok(!second.open);
  assert.ok(first.open,'closing the active dialog restores the previously open dialog');
  assert.ok(!first.classList.contains('modal-window-suspended'));
  assert.equal(w.getComputedStyle(first).display,'block');
  dom.window.close();
});

test('reopening a suspended dialog raises it and closing it restores the previous active dialog',()=>{
  const dom=new JSDOM('<!doctype html><body><dialog id="first"></dialog><dialog id="second"></dialog></body>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.HTMLDialogElement.prototype.show=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));
  const first=w.document.getElementById('first'),second=w.document.getElementById('second');
  first.showModal();second.showModal();first.showModal();
  assert.ok(!first.classList.contains('modal-window-suspended'));
  assert.ok(second.classList.contains('modal-window-suspended'));
  first.close();
  assert.ok(second.open);
  assert.ok(!second.classList.contains('modal-window-suspended'));
  dom.window.close();
});

test('closing a suspended dialog leaves the active dialog visible',()=>{
  const dom=new JSDOM('<!doctype html><body><dialog id="first"></dialog><dialog id="second"></dialog></body>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.HTMLDialogElement.prototype.show=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));
  const first=w.document.getElementById('first'),second=w.document.getElementById('second');
  first.showModal();second.showModal();first.close();
  assert.ok(second.open);
  assert.ok(!second.classList.contains('modal-window-suspended'));
  dom.window.close();
});
