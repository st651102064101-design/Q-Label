(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ObjectData=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function resolve(element,data={},strict=false){
    if(Array.isArray(element.dataSourceRefs)){
      const evaluated=data['$qlabel.sources'],value=evaluated?.objects?.[element.id];
      if(value)return value.text;
      if(strict)throw Error(evaluated?.diagnostics?.find(d=>d.objectId===element.id)?.message||'Object data sources have not been evaluated');
      return '';
    }
    let text=String(element.barcode_spec?.text??element.text??'').replace(/\{\{\s*([\w.\-]+)\s*\}\}/g,(_,name)=>String(data[name]??''));if(element.data_transform==='upper')text=text.toUpperCase();if(element.data_transform==='lower')text=text.toLowerCase();if(element.data_transform==='trim')text=text.trim();if(strict&&element.data_type==='number'&&text!==''&&!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text))throw Error('Object data must be numeric.');return String(element.data_prefix||'')+text+String(element.data_suffix||'');
  }
  function humanReadable(element,data={},strict=false){return data['$qlabel.sources']?.objects?.[element.id]?.hriText??resolve(element,data,strict);}
  function encodingText(element,data={},strict=false){return data['$qlabel.sources']?.objects?.[element.id]?.encodingText??resolve(element,data,strict);}
  function artwork(element,data={},strict=false){
    const image=data['$qlabel.sources']?.objects?.[element.id]?.artwork;if(image){
      const result={...element,...image},offset=image.artwork_offset_mm;
      if(offset){result.x_mm=Number(element.x_mm??element.x??0)+offset.x;result.y_mm=Number(element.y_mm??element.y??0)+offset.y;}
      return result;
    }
    if(element.source_picture&&Array.isArray(element.dataSourceRefs)){
      if(strict)throw Error('Picture artwork requires prepared data source input');
      return {...element,bitmap_width:1,bitmap_height:1,bitmap_hex:'00',color_image_data:undefined};
    }
    if(element.barcode_spec&&Array.isArray(element.dataSourceRefs)){
      if(strict)throw Error('Barcode artwork requires prepared data source input');
      return {...element,bitmap_width:1,bitmap_height:1,bitmap_hex:'00',barcode_bars:null,barcode_display_text:''};
    }
    return element;
  }
  return {resolve,humanReadable,encodingText,artwork};
});
