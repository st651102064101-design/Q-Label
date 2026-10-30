(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ImageExport=api;})(typeof window==='undefined'?globalThis:window,function(){
  function options(input={},printerDpi=203){
    const dpi=Number(input.resolution==='printer'?printerDpi:input.dpi??printerDpi);
    if(!Number.isFinite(dpi)||dpi<72||dpi>2400)throw Error('Resolution must be between 72 and 2400 dpi.');
    return {scope:input.scope==='selected'?'selected':'template',destination:['clipboard','pdf'].includes(input.destination)?input.destination:'file',includeNonPrinting:input.includeNonPrinting!==false,transparent:input.transparent!==false,colors:['auto','color','grayscale','mono'].includes(input.colors)?input.colors:'auto',dpi};
  }
  function plan(template,selection,input,boxes=[],enabledIndices,printerDpi){
    const opts=options(input,printerDpi||template.dpi||203),selected=new Set(selection||[]),enabled=Array.isArray(enabledIndices)?new Set(enabledIndices):null;
    if(opts.scope==='selected'&&!selected.size)throw Error('Select objects before exporting.');
    const indices=(template.elements||[]).map((e,i)=>i).filter(i=>(opts.scope!=='selected'||selected.has(i))&&(opts.includeNonPrinting||(template.elements[i].enabled!==false&&(!enabled||enabled.has(i)))));
    if(opts.scope==='selected'&&!indices.length)throw Error('No exportable objects are selected.');
    let viewport;
    if(opts.scope==='selected'){
      const bounds=boxes.filter(b=>indices.includes(b.index)).map(b=>{const angle=(Number(template.elements[b.index].rotation_deg)||0)*Math.PI/180,c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle)),w=b.w*c+b.h*s,h=b.w*s+b.h*c;return {x:b.x+b.w/2-w/2,y:b.y+b.h/2-h/2,w,h};});
      if(!bounds.length)throw Error('Could not measure the selected objects.');
      const x=Math.min(...bounds.map(b=>b.x)),y=Math.min(...bounds.map(b=>b.y));viewport={x,y,w:Math.max(...bounds.map(b=>b.x+b.w))-x,h:Math.max(...bounds.map(b=>b.y+b.h))-y};
    }else{const p=template.page?.enabled?template.page:template;viewport={x:template.page?.enabled?-(Number(p.left_mm)||0):0,y:template.page?.enabled?-(Number(p.top_mm)||0):0,w:Number(p.width_mm),h:Number(p.height_mm)};}
    const width=Math.max(1,Math.round(viewport.w*opts.dpi/25.4)),height=Math.max(1,Math.round(viewport.h*opts.dpi/25.4));
    if(![viewport.x,viewport.y,viewport.w,viewport.h].every(Number.isFinite)||viewport.w<=0||viewport.h<=0||width>8192||height>8192||width*height>16000000)throw Error('Image is too large or has invalid dimensions. Reduce the resolution.');
    // Keep source DPI: dot-based bars and font metrics must retain their physical size.
    const copy=JSON.parse(JSON.stringify(template));
    if(opts.scope==='selected'){copy.background=null;copy.print_border=false;}
    return {options:opts,template:copy,indices,viewport,width,height};
  }
  function convertPixels(pixels,mode){if(!['grayscale','mono'].includes(mode))return pixels;for(let i=0;i<pixels.length;i+=4){let v=Math.round(.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2]);if(mode==='mono')v=v<128?0:255;pixels[i]=pixels[i+1]=pixels[i+2]=v;}return pixels;}
  async function deliver(plan,dataUrl,bridge,name){const pdf=plan.options.destination==='pdf',payload={defaultName:name+(pdf?'.pdf':'.png'),dataUrl,dpi:plan.options.dpi,...(pdf?{width_mm:plan.viewport.w,height_mm:plan.viewport.h}:{})};const result=await (plan.options.destination==='clipboard'?bridge.copyImage(payload):pdf?bridge.savePdf(payload):bridge.savePng(payload));if(result?.error)throw Error(result.error);if(!result?.canceled&&!result?.ok&&!result?.path)throw Error('Could not export image.');return result;}
  return {options,plan,convertPixels,deliver};
});
