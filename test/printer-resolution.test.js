'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');

function preloadBridge(invoke){
  let api;
  require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('../gui/preload'),'utf8'),{require:name=>{assert.equal(name,'electron');return{contextBridge:{exposeInMainWorld:(_name,value)=>{api=value;}},ipcRenderer:{sendSync:()=>true,invoke}};}});
  return api;
}

test('printer DPI bridge uses the Windows printer queue nominal DPI while a stale main process is restarted',async()=>{
  const api=preloadBridge(async()=>{throw Error("Error invoking remote method 'get-printer-resolution': Error: No handler registered for 'get-printer-resolution'");});
  const result=await api.getPrinterResolution('Zebra ZT610 (600 dpi)');
  assert.equal(result.code,'APP_RESTART_REQUIRED');
  assert.equal(result.dpi,600,'a numeric DPI published in the selected Windows printer name keeps setup moving');
  assert.equal(result.source,'printer-name-fallback');
  assert.match(result.notice,/600 dpi.*restart Q LABEL/i);
  assert.equal(result.error,undefined,'a stale main process is reported as guidance, not as a red error');
  const unknown=await api.getPrinterResolution('Zebra Printer');
  assert.equal(unknown.dpi,undefined,'the bridge never fabricates a DPI when the printer name has no resolution');
});

test('printer DPI bridge passes the selected printer to the main process and preserves other failures',async()=>{
  let request;
  const api=preloadBridge(async(channel,name)=>{request={channel,name};return{dpi:608};});
  assert.equal((await api.getPrinterResolution('Zebra ZT610')).dpi,608);
  assert.deepEqual(request,{channel:'get-printer-resolution',name:'Zebra ZT610'});
  const failed=preloadBridge(async()=>{throw Error('Driver query failed');});
  await assert.rejects(failed.getPrinterResolution('Zebra ZT610'),/Driver query failed/);
});

test('Windows driver resolution accepts matching horizontal and vertical DPI',()=>{
  const {readDriverResolution}=require('../lib/printer-resolution');
  assert.deepEqual(readDriverResolution({HorizontalResolution:608,VerticalResolution:608}),{dpi:608});
  assert.deepEqual(readDriverResolution({HorizontalResolution:'203',VerticalResolution:'203'}),{dpi:203});
});

test('Windows driver resolution rejects missing, invalid, or non-square DPI',()=>{
  const {readDriverResolution}=require('../lib/printer-resolution');
  for(const config of [null,{}, {HorizontalResolution:0,VerticalResolution:0}, {HorizontalResolution:608,VerticalResolution:600}, {HorizontalResolution:3000,VerticalResolution:3000}]){
    assert.match(readDriverResolution(config).error,/driver|resolution/i,JSON.stringify(config));
  }
});

function wizardHarness(readResolution){
  const dom=new JSDOM('<!doctype html><html><head></head><body><select id="printerSelect"><option value="Zebra ZT610 (600 dpi)">Zebra ZT610 (600 dpi)</option><option value="Zebra ZT411 (600 dpi)">Zebra ZT411 (600 dpi)</option></select><div id="previewFrame"></div></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost'}),w=dom.window;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.settings={};w.editing={dpi:300};w.current={file:'old.json'};w.rawTemplate={name:'Old'};
  w.readEditorIntoDraft=()=>{};w.prepareEditorNavigation=async()=>true;w.rememberPrintPage=()=>{};w.blankTemplate=()=>({});w.openEditor=template=>{w.createdTemplate=template;};w.updateConnSummary=()=>{};w.hideProjectHome=()=>{};
  w.el=id=>id==='printerSelect'?w.document.getElementById('printerSelect'):w.document.getElementById(id);
  w.QLabelStockCatalog={
    getManufacturers:()=>['ADES AG'],
    getStocks:manufacturer=>manufacturer==='ADES AG'?[{manufacturer:'ADES AG',name:'49908',width_mm:89.9922,height_mm:49.9872,paper_width_mm:93.98,paper_height_mm:49.9872,columns:1,rows:1,margin_top_mm:0,margin_left_mm:1.9812,margin_right_mm:1.9812,margin_bottom_mm:0,gap_x_mm:0,gap_y_mm:0,orientation:0,printer_type:'Roll'}]:[],
    getStock:(manufacturer,name)=>manufacturer==='ADES AG'&&name==='49908'?{manufacturer:'ADES AG',name:'49908',width_mm:89.9922,height_mm:49.9872,paper_width_mm:93.98,paper_height_mm:49.9872,columns:1,rows:1,margin_top_mm:0,margin_left_mm:1.9812,margin_right_mm:1.9812,margin_bottom_mm:0,gap_x_mm:0,gap_y_mm:0,orientation:0,printer_type:'Roll'}:null
  };
  w.reloadTemplates=async()=>{};w.rememberRecentTemplate=file=>{w.recentFile=file;};w.rememberProjectPrinter=async(printer,file)=>{w.projectPrinter={printer,file};};
  w.zebra={getPrinterResolution:readResolution,listPrinters:async()=>[...w.document.getElementById('printerSelect').options].map(option=>option.value),saveSettings:async value=>value,createTemplate:async template=>({ok:true,file:template.name+'.json',name:template.name}),ensureBarTenderLibraryBtw:async item=>({ok:true,path:item.relative_path||'C:\\\\Library\\\\Sample.btw',metadata:{width_in:3,height_in:1,page_width_in:8.5,page_height_in:11,width_mm:76.2,height_mm:25.4}})};
  const ensureLibraryFile=w.zebra.ensureBarTenderLibraryBtw;
  w.zebra.ensureBarTenderLibraryBtw=async item=>({...await ensureLibraryFile(item),artwork:{png_data_url:'data:image/png;base64,AA==',bitmap_width:8,bitmap_height:1,bitmap_hex:'FF',source:'btw-embedded-preview'}});
  w.eval(require('node:fs').readFileSync(require.resolve('../gui/windows-printer-list'),'utf8'));
  w.openTemplateBrowser=async()=>({mode:'cancel',item:null});
  w.eval(require('node:fs').readFileSync(require.resolve('../gui/stock-catalog-ui'),'utf8'));
  w.eval(require('node:fs').readFileSync(require.resolve('../gui/new-label-stock-mode'),'utf8'));
  w.zebra.ensureBarTenderLibraryBtw=async item=>({ok:true,path:item.relative_path||'C:\\Library\\Sample.btw',artwork:{png_data_url:'data:image/png;base64,AA==',bitmap_width:1,bitmap_height:1,bitmap_hex:'FF',source:'test-fixture'},metadata:{width_in:3,height_in:1,page_width_in:8.5,page_height_in:11,width_mm:76.2,height_mm:25.4}});
  w.eval(require('node:fs').readFileSync(require.resolve('../gui/new-label-wizard'),'utf8'));
  return {dom,w,dialog:w.document.getElementById('newLabelWizard'),field:id=>w.document.getElementById('nw'+id)};
}

const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('predefined stock keeps rounded geometry through dimension editing and Finish',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  for(const file of ['stock-apply','stock-preview'])w.eval(require('node:fs').readFileSync(require.resolve('../gui/'+file),'utf8'));
  const stock={...w.QLabelStockCatalog.getStocks('ADES AG')[0],shape:0,placeholder_or_border_mm:3.175};
  w.QLabelStockCatalog.getStocks=()=>[stock];
  let layout;
  w.PaperPreview={render:(aside,template)=>{layout=template;aside.innerHTML='<svg></svg><small></small>';}};
  w.openNewLabelWizard();await tick();field('Next').click();await tick();field('Next').click();
  field('StockPredefined').checked=true;field('StockPredefined').dispatchEvent(new w.Event('change'));
  field('Next').click();field('Next').click();
  field('Next').click();field('Unit').value='mm';field('Unit').dispatchEvent(new w.Event('change'));field('Width').value='70';field('Height').value='30';field('Width').dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.equal(layout.label_shape,'rounded');
  assert.equal(layout.corner_radius_mm,3.175);
  assert.equal(layout.width_mm,70);
  assert.equal(layout.height_mm,30);
  field('Name').value='Edited stock';
  dialog.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
  assert.equal(w.createdTemplate.width_mm,70);assert.equal(w.createdTemplate.height_mm,30);
  assert.equal(w.createdTemplate.label_shape,'rounded');assert.equal(w.createdTemplate.corner_radius_mm,3.175);
  dom.window.close();
});

