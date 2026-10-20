'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const Session=require('../gui/source-session'),UI=require('../gui/object-data-sources-ui');
test('source editor tabs expose distinct decorative SVG and preserve navigation',()=>{
 const dom=new JSDOM('<div id="root"></div>'),root=dom.window.document.getElementById('root'),session=Session.createSession({elements:[{type:'text',text:'123'}]});
 const editor=UI.mount(root,{session,objectId:session.draft.elements[0].id});
 try{const paths=[];for(const name of ['Data Source','Data Type','Transforms']){
 const tab=[...root.querySelectorAll('[role="tab"]')].find(b=>b.textContent===name);assert.ok(tab,name);
 const svg=tab.querySelector('svg');assert.ok(svg,name+' has SVG');assert.equal(svg.getAttribute('aria-hidden'),'true');assert.equal(svg.style.width,'16px');paths.push(svg.innerHTML);
 tab.click();const active=root.querySelector('[role="tab"][aria-selected="true"]');assert.equal(active.textContent,name);assert.ok(root.querySelector('.ose-fields').childElementCount>0);
 }assert.equal(new Set(paths).size,3);}finally{editor.dispose();dom.window.close();}
});
