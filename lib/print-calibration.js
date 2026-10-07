'use strict';
function normalizeCalibration(value = {}) {
  const out = {};
  for (const [key, fallback, min, max] of [['offsetX',0,-100,100],['offsetY',0,-100,100],['scaleX',100,10,200],['scaleY',100,10,200]]) {
    const n = Number(value[key] ?? fallback);
    if (!Number.isFinite(n) || n < min || n > max) throw Error(`Invalid print calibration: ${key} (${min}–${max}).`);
    out[key] = n;
  }
  return out;
}
// Scale generated printer objects, including raster barcodes, after page layout.
// Keep media dimensions, tracking and offsets unchanged.
function calibrateZpl(buffer, calibration, offsetYDots=0) {
  const sx=calibration.scaleX/100, sy=calibration.scaleY/100;
  if(sx===1 && sy===1 && offsetYDots===0)return buffer;
  const size=(n,s)=>Math.max(1,Math.round(Number(n)*s));
  let zpl=buffer.toString('ascii');
  zpl=zpl.replace(/\^GFA,(\d+),(\d+),(\d+),([0-9A-F]+)\^FS/g,(_,total,used,stride,hex)=>{
    const source=Buffer.from(hex,'hex'), sw=Number(stride)*8, sh=Number(total)/Number(stride);
    const w=size(sw,sx),h=size(sh,sy),row=Math.ceil(w/8);
    if(w*h>64000000)throw Error('Calibrated graphic exceeds the print bitmap limit.');
    const bytes=Buffer.alloc(row*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const px=Math.min(sw-1,Math.floor(x/sx)),py=Math.min(sh-1,Math.floor(y/sy));
      if(source[py*Number(stride)+(px>>3)]&(128>>(px&7)))bytes[y*row+(x>>3)]|=128>>(x&7);
    }
    return `^GFA,${bytes.length},${bytes.length},${row},${bytes.toString('hex').toUpperCase()}^FS`;
  });
  zpl=zpl.replace(/\^(FO|FT)(-?\d+),(-?\d+)/g,(_,cmd,x,y)=>`^${cmd}${Math.round(x*sx)},${Math.round(y*sy)+offsetYDots}`)
    .replace(/\^A([A-Z0-9])([NBRI]),(\d+),(\d+)/g,(_,font,r,h,w)=>`^A${font}${r},${size(h,sy)},${size(w,sx)}`)
    .replace(/\^(GB|GE|GD)(\d+),(\d+),(\d+)/g,(_,cmd,w,h,t)=>`^${cmd}${size(w,sx)},${size(h,sy)},${size(t,Math.min(sx,sy))}`)
    .replace(/\^FB(\d+),/g,(_,w)=>`^FB${size(w,sx)},`);
  return Buffer.from(zpl,'ascii');
}
module.exports={normalizeCalibration,calibrateZpl};
