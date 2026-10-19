'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
test('focused controls have no extra outline or shadow and retain selection state',()=>{
  const dom=new JSDOM('<style>input,button,select,textarea{border:1px solid #cbd5e1}input:focus,button:focus,select:focus,textarea:focus{outline:2px solid green;box-shadow:0 0 0 3px green}</style><input type="radio" checked><input type="checkbox" checked><input type="text"><button>OK</button><select><option>One</option></select><textarea></textarea>'),d=dom.window.document;
  const file=path.join(__dirname,'../gui/focus-appearance.css');if(fs.existsSync(file)){const style=d.createElement('style');style.textContent=fs.readFileSync(file,'utf8');d.head.append(style);}
  for(const control of d.querySelectorAll('input,button,select,textarea')){control.focus();const css=dom.window.getComputedStyle(control);assert.equal(css.outlineStyle,'none',control.outerHTML);assert.equal(css.boxShadow,'none');assert.equal(d.activeElement,control,'keyboard focus remains functional');}
  assert.equal(d.querySelector('[type=radio]').checked,true);assert.equal(d.querySelector('[type=checkbox]').checked,true);dom.window.close();
});
