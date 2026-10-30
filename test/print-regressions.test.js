'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {preparePrintJob}=require('../lib/print-job');
const {mmToDots,renderLabelBody}=require('../lib/zpl');
const geometry=require('../gui/print-geometry');
const engine=require('../gui/data-source-engine');
const database=require('../lib/database-import');
const {isPrintShortcut}=require('../lib/print-shortcut');
const base=()=>({name:'Edge label',width_mm:74.93,height_mm:53.34,dpi:600,margin_mm:{left:0,right:0,top:0,bottom:0},elements:[{type:'text',x_mm:30,y_mm:26,height_mm:3,text:'faff'}],data_sources:{Text1:{type:'table',row:'auto',column:'1',rows:[{'1':'2',a:'b'},{'1':'3',a:'c'}]}},database_connection:{rows:[{'1':'2',a:'b'},{'1':'3',a:'c'}],fields:{Text1:'1'}}});
test('overflowing CE and TIS logos are included before bitmap clipping',()=>{
 const t=base();t.elements=[{type:'image'},{type:'image'}];
 const bounds=geometry.printContentBounds(t,[{index:0,x:0,y:45.7,w:10.668,h:7.6784},{index:1,x:57.2,y:33.1,w:17.6962,h:22.4536}],[0,1]);
 assert.ok(Math.abs(bounds.x)<1e-9);assert.equal(bounds.w,74.93);assert.ok(bounds.h>=55.5536-1e-9);
});
test('transparent padding beyond paper does not shrink artwork or add a bottom margin',()=>{
 const t={width_mm:10,height_mm:10,elements:[{type:'image',bitmap_width:8,bitmap_height:10,bitmap_hex:'ffffffffffff00000000'}]};
 const bounds=geometry.printContentBounds(t,[{index:0,x:7,y:7,w:3,h:5}],[0]);
 assert.equal(bounds.w,10);assert.equal(bounds.h,10);
 t.elements[0].bitmap_hex='ffffffffffff00000080';
 assert.equal(geometry.printContentBounds(t,[{index:0,x:7,y:7,w:3,h:5}],[0]).h,12);
});
test('calibrated label height is used without subtracting gap twice',()=>{
 const media=require('../lib/printer-media-profile').profileMedia({pitch_height_mm:1180/24,length_dots:1180,dots_per_mm:24},{width_mm:72,gap_y_mm:1.5});
 assert.equal(media.calibrated_label_dots,1180);assert.equal(media.height_mm,1180/24);
 const graphic=geometry.fitSheetToMeasuredMedia({...base(),print_media:media},{width_mm:74.93,height_mm:53.34});
 assert.ok(graphic.elements[0].y_mm+graphic.elements[0].height_mm<=media.pitch_height_mm-media.gap_y_mm);
});
test('measured media fits each label without discarding a two-column paper layout',()=>{
 const t={...base(),width_mm:34.54,height_mm:49.53,page:{enabled:true,width_mm:74.42,height_mm:53.09,rows:1,columns:2,left_mm:1.78,right_mm:1.78,top_mm:1.78,bottom_mm:1.78,gap_x_mm:1.78,gap_y_mm:0},print_media:{width_mm:34.54,height_mm:49.46,inset_left_mm:0,inset_right_mm:0}};
 const image={type:'image',x_mm:0,y_mm:0,width_mm:t.width_mm,height_mm:t.height_mm,bitmap_width:8,bitmap_height:1,bitmap_hex:'ff'};
 const fitted=geometry.fitSheetToMeasuredMedia(t,image);
 assert.equal(fitted.page.enabled,true);assert.equal(fitted.page.rows,1);assert.equal(fitted.page.columns,2);
 assert.equal(fitted.page.width_mm,t.page.width_mm);assert.equal(fitted.width_mm,t.width_mm);assert.equal(fitted.height_mm,t.height_mm);
 assert.ok(fitted.elements[0].x_mm>=0&&fitted.elements[0].x_mm+fitted.elements[0].width_mm<=t.width_mm+1e-9);
 assert.ok(fitted.elements[0].y_mm>=0&&fitted.elements[0].y_mm+fitted.elements[0].height_mm<=t.height_mm+1e-9);
 assert.equal((renderLabelBody(fitted,{}).match(/\^GFA,/g)||[]).length,2,'print output repeats the fitted artwork in both page columns');
});
function harness(template=base()){
  const dom=new JSDOM('<input id="copies" value="1"><select id="printerSelect"><option value="Zebra ZT411 (600 dpi)">Zebra</option></select>',{runScripts:'outside-only',url:'http://localhost'}),w=dom.window;
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  const sent=[],rasterized=[];
  Object.assign(w,{editing:template,settings:{},printDarkness:'',printSpeed:'',current:null,importedRows:null,qrCache:{},el:id=>w.document.getElementById(id),readEditorIntoDraft(){},measureUnit:()=> 'mm',unitSuffix:x=>x,mmToUnit:x=>x,unitToMm:Number,placeholderNames:t=>[...new Set((t.elements||[]).flatMap(e=>[...String(e.text||'').matchAll(/\{\{([\w.\-]+)\}\}/g)].map(m=>m[1])))],getConnection:()=>({type:'printer',printer:'Zebra ZT411 (600 dpi)'}),ensureQR:async()=>{},qrValuesOf:()=>[],dmValuesOf:()=>[],DataSourceEngine:engine,DatabaseImport:database,PrintGeometry:geometry,PageDesignOptions:require('../gui/page-design-options'),ObjectData:require('../gui/object-data'),touchEditor(){},renderEditorValues(){},persistEditor:async()=>{},recordHistory:async()=>{},updateConnSummary(){}});
  w.LabelPreview={rasterizeDesignSheetCanvas:async(t,data,indices,cache,extras)=>{rasterized.push({t,data,extras});return{width:mmToDots(geometry.paperLayout(t).paperW,t.dpi),height:mmToDots(geometry.paperLayout(t).paperH,t.dpi)};},canvasToGraphicBytes:canvas=>{
    const stride=Math.ceil(canvas.width/8),bytes=Buffer.alloc(stride*canvas.height);
    for(const y of [0,canvas.height-1])for(const x of [0,canvas.width-1])bytes[y*stride+(x>>3)]|=128>>(x&7);
    return{width:canvas.width,height:canvas.height,hex:bytes.toString('hex')};
  }};
  w.zebra={preparePrintJob:async p=>{try{return{ok:true,...preparePrintJob(p)}}catch(e){return{ok:false,error:e.message}}},print:async p=>{sent.push(p);const j=preparePrintJob(p);return{ok:true,count:j.count,labels:j.labels};},saveSettings:async()=>{}};
  w.eval(fs.readFileSync(require.resolve('../gui/print-dialog'),'utf8'));
  return{w,sent,rasterized,close:()=>w.close()};
}
test('Print dialog restores a persisted printer when the renderer selection is empty',async()=>{
 const h=harness();try{
  h.w.el('printerSelect').replaceChildren();h.w.getConnection=()=>({type:'printer',printer:''});h.w.zebra.getSettings=async()=>({printer:'Saved Zebra'});
  await h.w.openPrintDialog();assert.equal(h.w.el('pdPrinter').value,'Saved Zebra');assert.equal(h.w.el('pdPrint').disabled,false);
 }finally{h.close();}
});
test('Print dialog loads printers on first open when no list or remembered selection exists',async()=>{
 const h=harness();try{
  h.w.el('printerSelect').replaceChildren();h.w.getConnection=()=>({type:'printer',printer:''});h.w.zebra.listPrinters=async()=>['Available Zebra'];
  await h.w.openPrintDialog();assert.equal(h.w.el('pdPrinter').value,'Available Zebra');
 }finally{h.close();}
});
test('printer refresh retains the remembered printer even when discovery omits it',async()=>{
 const h=harness();try{
  h.w.settings.printer='Remembered Zebra';h.w.getConnection=()=>({type:'printer',printer:''});h.w.zebra.listPrinters=async()=>['Other Zebra'];h.w.zebra.printerInfo=async()=>({ok:true});
  await h.w.openPrintDialog();await h.w.el('pdRefresh').onclick();assert.equal(h.w.el('pdPrinter').value,'Remembered Zebra');
 }finally{h.close();}
});
test('choosing a discovered printer updates the main connection and restores it on reopen',async()=>{
 const h=harness();try{
  const saved=[];h.w.getConnection=()=>({type:'printer',printer:h.w.el('printerSelect').value});h.w.zebra.listPrinters=async()=>['New Zebra'];h.w.zebra.printerInfo=async()=>({ok:true});h.w.zebra.saveSettings=async value=>{saved.push(value);};
  await h.w.openPrintDialog();await h.w.el('pdRefresh').onclick();h.w.el('pdPrinter').value='New Zebra';await h.w.el('pdPrinter').onchange();
  assert.equal(h.w.el('printerSelect').value,'New Zebra');assert.equal(saved.at(-1).printer,'New Zebra');h.w.el('pdCancel').click();await h.w.openPrintDialog();assert.equal(h.w.el('pdPrinter').value,'New Zebra');
 }finally{h.close();}
});
test('Print dialog is visually hidden at startup and after Cancel or titlebar Close',async()=>{
  const h=harness();try{
    const dialog=h.w.el('printDialog'),display=()=>h.w.getComputedStyle(dialog).display;
    assert.equal(dialog.open,false);
    assert.equal(display(),'none','a closed dialog must not remain painted at startup');
    await h.w.openPrintDialog();
    assert.equal(display(),'flex');
    h.w.el('pdCancel').click();
    assert.equal(dialog.open,false);
    assert.equal(display(),'none','Cancel must remove the dialog from layout');
    await h.w.openPrintDialog();
    assert.equal(display(),'flex');
    await h.w.el('pdX').onclick();
    assert.equal(display(),'none','titlebar Close must remove the dialog from layout');
  }finally{h.close();}
});

