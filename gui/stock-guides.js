'use strict';
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./stock-antenna-catalog'):root.StockAntennaCatalog);if(typeof module==='object'&&module.exports)module.exports=api;else root.StockGuides=api;})(typeof window==='undefined'?globalThis:window,function(catalog){
 const anchors=['top-left','top-center','top-right','center-left','center','center-right','bottom-left','bottom-center','bottom-right'];
 const finite=(n,f=0)=>Number.isFinite(Number(n))?Number(n):f;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 function antennaBox(s={},w,h){const index=Math.max(0,anchors.indexOf(s.anchor||'center')),ax=(index%3)/2,ay=Math.floor(index/3)/2;
  const width=s.method==='manual'?Math.max(.01,finite(s.width_mm,w)):w,height=s.method==='manual'?Math.max(.01,finite(s.height_mm,h)):h;
  const ox=({left:0,center:.5,right:1})[s.origin_x||'center']??.5,oy=({top:0,center:.5,bottom:1})[s.origin_y||'center']??.5;
  return{x:w*ox+finite(s.x_mm)-width*ax,y:h*oy+finite(s.y_mm)-height*ay,width,height,angle:finite(s.angle)};
 }
 function validImage(src){return typeof src==='string'&&src.length<16*1024*1024&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(src);}
 function addImage(images,image){if(!image?.name?.trim()||!validImage(image.src)||!(image.width_mm>0&&image.height_mm>0))throw Error('Choose a valid PNG, JPEG or WebP image with positive dimensions.');const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);return[...images,{...image,id,name:image.name.trim(),builtin:false}];}
 function removeImage(images,id){if(catalog.some(x=>x.id===id))throw Error('Built-in antenna images cannot be deleted.');return images.filter(x=>x.id!==id);}
 function render(template,w,h,{side='front',context='setup'}={}){
  const stock=template.stock||{},s=stock.rfid_antenna||{},m=stock.magnetic_stripe||{};let out='';
  if(context==='setup'&&s.enabled){const image=[...catalog,...(stock.antenna_images||[])].find(x=>x.id===(s.image_id||'generic'));if(image&&(image.builtin?catalog.some(x=>x.src===image.src):validImage(image.src))){const b=antennaBox(s,w,h);out+=`<g data-rfid-antenna="${escape(image.id)}" transform="rotate(${b.angle} ${b.x+b.width/2} ${b.y+b.height/2})" opacity=".22"><image href="${escape(image.src)}" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" preserveAspectRatio="none"/></g>`;}}
  const display=m.display||'automatic',resolved=display==='automatic'?stock.detected_magnetic_side:display;
  if(['front','back'].includes(resolved)&&resolved===side&&(context==='setup'||m.show_print_preview)){
   const edge=['left','right','top','bottom'].includes(m.edge)?m.edge:'top',offset=Math.max(0,finite(m.offset_mm)),thick=Math.max(0,finite(m.thickness_mm)),vertical=['left','right'].includes(edge),extent=vertical?w:h,t=Math.min(extent,thick),pos=edge==='right'||edge==='bottom'?extent-offset-t:offset;
   const color=/^#[a-f\d]{6}$/i.test(m.color||'')?m.color:'#000000';
   if(t>0)out+=`<rect data-magnetic-stripe="${resolved}" x="${vertical?pos:0}" y="${vertical?0:pos}" width="${vertical?t:w}" height="${vertical?h:t}" fill="${color}"/>`;
  }return out;
 }
 function printPreview(template){const w=Number(template.width_mm),h=Number(template.height_mm);if(!(w>0&&h>0))return '';const mark=render(template,w,h,{side:template.design_active==='back'?'back':'front',context:'print-preview'});if(!mark)return '';const page=template.page?.enabled?template.page:null,rows=Math.min(100,Math.max(1,Math.floor(finite(page?.rows,1)))),cols=Math.min(100,Math.max(1,Math.floor(finite(page?.columns,1))));let out='';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=finite(page?.left_mm)+c*(w+finite(page?.gap_x_mm)),y=finite(page?.top_mm)+r*(h+finite(page?.gap_y_mm));out+=`<svg data-stock-preview-guide="true" x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="hidden">${mark}</svg>`;}return out;}
 return{catalog,anchors,antennaBox,addImage,removeImage,validImage,render,printPreview};
});
