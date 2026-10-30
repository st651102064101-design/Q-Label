'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

test('recent projects switch between grid and accessible list and retain the preference',async()=>{
 const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;let opened='';
 w.projectHomeData=()=>({templates:[{file:'one.json',name:'One',width_mm:40,height_mm:20,editable:true}],recentFiles:[{file:'one.json',accessedAt:'2026-10-20T12:00:00Z'}]});w.zebra={loadTemplateRaw:async()=>null};w.selectProjectTemplate=async file=>{opened=file;return true;};
 w.eval(fs.readFileSync(require.resolve('../gui/project-home'),'utf8'));await w.showProjectHome();const list=w.document.querySelector('[data-home-view="list"]'),grid=w.document.querySelector('[data-home-view="grid"]'),recent=w.document.getElementById('phRecent');assert.ok(list&&grid);assert.equal(list.getAttribute('aria-pressed'),'true');assert.equal(recent.dataset.view,'list');
 list.click();assert.equal(recent.dataset.view,'list');assert.equal(list.getAttribute('aria-pressed'),'true');assert.ok(recent.querySelector('.ph-project-name'));assert.match(recent.textContent,/2026|Oct/);assert.equal(w.localStorage.getItem('projectHomeView'),'list');
 w.refreshProjectHome();assert.equal(recent.dataset.view,'list');recent.querySelector('.ph-project').click();await new Promise(r=>setImmediate(r));assert.equal(opened,'one.json');await w.showProjectHome();grid.click();assert.equal(recent.dataset.view,'grid');assert.equal(grid.getAttribute('aria-pressed'),'true');w.refreshProjectHome();assert.equal(recent.dataset.view,'grid','explicit grid choice persists');dom.window.close();
});

test('recent project preview shows empty QR objects and picture placeholders from the saved design',async()=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  const QRCode=require('qrcode');
  for(const file of ['object-data','preview'])w.eval(fs.readFileSync(require.resolve('../gui/'+file),'utf8'));
  const source={width_mm:100,height_mm:100,dpi:203,elements:[
    {type:'qrcode',x_mm:5,y_mm:5,width_mm:20},
    {type:'qrcode',x_mm:30,y_mm:5,width_mm:20},
    {type:'qrcode',x_mm:55,y_mm:5,width_mm:20},
    {type:'image',placeholder:true,x_mm:5,y_mm:35,width_mm:25,height_mm:20}
  ]};
  w.projectHomeData=()=>({templates:[{file:'new-label.json',name:'new-label',editable:true,width_mm:100,height_mm:100}]});
  w.zebra={loadTemplateRaw:async()=>source,qrMatrix:async value=>{const m=QRCode.create(value,{errorCorrectionLevel:'M'}).modules;return {size:m.size,data:Array.from(m.data)};}};
  w.DataSourceEngine={resolve:()=>({})};
  w.eval(fs.readFileSync(require.resolve('../gui/project-home'),'utf8'));
  await w.showProjectHome();
  for(let i=0;i<20&&(w.document.querySelectorAll('#phRecent [data-label-element="0"] rect[fill="#111"]').length<20);i++)await new Promise(resolve=>setTimeout(resolve,5));
  const thumb=w.document.querySelector('#phRecent .ph-thumb svg');
  assert.ok(thumb,'the card renders a preview');
  const objects=[...thumb.querySelectorAll('[data-label-element]')];
  assert.equal(objects.length,4);
  for(const qr of objects.slice(0,3))assert.ok(qr.querySelectorAll('rect[fill="#111"]').length>20,'each empty QR has real preview modules');
  assert.ok(objects[3].querySelector('circle')&&objects[3].querySelector('path'),'the picture placeholder is visible');
  dom.window.close();
});

test('project preview refreshes source values and ignores source events after Home closes',async()=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  let value='first',renders=0;
  const source={width_mm:20,height_mm:20,elements:[{type:'text',text:'{{value}}'}]};
  w.projectHomeData=()=>({templates:[{file:'source.json',name:'Source',width_mm:20,height_mm:20}]});
  w.zebra={loadTemplateRaw:async()=>source};w.sampleData=()=>({value});
  w.LabelPreview={renderPreviewSVG:(_source,data)=>{renders++;return `<svg data-value="${data.value}"></svg>`;}};
  w.eval(fs.readFileSync(require.resolve('../gui/project-home'),'utf8'));await w.showProjectHome();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(w.document.querySelector('#phRecent svg').dataset.value,'first');
  value='updated';w.document.dispatchEvent(new w.Event('source-inputs-ready'));
  assert.equal(w.document.querySelector('#phRecent svg').dataset.value,'updated');
  w.hideProjectHome();const before=renders;w.document.dispatchEvent(new w.Event('source-inputs-ready'));
  assert.equal(renders,before,'hidden Home no longer responds to source updates');
  dom.window.close();
});