test('New Label wizard places the Next arrow after its text',async()=>{
  const {dom,w,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();
  const next=field('Next');
  const visibleOrder=[...next.childNodes].filter(node=>node.nodeType===w.Node.ELEMENT_NODE||node.textContent.trim()).map(node=>node.nodeType===w.Node.TEXT_NODE?node.textContent.trim():'arrow');
  assert.deepEqual(visibleOrder,['Next','arrow']);
  dom.window.close();
});

test('Items Per Page preview updates its label count for multiple and single items',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();field('Next').click();field('Next').click();field('Next').click();
  assert.equal(field('Preview').parentElement.hidden,false);
  const body=dialog.querySelector('.nw-body');
  assert.ok(parseFloat(w.getComputedStyle(body).paddingRight)>=10,'Items Per Page keeps right inset so the preview is not flush with the modal');
  assert.equal(w.getComputedStyle(field('Preview')).transform,'none','Items Per Page preview is not shifted into the modal edge');
  field('MultipleItems').click();
  for(const [id,value] of [['Rows','2'],['Columns','3']]){field(id).value=value;field(id).dispatchEvent(new w.Event('input',{bubbles:true}));}
  assert.equal(field('Preview').querySelectorAll('rect').length,7,'preview includes six labels plus the paper');
  field('SingleItem').click();
  assert.equal(field('Preview').querySelectorAll('rect').length,2,'returning to single item redraws one label plus the paper');
  dom.window.close();
});

test('wizard retains the ABSS identity and Zebra header artwork on every setup step',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();
  const art=dialog.querySelector('.nw-heading-art'),brand=dialog.querySelector('header .nw-brand-icon');
  assert.ok(art,'the setup heading includes the label/printer banner');
  assert.equal(art.getAttribute('src'),'assets/branding/new-document-banner.svg');
  assert.equal(art.alt,'','decorative artwork does not repeat the heading to screen readers');
  assert.equal(brand.alt,'ABSS');
  const headings=[];
  for(let step=0;step<9;step++){
    headings.push(dialog.querySelector('.nw-heading strong').textContent);
    assert.equal(dialog.querySelector('.nw-heading-art'),art,'changing steps retains the same banner');
    if(step<8)field('Next').click();
  }
  assert.deepEqual(headings,['Starting Point','Select the Printer','Stock Selection','Items Per Page','Side Edges','Printed Item Shape','Template Size','Template Background','Finished!']);
  assert.equal(dialog.querySelector('#nwLabelLayout'),null,'the layout page and orientation controls are absent');
  dom.window.close();
});

test('Finished wizard step hides scrollbars and matches Template Background preview size',()=>{
  const src=require('node:fs').readFileSync(require.resolve('../gui/new-label-wizard'),'utf8');
  assert.match(src,/#newLabelWizard \.nw-body:is\(\[data-step="7"\],\[data-step="8"\]\) aside>svg\{[^}]*height:270px[^}]*background:transparent/);
  assert.doesNotMatch(src,/nw-finished-review\{[^}]*height:240px/);
});

test('Template Background preview focuses on one label sheet without roll gaps',()=>{
  const src=require('node:fs').readFileSync(require.resolve('../gui/new-label-wizard'),'utf8');
  const previewBlock=src.slice(src.indexOf('function preview()'),src.indexOf('style.textContent+="#newLabelWizard .nw-body[data-preview=hidden]"'));
  assert.ok(previewBlock.includes('step===7||step===8')&&previewBlock.includes('renderSingleSheet')&&previewBlock.includes('{finished:true}'));
});

test('selecting multi-column stock after switching to inches keeps integer counts and millimetre page dimensions',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  for(const file of ['stock-catalog','stock-apply','stock-preview'])w.eval(require('node:fs').readFileSync(require.resolve('../gui/'+file),'utf8'));
  w.openNewLabelWizard();await tick();field('Next').click();field('Next').click();
  field('Unit').value='in';field('Unit').dispatchEvent(new w.Event('change'));
  field('StockPredefined').checked=true;field('StockPredefined').dispatchEvent(new w.Event('change'));
  field('StockCategory').value='Advanced Labeling';field('StockCategory').dispatchEvent(new w.Event('change'));
  field('StockList').value='.75" Circle 4 up';field('StockList').dispatchEvent(new w.Event('change'));
  assert.equal(Number(field('Columns').value),4);assert.equal(Number(field('Rows').value),1);
  assert.equal(Number(field('PaperW').value),92.075);
  await dialog.querySelector('form').onsubmit({preventDefault(){}});
  assert.ok(w.createdTemplate,field('Error').textContent);assert.equal(w.createdTemplate.page.columns,4);
  assert.equal(w.createdTemplate.page.width_mm,92.075);dom.window.close();
});

test('predefined stock preview is visible and selected dimensions are preserved on Finish in inches',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  for(const file of ['stock-catalog','stock-apply','stock-preview'])w.eval(require('node:fs').readFileSync(require.resolve('../gui/'+file),'utf8'));
  w.openNewLabelWizard();await tick();field('Next').click();field('Next').click();field('StockPredefined').checked=true;field('StockPredefined').dispatchEvent(new w.Event('change'));
  field('StockCategory').value='Advanced Labeling';field('StockCategory').dispatchEvent(new w.Event('change'));
  field('StockList').value='.75" Circle';field('StockList').dispatchEvent(new w.Event('change'));
  assert.equal(field('Preview').parentElement.hidden,false,'predefined stock selection restores its preview pane');
  assert.ok(field('Preview').querySelector('ellipse[data-stock-label]'),'the selected stock shape is drawn in the restored preview');
  field('Unit').value='in';field('Unit').dispatchEvent(new w.Event('change'));
  w.mmToUnit=(value,unit)=>unit==='in'?value/25.4:value;
  w.eval(require('node:fs').readFileSync(require.resolve('../gui/modal-preview'),'utf8'));
  field('Next').click();
  assert.ok(field('Preview').querySelector('ellipse[data-stock-label]'),'Items Per Page retains the selected circular stock preview');
  await dialog.querySelector('form').onsubmit({preventDefault(){}});
  assert.equal(w.createdTemplate.label_shape,'ellipse');
  assert.ok(Math.abs(w.createdTemplate.width_mm-19.05)<1e-9);
  assert.equal(w.createdTemplate.page.width_mm,22.225);
  assert.equal(w.createdTemplate.page.columns,1);
  dom.window.close();
});