test('print action footer is anchored to the bottom of a flex dialog while content scrolls',()=>{
  const h=harness();try{
    const style=h.w.getComputedStyle.bind(h.w),dialog=h.w.el('printDialog'),form=h.w.el('pdForm'),body=dialog.querySelector('.pd-body'),footer=dialog.querySelector('footer');dialog.showModal();
    assert.equal(style(dialog).display,'flex');
    assert.equal(style(dialog).flexDirection,'column');
    assert.equal(style(form).display,'flex');
    assert.equal(style(form).flexDirection,'column');
    assert.equal(style(body).flex,'1 1 0%');
    assert.equal(style(body).overflow,'auto');
    assert.equal(style(footer).flexShrink,'0');
  }finally{h.close();}
});
test('Print dialog has one Cancel action and semantic SVGs for print controls',()=>{
 const h=harness();try{
  h.w.eval(fs.readFileSync(require.resolve('../gui/action-button-ui'),'utf8'));
  assert.equal(h.w.el('pdClose'),null,'the duplicate icon-only close button is removed from the footer');
  const path=id=>h.w.el(id).querySelector('svg path')?.getAttribute('d');
  assert.equal(path('pdTest'),'M6 9V3h12v6M6 18H3v-7h18v7h-3M6 14h12v7H6zM9 17l2 2 4-4');
  assert.equal(path('pdPrint'),'M6 9V3h12v6M6 18H3v-7h18v7h-3M6 14h12v7H6zM17 11h.01');
  assert.equal(path('pdPreview'),'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z');
  assert.equal(path('pdCancel'),'M6 6l12 12M18 6 6 18');
  assert.equal(h.w.el('pdCancel').textContent.trim(),'Cancel');
 }finally{h.close();}
});
test('Print dialog close button closes even when saving preferences fails',async()=>{
 const h=harness();try{
  h.w.zebra.saveSettings=async()=>{throw new Error('settings storage unavailable');};
  h.w.console.warn=()=>{};
  await h.w.openPrintDialog();
  assert.equal(h.w.el('printDialog').open,true);
  await assert.doesNotReject(h.w.el('pdX').onclick());
  assert.equal(h.w.el('printDialog').open,false,'the close action must finish even when preference persistence rejects');
 }finally{h.close();}
});
test('Print dialog Cancel closes without saving preferences',async()=>{
 const h=harness();try{
  let saves=0;h.w.zebra.saveSettings=async()=>{saves++;return{};};
  await h.w.openPrintDialog();
  h.w.el('pdCancel').click();
  assert.equal(h.w.el('printDialog').open,false);
  assert.equal(saves,0,'Cancel should not persist preferences');
 }finally{h.close();}
});
test('Print shortcut opens once and a held Ctrl+P does not reopen after Cancel',()=>{
 const h=harness();try{
  h.w.editing=base();h.w.editorSelection=new Set();h.w.editorSel=-1;
  const dialog=h.w.document.createElement('dialog');dialog.id='printDialog';h.w.document.body.append(dialog);
  let openings=0;h.w.openPrintDialog=()=>{if(dialog.open)return;openings++;dialog.setAttribute('open','');};
  const renderer=fs.readFileSync(require.resolve('../gui/renderer'),'utf8'),start=renderer.indexOf("  document.addEventListener('keydown', async (e) => {"),end=renderer.indexOf('  window.zebra.onPrintShortcut',start);
  assert.ok(start>=0&&end>start);h.w.eval(renderer.slice(start,end));
  const press=repeat=>h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'p',code:'KeyP',ctrlKey:true,repeat,bubbles:true,cancelable:true}));
  press(false);assert.equal(openings,1);assert.equal(dialog.open,true);
  dialog.removeAttribute('open');
  press(true);
  assert.equal(openings,1,'auto-repeat from the held key must not reopen Print after Cancel');
  assert.equal(dialog.open,false);
 }finally{h.close();}
});
test('Electron print shortcut accepts a fresh Ctrl+P keydown and rejects repeats',()=>{
 const fresh={type:'keyDown',key:'p',code:'KeyP',control:true,isAutoRepeat:false};
 assert.equal(isPrintShortcut(fresh),true);
 assert.equal(isPrintShortcut({...fresh,isAutoRepeat:true}),false);
 assert.equal(isPrintShortcut({...fresh,type:'keyUp'}),false);
 assert.equal(isPrintShortcut({...fresh,control:false}),false);
 assert.equal(isPrintShortcut({...fresh,key:'o',code:'KeyO'}),false);
});
test('connected but unbound CSV does not silently multiply a one-copy print',async()=>{
  const h=harness();try{await h.w.openPrintDialog();assert.equal(h.w.el('pdUseRecords').checked,false);assert.match(h.w.el('pdRecordInfo').textContent,/No database fields are bound/);await h.w.el('pdTest').onclick();assert.equal(h.sent.length,1);assert.equal(preparePrintJob(h.sent[0]).count,1);h.w.el('pdForm').dispatchEvent(new h.w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,30));assert.equal(h.sent.length,2);assert.equal(preparePrintJob(h.sent[1]).count,1);assert.equal(h.sent[1].rows,null);}finally{h.close();}
});
test('bound CSV prints the selected different records, including copies and reordered ranges',async()=>{
  const t=base();t.elements[0].text='{{Text1}}';const h=harness(t);try{await h.w.openPrintDialog();assert.equal(h.w.el('pdUseRecords').checked,false);h.w.el('pdUseRecords').checked=true;h.w.el('pdRange').value='2,1';h.w.el('pdCopies').value='2';h.w.el('pdSave').checked=false;await h.w.el('pdTest').onclick();assert.equal(preparePrintJob(h.sent[0]).count,1);h.w.el('pdForm').dispatchEvent(new h.w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,30));const job=preparePrintJob(h.sent[1]);assert.equal(job.count,4);assert.deepEqual(job.dataList.map(r=>r.Text1),['3','3','2','2']);}finally{h.close();}
});
for(const dpi of [203,300,600])for(const withPage of [false,true])test(`full paper bitmap preserves all four edge pixels at ${dpi} dpi, page ${withPage}`,async()=>{
  const t=base();t.dpi=dpi;if(withPage){t.width_mm=70.93;t.height_mm=49.34;t.page={enabled:true,width_mm:74.93,height_mm:53.34,rows:1,columns:1,left_mm:2,right_mm:2,top_mm:2,bottom_mm:2};}
  const h=harness(t);try{
    const graphic=await h.w.rasterizePrintGraphic(t,{}, {text:'graphic'},[0]),image=graphic.elements[0],layout=geometry.paperLayout(t);
    assert.equal(image.width_mm,layout.paperW);assert.equal(image.height_mm,layout.paperH);assert.equal(image.x_mm+layout.originX,0);assert.equal(image.y_mm+layout.originY,0);
    const job=preparePrintJob({template:graphic,copies:1,performance:{variableData:false},connection:{type:'ip',ip:'127.0.0.1'}}),zpl=job.zpl.toString(),width=mmToDots(layout.paperW,dpi),height=mmToDots(layout.paperH,dpi);
    assert.equal(job.count,1);assert.match(zpl,/\^FO0,0\^GFA,/);assert.match(zpl,new RegExp('\\^PW'+width+'\\b'));assert.ok(!zpl.includes('^LL'));assert.match(zpl,/\^LH0,0/);assert.match(zpl,/\^LS0/);assert.match(zpl,/\^LT0/);assert.match(zpl,/\^PQ1/);
    const match=zpl.match(/\^GFA,(\d+),(\d+),(\d+),([0-9A-F]+)/),stride=Number(match[3]),bits=Buffer.from(match[4],'hex');assert.equal(Number(match[1])/stride,height);assert.equal(stride,Math.ceil(width/8));
    for(const y of [0,height-1])for(const x of [0,width-1])assert.ok(bits[y*stride+(x>>3)]&(128>>(x&7)),`paper corner ${x},${y} survives`);
    assert.equal(h.rasterized[0].extras.paperPage,true);
  }finally{h.close();}
});
test('record detection follows named source dependencies and ignores disabled or fixed-record objects',()=>{
  const t=base();assert.equal(engine.usesDatabaseRecords(t),false);t.elements[0].text='{{Text1}}';assert.equal(engine.usesDatabaseRecords(t),true);t.elements[0].enabled=false;assert.equal(engine.usesDatabaseRecords(t),false);delete t.elements[0].enabled;t.data_sources.Text1.row='0';assert.equal(engine.usesDatabaseRecords(t),false);t.data_sources.Text1.row='auto';t.data_sources.alias={type:'expression',value:'{{Text1}}'};t.elements[0].text='{{alias}}';assert.equal(engine.usesDatabaseRecords(t),true);
});
test('bound two-row CSV defaults to one page; empty range means record 1 and All explicitly prints both',async()=>{
  for(const mode of ['default','empty','all']){
    const t=base();t.elements[0].text='{{Text1}}';const h=harness(t);
    try{await h.w.openPrintDialog();assert.equal(h.w.el('pdUseRecords').checked,false);assert.equal(h.w.el('pdRange').value,'1');
      if(mode!=='default'){h.w.el('pdUseRecords').checked=true;h.w.el('pdRange').value=mode==='all'?'All':'';}
      h.w.el('pdSave').checked=false;h.w.el('pdForm').dispatchEvent(new h.w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,30));assert.equal(h.sent.length,1);assert.equal(preparePrintJob(h.sent[0]).count,mode==='all'?2:1);
    }finally{h.close();}
  }
});
test('print data entry shows values resolved from the first connected CSV record',async()=>{
 const t=base();t.elements=[{type:'text',text:'{{field_}}'},{type:'text',text:'{{a}}'}];t.values={field_:'',a:''};
 t.data_sources={field_:{type:'table',rows:[{'1':'2',a:'b'},{'1':'3',a:'c'}],column:'1',row:'auto'},a:{type:'table',rows:[{'1':'2',a:'b'},{'1':'3',a:'c'}],column:'a',row:'auto'}};
 const h=harness(t);try{await h.w.openPrintDialog();const values=[...h.w.el('pdData').querySelectorAll('[data-print-field]')];assert.deepEqual(values.map(i=>i.value),['2','b']);assert.deepEqual([...h.w.el('pdData').querySelectorAll('label')].map(l=>l.firstChild.textContent),['Field','A']);}finally{h.close();}
});
test('every non-optimized format explicitly resets quantity to one after an earlier multi-copy job',()=>{
  const t=base();assert.match(preparePrintJob({template:t,copies:2}).zpl.toString(),/\^PQ2/);
  const j=preparePrintJob({template:t,copies:1,performance:{variableData:false}});assert.equal((j.zpl.toString().match(/\^XA/g)||[]).length,1);assert.match(j.zpl.toString(),/\^PQ1\s*\^XZ/);
});
function runtime(overrides){return require('../gui/print-ipc')({ipcMain:{handle(){}},dialog:{},settings:()=>({}),printerNames:async()=>[],...overrides});}
test('network send failure never resubmits the same possibly received job via Windows spooler',async()=>{
  let tcp=0,spool=0;const r=runtime({queryPrinter:async()=>JSON.stringify({host:'192.0.2.1',port:9100}),sendNetwork:async()=>{tcp++;throw Error('timeout after submission');},sendWindowsPrinterByName:async()=>{spool++;}});
  await assert.rejects(r.print({template:base(),copies:1,connection:{type:'printer',printer:'Zebra'}}),/timeout after submission/);assert.equal(tcp,1);assert.equal(spool,0);
});
test('USB printer discovery selects exactly one Windows RAW submission',async()=>{
  let tcp=0,spool=0;const r=runtime({queryPrinter:async()=>JSON.stringify({host:null}),sendNetwork:async()=>{tcp++;},sendWindowsPrinterByName:async()=>{spool++;}});const result=await r.print({template:base(),copies:1,connection:{type:'printer',printer:'Zebra'}});assert.equal(result.count,1);assert.equal(tcp,0);assert.equal(spool,1);
});
test('disabled stale page gaps and margins do not offset the single-label image',async()=>{
  const t=base();t.page={enabled:false,width_mm:74.93,height_mm:53.34,rows:1,columns:1,top_mm:1.778,bottom_mm:17.78,left_mm:17.78,right_mm:17.78,gap_x_mm:76.2};const h=harness(t);
  try{const graphic=await h.w.rasterizePrintGraphic(t,{}, {text:'graphic'},[0]);const job=preparePrintJob({template:graphic,copies:1});assert.equal(job.labels,1);assert.equal(graphic.elements[0].width_mm,74.93);assert.equal(graphic.elements[0].height_mm,53.34);assert.match(job.zpl.toString(),/\^FO0,0\^GFA,/);}finally{h.close();}
});
test('database fields referenced through an expression preserve the selected record order',async()=>{
  const t=base();t.elements[0].text='{{alias}}';t.data_sources.alias={type:'expression',value:'value: {{Text1}}'};const h=harness(t);
  try{await h.w.openPrintDialog();assert.equal(h.w.el('pdUseRecords').checked,false);h.w.el('pdUseRecords').checked=true;h.w.el('pdRange').value='2,1';h.w.el('pdSave').checked=false;h.w.el('pdForm').dispatchEvent(new h.w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,30));assert.deepEqual(preparePrintJob(h.sent[0]).dataList.map(r=>r.alias),['value: 3','value: 2']);}finally{h.close();}
});
test('a second print request while sending cannot submit a duplicate job',async()=>{
  let submits=0,release;const sending=new Promise(r=>release=r);const r=runtime({sendNetwork:async()=>{submits++;await sending;}}),p={template:base(),copies:1,connection:{type:'ip',ip:'127.0.0.1'}};
  const first=r.print(p);await assert.rejects(r.print(p),/already being sent/);assert.equal(submits,1);release();assert.equal((await first).count,1);
});
test('graphic record previews stay matched when generated and printed in separate steps with date/time fields',()=>{
  const t=base();t.elements[0].text='{{clock}}';t.data_sources.clock={type:'time',format:'HH:mm:ss'};const payload={template:t,copies:1,connection:{type:'ip',ip:'127.0.0.1'},now:Date.UTC(2026,9,9,8,10,11)};
  const preview=preparePrintJob(payload),recordTemplates=preview.dataList.map(data=>({data,template:{...t,elements:[{...t.elements[0],text:data.clock}]}}));
  const print=preparePrintJob({...payload,recordTemplates});assert.deepEqual(print.dataList.map(row=>row.clock),preview.dataList.map(row=>row.clock));assert.ok(print.zpl.toString().includes('^FD'+preview.dataList[0].clock+'^FS'));
  assert.throws(()=>preparePrintJob({...payload,now:'invalid'}),/valid timestamp/);
});
test('measured 27.5 x 53 mm pitch excludes gaps and fits all artwork inside 25 x 51.5 mm',async()=>{
  const t=base();t.print_media={width_mm:25,height_mm:51.5,gap_x_mm:2.5,gap_y_mm:1.5};const h=harness(t);
  try{const graphic=await h.w.rasterizePrintGraphic(t,{}, {text:'graphic'},[0]);const image=graphic.elements[0];assert.equal(graphic.width_mm,25);assert.equal(graphic.height_mm,51.5);assert.ok(image.x_mm>=0&&image.y_mm>=0);assert.ok(image.x_mm+image.width_mm<=25.00001);assert.ok(image.y_mm+image.height_mm<=51.50001);assert.ok(Math.abs(image.width_mm/image.height_mm-t.width_mm/t.height_mm)<1e-8);
    const job=preparePrintJob({template:graphic,copies:1});assert.equal(job.count,1);assert.match(job.zpl.toString(),new RegExp('\\^PW'+mmToDots(25,600)+'\\b'));assert.ok(!job.zpl.toString().includes('^LL'));
    const prepared=preparePrintJob({template:base(),connection:{type:'printer',printer:'Zebra ZT411 (600 dpi)'}},{printerMedia:{'Zebra ZT411 (600 dpi)':t.print_media}});assert.equal(prepared.template.print_media.width_mm,25);
  }finally{h.close();}
});

