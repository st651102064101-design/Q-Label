'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const RibbonTitleLayout=require('../gui/ribbon-title-layout');
const RibbonTabBehavior=require('../gui/ribbon-tab-behavior');

function renderRibbonFixture(){
  const root=path.resolve(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'gui/index.html'),'utf8');
  const styles=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(match=>match[1]).join('\n');
  const dom=new JSDOM(`<!doctype html><html><head><style>${styles}</style></head><body><div class="edbar"><button id="redoBtn" disabled>Redo</button>
    <div class="ribbon-panel" id="ribbon-home"><div class="ribbon-group"><div class="ribbon-items"><button class="ribbon-command" disabled>Needs selection</button></div><div class="ribbon-group-label">Clipboard</div></div>
      <label class="ribbon-field"><input disabled value="14"></label>
      <div class="text-format-tools"><div class="text-format-row"><div class="text-format-line"><label class="unavailable-tool"><select disabled><option>Unavailable font</option></select></label></div></div></div>
    </div></div></body></html>`,{pretendToBeVisual:true});
  return dom;
}

test('disabled ribbon commands, fields, groups and unavailable formatting remain visible',()=>{
  const dom=renderRibbonFixture(),document=dom.window.document;
  for(const selector of ['#redoBtn','.ribbon-command:disabled','.ribbon-group','.ribbon-field','.ribbon-field input:disabled','.unavailable-tool','.text-format-tools']){
    const element=document.querySelector(selector);
    assert.ok(element,`${selector} fixture exists`);
    assert.notEqual(dom.window.getComputedStyle(element).display,'none',`${selector} stays visible when unavailable`);
  }
  assert.equal(document.querySelector('.ribbon-command').disabled,true,'unavailable command remains disabled');
  assert.equal(document.querySelector('.ribbon-field input').disabled,true,'unavailable field remains disabled');
  assert.equal(document.querySelector('.unavailable-tool select').disabled,true,'unavailable formatting control remains disabled');
  dom.window.close();
});

test('every editor ribbon tab, including Picture, remains available in the tab strip',()=>{
  const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'gui/index.html'),'utf8');
  const source=fs.readFileSync(path.join(root,'gui/ribbon.js'),'utf8');
  const tabNames=['File','Home','Insert','Layout','Picture','Data','View','Tools','Help'];
  for(const name of tabNames){
    assert.ok(source.includes(`tab('${name}')`),`${name} panel is created by Ribbon`);
  }
  assert.doesNotMatch(source,/pictureButton\.hidden\s*=\s*true|pictureButton\.hidden\s*=\s*!isPicture/,'Picture tab is not hidden outside picture selection');
  assert.doesNotMatch(html,/\.edbar\s+:is\(button,input,select\):disabled\s*\{[^}]*display\s*:\s*none/i,'disabled ribbon controls are not globally hidden');
});
test('Insert ribbon has no standalone SVG tool and retains Picture and other drawing tools',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../gui/ribbon.js'),'utf8');
  const row=source.split('\n').find(line=>line.includes("group(insert,'Text and graphics')"));assert.ok(row);assert.doesNotMatch(row,/\['svg','SVG'\]/);for(const type of ['text','box','ellipse','line','inverse','image'])assert.match(row,new RegExp("\\['"+type+"','"));
});

