(function(root){
  'use strict';
  const DEFAULT_RULES=Object.freeze({text:'proportional',barcode:'free',picture:'proportional',line:'maintain-thickness'});
  const barcodeTypes=new Set(['barcode128','code39','code93','ean13']);
  const proportionalTextKeys=['width_mm','height_mm','text_box_width_mm','text_box_height_mm','font_size_pt','letter_spacing_mm'];
  const barcodeScalarKeys=['module_width'];
  const barcodeVerticalKeys=['bar_height_mm','hri_height_mm','hri_box_height_mm','hri_offset_mm','height_mm'];
  const xyKeys=['x_mm','y_mm'];
  const dimensionKeys=['width_mm','height_mm','text_box_width_mm','text_box_height_mm','bar_height_mm','hri_height_mm','hri_box_height_mm','hri_offset_mm','thickness_mm','letter_spacing_mm','radius_mm','corner_radius_mm','module_width','font_size_pt','magnification'];
  function validSize(size){return !!size&&Number.isFinite(Number(size.width_mm))&&Number(size.width_mm)>0&&Number.isFinite(Number(size.height_mm))&&Number(size.height_mm)>0;}
  function isSignificant(oldSize,newSize){
    if(!validSize(oldSize)||!validSize(newSize))return false;
    return Math.abs(Number(newSize.width_mm)-Number(oldSize.width_mm))>=Number(oldSize.width_mm)*.1-1e-12||Math.abs(Number(newSize.height_mm)-Number(oldSize.height_mm))>=Number(oldSize.height_mm)*.1-1e-12;
  }
  function fail(message){throw new Error(message);}
  function isObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
  function validateDimensionFields(element){
    for(const key of dimensionKeys)if(element[key]!=null&&element[key]!==''&&!Number.isFinite(Number(element[key])))fail('Invalid numeric object field: '+key);
  }
  function validateDesign(design,path){
    if(!isObject(design))fail('Invalid design at '+path);
    if(design.elements!=null){if(!Array.isArray(design.elements))fail('Invalid elements at '+path);for(let i=0;i<design.elements.length;i++){const item=design.elements[i];if(!isObject(item))fail('Invalid object at '+path+'.elements['+i+']');validateDimensionFields(item);}}
    if(design.designs!=null){if(!isObject(design.designs))fail('Invalid designs at '+path);for(const [name,variant] of Object.entries(design.designs))validateDesign(variant,path+'.designs.'+name);}
    if(design.template_pages!=null){if(!Array.isArray(design.template_pages))fail('Invalid template pages at '+path);for(let i=0;i<design.template_pages.length;i++){const page=design.template_pages[i];if(!isObject(page))fail('Invalid template page at '+path+'.template_pages['+i+']');if(page.design!=null)validateDesign(page.design,path+'.template_pages['+i+'].design');}}
  }
  function scaleValue(object,key,factor){if(object[key]==null||object[key]==='')return;const value=Number(object[key]);if(!Number.isFinite(value))fail('Invalid numeric object field: '+key);object[key]=value*factor;}
  function scaleElement(element,oldSize,newSize,rules){
    const reference=validSize(element.scaling_reference_size)?element.scaling_reference_size:oldSize;
    const sx=Number(newSize.width_mm)/Number(reference.width_mm),sy=Number(newSize.height_mm)/Number(reference.height_mm);
    const type=String(element.type||'').toLowerCase(),text=type==='text',qr=type==='qrcode'||type==='datamatrix',barcode=barcodeTypes.has(type)||qr||!!element.barcode_spec,table=type==='table'||!!element.table_model,picture=(type==='image'||type==='picture')&&!table&&!barcode,line=type==='line';
    const category=text?'text':barcode?'barcode':picture?'picture':line?'line':null,rule=category?(rules[category]||DEFAULT_RULES[category]):'free',uniform=Math.min(sx,sy);
    if(rule==='none'){element.scaling_reference_size={...reference};return;}
    delete element.scaling_reference_size;
    scaleValue(element,'x_mm',sx);scaleValue(element,'y_mm',sy);
    if(qr){for(const key of ['width_mm','height_mm','magnification'])scaleValue(element,key,uniform);return;}
    if(text&&rule==='proportional'){
      for(const key of proportionalTextKeys)scaleValue(element,key,uniform);
      for(const key of ['text_ranges','rich_text_ranges'])if(Array.isArray(element[key]))for(const run of element[key])if(isObject(run))scaleValue(run,'font_size_pt',uniform);
      return;
    }
    if(barcode){
      const widthFactor=rule==='proportional'?uniform:sx,heightFactor=rule==='proportional'?uniform:sy;
      scaleValue(element,'width_mm',widthFactor);scaleValue(element,'height_mm',heightFactor);
      for(const key of barcodeScalarKeys)scaleValue(element,key,widthFactor);
      for(const key of barcodeVerticalKeys)if(key!=='height_mm')scaleValue(element,key,heightFactor);
      for(const key of ['text_box_width_mm'])scaleValue(element,key,widthFactor);
      for(const key of ['text_box_height_mm','font_size_pt'])scaleValue(element,key,heightFactor);
      return;
    }
    if(picture&&rule==='proportional'){
      for(const key of ['width_mm','height_mm'])scaleValue(element,key,uniform);
      return;
    }
    if(qr){
      for(const key of ['width_mm','height_mm','magnification'])scaleValue(element,key,uniform);
      return;
    }
    scaleValue(element,'width_mm',sx);scaleValue(element,'height_mm',sy);
    if(line&&rule==='maintain-thickness')return;
    // Stroke widths and radii are scalar geometry; use the horizontal axis,
    // matching the editor's existing page-fit geometry behavior.
    for(const key of ['thickness_mm','radius_mm','corner_radius_mm','module_width'])scaleValue(element,key,sx);
    if(text){
      scaleValue(element,'text_box_width_mm',sx);scaleValue(element,'letter_spacing_mm',sx);
      scaleValue(element,'text_box_height_mm',sy);scaleValue(element,'font_size_pt',sy);
      for(const key of ['text_ranges','rich_text_ranges'])if(Array.isArray(element[key]))for(const run of element[key])if(isObject(run))scaleValue(run,'font_size_pt',sy);
      return;
    }
    if(element.table_model){
      for(const [axis,list,factor] of [['columns',element.table_model.columns,sx],['rows',element.table_model.rows,sy]])if(Array.isArray(list))for(const item of list)if(isObject(item)&&item.mode==='Fixed')scaleValue(item,'size',factor);
    }
  }
  function visitElements(design,visit){
    if(Array.isArray(design.elements))for(const element of design.elements)visit(element);
    for(const variant of Object.values(design.designs||{}))visitElements(variant,visit);
    for(const page of design.template_pages||[])if(page.design)visitElements(page.design,visit);
  }
  function retainArtworkSize(document,oldSize){
    // Keeping artwork changes the cell size, but not the coordinate space in
    // which existing objects were authored. New objects have no reference yet.
    if(!validSize(oldSize))return;
    visitElements(document,element=>{
      if(!validSize(element.scaling_reference_size))element.scaling_reference_size={width_mm:Number(oldSize.width_mm),height_mm:Number(oldSize.height_mm)};
    });
  }
  function scaleDocument(document,oldSize,newSize,rules={}){
    try{
      if(!validSize(oldSize)||!validSize(newSize))fail('Template sizes must be finite positive dimensions.');
      if(!isObject(document))fail('Invalid document.');
      const output=typeof structuredClone==='function'?structuredClone(document):JSON.parse(JSON.stringify(document));
      validateDesign(output,'document');
      const effectiveRules={...DEFAULT_RULES,...(isObject(rules)?rules:{})};
      visitElements(output,element=>scaleElement(element,oldSize,newSize,effectiveRules));
      output.width_mm=Number(newSize.width_mm);output.height_mm=Number(newSize.height_mm);
      return {ok:true,document:output};
    }catch(error){return {ok:false,error:error instanceof Error?error.message:String(error)};}
  }
  const api={DEFAULT_RULES,isSignificant,scaleDocument,retainArtworkSize};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TemplateScaling=api;
})(typeof window!=='undefined'?window:globalThis);

