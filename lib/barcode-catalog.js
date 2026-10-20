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
  if(spec.text_encoding==='ascii'&&/[^\x00-\x7f]/.test(text))throw Error('Data cannot be represented by 7-bit ASCII.');
  if(spec.text_encoding==='latin1'&&/[^\x00-\xff]/.test(text))throw Error('Data cannot be represented by ISO-8859-1.');
  if(spec.text_encoding==='utf8'){options.text=Buffer.from(text,'utf8').toString('latin1');options.binarytext=true;}
  if(spec.bcid==='code128'){
    if(spec.hibc&&spec.gs1)throw Error('HIBC and GS1 cannot be enabled together.');
    if(spec.hibc)options.bcid='hibccode128';
    else if(spec.gs1)options.bcid='gs1-128';
    else if(spec.code_set&&spec.code_set!=='Auto'){
      const set=spec.code_set,codes=[];
      if(!['A','B','C'].includes(set))throw Error('Invalid Code 128 code set.');
      codes.push({A:103,B:104,C:105}[set]);
      if(set==='C'){if(!/^(\d{2})+$/.test(text))throw Error('Code set C requires an even number of digits.');for(let i=0;i<text.length;i+=2)codes.push(Number(text.slice(i,i+2)));}
      else for(const char of options.text){const n=char.charCodeAt(0);if(set==='A'&&(n>95)||set==='B'&&(n<32||n>127))throw Error('Data is outside Code set '+set);codes.push(set==='A'?(n<32?n+64:n-32):n-32);}
      options.text=codes.map(n=>'^'+String(n).padStart(3,'0')).join('');options.raw=true;options.alttext=text;
    }
  }
  let xMm=Number(spec.x_mm);
  if(xMm>0&&spec.fit_width){const raw=bwip.raw({...options,includetext:false})[0],modules=raw.sbs?.reduce((a,b)=>a+b,0);if(!modules)throw Error('Width fitting is only supported for linear symbols.');const min=Number(spec.min_x_mm)||.1,max=Number(spec.max_x_mm)||1;if(max<min)throw Error('Invalid X dimension range.');xMm=Math.max(min,Math.min(max,Number(spec.target_width_mm)/modules));}
  if(xMm>0){options.padding=0;options.height=(Number(spec.bar_height_mm)||10)/xMm*25.4/72;}
  if(xMm>0&&(!(Number.isFinite(xMm))||!(Number(spec.bar_height_mm||10)>0)||(Number(spec.bar_height_mm)||10)/xMm*3>8192))throw Error('Barcode dimensions exceed the bitmap limit.');
  if(Number(spec.bar_adjust))options.inkspread=-Number(spec.bar_adjust)/3;
  if(spec.hri_text!=null)options.alttext=String(spec.hri_text);
  if(spec.bytes!=null)options.binarytext=true;
  const png=await bwip.toBuffer(options),image=PNG.sync.read(png),stride=Math.ceil(image.width/8),bytes=Buffer.alloc(stride*image.height);
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const p=(y*image.width+x)*4;if(image.data[p]*.299+image.data[p+1]*.587+image.data[p+2]*.114<200)bytes[y*stride+(x>>3)]|=0x80>>(x&7);}
  return {src:'data:image/png;base64,'+png.toString('base64'),bitmap_width:image.width,bitmap_height:image.height,bitmap_hex:bytes.toString('hex'),...(xMm>0?{physical_width_mm:image.width/3*xMm,physical_height_mm:image.height/3*xMm,effective_x_mm:xMm}:{})};
}
module.exports={catalog,encode,categoryFor};