test('corrected measured stock fills 72 x 51.5 mm without duplicate labels or blank borders',async()=>{
 const t=base();t.stock={liner_left_mm:1.27,liner_right_mm:1.27};t.print_media={width_mm:72,height_mm:51.5,gap_x_mm:2.5,gap_y_mm:1.5,pitch_width_mm:74.5,pitch_height_mm:53,fit:'fill'};const h=harness(t);
 try{const graphic=await h.w.rasterizePrintGraphic(t,{}, {text:'graphic'},[0]);const image=graphic.elements[0];assert.equal(image.x_mm,0);assert.equal(image.y_mm,0);assert.ok(Math.abs(image.width_mm-72)<1e-8);assert.equal(image.height_mm,51.5);assert.equal(graphic.width_mm,72);assert.equal(graphic.height_mm,51.5);const job=preparePrintJob({template:graphic,copies:1});assert.equal(job.count,1);assert.equal(job.labels,1);assert.match(job.zpl.toString(),new RegExp('\\^PW'+mmToDots(72,600)+'\\b'));assert.ok(!job.zpl.toString().includes('^LL'));assert.equal((job.zpl.toString().match(/\^XA/g)||[]).length,1);
 }finally{h.close();}
});

test('withdrawn measurement cannot return through stale settings or document print media',()=>{const {correctSettings}=require('../lib/measured-media');const printer='Zebra ZT411 (600 dpi)',old={width_mm:25,height_mm:51.5,pitch_width_mm:27.5,pitch_height_mm:53,fit:'contain'};const s=correctSettings({printerMedia:{[printer]:old}});assert.equal(s.printerMedia[printer].width_mm,72);assert.equal(s.printerMedia[printer].fit,'fill');assert.equal(correctSettings({...s,printerMedia:{[printer]:old}}).printerMedia[printer].width_mm,72);const t=base();t.print_media=old;assert.equal(preparePrintJob({template:t,connection:{type:'printer',printer}},s).template.print_media.width_mm,72);assert.equal(correctSettings({printerMedia:{Other:old}}).printerMedia.Other.width_mm,25);});

