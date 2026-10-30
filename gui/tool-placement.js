(function(root){
  'use strict';
  function payload(source){
    if(source._placementPayload)return source._placementPayload();
    if(source._placementElement)return {kind:'recent-object',value:source._placementElement};
    if(source.dataset.tisSymbolIndex!==undefined)return {kind:'tis-symbol',value:Number(source.dataset.tisSymbolIndex)};
    if(source.dataset.shapePreset)return {kind:'shape-preset',value:source.dataset.shapePreset};
    if(source.dataset.sourceField)return {kind:'field',value:source.dataset.sourceField};
    if(source.dataset.sourceText!==undefined)return {kind:'object-value',value:source.dataset.sourceText};
    const type=source.dataset.insertTool||source.dataset.add||(source.id==='addImageBtn'?'image':null);
    return type?{kind:'tool',value:type}:null;
  }
  function beginRecentObjectDrag(event,element){
    if(!element)return null;
    const value={kind:'recent-object',value:element},transfer=event?.dataTransfer;
    if(transfer){transfer.effectAllowed='copy';transfer.setData('application/x-bratender-insert',JSON.stringify(value));}
    return value;
  }
  function ghost(source,document){
    const svg=source.querySelector('svg');
    if(svg){const copy=svg.cloneNode(true);copy.style.width='36px';copy.style.height='36px';copy.style.display='block';
      if(!copy.hasAttribute('fill'))copy.setAttribute('fill','none');
      if(!copy.hasAttribute('stroke'))copy.setAttribute('stroke','currentColor');return copy;}
    const image=source.querySelector('img');
    if(image){const copy=image.cloneNode(true);copy.style.cssText='width:36px;height:36px;object-fit:contain';return copy;}
    return null;
  }
  function ghostLabel(value,fallback=''){
    const text=String(value??'').replace(/\s+/g,' ').trim()||String(fallback??'').replace(/\s+/g,' ').trim();
    if(!text)return '';
    const word=text.split(' ')[0],limit=16,short=word.length>limit?word.slice(0,limit):word;
    return short!==text||word.length>limit?short+'...':short;
  }
  function alignInverseToBottom(element,targetBox,topMargin=0){
    if(element?.type!=='inverse'||!targetBox)return false;
    const y=Number(targetBox.y),height=Number(targetBox.h),margin=Number(topMargin)||0;
    const objectHeight=Math.max(Number(element.height_mm)||0,Number(element.thickness_mm)||.3);
    if(!Number.isFinite(y)||!Number.isFinite(height)||height<0||!Number.isFinite(objectHeight))return false;
    element.y_mm=Math.round((y+height-margin-objectHeight)*10000)/10000;
    return true;
  }
  const api={payload,beginRecentObjectDrag,ghost,ghostLabel,alignInverseToBottom};if(typeof module!=='undefined')module.exports=api;root.ToolPlacement=api;
})(typeof window!=='undefined'?window:globalThis);
