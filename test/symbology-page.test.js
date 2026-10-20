'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const S=require('../gui/object-properties-symbology');
const {encode}=require('../lib/barcode-catalog');
test('Code 128 dimensions preserve physical values and density round trips',()=>{
 const o={type:'barcode128',text:'12345678',module_width:2,bar_height_mm:12};
 const s=S.read(o,203);assert.equal(s.x_mm,2*25.4/203);assert.equal(s.height_mm,12);
 assert.ok(Math.abs(S.density({x_mm:.01151*25.4,code_set:'Auto'},'12345678')-2/(11*.01151))<1e-9);
 assert.ok(Math.abs(S.xFromDensity(S.density(s,o.text),s,o.text)-s.x_mm)<1e-12);
 assert.equal(o.barcode_spec,undefined,'reading does not migrate the document');
});
test('native-style page stages X settings and print method until OK',()=>{
 const dom=new JSDOM('<form></form>',{url:'http://localhost'}),d=dom.window.document;
 d.defaultView.HTMLDialogElement.prototype.showModal=function(){this.open=true;};d.defaultView.HTMLDialogElement.prototype.close=function(){this.open=false;};
 let o={type:'barcode128',text:'12345678',module_width:2,bar_height_mm:12},changes=0;
 const page=S.mount(d.querySelector('form'),{getObject:()=>structuredClone(o),update:fn=>{fn(o);changes++;},dpi:203,catalog:[{bcid:'code128',desc:'Code 128'},{bcid:'code39',desc:'Code 39'}]});
 assert.equal(d.querySelector('[name="sym.check_digit"]').disabled,true);assert.equal(d.querySelector('[name="sym.ratio"]').disabled,true);
 assert.equal(d.querySelector('[name="sym.bcid"]').selectedOptions[0].textContent,'Code 128');
 d.querySelector('[data-sym-action="x-dimension"]').click();let dialog=d.querySelector('dialog');let input=dialog.querySelector('[name="target"]');input.value='20';input.dispatchEvent(new dom.window.Event('input'));dialog.querySelector('[data-dialog-action="cancel"]').click();assert.equal(changes,0);
 d.querySelector('[data-sym-action="x-dimension"]').click();dialog=d.querySelector('dialog');input=dialog.querySelector('[name="target"]');input.value='20';input.dispatchEvent(new dom.window.Event('input'));dialog.querySelector('[data-dialog-action="ok"]').click();assert.ok(Math.abs(o.barcode_spec.x_mm-.508)<1e-9);
 d.querySelector('[data-sym-action="print-method"]').click();dialog=d.querySelector('dialog');dialog.querySelector('[value="host"]').click();dialog.querySelector('[data-dialog-action="cancel"]').click();assert.notEqual(o.barcode_spec.print_method,'host');
 d.querySelector('[data-sym-action="print-method"]').click();dialog=d.querySelector('dialog');dialog.querySelector('[value="host"]').click();dialog.querySelector('[data-dialog-action="ok"]').click();assert.equal(o.barcode_spec.print_method,'host');page.dispose();assert.equal(d.querySelector('dialog'),null);dom.window.close();
});
test('Code 128 options change actual bitmap and reject unrepresentable data',async()=>{
 const a=await encode({bcid:'code128',text:'12345678',show_text:false,code_set:'B',x_mm:.3,bar_height_mm:12});
 const c=await encode({bcid:'code128',text:'12345678',show_text:false,code_set:'C',x_mm:.3,bar_height_mm:12});
 assert.ok(a.bitmap_width>c.bitmap_width,'Code C compresses numeric pairs');
 assert.ok(Math.abs(c.physical_width_mm-c.bitmap_width/3*.3)<1e-9);
 await assert.rejects(encode({bcid:'code128',text:'ABC',code_set:'C'}),/even number of digits/);
 await assert.rejects(encode({bcid:'code128',text:'ไทย',text_encoding:'ascii'}),/ASCII/);
 const tall=await encode({bcid:'code128',text:'12345678',show_text:false,x_mm:.3,bar_height_mm:24});assert.ok(tall.bitmap_height>c.bitmap_height);
});
test('all three print methods select different real ZPL output paths',()=>{
 const {renderCode128}=require('../lib/symbology-print');const object={type:'image',text:'12345678',width_mm:30,barcode_spec:{bcid:'code128',text:'12345678',x_mm:.3,bar_height_mm:12,code_set:'C',print_method:'printer'}};
 const printer=renderCode128(object,203);assert.match(printer,/\^BCN,96,Y,N,N,N/);assert.doesNotMatch(printer,/\^GFA/);assert.match(printer,/_3E_3B/);
 object.barcode_spec.print_method='hybrid';const hybrid=renderCode128(object,203);assert.match(hybrid,/\^BCN,96,N,N,N,N/);assert.match(hybrid,/\^GFA/);
 object.barcode_spec.print_method='host';assert.equal(renderCode128(object,203),null);
});
test('width fitting respects module limits and does not stretch the bar height',async()=>{
 const result=await encode({bcid:'code128',text:'12345678',show_text:false,x_mm:.3,bar_height_mm:12,fit_width:true,target_width_mm:30,min_x_mm:.2,max_x_mm:.6});
 assert.ok(result.effective_x_mm>=.2&&result.effective_x_mm<=.6);assert.ok(Math.abs(result.physical_width_mm-30)<.01);assert.ok(Math.abs(result.physical_height_mm-12)<.3);
 await assert.rejects(encode({bcid:'code128',text:'123',x_mm:.00001,bar_height_mm:100}),/bitmap limit/);
});
test('HIBC and GS1 use different actual encoded data and reject invalid AI values',async()=>{
 const base=await encode({bcid:'code128',text:'A123B',show_text:false});const hibc=await encode({bcid:'code128',text:'A123B',hibc:true,show_text:false});assert.notEqual(base.bitmap_hex,hibc.bitmap_hex);
 const gs1=await encode({bcid:'code128',text:'(01)09521234543213(10)LOT1',gs1:true,show_text:false});assert.ok(gs1.bitmap_width>0);
 await assert.rejects(encode({bcid:'code128',text:'(01)123',gs1:true}),/./);
});
