'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
for(const modern of [true,false])test(`Properties source navigation uses ${modern?'the source editor':'legacy fallback'}`,async()=>{
  const dom=new JSDOM('<body></body>',{url:'http://localhost',runScripts:'dangerously'}),w=dom.window;
  try{
    const original={type:'barcode128',text:'1234',data_type:'number',data_transform:'trim',data_prefix:'0',x_mm:0,y_mm:0};
    Object.assign(w,{structuredClone,editing:{elements:[structuredClone(original)]},settings:{},cancelTextClick:()=>{},readEditorIntoDraft:()=>{},sampleData:()=>({}),ensureQR:async()=>{},qrValuesOf:()=>[],dmValuesOf:()=>[],qrCache:{},mmToUnit:Number,unitSuffix:()=> 'mm',measureUnit:()=> 'mm',LabelPreview:{computeBoxes:()=>[{w:20,h:10}],renderPreviewSVG:()=>'<svg></svg>'}});
    if(modern)Object.assign(w,{ObjectDataSourcesUI:{},SourceSession:require('../gui/source-session')});
    w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
    w.eval(fs.readFileSync(require.resolve('../gui/object-properties'),'utf8'));w.openObjectProperties(0);
    const names=Array.from(w.document.querySelectorAll('nav button'),b=>b.textContent);
    assert.ok(names.includes('Data Sources'));assert.equal(names.includes('Data Type'),!modern);assert.equal(names.includes('Transforms'),!modern);
    assert.deepEqual(JSON.parse(JSON.stringify(w.editing.elements[0])),original,'opening Properties preserves legacy values');
    await new Promise(resolve=>setImmediate(resolve));
  }finally{dom.window.close();}
});

test('Properties reserves header and footer while only its bounded body scrolls',()=>{
 const dom=new JSDOM('<body></body>',{url:'http://localhost',runScripts:'dangerously'}),w=dom.window;
 try{w.eval(fs.readFileSync(require.resolve('../gui/object-properties'),'utf8'));const d=w.document.getElementById('objectProperties');d.setAttribute('open','');const css=node=>w.getComputedStyle(node);assert.equal(css(d).display,'flex');assert.equal(css(d).flexDirection,'column');assert.equal(parseFloat(css(d.querySelector('.op-layout')).minHeight),0);assert.equal(css(d.querySelector('.op-layout')).overflow,'hidden');assert.equal(parseFloat(css(d.querySelector('main')).minHeight),0);assert.equal(css(d.querySelector('main')).overflow,'auto');assert.equal(css(d.querySelector('footer')).flexShrink,'0');assert.equal(css(d.querySelector('header')).flexShrink,'0');}finally{dom.window.close();}
});