test('Create a New Label opens a wizard layer above Project Home',()=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.HTMLDialogElement.prototype.show=function(){this.setAttribute('open','');};
  w.eval(fs.readFileSync(require.resolve('../gui/modal-windows'),'utf8'));
  const wizard=w.document.createElement('dialog');wizard.id='newLabelWizard';w.document.body.append(wizard);
  w.openNewLabelWizard=()=>wizard.showModal();
  w.eval(fs.readFileSync(require.resolve('../gui/project-home'),'utf8'));
  w.showProjectHome();
  w.document.querySelector('#phNew').click();
  assert.equal(wizard.open,true,'the New Label action should open its wizard');
  const homeZ=Number.parseInt(w.getComputedStyle(w.document.getElementById('projectHome')).zIndex,10);
  assert.ok(homeZ<1000,`Project Home must stay below regular modal layers, got z-index ${homeZ}`);
  assert.ok(Number(wizard.style.zIndex)>homeZ,'the wizard must paint above Project Home');
  dom.window.close();
});

test('startup Home skeleton renders exactly the supplied project count',()=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body><div id="startupHomeSkeleton"><div class="sk-projects"></div><footer></footer></div></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.eval(fs.readFileSync(require.resolve('../gui/project-home'),'utf8'));
  const templates=Array.from({length:10},(_,i)=>({file:`project-${i}.json`,name:`Project ${i}`,width_mm:50,height_mm:30}));
  w.renderStartupHomeSkeleton([]);
  assert.equal(w.document.querySelectorAll('#startupHomeSkeleton .sk-project').length,0,'an empty project list must not show phantom project cards');
  assert.equal(w.document.querySelector('#startupHomeSkeleton .sk-empty')?.textContent,'No labels yet. Create a new label to get started.','an empty list shows the same empty state as Home');
  w.renderStartupHomeSkeleton(templates);
  assert.equal(w.document.querySelectorAll('#startupHomeSkeleton .sk-project').length,10,'skeleton card count matches all actual projects');
  assert.equal(w.document.querySelector('#startupHomeSkeleton .sk-empty'),null,'the empty state is removed when projects exist');
  dom.window.close();
});

test('New Label Wizard removes right margin and padding from every right-edge panel',()=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.HTMLDialogElement.prototype.show=function(){this.setAttribute('open','');};
  w.eval(fs.readFileSync(require.resolve('../gui/new-label-wizard'),'utf8'));
  for(const selector of ['#newLabelWizard > header','#newLabelWizard .nw-heading','#newLabelWizard .nw-body','#newLabelWizard .nw-body > aside']){
    const element=w.document.querySelector(selector);
    assert.ok(element,`missing wizard layout element ${selector}`);
    const style=w.getComputedStyle(element);
    assert.equal(style.paddingRight,'0px',`${selector} must reach the right edge without padding`);
    assert.equal(style.marginRight,'0px',`${selector} must reach the right edge without margin`);
  }
  const footer=w.document.querySelector('#newLabelWizard > form > footer');
  assert.ok(footer,'wizard footer is present');
  assert.equal(w.getComputedStyle(footer).paddingRight,'16px','footer keeps right inset so Finish is not flush with the dialog edge');
  const wizardStyle=[...w.document.querySelectorAll('style')].map(style=>style.textContent).join('\n');
  assert.match(wizardStyle,/#newLabelWizard>header,#newLabelWizard>form\{[^}]*width:100%!important/,'header and form explicitly cover the full dialog content width');
  dom.window.close();
});