test('all ribbon tabs ignore hover and activate on click',()=>{
 const dom=new JSDOM('<button>Layout</button><button>View</button><button>Tools</button>'),buttons=[...dom.window.document.querySelectorAll('button')],activated=[];
 for(const b of buttons){RibbonTabBehavior.bind(b,()=>activated.push(b.textContent),{hover:RibbonTabBehavior.shouldHover(b.textContent)});for(const pointerType of ['mouse','pen','touch']){const e=new dom.window.Event('pointerenter');Object.defineProperty(e,'pointerType',{value:pointerType});b.dispatchEvent(e);}assert.equal(RibbonTabBehavior.shouldHover(b.textContent),false);}
 assert.deepEqual(activated,[]);buttons.forEach(b=>b.click());assert.deepEqual(activated,['Layout','View','Tools']);dom.window.close();
});
test('ribbon tabs have no hover highlight and retain selected underline',()=>{const html=fs.readFileSync(path.join(__dirname,'../gui/index.html'),'utf8');assert.doesNotMatch(html,/\.edbar \.ribbon-tab:hover\s*\{/);assert.match(html,/\.edbar \.ribbon-tab\[aria-selected=true\]\{[^}]*box-shadow:inset 0 -3px var\(--accent\)/);});
test('Home and Insert tabs respond to click rather than pointer entry',()=>{
 const dom=new JSDOM('<button>Home</button><button>Insert</button>'),buttons=[...dom.window.document.querySelectorAll('button')],activated=[];
 for(const button of buttons)RibbonTabBehavior.bind(button,()=>activated.push(button.textContent),{hover:RibbonTabBehavior.shouldHover(button.textContent)});
 for(const button of buttons){const event=new dom.window.Event('pointerenter');Object.defineProperty(event,'pointerType',{value:'mouse'});button.dispatchEvent(event);}
 assert.deepEqual(activated,[]);buttons[0].click();buttons[1].click();assert.deepEqual(activated,['Home','Insert']);assert.equal(RibbonTabBehavior.shouldHover('Layout'),false);dom.window.close();
});

test('focused File menu New item has no border or outline from global focus styling',()=>{
  const dom=renderRibbonFixture(),document=dom.window.document;
  const menu=document.createElement('div');menu.className='ribbon-file-menu';
  const item=document.createElement('button');item.setAttribute('role','menuitem');item.textContent='New';menu.append(item);document.body.append(menu);
  const lateGlobalFocusStyle=document.createElement('style');lateGlobalFocusStyle.textContent='button:focus:not([role="tab"]){outline:2px solid rgb(22,163,74)!important;outline-offset:1px;border-color:rgb(22,163,74)!important}';document.head.append(lateGlobalFocusStyle);
  item.focus();
  const style=dom.window.getComputedStyle(item);
  assert.equal(style.outlineStyle,'none','the menu override prevents the global focus outline');
  assert.equal(parseFloat(style.borderWidth),0,'the New item has no border');
  dom.window.close();
});

test('Snap to grid keeps its active state without a click or focus border',()=>{
  const dom=renderRibbonFixture(),document=dom.window.document,button=document.createElement('button');
  button.type='button';button.className='ribbon-command snap-grid-toggle is-active';button.setAttribute('aria-pressed','true');button.innerHTML='<svg data-icon="snap-to-grid"></svg><span class="ribbon-caption">Snap to grid</span>';
  document.querySelector('.edbar').append(button);button.focus();
  const style=dom.window.getComputedStyle(button);
  assert.ok(['transparent','rgba(0, 0, 0, 0)'].includes(style.borderTopColor),'active toggle does not keep a visible border after click');
  assert.equal(style.outlineStyle,'none','focus after click does not leave a border-like outline');
  const rules=[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules];}catch{return [];}}),activeRule=rules.find(rule=>rule.selectorText?.includes('.snap-grid-toggle.is-active:not(:hover)')),hoverRule=rules.find(rule=>rule.selectorText==='.edbar .ribbon-command.snap-grid-toggle:hover');
  assert.equal(activeRule?.style.getPropertyValue('border-color'),'transparent','active state explicitly clears the persistent border');
  assert.equal(hoverRule?.style.getPropertyValue('border-color'),'var(--accent)','hover state explicitly restores the accent border');
  dom.window.close();
});

test('ribbon project title expands to the available space before Search and updates on resize',()=>{
  const dom=renderRibbonFixture(),document=dom.window.document;
  const access=document.createElement('div');access.className='ribbon-quick-access';
  const title=document.createElement('span');title.className='ed-title ribbon-document-title';title.innerHTML='<span class="dot"></span><span id="edTitle">Editing: a long project name</span>';
  const search=document.createElement('div');search.className='tool-search';
  access.append(title,search);document.querySelector('.edbar').append(access);
  let titleLeft=189,searchLeft=550;
  title.getBoundingClientRect=()=>({left:titleLeft,right:titleLeft+Number.parseFloat(title.style.maxWidth||'0'),width:Number.parseFloat(title.style.maxWidth||'0')});
  search.getBoundingClientRect=()=>({left:searchLeft,right:searchLeft+300,width:300});
  const dispose=RibbonTitleLayout.install(document,dom.window);
  assert.equal(title.style.maxWidth,'353px','wide view uses all space up to the Search gap');
  searchLeft=306;dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.equal(title.style.maxWidth,'109px','narrow view recomputes available space before Search');
  assert.equal(dom.window.getComputedStyle(document.getElementById('edTitle')).textOverflow,'ellipsis','long title truncates cleanly');
  dispose();dom.window.close();
});
