'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const Session=require('../gui/source-session'),UI=require('../gui/object-data-sources-ui');
function harness(){const dom=new JSDOM('<form><div id="editor"></div></form>',{url:'http://localhost'}),session=Session.createSession({elements:[{type:'text',text:'A'},{type:'text',text:'B'}]});dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};let changes=0;const root=dom.window.document.querySelector('#editor');const editor=UI.mount(root,{session,objectId:session.draft.elements[0].id,onChange:()=>{changes++;}});return{dom,session,root,editor,get changes(){return changes;}};}
const click=(h,label)=>{const button=[...h.root.querySelectorAll('button')].find(b=>b.title===label||b.textContent===label);assert.ok(button,label);button.click();};
const wizardButton=(wizard,label)=>{const button=[...wizard.querySelectorAll('button')].find(b=>b.textContent===label);assert.ok(button,label);button.click();};
function addSource(h){click(h,'New Data Source');const wizard=h.dom.window.document.querySelector('.source-new-wizard');assert.ok(wizard);wizardButton(wizard,'Next');wizardButton(wizard,'Finish');}
test('new source wizard commits only on Finish and Cancel discards its staged data',()=>{
  const h=harness(),before=structuredClone(h.session.draft);click(h,'New Data Source');let wizard=h.dom.window.document.querySelector('.source-new-wizard');assert.ok(wizard?.open);assert.deepEqual(h.session.draft,before);
  const kind=wizard.querySelector('[name="new.kind"]');assert.equal(UI.sourceKinds.length,12);assert.equal(kind.options.length,11);assert.equal([...kind.options].some(option=>option.value==='named'),false);kind.value='database';kind.dispatchEvent(new h.dom.window.Event('change'));wizardButton(wizard,'Next');
  const field=wizard.querySelector('[name="new.field"]');field.value='SKU';field.dispatchEvent(new h.dom.window.Event('input'));wizardButton(wizard,'Cancel');assert.deepEqual(h.session.draft,before);
  click(h,'New Data Source');wizard=h.dom.window.document.querySelector('.source-new-wizard');wizardButton(wizard,'Next');const value=wizard.querySelector('[name="new.value"]');value.value='TAIL';value.dispatchEvent(new h.dom.window.Event('input'));assert.deepEqual(h.session.draft,before);wizardButton(wizard,'Finish');
  assert.equal(h.session.draft.elements[0].dataSourceRefs.length,2);assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'ATAIL');assert.equal(h.dom.window.document.querySelector('.source-new-wizard'),null);h.dom.window.close();
});
test('new source wizard keeps duplicate-name errors open without changing the source list',()=>{
  const h=harness();h.session.update(d=>{d.sourceDefinitions[d.elements[0].dataSourceRefs[0]].name='Shared';});const before=structuredClone(h.session.draft);click(h,'New Data Source');const wizard=h.dom.window.document.querySelector('.source-new-wizard');assert.ok(wizard);wizardButton(wizard,'Next');const name=wizard.querySelector('[name="new.name"]');name.value='Shared';name.dispatchEvent(new h.dom.window.Event('input'));wizardButton(wizard,'Finish');assert.ok(wizard.open);assert.match(wizard.textContent,/Duplicate source name/);assert.deepEqual(h.session.draft,before);wizardButton(wizard,'Cancel');h.dom.window.close();
});
test('new named-source wizard can link the currently selected named definition',()=>{
  const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];h.session.update(doc=>{doc.sourceDefinitions[id].name='Shared';});h.editor.refresh();click(h,'New Data Source');const wizard=h.dom.window.document.querySelector('.source-new-wizard'),kind=wizard.querySelector('[name="new.kind"]');kind.value='named';kind.dispatchEvent(new h.dom.window.Event('change'));wizardButton(wizard,'Next');assert.equal(wizard.querySelector('[name="new.name"]'),null);const target=wizard.querySelector('[name="new.definitionId"]');assert.ok([...target.options].some(option=>option.value===id));assert.equal(target.value,id);wizardButton(wizard,'Finish');assert.equal(h.session.draft.elements[0].dataSourceRefs[1],id);assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'AA');const shared=h.root.querySelector('[name="source.value"]');assert.ok(shared);shared.value='UPDATED';shared.dispatchEvent(new h.dom.window.Event('input'));assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'UPDATEDUPDATED');h.dom.window.close();
});
test('disposing source editor removes its unfinished wizard without changing data',()=>{
  const h=harness(),before=structuredClone(h.session.draft);click(h,'New Data Source');const wizard=h.dom.window.document.querySelector('.source-new-wizard');assert.ok(wizard?.open);h.editor.dispose();assert.equal(h.dom.window.document.querySelector('.source-new-wizard'),null);assert.deepEqual(h.session.draft,before);h.dom.window.close();
});