test('New Label wizard action buttons keep their icon and label inside a responsive footer',()=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.HTMLDialogElement.prototype.show=function(){this.setAttribute('open','');};
  w.eval(fs.readFileSync(require.resolve('../gui/new-label-wizard'),'utf8'));
  w.eval(fs.readFileSync(require.resolve('../gui/action-button-ui'),'utf8'));
  const footer=w.document.querySelector('#newLabelWizard footer'),buttons=[...footer.querySelectorAll('button')];
  assert.equal(w.getComputedStyle(w.document.querySelector('#newLabelWizard header')).backgroundColor,'rgb(22, 163, 74)','the wizard title bar uses the green theme');
  assert.equal(w.getComputedStyle(w.document.querySelector('#newLabelWizard')).borderTopColor,'rgb(21, 128, 61)','the wizard frame matches its green title bar');
  assert.equal(w.getComputedStyle(w.document.querySelector('#nwPreview')).width,'100%','the label layout preview fills its panel');
  assert.equal(w.getComputedStyle(footer).flexWrap,'wrap','buttons must wrap instead of overlapping on narrow windows');
  for(const button of buttons){
    const style=w.getComputedStyle(button);
    assert.equal(style.flexGrow,'0',`${button.textContent.trim()} keeps the compact wizard button width`);
    assert.equal(style.flexShrink,'0',`${button.textContent.trim()} retains its compact width before footer wrapping`);
    assert.equal(style.flexBasis,'86px',`${button.textContent.trim()} uses the current compact wizard button size`);
    assert.equal(style.minWidth,'0px',`${button.textContent.trim()} must be allowed to fit narrow rows`);
    assert.equal(style.whiteSpace,'nowrap',`${button.textContent.trim()} label must stay on one line`);
    assert.ok(button.querySelector('svg')&&button.textContent.trim(),`${button.id} keeps its icon and readable label`);
    assert.equal(w.getComputedStyle(button.querySelector('svg')).width,'14px',`${button.textContent.trim()} icon stays compact so it cannot force its label into a narrow column`);
    assert.equal(style.width,'86px',`${button.textContent.trim()} has the current compact width`);
  }
  dom.window.close();
});

test('project cards rotate multi-page previews every three seconds and keep card opening intact',async()=>{
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  const timers=[];w.setInterval=(callback,delay)=>{const timer={callback,delay,cleared:false};timers.push(timer);return timer;};w.clearInterval=timer=>{timer.cleared=true;};
  const multiSource={width_mm:50,height_mm:30,elements:[],template_pages:[{design:{elements:[{text:'PAGE ONE'}]}},{design:{elements:[{text:'PAGE TWO'}]}}]};
  const singleSource={width_mm:50,height_mm:30,elements:[{text:'SINGLE PAGE'}]};let openedFile=null;
  w.projectHomeData=()=>({templates:[{file:'multi.json',name:'Multi',editable:true,width_mm:50,height_mm:30},{file:'single.json',name:'Single',editable:true,width_mm:50,height_mm:30}]});
  w.zebra={loadTemplateRaw:async file=>file==='multi.json'?multiSource:singleSource};
  w.DataSourceEngine={resolve:source=>source.values||{}};w.LabelPreview={renderPreviewSVG:template=>`<svg data-preview="${template.elements?.[0]?.text||'EMPTY'}"></svg>`};
  w.selectProjectTemplate=async file=>{openedFile=file;return true;};
  w.eval(fs.readFileSync(require.resolve('../gui/project-home'),'utf8'));w.showProjectHome();await new Promise(resolve=>setImmediate(resolve));
  const multiCards=[...w.document.querySelectorAll('.ph-project[data-template-file="multi.json"]')],singleCards=[...w.document.querySelectorAll('.ph-project[data-template-file="single.json"]')];
  assert.equal(multiCards.length,2,'recent and all-project views each render the project card');assert.equal(singleCards.length,2);
  assert.ok(multiCards.every(card=>card.querySelector('.ph-thumb svg')?.dataset.preview==='PAGE ONE'),'multi-page cards begin with the first page preview');
  assert.ok(singleCards.every(card=>card.querySelector('.ph-thumb svg')?.dataset.preview==='SINGLE PAGE'),'single-page cards retain their existing preview');
  assert.ok(singleCards.every(card=>w.getComputedStyle(card.querySelector('.ph-thumb')).backgroundColor==='rgb(229, 231, 235)'),'white blank labels remain visible against the grey thumbnail stage');
  assert.ok(singleCards.every(card=>card.querySelector('.ph-thumb svg')?.getAttribute('width')==='80%'),'blank sheets retain visible grey space around their thumbnail');
  assert.equal(timers.length,2,'only multi-page cards receive a carousel timer');assert.ok(timers.every(timer=>timer.delay===3000),'each preview rotates on a three-second interval');
  for(const timer of timers)timer.callback();
  assert.ok(multiCards.every(card=>card.querySelector('.ph-thumb svg')?.dataset.preview==='PAGE TWO'),'each card advances to the next template page');
  for(const timer of timers)timer.callback();
  assert.ok(multiCards.every(card=>card.querySelector('.ph-thumb svg')?.dataset.preview==='PAGE ONE'),'the carousel wraps back to the first page');
  multiCards[0].click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(openedFile,'multi.json','clicking the card still opens its project');assert.equal(w.document.getElementById('projectHome').hidden,true,'successful project opening hides Project Home');assert.ok(timers.every(timer=>timer.cleared),'hiding Project Home clears preview timers');
  dom.window.close();
});
