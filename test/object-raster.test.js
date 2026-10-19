'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),Raster=require('../lib/object-raster');
const fixture=()=>({width_mm:30,height_mm:20,dpi:254,elements:[{type:'image',x_mm:5,y_mm:5,width_mm:10,height_mm:5,transparent_background:true,bitmap_width:1,bitmap_height:1,bitmap_hex:'00',border:{kind:'rectangle',margins:{top:0,left:0,bottom:0,right:0},corner:'rectangular',sides:'all',line:{widthMm:1,color:'#000000',opacity:1,compound:'single'},fill:'none'}}]});
const black=(image,x,y)=>{const bytes=Buffer.from(image.bitmap_hex,'hex');return !!(bytes[y*Math.ceil(image.bitmap_width/8)+(x>>3)]&(128>>(x&7)));};
test('headless shared canvas renders border into a real print bitmap without changing authored data',()=>{
 const template=fixture(),before=structuredClone(template),out=Raster.compileTemplate(template,{}),image=out.elements[0];assert.equal(image.bitmap_width,300);assert.equal(image.bitmap_height,200);assert.equal(black(image,50,75),true);assert.equal(black(image,100,75),false);assert.deepEqual(template,before);const {buildLabel}=require('../lib/render');assert.match(buildLabel(template,[{}]).toString(),/\^GFA,7600,7600,38,/);
});
test('headless canvas preserves actual compound gaps and rejects oversized images',()=>{
 const template=fixture();template.elements[0].border.line.compound='double';const image=Raster.compileTemplate(template,{}).elements[0];assert.equal(black(image,40,75),true);assert.equal(black(image,50,75),false);assert.equal(black(image,60,75),true);assert.throws(()=>Raster.compileTemplate({...template,width_mm:10000},{}),/limit/i);
});
