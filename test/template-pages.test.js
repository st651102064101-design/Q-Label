'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
test('duplicating a source-backed page preserves original object identity and clones unnamed data',()=>{
  const Model=require('../gui/source-model'),dom=new JSDOM('<body><div id="previewFrame"></div></body>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
  Object.assign(w,{structuredClone,SourceModel:Model,editing:Model.migrate({elements:[{type:'text',text:'ORIGINAL'}]}),editorSel:null,editorSelection:new Set(),readEditorIntoDraft(){},refreshEditorUI(){},drawEditorCanvas(){},touchEditor(){},persistEditor:async()=>{},pushSnapshot(){}});
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  const original=structuredClone(w.editing.elements[0]);w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const tab=w.document.querySelector('[role="tab"]');tab.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
  [...w.document.querySelectorAll('[role="menuitem"]')].find(b=>b.textContent.includes('Duplicate')).click();
  assert.notEqual(w.editing.elements[0].id,original.id);assert.notEqual(w.editing.elements[0].dataSourceRefs[0],original.dataSourceRefs[0]);
  assert.equal(w.editing.template_pages[0].design.elements[0].id,original.id);dom.window.close();
});
test('page Copy/Paste creates new source and object identities',()=>{
  const Model=require('../gui/source-model'),dom=new JSDOM('<body><div id="previewFrame"></div></body>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
  Object.assign(w,{structuredClone,SourceModel:Model,editing:Model.migrate({elements:[{type:'text',text:'SOURCE'}]}),editorSel:null,editorSelection:new Set(),readEditorIntoDraft(){},refreshEditorUI(){},drawEditorCanvas(){},touchEditor(){},persistEditor:async()=>{},pushSnapshot(){}});
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));const original=structuredClone(w.editing.elements[0]);
  function action(label){w.document.querySelector('[role="tab"]').dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true}));[...w.document.querySelectorAll('[role="menuitem"]')].find(b=>b.querySelector('.template-page-command-label')?.textContent===label).click();}
  action('Copy');action('Paste');assert.notEqual(w.editing.elements[0].id,original.id);assert.notEqual(w.editing.elements[0].dataSourceRefs[0],original.dataSourceRefs[0]);dom.window.close();
});

test('template filmstrip gives each page a full-size preview tile and a compact add button',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="previewFrame"></div></body>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={elements:[],template_pages:[{name:'Template 1',design:{elements:[]}}],template_page_active:0};
  w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.pushSnapshot=()=>{};
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const tab=w.document.querySelector('[role="tab"]'),plus=w.document.querySelector('.template-page-add-control>button:first-child');
  assert.equal(w.getComputedStyle(tab).width,'89.6px','filmstrip cards use 80% of the former width');
  assert.equal(w.getComputedStyle(tab).height,'51.2px','filmstrip cards use 80% of the former height');
  assert.equal(w.getComputedStyle(tab).boxShadow,'none','the selected page has no dark outer side borders from shadow rings');
  assert.ok(tab.querySelector('.template-page-thumbnail'),'page artwork has its own thumbnail viewport');
  assert.equal(tab.getAttribute('aria-label'),'Template 1','thumbnail remains accessible by page name');
  assert.equal(w.getComputedStyle(plus).width,'57.6px','the split add control main action scales with the bar');
  const addOptions=w.document.querySelector('.template-page-add-menu-button');assert.equal(w.getComputedStyle(addOptions).width,'32px','the add options segment scales with the bar');assert.ok(addOptions.querySelector('svg path'),'the dropdown uses a clear chevron rather than a font glyph');
  assert.equal(w.getComputedStyle(w.document.querySelector('.template-page-add-control')).backgroundColor,'rgb(231, 246, 236)','the add control follows the light Q LABEL theme');
  assert.equal(w.getComputedStyle(w.document.querySelector('.template-page-bar')).height,'67.2px','filmstrip height scales to 80%');
  assert.equal(w.getComputedStyle(w.document.querySelector('.template-page-bar')).backgroundColor,'rgba(255, 255, 255, 0.92)','filmstrip uses a light translucent surface instead of a black rail');
  assert.equal(w.getComputedStyle(w.document.querySelector('.template-page-tabs')).overflowX,'hidden','filmstrip never creates a native horizontal scrollbar');
  assert.equal(w.getComputedStyle(w.document.querySelector('.template-page-tabs')).scrollbarWidth,'none','filmstrip hides platform scrollbars');
  const previewFrame=w.document.getElementById('previewFrame');previewFrame.classList.add('preview-frame');
  const horizontalPreviewScrollbar=w.document.createElement('div');horizontalPreviewScrollbar.className='preview-scrollbar horizontal';previewFrame.append(horizontalPreviewScrollbar);
  const scrollbarCorner=w.document.createElement('div');scrollbarCorner.className='preview-scrollbar-corner';previewFrame.append(scrollbarCorner);
  assert.equal(w.getComputedStyle(horizontalPreviewScrollbar).display,'none','filmstrip hides the editor bottom scrollbar');
  assert.equal(w.getComputedStyle(scrollbarCorner).display,'none','filmstrip hides the editor scrollbar corner with the bottom scrollbar');
  dom.window.close();
});