test('Starting Point hides its preview pane',async()=>{
  const {dom,w,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();
  assert.equal(field('Preview').parentElement.hidden,true,'Starting Point with blank template hides the preview');
  assert.equal(field('Preview').closest('#newLabelWizard').querySelector('.nw-body').dataset.preview,'hidden','the hidden preview state is exposed for the matching single-column layout');
  assert.doesNotMatch(w.document.querySelector('#nwStartingPoint .nw-start-help').innerHTML,/<br\s*\/?\s*>/i,'starting help wraps naturally to the available form width');
  assert.equal(field('Preview').closest('#newLabelWizard').querySelector('.nw-heading strong').textContent,'Starting Point');
  dom.window.close();
});

test('library Finish rejects unverified artwork and forged decomposed elements',async()=>{
 const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
 w.zebra.ensureBarTenderLibraryBtw=async()=>({ok:true,path:'C:/Library/Unverified.btw',artwork:{bitmap_hex:'FF'},elements:[{type:'text',text:'guessed'}],objects_decomposed:true});
 w.openTemplateBrowser=async()=>({item:{name:'Unverified'}});w.openNewLabelWizard();await tick();await tick();field('TemplateLibrary').click();await tick();await tick();
 await dialog.querySelector('form').onsubmit({preventDefault(){}});await tick();
 assert.equal(w.createdTemplate,undefined);assert.match(field('Error').textContent,/editable.*conversion.*not.*verified/i);dom.window.close();
});
test('library Finish retains verified original editable elements, named sources, pages and fonts',async()=>{
 const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));w.structuredClone=structuredClone;
 const p=require('./fixtures/native-package-contract').fixture();
 p.fonts=[{family:'Original fixture font',sha256:'f'.repeat(64)}];p.design_active='front';p.designs={front:{elements:structuredClone(p.elements)}};
 w.zebra.ensureBarTenderLibraryBtw=async()=>({ok:true,path:'C:/Library/Contract.btw',import_mode:'verified-native-objects',native_package:p,artwork:null,metadata:{width_in:p.width_mm/25.4,height_in:p.height_mm/25.4,width_mm:p.width_mm,height_mm:p.height_mm}});
 w.openTemplateBrowser=async()=>({item:{name:'Contract fixture'}});w.openNewLabelWizard();await tick();await tick();field('TemplateLibrary').click();await tick();await tick();
 await dialog.querySelector('form').onsubmit({preventDefault(){}});await tick();
 assert.ok(w.createdTemplate,field('Error').textContent);
 for(const key of ['elements','sourceDefinitions','page','fonts','designs'])assert.deepEqual(JSON.parse(JSON.stringify(w.createdTemplate[key])),p[key],key);
 assert.equal(w.createdTemplate.width_mm,50);assert.equal(w.createdTemplate.label_shape,'rectangle');assert.equal(w.createdTemplate.dataSourceSchemaVersion,1);
 assert.equal(w.createdTemplate.bartender_library_template.objects_decomposed,true);assert.equal(w.createdTemplate.bartender_library_template.native_source_sha256,p.source.sha256);dom.window.close();
});
test('native library package that excludes its original form disables the option and cannot Finish with it forged on',async()=>{
 const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));w.structuredClone=structuredClone;
 const p=require('./fixtures/native-package-contract').fixture();p.native_forms={enabled:false,original_enabled:true,excluded:true,controls:[{name:'Text Input Box 1',value:'A'}],behaviorComplete:false};
 w.zebra.ensureBarTenderLibraryBtw=async()=>({ok:true,path:'C:/Library/FormExcluded.btw',import_mode:'verified-native-objects',native_package:p,artwork:null,metadata:{width_in:2,height_in:1,page_width_in:8.5,page_height_in:11}});
 w.openTemplateBrowser=async()=>({item:{name:'Form excluded fixture'}});w.openNewLabelWizard();await tick();await tick();field('TemplateLibrary').click();await tick();await tick();
 assert.equal(field('DataEntryForm').disabled,true);assert.equal(field('DataEntryForm').checked,false);
 assert.equal(field('DataEntryUnsupported').hidden,false);assert.match(field('DataEntryUnsupported').textContent,/unavailable/i);
 field('DataEntryForm').checked=true;await dialog.querySelector('form').onsubmit({preventDefault(){}});await tick();
 assert.equal(w.createdTemplate,undefined);assert.match(field('Error').textContent,/data.entry form.*unavailable/i);dom.window.close();
});
test('unsupported library artwork reports an error and blocks an empty project',async()=>{
 const {dom,w,field}=wizardHarness(async()=>({dpi:600}));
 w.zebra.ensureBarTenderLibraryBtw=async()=>({ok:false,error:'No supported artwork preview.'});
 w.openTemplateBrowser=async()=>({item:{name:'Unsupported'}});w.openNewLabelWizard();await tick();field('TemplateLibrary').click();await tick();await tick();
 assert.equal(field('Next').disabled,true);assert.equal(field('Finish').disabled,true);assert.match(field('Error').textContent,/artwork preview/);assert.equal(w.createdTemplate,undefined);dom.window.close();
});

test('Starting Point matches the selected library template preview layout',async()=>{
  const {dom,w,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();
  w.openTemplateBrowser=async()=>({mode:'local',item:{name:'A4A Label',industry:'Defense',relative_path:'Military/MIL-STD-130/A4A Label.btw',btw_file_name:'A4A Label.btw',width_in:3,height_in:1,thumbnail_url:'https://example.test/a4a.png'}});
  field('TemplateLibrary').click();await tick();await tick();
  const aside=field('Preview').parentElement;
  assert.equal(aside.hidden,false,'a selected library template shows the right preview pane');
  assert.ok(aside.querySelector('#nwStartingPreview'),'the Starting Point uses an HTML template preview instead of inserting HTML into SVG');
  assert.equal(aside.querySelector('#nwStartingPreview img').getAttribute('src'),'data:image/png;base64,AA==');
  assert.match(field('Size').textContent,/Page Size:\s*8\.5\s*x\s*11\s*in/i);
  assert.match(field('Size').textContent,/Template Size:\s*3\s*x\s*1\s*in/i);
  assert.match(field('LibraryDocument').textContent,/Document:\s*A4A Label\.btw/i);
  assert.equal(field('Next').disabled,false,'a selected library template can continue');
  dom.window.close();
});

test('Starting Point size captions omit zero decimals and retain meaningful fractions',async()=>{
  const {dom,w,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();
  w.openTemplateBrowser=async()=>({mode:'local',item:{name:'Whole inch label',industry:'Test',relative_path:'whole.btw',btw_file_name:'whole.btw',width_in:4.000,height_in:4.000,thumbnail_url:'https://example.test/a4a.png'}});
  w.zebra.ensureBarTenderLibraryBtw=async item=>({ok:true,path:item.relative_path,artwork:{png_data_url:'data:image/png;base64,AA==',bitmap_width:1,bitmap_height:1,bitmap_hex:'FF',source:'test-fixture'},metadata:{width_in:4.000,height_in:4.000,page_width_in:4.000,page_height_in:4.000,width_mm:101.6,height_mm:101.6}});
  field('TemplateLibrary').click();await tick();await tick();
  assert.match(field('Size').textContent,/Page Size:\s*4\s*x\s*4 in/i);
  assert.match(field('Size').textContent,/Template Size:\s*4\s*x\s*4 in/i);
  assert.doesNotMatch(field('Size').textContent,/4\.0+/);
  dom.window.close();
});

test('Printer Selection hides its preview pane',async()=>{
  const {dom,w,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();field('Next').click();await tick();assert.equal(field('Next').disabled,false,'the selected printer has a valid DPI');
  assert.equal(field('Preview').parentElement.hidden,true,'Printer Selection does not show a label preview');
  assert.equal(field('Preview').closest('#newLabelWizard').querySelector('.nw-heading strong').textContent,'Select the Printer');
  dom.window.close();
});

test('New Label wizard starts at Starting Point and advances to printer selection before stock',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Starting Point');
  assert.equal(field('BlankTemplate').checked,true);
  assert.equal(field('TemplateLibrary').disabled,false);
  assert.equal(field('SelectTemplate').disabled,true,'Select stays disabled until library mode is chosen');
  assert.doesNotMatch(field('TemplateLibrary').closest('label').textContent,/coming soon/i);
  w.openTemplateBrowser=async()=>({mode:'local',item:{name:'A4A Label',industry:'Defense',relative_path:'Military/MIL-STD-130/A4A Label.btw',btw_file_name:'A4A Label.btw',width_in:3,height_in:1,thumbnail_url:'https://example.test/a4a.png'}});
  field('TemplateLibrary').click();await tick();await tick();
  assert.equal(field('SelectTemplate').disabled,false);
  assert.equal(field('Next').disabled,false,'choosing a library template unlocks Next');
  assert.match(field('LibraryDocument').textContent,/Document:\s*A4A Label\.btw/i);
  field('BlankTemplate').click();await tick();field('Next').click();await tick();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Select the Printer');
  field('Back').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Starting Point');
  assert.equal(field('BlankTemplate').checked,true,'Back returns to the default blank-template choice');
  field('Next').click();await tick();field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Stock Selection');
  assert.equal(field('StockPredefined').checked,false);
  assert.equal(field('StockCustom').checked,true);
  assert.equal(field('StockCategory').disabled,true);
  dom.window.close();
});

test('New Label wizard keeps stock controls visible but disabled for custom settings',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Select the Printer');
  assert.equal(dialog.querySelectorAll('footer button').length,4);
  assert.deepEqual([...dialog.querySelectorAll('footer button')].map(button=>button.id),['nwBack','nwNext','nwCancel','nwFinish'],'Finish is the rightmost footer action after Cancel');
  for(const button of dialog.querySelectorAll('footer button')){
    const icon=button.querySelector('svg');
    assert.ok(icon,`${button.id} uses an SVG icon`);
    assert.equal(icon.getAttribute('viewBox'),'0 0 16 16');
    assert.equal(icon.getAttribute('aria-hidden'),'true');
    assert.ok(icon.querySelector('path'),`${button.id} icon draws its own action`);
  }
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Stock Selection');
  assert.equal(field('StockPredefined').checked,false,'a new label starts without a selected stock');
  assert.equal(field('StockCustom').checked,true);
  field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));
  assert.equal(field('StockCustom').checked,true);
  assert.equal(field('StockPredefined').checked,false);
  assert.equal(field('CustomStock').hidden,false);
  assert.equal(field('PredefinedStock').hidden,false,'category and stock controls stay visible like the reference wizard');
  assert.equal(field('StockCategory').disabled,true);
  assert.equal(field('StockList').disabled,true);
  assert.equal(field('StockCategory').value,'','custom mode does not show a selected category');
  assert.ok([...field('StockCategory').options].every(option=>option.value.trim()!==''),'category dropdown contains no empty row');
  assert.ok([...field('StockCategory').options].some(option=>option.value==='ADES AG'),'custom mode keeps named categories available for predefined selection');
  assert.equal(field('StockList').options.length,0,'custom mode shows an empty stock list');
  assert.equal(field('Preview').parentElement.hidden,true,'Stock Selection hides its preview pane in custom mode');
  assert.equal(field('PaperMode'),null,'roll/sheet mode controls are removed from the wizard');
  assert.equal(field('PaperRoll'),null);
  assert.equal(field('PaperSheet'),null);
  assert.ok(Math.abs(Number(field('Width').value)-4)<1e-6,'custom mode keeps default label width in the active unit');
  assert.ok(Math.abs(Number(field('Height').value)-4)<1e-6);
  dialog.close();dom.window.close();
});

