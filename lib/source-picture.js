'use strict';
const {PNG}=require('pngjs');
function convertPicture(input,config={},nativeImage){
  let image;try{image=PNG.sync.read(Buffer.from(input));}catch(error){if(!nativeImage)throw Error('Unable to decode this picture without an image codec: '+error.message);const decoded=nativeImage.createFromBuffer(Buffer.from(input));if(decoded.isEmpty())throw Error('Invalid picture data');image=PNG.sync.read(decoded.toPNG());}
  if(image.width*image.height>16000000)throw Error('Picture dimensions exceed 16 million pixels');
  let width=image.width,height=image.height;
  if(config.sizing==='percentage'){const scale=Number(config.percentage??100)/100;width=Math.round(width*scale);height=Math.round(height*scale);}
  else if(config.width||config.height){const w=Number(config.width)||width,h=Number(config.height)||height;if(config.sizing==='stretch'){width=w;height=h;}else{const scale=Math.min(w/width,h/height);width=Math.round(width*scale);height=Math.round(height*scale);}}
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>4096||height>4096||width*height>16000000)throw Error('Picture dimensions must be positive and within the supported size');
  const output=new PNG({width,height}),errors=new Float64Array((width+2)*(height+2));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const source=(Math.min(image.height-1,Math.floor(y*image.height/height))*image.width+Math.min(image.width-1,Math.floor(x*image.width/width)))*4,target=(y*width+x)*4;
    const alpha=image.data[source+3]/255,r=image.data[source]*alpha+255*(1-alpha),g=image.data[source+1]*alpha+255*(1-alpha),b=image.data[source+2]*alpha+255*(1-alpha);let channels=[r,g,b];
    if(config.colors==='grayscale'||config.colors==='monochrome'){
      let gray=.299*r+.587*g+.114*b;
      if(config.colors==='monochrome'){const index=(y+1)*(width+2)+x+1;gray+=errors[index];const level=gray<128?0:255;
        if(config.dithering==='floyd-steinberg'){const error=gray-level;errors[index+1]+=error*7/16;errors[index+width+1]+=error*3/16;errors[index+width+2]+=error*5/16;errors[index+width+3]+=error/16;}gray=level;
      }channels=[gray,gray,gray];
    }
    output.data.set([...channels.map(c=>Math.round(Math.max(0,Math.min(255,c)))),255],target);
  }
  let bytes;const format=config.format||'png',png=PNG.sync.write(output);
  if(format==='png')bytes=png;
  else if(format==='jpeg'){if(!nativeImage)throw Error('JPEG output requires the desktop image codec');const quality=Number(config.quality??90);if(!Number.isInteger(quality)||quality<1||quality>100)throw Error('JPEG quality must be from 1 to 100');bytes=nativeImage.createFromBuffer(png).toJPEG(quality);}
  else if(format==='bmp'){
    const stride=Math.ceil(width*3/4)*4;bytes=Buffer.alloc(54+stride*height);bytes.write('BM');bytes.writeUInt32LE(bytes.length,2);bytes.writeUInt32LE(54,10);bytes.writeUInt32LE(40,14);bytes.writeInt32LE(width,18);bytes.writeInt32LE(height,22);bytes.writeUInt16LE(1,26);bytes.writeUInt16LE(24,28);bytes.writeUInt32LE(stride*height,34);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=(y*width+x)*4,q=54+(height-y-1)*stride+x*3;bytes[q]=output.data[p+2];bytes[q+1]=output.data[p+1];bytes[q+2]=output.data[p];}
  }else throw Error('Picture format requires an unavailable codec: '+format);
  return {kind:'picture',bytes:Array.from(bytes),width,height,format};
}
module.exports={convertPicture};