test('template filmstrip width follows page count and scrolls only after reaching the available width',async()=>{
  const measure=async(count)=>{
    const dom=new JSDOM('<!doctype html><body><div id="previewFrame"></div></body>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window,frame=w.document.getElementById('previewFrame');
    Object.defineProperty(frame,'clientWidth',{value:900});frame.getBoundingClientRect=()=>({left:0,right:900,width:900,top:0,bottom:700,height:700});
    w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
    w.editing={elements:[],template_pages:Array.from({length:count},(_,i)=>({name:'Template '+(i+1),design:{elements:[]}})),template_page_active:0};
    w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.pushSnapshot=()=>{};
    w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));await new Promise(resolve=>w.requestAnimationFrame(resolve));
    const bar=w.document.querySelector('.template-page-bar'),tabs=w.document.querySelector('.template-page-tabs');
    const result={width:parseFloat(bar.style.width),available:864,scrolling:tabs.classList.contains('has-overflow'),overflowX:w.getComputedStyle(tabs).overflowX};dom.window.close();return result;
  };
  const one=await measure(1),three=await measure(3),many=await measure(20);
  assert.ok(one.width<three.width,'adding pages increases the filmstrip width');
  assert.equal(one.scrolling,false,'a short filmstrip does not reserve the empty viewport');
  assert.equal(three.scrolling,false,'all three visible thumbnails fit without scrolling');
  assert.equal(many.width,many.available,'the filmstrip stops growing at the available frame width');
  assert.equal(many.scrolling,true,'overflowing pages remain available through horizontal scrolling');
  assert.equal(many.overflowX,'hidden','even a long filmstrip keeps custom scrolling without creating a native scrollbar');
});

test('template page actions show an ellipsis on hover and focus and open the page menu without selecting by mistake',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="previewFrame"><div class="preview-pane"></div></div><div id="insertSidebar"></div></body>',{runScripts:'dangerously',url:'http://localhost',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={elements:[{type:'text',text:'A'}],template_pages:[{name:'A',design:{elements:[{type:'text',text:'A'}]}},{name:'B',design:{elements:[{type:'text',text:'B'}]}}],template_page_active:0};w.editorSel=null;w.editorSelection=new Set();
  w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.pushSnapshot=()=>{};
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const tabs=[...w.document.querySelectorAll('[role="tab"]')],first=tabs[0],second=tabs[1],more=first.querySelector('.template-page-more');
  const ellipsisIcon=more?.querySelector('svg');assert.ok(ellipsisIcon,'each page has a vector ellipsis affordance');assert.equal(ellipsisIcon.getAttribute('viewBox'),'0 0 24 24','the ellipsis uses a centered 24px icon coordinate space');assert.equal(ellipsisIcon.querySelectorAll('circle').length,3,'the ellipsis icon has three evenly spaced dots');
  assert.equal(w.getComputedStyle(more).display,'flex','the ellipsis hit area centers its icon');assert.equal(w.getComputedStyle(more).alignItems,'center');assert.equal(w.getComputedStyle(more).justifyContent,'center');
  assert.equal(more.getAttribute('aria-hidden'),'true','the visual affordance does not replace the accessible tab/menu keyboard path');
  assert.equal(w.getComputedStyle(more).opacity,'0','ellipsis stays out of the way before hover');
  first.dispatchEvent(new w.MouseEvent('mouseenter'));assert.equal(w.getComputedStyle(more).opacity,'1','hover reveals ellipsis');
  second.getBoundingClientRect=()=>({left:60,right:172,top:10,bottom:74,width:112,height:64});
  const secondMore=second.querySelector('.template-page-more');secondMore.dispatchEvent(new w.MouseEvent('mouseenter',{bubbles:false,cancelable:true,clientX:164,clientY:18}));
  assert.equal(w.document.querySelector('.template-page-menu').hidden,false,'hovering the ellipsis opens page actions immediately');
  assert.equal(w.editing.template_page_active,0,'hovering page actions does not switch the active page');
  w.document.querySelector('.template-page-menu').hidden=true;
  first.dispatchEvent(new w.MouseEvent('mouseleave'));assert.equal(w.getComputedStyle(more).opacity,'0','leaving the card hides ellipsis');
  first.focus();assert.equal(w.getComputedStyle(more).opacity,'1','keyboard focus also reveals ellipsis');
  const click=new w.MouseEvent('click',{bubbles:true,cancelable:true,clientX:164,clientY:18});second.dispatchEvent(click);
  assert.equal(click.defaultPrevented,true,'clicking the ellipsis zone is consumed as a menu action');
  assert.equal(w.document.querySelector('.template-page-menu').hidden,false,'ellipsis opens the existing page action menu');
  assert.equal(w.editing.template_page_active,0,'opening page actions does not switch away from the current page');
  dom.window.close();
});

