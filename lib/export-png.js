'use strict';
const {PNG}=require('pngjs');
function crc32(buffer){let c=0xffffffff;for(const byte of buffer){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function encodeExportPng(dataUrl,dpi){
 if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(String(dataUrl)))throw Error('Invalid PNG image.');
 const bytes=Buffer.from(dataUrl.split(',')[1],'base64');PNG.sync.read(bytes);
 const n=Number(dpi);if(!Number.isFinite(n)||n<72||n>2400)throw Error('Invalid image resolution.');
 const chunk=Buffer.alloc(21);chunk.writeUInt32BE(9,0);chunk.write('pHYs',4);chunk.writeUInt32BE(Math.round(n/0.0254),8);chunk.writeUInt32BE(Math.round(n/0.0254),12);chunk[16]=1;chunk.writeUInt32BE(crc32(chunk.subarray(4,17)),17);
 const parts=[bytes.subarray(0,33),chunk];let offset=33;
 while(offset<bytes.length){const length=bytes.readUInt32BE(offset)+12;if(bytes.toString('ascii',offset+4,offset+8)!=='pHYs')parts.push(bytes.subarray(offset,offset+length));offset+=length;}
 return Buffer.concat(parts);
}
module.exports={encodeExportPng};
