'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),Session=require('../gui/source-session'),UI=require('../gui/object-data-sources-ui');
test('modern source theme preserves command layout with rounded fields and visible selected sources',()=>{
  const dom=new JSDOM('<dialog id="objectProperties" open><nav><button>Data Sources</button></nav><main></main></dialog>'),d=dom.window.document,session=Session.createSession({elements:[{type:'text',text:'A'}]});
  const editor=UI.mount(d.querySelector('main'),{session,objectId:session.draft.elements[0].id,treeHost:d.querySelector('nav')});
  const file=path.join(__dirname,'../gui/object-data-sources-modern.css');if(fs.existsSync(file)){const style=d.createElement('style');style.textContent=fs.readFileSync(file,'utf8');d.head.append(style);}
  const css=node=>dom.window.getComputedStyle(node),input=d.querySelector('[name="source.name"]');
  assert.ok(parseFloat(css(input).borderRadius)>=6,'fields use rounded modern boundaries');
  assert.notEqual(css(d.querySelector('[role="option"][aria-selected="true"]')).backgroundColor,'rgb(0, 120, 215)','source selection uses the Q LABEL palette');
  assert.ok(d.querySelector('nav .ose-list'));assert.equal(d.querySelector('main .ose-list'),null);
  for(const name of ['Name','Description','Type']){const control=d.querySelector('[name="source.'+({Name:'name',Description:'description',Type:'kind'})[name]+'"]');assert.ok(control.parentElement.querySelector('button'),'action stays next to '+name);}
  const row=d.querySelector('[name="source.value"]').closest('label');assert.equal(css(row).alignItems,'start','multiline field caption aligns with the top of its editor');
  assert.equal(css(d.querySelector('nav > button')).borderLeftStyle,'dotted');assert.equal(css(d.querySelector('nav .ose-list > button')).position,'relative');assert.equal(d.querySelector('.ose-toolbar').children.length,8);editor.dispose();dom.window.close();
});

test('source toolbar icons have rounded strokes and readable barcode and scissors artwork',()=>{
 const dom=new JSDOM('<main></main>'),d=dom.window.document,session=Session.createSession({elements:[{type:'text',text:'A'}]});
 const editor=UI.mount(d.querySelector('main'),{session,objectId:session.draft.elements[0].id});
 for(const svg of d.querySelectorAll('.ose-toolbar svg')){assert.equal(svg.getAttribute('stroke-linecap'),'round');assert.equal(svg.getAttribute('stroke-linejoin'),'round');assert.equal(svg.getAttribute('fill'),'none');}
 const gs1=d.querySelector('[data-action="GS1 Data Source Wizard"] svg path'),cut=d.querySelector('[data-action="Cut"] svg path');
 assert.ok(gs1.getAttribute('d').includes('M4 4v8'),'GS1 uses barcode bars');assert.ok(cut.getAttribute('d').includes('a2 2'),'scissors have circular handles');assert.ok(cut.getAttribute('d').includes('M13 2'),'scissors have separate blades');
 assert.equal(d.querySelectorAll('.ose-toolbar button').length,8);editor.dispose();dom.window.close();
});