test('page action menu uses the top layer helper so modal dialogs cannot cover it',()=>{
  const dom=new JSDOM('<!doctype html><body><dialog id="newLabelWizard" open></dialog><div id="previewFrame"></div></body>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={elements:[],template_pages:[{name:'Template 1',design:{elements:[]}}],template_page_active:0};
  w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.pushSnapshot=()=>{};
  w.eval(fs.readFileSync(require.resolve('../gui/floating-menu-top-layer'),'utf8'));
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const menu=w.document.querySelector('.template-page-menu');
  w.document.querySelector('[role="tab"]').dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:120,clientY:120}));
  assert.equal(menu.hidden,false,'page menu opens while a modal wizard is visible');
  if(typeof menu.showPopover==='function')assert.equal(menu.popover,'manual','page menu is promoted to the browser top layer when supported');
  assert.equal(menu.parentNode,w.document.body,'page menu stays on document.body above modal hosts');
  dom.window.close();
});

test('page action menu opens above its ellipsis trigger without covering it',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="previewFrame"></div></body>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={elements:[],template_pages:[{name:'Template 1',design:{elements:[]}}],template_page_active:0};
  w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.pushSnapshot=()=>{};
  Object.defineProperty(w,'innerHeight',{value:500,configurable:true});
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const tab=w.document.querySelector('[role="tab"]'),more=tab.querySelector('.template-page-more'),menu=w.document.querySelector('.template-page-menu');
  tab.getBoundingClientRect=()=>({left:100,right:212,top:300,bottom:364,width:112,height:64});
  more.getBoundingClientRect=()=>({left:176,right:208,top:304,bottom:336,width:32,height:32});
  menu.getBoundingClientRect=()=>({left:0,right:190,top:0,bottom:350,width:190,height:350});
  more.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,clientX:192,clientY:320}));
  assert.equal(menu.hidden,false,'ellipsis opens its page action menu');
  assert.equal(menu.style.top,'4px','the menu shifts to the top of the available area above the page');
  assert.equal(menu.style.maxHeight,'288px','menu height is constrained to the space above the page');
  assert.equal(menu.style.overflowY,'auto','long menu remains usable by scrolling within its available height');
  assert.ok(parseFloat(menu.style.top)+Math.min(350,parseFloat(menu.style.maxHeight))<=292,'the menu ends before the page card and its ellipsis trigger');
  const addControl=w.document.querySelector('.template-page-add-control'),addDropdown=w.document.querySelector('.template-page-add-menu-button');
  addControl.getBoundingClientRect=()=>({left:300,right:414,top:400,bottom:464,width:114,height:64});
  menu.getBoundingClientRect=()=>({left:0,right:190,top:0,bottom:86,width:190,height:86});
  menu.dispatchEvent(new w.MouseEvent('mouseleave',{relatedTarget:w.document.body}));
  addDropdown.dispatchEvent(new w.MouseEvent('mouseenter'));
  assert.equal(menu.style.maxHeight,'','the add dropdown does not inherit the page action menu height constraint');
  assert.equal(menu.style.overflowY,'','the add dropdown does not inherit the page action menu scrolling');
  dom.window.close();
});

