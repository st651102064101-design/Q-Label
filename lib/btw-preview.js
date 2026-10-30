'use strict';
const {PNG}=require('pngjs');
const signature=Buffer.from('89504e470d0a1a0a','hex');

// BTW stores a native rendered preview before its serialized design records.
// Preserve that artwork as a picture; this does not deserialize design objects.
function extractBtwPreview(buffer,dimensions={}){
 try{
  const start=buffer.indexOf(signature);if(start<0)return null;
  let end=start+8,done=false;
  while(end+12<=buffer.length){const length=buffer.readUInt32BE(end);if(length>64*1024*1024||end+length+12>buffer.length)return null;const type=buffer.toString('ascii',end+4,end+8);end+=length+12;if(type==='IEND'){done=true;break;}}
  if(!done)return null;
  if(start+24>end||buffer.readUInt32BE(start+16)*buffer.readUInt32BE(start+20)>16000000)return null;
  const png=PNG.sync.read(buffer.subarray(start,end));
  const bg=[...png.data.subarray(0,4)];
  const same=(x,y)=>{const i=(y*png.width+x)*4;return bg.every((c,j)=>Math.abs(png.data[i+j]-c)<=2);};
  let left=0,top=0,right=png.width-1,bottom=png.height-1;
  const grey=bg[3]===255&&bg[0]>20&&bg[0]<240&&Math.max(...bg.slice(0,3))-Math.min(...bg.slice(0,3))<3;
  if(grey&&same(right,0)&&same(0,bottom)&&same(right,bottom)){
   left=png.width;top=png.height;right=-1;bottom=-1;
   for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++)if(!same(x,y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  const width=right-left+1,height=bottom-top+1;if(width<2||height<2)return null;
  const ratio=Number(dimensions.width_in)/Number(dimensions.height_in);
  if(ratio>0&&Math.abs(width/height-ratio)/ratio>.08)return null;
  const crop=new PNG({width,height});
  for(let y=0;y<height;y++)png.data.copy(crop.data,y*width*4,((y+top)*png.width+left)*4,((y+top)*png.width+left+width)*4);
  // Clear only the connected preview surround, preserving grey ink inside art.
  if(grey){const seen=new Uint8Array(width*height),queue=[];const add=(x,y)=>{if(x<0||y<0||x>=width||y>=height)return;const p=y*width+x;if(seen[p])return;seen[p]=1;const i=p*4;if(bg.every((c,j)=>Math.abs(crop.data[i+j]-c)<=2))queue.push(p);};
   for(let x=0;x<width;x++){add(x,0);add(x,height-1);}for(let y=0;y<height;y++){add(0,y);add(width-1,y);}
   for(let n=0;n<queue.length;n++){const p=queue[n],x=p%width,y=Math.floor(p/width);crop.data.set([255,255,255,0],p*4);add(x-1,y);add(x+1,y);add(x,y-1);add(x,y+1);}
  }
  const bytes=Buffer.alloc(Math.ceil(width/8)*height),stride=Math.ceil(width/8);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(crop.data[i+3]>127&&crop.data[i]*.299+crop.data[i+1]*.587+crop.data[i+2]*.114<128)bytes[y*stride+(x>>3)]|=128>>(x&7);}
  if(!bytes.some(Boolean))return null;
  return {source:'btw-embedded-preview',png_data_url:'data:image/png;base64,'+PNG.sync.write(crop).toString('base64'),bitmap_width:width,bitmap_height:height,bitmap_hex:bytes.toString('hex').toUpperCase(),crop:{left,top,width,height}};
 }catch{return null;}
}
function restoreLegacyLibraryArtwork(template,readBytes=require('node:fs').readFileSync){
 const library=template?.bartender_library_template;
 const guessed=!!library?.objects_decomposed&&Array.isArray(template.elements)&&template.elements.length>0&&template.elements.every(item=>item?.source_format==='btw-library-decomposed');
 if(!library?.path||(!guessed&&(library.artwork_imported||!Array.isArray(template.elements)||template.elements.length)))return template;
 try{
  const art=extractBtwPreview(readBytes(library.path),{width_in:Number(template.width_mm)/25.4,height_in:Number(template.height_mm)/25.4});if(!art)return template;
  return {...template,bartender_library_template:{...library,artwork_imported:true,objects_decomposed:false},elements:[{type:'image',label:library.name||template.name,x_mm:0,y_mm:0,width_mm:template.width_mm,height_mm:template.height_mm,bitmap_width:art.bitmap_width,bitmap_height:art.bitmap_height,bitmap_hex:art.bitmap_hex,color_image_data:art.png_data_url,transparent_background:true,source_format:'btw-preview'}]};
 }catch{return template;}
}
module.exports={extractBtwPreview,restoreLegacyLibraryArtwork};
