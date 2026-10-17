'use strict';
function encodeMatrix(type,{text='',bytes}={}){
  if(bytes!=null&&(!Array.isArray(bytes)||bytes.some(byte=>!Number.isInteger(byte)||byte<0||byte>255)))throw Error('Symbol contains an invalid byte');
  if(type==='qrcode'){
    const matrix=require('qrcode').create(bytes!=null?[{data:Buffer.from(bytes),mode:'byte'}]:String(text),{errorCorrectionLevel:'M'}).modules;
    return {width:matrix.size,height:matrix.size,data:Array.from(matrix.data)};
  }
  if(type==='datamatrix'){
    const matrix=require('bwip-js').raw({bcid:'datamatrix',text:bytes!=null?bytes.map(byte=>String.fromCharCode(byte)).join(''):String(text),binarytext:bytes!=null,scale:1,padding:0,paddingwidth:0,paddingheight:0,includetext:false})[0];
    if(!matrix?.pixx||!matrix?.pixy||!matrix.pixs)throw Error('Unable to encode Data Matrix');
    return {width:matrix.pixx,height:matrix.pixy,data:Array.from(matrix.pixs)};
  }
  throw Error('Unsupported matrix symbol: '+type);
}
module.exports={encodeMatrix};