test('page menus measure the open top layer on every reopen',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="previewFrame"></div></body>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={elements:[]};w.editorSelection=new Set();
  for(const key of ['readEditorIntoDraft','refreshEditorUI','drawEditorCanvas','touchEditor','pushSnapshot'])w[key]=()=>{};
  const open=new Set();w.FloatingMenuTopLayer={show(menu){menu.hidden=false;open.add(menu);},hide(menu){menu.hidden=true;open.delete(menu);}};
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const menu=w.document.querySelector('.template-page-menu'),group=w.document.querySelector('.template-page-add-control'),caret=w.document.querySelector('.template-page-add-menu-button'),tab=w.document.querySelector('[role=tab]');
  group.getBoundingClientRect=()=>({left:300,right:414,top:600,bottom:664,width:114,height:64});
  tab.getBoundingClientRect=()=>({left:180,right:292,top:600,bottom:664,width:112,height:64});
  menu.getBoundingClientRect=()=>({width:open.has(menu)?240:0,height:open.has(menu)?86:0});
  for(let i=0;i<3;i++){
    caret.click();assert.equal(menu.style.left,'174px','menu has its actual width before right alignment');assert.equal(menu.style.top,'514px','menu has its actual height before positioning above the add control');
    menu.dispatchEvent(new w.MouseEvent('mouseleave'));
    tab.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:180,clientY:600}));
    assert.equal(menu.style.top,'506px','context menu also measures after promotion');assert.equal(menu.style.maxHeight,'86px','context menu cannot collapse to a zero-height strip');
    menu.dispatchEvent(new w.MouseEvent('mouseleave'));
  }
  dom.window.close();
});

