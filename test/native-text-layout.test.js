'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function preview(){const measure={measureText:t=>({width:String(t).length*8})},window={TextMeasure:{context:()=>measure,width:(_f,t)=>String(t).length*8,graphemes:t=>Array.from(t)},ObjectData:{resolve:e=>e.text}};const context={window,ObjectData:window.ObjectData,document:{createElement:()=>({getContext:()=>measure})},Intl};vm.runInNewContext(fs.readFileSync(require.resolve('../gui/preview'),'utf8'),context);return window.LabelPreview;}
test('native text uses original font baseline and measured line height for SVG and selection',()=>{
 const api=preview(),el={type:'text',text:'UID',font_family:'Arial',font_size_pt:12,x_mm:60.7314,y_mm:12.065,native_text_layout:{reference_point:'Center',ascent_em:1854/2048,line_height_em:4.7498/(12*25.4/72)}};
 const box=api.computeBoxes({elements:[el]},{} )[0],w=24*25.4/96;
 assert.ok(Math.abs(box.x-(60.7314-w/2))<1e-9);assert.ok(Math.abs(box.y-(12.065-4.7498/2))<1e-9);assert.ok(Math.abs(box.h-4.7498)<1e-9);
 const svg=api.renderElement(el,203,{},{});assert.match(svg,/dominant-baseline="alphabetic"/);assert.ok(svg.includes('font-family="Arial"'));
});
test('native text anchor tracks edited content width without changing original position',()=>{
 const api=preview(),el={type:'text',text:'ABC',font_family:'Arial',font_size_pt:12,x_mm:40,y_mm:30,native_text_layout:{reference_point:'TopCenter',ascent_em:.9,line_height_em:1.12}};
 const a=api.computeBoxes({elements:[el]},{} )[0];el.text='ABCDEF';const b=api.computeBoxes({elements:[el]},{} )[0];
 assert.ok(Math.abs((a.x+a.w/2)-40)<1e-9);assert.ok(Math.abs((b.x+b.w/2)-40)<1e-9);assert.equal(b.y,30);assert.ok(b.w>a.w);
});
test('native paragraph auto-fit keeps an unbreakable word on one line',()=>{
 const api=preview(),el={type:'text',text:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',font_family:'Arial',font_size_pt:12,x_mm:0,y_mm:0,text_wrap:true,text_auto_fit:true,text_box_width_mm:20,text_box_height_mm:8.9662,native_text_layout:{reference_point:'TopLeft',ascent_em:1854/2048,line_height_em:4.7498/(12*25.4/72)}};
 const svg=api.renderElement(el,96,{},{});assert.equal((svg.match(/<text /g)||[]).length,1);assert.match(svg,/>ABCDEFGHIJKLMNOPQRSTUVWXYZ<\/text>/);
});

