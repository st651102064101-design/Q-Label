'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {encode}=require('../lib/barcode-catalog');
const font=fs.readFileSync(path.join(path.dirname(path.dirname(require.resolve('bwip-js'))),'fonts/Inconsolata.otf'));
const hri={font_name:'Inconsolata',font_sha256:crypto.createHash('sha256').update(font).digest('hex'),font_data_base64:font.toString('base64'),font_size_pt:8};
test('native barcode HRI uses the exact supplied font and standard individual UPC digits',async()=>{
 const result=await encode({bcid:'upca',text:'500346072995',x_mm:.47,bar_height_mm:11.3538,native_hri:hri});
 assert.equal(result.hri_font_sha256,hri.font_sha256);assert.equal(result.hri_segments.length,12);assert.equal(result.hri_segments.map(s=>s.text).join(''),'500346072995');
 assert.ok(result.hri_segments[0].x<0);assert.ok(result.hri_segments.at(-1).x>95);
 const fallback=await encode({bcid:'upca',text:'500346072995',x_mm:.47,bar_height_mm:11.3538});assert.notEqual(result.bitmap_hex,fallback.bitmap_hex);
});
test('native barcode font identity cannot silently fall back',async()=>{
 await assert.rejects(encode({bcid:'upca',text:'500346072995',native_hri:{...hri,font_sha256:'0'.repeat(64)}}),/font.*identity/i);
 await assert.rejects(encode({bcid:'upca',text:'500346072995',native_hri:{...hri,font_size_pt:0}}),/font.*size/i);
});
test('native UPC artwork reports its bar origin separately from outside HRI bounds',async()=>{
 const r=await encode({bcid:'upca',text:'500346072995',bar_height_mm:11.3538,native_upca:{profile:'UniGDI-12.1',target_width_mm:48.26,minimum_x_mils:5,maximum_x_mils:500},native_hri:hri});
 assert.ok(r.native_artwork_bounds.bar_origin_x_mm>0);assert.equal(r.native_artwork_bounds.bar_origin_y_mm,0);
 assert.ok(Math.abs(r.native_artwork_bounds.bar_width_mm-45.72)<1e-9);assert.ok(r.physical_width_mm>r.native_artwork_bounds.bar_width_mm);assert.ok(r.physical_height_mm>11.3538);
});


test('native UniGDI UPC profile uses observed quantized widths, source padding and checksum validation',async()=>{
 const spec={bcid:'upca',text:'500346072995',bar_height_mm:11.3538,native_hri:hri,native_upca:{profile:'UniGDI-12.1',target_width_mm:48.26,minimum_x_mils:5,maximum_x_mils:500}};
 const r=await encode(spec);assert.equal(r.native_upca_size.index,4);assert.ok(Math.abs(r.native_upca_size.bar_width_mm-45.72)<1e-9);assert.equal(r.hri_display_text,'500346072995');
 const short=await encode({...spec,text:'1234567890'});assert.equal(short.hri_display_text,'012345678905');
 await assert.rejects(encode({...spec,text:'123456789019'}),/check digit/i);await assert.rejects(encode({...spec,text:'1234567890123'}),/GTIN-12/i);
 await assert.rejects(encode({...spec,bcid:'code128'}),/UPC-A/i);await assert.rejects(encode({...spec,native_upca:{...spec.native_upca,profile:'unknown'}}),/profile/i);
});

test('native UPC HRI outside digits keep three-quarter point size across module widths and use physical guard descent',async()=>{
 for(const size of [8,12,16])for(const target of [40,48.26,80]){
  const r=await encode({bcid:'upca',text:'500346072995',bar_height_mm:11.3538,native_hri:{...hri,font_size_pt:size},native_upca:{profile:'UniGDI-12.1',target_width_mm:target,minimum_x_mils:5,maximum_x_mils:500}});
  const unitToPoints=r.effective_x_mm*72/25.4;
  assert.ok(Math.abs(r.hri_segments[0].size*unitToPoints-size*.75)<1e-9,'outside digit must use three quarters of the original point size');
  assert.ok(Math.abs(r.hri_segments[1].size*unitToPoints-size)<1e-9);
  assert.ok(Math.abs(r.native_artwork_bounds.guard_descent_mm-5*25.4/72)<1e-9);
  const data=Buffer.from(r.bitmap_hex,'hex'),stride=Math.ceil(r.bitmap_width/8),black=(x,y)=>!!(data[y*stride+(x>>3)]&(0x80>>(x&7))),heights=[];
  for(let x=r.native_artwork_bounds.bar_origin_x_px;x<r.bitmap_width;x++)if(black(x,0)){let y=0;while(y<r.bitmap_height&&black(x,y))y++;heights.push(y);}
  const mmPerPixel=r.effective_x_mm/3;
  assert.ok(Math.abs((Math.max(...heights)-Math.min(...heights))*mmPerPixel-5*25.4/72)<2*mmPerPixel,'raster guard extension must use physical points rather than module count');
 }
});
