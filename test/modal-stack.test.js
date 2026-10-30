'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
function fixture(){
 const dom=new JSDOM('<button id="outside">Canvas</button><dialog id="parent"><header><strong>Properties</strong><button aria-label="Close">×</button></header><button id="opener">Open</button></dialog><dialog id="child"><header><strong>Name</strong><button aria-label="Close">×</button></header><input id="field"><button id="last">Done</button></dialog><dialog id="third"><header><strong>Third</strong><button aria-label="Close">×</button></header><input></dialog>',{runScripts:'dangerously',pretendToBeVisual:true});
 const w=dom.window;
 w.HTMLDialogElement.prototype.show=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.eval(fs.readFileSync(require.resolve('../gui/modal-windows.js'),'utf8'));
 for(const button of w.document.querySelectorAll('dialog header button[aria-label="Close"]'))button.onclick=()=>button.closest('dialog').close();
 return {dom,w,parent:w.document.getElementById('parent'),child:w.document.getElementById('child'),third:w.document.getElementById('third')};
}
test('nested dialogs keep ancestors visible, trap focus and restore the opener',()=>{
 const {dom,w,parent,child}=fixture();
 parent.showModal();w.document.getElementById('opener').focus();child.showModal();
 assert.notEqual(w.getComputedStyle(parent).display,'none');
 assert.equal(parent.inert,true);
 assert.ok(Number(child.style.zIndex)>Number(parent.style.zIndex));
 w.document.getElementById('outside').focus();
 assert.ok(child.contains(w.document.activeElement));
 w.document.getElementById('last').focus();
 w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
 assert.equal(w.document.activeElement.getAttribute('aria-label'),'Minimize window');
 child.close();assert.equal(parent.inert,false);assert.equal(w.document.activeElement.id,'opener');
 dom.window.close();
});
test('Escape closes one level and respects cancel prevention',()=>{
 const {dom,w,parent,child,third}=fixture();parent.showModal();child.showModal();third.showModal();
 const escape=()=>w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
 escape();assert.equal(third.open,false);assert.equal(child.open,true);assert.equal(parent.open,true);
 child.addEventListener('cancel',e=>e.preventDefault());escape();assert.equal(child.open,true);
 dom.window.close();
});
test('removing a parent closes descendants and clears editor blocking',async()=>{
 const {dom,w,parent,child,third}=fixture();parent.showModal();child.showModal();third.showModal();
 parent.remove();await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(child.open,false);assert.equal(third.open,false);
 assert.equal(w.ModalWindowStack.blocksEditorInput({target:w.document.body}),false);
 dom.window.close();
});
test('custom role dialogs participate in the same parent stack',()=>{
 const {dom,w,child}=fixture();const panel=w.document.createElement('section');panel.setAttribute('role','dialog');panel.innerHTML='<button>Open child</button>';w.document.body.append(panel);
 w.ModalWindowStack.openCustom(panel,()=>panel.remove());panel.querySelector('button').focus();child.showModal();
 assert.equal(panel.inert,true);child.close();assert.equal(panel.inert,false);assert.equal(w.document.activeElement,panel.querySelector('button'));
 w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
 assert.equal(panel.isConnected,false);assert.equal(w.ModalWindowStack.top(),null);dom.window.close();
});
test('custom dialog overlay rises above an existing floating parent',()=>{
 const {dom,w,parent}=fixture();parent.showModal();
 const overlay=w.document.createElement('div');overlay.id='settingsModal';overlay.style.zIndex='100';overlay.innerHTML='<section role="dialog"><button>Settings</button></section>';w.document.body.append(overlay);
 w.ModalWindowStack.openCustom(overlay.firstElementChild,()=>overlay.remove());
 assert.ok(Number(overlay.style.zIndex)>Number(parent.style.zIndex));
 w.ModalWindowStack.closeCustom(overlay.firstElementChild);assert.equal(overlay.style.zIndex,'100');dom.window.close();
});
test('minimizing the active modal hides only it and restores it from the dock',()=>{
 const {dom,w,parent,child}=fixture();parent.showModal();child.showModal();
 const minimize=child.querySelector('[aria-label="Minimize window"]');assert.ok(minimize);assert.equal(minimize.disabled,false);
 minimize.click();assert.equal(child.open,true,'minimize does not close the modal');assert.equal(w.ModalWindowStack.top(),parent,'parent modal becomes active');assert.equal(w.getComputedStyle(child).display,'none','only the child modal is hidden');
 const restore=w.document.querySelector('.modal-window-dock button');assert.ok(restore,'hidden modal has a restore control');restore.click();assert.equal(w.ModalWindowStack.top(),child,'restoring returns the child to the top');assert.notEqual(w.getComputedStyle(child).display,'none');
 dom.window.close();
});
test('native-window close routing can close only the active modal',()=>{
 const {dom,w,parent,child}=fixture();parent.showModal();child.showModal();
 assert.equal(typeof w.ModalWindowStack.closeTop,'function');assert.equal(w.ModalWindowStack.closeTop(),true);assert.equal(child.open,false);assert.equal(parent.open,true);assert.equal(w.ModalWindowStack.top(),parent);
 dom.window.close();
});
