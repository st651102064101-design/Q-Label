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
test('Print source counter enables serial quantities and changing Preview pages without legacy fields',async()=>{
 const doc=require('../gui/source-model').migrate({...base(),elements:[{type:'barcode128',text:'0001',x_mm:2,y_mm:2,module_width:2,bar_height_mm:10}],data_sources:{},database_connection:null});
 doc.sourceDefinitions[doc.elements[0].dataSourceRefs[0]].transforms=[{kind:'serialization',step:1}];
 const h=harness(doc);try{
  h.w.zebra.preparePrintJob=async job=>{try{const prepared=await require('../lib/print-job').preparePrintJobAsync(job);return{ok:true,...prepared,bytes:prepared.zpl.length}}catch(e){return{ok:false,error:e.message}}};
  h.w.LabelPreview.renderPreviewSVG=(t,data)=>'<svg xmlns="http://www.w3.org/2000/svg"><text>'+h.w.ObjectData.resolve(doc.elements[0],data)+'</text></svg>';
  await h.w.openPrintDialog();const q=id=>h.w.el('pd'+id),p=id=>h.w.el('pp'+id);
  assert.equal(q('SerialEnabled').disabled,false);assert.equal(q('SerialEnabled').checked,true);
  assert.equal(q('SerialField').closest('label').hidden,true);
  q('SerialCount').value='10';q('Copies').value='1';
  await q('Preview').onclick();assert.equal(h.w.el('printPreviewDialog').open,true,q('Message').textContent);
  assert.equal(p('Count').textContent,'of 10');assert.match(p('Sheet').textContent,/0001/);
  p('Next').click();await new Promise(r=>setTimeout(r,0));assert.match(p('Sheet').textContent,/0002/);
  p('Last').click();await new Promise(r=>setTimeout(r,0));assert.match(p('Sheet').textContent,/0010/);
  p('First').click();await new Promise(r=>setTimeout(r,0));assert.match(p('Sheet').textContent,/0001/);
  assert.equal(h.sent.length,0);
 }finally{h.close();}
});