test('template add split control matches reference proportions and closes choices on hover exit',async()=>{
  const dom=new JSDOM('<!doctype html><body><div id="previewFrame"><div class="preview-pane"></div></div><div id="insertSidebar"></div></body>',{runScripts:'dangerously',url:'http://localhost',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={elements:[{type:'text',text:'A'}],template_pages:[{name:'A',design:{elements:[{type:'text',text:'A'}]}},{name:'B',design:{elements:[{type:'text',text:'B'}]}}],template_page_active:0};w.editorSel=null;w.editorSelection=new Set();
  w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.pushSnapshot=()=>{};
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const dropdown=w.document.querySelector('.template-page-add-menu-button'),group=w.document.querySelector('.template-page-add-control');assert.equal(dropdown.getAttribute('aria-haspopup'),'menu');
  assert.equal(w.getComputedStyle(group).width,'91.2px','the complete split control scales to 80%');
  assert.equal(w.getComputedStyle(group).height,'51.2px','the complete split control scales to 80%');
  group.getBoundingClientRect=()=>({left:300,right:414,top:600,bottom:664,width:114,height:64});
  const menu=w.document.querySelector('.template-page-menu');menu.getBoundingClientRect=()=>({left:0,right:240,top:0,bottom:86,width:240,height:86});
  assert.equal(dropdown.getAttribute('aria-expanded'),'false');dropdown.dispatchEvent(new w.MouseEvent('mouseenter'));
  assert.equal(menu.hidden,false,'hovering the caret immediately opens the page creation menu');assert.equal(dropdown.getAttribute('aria-expanded'),'true','the caret exposes its expanded state');assert.equal(menu.style.left,'174px','the dropdown aligns its right edge to the add control');assert.equal(menu.style.top,'514px','the dropdown touches the top edge of the add control');assert.equal(w.editing.template_pages.length,2,'opening the menu does not create a page');
  assert.equal(w.editing.template_page_active,0,'opening the menu leaves the current page selected');
  const addBlank=[...menu.querySelectorAll('[role="menuitem"]')].find(item=>item.textContent.includes('Add blank page'));
  assert.ok(addBlank?.querySelector('svg path,svg rect,svg circle'),'Add blank page has visible SVG artwork');
  const duplicate=[...menu.querySelectorAll('[role="menuitem"]')].find(item=>item.textContent.includes('Duplicate current page'));assert.ok(duplicate,'the menu offers a duplicate-page action');duplicate.click();
  assert.ok(duplicate.querySelector('svg path,svg rect,svg circle'),'Duplicate current page has visible SVG artwork');
  assert.equal(w.editing.template_pages.length,3,'choosing Duplicate creates the new page');assert.equal(w.editing.template_pages[2].design.elements[0].text,'A','the new page copies the active page design');assert.equal(w.editing.template_page_active,2,'the new duplicate becomes active');
  dropdown.dispatchEvent(new w.MouseEvent('mouseenter'));assert.equal(menu.hidden,false,'hover opens the menu again');
  dropdown.dispatchEvent(new w.MouseEvent('mouseleave',{relatedTarget:menu}));assert.equal(menu.hidden,false,'moving from the arrow into the dropdown keeps it open');
  menu.dispatchEvent(new w.MouseEvent('mouseenter',{relatedTarget:dropdown}));menu.dispatchEvent(new w.MouseEvent('mouseleave',{relatedTarget:dropdown}));assert.equal(menu.hidden,false,'moving from the dropdown back to the arrow keeps it open');
  dropdown.dispatchEvent(new w.MouseEvent('mouseenter',{relatedTarget:menu}));
  const plus=group.querySelector('button:first-child');dropdown.dispatchEvent(new w.MouseEvent('mouseleave',{relatedTarget:plus}));assert.equal(menu.hidden,true,'moving from the arrow to the plus button closes immediately');assert.equal(dropdown.getAttribute('aria-expanded'),'false');
  plus.dispatchEvent(new w.MouseEvent('mouseenter',{relatedTarget:dropdown}));dropdown.dispatchEvent(new w.MouseEvent('mouseenter'));assert.equal(menu.hidden,false,'the arrow opens the dropdown again');dropdown.dispatchEvent(new w.MouseEvent('mouseleave',{relatedTarget:w.document.body}));assert.equal(menu.hidden,true,'leaving the arrow for outside space closes immediately');
  dropdown.dispatchEvent(new w.MouseEvent('mouseenter'));assert.equal(menu.hidden,false,'the arrow reopens after outside exit');
  dropdown.dispatchEvent(new w.MouseEvent('mouseleave',{relatedTarget:menu}));menu.dispatchEvent(new w.MouseEvent('mouseenter',{relatedTarget:dropdown}));assert.equal(menu.hidden,false,'moving from the arrow into the menu keeps it open');
  menu.dispatchEvent(new w.MouseEvent('mouseleave',{relatedTarget:w.document.body}));assert.equal(menu.hidden,true,'leaving the menu for outside space closes immediately');assert.equal(dropdown.getAttribute('aria-expanded'),'false','closing on hover exit resets the expanded state');
  dropdown.dispatchEvent(new w.MouseEvent('mouseenter'));assert.equal(menu.hidden,false,'the arrow can reopen the menu after an outside exit');
  menu.dispatchEvent(new w.MouseEvent('mouseleave',{relatedTarget:plus}));assert.equal(menu.hidden,true,'moving from the menu to the plus button closes immediately');dom.window.close();
});

test('template context-menu hotkeys copy, paste, duplicate, add and delete pages without invoking object shortcuts',()=>{
  const dom=new JSDOM('<!doctype html><body><button id="pageSetupOpen"></button><button id="tabTemplates"></button><div id="previewFrame"><div class="preview-pane"></div></div><div id="insertSidebar"></div></body>',{runScripts:'dangerously',url:'http://localhost',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={elements:[{type:'text',text:'Page artwork'}],template_pages:[{name:'Template 1',design:{elements:[{type:'text',text:'Page artwork'}]}}],template_page_active:0};w.editorSel=0;w.editorSelection=new Set([0]);
  w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>w.document.dispatchEvent(new w.Event('editor-selection-changed'));w.touchEditor=()=>{};w.persistEditor=async()=>{};w.pushSnapshot=()=>{};
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  let objectShortcuts=0;w.document.addEventListener('keydown',event=>{if(event.ctrlKey&&['KeyC','KeyV','KeyD'].includes(event.code))objectShortcuts++;},true);
  const openMenu=()=>{const tab=w.document.querySelector('[role="tab"]');tab.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:20,clientY:20}));assert.equal(w.document.querySelector('.template-page-menu').hidden,false,'page context menu opens');};
  const shortcut=(key,code,ctrlKey=true,altKey=false)=>{const target=w.document.activeElement,event=new w.KeyboardEvent('keydown',{key,code,ctrlKey,altKey,bubbles:true,cancelable:true});target.dispatchEvent(event);assert.equal(event.defaultPrevented,true,'page hotkey is handled');};
  const menuItem=label=>[...w.document.querySelectorAll('[role="menuitem"]')].find(item=>(item.querySelector('.template-page-command-label')?.textContent||item.textContent.trim()).startsWith(label));
  openMenu();const properties=menuItem('Properties…'),propertiesSvg=properties?.querySelector('svg');
  assert.ok(propertiesSvg,'Properties command has a vector icon');
  assert.equal(propertiesSvg.getAttribute('data-icon'),'page-properties','Properties uses its dedicated SVG glyph');
  assert.equal(propertiesSvg.querySelectorAll('path').length,1,'the sliders use clean continuous rails');
  assert.equal(propertiesSvg.querySelectorAll('circle').length,3,'three adjustment knobs make the property controls recognizable');
  assert.equal(menuItem('Cut')?.querySelector('kbd')?.textContent,'Ctrl+X','Cut advertises the standard cut shortcut');
  assert.equal(menuItem('Cut')?.disabled,true,'Cut stays disabled when it would remove the final page');
  assert.equal(menuItem('Rename')?.querySelector('kbd')?.textContent,'F2','Rename advertises F2');
  assert.equal(properties?.querySelector('kbd')?.textContent,'Alt+Enter','Properties advertises Alt+Enter');
  assert.equal(properties?.getAttribute('aria-keyshortcuts'),'Alt+Enter','Properties exposes its shortcut accessibly');
  openMenu();assert.equal(menuItem('Copy')?.querySelector('kbd')?.textContent,'Ctrl+C');shortcut('c','KeyC');assert.equal(w.editing.template_pages.length,1,'Copy keeps one page');
  openMenu();assert.equal(menuItem('Paste').disabled,false,'Paste becomes available after copying a page');assert.equal(menuItem('Paste')?.querySelector('kbd')?.textContent,'Ctrl+V');shortcut('v','KeyV');assert.equal(w.editing.template_pages.length,2,'Ctrl+V pastes a copy of the page');assert.equal(w.editing.template_pages[1].design.elements[0].text,'Page artwork');
  openMenu();assert.equal(menuItem('Duplicate')?.querySelector('kbd')?.textContent,'Ctrl+D');shortcut('d','KeyD');assert.equal(w.editing.template_pages.length,3,'Ctrl+D duplicates the active page');
  openMenu();assert.equal(menuItem('Add Page')?.querySelector('kbd')?.textContent,'Ctrl+Enter');shortcut('Enter','Enter');assert.equal(w.editing.template_pages.length,4,'Ctrl+Enter adds a blank page');assert.equal(w.editing.template_pages[3].design.elements.length,0);
  openMenu();shortcut('x','KeyX');assert.equal(w.editing.template_pages.length,3,'Ctrl+X cuts the active page when another page remains');
  openMenu();assert.equal(menuItem('Paste').disabled,false,'cut page contents are available to paste');shortcut('v','KeyV');assert.equal(w.editing.template_pages.length,4,'pasting restores the cut page');
  openMenu();shortcut('F2','F2',false);let renameInput=w.document.querySelector('.template-page-rename-input');assert.ok(renameInput,'F2 opens the inline page rename editor');renameInput.value='Renamed by F2';renameInput.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));assert.equal(w.editing.template_pages[w.editing.template_page_active].name,'Renamed by F2','F2 rename commits with Enter');
  let propertiesClicks=0;w.document.getElementById('pageSetupOpen').onclick=()=>propertiesClicks++;w.document.getElementById('tabTemplates').onclick=()=>propertiesClicks++;
  openMenu();shortcut('Enter','Enter',false,true);assert.equal(propertiesClicks,2,'Alt+Enter opens Page Setup and selects its Templates tab');
  openMenu();assert.equal(menuItem('Delete')?.querySelector('kbd')?.textContent,'Delete');shortcut('Delete','Delete',false);assert.equal(w.editing.template_pages.length,3,'Delete removes the active page');assert.equal(objectShortcuts,0,'page hotkeys do not reach the editor object shortcuts');
  dom.window.close();
});


