'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
async function harness(){const dom=new JSDOM('<body></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;Object.assign(w,{structuredClone,editing:{width_mm:60,height_mm:40,dpi:203,elements:[{type:'text',label:'First',text:'A',width_mm:2,height_mm:3},{type:'text',label:'Second',text:'B',width_mm:2,height_mm:3}]},settings:{},qrCache:{},mmToUnit:Number,unitToMm:Number,unitSuffix:()=> 'mm',measureUnit:()=> 'mm',cancelTextClick:()=>{},readEditorIntoDraft:()=>{},ensureQR:async()=>{},qrValuesOf:()=>[],dmValuesOf:()=>[],pushSnapshot:()=>{},refreshEditorUI:()=>{},touchEditor:()=>{},updateUndoButtons:()=>{},persistEditor:async()=>{},ObjectData:require('../gui/object-data'),DataSourceEngine:require('../gui/data-source-engine'),ObjectPropertiesDocument:require('../gui/object-properties-document'),SourceModel:require('../gui/source-model'),ObjectNames:require('../gui/object-names')});w.sampleData=t=>w.DataSourceEngine.resolve(t);w.LabelPreview={computeBoxes:()=>[{w:20,h:10}],renderPreviewSVG:()=>'<svg></svg>'};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};w.eval(fs.readFileSync(require.resolve('../gui/object-properties'),'utf8'));w.openObjectProperties(0);return{w,dom,d:w.document.getElementById('objectProperties')};}
const settle=()=>new Promise(r=>setTimeout(r,20));
test('each object marks only its final property branch, including objects without data sources',async()=>{
 const {w,dom,d}=await harness();try{
  for(const root of d.querySelectorAll('[data-object-root]')){
   const rows=[...d.querySelectorAll('[data-property-page]')].filter(row=>row.dataset.objectIndex===root.dataset.objectRoot);
   assert.deepEqual(rows.filter(row=>row.dataset.treeLast==='true'),[rows.at(-1)]);
  }
  d.querySelector('header button[aria-label="Close"]').click();await settle();
  Object.assign(w.editing.elements[0],{type:'image',placeholder:true,barcode_spec:undefined});w.openObjectProperties(0);
  const rows=[...d.querySelectorAll('[data-property-page][data-object-index="0"]')];
  assert.deepEqual(rows.filter(row=>row.dataset.treeLast==='true'),[rows.at(-1)]);
 }finally{dom.window.close();}
});
test('Fit barcode width changes catalog barcode geometry and the rendered preview',async()=>{
 const {w,dom,d}=await harness();try{
 d.querySelector('header button[aria-label="Close"]').click();await settle();
 const object=w.editing.elements[0];Object.assign(object,{type:'image',label:'Barcode 1',width_mm:20,height_mm:8,auto_fit_width:true,barcode_spec:{bcid:'code128',text:'12345678',show_text:true}});
 w.zebra={barcodeEncode:async()=>({ok:true,bitmap_width:200,bitmap_height:80,bitmap_hex:'00'})};
 const renderedWidths=[];w.LabelPreview.computeBoxes=template=>template.elements.map(element=>({w:Number(element.width_mm)||20,h:Number(element.height_mm)||8}));
 w.LabelPreview.renderPreviewSVG=template=>{renderedWidths.push(template.elements[0].width_mm);return '<svg></svg>';};
 w.openObjectProperties(0);await settle();d.querySelector('[data-property-page="Auto Fit"]').click();
 const maximum=d.querySelector('input[type="number"]');maximum.value='42';
 [...d.querySelectorAll('button')].find(button=>button.textContent==='Fit barcode width').click();await settle();
 assert.equal(w.editing.elements[0].width_mm,42,'catalog barcode image adopts the maximum width');
 assert.equal(w.editing.elements[0].height_mm,16.8,'auto-fit keeps the encoded image aspect ratio');
 assert.equal(renderedWidths.at(-1),42,'preview renders the fitted width');
 }finally{dom.window.close();}
});
test('Fit barcode width adjusts linear, QR, and Data Matrix geometry',async()=>{
 for(const [type,initial,expected] of [['barcode128',{module_width:1},2],['qrcode',{width_mm:20},42],['datamatrix',{magnification:2},10]]){
  const {w,dom,d}=await harness();try{
   d.querySelector('header button[aria-label="Close"]').click();await settle();Object.assign(w.editing.elements[0],{type,label:type,text:'12345678',...initial});
   w.LabelPreview.computeBoxes=template=>template.elements.map(element=>({w:['barcode128','code39','code93','ean13'].includes(element.type)?(Number(element.module_width)||2)*20:element.type==='datamatrix'?(Number(element.magnification)||5)*4:Number(element.width_mm)||((Number(element.magnification)||4)*5),h:10}));
   w.openObjectProperties(0);await settle();d.querySelector('[data-property-page="Auto Fit"]').click();const maximum=d.querySelector('input[type="number"]');maximum.value='42';
   [...d.querySelectorAll('button')].find(button=>button.textContent==='Fit barcode width').click();await settle();
   if(type==='qrcode')assert.equal(w.editing.elements[0].width_mm,42);else if(type==='datamatrix')assert.equal(w.editing.elements[0].magnification,expected);else {assert.equal(w.editing.elements[0].module_width,expected);assert.ok(w.editing.elements[0].module_width*20<=42,'linear barcode stays within the maximum width');}
  }finally{dom.window.close();}
 }
});
test('Properties changes the actual object immediately without Apply and keeps the active input',async()=>{
 const {w,dom,d}=await harness();try{
 assert.equal(d.querySelector('footer'),null,'Properties has no bottom action bar');
 assert.ok(d.querySelector('header button[aria-label="Close"]'),'the header close button remains available');
 assert.equal(d.querySelector('[data-action="apply"]'),null);
 w.ObjectPropertiesPages=require('../gui/object-properties-pages');d.querySelector('[data-object-root="0"]').click();
 const checkbox=d.querySelector('[name="preprinted"]');checkbox.click();await settle();assert.equal(w.editing.elements[0].preprinted,true);
 const comments=d.querySelector('[name="comments"]');comments.value='Live';comments.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();assert.equal(w.editing.elements[0].comments,'Live');assert.equal(d.querySelector('[name="comments"]'),comments,'live updates do not rebuild the focused form');
 d.querySelector('header button[aria-label="Close"]').click();await settle();assert.equal(d.open,false,'the header close button closes Properties');assert.equal(w.editing.elements[0].comments,'Live','closing keeps the last valid edit');
 }finally{dom.window.close();}
});
test('Properties tree switches objects while saving edits immediately; Close retains later changes',async()=>{
 const {w,dom,d}=await harness();try{const original=structuredClone(w.editing),roots=()=>[...d.querySelectorAll('[data-object-root]')];assert.equal(roots().length,2);assert.deepEqual(roots().map(b=>b.textContent),['First','Second']);
 const set=(key,value)=>{const input=d.querySelector('[name="'+key+'"]');assert.ok(input,key);input.value=value;input.dispatchEvent(new w.Event('input'));};
 set('comments','comment A');roots()[1].click();set('label','Second renamed');set('comments','comment B');roots()[0].click();assert.equal(d.querySelector('[name="comments"]').value,'comment A');await settle();
 await settle();assert.equal(w.editing.elements[0].comments,'comment A');assert.equal(w.editing.elements[1].comments,'comment B');assert.equal(w.editing.elements[1].label,'Second renamed');assert.equal(roots()[1].textContent,'Second renamed');
 set('comments','retained');d.querySelector('header button[aria-label="Close"]').click();await settle();assert.equal(w.editing.elements[0].comments,'retained');
 }finally{dom.window.close();}
});
test('shared named source updates both objects immediately across object switches',async()=>{
 const {w,dom,d}=await harness();try{d.querySelector('header button[aria-label="Close"]').click();await settle();w.editing=require('../gui/source-model').migrate(w.editing);const [a,b]=w.editing.elements,ref=a.dataSourceRefs[0];w.editing.sourceDefinitions[ref].name='Shared';b.dataSourceRefs=[ref];w.editing=require('../gui/source-model').syncCaches(w.editing);const original=structuredClone(w.editing);w.SourceSession=require('../gui/source-session');w.ObjectDataSourcesUI=require('../gui/object-data-sources-ui');w.openObjectProperties(0);
 const page=i=>d.querySelector('[data-object-index="'+i+'"][data-property-page="Data Sources"]').click();page(0);let input=d.querySelector('[name="source.value"]');input.value='SHARED';input.dispatchEvent(new w.Event('input'));page(1);assert.equal(d.querySelector('[name="source.value"]').value,'SHARED');page(0);assert.equal(d.querySelector('[name="source.value"]').value,'SHARED');await settle();assert.equal(w.editing.elements[0].text,'SHARED');assert.equal(w.editing.elements[1].text,'SHARED');d.querySelector('header button[aria-label="Close"]').click();await settle();assert.equal(w.editing.elements[1].text,'SHARED');
 }finally{dom.window.close();}
});
test('Object page stages Print when through a side dialog and saves Preprinted immediately',async()=>{
 const {w,dom,d}=await harness();try{w.eval(fs.readFileSync(require.resolve('../gui/action-button-ui.js'),'utf8'));w.ObjectPropertiesPages=require('../gui/object-properties-pages');d.querySelector('[data-object-root="0"]').click();const pre=d.querySelector('[name="preprinted"]');assert.ok(pre);pre.click();await settle();assert.equal(w.editing.elements[0].preprinted,true);const summary=d.querySelector('[name="print_when_summary"]');assert.equal(summary.disabled,true);
 d.querySelector('[aria-label="Change Print When…"]').click();let dialog=w.document.querySelector('.op-print-condition-dialog'),select=dialog.querySelector('[name="condition.mode"]');select.value='never';select.dispatchEvent(new w.Event('change'));[...dialog.querySelectorAll('button')].find(b=>b.textContent==='Cancel').click();assert.equal(d.querySelector('[name="print_when_summary"]').value,'Always');
 d.querySelector('[aria-label="Change Print When…"]').click();dialog=w.document.querySelector('.op-print-condition-dialog');select=dialog.querySelector('[name="condition.mode"]');select.value='never';select.dispatchEvent(new w.Event('change'));await settle();const ok=[...dialog.querySelectorAll('button')].find(button=>button.textContent==='OK'),icon=ok.querySelector('svg');assert.equal(ok.type,'button','OK uses the dialog’s explicit form-submit handler');assert.ok(icon,'OK has an SVG icon');assert.notEqual(w.getComputedStyle(icon).stroke,'rgb(255, 255, 255)','the icon stroke stays visible on the white dialog button');ok.click();assert.equal(d.querySelector('[name="print_when_summary"]').value,'Never');await settle();assert.equal(w.editing.elements[0].preprinted,true);assert.deepEqual(JSON.parse(JSON.stringify(w.editing.elements[0].print_when)),{mode:'never'});
 }finally{dom.window.close();}
});
test('Position side dialog stages origins, anchor preserves location, and layer/lock persist',async()=>{
 const {w,dom,d}=await harness();try{w.ObjectPropertiesPages=require('../gui/object-properties-pages');const position=()=>d.querySelector('[data-object-index="0"][data-property-page="Position"]').click();position();assert.ok(d.querySelector('[name="position.anchor"]'));const anchor=d.querySelector('[name="position.anchor"]');anchor.value='center';anchor.dispatchEvent(new w.Event('change'));await settle();assert.equal(w.editing.elements[0].position.anchor,'center');
 const open=()=>d.querySelector('[aria-label="Advanced Position Settings…"]').click();open();let wizard=w.document.querySelector('.op-position-dialog');let x=wizard.querySelector('[name="position.originX"]');x.value='right';x.dispatchEvent(new w.Event('change'));[...wizard.querySelectorAll('button')].find(b=>b.textContent==='Cancel').click();assert.equal(d.querySelector('[name="position.originXSummary"]').value,'From left of template');
 open();wizard=w.document.querySelector('.op-position-dialog');x=wizard.querySelector('[name="position.originX"]');x.value='right';x.dispatchEvent(new w.Event('change'));[...wizard.querySelectorAll('button')].find(b=>b.textContent==='OK').click();assert.equal(d.querySelector('[name="position.originXSummary"]').value,'From right of template');d.querySelector('[name="locked"]').click();const layer=d.querySelector('[name="layer"]');layer.value='1';layer.dispatchEvent(new w.Event('change'));await settle();const first=w.editing.elements.find(o=>o.label==='First');assert.equal(first.position.originX,'right');assert.equal(first.position.anchor,'center');assert.equal(first.locked,true);assert.equal(w.editing.elements[1].label,'First');assert.equal(first.x_mm??0,0);
 }finally{dom.window.close();}
});
test('every object keeps its data source visible when another page is selected',async()=>{
 const {w,dom,d}=await harness();try{d.querySelector('[data-object-index="0"][data-property-page="Font"]').click();const labels=[...d.querySelectorAll('.op-source-summary')].map(node=>node.textContent);assert.deepEqual(labels,['A','B']);
 const item=d.querySelector('.op-source-summary-item');assert.ok(item.querySelector('svg'),'summary uses a document icon instead of a plus');assert.equal(item.querySelector('span').textContent,'A');assert.equal(item.textContent.includes('+'),false);
 w.SourceSession=require('../gui/source-session');w.ObjectDataSourcesUI=require('../gui/object-data-sources-ui');d.querySelector('header button[aria-label="Close"]').click();await settle();w.editing=require('../gui/source-model').migrate(w.editing);w.openObjectProperties(0);d.querySelector('[data-object-index="0"][data-property-page="Data Sources"]').click();assert.equal(d.querySelector('.op-source-summary[data-object-index="0"]'),null);assert.equal(d.querySelector('.ose-list').textContent,'A');assert.equal(d.querySelector('.op-source-summary[data-object-index="1"]').textContent,'B');assert.ok(d.querySelector('.op-source-summary[data-object-index="1"] svg'));
 }finally{dom.window.close();}
});
test('data source toolbar is docked below the object tree instead of covering the next object',async()=>{
 const {w,dom,d}=await harness();try{w.SourceSession=require('../gui/source-session');w.ObjectDataSourcesUI=require('../gui/object-data-sources-ui');d.querySelector('[data-object-index="0"][data-property-page="Data Sources"]').click();
 const nav=d.querySelector('nav'),toolbar=nav.querySelector('.ose-toolbar'),scroll=nav.querySelector('.op-tree-scroll');
 assert.ok(toolbar);assert.ok(scroll);assert.equal(toolbar.parentElement,nav);assert.equal(nav.lastElementChild,toolbar);assert.equal(scroll.contains(toolbar),false);assert.ok(scroll.querySelector('[data-object-root="1"]'));assert.equal(w.getComputedStyle(nav).display,'flex');assert.equal(w.getComputedStyle(toolbar).position,'static');
 const branch=w.document.createElement('style');branch.textContent=require('node:fs').readFileSync(require.resolve('../gui/object-properties-modern.css'),'utf8');w.document.head.append(branch);const pageButton=scroll.querySelector('[data-property-page="Font"]');assert.equal(w.getComputedStyle(pageButton).borderLeftStyle,'dotted');assert.equal(w.getComputedStyle(scroll.querySelector('[data-object-root="0"]')).borderLeftStyle,'none');
 d.querySelector('[data-object-root="1"]').click();assert.equal(nav.querySelector('.ose-toolbar'),null);
 }finally{dom.window.close();}
});
test('choosing text 2 moves the selected object in the tree and on the canvas',async()=>{
 const {w,dom,d}=await harness();try{let selected=0;w.editorSel=0;w.selectElement=i=>{selected=i;w.editorSel=i;};d.querySelector('[data-object-root="1"]').click();
 assert.equal(selected,1);assert.equal(d.querySelector('[data-object-root="1"]').getAttribute('aria-selected'),'true');assert.equal(d.querySelector('[data-object-root="0"]').getAttribute('aria-selected'),'false');
 w.editorSel=0;w.document.dispatchEvent(new w.Event('editor-selection-changed'));assert.equal(d.querySelector('[data-object-root="0"]').getAttribute('aria-selected'),'true');assert.equal(d.querySelector('[name="label"]').value,'First');
 }finally{dom.window.close();}
});
test('Live updates keep unique names and shows a modern alert instead of saving a duplicate',async()=>{
 const {w,dom,d}=await harness();try{w.ObjectPropertiesPages=require('../gui/object-properties-pages');d.querySelector('[data-object-root="0"]').click();const input=d.querySelector('[name="label"]');input.value='Second';input.dispatchEvent(new w.Event('input'));input.dispatchEvent(new w.Event('change',{bubbles:true}));await settle();
 const alert=w.document.querySelector('.modern-name-alert');
 assert.ok(alert,'duplicate name opens a modern alert');
 assert.equal(alert.querySelector('#modern-name-alert-message').textContent,"The name 'Second' is already in use or reserved.");
 assert.equal(w.editing.elements[0].label,'First');
 assert.equal(w.editing.elements[1].label,'Second');
 alert.querySelector('[data-alert-ok]').click();
 input.value='Logo';input.dispatchEvent(new w.Event('input'));await settle();
 assert.equal(w.editing.elements[0].label,'Logo');
 assert.equal(w.document.querySelector('.modern-name-alert'),null);
 }finally{dom.window.close();}
});
test('Border page enables grouped tools and stages individual corner edits until OK',async()=>{
 const {w,dom,d}=await harness();try{w.ObjectPropertiesPages=require('../gui/object-properties-pages');d.querySelector('[data-object-index="0"][data-property-page="Border"]').click();const none=d.querySelector('[name="border.kind"][value="none"]');assert.ok(none?.checked);assert.equal(d.querySelector('[data-border-group="margins"]').disabled,true);d.querySelector('[name="border.kind"][value="rectangle"]').click();assert.equal(d.querySelector('[data-border-group="margins"]').disabled,false);const top=d.querySelector('[name="border.margins.top"]');top.value='2';top.dispatchEvent(new w.Event('input'));d.querySelector('[aria-label="Corner Options…"]').click();let dialog=w.document.querySelector('.op-corner-dialog');let kind=dialog.querySelector('[name="corner.kind"]');kind.value='beveled';kind.dispatchEvent(new w.Event('change'));[...dialog.querySelectorAll('button')].find(b=>b.textContent==='Cancel').click();assert.equal(d.querySelector('[name="border.corner"]').value,'rectangular');
 d.querySelector('[aria-label="Corner Options…"]').click();dialog=w.document.querySelector('.op-corner-dialog');kind=dialog.querySelector('[name="corner.kind"]');kind.value='concave';kind.dispatchEvent(new w.Event('change'));[...dialog.querySelectorAll('button')].find(b=>b.textContent==='OK').click();assert.equal(d.querySelector('[name="border.corner"]').value,'concave');await settle();assert.equal(w.editing.elements[0].border.margins.top,2);assert.equal(w.editing.elements[0].border.corner,'concave');assert.equal(w.editing.elements[0].x_mm,undefined);
 }finally{dom.window.close();}
});

test("source tree indentation stays stable before, during and after source selection",function(){
  return harness().then(({w,dom,d})=>{try{
    const style=w.document.createElement('style');style.textContent=fs.readFileSync(require.resolve('../gui/object-data-sources-modern.css'),'utf8')+fs.readFileSync(require.resolve('../gui/object-properties-modern.css'),'utf8');w.document.head.append(style);
    const check=active=>{const scroll=d.querySelector('nav > .op-tree-scroll');assert.ok(scroll,'every page has the same scroll container');const host=scroll.querySelector(active?'.ose-list':'.op-source-summary'),row=host.querySelector('button');assert.equal(w.getComputedStyle(host).marginLeft,'29px');assert.equal(w.getComputedStyle(host).paddingLeft,'10px');assert.equal(w.getComputedStyle(row).marginLeft,'0px');};
    check(false);w.SourceSession=require('../gui/source-session');w.ObjectDataSourcesUI=require('../gui/object-data-sources-ui');d.querySelector('[data-object-index="0"][data-property-page="Data Sources"]').click();check(true);d.querySelector('[data-object-index="0"][data-property-page="Font"]').click();check(false);
  }finally{dom.window.close();}});
});

test('live Properties ignores stale barcode encoding after a newer edit',async()=>{
 const {w,dom,d}=await harness();try{
 d.querySelector('header button[aria-label="Close"]').click();await settle();const object=w.editing.elements[0];object.type='image';object.barcode_spec={bcid:'code128',text:'12345678',show_text:true};const pending=[];w.zebra={barcodeEncode:spec=>new Promise(resolve=>pending.push({spec,resolve}))};w.openObjectProperties(0);
 d.querySelector('[data-object-root="0"]').click();const input=d.querySelector('[name="comments"]');
 input.value='First';input.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();const first=pending.length-1;assert.ok(first>=0);
 input.value='Latest';input.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();const latest=pending.length-1;assert.ok(latest>first);
 pending[latest].resolve({ok:true,bitmap_width:80,bitmap_height:20,bitmap_hex:'BB'});await settle();assert.equal(w.editing.elements[0].comments,'Latest');assert.equal(w.editing.elements[0].bitmap_hex,'BB');
 for(const item of pending.slice(0,latest))item.resolve({ok:true,bitmap_width:80,bitmap_height:20,bitmap_hex:'AA'});await settle();assert.equal(w.editing.elements[0].comments,'Latest');assert.equal(w.editing.elements[0].bitmap_hex,'BB');
 }finally{dom.window.close();}
});

test('catalog barcode data edits update source definitions and the actual encoded bitmap immediately',async()=>{
 const {w,dom,d}=await harness();try{
 d.querySelector('header button[aria-label="Close"]').click();await settle();Object.assign(w.editing.elements[0],{type:'image',barcode_spec:{bcid:'code128',text:'A',show_text:true}});w.zebra={barcodeEncode:async spec=>({ok:true,bitmap_width:80,bitmap_height:20,bitmap_hex:spec.text==='12345678'?'BB':'AA'})};w.openObjectProperties(0);
 d.querySelector('[data-object-index="0"][data-property-page="Human Readable"]').click();const input=d.querySelector('[name="barcode_spec.text"]');input.value='12345678';input.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();
 assert.equal(w.editing.elements[0].barcode_spec.text,'12345678');assert.equal(w.editing.elements[0].bitmap_hex,'BB');assert.equal(w.ObjectData.resolve(w.editing.elements[0],w.sampleData(w.editing)),'12345678');
 }finally{dom.window.close();}
});

test('Properties tree uses recognizable distinct icons for border, font and barcode captions',async()=>{
 const {w,dom,d}=await harness();try{
 d.querySelector('header button[aria-label="Close"]').click();await settle();w.editing.elements[0].type='barcode128';w.openObjectProperties(0);
 const icon=name=>d.querySelector('[data-object-index="0"][data-property-page="'+name+'"] svg');
 assert.ok(icon('Border').querySelector('rect'),'Border depicts an actual frame');
 assert.ok(icon('Symbology and Size').querySelector('rect'),'barcode contains bars with visible width');
 assert.equal(icon('Human Readable').querySelector('[data-icon-digits]')?.getAttribute('data-icon-digits'),'123','human-readable combines barcode with digits');
 assert.notEqual(icon('Font').innerHTML,icon('Human Readable').innerHTML);
 assert.equal(icon('Human Readable').parentElement.textContent,'Human Readable','decorative SVG does not alter the tab caption');
 d.querySelector('[data-object-index="0"][data-property-page="Font"]').click();assert.ok(d.querySelector('form').childElementCount>0,'Font page remains usable');
 }finally{dom.window.close();}
});

test('Properties tree toggles selected-only and all objects without losing active edits',async()=>{
 const {w,dom,d}=await harness();try{
 const roots=()=>[...d.querySelectorAll('[data-object-root]')].map(b=>Number(b.dataset.objectRoot));
 const toggle=mode=>{const b=d.querySelector('[data-tree-view="'+mode+'"]');assert.ok(b,'mode '+mode+' is available');assert.ok(b.querySelector('svg'));b.click();assert.equal(d.querySelector('[data-tree-view="'+mode+'"]').getAttribute('aria-pressed'),'true');};
 assert.deepEqual(roots(),[0,1]);toggle('single');assert.deepEqual(roots(),[0]);assert.equal(d.querySelector('[data-object-index="1"]'),null);
 const comments=d.querySelector('[name="comments"]');comments.value='Keep this edit';comments.dispatchEvent(new w.Event('input'));await settle();toggle('all');assert.deepEqual(roots(),[0,1]);assert.equal(d.querySelector('[name="comments"]').value,'Keep this edit');
 d.querySelector('[data-object-root="1"]').click();toggle('single');assert.deepEqual(roots(),[1]);assert.equal(w.editing.elements[0].comments,'Keep this edit');
 d.querySelector('header button[aria-label="Close"]').click();await settle();w.openObjectProperties(0);assert.deepEqual(roots(),[0],'selected-only mode persists when reopened for another object');toggle('all');assert.deepEqual(roots(),[0,1]);
 }finally{dom.window.close();}
});
