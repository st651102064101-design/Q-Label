'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PNG}=require('pngjs');
const {DataMatrixReader,RGBLuminanceSource,HybridBinarizer,BinaryBitmap}=require('@zxing/library');
const {encode}=require('../lib/barcode-catalog');
const native=require('./fixtures/native-a4a/datamatrix.json');
function decode(png){const image=PNG.sync.read(png),w=image.width+40,h=image.height+40,pixels=new Uint8ClampedArray(w*h).fill(255);for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const p=(y*image.width+x)*4;pixels[(y+20)*w+x+20]=image.data[p+3]>127?image.data[p]:255;}return new DataMatrixReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels,w,h)))).getText();}
test('original native DataMatrix is independently decoded with literal angle-bracket tokens and control bytes intact',()=>{
 assert.equal(decode(fs.readFileSync(require.resolve('./fixtures/native-a4a/native-datamatrix.png'))),native.text);
});
test('editable DataMatrix retains every original native module and measured physical layout',async()=>{
 const r=await encode({bcid:'datamatrix',text:native.text,show_text:false,native_datamatrix:native});
 assert.equal(r.bitmap_width,66);assert.equal(r.bitmap_height,66);assert.equal(r.physical_width_mm,native.width_mm);assert.equal(r.physical_height_mm,native.height_mm);
 const image=PNG.sync.read(Buffer.from(r.src.split(',')[1],'base64'));
 for(let y=0;y<22;y++)for(let x=0;x<22;x++)assert.equal(image.data[((y*3+1)*image.width+x*3+1)*4]<128?1:0,Number(native.modules[y*22+x]));
 assert.equal(decode(Buffer.from(r.src.split(',')[1],'base64')),native.text);
});
test('changing native DataMatrix data produces independently scannable content while keeping its authored object bounds',async()=>{
 for(const text of [native.text.replace('1U2R7','QZ9R4'),native.text.replace('MH80312','EDIT9876'),native.text.replace('1U2R7','ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890')]){
  const r=await encode({bcid:'datamatrix',text,show_text:false,native_datamatrix:native});
  assert.equal(decode(Buffer.from(r.src.split(',')[1],'base64')),text);assert.equal(r.physical_width_mm,native.width_mm);assert.equal(r.physical_height_mm,native.height_mm);
 }
});
test('native DataMatrix layout rejects mismatched symbols and damaged original module records',async()=>{
 for(const change of [n=>n.modules=n.modules.slice(1),n=>n.columns=0,n=>n.profile='unknown',n=>n.width_mm=0]){const n=structuredClone(native);change(n);await assert.rejects(encode({bcid:'datamatrix',text:native.text,native_datamatrix:n}),/native.*matrix/i);}
 await assert.rejects(encode({bcid:'code128',text:'1234',native_datamatrix:native}),/native.*matrix/i);
});
module.exports={decode};