test('template filmstrip renders each saved page as a numbered thumbnail and keeps page selection',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="previewFrame"></div></body>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={width_mm:60,height_mm:40,dpi:203,elements:[{type:'text',text:'FRONT ART'}],values:{},template_pages:[{name:'Front',design:{elements:[{type:'text',text:'FRONT ART'}]}},{name:'Back',design:{elements:[{type:'text',text:'BACK ART'}]}}],template_page_active:0};
  w.editorSel=null;w.editorSelection=new Set();w.qrCache={};w.sampleData=()=>({});w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>{};w.persistEditor=async()=>{};w.pushSnapshot=()=>{};
  w.LabelPreview={renderPreviewSVG:(template)=>'<svg data-thumb-art="'+(template.elements?.[0]?.text||'empty')+'" viewBox="0 0 60 40"><rect width="60" height="40"/></svg>'};
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const tabs=[...w.document.querySelectorAll('.template-page-tabs [role="tab"]')];
  assert.equal(tabs.length,2,'each saved template page gets one thumbnail button');
  assert.equal(tabs[0].querySelector('.template-page-thumbnail svg')?.dataset.thumbArt,'FRONT ART','first preview is rendered from the first page design');
  assert.equal(tabs[1].querySelector('.template-page-thumbnail svg')?.dataset.thumbArt,'BACK ART','second preview is rendered from the second page design');
  assert.deepEqual(tabs.map(tab=>tab.querySelector('.template-page-index')?.textContent),['1','2'],'thumbnails show their page numbers');
  assert.equal(tabs[0].getAttribute('aria-selected'),'true');tabs[1].click();
  assert.equal(w.editing.template_page_active,1,'clicking a thumbnail switches the active design page');
  assert.equal(w.document.querySelectorAll('.template-page-tabs [aria-selected="true"]').length,1);
  dom.window.close();
});