test('New Label wizard has no roll or sheet mode choice in either stock mode',async()=>{
  const {dom,w,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();
  assert.equal(field('PaperMode'),null,'custom settings have no roll/sheet mode selector');
  assert.equal(field('CustomStock').hidden,false,'custom controls remain available');
  field('StockPredefined').checked=true;field('StockPredefined').dispatchEvent(new w.Event('change'));
  assert.equal(field('PaperMode'),null,'predefined stock mode also has no roll/sheet mode selector');
  assert.equal(field('PredefinedStock').hidden,false,'predefined stock controls are shown');
  field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));
  assert.equal(field('PaperMode'),null,'returning to custom mode does not recreate the removed choices');
  assert.equal(field('CustomStock').hidden,false);
  dom.window.close();
});

test('New Label wizard skips Label Layout and reaches Template Size after Printed Item Shape',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));field('Next').click();field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Stock Selection');
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Items Per Page');
  assert.match(dialog.querySelector('.nw-items-help').textContent,/Most media has only a single item/i);
  assert.equal(field('SingleItem').checked,true);
  assert.equal(field('ItemCounts').disabled,true);
  assert.equal(field('Preview').parentElement.hidden,false,'Items Per Page keeps its own preview available');
  field('MultipleItems').checked=true;field('MultipleItems').dispatchEvent(new w.Event('change'));
  assert.equal(field('ItemCounts').disabled,false);
  field('Rows').value='2';field('Columns').value='3';
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Side Edges');
  assert.match(dialog.querySelector('.nw-heading p').textContent,/characteristics of the sides/i);
  assert.equal(field('Rows').closest('section').id,'nwItemsPerPage','row/column controls only appear on Items Per Page');
  assert.equal(field('Finish').disabled,true,'Finish remains disabled on Side Edges');
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Printed Item Shape');
  assert.ok(dialog.querySelector('#nwStartingPreview'),'stock preview rendering preserves the wizard preview slot');
  assert.equal(field('PrintedShapeRounded').checked,true);
  assert.equal(field('Finish').disabled,false,'Finish is available on Printed Item Shape');
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Template Size');
  assert.match(dialog.querySelector('.nw-heading p').textContent,/Specify the size of your item/i);
  assert.equal(field('TemplateSizePreset').value,'4x4','custom stock keeps the default 4 x 4 template preset on Template Size');
  assert.match(dialog.querySelector('.nw-template-note').textContent,/Do not include any of the unused area surrounding the item/i);
  assert.equal(field('Finish').disabled,true,'Finish remains disabled on Template Size');
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Template Background');
  assert.equal(field('Finish').disabled,true);
  assert.equal(field('BackgroundColor').disabled,true);
  assert.equal(w.getComputedStyle(field('BackgroundColor')).display,'none');
  assert.equal(w.getComputedStyle(field('BackgroundPicture')).display,'none');
  assert.equal(w.getComputedStyle(field('BackgroundGuide')).display,'none');
  assert.match(dialog.querySelector('.nw-template-background').textContent,/scanned image of a sample printed item/i);
  // v1.238: ticking only selects a feature; each ticked feature gets its own page after this one.
  const chooserClicks={BackgroundColor:0,BackgroundPicture:0,BackgroundGuide:0};
  for(const id of Object.keys(chooserClicks))field(id).click=()=>{chooserClicks[id]++;};
  for(const id of ['BackgroundColorEnabled','BackgroundPictureEnabled','BackgroundGuideEnabled'])field(id).click();
  for(const id of ['BackgroundColorEnabled','BackgroundPictureEnabled','BackgroundGuideEnabled'])assert.equal(field(id).checked,true);
  assert.deepEqual(chooserClicks,{BackgroundColor:0,BackgroundPicture:0,BackgroundGuide:0},'ticking does not open a native chooser');
  for(const id of ['BackgroundColor','BackgroundPicture','BackgroundGuide']){assert.equal(w.getComputedStyle(field(id)).display,'none');}
  for(const id of ['BackgroundColorEnabled','BackgroundPictureEnabled','BackgroundGuideEnabled'])dialog.querySelector('#nw'+id).parentElement.querySelector('span').click();
  for(const id of ['BackgroundColorEnabled','BackgroundPictureEnabled','BackgroundGuideEnabled'])assert.equal(field(id).checked,false,'clicking an option name toggles it like any label and opens nothing');
  assert.deepEqual(chooserClicks,{BackgroundColor:0,BackgroundPicture:0,BackgroundGuide:0});
  assert.equal(dialog.querySelector('#nwPreview [data-paper-continuation]'),null,'background preview shows one sheet');
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Finished!');
  assert.match(field('FinishedSize').textContent,/4 x 4 in/i);
  assert.equal(dialog.querySelector('#nwPreview [data-paper-continuation]'),null,'finished preview shows one sheet');
  await dialog.querySelector('form').onsubmit({preventDefault(){}});
  assert.equal(w.createdTemplate.page.columns,3);
  assert.equal(w.createdTemplate.page.rows,2);
  dom.window.close();
});

