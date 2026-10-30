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
function calibrateZpl(buffer, calibration, offsetYDots=0, offsetXDots=0) {
  const sx=calibration.scaleX/100, sy=calibration.scaleY/100;
  if(sx===1 && sy===1 && offsetYDots===0 && offsetXDots===0)return buffer;
  const size=(n,s)=>Math.max(1,Math.round(Number(n)*s));
  let zpl=buffer.toString('ascii');
  zpl=zpl.replace(/\^GFA,(\d+),(\d+),(\d+),([0-9A-F]+)\^FS/g,(_,total,used,stride,hex)=>{
    const source=Buffer.from(hex,'hex'), sw=Number(stride)*8, sh=Number(total)/Number(stride);
    const w=size(sw,sx),h=size(sh,sy),row=Math.ceil(w/8);
    if(w*h>64000000)throw Error('Calibrated graphic exceeds the print bitmap limit.');
    const bytes=Buffer.alloc(row*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      // Sample both endpoints so the final ink row/column survives resizing.
      const px=w===1?0:Math.round(x*(sw-1)/(w-1)),py=h===1?0:Math.round(y*(sh-1)/(h-1));
      if(source[py*Number(stride)+(px>>3)]&(128>>(px&7)))bytes[y*row+(x>>3)]|=128>>(x&7);
    }
    return `^GFA,${bytes.length},${bytes.length},${row},${bytes.toString('hex').toUpperCase()}^FS`;
  });
  zpl=zpl.replace(/\^(FO|FT)(-?\d+),(-?\d+)/g,(_,cmd,x,y)=>`^${cmd}${Math.round(x*sx)+offsetXDots},${Math.round(y*sy)+offsetYDots}`)
    .replace(/\^A([A-Z0-9])([NBRI]),(\d+),(\d+)/g,(_,font,r,h,w)=>`^A${font}${r},${size(h,sy)},${size(w,sx)}`)
    .replace(/\^(GB|GE|GD)(\d+),(\d+),(\d+)/g,(_,cmd,w,h,t)=>`^${cmd}${size(w,sx)},${size(h,sy)},${size(t,Math.min(sx,sy))}`)
    .replace(/\^FB(\d+),/g,(_,w)=>`^FB${size(w,sx)},`);
  return Buffer.from(zpl,'ascii');
}
function edgeReferenceZpl(media,dotsPerMm){
 const w=Math.round(Number(media.width_mm)*dotsPerMm),h=Math.round(Number(media.height_mm)*dotsPerMm);
 if(!(dotsPerMm>0&&w>dotsPerMm*12&&h>dotsPerMm*12&&w<32000&&h<32000))throw Error('The label is too small or its dimensions are invalid for an edge test.');
 const lines=['^XA',`^PW${w}`,'^LH0,0','^PON','^PMN','^LRN','^LS0','^FWN','^MMT','~JSB','^MNY','^LT0','~TA000'];
 for(let n=0;n<=3;n++){const inset=Math.round(n*dotsPerMm);lines.push(`^FO${inset},${inset}^GB${w-2*inset},${h-2*inset},2^FS`);}
 const x=Math.round(dotsPerMm*5),y=x,font=Math.max(14,Math.round(dotsPerMm));
 lines.push(`^FO${x},${y}^A0N,${font},${Math.round(font*.65)}^FDEDGE TEST^FS`,`^FO${x},${y+font+8}^A0N,${font},${Math.round(font*.6)}^FD${Number(media.width_mm).toFixed(2)} x ${Number(media.height_mm).toFixed(2)} mm^FS`,'^PQ1','^XZ');return Buffer.from(lines.join('\n'),'ascii');
}
function validateRegisteredRaster(buffer,registration,{dotsPerMm,labelTopMm,shiftXMm,widthMm,heightMm}){
 const b=registration.bounds||{left:registration.offsetX,top:registration.offsetY,right:registration.offsetX+widthMm*registration.scaleX/100,bottom:registration.offsetY+heightMm*registration.scaleY/100},tolerance=1/dotsPerMm+.0001;
 for(const m of buffer.toString('ascii').matchAll(/\^FO(\d+),(\d+)\^GFA,(\d+),(\d+),(\d+),([A-F0-9]+)\^FS/g)){
  const stride=Number(m[5]),bytes=Buffer.from(m[6],'hex');let left=stride*8,top=bytes.length/stride,right=-1,bottom=-1;
  for(let i=0;i<bytes.length;i++){if(!bytes[i])continue;const y=Math.floor(i/stride),bx=i%stride;for(let bit=0;bit<8;bit++)if(bytes[i]&(128>>bit)){const x=bx*8+bit;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
  if(right<0)continue;const x=Number(m[1])/dotsPerMm+shiftXMm,y=Number(m[2])/dotsPerMm+labelTopMm;
  if(x+left/dotsPerMm<b.left-tolerance||x+(right+1)/dotsPerMm>b.right+tolerance||y+top/dotsPerMm<b.top-tolerance||y+(bottom+1)/dotsPerMm>b.bottom+tolerance)throw Error('The adjusted artwork extends beyond the detected sticker edges. Reset additional manual adjustments before printing.');
  if((Number(m[2])+bottom+1)/dotsPerMm>heightMm+tolerance)throw Error('The adjusted artwork exceeds the calibrated feed length. Reset the vertical manual offset before printing.');
 }
}
module.exports={normalizeCalibration,calibrateZpl,edgeReferenceZpl,validateRegisteredRaster};
