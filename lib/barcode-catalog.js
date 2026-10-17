'use strict';
const bwip=require('bwip-js');
const {PNG}=require('pngjs');
const {categoryFor}=require('../gui/barcode-categories');
// Components and color encodings cannot be printed as standalone monochrome labels.
// Each supported symbol gets one app-specific home category so overlapping
// keyword matches cannot repeat the same barcode in multiple folders.
const catalog=bwip.symbolList.filter(s=>!['raw','symbol','gs1-cc','ultracode'].includes(s.bcid)).map(s=>{
  const category=categoryFor(s.bcid);
  return {...s,category,folders:[category]};
});
async function encode(spec){
  const item=catalog.find(s=>s.bcid===spec.bcid);if(!item)throw Error('Unsupported barcode symbology');
  if(spec.bytes!=null&&(!Array.isArray(spec.bytes)||spec.bytes.some(byte=>!Number.isInteger(byte)||byte<0||byte>255)))throw Error('Barcode data contains an invalid byte');
  const text=spec.bytes!=null?spec.bytes.map(byte=>String.fromCharCode(byte)).join(''):String(spec.text??'');if(!text.length||text.length>10000)throw Error('Enter barcode data (maximum 10,000 characters).');
  const options={bcid:item.bcid,text,scale:3,padding:12,backgroundcolor:'FFFFFF',includetext:spec.show_text!==false};
  for(const token of item.opts.split(/\s+/).filter(Boolean)){const [key,...value]=token.split('=');if(!['includetext'].includes(key))options[key]=value.length?value.join('='):true;}
  if(spec.hri_text!=null)options.alttext=String(spec.hri_text);
  if(spec.bytes!=null)options.binarytext=true;
  const png=await bwip.toBuffer(options),image=PNG.sync.read(png),stride=Math.ceil(image.width/8),bytes=Buffer.alloc(stride*image.height);
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const p=(y*image.width+x)*4;if(image.data[p]*.299+image.data[p+1]*.587+image.data[p+2]*.114<200)bytes[y*stride+(x>>3)]|=0x80>>(x&7);}
  return {src:'data:image/png;base64,'+png.toString('base64'),bitmap_width:image.width,bitmap_height:image.height,bitmap_hex:bytes.toString('hex')};
}
module.exports={catalog,encode,categoryFor};
