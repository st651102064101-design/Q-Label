'use strict';
(function(root){
  const linearBarcode=e=>['barcode128','code39','code93','ean13'].includes(e?.type);
  const shape=e=>['box','rectangle','rect','ellipse','line'].includes(e?.type)||(e?.type==='image'&&!!e.shape_preset);
  function supportsControl(e,key){
    if(!e)return false;
    const table=!!e.table_model,text=e.type==='text'||table||(linearBarcode(e)&&e.show_text!==false)||(!!e.barcode_spec&&e.barcode_spec.show_text!==false);
    if(key==='text_wrap')return e.type==='text'||table;
    if(key==='text_auto_fit')return e.type==='text'||table;
    if(key==='text_box_width_mm')return text||linearBarcode(e);
    if(['font_family','font_size_pt','bold','italic','underline','text_inverse','text_wrap','text_align','line_spacing','vertical_align','text_box_height_mm'].includes(key))return text;
    if(key==='stroke_color')return text||table||shape(e);
    if(key==='fill_color')return text||table||e.type==='box'||e.type==='ellipse'||!!e.shape_preset;
    if(key==='barcode_fill_scope')return linearBarcode(e)||!!e.barcode_spec;
    if(key==='clear_fill')return !table&&(e.type==='text'||(linearBarcode(e)&&e.show_text!==false)||e.type==='box'||e.type==='ellipse');
    if(key==='line_style')return shape(e)||table;
    if(key==='thickness_mm')return shape(e)||table;
    if(key==='format_painter')return text||table||shape(e);
    return false;
  }
  const api={supportsControl};
  if(root)root.FormattingCapabilities=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
