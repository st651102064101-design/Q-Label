(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ObjectValueTree=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const paths={
    text:'M3 13 6.8 3h2.4L13 13M4.5 9h7M13 13h-2',
    barcode:'M2 3v10M4 3v10M7 3v10M8 3v10M11 3v10M14 3v10',
    qr:'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM10 10h2v2h-2zM13 13h1',
    datamatrix:'M2 2h12v12H2zM5 4v2M8 4v2M11 4v2M4 8h2M8 8v2M11 8h2M5 11v2M8 12h2M12 11v2',
    picture:'M2 3h12v10H2zM3 11l3-3 2 2 2-3 3 4M5 6h.1',
    table:'M2 2h12v12H2zM2 6h12M2 10h12M6 2v12M10 2v12',
    line:'M3 13 13 3M4 12h.1M12 4h.1',
    shape:'M3 3h10v10H3zM6 6h4v4H6z',
    object:'M8 2 14 8 8 14 2 8zM6 8h4M8 6v4'
  };
  function kind(element){
    const barcode=String(element?.barcode_spec?.bcid||'').toLowerCase(),type=String(element?.type||'').toLowerCase();
    if(['qrcode','qr','qr-code'].includes(type)||barcode.includes('qr'))return 'qr';
    if(['datamatrix','data-matrix'].includes(type)||barcode.includes('datamatrix'))return 'datamatrix';
    if(['barcode128','code39','code93','ean13','ean8','upca','upce'].includes(type)||barcode)return 'barcode';
    if(type==='text')return 'text';
    if(type==='table')return 'table';
    if(type==='line')return 'line';
    if(type==='image')return 'picture';
    if(['rectangle','ellipse','shape','polygon'].includes(type))return 'shape';
    return 'object';
  }
  function createIcon(document,type){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path'),name=paths[type]||paths.object;
    svg.setAttribute('viewBox','0 0 16 16');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.classList.add('source-object-icon');svg.dataset.objectIcon='';svg.dataset.iconType=type;
    path.setAttribute('d',name);svg.append(path);return svg;
  }
  function setSelected(host,index){
    host?.querySelectorAll('[data-object-value-index]').forEach(row=>{
      const selected=Number(row.dataset.objectValueIndex)===Number(index);row.classList.toggle('is-object-selected',selected);
      if(selected)row.setAttribute('aria-current','true');else row.removeAttribute('aria-current');
    });
  }
  function decorate(host,elements,selectedIndex=-1){
    const group=host?.querySelector('.source-group[data-group="Object Values"]');if(!group)return 0;
    let count=0;
    for(const row of group.querySelectorAll('.source-item[data-source-field^="object."]')){
      const index=Number(row.dataset.sourceField.slice('object.'.length)),element=elements?.[index];if(!Number.isInteger(index)||!element)continue;
      const iconKind=kind(element);if(!row.querySelector(':scope > svg[data-object-icon]'))row.prepend(createIcon(host.ownerDocument,iconKind));
      row.dataset.objectValueIndex=String(index);row.dataset.objectValueType=iconKind;row.setAttribute('aria-label','Select object '+(element.label||`${element.type} ${index+1}`));
      row.title='Click to select. Drag to use this object value.';row.draggable=true;count++;
    }
    setSelected(group,selectedIndex);return count;
  }
  function bind(host,selectObject){
    if(!host||host.dataset.objectValueTreeBound==='true')return false;
    host.dataset.objectValueTreeBound='true';host.addEventListener('click',event=>{
      const row=event.target.closest?.('.source-item[data-object-value-index]');if(!row||!host.contains(row))return;
      const index=Number(row.dataset.objectValueIndex);if(Number.isInteger(index))selectObject(index);
    });return true;
  }
  return {kind,createIcon,decorate,setSelected,bind};
});