test('Printed Item Shape follows Side Edges, updates shape preview, and saves the selected shape',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  for(const file of ['stock-catalog','stock-apply','stock-preview'])w.eval(require('node:fs').readFileSync(require.resolve('../gui/'+file),'utf8'));
  w.mmToUnit=(value,unit)=>unit==='in'?value/25.4:value;
  w.eval(require('node:fs').readFileSync(require.resolve('../gui/modal-preview'),'utf8'));
  const renderPaperPreview=w.PaperPreview.render.bind(w.PaperPreview),shapePreviewTemplates=[];
  w.PaperPreview.render=(...args)=>{if(args[5]==='Printed Item Shape')shapePreviewTemplates.push(args[1]);return renderPaperPreview(...args);};
  w.openNewLabelWizard();await tick();field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));for(let i=0;i<4;i++)field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Side Edges');
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Printed Item Shape');
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Template Size');
  assert.equal(field('PrintedShapeRounded').checked,true,'rounded rectangle is the default shape');
  const printerArt=dialog.querySelector('.nw-orientation-printer');
  assert.equal(printerArt.dataset.orientation,'0');
  field('OrientLandscape').click();assert.equal(printerArt.dataset.orientation,'90');
  field('OrientPortrait180').click();assert.equal(printerArt.dataset.orientation,'180');
  field('OrientLandscape180').click();assert.equal(printerArt.dataset.orientation,'270');
  field('OrientPortrait').click();
  field('MirrorImage').click();assert.equal(printerArt.dataset.mirror,'true');
  field('Negative').click();assert.equal(printerArt.dataset.negative,'true');
  assert.match(printerArt.innerHTML,/fill="#111"/,'negative darkens the paper in the printer preview');
  assert.ok(Number(field('Preview').querySelector('clipPath rect')?.getAttribute('rx'))>0,'preview displays the default rounded item shape');
  assert.equal(shapePreviewTemplates.at(-1).corner_radius_mm,3.175,'rounded preview uses a subtle 0.125 in corner on a 4 × 4 in item');
  const continuation=field('Preview').querySelector('[data-paper-continuation]');
  assert.equal(continuation?.getAttribute('data-paper-style'),'bartender','template wizard uses the soft BarTender roll preview');
  assert.ok(field('Preview').querySelector('[data-paper-sliver="top"]'),'preview draws upper roll slivers like BarTender');
  assert.equal(field('Preview').querySelector('[data-paper-rails]'),null,'BarTender template preview omits mechanical side rails');
  const topSliver=field('Preview').querySelector('[data-paper-sliver="top"]'),cell=field('Preview').querySelector('[data-preview-cell]');
  assert.equal(topSliver?.getAttribute('x'),cell?.getAttribute('x'),'roll slivers align with the printed item width');
  assert.equal(topSliver?.getAttribute('width'),cell?.getAttribute('width'),'roll slivers match the label cell width');
  assert.ok(Number(topSliver?.getAttribute('rx'))>0,'top and bottom slivers follow the rounded label corners');
  const viewBox=field('Preview').getAttribute('viewBox')||'';
  assert.notEqual(viewBox,'0 0 250 340','wizard preview zooms the roll stack inside the gradient pane');
  field('Unit').value='mm';field('Unit').dispatchEvent(new w.Event('change'));
  field('Width').value='51';field('Width').dispatchEvent(new w.Event('input',{bubbles:true}));
  field('Height').value='25';field('Height').dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.equal(shapePreviewTemplates.at(-1).corner_radius_mm,0.78125,'rounded preview scales the subtle corner with smaller items');
  assert.equal(field('Preview').querySelector('[data-gap-label]'),null,'Printed Item Shape preview does not show Stock gap annotations');
  assert.equal(field('Preview').querySelector('[data-die-cut-guides]'),null,'Printed Item Shape preview does not show Stock die-cut annotations');
  field('PrintedShapeRectangle').checked=true;field('PrintedShapeRectangle').dispatchEvent(new w.Event('change'));
  assert.equal(Number(field('Preview').querySelector('clipPath rect')?.getAttribute('rx')||0),0,'preview updates immediately to a rectangle');
  field('PrintedShapeEllipse').checked=true;field('PrintedShapeEllipse').dispatchEvent(new w.Event('change'));
  assert.ok(field('Preview').querySelector('clipPath ellipse'),'preview updates immediately to an ellipse');
  field('PrintedShapeCircle').checked=true;field('PrintedShapeCircle').dispatchEvent(new w.Event('change'));
  assert.ok(field('Preview').querySelector('clipPath circle'),'circle is drawn as a circular label preview');
  await dialog.querySelector('form').onsubmit({preventDefault(){}});
  assert.equal(w.createdTemplate.label_shape,'circle','circle persists as a distinct item shape');
  dom.window.close();
});

test('wizard tuning preview keeps caption outside the gradient pane and hides the inner stock sheet',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.mmToUnit=(value,unit)=>unit==='in'?value/25.4:value;
  w.eval(require('node:fs').readFileSync(require.resolve('../gui/modal-preview'),'utf8'));
  w.openNewLabelWizard();await tick();field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));for(let i=0;i<4;i++)field('Next').click();
  const aside=field('Preview').parentElement,svg=aside.querySelector('svg'),size=aside.querySelector('small');
  assert.ok(svg&&size,'Side Edges preview renders SVG and caption');
  assert.ok(svg.compareDocumentPosition(size)&w.Node.DOCUMENT_POSITION_FOLLOWING,'caption sits below the preview SVG');
  const sheet=svg.querySelector(':scope > rect:nth-of-type(2)');
  assert.equal(sheet?.getAttribute('fill'),'none','inner stock sheet is not painted over the gradient');
  assert.equal(sheet?.getAttribute('stroke'),'none');
  const backdrop=svg.querySelector('[data-reference-background]');
  assert.equal(backdrop?.getAttribute('fill'),`url(#${backdrop.dataset.gradientId})`,'Side Edges preview uses the requested blue backdrop');
  assert.equal(svg.querySelector('[data-reference-liner]')?.getAttribute('fill'),'#e9e9e9','liner and gap remain grey');
  for(let i=0;i<2;i++)field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Template Size');
  assert.equal(dialog.querySelectorAll('.nw-template-unit').length,0,'Template Size does not duplicate in/mm beside the width and height fields');
  assert.equal(field('TemplateSizePreset').value,'4x4','custom template size defaults to the 4 x 4 preset');
  assert.deepEqual([...field('TemplateSizePreset').options].map(option=>option.textContent),['User Defined Size','2 x 4','4 x 4','4 x 6']);
  assert.equal(field('Width').value,'4','custom template width defaults to 4 in');
  assert.equal(field('Height').value,'4');
  assert.equal(field('Width').step,'0.1');
  assert.equal(field('Width').min,'0.1');
  field('Width').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));
  assert.equal(field('Width').value,'4.1','template width arrow up advances by 0.1 in');
  field('Width').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
  field('Width').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
  assert.equal(field('Width').value,'3.9');
  field('Width').value='0.05';field('Width').dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.equal(field('Width').value,'0.1','template width cannot go below 0.1');
  field('TemplateSizePreset').value='4x4';field('TemplateSizePreset').dispatchEvent(new w.Event('change'));
  field('TemplateSizePreset').value='2x4';field('TemplateSizePreset').dispatchEvent(new w.Event('change'));
  assert.equal(field('Width').value,'2');assert.equal(field('Height').value,'4');
  field('Width').value='3';field('Width').dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.equal(field('TemplateSizePreset').value,'user','manual width edits switch back to user defined size');
  const templateAside=field('Preview').parentElement,templateSvg=field('Preview');
  assert.equal(w.getComputedStyle(templateAside).backgroundColor,'rgba(0, 0, 0, 0)','Template Size caption area stays outside the dark preview');
  assert.equal(templateSvg.dataset.wizardPreviewStyle,'bartender','Template Size uses the shared BarTender geometry');
  assert.equal(templateSvg.querySelector('radialGradient'),null,'workspace has no radial gradient');
  assert.match(templateSvg.querySelector('[data-reference-background]')?.getAttribute('fill'),/^url\(#/,'rounded template uses the blue backdrop');
  assert.equal(templateSvg.querySelector('[data-paper-continuation]')?.getAttribute('data-paper-style'),'bartender');
  dom.window.close();
});

test('Side Edges matches the native yes/no states, previews the stock edges, and saves them separately from page margins',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600})),previews=[];
  w.PaperPreview={render(target,template,unit,_artwork,_workspace,section){previews.push({template:JSON.parse(JSON.stringify(template)),unit,section});target.innerHTML='<svg></svg><small></small>';}};
  w.openNewLabelWizard();await tick();field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));for(let i=0;i<4;i++)field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Side Edges');
  assert.equal(field('Finish').disabled,true,'Finish is disabled on Side Edges');
  assert.equal(field('Next').disabled,false);
  assert.ok(dialog.querySelector('.nw-u')?.textContent==='L','Left shows an underlined access key');
  assert.equal(field('SideEdgesYes').checked,true,'Yes is the default Side Edges state');
  assert.equal(field('EdgeWidths').disabled,false);assert.equal(field('EdgeLeft').matches(':disabled'),false);assert.equal(field('EdgeRight').matches(':disabled'),false);
  assert.equal(field('Unit').value,'in','the wizard defaults to inches like BarTender');
  assert.ok(Math.abs(Number(field('EdgeLeft').value)-0.05)<1e-9,'the default left edge is 0.05 in');
  assert.ok(Math.abs(Number(field('EdgeRight').value)-0.05)<1e-9,'the default right edge is 0.05 in');
  assert.match(dialog.querySelector('.nw-edge-unit')?.textContent||'',/in/i);
  assert.equal(previews.at(-1).section,'Stock','the preview renders the material edges on the Side Edges page');
  assert.ok(Math.abs(previews.at(-1).template.stock.liner_left_mm-1.27)<1e-9);
  field('Unit').value='mm';field('Unit').dispatchEvent(new w.Event('change'));
  assert.ok(Math.abs(Number(field('EdgeLeft').value)-1.27)<1e-6,'side-edge dimensions convert with the selected unit');
  field('SideEdgesNo').checked=true;field('SideEdgesNo').dispatchEvent(new w.Event('change'));
  assert.equal(field('EdgeWidths').disabled,true);assert.equal(field('EdgeLeft').matches(':disabled'),true);assert.equal(field('EdgeLeft').value,'0');
  field('Next').click();
  await dialog.querySelector('form').onsubmit({preventDefault(){}});
  assert.ok(w.createdTemplate,`Finish should create the label; error: ${field('Error').textContent}; invalid: ${[...dialog.querySelectorAll(':invalid')].map(input=>`${input.id}=${input.value}`).join(', ')}`);
  assert.equal(w.createdTemplate.stock.liner_left_mm,0,'No stores no unused side material');
  assert.equal(w.createdTemplate.stock.liner_right_mm,0);
  assert.equal(w.createdTemplate.page.left_mm,0,'side edges do not become label placement margins');
  assert.equal(w.createdTemplate.page.right_mm,0);
  dom.window.close();
});

