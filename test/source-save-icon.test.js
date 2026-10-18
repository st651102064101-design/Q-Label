'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
test('Data Source Save has a contrasting primary background and readable icon',async()=>{
 const dom=new JSDOM('<style>:root{--accent:#159957;--card:#fff;--text:#1f2933}</style>',{runScripts:'outside-only'}),w=dom.window;
 try{
  w.editing=null;w.settings={};w.eval(fs.readFileSync(require.resolve('../gui/data-sources'),'utf8'));
  w.eval(fs.readFileSync(require.resolve('../gui/action-button-ui'),'utf8'));
  await new Promise(r=>setTimeout(r,0));
  // JSDOM does not resolve CSS custom properties; supply the same theme values.
  for(const sheet of w.document.querySelectorAll('style'))sheet.textContent=sheet.textContent.replace(/var\(--accent(?:,[^)]*)?\)/g,'#159957').replace(/var\(--card(?:,[^)]*)?\)/g,'#fff').replace(/var\(--text(?:,[^)]*)?\)/g,'#1f2933');
  const b=w.document.querySelector('#dataSourceDialog button[type=submit]'),s=b.querySelector('svg'),style=w.getComputedStyle(b);
  assert.ok(s,'Save has a real SVG');assert.equal(style.color,'rgb(255, 255, 255)');assert.equal(style.backgroundColor,'rgb(21, 153, 87)');
  assert.equal(w.getComputedStyle(s).stroke,'rgb(255, 255, 255)');assert.equal(w.getComputedStyle(s).width,'16px');assert.match(s.querySelector('path').getAttribute('d'),/^M5 3/);
 }finally{w.close();}
});
