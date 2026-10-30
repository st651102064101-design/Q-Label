'use strict';
const bwip=require('bwip-js');
const {PNG}=require('pngjs');
const {createHash}=require('node:crypto');
const {categoryFor}=require('../gui/barcode-categories');
// Components and color encodings cannot be printed as standalone monochrome labels.
// Each supported symbol gets one app-specific home category so overlapping
// keyword matches cannot repeat the same barcode in multiple folders.
const catalog=bwip.symbolList.filter(s=>!['raw','symbol','gs1-cc','ultracode'].includes(s.bcid)).map(s=>{
  const category=categoryFor(s.bcid);
  return {...s,category,folders:[category]};
});
const nativeFonts=new Set();
function nativeHriFont(hri){
  if(!hri)return null;
  if(!(Number.isFinite(hri.font_size_pt)&&hri.font_size_pt>0&&hri.font_size_pt<=1000))throw Error('Native HRI font size must be positive and bounded');
  const encoded=hri.font_data_base64;
  if(typeof encoded!=='string'||encoded.length>24*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw Error('Native HRI font data must be bounded Base64');
  const bytes=Buffer.from(encoded,'base64');
  if(bytes.toString('base64')!==encoded||!bytes.length||createHash('sha256').update(bytes).digest('hex')!==hri.font_sha256?.toLowerCase())throw Error('Native HRI font identity does not match its original SHA-256');
  const name='qlabel-native-'+hri.font_sha256.toLowerCase();
  if(!nativeFonts.has(name)){bwip.loadFont(name,100,bytes);nativeFonts.add(name);}
  return name;
}
function nativeUpcaPng(options,xMm){
  // BWIPP subtracts two module-space units for the two outside digits.
  // The native UPC driver uses three quarters of the selected point size.
  // Correct both measurement and drawing so the output bounds include it.
  return new Promise((resolve,reject)=>{
    const drawing=bwip.drawingZlibPng((error,png)=>error?reject(error):resolve(png)),measure=drawing.measure,drawText=drawing.text,init=drawing.init;
    const originalOutside=(options.textsize-2)*options.scale,actualOutside=options.textsize*.75*options.scale;
    const metrics=measure.call(drawing,'0123456789',options.textfont,options.textsize*options.scale,options.textsize*options.scale);
    // Native Bar alignment keeps the numeral ink below the bars as the font
    // grows. Its baseline is shared by central and outside digits; BWIPP's
    // fixed baseline otherwise lets a larger font join the data bars.
    const baseline=options.height*72/25.4*options.scale+3*(25.4/72)/xMm*options.scale+metrics.ascent;
    function outside(width,height){return Math.abs(width-originalOutside)<1e-6&&Math.abs(height-originalOutside)<1e-6;}
    drawing.measure=function(text,font,width,height){return measure.call(this,text,font,...(outside(width,height)?[actualOutside,actualOutside]:[width,height]));};
    drawing.init=function(width,height){return init.call(this,width,Math.max(height,Math.ceil(baseline+metrics.descent+1)));};
    drawing.text=function(x,y,text,rgb,font){return drawText.call(this,x,baseline,text,rgb,outside(font.width,font.height)?{...font,width:actualOutside,height:actualOutside}:font);};
    try{bwip.render(options,drawing);}catch(error){reject(error);}
  });
}
async function encode(spec){
  const item=catalog.find(s=>s.bcid===spec.bcid);if(!item)throw Error('Unsupported barcode symbology');
  if(spec.bytes!=null&&(!Array.isArray(spec.bytes)||spec.bytes.some(byte=>!Number.isInteger(byte)||byte<0||byte>255)))throw Error('Barcode data contains an invalid byte');
  let text=spec.bytes!=null?spec.bytes.map(byte=>String.fromCharCode(byte)).join(''):String(spec.text??'');if(!text.length||text.length>10000)throw Error('Enter barcode data (maximum 10,000 characters).');
  if(spec.native_datamatrix)return require('./native-datamatrix-layout').encodeNativeDataMatrix(spec,text);
  let nativeSize=null;
  if(spec.native_upca){
    if(spec.bcid!=='upca')throw Error('Native UniGDI source profile requires UPC-A');
    if(spec.native_upca.profile!=='UniGDI-12.1'||spec.bytes!=null||spec.fit_width)throw Error('Unsupported native UPC profile configuration');
    const native=require('./btw-native-upca');text=native.nativeUpcaData(text);nativeSize=native.nativeUpcaSize(spec.native_upca);
  }
  const options={bcid:item.bcid,text,scale:3,padding:12,backgroundcolor:'FFFFFF',includetext:spec.show_text!==false};
  if(nativeSize)options.validatecheck=true;
  const nativeFont=nativeHriFont(spec.native_hri);
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
  let xMm=nativeSize?nativeSize.effective_x_mm:Number(spec.x_mm);
  if(xMm>0&&spec.fit_width){const raw=bwip.raw({...options,includetext:false})[0],modules=raw.sbs?.reduce((a,b)=>a+b,0);if(!modules)throw Error('Width fitting is only supported for linear symbols.');const min=Number(spec.min_x_mm)||.1,max=Number(spec.max_x_mm)||1;if(max<min)throw Error('Invalid X dimension range.');xMm=Math.max(min,Math.min(max,Number(spec.target_width_mm)/modules));}
  if(xMm>0){options.padding=0;options.height=(Number(spec.bar_height_mm)||10)/xMm*25.4/72;}
  if(xMm>0&&(!(Number.isFinite(xMm))||!(Number(spec.bar_height_mm||10)>0)||(Number(spec.bar_height_mm)||10)/xMm*3>8192))throw Error('Barcode dimensions exceed the bitmap limit.');
  if(Number(spec.bar_adjust))options.inkspread=-Number(spec.bar_adjust)/3;
  if(spec.hri_text!=null)options.alttext=String(spec.hri_text);
  if(spec.bytes!=null)options.binarytext=true;
  if(nativeFont){
    options.textfont=nativeFont;
    // BWIPP measures HRI in module-space when physical X dimensions are used.
    options.textsize=spec.native_hri.font_size_pt*(25.4/72)/(xMm>0?xMm:25.4/72);
  }
  if(nativeSize)options.guarddescent=5*(25.4/72)/xMm;
  const hriSegments=nativeFont&&options.includetext?bwip.raw(options).flatMap(row=>(row.txt||[]).map(([text,x,y,font,size])=>({text,x,y,font,size}))):null;
  if(nativeSize&&hriSegments?.length===12){hriSegments[0].size=options.textsize*.75;hriSegments[11].size=options.textsize*.75;}
  const png=await (nativeSize&&nativeFont&&options.includetext?nativeUpcaPng(options,xMm):bwip.toBuffer(options)),image=PNG.sync.read(png),stride=Math.ceil(image.width/8),bytes=Buffer.alloc(stride*image.height);
  let nativeArtworkBounds=null;
  if(nativeSize){
    // UPC guard bars begin at the top of the image. Their first/last runs
    // delimit the 95-module bar region, excluding the two outside HRI digits.
    let first=-1,last=-1;
    for(let x=0;x<image.width;x++){const p=x*4;if(image.data[p]*.299+image.data[p+1]*.587+image.data[p+2]*.114<200){if(first<0)first=x;last=x;}}
    if(first<0||last<first)throw Error('Native UPC raster is missing its bar region');
    nativeArtworkBounds={bar_origin_x_mm:first/3*xMm,bar_origin_y_mm:0,bar_width_mm:nativeSize.bar_width_mm,bar_height_mm:Number(spec.bar_height_mm)||10,guard_descent_mm:5*25.4/72,bar_origin_x_px:first,bar_width_px:last-first+1};
  }
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const p=(y*image.width+x)*4;if(image.data[p]*.299+image.data[p+1]*.587+image.data[p+2]*.114<200)bytes[y*stride+(x>>3)]|=0x80>>(x&7);}
  return {src:'data:image/png;base64,'+png.toString('base64'),bitmap_width:image.width,bitmap_height:image.height,bitmap_hex:bytes.toString('hex'),...(nativeFont?{hri_font_sha256:spec.native_hri.font_sha256,hri_segments:hriSegments||[]}:{}),...(nativeSize?{native_upca_size:nativeSize,native_artwork_bounds:nativeArtworkBounds,hri_display_text:hriSegments?.map(s=>s.text).join('')}:{}),...(xMm>0?{physical_width_mm:image.width/3*xMm,physical_height_mm:image.height/3*xMm,effective_x_mm:xMm}:{})};
}
module.exports={catalog,encode,categoryFor};
