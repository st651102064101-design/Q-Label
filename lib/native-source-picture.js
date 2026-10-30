'use strict';
const {PNG}=require('pngjs');
/** Decode the native PictureSource=Base64 PNG value, without turning the source
 * itself into a bitmap. The original shared text remains independently editable. */
function nativePictureArtwork(value,config={}){
 if(config.encoding!=='base64')throw Error('Native picture source requires supported Base64 encoding');
 if(typeof value!=='string'||value.length>24*1024*1024)throw Error('Native picture Base64 exceeds the supported size');
 const text=value.replace(/[\t\r\n ]/g,'');
 if(!text||text.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text))throw Error('Invalid native picture Base64');
 const bytes=Buffer.from(text,'base64');
 if(bytes.length>16*1024*1024||bytes.toString('base64')!==text)throw Error('Invalid or oversized native picture Base64');
 if(bytes.length<33||!bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))||bytes.toString('ascii',12,16)!=='IHDR')throw Error('Native picture source is not a supported PNG');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(!width||!height||width>4096||height>4096||width*height>16000000)throw Error('Native picture PNG dimensions exceed the supported size');
 let png;try{png=PNG.sync.read(bytes);}catch(error){throw Error('Invalid native picture PNG: '+error.message);}
 const stride=Math.ceil(width/8),mono=Buffer.alloc(stride*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const offset=(y*width+x)*4,alpha=png.data[offset+3]/255;
  const luminance=(png.data[offset]*.299+png.data[offset+1]*.587+png.data[offset+2]*.114)*alpha+255*(1-alpha);
  if(luminance<128)mono[y*stride+(x>>3)]|=128>>(x&7);
 }
 return {bitmap_width:width,bitmap_height:height,bitmap_hex:mono.toString('hex').toUpperCase(),color_image_data:'data:image/png;base64,'+text};
}
module.exports={nativePictureArtwork};