function withGs1(){const h=harness();h.editor.dispose();let finish;h.editor=UI.mount(h.root,{session:h.session,objectId:h.session.draft.elements[0].id,compileGs1:()=>new Promise(resolve=>{finish=resolve;})});return{h,complete:()=>finish({ok:true,encodedText:'0109506000134352'})};}
test('cancelling GS1 while preparation is pending discards the late result',async()=>{
  const{h,complete}=withGs1(),before=structuredClone(h.session.draft);click(h,'GS1 Data Source Wizard');const wizard=h.dom.window.document.querySelector('.source-gs1-wizard');wizardButton(wizard,'Finish');wizardButton(wizard,'Cancel');complete();await new Promise(r=>setImmediate(r));assert.deepEqual(h.session.draft,before);h.dom.window.close();
});
test('GS1 cannot overwrite a newer source revision when preparation returns late',async()=>{
  const{h,complete}=withGs1();click(h,'GS1 Data Source Wizard');const wizard=h.dom.window.document.querySelector('.source-gs1-wizard');wizardButton(wizard,'Finish');h.session.update(doc=>{doc.sourceDefinitions[doc.elements[0].dataSourceRefs[0]].config.value='NEWER';});const before=structuredClone(h.session.draft);complete();await new Promise(r=>setImmediate(r));assert.deepEqual(h.session.draft,before);assert.ok(wizard.open);assert.match(wizard.textContent,/changed|review|again/i);h.dom.window.close();
});
test('disposing source editor closes its GS1 and named paste dialogs',()=>{
  const{h}=withGs1();click(h,'GS1 Data Source Wizard');h.editor.dispose();assert.equal(h.dom.window.document.querySelector('.source-gs1-wizard'),null);h.dom.window.close();
  const other=harness();other.session.update(doc=>{doc.sourceDefinitions[doc.elements[0].dataSourceRefs[0]].name='Named';});other.editor.refresh();click(other,'Copy');click(other,'Paste');assert.ok(other.dom.window.document.querySelector('.ose-modal'));other.editor.dispose();assert.equal(other.dom.window.document.querySelector('.ose-modal'),null);other.dom.window.close();
});

test('pending GS1 preparation locks its inputs and keeps Cancel available',async()=>{
  const{h,complete}=withGs1(),before=structuredClone(h.session.draft);click(h,'GS1 Data Source Wizard');const wizard=h.dom.window.document.querySelector('.source-gs1-wizard');wizardButton(wizard,'Finish');
  for(const input of wizard.querySelectorAll('input,select,textarea'))assert.equal(input.disabled,true,input.name);const add=[...wizard.querySelectorAll('button')].find(b=>b.textContent==='Add Application Identifier');assert.equal(add.disabled,true);const cancel=[...wizard.querySelectorAll('button')].find(b=>b.textContent==='Cancel');assert.equal(cancel.disabled,false);cancel.click();complete();await new Promise(r=>setImmediate(r));assert.deepEqual(h.session.draft,before);h.dom.window.close();
});

test('search action editor exposes executable syntax and operation choices with matching occurrence defaults',()=>{
  const h=harness();click(h,'Transforms');h.root.querySelector('[aria-label="Enable Search and Replace"]').click();h.root.querySelector('[data-transform-kind="search-replace"] button').click();click(h,'Add Action');
  let syntax=h.root.querySelector('[name="replace.0.syntax"]');assert.ok(syntax);assert.equal(syntax.options.length,3);syntax.value='wildcard';syntax.dispatchEvent(new h.dom.window.Event('change'));
  const set=(key,value)=>{const input=h.root.querySelector('[name="replace.0.'+key+'"]');assert.ok(input,key);input.value=value;input.dispatchEvent(new h.dom.window.Event(input.tagName==='SELECT'?'change':'input'));};
  set('search','^A$');set('replace','B');assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'B');assert.equal(h.root.querySelector('[name="replace.0.all"]').checked,true);
  set('operation','insert-after');assert.equal(h.root.querySelector('[name="replace.0.replace"]'),null);set('insert','!');assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'A!');
  set('operation','delete');assert.equal(h.root.querySelector('[name="replace.0.insert"]'),null);assert.equal(Object.values(h.session.evaluate({}).objects)[0].text,'');h.dom.window.close();
});

test('new named link rejects a target that stopped being named while the wizard was open',()=>{
  const h=harness(),id=h.session.draft.elements[0].dataSourceRefs[0];h.session.update(doc=>{doc.sourceDefinitions[id].name='Shared';});h.editor.refresh();click(h,'New Data Source');const wizard=h.dom.window.document.querySelector('.source-new-wizard'),kind=wizard.querySelector('[name="new.kind"]');kind.value='named';kind.dispatchEvent(new h.dom.window.Event('change'));wizardButton(wizard,'Next');h.session.update(doc=>{doc.sourceDefinitions[id].name='';});const before=structuredClone(h.session.draft);wizardButton(wizard,'Finish');assert.ok(wizard.open);assert.match(wizard.textContent,/existing named source/i);assert.deepEqual(h.session.draft,before);h.dom.window.close();
});
