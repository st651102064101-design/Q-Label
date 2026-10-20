'use strict';
const ObjectData=require('../gui/object-data');
function renderCode128(object,dpi,data={}){
 const s=object.barcode_spec;if(!s?.x_mm||s.bcid!=='code128'||s.print_method==='host'||!['printer','hybrid'].includes(s.print_method)||Number(s.bar_adjust)!==0&&s.bar_adjust!=null)return null;
 let text=ObjectData.encodingText(object,data,true),mode=s.code_set==='Auto'||!s.code_set?'A':'N',prefix='';
 // Keep extended encodings on the host path; printer character maps vary by firmware.
 if(/[^\x20-\x7e]/.test(text)||text.includes('>')||s.text_encoding==='utf8'||Number(object.rotation_deg))return null;
 if(s.code_set==='C'&&!s.hibc&&!s.gs1&&!/^(\d{2})+$/.test(text))throw Error('Code set C requires an even number of digits.');
 if(s.gs1)require('bwip-js').raw({bcid:'gs1-128',text});
 if(s.hibc){const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';text='+'+text;let sum=0;for(const c of text){const n=alphabet.indexOf(c);if(n<0)throw Error('Invalid HIBC character.');sum+=n;}text+=alphabet[sum%43];}
 if(s.gs1)mode='D';else if(s.code_set&&s.code_set!=='Auto')prefix={A:'>9',B:'>:',C:'>;'}[s.code_set]||'';
 const x=Math.round((Number(object.x_mm)||0)*dpi/25.4),y=Math.round((Number(object.y_mm)||0)*dpi/25.4),h=Math.max(1,Math.round((Number(s.bar_height_mm)||10)*dpi/25.4));
 const authoredX=!s.x_locked&&!s.fit_width&&Number(object.bitmap_width)>0?Number(object.width_mm)*3/Number(object.bitmap_width):Number(s.effective_x_mm)||s.x_mm;
 const module=Math.max(1,Math.round(authoredX*dpi/25.4)),show=s.show_text!==false,printerText=show&&s.print_method==='printer';
 const hex=Buffer.from(prefix+text,'ascii').toString('hex').toUpperCase().match(/../g).map(b=>'_'+b).join('');
 let output=`^FO${x},${y}^BY${module}^BCN,${h},${printerText?'Y':'N'},N,N,${mode}^FH_^FD${hex}^FS`;
 if(show&&s.print_method==='hybrid'){
  const {createCanvas}=require('@napi-rs/canvas'),width=Math.max(1,Math.round(Number(object.width_mm)*dpi/25.4)),height=Math.max(1,Math.round((Number(object.hri_height_mm)||3)*dpi/25.4)),canvas=createCanvas(width,height+4),ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height+4);ctx.fillStyle='#000';ctx.font=`${height}px "${object.font_family||'Arial'}"`;ctx.textBaseline='top';ctx.textAlign='center';ctx.fillText(ObjectData.humanReadable(object,data,true),width/2,0,width);
  const pixels=ctx.getImageData(0,0,width,height+4).data,stride=Math.ceil(width/8),bytes=Buffer.alloc(stride*(height+4));for(let py=0;py<height+4;py++)for(let px=0;px<width;px++)if(pixels[(py*width+px)*4]<128)bytes[py*stride+(px>>3)]|=128>>(px&7);
  output+=`^FO${x},${y+h+Math.round(.6*dpi/25.4)}^GFA,${bytes.length},${bytes.length},${stride},${bytes.toString('hex').toUpperCase()}^FS`;
 }
 return output;
}
module.exports={renderCode128};