test('gap and mark media retain sensor length; continuous media defines format height',()=>{for(const media_tracking of ['Y','M','N']){const t=base();t.height_mm=51.5;t.media_tracking=media_tracking;const zpl=preparePrintJob({template:t,copies:1}).zpl.toString();const length='^LL'+mmToDots(51.5,600)+',N';assert.equal(zpl.includes(length),media_tracking==='N');assert.ok(zpl.includes('^MN'+media_tracking));if(media_tracking==='N')assert.ok(zpl.indexOf(length)<zpl.indexOf('^FS'));assert.ok(!/\^LL\d+,Y/.test(zpl));assert.equal((zpl.match(/\^XA/g)||[]).length,1);}});

test('ZT411 24 dots per millimeter fills the measured dimensions exactly',()=>{const t=base();t.width_mm=72;t.height_mm=51.5;const job=preparePrintJob({template:t,copies:1,connection:{type:'printer',printer:'Zebra ZT411 (600 dpi)'}});assert.equal(job.template.dpi,609.6);assert.match(job.zpl.toString(),/\^PW1728\b/);assert.ok(!job.zpl.toString().includes('^LL'));assert.equal(job.count,1);assert.equal(geometry.printerDpi('Other 600 dpi'),600);});

test('tear-off returns media before printing without adding a label format',()=>{const t=base();const z=preparePrintJob({template:t,copies:1}).zpl.toString();assert.ok(z.includes('~JSB'));assert.ok(z.indexOf('~JSB')<z.search(/\^(?:FO|FT)/));assert.equal((z.match(/\^XA/g)||[]).length,1);assert.equal((z.match(/\^PQ1\b/g)||[]).length,1);t.print_mode='P';const unsupported=preparePrintJob({template:t,copies:1}).zpl.toString();assert.ok(unsupported.includes('^MMT'),'unconfirmed Peel-off falls back to Tear-off');assert.ok(unsupported.includes('~JSB'));});
test('print output falls back to Tear-off for an unconfirmed legacy mode and keeps confirmed media modes',()=>{
  const template=base();template.print_mode='C';const connection={type:'ip',ip:'192.0.2.10',port:9100};
  const unsupported=preparePrintJob({template,copies:1,connection},{});
  assert.equal(template.print_mode,'C','the saved document value is not rewritten');
  assert.equal(unsupported.template.print_mode,'T');
  assert.match(unsupported.zpl.toString(),/\^MMT/);
  assert.doesNotMatch(unsupported.zpl.toString(),/\^MMC/);
  const profileKey='ip:192.0.2.10:9100',settings={printerProfiles:{[profileKey]:{source:'printer',dots_per_mm:8,length_dots:400,label_height_mm:50,tracking:'gap/notch',capabilities:{mediaModes:['T','C']}}}};
  const confirmed=preparePrintJob({template,copies:1,connection},settings);
  assert.equal(confirmed.template.print_mode,'C');
  assert.match(confirmed.zpl.toString(),/\^MMC/);
});
