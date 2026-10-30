'use strict';
const bwip=require('bwip-js'),{PNG}=require('pngjs');
// Editable layout import: native modules are retained for the original value.
// Edited values use standards-compliant ECC200 encoding inside the authored
// object size. This does not emulate the original printer's auto-size policy.
function encodeNativeDataMatrix(spec,text){
 const n=spec.native_datamatrix,validSize=x=>Number.isInteger(x)&&[10,12,14,16,18,20,22,24,26,32,36,40,44,48,52,64,72,80,88,96,104,120,132,144].includes(x);
 if(spec.bcid!=='datamatrix'||n?.profile!=='native-datamatrix-layout-v1'||!validSize(n.columns)||n.rows!==n.columns||typeof n.modules!=='string'||!/^[01]+$/.test(n.modules)||n.modules.length!==n.columns*n.rows||typeof n.text!=='string'||!Number.isFinite(n.width_mm)||n.width_mm<=0||!Number.isFinite(n.height_mm)||n.height_mm<=0||!Array.isArray(n.evidence)||!n.evidence.length)throw Error('Native DataMatrix layout record is invalid');
 const width=spec.render_width_mm??n.width_mm,height=spec.render_height_mm??n.height_mm;
 if(!Number.isFinite(width)||width<=0||width>1000||!Number.isFinite(height)||height<=0||height>1000)throw Error('Native DataMatrix object size is invalid');
 const original=text===n.text&&spec.bytes==null;
 const raw=original?{pixx:n.columns,pixy:n.rows,pixs:Array.from(n.modules,Number)}:bwip.raw({bcid:'datamatrix',text:spec.bytes!=null?text:Buffer.from(text,'utf8').toString('latin1'),binarytext:true})[0];
 if(!raw?.pixs||raw.pixx!==raw.pixy)throw Error('Native DataMatrix requires a square ECC200 symbol');
 const scale=3,image=new PNG({width:raw.pixx*scale,height:raw.pixy*scale}),stride=Math.ceil(image.width/8),bytes=Buffer.alloc(stride*image.height);
 const color=/^#[a-f0-9]{6}$/i.test(spec.bar_color||'')?spec.bar_color:'#000000',rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
  const black=!!raw.pixs[Math.floor(y/scale)*raw.pixx+Math.floor(x/scale)],offset=(y*image.width+x)*4;
  image.data[offset]=black?rgb[0]:255;image.data[offset+1]=black?rgb[1]:255;image.data[offset+2]=black?rgb[2]:255;image.data[offset+3]=255;
  if(black&&rgb[0]*.299+rgb[1]*.587+rgb[2]*.114<200)bytes[y*stride+(x>>3)]|=0x80>>(x&7);
 }
 return {src:'data:image/png;base64,'+PNG.sync.write(image).toString('base64'),bitmap_width:image.width,bitmap_height:image.height,bitmap_hex:bytes.toString('hex'),physical_width_mm:width,physical_height_mm:height,effective_x_mm:width/raw.pixx,native_original_modules:original};
}
module.exports={encodeNativeDataMatrix};