test('template tabs reorder left and right by drag while preserving the active page',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="previewFrame"><div class="preview-pane"></div></div><div id="insertSidebar"></div></body>',{runScripts:'dangerously',url:'http://localhost',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={elements:[{type:'text',text:'A'}],template_pages:[{name:'A',design:{elements:[{type:'text',text:'A'}]}},{name:'B',design:{elements:[{type:'text',text:'B'}]}},{name:'C',design:{elements:[{type:'text',text:'C'}]}}],template_page_active:0};w.editorSel=0;w.editorSelection=new Set();
  let snapshots=0,touches=0,persists=0;w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>touches++;w.persistEditor=async()=>persists++;w.pushSnapshot=()=>snapshots++;
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const tabs=w.document.querySelector('.template-page-tabs');tabs.setPointerCapture=()=>{};tabs.hasPointerCapture=()=>false;
  tabs.getBoundingClientRect=()=>({left:0,right:240,top:0,bottom:30,width:240,height:30});
  const rect=button=>{const index=[...tabs.children].indexOf(button),left=index*60;return {left,right:left+50,top:0,bottom:25,width:50,height:25};};
  const fire=(target,type,x)=>{const event=new w.Event(type,{bubbles:true,cancelable:true});for(const [key,value]of Object.entries({button:0,isPrimary:true,pointerId:7,clientX:x,clientY:10}))Object.defineProperty(event,key,{value});target.dispatchEvent(event);return event;};
  const drag=(fromName,toX)=>{const button=[...tabs.children].find(node=>node.getAttribute('aria-label')===fromName);button.getBoundingClientRect=()=>rect(button);fire(button,'pointerdown',rect(button).left+10);fire(w,'pointermove',toX);fire(w,'pointerup',toX);};
  drag('A',220);assert.deepEqual(w.editing.template_pages.map(page=>page.name),['B','C','A'],'dragging a tab right reorders the page list');assert.equal(w.editing.template_page_active,2,'active page remains the same page after moving right');assert.equal(w.editing.elements[0].text,'A','the active page content remains loaded');
  drag('A',-10);assert.deepEqual(w.editing.template_pages.map(page=>page.name),['A','B','C'],'dragging a tab left reorders the page list');assert.equal(w.editing.template_page_active,0,'active page remains the same page after moving left');assert.equal(snapshots,2,'each completed reorder has one undo snapshot');assert.equal(touches,2,'each reorder marks the document dirty once');assert.equal(persists,2,'each reorder persists once');dom.window.close();
});