test('enabled Side Edges persist measured left/right widths without changing the label margins',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));for(let i=0;i<4;i++)field('Next').click();
  field('SideEdgesYes').checked=true;field('SideEdgesYes').dispatchEvent(new w.Event('change'));
  field('Unit').value='in';field('Unit').dispatchEvent(new w.Event('change'));
  field('EdgeLeft').value='0.05';field('EdgeLeft').dispatchEvent(new w.Event('input'));
  field('EdgeRight').value='0.08';field('EdgeRight').dispatchEvent(new w.Event('input'));
  field('Next').click();
  await dialog.querySelector('form').onsubmit({preventDefault(){}});
  assert.ok(w.createdTemplate,`Finish should create the label; error: ${field('Error').textContent}`);
  assert.ok(Math.abs(w.createdTemplate.stock.liner_left_mm-1.27)<1e-9);
  assert.ok(Math.abs(w.createdTemplate.stock.liner_right_mm-2.032)<1e-9);
  assert.equal(w.createdTemplate.page.left_mm,0);
  assert.equal(w.createdTemplate.page.right_mm,0);
  dom.window.close();
});

test('New Label printer selection shows a multi-row installed printer list',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  const printerList=w.document.getElementById('printerSelect');
  for(const name of ['AnyDesk Printer','HP Universal Printing PCL 6','Microsoft Print to PDF','ZDesigner ZT411-600dpi ZPL']){
    const option=w.document.createElement('option');option.value=option.textContent=name;printerList.append(option);
  }
  printerList.value='HP Universal Printing PCL 6';
  w.openNewLabelWizard();await tick();field('Next').click();
  assert.equal(field('Printer').size,8,'printer choices are visible as a multi-row list');
  assert.equal(field('Printer').multiple,false,'the user still chooses one printer');
  assert.equal(field('Printer').options.length,6,'all installed printers from the source selector are retained');
  assert.equal(field('Printer').value,'HP Universal Printing PCL 6','current selected printer remains selected');
  assert.ok(dialog.querySelector('#nwDocumentProperties'));
  assert.ok(dialog.querySelector('#nwPrinterProperties'));
  const picker=dialog.querySelector('.nw-printer-picker'),view=dialog.ownerDocument.defaultView;
  assert.ok(Number.parseFloat(view.getComputedStyle(picker).paddingRight)>=10,'printer picker keeps right padding before the modal edge');
  assert.ok(Number.parseFloat(view.getComputedStyle(dialog.querySelector('.nw-printer-actions')).maxWidth)<=178,'property buttons stay in a narrower action column');
  dom.window.close();
});

test('New Label wizard refreshes printers from listPrinters when the toolbar list is stale',async()=>{
  const {dom,w,field}=wizardHarness(async()=>({dpi:600}));
  const printerList=w.document.getElementById('printerSelect');
  printerList.replaceChildren(Object.assign(w.document.createElement('option'),{value:'ZDesigner ZT411-600dpi ZPL',textContent:'ZDesigner ZT411-600dpi ZPL'}));
  w.zebra.listPrinters=async()=>['AnyDesk Printer','HP Universal Printing PCL 6','Microsoft Print to PDF','ZDesigner ZT411-600dpi ZPL'];
  w.openNewLabelWizard();await tick();field('Next').click();await tick();await tick();
  assert.equal(field('Printer').options.length,4,'async enumeration replaces a one-queue toolbar snapshot');
  assert.equal(field('Printer').value,'ZDesigner ZT411-600dpi ZPL');
  assert.equal(field('DocumentProperties').disabled,false,'property actions enable when a queue is selected');
  assert.equal(field('PrinterProperties').disabled,false);
  dom.window.close();
});

test('New Label wizard advances on printer double-click when the queue reports DPI',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();field('Next').click();await tick();
  field('Printer').value='Zebra ZT411 (600 dpi)';field('Printer').dispatchEvent(new w.Event('change'));await tick();
  field('Printer').dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true}));await tick();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Stock Selection','double-clicking a printer with DPI advances immediately');
  dom.window.close();
});

test('New Label wizard does not advance on a single printer click',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();field('Next').click();await tick();
  field('Printer').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Select the Printer','a single click only selects the printer');
  dom.window.close();
});

test('New Label wizard advances on predefined stock double-click',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  w.openNewLabelWizard();await tick();field('Next').click();await tick();field('Next').click();await tick();
  field('StockPredefined').checked=true;field('StockPredefined').dispatchEvent(new w.Event('change'));
  field('StockCategory').value='ADES AG';field('StockCategory').dispatchEvent(new w.Event('change'));
  field('StockList').dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true}));await tick();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Items Per Page','double-clicking a stock row advances immediately');
  dom.window.close();
});

test('New Label printer property buttons open native preferences and properties for the selected printer',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  const requests=[];
  w.zebra.printerProperties=async payload=>{requests.push(payload);return{ok:true};};
  w.openNewLabelWizard();await tick();
  field('Printer').value='Zebra ZT411 (600 dpi)';field('Printer').dispatchEvent(new w.Event('change'));await tick();
  field('DocumentProperties').click();await tick();
  field('PrinterProperties').click();await tick();
  assert.deepEqual(JSON.parse(JSON.stringify(requests)),[
    {name:'Zebra ZT411 (600 dpi)',preferences:true},
    {name:'Zebra ZT411 (600 dpi)',preferences:false}
  ]);
  assert.equal(dialog.open,true,'opening a driver dialog keeps the wizard available');
  dom.window.close();
});

test('New Label Finish opens an unsaved draft without creating a file or recent project',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  let writes=0,marked=0;w.zebra.createTemplate=async()=>{writes++;throw Error('Finish must not write');};w.markNewLabelDraft=()=>marked++;
  w.openNewLabelWizard();await tick();
  await dialog.querySelector('form').onsubmit({preventDefault(){}});
  assert.equal(writes,0);assert.equal(marked,1);assert.equal(w.current.file,null);assert.equal(w.createdTemplate.name,'new-label');
  assert.equal(w.rawTemplate,null,'there is no saved baseline for a new draft');
  assert.equal(w.projectPrinter,undefined);assert.equal(w.recentFile,undefined);assert.equal(dialog.open,false);assert.equal(field('Error').textContent,'');
  assert.equal(w.createdTemplate.stock.name,undefined,'default custom settings do not invent a selected stock name');
  dom.window.close();
});

test('opening New Label asks about a dirty document before showing the wizard and Cancel preserves it',async()=>{
  const {dom,w,dialog}=wizardHarness(async()=>({dpi:600}));let asks=0;w.getCloseState=()=>({dirty:true});w.prepareEditorNavigation=async()=>{asks++;return false;};
  await w.openNewLabelWizard();assert.equal(asks,1);assert.equal(dialog.open,false);assert.equal(w.current.file,'old.json');
  w.prepareEditorNavigation=async()=>true;await w.openNewLabelWizard();assert.equal(dialog.open,true);dom.window.close();
});

