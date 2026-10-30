'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {PNG}=require('pngjs');
const {renderLabelBody}=require('../lib/zpl');
const PageDesignOptions=require('../gui/page-design-options');
const read=name=>fs.readFileSync(path.join(__dirname,'../gui',name),'utf8');
const base=()=>({name:'Original',width_mm:75,height_mm:53,dpi:203,elements:[{type:'text',x_mm:3,y_mm:4,height_mm:4,text:'ABC →'}],stock:{name:'USER',type:'die-cut',liner_left_mm:1.27,liner_right_mm:1.27},page:{enabled:true,width_mm:75,height_mm:53,rows:1,columns:1,top_mm:0,bottom_mm:0,left_mm:0,right_mm:0,gap_x_mm:0,gap_y_mm:0}});
async function harness(){
  const html=read('index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  const inject=text=>{const script=w.document.createElement('script');script.textContent=text;w.document.head.append(script);};
  w.editing=base();w.settings={unit:'mm',stockLibrary:[],printerProfiles:{'ip:192.0.2.10:9100':{capabilities:{mediaModes:['T','P','C','R']}}}};w.current={file:'original.json'};w.editorSel=null;w.readingForSave=true;w.qrCache={};w.el=id=>w.document.getElementById(id);w.t=key=>key;w.measureUnit=()=>w.settings.unit;w.measureDpi=()=>203;w.unitSuffix=unit=>unit||w.measureUnit();w.unitMeta=unit=>({mm:1,cm:10,in:25.4,mil:.0254,pt:25.4/72,dots:0,decimals:{mm:2,cm:2,in:4,mil:1,pt:1,dots:0}[unit]??2,step:{mm:.1,cm:.01,in:.01,mil:1,pt:.5,dots:1}[unit]??.1});w.unitToMm=(v,u)=>Math.round(Number(v)*(u==='in'?25.4:1)*10000)/10000;w.mmToUnit=(v,u)=>u==='in'?Number((Number(v)/25.4).toFixed(4)):Number(v);w.requestAnimationFrame=callback=>{callback();return 1;};w.connection={type:'ip',ip:'192.0.2.10',port:9100};w.getConnection=()=>w.connection;w.pushSnapshot=()=>{};w.drawEditorCanvas=w.updateEditorPreview=()=>w.document.dispatchEvent(new w.Event('preview-updated'));w.touchEditor=()=>queueMicrotask(w.updateEditorPreview);w.persistEditor=async()=>{w.persisted=JSON.parse(JSON.stringify(w.editing));};w.setEditorStatus=(status,text)=>{w.lastStatus={status,text};};w.debounce=fn=>fn;w.alert=text=>{w.alerted=text;};w.confirm=()=>true;w.prompt=()=>w.promptValue||'Saved stock';w.zebra={getSettings:async()=>w.settings,saveSettings:async patch=>Object.assign(w.settings,JSON.parse(JSON.stringify(patch)))};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:String(text).length*7}),fillRect(){},drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(16)})});w.Image=class{constructor(){this.naturalWidth=2;this.naturalHeight=2;}async decode(){}};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
  inject(read('print-geometry.js'));inject(read('object-data.js'));inject(read('bitmap.js'));inject(read('preview.js'));inject(read('data-source-engine.js'));
  const renderer=read('renderer.js');inject(renderer.slice(renderer.indexOf('function formatSize('),renderer.indexOf('function updateMeasureLabels()')));inject(renderer.slice(renderer.indexOf('function updateMeasureLabels()'),renderer.indexOf('function fillPh(')));inject(renderer.slice(renderer.indexOf('const pageFields ='),renderer.indexOf('function refreshEditorUI()')));inject(renderer.slice(renderer.indexOf('function readEditorIntoDraft()'),renderer.indexOf('let readingForSave')));
  w.refreshEditorUI=()=>{const e=w.editing;w.el('edName').value=e.name;w.el('edW').value=w.mmToUnit(e.width_mm,w.settings.unit);w.el('edH').value=w.mmToUnit(e.height_mm,w.settings.unit);w.el('edDpi').value=e.dpi;w.el('edTear').value=e.tear_off||0;w.el('stockName').value=e.stock?.name||'';w.el('stockType').value=e.stock?.type||'die-cut';w.el('stockLeft').value=e.stock?.liner_left_mm||0;w.el('stockRight').value=e.stock?.liner_right_mm||0;w.el('printBackground').checked=!!e.print_background;w.el('backgroundOpacity').value=(e.background?.opacity??.5)*100;w.refreshPageSetup();};
  inject(read('page-setup-capabilities.js'));inject(read('template-scaling.js'));inject(read('stock-antenna-catalog.js'));inject(read('stock-guides.js'));inject(read('page-setup.js'));inject(read('stock-guides-ui.js'));const workspace=read('workspace-modals.js');inject(workspace.slice(workspace.indexOf('const shapeSection='),workspace.indexOf('workspaceModal("Printers and Templates"')));inject(workspace.slice(workspace.indexOf("shapeSection.insertAdjacentHTML('beforeend','<label for=\"shapeRadius\">"),workspace.indexOf('const groupingStyle=')));
  inject(renderer.slice(renderer.indexOf("  ['edName', 'edDesc'"),renderer.indexOf("  el('copies').addEventListener('input', rememberPrintPageSoon);")));
  inject(renderer.slice(renderer.indexOf("  el('backgroundBtn').onclick"),renderer.indexOf("  document.querySelectorAll('[data-add]')")));
  w.projectHomeData=()=>({templates:[{file:'original.json',name:'Original'},{file:'other.json',name:'Other'}]});w.selectProjectTemplate=async file=>{w.current={file};w.editing={...base(),name:'Other',elements:[{type:'text',x_mm:2,y_mm:2,height_mm:3,text:'Changed template'}]};w.refreshEditorUI();};w.saveEditor=async()=>{w.editing.name='Copy';w.current.file='copy.json';};
  inject(renderer.slice(renderer.indexOf('function designPaperBounds()'),renderer.indexOf('function objectOverflowsPaperShape(')));
  w.renderEditorElements=()=>{};w.refreshEditorUI();inject(read('stock-catalog.js'));inject(read('stock-apply.js'));inject(read('stock-preview.js'));inject(read('modal-preview.js'));inject(read('page-design-options.js'));w.el('pageSetupOpen').click();await tick();
  const set=async(id,value)=>{const input=w.el(id);if(input.type==='checkbox')input.checked=value;else input.value=String(value);input.dispatchEvent(new w.Event(input.type==='checkbox'||input.tagName==='SELECT'?'change':'input',{bubbles:true}));await tick();};
  const tab=async name=>{w.el('tab'+name).click();await tick();};const preview=()=>w.document.querySelector('#pageSetupDialog .modal-paper-preview');
  new w.MutationObserver(()=>{const dialog=w.el('scaleConfirmDialog');if(dialog?.open&&w.autoScalePrompt!==false){const answer=w.confirm(w.el('scaleConfirmDescription').textContent);w.el(answer?'scaleConfirmYes':'scaleConfirmNo').click();}}).observe(w.document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  return {w,set,tab,preview,close:()=>dom.window.close()};
}
async function tick(){await new Promise(resolve=>setTimeout(resolve,8));}
test('inch page dimensions accept their displayed four-decimal precision',async()=>{
  const h=await harness(),w=h.w;w.settings.unit='in';w.editing.unit='in';w.editing.page.enabled=false;w.refreshEditorUI();w.updateMeasureLabels();w.readingForSave=false;
  const width=w.el('edW'),height=w.el('edH');width.value='2.0079';height.value='0.9843';
  assert.equal(width.step,'0.0001','inch dimensions allow the four decimal places displayed by the editor');
  assert.equal(height.step,'0.0001','height uses the same inch precision as width');
  assert.equal(width.checkValidity(),true,'2.0079 in is a valid width');
  assert.equal(height.checkValidity(),true,'0.9843 in is a valid height');
  await h.set('edW',2.0079);await h.set('edH',0.9843);
  assert.equal(w.editing.width_mm,51.0007,'width retains four-decimal inch precision as millimetres');
  assert.equal(w.editing.height_mm,25.0012,'height retains four-decimal inch precision as millimetres');
  h.close();
});
test('changing columns on another page then restoring one column does not enlarge retained artwork',async()=>{
  const h=await harness(),w=h.w;
  w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}};w.editorSelection=new Set();w.cancelAnimationFrame=()=>{};
  const original={type:'barcode128',x_mm:4,y_mm:5,width_mm:55,bar_height_mm:10,module_width:2,text:'12345678'};
  w.editing.elements=[structuredClone(original)];
  w.eval(read('template-pages.js'));
  w.document.querySelector('.template-page-add-control>button').click();
  await h.set('pageCols',2);w.confirm=()=>false;w.el('setupDone').click();await tick();await tick();
  assert.equal(w.editing.width_mm,37.5);
  // A newly authored page uses the two-column cell; the first page's retained
  // artwork still belongs to its original 75 mm template coordinate space.
  w.editing.elements=[{...original,width_mm:20,module_width:1}];
  w.el('pageSetupOpen').click();await h.set('pageCols',1);w.confirm=()=>true;w.el('setupDone').click();await tick();await tick();
  w.el('scaleTemplatesOk').click();await tick();
  assert.equal(w.editing.width_mm,75);
  assert.equal(w.editing.elements[0].width_mm,40,'new artwork scales from its actual authoring size');
  w.document.querySelectorAll('.template-page-tabs>[role=tab]')[0].click();
  assert.deepEqual(JSON.parse(JSON.stringify(w.editing.elements[0])),original,'retained artwork returns at its original size and position');
  h.close();
});
test('Page Setup tabs use an underline instead of a rectangular focus border',async()=>{
  const h=await harness(),css=[...h.w.document.querySelectorAll('style')].map(style=>style.textContent).join('');
  assert.ok(css.includes('#pageSetupDialog nav button:focus{outline:none!important;border:0!important}'));
  assert.ok(css.includes('border-bottom-color:#16a34a')&&css.includes('#pageSetupDialog nav button[aria-selected=true]'),'selected Page Setup tab shows a green underline');
  h.close();
});
test('Page Setup main content scrolls without reserving or drawing a scrollbar gutter',async()=>{
  const h=await harness(),css=[...h.w.document.querySelectorAll('style')].map(style=>style.textContent).join('');
  assert.match(css,/#pageSetupDialog>\.modal-preview-layout>main\{[^}]*overflow:auto[^}]*scrollbar-width:none/,'Page Setup keeps its content scrollable and hides the reserved native scrollbar width');
  assert.match(css,/#pageSetupDialog>\.modal-preview-layout>main::-webkit-scrollbar\{[^}]*display:none/,'Chromium scrollbar painting is suppressed for the Page Setup content pane');
  h.close();
});
test('Page Setup is enlarged by 30 percent while keeping the preview and settings side by side',async()=>{
  const h=await harness(),css=[...h.w.document.querySelectorAll('style')].map(style=>style.textContent).join('');
  assert.match(css,/#pageSetupDialog\[open\]\{[^}]*width:min\(780px,94vw\)[^}]*height:min\(606px,92vh\)/);
  assert.match(css,/#pageSetupDialog>\.modal-preview-layout\{[^}]*grid-template-columns:minmax\(0,1fr\) 210px/);
  assert.ok(css.includes('#pageSetupDialog #setupPage')&&css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Page tab uses a two-column field grid');
  assert.ok(css.includes('setup-page-orient-grid')&&css.includes('grid-template-columns:minmax(0,1fr)'),'Orientation and effects share one compact row');
  h.close();
});
test('page effect printer images keep the surrounding background transparent',()=>{
  for(const state of ['normal','mirror','negative','mirror-negative']){
    const image=PNG.sync.read(fs.readFileSync(path.join(__dirname,'../gui/assets/page-effects',state+'.png'))),corners=[[0,0],[image.width-1,0],[0,image.height-1],[image.width-1,image.height-1]];
    for(const [x,y] of corners)assert.equal(image.data[(y*image.width+x)*4+3],0,state+' background corner is transparent');
    assert.ok(image.data[(Math.floor(image.height/2)*image.width+Math.floor(image.width/2))*4+3]>0,state+' keeps the printer visible');
  }
});
test('Page design options: paper presets, four orientations, separate sides, back rotation work through the UI without the removed wizard',async()=>{
  const h=await harness();await h.tab('Page');
  for(const [value,w,height] of [['50.8,101.6',50.8,101.6],['101.6,101.6',101.6,101.6],['101.6,152.4',101.6,152.4]]){await h.set('setupPaperSize',value);assert.equal(h.w.editing.page.width_mm,w);assert.equal(h.w.editing.page.height_mm,height);}
  const orientationLabels={normal:'Portrait',landscape:'Landscape',inverted:'Portrait 180°','landscape-inverted':'Landscape 180°'};
  for(const mode of ['landscape','landscape-inverted','normal','inverted']){await h.set('setupOrientation',mode);const t=h.w.editing;assert.equal(t.page.width_mm>t.page.height_mm,mode.startsWith('landscape'));assert.match(renderLabelBody(t,{}),mode.includes('inverted')?/\^POI/:/\^PON/);const item=h.w.document.querySelector('.orientation-option[data-value="'+mode+'"]'),svg=item?.querySelector('svg'),rect=svg?.querySelector('rect');assert.equal(item?.textContent.trim(),orientationLabels[mode]);assert.ok(rect,'orientation icon uses a real page-outline SVG');assert.equal(Number(rect.getAttribute('width'))<Number(rect.getAttribute('height')),!mode.startsWith('landscape'),'page icon aspect matches the orientation label');assert.equal(!!svg.querySelector('g[transform="rotate(180 12 12)"]'),mode.includes('inverted'),'180° choices rotate the page content in their icon');assert.equal(h.w.document.querySelector('.orientation-trigger svg').innerHTML,svg.innerHTML,'selected icon matches the selected label');assert.ok([...svg.querySelectorAll('[d]')].every(path=>!path.getAttribute('d').includes('<')),'SVG path data contains valid path syntax');}
  const separateSides=h.w.el('setupSeparateSides');separateSides.click();await tick();assert.equal(separateSides.checked,true,'a real checkbox click toggles the control');assert.equal(h.w.editing.separate_sides,true,'click saves the setting to the working template');assert.equal(h.w.el('setupDesignScope').querySelector('[value="back"]').disabled,false,'enabling separate sides unlocks the back design');
  await h.set('setupDesignScope','back');assert.equal(h.w.editing.elements.length,0);h.w.editing.elements.push({type:'text',text:'BACK',x_mm:2,y_mm:2,height_mm:3});await h.set('setupBackRotate',true);await h.set('setupOrientation','normal');const printBack=PageDesignOptions.forPrint(h.w.editing);assert.match(renderLabelBody(printBack,{}),/\^POI/);assert.match(renderLabelBody(printBack,{}),/BACK/,'print preview data contains the selected back artwork');const backSvg=h.w.LabelPreview.renderPreviewSVG(printBack,{},[0],{});assert.match(backSvg,/BACK/,'rendered print preview SVG contains the back artwork');
  await h.set('setupDesignScope','front');assert.equal(h.w.editing.elements[0].text,'ABC →');await h.set('setupDesignScope','back');assert.equal(h.w.editing.elements[0].text,'BACK');
  separateSides.closest('label').click();await tick();assert.equal(separateSides.checked,false,'clicking the label unchecks the option');assert.equal(h.w.editing.separate_sides,false,'unchecking updates the template');assert.equal(h.w.editing.design_active,'front');assert.equal(h.w.el('setupBackRotate').disabled,true);assert.match([...h.w.document.querySelectorAll('style')].map(style=>style.textContent).join(''),/\.checkbox input\[type=checkbox\]\{accent-color:#16a34a/,'checkbox has a visible green checked state');
  const wizard=h.w.el('setupWizard');assert.ok(wizard,'Page Setup keeps a Wizard entry in the footer');assert.equal(wizard.disabled,true,'Wizard is disabled when Q LABEL has no matching workflow');assert.match(h.w.el(wizard.getAttribute('aria-describedby')).textContent,/not available/i);
  const tray=h.w.el('setupTraySource');assert.ok(tray,'Page tab shows the paper tray/source capability');assert.equal(tray.disabled,true,'tray source is disabled without an output implementation');assert.match(h.w.el(tray.getAttribute('aria-describedby')).textContent,/not currently supported/i);h.close();
});
test('Page template prints one page object plus all label instances and survives design switching and JSON reload',()=>{
  const t=base();Object.assign(t.page,{width_mm:160,height_mm:65,left_mm:4,right_mm:4,top_mm:6,bottom_mm:6,columns:2,gap_x_mm:2});t.page_template_enabled=true;
  PageDesignOptions.switchDesign(t,'page');assert.equal(t.width_mm,160);assert.equal(t.height_mm,65);t.elements.push({type:'text',text:'HEADER',x_mm:1,y_mm:1,height_mm:3});
  const restored=JSON.parse(JSON.stringify(t)),job=PageDesignOptions.forPrint(restored);assert.equal(job.elements.length,3);assert.equal(job.page.enabled,false);assert.equal(job.elements[0].text,'HEADER');assert.deepEqual(job.elements.slice(1).map(e=>e.x_mm),[7,84]);const zpl=renderLabelBody(job,{});assert.equal((zpl.match(/HEADER/g)||[]).length,1);assert.equal((zpl.match(/ABC/g)||[]).length,2);
  PageDesignOptions.switchDesign(restored,'front');assert.equal(restored.width_mm,75);assert.equal(restored.elements[0].text,'ABC →');PageDesignOptions.switchDesign(restored,'page');assert.equal(restored.elements[0].text,'HEADER');
});
test('Page: paper dimensions, orientation, mirror and negative update the blank paper preview and ZPL',async()=>{
  const h=await harness();await h.tab('Page');await h.set('pageW',100);await h.set('pageH',80);assert.equal(h.w.editing.width_mm,100);assert.match(h.preview().textContent,/100.00 × 80.00/);assert.equal(h.preview().querySelector('[data-label-element]'),null,'Page Setup shows no objects inside the paper');assert.equal(h.preview().querySelector('svg svg[viewBox]'),null,'Page Setup does not embed the label artwork SVG');
  await h.set('setupOrientation','inverted');assert.match(h.preview().querySelector('svg > g[clip-path]').getAttribute('transform'),/rotate\(180/);assert.match(renderLabelBody(h.w.editing,{}),/\^POI/);
  const effectImage=h.w.el('setupEffectsImage');assert.equal(effectImage.dataset.effect,'normal');assert.match(effectImage.getAttribute('src'),/\/normal\.png$/);assert.equal(h.w.getComputedStyle(effectImage).backgroundColor,'rgba(0, 0, 0, 0)');
  await h.set('setupMirror',true);assert.match(h.preview().querySelector('svg > g[clip-path]').getAttribute('transform'),/scale\(-1 1\)/);assert.match(renderLabelBody(h.w.editing,{}),/\^PMY/);assert.equal(effectImage.dataset.effect,'mirror');assert.match(effectImage.getAttribute('src'),/\/mirror\.png$/);
  await h.set('setupNegative',true);assert.ok(h.preview().querySelector('feColorMatrix'));assert.match(renderLabelBody(h.w.editing,{}),/\^LRY/);
  assert.equal(effectImage.dataset.effect,'mirror-negative');assert.match(effectImage.getAttribute('src'),/\/mirror-negative\.png$/);
  await h.set('setupMirror',false);assert.equal(effectImage.dataset.effect,'negative');assert.match(effectImage.getAttribute('src'),/\/negative\.png$/);
  await h.set('setupOrientation','normal');await h.set('setupMirror',false);await h.set('setupNegative',false);assert.equal(h.preview().querySelector('svg > g[clip-path]').getAttribute('transform'),'');assert.equal(h.preview().querySelector('feColorMatrix'),null);
  assert.equal(effectImage.dataset.effect,'normal');for(const state of ['normal','mirror','negative','mirror-negative'])assert.ok(fs.existsSync(path.join(__dirname,'../gui/assets/page-effects',state+'.png')));
  await h.set('pageEnabled',false);assert.equal(h.w.editing.page.enabled,false);assert.equal(h.w.el('edW').readOnly,false);h.close();
});
test('Page orientation rotates template objects into the portrait sheet and back without losing their geometry',()=>{
  const template={width_mm:75,height_mm:53,elements:[
    {type:'text',x_mm:5,y_mm:8,width_mm:20,height_mm:6,rotation_deg:0},
    {type:'barcode128',x_mm:40,y_mm:15,width_mm:25,height_mm:12,rotation_deg:15},
    {type:'line',x_mm:4,y_mm:4,width_mm:30,height_mm:0},
  ]};const before=structuredClone(template);
  PageDesignOptions.rotateTemplateLayout(template,true);
  assert.equal(template.width_mm,53);assert.equal(template.height_mm,75);
  assert.deepEqual(template.elements.map(e=>e.rotation_deg),[90,105,undefined]);
  const barcode=template.elements[1],angle=barcode.rotation_deg*Math.PI/180;
  const visibleW=Math.abs(barcode.width_mm*Math.cos(angle))+Math.abs(barcode.height_mm*Math.sin(angle));
  const visibleH=Math.abs(barcode.width_mm*Math.sin(angle))+Math.abs(barcode.height_mm*Math.cos(angle));
  assert.ok(barcode.x_mm>=0&&barcode.y_mm>=0&&barcode.x_mm+visibleW<=template.width_mm+.001&&barcode.y_mm+visibleH<=template.height_mm+.001);
  PageDesignOptions.rotateTemplateLayout(template,false);
  assert.equal(template.width_mm,before.width_mm);assert.equal(template.height_mm,before.height_mm);
  for(let i=0;i<2;i++)for(const key of ['x_mm','y_mm','width_mm','height_mm','rotation_deg'])assert.ok(Math.abs((template.elements[i][key]||0)-(before.elements[i][key]||0))<.001);
  assert.deepEqual(template.elements[2],before.elements[2]);
});
test('Layout: every margin, row, column, gap, preset and fit changes calculated template geometry',async()=>{
  const h=await harness();await h.tab('Layout');await h.set('pageW',120);await h.set('pageH',90);await h.set('pageRows',2);await h.set('pageCols',3);
  for(const id of ['pageTop','pageBottom','pageLeft','pageRight'])await h.set(id,3);await h.set('pageGapX',2);await h.set('pageGapY',4);assert.equal(h.w.editing.width_mm,110/3);assert.equal(h.w.editing.height_mm,40);assert.equal(h.preview().querySelectorAll('[data-preview-cell]').length,6);assert.equal(h.preview().querySelectorAll('.margin-dimension-label').length,0);
  h.w.el('pageFit').click();await tick();assert.equal(h.w.editing.height_mm,40);h.w.el('pagePreset').click();await tick();assert.equal(h.w.editing.page.width_mm,63.5);assert.equal(h.preview().querySelectorAll('[data-preview-cell]').length,1);
  const old=h.w.editing.page.top_mm;await h.set('pageTop',1000);assert.equal(h.w.editing.page.top_mm,old);assert.match(h.w.lastStatus.text,/no printable/);h.close();
});

test('Layout enables multi-column paper layout and exposes applicable gap controls immediately',async()=>{
  const h=await harness();await h.set('pageEnabled',false);await h.tab('Layout');
  assert.equal(h.w.el('pageGapXField').hidden,false,'horizontal gap stays discoverable');
  assert.equal(h.w.el('pageGapX').disabled,true,'one column has no horizontal gap');
  await h.set('pageCols',2);
  assert.equal(h.w.editing.page.enabled,true,'choosing multiple columns enables the paper layout');
  assert.equal(h.w.el('pageGapX').disabled,false,'horizontal gap becomes editable immediately');
  assert.equal(h.w.el('pageGapY').disabled,true,'vertical gap remains unavailable with one row');
  await h.set('pageGapX',3);assert.equal(h.w.editing.page.gap_x_mm,3);
  assert.equal(h.preview().querySelectorAll('[data-preview-cell]').length,2);
  await h.set('pageRows',2);assert.equal(h.w.el('pageGapY').disabled,false);
  await h.set('pageCols',1);assert.equal(h.w.el('pageGapX').disabled,true);
  assert.equal(h.w.el('pageGapY').disabled,false);h.close();
});

test('all Page Setup tabs show solid label edges independently of Print borders',async()=>{
  const h=await harness(),w=h.w,target=h.preview();
  const tabs=['Stock','Page','Layout','Shape','Media Handling','Printing Order','Templates','Background'];
  const template={width_mm:50.8,height_mm:50.8,dpi:203,elements:[],corner_radius_mm:4.4,border_width_mm:2,stock:{printer_type:'Roll',type:'die-cut'},page:{enabled:true,width_mm:101.6,height_mm:101.6,rows:2,columns:2,gap_x_mm:0,gap_y_mm:0}};
  for(const shape of ['rectangle','rounded','ellipse','circle'])for(const printed of [false,true]){
    template.label_shape=shape;template.print_border=printed;
    const original=JSON.stringify(template);
    for(const tab of tabs){
      w.PaperPreview.render(target,template,'mm',false,false,tab);
      const faces=[...target.querySelectorAll('[data-preview-cell]')];
      assert.equal(faces.length,4,tab+' has four label faces');
      for(const face of faces){
        assert.equal(face.getAttribute('stroke'),'#222',tab+' uses the same visible dark edge as Layout');
        assert.equal(face.getAttribute('data-label-shape'),shape,tab+' preserves '+shape);
        assert.equal(face.getAttribute('stroke-width'),'.8',tab+' uses the same edge width as Layout');
        assert.equal(face.hasAttribute('stroke-dasharray'),false,tab+' edge is solid');
        assert.equal(face.closest('g[clip-path]'),target.querySelector('svg > g[clip-path]'),tab+' face edge is outside the per-cell content clip');
      }
      const printedEdges=[...target.querySelectorAll('[data-label-shape]:not([data-preview-cell])')];
      assert.equal(printedEdges.length,printed&&tab!=='Layout'?4:0,tab+' shows only enabled printed borders in addition to the face edge');
      for(const edge of printedEdges){assert.equal(edge.getAttribute('stroke'),'#111');assert.equal(edge.hasAttribute('stroke-dasharray'),false);assert.ok(Number(edge.getAttribute('stroke-width'))>.8,'the configured printed border width is visible');}
    }
    assert.equal(JSON.stringify(template),original,'preview does not change saved print settings');
    if(!printed)assert.equal(w.LabelPreview.renderShapeOutline(template,0,0,50.8,50.8,false),'','preview edges do not enable a printed border');
  }
  h.close();
});

test('Page Setup roll preview repeats neighbouring labels per column and preserves real gaps',async()=>{
  const h=await harness(),w=h.w;
  Object.assign(w.editing,{width_mm:50.8,height_mm:50.8,label_shape:'rounded',corner_radius_mm:6.35});
  Object.assign(w.editing.page,{width_mm:104.14,height_mm:101.6,rows:2,columns:2,left_mm:1.27,right_mm:1.27,top_mm:0,bottom_mm:0,gap_x_mm:0,gap_y_mm:0});
  w.refreshEditorUI();await h.tab('Page');
  w.el('tabLayout').addEventListener('click',event=>event.stopPropagation());await h.tab('Layout');
  assert.equal(h.preview().querySelectorAll('[data-layout-cell]').length,4,'switching tabs refreshes geometry even when a tab handler consumes its click');
  w.el('tabLayout').insertAdjacentHTML('beforeend','<svg><title>Layout icon</title></svg>');w.document.dispatchEvent(new w.Event('preview-updated'));
  const check=(gx,gy)=>{
    const cells=[...h.preview().querySelectorAll('[data-layout-cell] [data-preview-cell]')];assert.equal(cells.length,4);
    const n=(cell,key)=>Number(cell.getAttribute(key)),scale=n(cells[0],'width')/((104.14-2.54-gx)/2);
    assert.ok(n(cells[0],'rx')>0,'configured rounded corners are visible on every cell');
    assert.ok(Math.abs(n(cells[1],'x')-n(cells[0],'x')-n(cells[0],'width')-gx*scale)<.001,'horizontal separation is the configured physical gap');
    assert.ok(Math.abs(n(cells[2],'y')-n(cells[0],'y')-n(cells[0],'height')-gy*scale)<.001,'vertical separation is the configured physical gap');
    assert.equal(h.preview().querySelectorAll('[data-paper-sliver="top"]').length,2,'previous row has one sliver per column');
    assert.equal(h.preview().querySelectorAll('[data-paper-sliver="bottom"]').length,2,'next row has one sliver per column');
    const top=h.preview().querySelector('[data-paper-sliver="top"]');
    assert.equal(top.getAttribute('rx'),cells[0].getAttribute('rx'),'the clipped neighbouring face keeps the configured radius');
    assert.ok(Math.abs(Number(top.dataset.seamY)-(n(cells[0],'y')-3))<.001,'neighbouring paper keeps visible clearance even with zero physical row gap');
      const svg=h.preview().querySelector('svg'),backing=svg.querySelector(':scope > rect:nth-of-type(2)'),topExtent=svg.querySelector('clipPath[id$="capTop"] rect'),bottomExtent=svg.querySelector('clipPath[id$="capBottom"] rect');
      assert.ok(Number(backing.getAttribute('y'))<=Number(topExtent.getAttribute('y')),'white roll backing extends above the previous label fragment');
      assert.ok(Number(backing.getAttribute('y'))+Number(backing.getAttribute('height'))>=Number(bottomExtent.getAttribute('y'))+Number(bottomExtent.getAttribute('height')),'white roll backing extends below the next label fragment');
      assert.equal(backing.getAttribute('fill'),'#d0d0d0','roll backing matches the light grey stock in the reference');
      assert.ok([...svg.querySelectorAll('[data-preview-cell]')].every(label=>label.getAttribute('fill')==='white'),'individual labels remain white against the grey backing');
      assert.equal(backing.getAttribute('stroke'),'none','roll has label outlines and liner edges instead of a square sheet border');
    assert.equal(h.preview().querySelectorAll('[data-paper-liner]').length,2);
  };
  check(0,0);await h.set('pageGapX',3);await h.set('pageGapY',2);check(3,2);
  await h.set('shapeType','ellipse');await h.tab('Layout');assert.equal(h.preview().querySelector('[data-preview-cell]').localName,'ellipse');assert.equal(h.preview().querySelector('[data-paper-sliver]').localName,'ellipse','elliptical continuation uses the actual ellipse rather than rounded rectangles');
  w.editing.stock.printer_type='Sheet';w.document.dispatchEvent(new w.Event('preview-updated'));assert.equal(h.preview().querySelectorAll('[data-paper-sliver]').length,0,'explicit sheet media has no roll continuation');
  const tall={width_mm:25,height_mm:40,dpi:203,label_shape:'rounded',corner_radius_mm:2,stock:{printer_type:'Roll'},page:{enabled:true,width_mm:25,height_mm:100,rows:2,columns:1,gap_y_mm:20}};
  w.PaperPreview.render(h.preview(),tall,'mm',false,false,'Layout');
  const liner=h.preview().querySelector('[data-paper-liner="left"]');assert.ok(Number(liner.getAttribute('y1'))>=0,'large real gaps and previous-row sliver fit inside the preview');assert.ok(Number(liner.getAttribute('y2'))<=340,'large real gaps and next-row sliver fit inside the preview');
  h.close();
});

test('bottom roll continuation keeps both upper rounded corners visible before its edge fades',async()=>{
  const h=await harness(),w=h.w;await h.tab('Shape');
  for(const columns of [1,2])for(const radius of [3.175,12.7])for(const section of ['Page','Layout']){
    const template={...base(),width_mm:101.6/columns,height_mm:101.6,label_shape:'rounded',corner_radius_mm:radius,page:{enabled:true,width_mm:101.6,height_mm:101.6,rows:1,columns,top_mm:0,bottom_mm:0,left_mm:0,right_mm:0,gap_x_mm:0,gap_y_mm:0}};
    w.PaperPreview.render(h.preview(),template,'in',false,false,section);
    const svg=h.preview().querySelector('svg'),fragments=[...svg.querySelectorAll('[data-paper-sliver="bottom"]')];
    assert.equal(fragments.length,columns);
    for(const fragment of fragments){
      const id=fragment.getAttribute('stroke').match(/^url\(#(.+)\)$/)?.[1];
      const gradient=id&&svg.querySelector('#'+id),clip=svg.querySelector('clipPath[id$="capBottom"] rect');
      assert.ok(clip,'bottom outline has a visible clipping region');
      if(fragment.getAttribute('stroke')==='#1a1a1a')continue;
      assert.ok(gradient,'fading bottom outline has a gradient');
      const visibleHeight=Number(clip.getAttribute('height'))-.5,corner=Number(fragment.getAttribute('rx'));
      const solidUntil=Math.max(...[...gradient.querySelectorAll('stop')].filter(stop=>stop.getAttribute('stop-opacity')!=='0').map(stop=>Number(stop.getAttribute('offset')||0)));
      assert.ok(solidUntil+1e-6>=Math.min(1,corner/visibleHeight),`${section}: both top corner arcs remain dark through the visible curve`);
    }
  }
  h.close();
});

test('Page Setup keeps outer paper fragments clear without changing label layout or print geometry',async()=>{
  const h=await harness(),w=h.w;await h.tab('Shape');
  for(const count of [1,2]){
    const template={...base(),width_mm:99.06/count,height_mm:101.6/count,label_shape:'rounded',corner_radius_mm:3.175,page:{enabled:true,width_mm:101.6,height_mm:101.6,rows:count,columns:count,top_mm:0,bottom_mm:0,left_mm:1.27,right_mm:1.27,gap_x_mm:0,gap_y_mm:0}};
    const before=JSON.stringify(template),printed=renderLabelBody(template,{});
    for(const section of ['Stock','Page','Layout','Printed Item Shape','Media Handling','Printing Order','Templates','Background']){
      w.PaperPreview.render(h.preview(),template,'in',false,false,section);
      const cells=[...h.preview().querySelectorAll('[data-preview-cell]')],first=cells[0],last=cells.at(-1),top=h.preview().querySelector('[data-paper-sliver="top"]'),bottom=h.preview().querySelector('[data-paper-sliver="bottom"]');
      const n=(el,key)=>Number(el.getAttribute(key));
      assert.equal(cells.length,count*count,section+' keeps all main labels');
      assert.ok(n(first,'y')-Number(top.dataset.seamY)>=2.99,section+' has visible top clearance');
      assert.ok(Number(bottom.dataset.seamY)-n(last,'y')-n(last,'height')>=2.99,section+' has visible bottom clearance');
      if(count===2){assert.ok(Math.abs(n(cells[2],'y')-n(first,'y')-n(first,'height'))<.001,'internal zero row gap stays zero');assert.ok(Math.abs(n(cells[1],'x')-n(first,'x')-n(first,'width'))<.001,'internal zero column gap stays zero');}
    }
    assert.equal(JSON.stringify(template),before);assert.equal(renderLabelBody(template,{}),printed);
  }
  h.close();
});

test('Layout focus displays exactly one of eight measurements with dashed references and visible zero arrows',async()=>{
  const h=await harness(),w=h.w;await h.tab('Layout');await h.set('pageCols',2);await h.set('pageRows',2);await h.set('pageTemplateManual',true);await h.set('pageGapManual',true);
  for(const id of ['pageTop','pageLeft','pageBottom','pageRight','edW','edH','pageGapX','pageGapY']){
    const before=JSON.stringify(w.editing);w.el(id).focus();await tick();
    const groups=h.preview().querySelectorAll('[data-layout-dimension]');assert.equal(groups.length,1,id+' has exactly one focused guide');
    const group=groups[0];assert.equal(group.dataset.layoutDimension,id);assert.equal(group.querySelectorAll('[data-dimension-extension]').length,2,id+' has two reference lines');
    for(const line of group.querySelectorAll('[data-dimension-extension]'))assert.equal(line.getAttribute('stroke-dasharray'),'2 2');
    const span=group.querySelector('[data-measure-span]');assert.ok(span,id+' has a measurable span');
    if(['pageTop','pageBottom','pageLeft','pageRight','pageGapX','pageGapY'].includes(id)){assert.equal(group.querySelectorAll('[data-external-arrow]').length,2,id+' zero distance stays visibly marked');}
    assert.equal(JSON.stringify(w.editing),before,'focus alone does not commit or alter the document');
  }
  w.el('pageGapY').blur();await tick();assert.equal(h.preview().querySelector('[data-layout-dimension]'),null,'blur clears the guide');
  w.el('pageRows').focus();await tick();assert.equal(h.preview().querySelector('[data-layout-dimension]'),null,'unmapped controls do not retain an old guide');h.close();
});

test('Layout measurement endpoints follow actual margins, item dimensions and physical gaps',async()=>{
  const h=await harness(),w=h.w;await h.tab('Layout');await h.set('pageCols',2);await h.set('pageRows',2);
  for(const id of ['pageTop','pageBottom','pageLeft','pageRight'])await h.set(id,3);
  await h.set('pageGapX',7);await h.set('pageGapY',6);await h.set('pageTemplateManual',true);await h.set('pageGapManual',true);
  const cells=[...h.preview().querySelectorAll('[data-layout-cell] [data-preview-cell]')],n=(el,key)=>Number(el.getAttribute(key)),first=cells[0],last=cells.at(-1),scale=n(first,'width')/((75-6-7)/2),left=n(first,'x'),top=n(first,'y'),right=n(last,'x')+n(last,'width'),bottom=n(last,'y')+n(last,'height');
  const expected={pageTop:['y',top-3*scale,top],pageBottom:['y',bottom,bottom+3*scale],pageLeft:['x',left-3*scale,left],pageRight:['x',right,right+3*scale],edW:['x',left,left+w.editing.width_mm*scale],edH:['y',top,top+w.editing.height_mm*scale],pageGapX:['x',left+n(first,'width'),n(cells[1],'x')],pageGapY:['y',top+n(first,'height'),n(cells[2],'y')]};
  for(const [id,[axis,a,b]] of Object.entries(expected)){w.el(id).focus();await tick();const span=h.preview().querySelector('[data-measure-span]');assert.ok(span,id);assert.ok(Math.abs(n(span,axis+'1')-a)<.001,id+' starts at correct edge');assert.ok(Math.abs(n(span,axis+'2')-b)<.001,id+' ends at correct edge');}
  w.el('pageTop').focus();await h.set('pageTop',5);assert.equal(h.preview().querySelector('[data-layout-dimension]').dataset.layoutDimension,'pageTop');const span=h.preview().querySelector('[data-measure-span]');assert.ok(n(span,'y2')>n(span,'y1'),'editing updates the live span');
  await h.tab('Page');assert.equal(h.preview().querySelector('[data-layout-dimension]'),null,'other tabs clear Layout measurements');h.close();
});

test('Layout horizontal focus guides stay inside the viewport for tall sheet stock',async()=>{
  const h=await harness(),w=h.w;w.editing={...base(),width_mm:25,height_mm:100,label_shape:'rounded',stock:{printer_type:'Sheet'},page:{enabled:true,width_mm:50,height_mm:200,rows:2,columns:2,left_mm:0,right_mm:0,top_mm:0,bottom_mm:0,gap_x_mm:0,gap_y_mm:0,manual_template:true,manual_gap:true}};w.refreshEditorUI();await h.tab('Layout');
  for(const id of ['pageLeft','pageRight','edW','pageGapX']){w.el(id).focus();await tick();const group=h.preview().querySelector('[data-layout-dimension]');assert.equal(group?.dataset.layoutDimension,id);for(const line of group.querySelectorAll('line'))for(const axis of ['x1','x2','y1','y2']){const value=Number(line.getAttribute(axis)),limit=axis.startsWith('x')?250:340;assert.ok(value>=0&&value<=limit,id+' '+axis+' stays in the SVG viewport: '+value);}const y=Number(group.querySelector('[data-measure-span]').getAttribute('y1'));assert.ok(y>=3,'arrowheads also fit above the dimension line');}
  h.close();
});

test('Layout shares the live paper preview and respects manual template dimensions',async()=>{
  const h=await harness();h.w.editing.elements.push({type:'ellipse',label:'Circle',x_mm:20,y_mm:6,width_mm:10,height_mm:8},{type:'box',label:'Rectangle',x_mm:35,y_mm:6,width_mm:12,height_mm:8});await h.w.updateEditorPreview();await tick();await h.tab('Layout');
  assert.equal(h.w.document.querySelector('.setup-layout-preview'),null,'Layout uses the same preview as the other tabs');
  await h.set('pageCols',2);await h.set('pageTemplateManual',true);
  await h.set('edW',20);await h.set('edH',15);
  const layoutCells=[...h.preview().querySelectorAll('[data-layout-cell]')];
  assert.equal(layoutCells.length,2,'Layout shows one blank cell for each selected column');
  assert.equal(h.preview().querySelectorAll('[data-preview-cell]').length,2);
  assert.equal(h.preview().textContent.includes('ABC →'),false,'Layout preview does not render the label artwork');
  const layoutRects=layoutCells.map(cell=>cell.querySelector('[data-preview-cell]'));
  assert.ok(Number(layoutRects[1].getAttribute('x'))>Number(layoutRects[0].getAttribute('x')),'the second column has a distinct position');
  assert.ok(Math.abs(Number(layoutRects[0].getAttribute('width'))-Number(layoutRects[1].getAttribute('width')))<.00001,'column slots divide the printable paper evenly even when template size is manual');
  assert.equal(h.preview().querySelector('[data-label-element]'),null,'Layout never renders objects from the saved template');
  assert.equal(h.preview().textContent.includes('ABC →'),false);
  await h.tab('Page');const pageCell=h.preview().querySelector('[data-preview-cell]');
  assert.ok(Math.abs(Number(pageCell.getAttribute('width'))/Number(pageCell.getAttribute('height'))-20/15)<.00001,'the Page tab preserves the manually configured template dimensions');
  assert.equal(h.preview().querySelector('[data-label-element]'),null,'Page Setup preview does not display template objects');
  assert.equal(h.preview().textContent.includes('ABC →'),false);
  const workspacePreview=h.w.document.createElement('div');
  h.w.PaperPreview.render(workspacePreview,h.w.editing,'mm',true,false,'Page');
  assert.equal(workspacePreview.querySelectorAll('[data-label-element]').length,6,'the editor design preview still renders all three objects on both labels');
  for(const section of ['Stock','Shape','Media Handling','Printing Order','Templates','Background']){
    await h.tab(section);
    assert.equal(h.preview().querySelector('[data-label-element]'),null,section+' Page Setup preview hides all user objects');
    assert.equal(h.preview().textContent.includes('ABC →'),false,section+' Page Setup preview hides text');
  }
  h.close();
});

test('paper preview shows only template size, hides margin measurements, and matches label shape',async()=>{
  const h=await harness(),w=h.w,target=w.document.createElement('aside');
  w.eval(read('modal-preview.js'));
  const template={...base(),label_shape:'rounded',corner_radius_mm:4,page:{...base().page,left_mm:1.89,right_mm:1.89}};
  w.PaperPreview.render(target,template,'mm',false,false,'Layout');
  assert.equal(target.querySelector('small').textContent,'Template Size: 71.22 × 53.00 mm');
  assert.equal(target.querySelector('.paper-preview-state'),null);
  assert.equal(target.querySelectorAll('.margin-dimension-label').length,0);
  const rounded=target.querySelector('[data-preview-cell]');
  assert.ok(Number(rounded.getAttribute('rx'))>0,'rounded labels use the configured corner radius');
  template.label_shape='ellipse';
  w.PaperPreview.render(target,template,'mm',false,false,'Layout');
  assert.ok(target.querySelector('[data-preview-cell][data-label-shape="ellipse"]')?.localName==='ellipse','elliptical labels remain elliptical');
  for(const section of ['Page','Stock','Shape','Media Handling','Printing Order','Templates','Background']){
    w.PaperPreview.render(target,template,'mm',false,false,section);
    assert.equal(target.querySelectorAll('small').length,1,section+' preview has one concise caption');
    assert.match(target.querySelector('small').textContent,/^Template Size:/,section+' preview reports template size only');
  }
  w.PaperPreview.render(target,template,'mm',true,true,'Layout');
  assert.equal(target.querySelectorAll('small').length,1,'workspace preview does not append settings text');
  h.close();
});

test('Layout column selection survives an unusable saved gap and re-enables the gap field',async()=>{
  const h=await harness();h.w.editing.page.gap_x_mm=76.2;h.w.refreshEditorUI();await h.tab('Layout');
  assert.equal(h.w.el('pageGapX').disabled,true,'horizontal gap is unavailable with one column');
  await h.set('pageCols',2);
  assert.equal(h.w.editing.page.columns,2,'column count commits even if the saved gap does not fit the paper');
  assert.equal(h.w.el('pageGapX').disabled,false,'the gap can be edited as soon as there are two columns');
  assert.equal(h.w.editing.page.gap_x_mm,0,'an unusable saved gap is omitted from the committed layout');
  assert.equal(h.w.el('pageGapX').value,'76.2','the invalid gap draft remains available for correction');
  assert.equal(h.preview().querySelectorAll('[data-layout-cell]').length,2,'the preview follows the committed column count');
  await h.set('pageGapX',3);
  assert.equal(h.w.editing.page.gap_x_mm,3,'a valid replacement gap is committed');
  const cells=[...h.preview().querySelectorAll('[data-layout-cell] [data-preview-cell]')];
  assert.equal(cells.length,2);
  assert.ok(Number(cells[1].getAttribute('x'))>Number(cells[0].getAttribute('x'))+Number(cells[0].getAttribute('width')),'the valid gap appears between the blank columns');
  h.close();
});

test('OK recovers an unusable gap draft and saves the selected column count',async()=>{
  const h=await harness();await h.tab('Layout');await h.set('pageCols',2);await h.set('pageGapX',76.2);
  assert.equal(h.w.editing.page.columns,2);assert.equal(h.w.editing.page.gap_x_mm,0,'the committed layout retains its safe gap');h.w.confirm=()=>false;
  assert.equal(h.w.el('pageGapX').value,'76.2','the invalid gap stays visible until the user confirms');
  h.w.el('setupDone').click();await tick();
  assert.equal(h.w.el('pageSetupDialog').open,false,'OK closes the dialog after recovering the invalid gap draft');
  assert.equal(h.w.persisted.page.columns,2,'the selected column count is saved');
  assert.equal(h.w.persisted.page.gap_x_mm,0,'the persisted geometry uses the safe committed gap');
  h.close();
});

test('automatic template restores editable gap from saved automatic-gap state',async()=>{
  const h=await harness();Object.assign(h.w.editing.page,{columns:2,manual_template:false,manual_gap:false,gap_x_mm:2});h.w.refreshEditorUI();await h.tab('Layout');
  assert.equal(h.w.el('pageGapX').disabled,false);assert.equal(h.w.el('pageGapY').disabled,true);assert.equal(h.w.el('pageGapManual').checked,true);
  const toggle=h.w.el('pageGapManual').closest('label');assert.ok(toggle.compareDocumentPosition(h.w.el('pageGapXField'))&h.w.Node.DOCUMENT_POSITION_FOLLOWING);
  await h.set('pageGapX',5);assert.equal(h.w.editing.page.gap_x_mm,5);assert.equal(h.w.editing.page.manual_gap,true);assert.equal(h.w.editing.width_mm,35);
  assert.equal(h.preview().querySelectorAll('[data-layout-cell]').length,2);h.close();
});

test('Layout automatic gap and focus dimensions use the same committed geometry',async()=>{
  const h=await harness();await h.tab('Layout');await h.set('pageCols',2);await h.set('pageTemplateManual',true);await h.set('edW',25);await h.set('pageGapManual',false);
  assert.equal(h.w.editing.page.gap_x_mm,25,'automatic gap fills the remaining paper width');
  assert.equal(h.w.el('pageGapX').disabled,true,'automatic gap is read only');
  await h.set('pageGapManual',true);h.w.el('pageGapX').focus();await tick();
  assert.ok(h.preview().querySelector('[data-layout-dimension="pageGapX"]'),'focusing horizontal gap displays its dimension in the shared preview');
  const before=h.preview().querySelector('[data-preview-cell]').getAttribute('width');
  await h.set('pageGapX',1000);assert.equal(h.w.editing.page.gap_x_mm,25,'invalid gap does not replace the committed geometry');
  assert.equal(h.w.el('pageGapY').disabled,true,'invalid horizontal gap cannot enable the unavailable vertical gap');
  assert.equal(h.preview().querySelector('[data-preview-cell]').getAttribute('width'),before,'invalid input does not draw negative label dimensions');h.close();
});
test('Printing Order: both directions and all four corners number every cell in the same order as printing',async()=>{
  const h=await harness();await h.set('pageRows',2);await h.set('pageCols',3);await h.tab('Printing Order');
  for(const order of ['rows','columns'])for(const corner of ['top-left','top-right','bottom-left','bottom-right']){await h.set('setupOrder',order);await h.set('orderCorner',corner);const numbers=[...h.preview().querySelectorAll('[data-print-order]')].map(n=>Number(n.dataset.printOrder));const expected=[];for(let r=0;r<2;r++)for(let c=0;c<3;c++){const rr=corner.startsWith('bottom')?1-r:r,cc=corner.endsWith('right')?2-c:c;expected.push(order==='columns'?cc*2+rr+1:rr*3+cc+1);}assert.deepEqual(numbers,expected);assert.equal(h.w.editing.print_corner,corner);const positions=[...renderLabelBody(h.w.editing,{}).matchAll(/\^FT(-?\d+),(-?\d+)/g)].map(match=>[Number(match[1]),Number(match[2])]);const xs=[...new Set(positions.map(p=>p[0]))].sort((a,b)=>a-b),ys=[...new Set(positions.map(p=>p[1]))].sort((a,b)=>a-b);assert.deepEqual(positions.map(([x,y])=>ys.indexOf(y)*3+xs.indexOf(x)),numbers.map((number,index)=>({number,index})).sort((a,b)=>a.number-b.number).map(item=>item.index),'preview order agrees with actual ZPL field positions');}
  h.close();
});
test('Page units and invalid input: inches convert to millimetres and invalid tear-off cannot be saved',async()=>{
  const h=await harness();h.w.settings.unit='in';h.w.refreshEditorUI();await h.tab('Page');await h.set('pageW',4);await h.set('pageH',3);assert.equal(h.w.editing.page.width_mm,101.6);assert.match(h.preview().textContent,/4 × 3 in/);assert.doesNotMatch(h.preview().textContent,/4\.000|3\.000/);await h.tab('Media Handling');await h.set('edTear',121);h.w.el('setupDone').click();await tick();assert.equal(h.w.el('pageSetupDialog').open,true);assert.equal(h.w.persisted,undefined);h.close();
});

test('manual horizontal and vertical gaps display one decimal and step by 0.1 display units',async()=>{
  const h=await harness();h.w.settings.unit='in';h.w.editing.page.columns=2;h.w.editing.page.rows=2;h.w.refreshEditorUI();await h.tab('Layout');
  for(const id of ['pageGapX','pageGapY']){assert.equal(h.w.el(id).value,'0.0');assert.equal(h.w.el(id).step,'0.1');}
  await h.set('pageGapX',0.1);assert.equal(h.w.editing.page.gap_x_mm,2.54);assert.equal(h.w.el('pageGapX').value,'0.1');
  await h.set('pageGapY',0.1);assert.equal(h.w.editing.page.gap_y_mm,2.54);assert.equal(h.w.el('pageGapY').value,'0.1');h.close();
});

test('inch size captions remove zero decimals while preserving meaningful fractions',async()=>{
  const h=await harness();
  assert.equal(h.w.formatSize(101.6,101.6,'in',203),'4 × 4 in');
  assert.equal(h.w.formatSize(88.9,57.15,'in',203),'3.5 × 2.25 in');
  h.close();
});
test('Media Handling: all modes and tear offsets update status preview and printer commands',async()=>{
  const h=await harness();await h.tab('Media Handling');for(const mode of ['T','P','C','R']){await h.set('setupPrintMode',mode);assert.ok(h.preview().querySelector('[data-media-mode]'));assert.match(renderLabelBody(h.w.editing,{}),new RegExp('\\^MM'+mode));}
  for(const offset of [-120,0,120]){await h.set('edTear',offset);assert.equal(h.preview().querySelector('[data-tear-offset]').getAttribute('data-tear-offset'),String(offset));assert.match(renderLabelBody(h.w.editing,{}),new RegExp('~TA'+offset));}h.close();
});
test('Stock: every label type, liner edge and predefined stock updates preview and media detection',async()=>{
  const h=await harness();await h.tab('Stock');for(const [type,command]of [['die-cut','Y'],['continuous','N'],['black-mark','M']]){await h.set('stockType',type);assert.equal(h.preview().querySelector('[data-stock-type]').getAttribute('data-stock-type'),type);if(type==='die-cut'){const gap=h.preview().querySelector('[data-die-cut="true"]');assert.ok(gap,'die-cut preview includes a visible cut guide around each label');assert.equal(gap.getAttribute('stroke'),'#07883f');assert.equal(h.preview().querySelectorAll('[data-die-cut="true"]').length,1);assert.ok(h.preview().querySelector('[data-gap-dimension][marker-start]'));assert.equal(h.preview().querySelector('[data-gap-label]')?.textContent,'Gap');}assert.match(renderLabelBody(h.w.editing,{}),new RegExp('\\^MN'+command));}
  await h.set('stockName','Custom name');assert.equal(h.w.el('stockName').value,'Custom name');assert.equal(h.preview().querySelectorAll('small').length,1);await h.set('stockLeft',4);await h.set('stockRight',6);assert.ok(Number(h.preview().querySelector('[data-liner=right]').getAttribute('width'))>Number(h.preview().querySelector('[data-liner=left]').getAttribute('width')));
  await h.set('stockCategory','standard');assert.match(h.w.el('stockList').options[1].title,/51\.00 × 25\.00 mm/,'stock dimensions use readable fixed precision');for(let i=1;i<5;i++){await h.set('stockList',i);assert.equal(h.w.editing.width_mm,[0,51,63.5,102,102][i]);assert.equal(h.w.el('stockList').value,String(i));}
  await h.set('stockCategory','bartender');const catalogStock=h.w.QLabelStockCatalog.getStock('ADES AG','49908');const catalogIndex=h.w.el('stockList')._items.findIndex(item=>item.name==='49908');await h.set('stockList',Math.max(0,catalogIndex));assert.equal(h.w.editing.page.width_mm,catalogStock.paper_width_mm);assert.equal(h.w.editing.page.height_mm,catalogStock.paper_height_mm);assert.ok(h.preview().querySelector('[data-paper-continuation][data-paper-style="bartender-roll"]'),'catalog roll uses the shared stock illustration');assert.equal(h.preview().querySelectorAll('[data-paper-sliver]').length,2*catalogStock.columns,'catalog continuation preserves the selected column count');assert.ok(h.preview().querySelector('clipPath'),'label clipping remains present');
  h.w.el('stockSave').click();await tick();assert.equal(h.w.settings.stockLibrary.length,1);await h.set('stockCategory','user');h.w.el('stockDelete').click();await tick();assert.equal(h.w.settings.stockLibrary.length,0);assert.equal(h.w.el('stockDelete').disabled,true);h.close();
});

test('Stock list does not auto-select a saved stock when the document has no stock name',async()=>{
  const h=await harness();h.w.editing.stock={type:'die-cut',liner_left_mm:1.27,liner_right_mm:1.27};h.w.settings.stockLibrary=[{name:'Custom',width_mm:101.6,height_mm:101.6,stock:{type:'die-cut'}}];
  h.w.refreshEditorUI();await h.tab('Stock');await h.set('stockCategory','user');
  assert.equal(h.w.el('stockList').options.length,1);assert.equal(h.w.el('stockList').selectedIndex,-1,'a first row is not implicitly selected as the current stock');
  assert.equal(h.w.editing.stock.name,undefined,'opening and rendering stock options does not apply one');h.close();
});
test('Shape: all outlines, border toggle and width update actual SVG and printed borders',async()=>{
  const h=await harness();await h.tab('Shape');for(const shape of ['rectangle','rounded','ellipse']){await h.set('shapeType',shape);assert.ok(h.preview().querySelector('[data-label-shape="'+shape+'"]'));await h.set('shapeBorder',true);assert.match(renderLabelBody(h.w.editing,{}),shape==='ellipse'?/\^GE/:/\^GB/);}
  const beforeWidth=Number(h.preview().querySelector('[data-label-shape]:not([data-preview-cell])')?.getAttribute('stroke-width'));
  await h.set('shapeThickness',1);assert.equal(h.w.editing.border_width_mm,1);const afterWidth=Number(h.preview().querySelector('[data-label-shape]:not([data-preview-cell])')?.getAttribute('stroke-width'));assert.ok(afterWidth>beforeWidth*3,'Border width updates the actual printed outline in the preview');await h.set('shapeBorder',false);const face=h.preview().querySelector('[data-preview-cell]');assert.equal(face.getAttribute('stroke'),'#222');assert.equal(face.hasAttribute('stroke-dasharray'),false,'the preview edge stays visible when printed borders are disabled');assert.equal(h.preview().querySelector('[data-label-shape]:not([data-preview-cell])'),null,'disabling Print borders removes only the printed outline');assert.doesNotMatch(renderLabelBody(h.w.editing,{}),/\^GE|\^GB/,'turning off Print borders removes the actual printed outline');h.close();
});
test('Shape: inch corner radius accepts and stores four decimal places such as 0.0472 in',async()=>{
  const h=await harness();h.w.settings.unit='in';h.w.editing.label_shape='rounded';h.w.el('pageSetupOpen').click();await tick();await h.tab('Shape');
  const radius=h.w.el('shapeRadius');assert.ok(radius,[...h.w.document.querySelectorAll('[id]')].map(node=>node.id).filter(id=>/radius|shape/i.test(id)).join(', '));assert.equal(radius.step,'0.0001');
  await h.set('shapeRadius','0.0472');assert.equal(radius.checkValidity(),true);assert.equal(h.w.editing.corner_radius_mm,1.1989);h.close();
});
test('Shape saves and reopens exact eighth-inch radius and border width',async()=>{
  const h=await harness(),w=h.w;w.settings.unit='in';Object.assign(w.editing,{width_mm:76.2,height_mm:50.8,label_shape:'rounded'});Object.assign(w.editing.page,{width_mm:76.2,height_mm:50.8});w.refreshEditorUI();w.el('pageSetupOpen').click();await tick();await h.tab('Shape');
  await h.set('shapeRadius','0.125');await h.set('shapeThickness','0.125');
  for(const id of ['shapeRadius','shapeThickness']){assert.equal(w.el(id).checkValidity(),true,id+' accepts 0.125 in');assert.equal(w.el(id).value,'0.125');}
  w.el('setupDone').click();await tick();assert.equal(w.el('pageSetupDialog').open,false,JSON.stringify([...w.el('pageSetupDialog').querySelectorAll('input')].filter(el=>!el.checkValidity()).map(el=>({id:el.id,value:el.value,min:el.min,step:el.step}))));assert.equal(w.persisted.corner_radius_mm,3.175);assert.equal(w.persisted.border_width_mm,3.175);
  w.el('pageSetupOpen').click();await tick();await h.tab('Shape');for(const id of ['shapeRadius','shapeThickness']){assert.equal(w.el(id).value,'0.125');assert.equal(w.el(id).checkValidity(),true);}
  h.close();
});

test('Background: file import, print toggle, opacity and removal update actual artwork',async()=>{
  const h=await harness();await h.tab('Background');const file=h.w.el('backgroundFile');Object.defineProperty(file,'files',{value:[{name:'background.png'}]});file.dispatchEvent(new h.w.Event('change',{bubbles:true}));await tick();assert.ok(h.w.editing.background?.bitmap_hex);await h.set('backgroundOpacity',75);assert.equal(h.w.el('backgroundOpacity').value,'75');await h.set('printBackground',true);assert.equal(h.w.el('printBackground').checked,true);assert.match(renderLabelBody(h.w.editing,{}),/\^GFA/);h.w.el('clearBackgroundBtn').click();await tick();assert.equal(h.w.editing.background,undefined);assert.equal(h.preview().querySelector('small')?.textContent,'Template Size: 75.00 × 53.00 mm');h.close();
});
test('Templates and footer: select, copy, Help, OK, Cancel and Escape perform their actions',async()=>{
  const h=await harness();const layoutCss=[...h.w.document.querySelectorAll('style')].map(s=>s.textContent).join('');const dialogStyle=h.w.getComputedStyle(h.w.el('pageSetupDialog'));assert.equal(dialogStyle.display,'grid');assert.equal(dialogStyle.gridTemplateRows,'auto auto minmax(0,1fr) auto');assert.equal(dialogStyle.overflow,'hidden');assert.match(layoutCss,/#pageSetupDialog>footer\{align-self:end/);await h.tab('Templates');await h.set('setupTemplateSelect','other.json');assert.equal(h.w.el('setupTemplateSelect').value,'other.json');assert.equal(h.w.editing.elements[0].text,'Changed template');assert.equal(h.preview().querySelector('[data-label-element]'),null,'selecting a template does not place its artwork into the paper preview');assert.equal(h.preview().textContent.includes('Changed template'),false);h.w.el('setupTemplateCopy').click();await tick();assert.equal(h.w.editing.name,'Copy');h.w.el('setupHelp').click();assert.match(h.w.alerted,/Page Setup/);h.w.el('setupDone').click();await tick();assert.equal(h.w.persisted.name,'Copy');assert.equal(h.w.el('pageSetupDialog').open,false);
  h.w.el('pageSetupOpen').click();await tick();await h.set('setupNegative',true);h.w.el('setupCancel').click();await tick();assert.equal(h.w.editing.negative,undefined);h.w.el('pageSetupOpen').click();await tick();await h.set('setupMirror',true);h.w.el('pageSetupDialog').dispatchEvent(new h.w.Event('cancel',{cancelable:true}));await tick();assert.equal(h.w.editing.mirror,undefined);h.close();
});
test('Page Setup exposes functional stock image tabs and explicit unsupported encoding notes',async()=>{
  const h=await harness();
  assert.deepEqual([...h.w.document.querySelectorAll('#pageSetupDialog nav[role="tablist"] > [role="tab"]')].map(tab=>tab.textContent.trim()),['Stock','Page','Layout','Shape','Media Handling','Printing Order','Templates','Background']);
  const stockTabs=[...h.w.document.querySelectorAll('#setupStock [data-stock-tab]')];
  assert.deepEqual(stockTabs.map(tab=>tab.textContent.trim()),['Predefined Stocks','RFID Antenna','Magnetic Stripe']);
  const stockCategory=h.w.el('stockCategory');assert.ok(stockCategory,'Stock category selection remains available');assert.ok(stockTabs[0].compareDocumentPosition(stockCategory)&h.w.Node.DOCUMENT_POSITION_FOLLOWING,'Stock sub-tabs are positioned before stock category/list controls');
  for(const [index,expect] of [[1,{panelId:'stockRfidPanel',hidePredefined:true,controlId:'rfidShow'}],[2,{panelId:'stockMagneticPanel',hidePredefined:true,controlId:'magDisplay'}]]){
    const tab=stockTabs[index];assert.equal(tab.disabled,false);tab.click();await tick();
    assert.equal(h.w.el('setupStock').dataset.activeStockPanel,tab.dataset.stockTab);
    assert.equal(h.w.el('stockPredefinedPanel').hidden,true,'predefined stock inputs stay on the Predefined Stocks tab only');
    assert.equal(h.w.el(expect.panelId).hidden,false);
    assert.ok(h.w.el(expect.controlId),`${expect.panelId} shows its own controls`);
    assert.equal(h.w.el('stockCategory').closest('#stockPredefinedPanel')?.hidden,true,'category/list inputs are not duplicated on guide tabs');
  }
  const wizard=h.w.el('setupWizard');assert.ok(wizard,'Page Setup keeps a Wizard entry in the footer');assert.equal(wizard.disabled,true,'Wizard is disabled when Q LABEL has no matching workflow');assert.match(h.w.el(wizard.getAttribute('aria-describedby')).textContent,/not available/i);
  const tray=h.w.el('setupTraySource');assert.ok(tray,'Page tab shows the paper tray/source capability');assert.equal(tray.disabled,true,'tray source is disabled without an output implementation');assert.match(h.w.el(tray.getAttribute('aria-describedby')).textContent,/not currently supported/i);
  const predefined=h.w.el('stockPredefinedPanel');
  assert.equal(predefined.querySelector('h3'),null,'Predefined Stocks tab omits duplicate heading');
  assert.equal(predefined.textContent.includes('Left liner extension'),false,'liner fields stay off predefined tab');
  assert.equal(predefined.textContent.includes('Label type'),false,'label type stays off predefined tab');
  assert.ok(h.w.el('stockLegacyFields'),'stock name/liner inputs remain in DOM for persistence');
  assert.ok(h.w.document.getElementById('setupMedia Handling')?.contains(h.w.el('stockType')),'label type moved to Media Handling');
  h.close();
});

test('stock antenna and stripe controls update every cell, persist and Cancel restores the document',async()=>{
 const h=await harness(),w=h.w;w.editing.page.rows=2;w.editing.page.columns=2;w.refreshEditorUI();
 const choose=key=>w.document.querySelector(`[data-stock-tab="${key}"]`).click();choose('rfid');
 assert.equal(w.el('rfidImage').options.length,12);await h.set('rfidShow',true);
 assert.equal(h.preview().querySelectorAll('[data-rfid-antenna]').length,4);
 await h.set('rfidMethod','manual');await h.set('rfidWidth',20);await h.set('rfidHeight',10);await h.set('rfidAngle',90);await h.set('rfidAnchor','bottom-right');
 w.el('rfidAdvanced').click();w.el('rfidOriginX').value='left';w.el('rfidOriginY').value='top';w.el('rfidOriginCancel').click();assert.equal(w.editing.stock.rfid_antenna.origin_x,undefined);
 w.el('rfidAdvanced').click();w.el('rfidOriginX').value='right';w.el('rfidOriginY').value='bottom';w.el('rfidOriginOk').click();assert.equal(w.editing.stock.rfid_antenna.origin_x,'right');
 await h.tab('Layout');assert.equal(h.preview().querySelectorAll('[data-rfid-antenna]').length,4);await h.tab('Stock');choose('magnetic-stripe');
 assert.equal(w.el('magColor').disabled,true);await h.set('magDisplay','front');await h.set('magEdge','left');await h.set('magThickness',4);
 assert.equal(h.preview().querySelectorAll('[data-magnetic-stripe]').length,4);await h.set('magPrintPreview',true);
 w.confirm=()=>false;w.el('setupDone').click();await tick();await tick();await tick();assert.equal(w.persisted.stock.rfid_antenna.angle,90);assert.equal(w.persisted.stock.magnetic_stripe.show_print_preview,true);
 w.el('pageSetupOpen').click();await tick();choose('magnetic-stripe');assert.equal(w.el('magThickness').value,'4');await h.set('magThickness',8);w.el('setupCancel').click();await tick();assert.equal(w.editing.stock.magnetic_stripe.thickness_mm,4);
 h.close();
});
test('stock validation reveals both tabs and retains the invalid draft for correction',async()=>{
 const h=await harness(),w=h.w;w.document.querySelector('[data-stock-tab=rfid]').click();await h.set('rfidShow',true);await h.set('rfidMethod','manual');await h.set('rfidWidth',-1);await h.tab('Layout');w.el('setupDone').click();await tick();assert.equal(w.el('setupStock').hidden,false);assert.equal(w.el('stockRfidPanel').hidden,false);assert.equal(w.el('rfidWidth').value,'-1');assert.equal(w.el('pageSetupDialog').open,true);h.close();
});
test('pending antenna import cannot mutate a canceled or replacement document',async()=>{
 const h=await harness(),w=h.w;w.document.querySelector('[data-stock-tab=rfid]').click();await h.set('rfidShow',true);let reader;
 w.FileReader=class{constructor(){reader=this;}readAsDataURL(){}};w.Image=class{constructor(){this.naturalWidth=30;this.naturalHeight=20;}set src(v){queueMicrotask(()=>this.onload());}};
 Object.defineProperty(w.el('rfidFile'),'files',{value:[{name:'late.png',type:'image/png',size:10}]});const pending=w.el('rfidFile').onchange();w.el('setupCancel').click();await tick();const restored=JSON.stringify(w.editing);reader.result='data:image/png;base64,aGVsbG8=';reader.onload();await pending;assert.equal(JSON.stringify(w.editing),restored);h.close();
});
test('Media Handling disables unconfirmed printer modes and preserves legacy values without emitting them',async()=>{
  const h=await harness(),key='ip:192.0.2.10:9100';
  h.w.el('setupCancel').click();await tick();
  h.w.editing.print_mode='C';
  h.w.settings.printerProfiles[key]={capabilities:{mediaModes:['T','P']}};
  h.w.el('pageSetupOpen').click();await tick();
  const select=h.w.el('setupPrintMode');
  assert.equal(select.value,'C','an existing unsupported setting remains visible in the document');
  assert.equal(select.querySelector('option[value="T"]').disabled,false);
  assert.equal(select.querySelector('option[value="P"]').disabled,false);
  assert.equal(select.querySelector('option[value="C"]').disabled,true);
  assert.equal(select.querySelector('option[value="R"]').disabled,true);
  const reason=h.w.el('setupPrintModeReason');assert.ok(reason&&!reason.hidden);assert.match(reason.textContent,/Cutter.*Rewind.*disabled/i);assert.match(reason.textContent,/saved .*mode is preserved.*output uses Tear-off/i,'legacy values remain in the document while the printer receives the safe mode');
  select.value='R';select.dispatchEvent(new h.w.Event('change',{bubbles:true}));
  assert.equal(h.w.editing.print_mode,'C','disabled choices cannot be committed by a change event');
  assert.equal(select.value,'C','the preserved legacy selection remains selected');
  h.close();
});




test('scale confirmation uses the app dialog with sizes, explicit choices and reversible dismissal',async()=>{
  const h=await harness();h.w.autoScalePrompt=false;h.w.confirm=()=>{throw Error('Native confirmation must not be used');};await h.set('pageCols',2);h.w.el('setupDone').click();await tick();
  const dialog=h.w.el('scaleConfirmDialog');assert.ok(dialog?.open);assert.equal(h.w.el('pageSetupDialog').open,true);assert.ok(dialog.getAttribute('aria-labelledby'));assert.match(h.w.el('scaleConfirmSizes').textContent,/75.*37\.5/s);assert.match(h.w.el('scaleConfirmYes').textContent,/Scale objects/);assert.match(h.w.el('scaleConfirmNo').textContent,/Keep current objects/);
  dialog.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await tick();assert.equal(dialog.open,false);assert.equal(h.w.el('pageSetupDialog').open,true);assert.equal(h.w.persisted,undefined);h.close();
});

test('smallTemplateSizeChangeCommitsWithoutPrompt',async()=>{
  const h=await harness();let prompts=0;h.w.confirm=()=>{prompts++;return true;};await h.set('pageW',80);const original=h.w.editing.elements[0].x_mm;h.w.el('setupDone').click();await tick();
  assert.equal(prompts,0,'a change below 10 percent does not ask to scale');assert.equal(h.w.el('pageSetupDialog').open,false);assert.equal(h.w.editing.width_mm,80);assert.equal(h.w.editing.elements[0].x_mm,original);h.close();
});

test('scaling options expose all BarTender choices',async()=>{
  const h=await harness();
  for(const id of ['scaleTextRule','scaleBarcodeRule','scalePictureRule'])assert.deepEqual([...h.w.el(id).options].map(option=>option.textContent),['Do Not Scale','Scale Proportionally','Scale Freely']);
  assert.deepEqual([...h.w.el('scaleLineRule').options].map(option=>option.textContent),['Maintain Thickness','Scale Thickness']);h.close();
});

test('editor paper size changes only after Scale Templates OK',async()=>{
  const h=await harness();await h.set('pageCols',2);assert.equal(h.w.designPaperBounds().width,75);
  h.w.el('setupDone').click();await tick();assert.equal(h.w.el('scaleTemplatesDialog').open,true);assert.equal(h.w.designPaperBounds().width,75);
  h.w.el('scaleTemplatesCancel').click();await tick();assert.equal(h.w.designPaperBounds().width,75);
  h.w.el('setupDone').click();await tick();h.w.el('scaleTemplatesOk').click();await tick();assert.equal(h.w.designPaperBounds().width,37.5);assert.equal(h.w.editing.page.width_mm,75);h.close();
});

test('significantSizeChangeYesOpensScaleModalWithDefaultsAndPercentages',async()=>{
  const h=await harness();await h.set('pageCols',2);let prompt='';h.w.confirm=message=>{assert.equal(h.w.el('pageSetupDialog').open,true,'Page Setup remains visible during confirmation');prompt=message;return true;};h.w.el('setupDone').click();await tick();
  const modal=h.w.el('scaleTemplatesDialog');assert.ok(modal?.open,'Yes opens the Scale Templates dialog');assert.equal(h.w.el('pageSetupDialog').open,true,'Page Setup remains visible behind scaling');assert.match(prompt,/template size has changed significantly/i);assert.equal(h.w.el('scaleTextRule').value,'proportional');assert.equal(h.w.el('scaleBarcodeRule').value,'free');assert.equal(h.w.el('scalePictureRule').value,'proportional');assert.equal(h.w.el('scaleLineRule').value,'maintain-thickness');assert.match(h.w.el('scaleCurrentWidth').textContent,/75/);assert.match(h.w.el('scaleNewWidth').textContent,/37\.5/);assert.match(h.w.el('scaleWidthPercent').textContent,/50%/);h.close();
});

test('scale transition still opens when a hidden window suspends animation frames',async()=>{
  const h=await harness();await h.set('pageCols',2);h.w.requestAnimationFrame=()=>1;h.w.confirm=()=>true;h.w.el('setupDone').click();await new Promise(resolve=>setTimeout(resolve,80));
  assert.equal(h.w.el('pageSetupDialog').open,true);assert.equal(h.w.el('scaleTemplatesDialog').open,true);h.close();
});

test('significantSizeChangeNoCommitsWithoutChangingArtwork',async()=>{
  const h=await harness();await h.set('pageCols',2);const original=structuredClone(h.w.editing.elements);h.w.confirm=()=>false;h.w.el('setupDone').click();await tick();
  for(const element of original)element.scaling_reference_size={width_mm:75,height_mm:53};
  assert.equal(h.w.el('scaleTemplatesDialog').open,false,'No bypasses the scaling modal');assert.equal(h.w.el('pageSetupDialog').open,false);assert.equal(h.w.editing.width_mm,37.5);assert.deepEqual(JSON.parse(JSON.stringify(h.w.editing.elements)),JSON.parse(JSON.stringify(original)));assert.deepEqual(JSON.parse(JSON.stringify(h.w.persisted.elements)),JSON.parse(JSON.stringify(original)));h.close();
});

test('scaleModalCancelAndEscapeKeepPageSetupDraftOpen',async()=>{
  for(const dismiss of ['button','escape']){const h=await harness();await h.set('pageCols',2);h.w.confirm=()=>true;h.w.el('setupDone').click();await tick();const modal=h.w.el('scaleTemplatesDialog');assert.ok(modal?.open);if(dismiss==='button')h.w.el('scaleTemplatesCancel').click();else modal.dispatchEvent(new h.w.Event('cancel',{bubbles:false,cancelable:true}));await tick();assert.equal(modal.open,false);assert.equal(h.w.el('pageSetupDialog').open,true);assert.equal(h.w.editing.width_mm,37.5);assert.equal(h.w.editing.elements[0].x_mm,3);assert.equal(h.w.persisted,undefined);h.close();}
});

test('scaleModalOkScalesPersistsOnceAndCreatesOneUndoSnapshot',async()=>{
  const h=await harness();h.w.editing.elements=[{type:'text',x_mm:3,y_mm:4,height_mm:4,font_size_pt:12,text:'A'},{type:'barcode128',x_mm:10,y_mm:8,width_mm:20,bar_height_mm:10,module_width:2}];await h.set('pageCols',2);let snapshots=0,persists=0,previewUpdates=0;h.w.document.addEventListener('preview-updated',()=>previewUpdates++);h.w.pushSnapshot=()=>{snapshots++;};h.w.persistEditor=async()=>{persists++;h.w.persisted=JSON.parse(JSON.stringify(h.w.editing));};h.w.confirm=()=>true;h.w.el('setupDone').click();await tick();h.w.el('scaleTemplatesOk').click();await tick();
  assert.equal(h.w.el('scaleTemplatesDialog').open,false);assert.equal(h.w.el('pageSetupDialog').open,false);assert.equal(h.w.editing.width_mm,37.5);assert.equal(h.w.editing.elements[0].x_mm,1.5);assert.equal(h.w.editing.elements[0].height_mm,2);assert.equal(h.w.editing.elements[1].x_mm,5);assert.equal(h.w.editing.elements[1].module_width,1);assert.equal(snapshots,1);assert.equal(persists,1);assert.ok(previewUpdates>0,'editor preview update was dispatched');h.close();
});

test('scaleValidationFailureKeepsDocumentUnchangedAndShowsError',async()=>{
  const h=await harness();await h.set('pageCols',2);h.w.confirm=()=>true;const original=structuredClone(h.w.editing.elements),scale=h.w.TemplateScaling.scaleDocument;h.w.TemplateScaling.scaleDocument=()=>({ok:false,error:'Bad dimensions'});h.w.el('setupDone').click();await tick();h.w.el('scaleTemplatesOk').click();await tick();
  assert.equal(h.w.el('scaleTemplatesDialog').open,true);assert.equal(h.w.el('pageSetupDialog').open,true);assert.match(h.w.el('scaleTemplatesError').textContent,/Bad dimensions/);assert.deepEqual(JSON.parse(JSON.stringify(h.w.editing.elements)),JSON.parse(JSON.stringify(original)));assert.equal(h.w.persisted,undefined);h.w.TemplateScaling.scaleDocument=scale;h.close();
});