test('Rename opens an inline editor for the selected template and commits the entered name',()=>{
  const dom=new JSDOM('<!doctype html><body><div id="previewFrame"><div class="preview-pane"></div></div><div id="insertSidebar"></div></body>',{runScripts:'dangerously',url:'http://localhost',pretendToBeVisual:true}),w=dom.window;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};
  w.editing={elements:[{type:'text',text:'A'}],template_pages:[{name:'Template 1',design:{elements:[{type:'text',text:'A'}]}},{name:'Template 2',design:{elements:[{type:'text',text:'B'}]}}],template_page_active:0};w.editorSel=0;w.editorSelection=new Set();
  let snapshots=0,touches=0;w.readEditorIntoDraft=()=>{};w.refreshEditorUI=()=>{};w.drawEditorCanvas=()=>{};w.touchEditor=()=>touches++;w.persistEditor=async()=>{};w.pushSnapshot=()=>snapshots++;
  w.eval(fs.readFileSync(require.resolve('../gui/template-pages'),'utf8'));
  const tab=w.document.querySelectorAll('[role="tab"]')[1];tab.getBoundingClientRect=()=>({left:60,right:120,top:0,bottom:25,width:60,height:25});
  tab.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:60,clientY:0}));
  const rename=[...w.document.querySelectorAll('[role="menuitem"]')].find(item=>item.querySelector('.template-page-command-label')?.textContent==='Rename');assert.ok(rename,'context menu exposes Rename');rename.click();
  let input=w.document.querySelector('.template-page-rename-input');assert.ok(input,'Rename opens an inline input in the selected tab');assert.equal(input.value,'Template 2','input is initialized with the selected page name');input.value='Discard this';input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(w.editing.template_pages[1].name,'Template 2','Escape cancels rename without changing the page');assert.equal(w.document.querySelector('.template-page-rename-input'),null,'Escape closes the inline editor');
  const selectedTab=w.document.querySelectorAll('[role="tab"]')[1];selectedTab.getBoundingClientRect=()=>({left:60,right:120,top:0,bottom:25,width:60,height:25});selectedTab.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:60,clientY:0}));[...w.document.querySelectorAll('[role="menuitem"]')].find(item=>item.querySelector('.template-page-command-label')?.textContent==='Rename').click();input=w.document.querySelector('.template-page-rename-input');assert.ok(input,'Rename can be reopened after cancel');const snapshotsBeforeRename=snapshots,touchesBeforeRename=touches;
  input.value='Shipping';input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
  assert.equal(w.editing.template_pages[1].name,'Shipping','Enter commits the new page name');assert.equal(w.document.querySelectorAll('[role="tab"]')[1].getAttribute('aria-label'),'Shipping','rendered tab reflects the committed name accessibly');assert.equal(snapshots,snapshotsBeforeRename+1,'rename adds one undo snapshot');assert.equal(touches,touchesBeforeRename+1,'rename marks the document dirty once');
  const renamedTab=w.document.querySelectorAll('[role="tab"]')[1];renamedTab.getBoundingClientRect=()=>({left:60,right:120,top:0,bottom:25,width:60,height:25});renamedTab.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:60,clientY:0}));[...w.document.querySelectorAll('[role="menuitem"]')].find(item=>item.querySelector('.template-page-command-label')?.textContent==='Rename').click();input=w.document.querySelector('.template-page-rename-input');input.value='Manifest';input.dispatchEvent(new w.FocusEvent('blur'));assert.equal(w.editing.template_pages[1].name,'Manifest','leaving the input commits the edited name');dom.window.close();
});

