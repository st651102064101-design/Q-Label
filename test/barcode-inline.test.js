'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Model=require('../gui/source-model');
test('barcode HRI applies Bold Italic Underline and Wrap before a font is explicitly chosen',()=>{
 const {JSDOM}=require('jsdom'),dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window;w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:String(text).length*5})});w.ObjectData=require('../gui/object-data');w.Barcode=require('../gui/barcode');w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
 const el={type:'barcode128',text:'000',hri_height_mm:3,bar_height_mm:12,module_width:2,bold:true,italic:true,underline:true,text_wrap:true};const svg=new w.DOMParser().parseFromString(w.LabelPreview.renderPreviewSVG({width_mm:60,height_mm:40,elements:[el]},{}),'image/svg+xml'),text=svg.querySelector('[data-label-element="0"] text');assert.equal(text.getAttribute('font-weight'),'700');assert.equal(text.getAttribute('font-style'),'italic');assert.match(text.getAttribute('text-decoration'),/underline/);dom.window.close();
});
test('inline barcode edits preserve leading zeros and shared named source bindings',()=>{
 const code=fs.readFileSync(require.resolve('../gui/renderer'),'utf8'),start=code.indexOf('function setBarcodeEditorValue('),end=code.indexOf('\nfunction barcodeHumanReadableAt(',start);assert.ok(start>=0&&end>start);const ctx={};vm.createContext(ctx);vm.runInContext(code.slice(start,end),ctx);
 const doc=Model.migrate({elements:[{type:'barcode128',text:'000'},{type:'text',text:'{{Lot}}'},{type:'barcode128',text:'{{Lot}}'}],data_sources:{Lot:{type:'constant',value:'000'}}});ctx.setBarcodeEditorValue(doc,0,'0012');Model.reconcileInPlace(doc);assert.equal(doc.elements[0].text,'0012');ctx.setBarcodeEditorValue(doc,2,'0007');const result=require('../gui/source-resolver').evaluateDocument(doc);assert.equal(result.objects[doc.elements[1].id].text,'0007');assert.equal(result.objects[doc.elements[2].id].text,'0007');assert.equal(doc.elements[2].text,'{{Lot}}');assert.equal(doc.data_sources.Lot.value,'0007');
});


test('wrapped barcode bounds contain all rendered HRI lines for every linear type',()=>{
 const {JSDOM}=require('jsdom'),dom=new JSDOM('<body>',{runScripts:'outside-only'}),w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>({measureText:text=>({width:String(text).length*150})});w.ObjectData=require('../gui/object-data');w.Barcode=require('../gui/barcode');w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
 for(const type of ['barcode128','code39','code93','ean13']){
 const object={type,text:'123456789012',module_width:1,bar_height_mm:10,hri_height_mm:3,font_family:'Arial',font_size_pt:9,text_wrap:true},doc={dpi:203,width_mm:100,height_mm:200,elements:[object]};
 const box=w.LabelPreview.computeBoxes(doc,{})[0],svg=new w.DOMParser().parseFromString(w.LabelPreview.renderPreviewSVG(doc,{}),'image/svg+xml'),lines=[...svg.querySelectorAll('[data-barcode-hri] text')];
 assert.ok(lines.length>1,type+' really wraps');const last=lines.at(-1);assert.ok(Number(last.getAttribute('y'))+Number(last.getAttribute('font-size'))<=box.h+.001,type+' bounds contain the last line');
 object.text_wrap=false;assert.ok(w.LabelPreview.computeBoxes(doc,{})[0].h<box.h,type+' unwrap restores the smaller bounds');
 }dom.window.close();
});


test('catalog barcode wrapping draws HRI into the supplied raster canvas',()=>{
 const {JSDOM}=require('jsdom'),dom=new JSDOM('<body>',{runScripts:'outside-only'}),w=dom.window,paint=[];
 const context={measureText:text=>({width:String(text).length*20}),save(){},restore(){},scale(){},translate(){},rotate(){},fillRect(){},clearRect(){},setTransform(){},fillText(text){paint.push(text);},strokeText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 w.HTMLCanvasElement.prototype.getContext=()=>context;w.ObjectData=require('../gui/object-data');w.LabelBitmap=require('../gui/bitmap');w.eval(fs.readFileSync(require.resolve('../gui/preview'),'utf8'));
 const object={type:'image',x_mm:0,y_mm:0,width_mm:5,height_mm:10,font_family:'Arial',font_size_pt:9,text_wrap:true,barcode_spec:{show_text:true,text:'12345678'},barcode_bars:{bitmap_width:8,bitmap_height:1,bitmap_hex:'FF'},bitmap_width:8,bitmap_height:1,bitmap_hex:'FF'};
 assert.doesNotThrow(()=>w.LabelPreview.rasterizeCanvas({dpi:203,width_mm:40,height_mm:40,elements:[object]},{}));assert.ok(paint.length>1,'catalog HRI is drawn as wrapped lines');assert.equal(paint.join(''),'12345678');dom.window.close();
});