test('Printer startup omits the placeholder and chooses the saved or first available printer',async()=>{
  const fs=require('node:fs'),source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');
  const run=async(saved,printers)=>{
    const dom=new JSDOM('<!doctype html><html><body><select id="printerSelect"></select></body></html>',{runScripts:'dangerously'}),w=dom.window,saves=[];
    w.settings=saved?{printer:saved}:{};w.current=null;w.ProjectPrinterSelection=require('../gui/project-printer-selection');w.el=()=>w.document.getElementById('printerSelect');w.zebra={listPrinters:async()=>printers,saveSettings:async value=>saves.push(value)};w.updateConnSummary=()=>{};
    const start=source.indexOf("  const sel = el('printerSelect');",source.indexOf('async function init()'));
    const end=source.indexOf("  if (settings.connType)",start);
    w.eval(source.slice(start,end));
    const listStart=source.indexOf('  void window.zebra.listPrinters().then(printers=>{',end);
    const listEnd=source.indexOf("  el('newTemplateBtn')",listStart);
    w.eval(`const sel=el('printerSelect');${source.slice(listStart,listEnd)}`);await tick();
    const values=[...w.el('printerSelect').options].map(option=>option.value);
    const selected=w.el('printerSelect').value;dom.window.close();return{values,selected,saves};
  };
  const fallback=await run('', ['Zebra ZT610 (600 dpi)','Zebra ZT411 (600 dpi)']);
  assert.deepEqual(fallback.values,['Zebra ZT610 (600 dpi)','Zebra ZT411 (600 dpi)']);
  assert.equal(fallback.selected,'Zebra ZT610 (600 dpi)');
  assert.deepEqual(JSON.parse(JSON.stringify(fallback.saves)),[{printer:'Zebra ZT610 (600 dpi)'}]);
  const saved=await run('Zebra ZT411 (600 dpi)',['Zebra ZT610 (600 dpi)','Zebra ZT411 (600 dpi)']);
  assert.equal(saved.selected,'Zebra ZT411 (600 dpi)','an installed saved printer takes precedence');
});
test('New Label wizard hides the Resolution UI and automatically stores DPI from the selected driver',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async name=>({dpi:name.includes('ZT610')?608:203,source:'windows-driver'}));
  w.openNewLabelWizard();await tick();
  assert.equal(dialog.querySelector('#nwDpi'),null,'the printer step has no Resolution row or status');
  assert.doesNotMatch(dialog.querySelector('section').textContent,/Resolution/i,'resolution is not shown on the printer step');
  assert.equal(field('Language'),null,'the selected printer determines the language without a separate choice');
  assert.equal(field('Next').disabled,false,'the wizard advances once the driver resolution is available');
  for(let i=0;i<8;i++)field('Next').click();
  assert.doesNotMatch(field('FinishedPage').textContent,/Resolution/i,'the finished page does not show a separate resolution row');
  assert.match(field('FinishedPrinter').textContent,/ZT610/i,'selected printer appears on the finished page');
  dialog.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
  assert.ok(w.createdTemplate,`wizard should create the template; error: ${field('Error').textContent}`);
  assert.equal(w.createdTemplate.dpi,608,'the driver-reported DPI is saved into the new template');
  assert.equal(w.createdTemplate.language,'zpl','removing the language choice preserves the internal ZPL document default');
  dom.window.close();
});

test('predefined stock category follows the selected printer (OneNote to AOne, Zebra to Standard Card Sizes)',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:600}));
  const aoneStock={manufacturer:'AOne',name:'28171 - Address Label',width_mm:90.0424,height_mm:42.2912,paper_width_mm:210.0072,paper_height_mm:297.0022,columns:2,rows:6,margin_top_mm:12.7,margin_left_mm:4.7625,margin_right_mm:4.7625,margin_bottom_mm:12.7,gap_x_mm:0,gap_y_mm:0,orientation:0,printer_type:'Page'};
  const cardStock={manufacturer:'Standard Card Sizes',name:'CR50',width_mm:85.6,height_mm:54,paper_width_mm:85.6,paper_height_mm:54,columns:1,rows:1,margin_top_mm:0,margin_left_mm:0,margin_right_mm:0,margin_bottom_mm:0,gap_x_mm:0,gap_y_mm:0,orientation:0,printer_type:'Card'};
  w.QLabelStockCatalog.getManufacturers=()=>['AOne','Standard Card Sizes'];
  w.QLabelStockCatalog.getStocks=manufacturer=>manufacturer==='AOne'?[aoneStock]:manufacturer==='Standard Card Sizes'?[cardStock]:[];
  w.QLabelStockCatalog.getStock=(manufacturer,name)=>manufacturer==='AOne'&&name===aoneStock.name?aoneStock:manufacturer==='Standard Card Sizes'&&name===cardStock.name?cardStock:null;
  const printerSelect=w.document.getElementById('printerSelect');
  printerSelect.append(Object.assign(w.document.createElement('option'),{value:'OneNote (Desktop)',textContent:'OneNote (Desktop)'}));
  field('Printer').append(Object.assign(w.document.createElement('option'),{value:'OneNote (Desktop)',textContent:'OneNote (Desktop)'}));
  w.openNewLabelWizard();await tick();field('Next').click();field('Printer').value='OneNote (Desktop)';await field('Printer').onchange();field('Next').click();
  field('StockPredefined').checked=true;field('StockPredefined').dispatchEvent(new w.Event('change'));
  assert.equal(field('StockCategory').value,'AOne','page printers such as OneNote start in AOne like BarTender');
  field('Back').click();field('Printer').value='Zebra ZT610 (600 dpi)';await field('Printer').onchange();field('Next').click();
  assert.equal(field('StockCategory').value,'Standard Card Sizes','changing to Zebra updates the default category for predefined stock');
  dom.window.close();
});

test('New Label wizard uses Stock Selection and Items Per Page to apply a predefined stock',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:608,source:'windows-driver'}));
  w.openNewLabelWizard();await tick();field('Next').click();field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Stock Selection');
  field('StockPredefined').checked=true;field('StockPredefined').dispatchEvent(new w.Event('change'));
  assert.equal(field('StockPredefined').checked,true);
  assert.equal(field('StockCategory').disabled,false);
  assert.equal(field('StockList').disabled,false);
  assert.ok([...field('StockCategory').options].every(option=>option.value.trim()!==''),'predefined category dropdown contains only named categories');
  assert.match(dialog.querySelector('.nw-stock-help').textContent,/size of the page/i);
  assert.equal(dialog.querySelectorAll('.nw-stock-mode input[type="radio"]').length,2,'stock mode presents only custom and predefined choices');
  assert.equal(field('StockCategory').value,'ADES AG');
  assert.ok([...field('StockList').options].some(option=>option.value==='49908'));
  assert.equal(field('StockList').size,8,'stock names use a visible list like the reference wizard');
  assert.equal(field('Preview').parentElement.hidden,false,'predefined stock selection keeps its preview visible');
  assert.equal(field('Preview').parentElement.hidden,false,'the selected stock geometry is drawn in the visible preview pane');
  field('StockList').value='49908';field('StockList').dispatchEvent(new w.Event('change'));
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Items Per Page');
  assert.equal(field('SingleItem').checked,true,'the 1×1 stock selects Single item per page');
  field('Next').click();field('Next').click();
  assert.ok(Math.abs(Number(field('Width').value)-89.9922/25.4)<0.0001,'stock label width is applied to the dimension step in inches');
  assert.ok(Math.abs(Number(field('Height').value)-49.9872/25.4)<0.0001,'stock label height is applied to the dimension step in inches');
  field('Next').click();field('Next').click();dialog.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
  assert.equal(w.createdTemplate.stock.name,'49908');
  assert.equal(w.createdTemplate.stock.manufacturer,'ADES AG');
  assert.ok(Math.abs(w.createdTemplate.width_mm-89.9922)<0.0001,'selected stock dimensions are saved without rounding');
  dom.window.close();
});

test('predefined sheet stock applies its multi-item page geometry on Items Per Page',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({dpi:608}));
  const stock={manufacturer:'Paper Co',name:'A4 Labels',width_mm:40,height_mm:20,paper_width_mm:210,paper_height_mm:297,columns:2,rows:4,margin_top_mm:12,margin_left_mm:15,margin_right_mm:15,margin_bottom_mm:12,gap_x_mm:5,gap_y_mm:4,orientation:0,printer_type:'Sheet'};
  w.QLabelStockCatalog.getManufacturers=()=>['Paper Co'];
  w.QLabelStockCatalog.getStocks=()=>[stock];
  w.QLabelStockCatalog.getStock=()=>stock;
  w.openNewLabelWizard();await tick();field('Next').click();field('Next').click();
  field('StockPredefined').checked=true;field('StockPredefined').dispatchEvent(new w.Event('change'));
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Stock Selection');
  assert.equal(field('StockList').value,'A4 Labels');
  field('Next').click();
  assert.equal(dialog.querySelector('.nw-heading strong').textContent,'Items Per Page');
  assert.equal(field('MultipleItems').checked,true,'a 2×4 stock selects Multiple items per page');
  assert.equal(field('Rows').value,'4');assert.equal(field('Columns').value,'2');
  field('Next').click();field('Next').click();field('Next').click();field('Next').click();
  dialog.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
  assert.equal(w.createdTemplate.page.width_mm,210);
  assert.equal(w.createdTemplate.page.height_mm,297);
  assert.equal(w.createdTemplate.page.columns,2);
  assert.equal(w.createdTemplate.page.rows,4);
  dom.window.close();
});

test('New Label wizard blocks progress and reports an error when driver DPI cannot be read',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({error:'Printer driver did not report a valid resolution.'}));
  w.openNewLabelWizard();await tick();field('Next').click();await tick();
  const pdf=w.document.createElement('option');pdf.value=pdf.textContent='Microsoft Print to PDF';field('Printer').append(pdf);
  field('Printer').value='Microsoft Print to PDF';
  await field('Printer').onchange();
  assert.equal(field('Next').disabled,true,'the wizard cannot proceed without a driver DPI');
  assert.match(field('Error').textContent,/resolution/i,'the wizard explains that driver resolution could not be read');
  assert.equal(dialog.querySelector('#nwDpi'),null,'unavailable driver DPI is not shown as a Resolution field');
  assert.equal(dialog.open,true,'the wizard remains open for the user to choose another printer');
  dialog.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
  assert.equal(w.createdTemplate,undefined,'Finish cannot create a template without a driver DPI');
  dom.window.close();
});

test('New Label wizard can advance with the selected printer DPI while showing stale-main guidance',async()=>{
  const {dom,w,dialog,field}=wizardHarness(async()=>({code:'APP_RESTART_REQUIRED',dpi:600,source:'printer-name-fallback',notice:'Using the selected queue nominal DPI of 600 while driver support loads. Please save your label and restart Q LABEL once.'}));
  w.openNewLabelWizard();await tick();
  assert.equal(field('Next').disabled,false,'the available printer DPI keeps Next enabled while the driver IPC restarts');
  assert.equal(field('Error').textContent,'','stale IPC does not show a red error');
  const notice=dialog.querySelector('#nwDriverNotice');
  assert.match(notice.textContent,/restart Q LABEL/i);
  assert.equal(notice.hidden,false);
  field('Next').click();await tick();for(let i=0;i<8;i++)field('Next').click();
  dialog.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
  assert.ok(w.createdTemplate,`wizard should create the template; error: ${field('Error').textContent}`);
  assert.equal(w.createdTemplate.dpi,600,'the wizard finishes using the numeric resolution advertised by the selected printer queue');
  dom.window.close();
});

test('changing the printer selection does not briefly disable Next while driver DPI loads',async()=>{
  let resolveFirst;
  const {dom,w,field}=wizardHarness(name=>name.includes('ZT610')?new Promise(resolve=>{resolveFirst=resolve;}):Promise.resolve({dpi:203}));
  w.openNewLabelWizard();await tick();field('Next').click();await tick();
  assert.equal(field('Next').disabled,false,'Next is enabled once the initial printer DPI is known');
  const printer=field('Printer');
  printer.value='Zebra ZT610 (600 dpi)';
  printer.dispatchEvent(new w.Event('change'));
  assert.equal(field('Next').disabled,false,'Next stays enabled while the new printer DPI request is in flight');
  resolveFirst({dpi:608});await tick();
  assert.equal(field('Next').disabled,false,'Next remains enabled after the driver response arrives');
  dom.window.close();
});

test('New Label wizard ignores a late DPI response after the printer selection changes',async()=>{
  let finishFirst;
  const {dom,w,dialog,field}=wizardHarness(name=>name.includes('ZT610')?new Promise(resolve=>{finishFirst=resolve;}):Promise.resolve({dpi:203}));
  w.openNewLabelWizard();
  field('Next').click();
  const printer=field('Printer');printer.value='Zebra ZT411 (600 dpi)';printer.dispatchEvent(new w.Event('change'));await tick();
  assert.equal(field('Next').disabled,false,'the new printer has a valid driver DPI');
  finishFirst({dpi:608});await tick();
  for(let i=0;i<8;i++)field('Next').click();
  dialog.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
  assert.ok(w.createdTemplate,`wizard should create the template; error: ${field('Error').textContent}`);
  assert.equal(w.createdTemplate.dpi,203,'an older response cannot overwrite the current printer DPI saved in the template');
  dom.window.close();
});





test('Side Edges updates template width from the original media width and rejects oversize edges',async()=>{
 const {dom,w,field}=wizardHarness(async()=>({dpi:600}));w.openNewLabelWizard();await tick();field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));for(let i=0;i<4;i++)field('Next').click();
 const change=(id,value)=>{field(id).value=value;field(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 assert.equal(Number(field('Width').value),4);change('EdgeLeft','1.05');assert.equal(Number(field('Width').value),3);change('EdgeRight','1.05');assert.equal(Number(field('Width').value),2);assert.match(field('Size').textContent,/2 x 4/);
 change('EdgeRight','4');field('Next').click();assert.match(field('Error').textContent,/side edges|width/i);assert.equal(w.document.querySelector('.nw-heading strong').textContent,'Side Edges');change('EdgeRight','1.05');assert.equal(Number(field('Width').value),2);
 field('Unit').value='mm';field('Unit').dispatchEvent(new w.Event('change'));assert.ok(Math.abs(Number(field('Width').value)-50.8)<.01);field('SideEdgesNo').checked=true;field('SideEdgesNo').dispatchEvent(new w.Event('change'));assert.ok(Math.abs(Number(field('Width').value)-104.14)<.01);field('SideEdgesYes').checked=true;field('SideEdgesYes').dispatchEvent(new w.Event('change'));assert.ok(Math.abs(Number(field('Width').value)-50.8)<.01);
 field('Next').click();await w.document.querySelector('#newLabelWizard form').onsubmit({preventDefault(){}});assert.ok(w.createdTemplate);assert.ok(Math.abs(w.createdTemplate.width_mm-50.8)<.01);assert.ok(Math.abs(w.createdTemplate.stock.liner_left_mm-26.67)<.01);assert.equal(w.createdTemplate.label_shape,'rounded');dom.window.close();
});

test('side edges distribute width change across multiple columns and preserve media width',async()=>{
 const {dom,w,field}=wizardHarness(async()=>({dpi:600}));w.openNewLabelWizard();await tick();field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));for(let i=0;i<3;i++)field('Next').click();field('MultipleItems').checked=true;field('MultipleItems').dispatchEvent(new w.Event('change'));field('Columns').value='2';field('Rows').value='1';field('Next').click();
 for(const id of ['EdgeLeft','EdgeRight']){field(id).value='1.05';field(id).dispatchEvent(new w.Event('input',{bubbles:true}));}assert.ok(Math.abs(Number(field('Width').value)-3)<.001,'two extra inches are shared by two labels');dom.window.close();
});


test('invalid side edges immediately block navigation and finish until corrected',async()=>{
 const {dom,w,field}=wizardHarness(async()=>({dpi:600}));w.openNewLabelWizard();await tick();field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));for(let i=0;i<4;i++)field('Next').click();
 const input=(id,value)=>{field(id).value=value;field(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 input('EdgeLeft','5.05');assert.match(field('Error').textContent,/side edges|width/i);assert.equal(field('Next').disabled,true);field('Next').click();assert.equal(w.document.querySelector('.nw-heading strong').textContent,'Side Edges');
 await w.document.querySelector('#newLabelWizard form').onsubmit({preventDefault(){}});assert.equal(w.createdTemplate,undefined);assert.equal(w.document.querySelector('.nw-heading strong').textContent,'Side Edges');
 input('EdgeLeft','0.05');assert.equal(field('Next').disabled,false);assert.equal(field('Error').textContent,'');field('Next').click();assert.equal(w.document.querySelector('.nw-heading strong').textContent,'Printed Item Shape');dom.window.close();
});


test('default ellipse uses 4.1 by 4 inches without changing custom sizes',async()=>{
 const {dom,w,field}=wizardHarness(async()=>({dpi:600}));w.openNewLabelWizard();await tick();field('StockCustom').checked=true;field('StockCustom').dispatchEvent(new w.Event('change'));for(let i=0;i<5;i++)field('Next').click();
 field('PrintedShapeEllipse').click();assert.equal(Number(field('Width').value),4.1);assert.equal(Number(field('Height').value),4);assert.match(field('Size').textContent,/4\.1 x 4 in/);
 field('PrintedShapeRounded').click();assert.equal(Number(field('Width').value),4);field('Width').value='3';field('Width').dispatchEvent(new w.Event('input',{bubbles:true}));field('PrintedShapeEllipse').click();assert.equal(Number(field('Width').value),3);dom.window.close();
});
