'use strict';
(() => {
  const dialog=document.createElement('dialog');dialog.id='objectProperties';
  dialog.innerHTML='<header><strong></strong><button type="button" aria-label="Close">×</button></header><div class="op-layout"><nav aria-label="Property pages"></nav><main><form></form><fieldset><legend>Preview</legend><div class="op-preview"></div></fieldset><p class="op-error" role="alert"></p></main></div>';
  document.body.append(dialog);
  const style=document.createElement('style');style.textContent='#objectProperties{width:min(820px,95vw);padding:0;border:1px solid var(--border);border-radius:7px;background:var(--card);color:var(--text)}#objectProperties::backdrop{background:#0006}#objectProperties header{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid var(--border)}#objectProperties header strong{flex:1}#objectProperties button{padding:6px 12px;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:3px;cursor:pointer}#objectProperties .op-layout{display:grid;grid-template-columns:185px 1fr;min-height:430px;max-height:72vh}#objectProperties nav{border-right:1px solid var(--border);padding:10px;overflow:auto}#objectProperties nav button{display:flex;align-items:center;gap:9px;width:100%;min-height:34px;box-sizing:border-box;text-align:left;margin-bottom:5px;padding:6px 9px;border-radius:6px;border-color:transparent;background:transparent;color:var(--text)}#objectProperties nav button:hover{background:#f2f7f4}#objectProperties nav button[aria-selected=true]{background:#dcfce7;color:#166534;border-color:#b7e4c7}#objectProperties nav button svg{width:16px;height:16px;flex:0 0 16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}#objectProperties nav button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#objectProperties main{padding:15px;overflow:auto}#objectProperties label{display:grid;grid-template-columns:145px 1fr;align-items:center;gap:10px;margin:10px 0}#objectProperties input,#objectProperties select,#objectProperties textarea{width:100%;box-sizing:border-box;padding:6px;color:var(--text);background:var(--card);border:1px solid var(--border)}#objectProperties input[type=checkbox]{width:auto;justify-self:start}#objectProperties fieldset{border:1px solid var(--border);margin-top:18px}.op-preview{height:210px;display:flex;justify-content:center;align-items:center;background:white;overflow:hidden}.op-preview svg{max-width:100%;max-height:100%}.op-error{color:#c62828}.op-font-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:14px}.op-font-tabs button[aria-pressed=true]{background:#dcfce7;color:#166534;border-color:#16a34a}.op-font-lists{display:grid;grid-template-columns:1fr 1fr 90px;gap:8px}.op-font-lists label{display:flex!important;flex-direction:column;align-items:stretch!important;gap:4px!important;margin:4px 0!important}.op-font-lists select{height:145px}.op-font-style-controls{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}.op-font-style-controls label{grid-template-columns:145px 1fr!important}.op-font-summary{font-size:12px;color:#64748b;margin:10px 0}';document.head.append(style);
  const propertiesLayoutStyle=document.createElement('style');
  propertiesLayoutStyle.textContent='#objectProperties[open]{display:flex;flex-direction:column;box-sizing:border-box;height:min(720px,calc(100dvh - 24px));max-height:calc(100dvh - 24px);overflow:hidden}#objectProperties>header{flex-shrink:0;background:var(--card,#fff)}#objectProperties .op-layout{flex:1 1 auto;grid-template-columns:185px minmax(0,1fr);min-width:0;min-height:0;max-height:none;overflow:hidden}#objectProperties .op-layout>nav,#objectProperties .op-layout>main{min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain}#objectProperties nav.op-object-tree{display:flex;flex-direction:column;overflow:hidden}#objectProperties nav.op-object-tree>.op-tree-scroll{flex:1 1 auto;min-height:0;overflow:auto}#objectProperties nav.op-object-tree>.ose-toolbar{flex:none;position:static;width:100%;margin:0;border-top:1px solid #e2e8f0;background:#f8fafc}#objectProperties main>fieldset{min-width:0}';
  propertiesLayoutStyle.textContent+='#objectProperties nav>.op-tree-view-toolbar{display:flex;gap:4px;flex:0 0 auto;padding:5px 0 6px;border-bottom:1px solid var(--border,#d7dee8);margin-bottom:5px}#objectProperties nav .op-tree-view-toolbar button{width:28px;height:26px;min-height:26px;padding:4px;margin:0;justify-content:center;border:1px solid transparent;border-radius:4px}#objectProperties nav .op-tree-view-toolbar button:hover{background:#f0f8f3}#objectProperties nav .op-tree-view-toolbar button[aria-pressed=true]{background:#dcfce7;color:#166534;border-color:#86d5a0}#objectProperties nav .op-tree-view-toolbar button:focus-visible{outline:2px solid #16a34a;outline-offset:1px}';
  document.head.append(propertiesLayoutStyle);
  let treeViewMode='all';
  let draft,index,page,generation=0,sourceSession=null,sourceEditor=null,sourceState={},documentDraft=null,sourceStates={},propertyPageEditor=null;
  function sourceCandidate(){
    const document=sourceSession?sourceSession.draft:documentDraft?documentDraft.getDocument():structuredClone(editing);
    document.elements[index]=structuredClone(draft);window.SourceModel?.reconcileInPlace(document);return document;
  }
  function ensureSourceSession(){
    if(!sourceSession){sourceSession=window.SourceSession.createSession(sourceCandidate());draft=sourceSession.draft.elements[index];}
    else sourceSession.update(document=>{document.elements[index]=structuredClone(draft);});
    return sourceSession;
  }
  const linear=['barcode128','code39','code93','ean13'],barcodes=[...linear,'qrcode','datamatrix'];
  const form=dialog.querySelector('form'),nav=dialog.querySelector('nav'),error=dialog.querySelector('.op-error');
  const sectionIconPaths={"Object":"<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M3 9h18M9 9v12\"/>","Position":"<path d=\"M3 3v18h18M3 7h4M3 11h3M3 15h4M7 21v-4M11 21v-3M15 21v-4\"/><path d=\"M14 4v10M9 9h10\"/>","Symbology and Size":"<g fill=\"currentColor\" stroke=\"none\"><rect x=\"3\" y=\"4\" width=\"2\" height=\"16\"/><rect x=\"6\" y=\"4\" width=\"1\" height=\"16\"/><rect x=\"9\" y=\"4\" width=\"3\" height=\"16\"/><rect x=\"14\" y=\"4\" width=\"1\" height=\"16\"/><rect x=\"17\" y=\"4\" width=\"2\" height=\"16\"/><rect x=\"21\" y=\"4\" width=\"1\" height=\"16\"/></g>","Human Readable":"<path d=\"M3 3v9M6 3v9M10 3v9M12 3v9M17 3v9M21 3v9\"/><path data-icon-digits=\"123\" d=\"m3 17 2-2v7M3 22h4M10 16c0-2 5-2 5 0 0 2-5 3-5 6h5M18 15h4l-3 3c4-1 4 4 0 4h-1\"/>","Font":"<path d=\"M4 20 11 4h2l7 16M7 14h10M2 20h7M15 20h7M9 4h6\"/>","Auto Fit":"<rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"1\"/><path d=\"M9 15l3-6 3 6M10 13h4M2 8V2h6M16 2h6v6M22 16v6h-6M8 22H2v-6\"/>","Border":"<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"1\"/><rect x=\"7\" y=\"7\" width=\"10\" height=\"10\" stroke-dasharray=\"2 2\"/>","Data Sources":"<ellipse cx=\"12\" cy=\"5\" rx=\"8\" ry=\"3\"/><path d=\"M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0\"/>","Data Type":"<path d=\"m8 5-5 7 5 7M16 5l5 7-5 7M14 4l-4 16\"/>","Transforms":"<path d=\"M4 7h15l-3-3M20 17H5l3 3M6 7l3 3M18 17l-3-3\"/>","Text Format":"<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"1\"/><path d=\"M6 7h7M9.5 7v10M7 17h5M16 7h2M16 11h2M16 15h2\"/>","Size":"<path d=\"M4 20V4h16M8 16V8h8v8z\"/>","Line":"<path d=\"m5 19 14-14M5 19h4M19 5v4\"/>","Picture":"<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><circle cx=\"8\" cy=\"9\" r=\"1.5\"/><path d=\"m4 17 5-5 4 4 3-3 4 4\"/>"};
  const field=(key,label,kind='number',options)=>({key,label,kind,options});
  async function encodeCatalogBarcode(target,data){
    if(!target.barcode_spec)return target;
    const original=String(target.barcode_spec.text??''),mode=target.data_transform||'none';
    const value=Array.isArray(target.dataSourceRefs)?window.ObjectData.encodingText(target,data||{},true):(target.data_prefix||'')+(mode==='trim'?original.trim():mode==='upper'?original.toUpperCase():mode==='lower'?original.toLowerCase():original)+(target.data_suffix||'');
    const encoded=await window.zebra.barcodeEncode({...target.barcode_spec,text:value,show_text:!target.font_family&&target.barcode_spec.show_text!==false});
    if(!encoded?.ok)throw Error(encoded?.error||'Could not encode this barcode data.');
    Object.assign(target,{bitmap_width:encoded.bitmap_width,bitmap_height:encoded.bitmap_height,bitmap_hex:encoded.bitmap_hex,barcode_display_text:value});
    if(target.font_family&&target.barcode_spec.show_text!==false){const bars=await window.zebra.barcodeEncode({...target.barcode_spec,text:value,show_text:false});if(!bars?.ok)throw Error(bars?.error||'Could not encode the barcode bars.');target.barcode_bars={bitmap_width:bars.bitmap_width,bitmap_height:bars.bitmap_height,bitmap_hex:bars.bitmap_hex};}else delete target.barcode_bars;
    if(target.auto_fit_width!==false)target.height_mm=Number(target.width_mm||20)*encoded.bitmap_height/encoded.bitmap_width;
    if(target.font_size_pt)target.hri_height_mm=Number(target.font_size_pt)*25.4/72;
    return target;
  }
  function pages(object=draft){
    const draft=object;
    if(window.isReplaceablePicture?.(draft)&&draft.transparent_background===undefined)draft.transparent_background=true;
    const common={Object:[field('label','Object name','text'),field('comments','Comments','textarea'),field('enabled','Print object','checkbox')],Position:[field('x_mm','X'),field('y_mm','Y'),field('rotation_deg','Rotation (degrees)')]};
    if(draft.shape_preset){
      common.Shape=[field('width_mm','Width'),field('height_mm','Height'),field('fill_color','Fill color','color'),field('stroke_color','Line color','color'),field('thickness_mm','Line width'),field('line_style','Line style','select',[['solid','Solid'],['dot','Dot'],['dash','Dash'],['erase','Erase']])];
    }else if(draft.symbol_font){
      common.Symbol=[field('font_family','Symbol font','text'),field('font_size_pt','Font size (pt)','number'),field('text_color','Color','color')];
    }else if(draft.barcode_spec){
      common['Symbology and Size']=[field('barcode_spec.bcid','Barcode type','select',['code128','code39','code93','ean13','ean8','upca','upce','qrcode','datamatrix','pdf417','azteccode']),field('width_mm','Width'),field('height_mm','Height')];
      common['Human Readable']=[field('barcode_spec.show_text','Show human readable','checkbox'),field('hri_align','Alignment','select',['left','center','right']),field('hri_offset_mm','Vertical offset'),field('barcode_spec.text','Barcode data','textarea')];
      common.Font=[];
      common.Border=[field('barcode_border','Show border','checkbox'),field('stroke_color','Border color','color'),field('thickness_mm','Line width')];
      common['Text Format']=[field('data_transform','Transform','select',['none','trim','upper','lower']),field('data_prefix','Prefix','text'),field('data_suffix','Suffix','text')];
      common['Auto Fit']=[field('auto_fit_width','Fit barcode to width','checkbox')];
      common['Data Sources']=[field('barcode_spec.text','Data / {{field}}','textarea')];
    }else if(barcodes.includes(draft.type)){
      common['Symbology and Size']=[field('type','Symbology','select',barcodes),...(linear.includes(draft.type)?[field('bar_height_mm','Bar height'),field('module_width','Module width (dots)')]:draft.type==='qrcode'?[field('width_mm','Width')]:[field('magnification','Module size')])];
      common['Auto Fit']=[];
      if(linear.includes(draft.type)){common['Human Readable']=[field('show_text','Show human readable','checkbox'),field('hri_offset_mm','Vertical text offset'),field('hri_align','Alignment','select',['center','left','right'])];common.Font=[field('hri_height_mm','Human readable height')];}
      common['Data Sources']=[field('text','Embedded data / {{field}}','textarea')];
      if(!window.ObjectDataSourcesUI||!window.SourceSession)common['Data Type']=[field('data_type','Data type','select',['text','number'])];
      if(!window.ObjectDataSourcesUI||!window.SourceSession)common.Transforms=[field('data_transform','Transform','select',['none','trim','upper','lower']),field('data_prefix','Prefix','text'),field('data_suffix','Suffix','text')];
    }else if(draft.type==='text'){
      common.Object.push(field('text','Text','textarea'));
 common['Text Format']=[field('data_transform','Transform','select',['none','trim','upper','lower']),field('data_prefix','Prefix','text'),field('data_suffix','Suffix','text')];
 common['Auto Fit']=[];
      common.Font=[field('font','Zebra printer font','select',['0','A','B','C','D','E','F','G','H']),field('height_mm','Character height'),field('width_mm','Character width')];
      common['Data Sources']=[field('text','Text / {{field}}','textarea')];
    }else{
      common.Size=[field('width_mm','Width'),field('height_mm','Height')];
      if(['box','ellipse','line'].includes(draft.type))common.Line=[field('thickness_mm','Thickness')];
      if(draft.type==='image')common[draft.source_format==='svg'?'SVG':'Picture']=[field('transparent_background','Transparent background','checkbox')];
    }if(draft.type==='text'||draft.barcode_spec||barcodes.includes(draft.type))common.Border||=[];return common;
  }
  async function preview(){
    requestLiveCommit();
    const token=++generation,target=dialog.querySelector('.op-preview');
    try{
      const candidate=sourceCandidate(),template={...candidate,margin_mm:{},background:null,page:{enabled:false},elements:[{...draft,x_mm:0,y_mm:0,enabled:true}]},data=sampleData(candidate);
      template.elements[0]=await encodeCatalogBarcode(template.elements[0],data);if(token!==generation)return;
      await ensureQR(qrValuesOf(template,data),null,dmValuesOf(template,data));if(token!==generation)return;
      const box=window.LabelPreview.computeBoxes(template,data)[0];template.width_mm=Math.max(1,box?.w||draft.width_mm||20);template.height_mm=Math.max(1,box?.h||draft.height_mm||10);
      const transparent=draft.type==='image'&&(draft.transparent_background===true||draft.source_format==='svg'||(window.isReplaceablePicture?.(draft)&&draft.transparent_background!==false));
      target.style.background=transparent?'repeating-conic-gradient(#e5e7eb 0% 25%,#fff 0% 50%) 0 / 16px 16px':'white';
      target.innerHTML=window.LabelPreview.renderPreviewSVG(template,data,[0],qrCache,{transparentBackground:transparent});
      const svg=target.querySelector('svg'),object=svg?.querySelector('[data-label-element="0"]');
      if(svg&&object){
        try{
          const ink=object.getBBox();
          if(ink.width>0&&ink.height>0){const padX=Math.max(.5,ink.width*.08),padY=Math.max(.5,ink.height*.12);svg.setAttribute('viewBox',[(ink.x-padX).toFixed(3),(ink.y-padY).toFixed(3),(ink.width+2*padX).toFixed(3),(ink.height+2*padY).toFixed(3)].join(' '));}
        }catch(_){}
        svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
      }
      error.textContent='';
    }catch(e){if(token===generation){target.replaceChildren();error.textContent=e.message;}}
  }
  function switchObject(nextIndex,nextPage){
    propertyPageEditor?.dispose();propertyPageEditor=null;sourceEditor?.dispose();sourceEditor=null;
    const candidate=sourceCandidate();if(documentDraft)documentDraft.replaceDocument(candidate);
    if(sourceSession)sourceSession.update(document=>{document.elements[index]=structuredClone(draft);});
    sourceStates[draft.id||index]=sourceState;index=nextIndex;draft=structuredClone(candidate.elements[index]);sourceState=sourceStates[draft.id||index]||{};page=nextPage;render();
    nav.querySelector(`[data-object-root="${index}"]`)?.scrollIntoView?.({block:'nearest'});
    if(typeof window.selectElement==='function'&&window.editorSel!==index)window.selectElement(index);
  }
  function sourceCaption(doc,id,fallback){const source=doc.sourceDefinitions?.[id];if(!source)return fallback||id;return source.name||String(source.config?.value??source.config?.source?.value??'')||fallback||source.kind||id;}
  function sourceSummary(objectIndex,object){const doc=sourceCandidate(),refs=Array.isArray(object.dataSourceRefs)?object.dataSourceRefs:[],labels=refs.length?refs.map(id=>sourceCaption(doc,id,object.text||object.barcode_spec?.text||'')):object.text||object.barcode_spec?.text?[String(object.text||object.barcode_spec.text)]:[];const list=document.createElement('div');list.className='op-source-summary';list.dataset.objectIndex=String(objectIndex);for(const caption of labels){const button=document.createElement('button');button.type='button';button.className='op-source-summary-item';const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 16 16');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="M3 1h8l3 3v11H3zM11 1v4h3M5 7h6M5 10h6M5 12h4"/>';const title=document.createElement('span');title.textContent=caption;button.append(icon,title);button.title=caption;button.onclick=()=>switchObject(objectIndex,'Data Sources');list.append(button);}return list;}
  function render(){
    sourceEditor?.dispose();sourceEditor=null;
    const sections=pages();if(!sections[page])page='Object';nav.replaceChildren();nav.classList.add('op-object-tree');
    for(const [objectIndex,object] of sourceCandidate().elements.entries()){if(treeViewMode==='single'&&objectIndex!==index)continue;const root=document.createElement('button');root.type='button';root.dataset.objectRoot=String(objectIndex);root.setAttribute('aria-selected',String(objectIndex===index));const rootIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');rootIcon.setAttribute('viewBox','0 0 24 24');rootIcon.setAttribute('aria-hidden','true');rootIcon.innerHTML=object.type==='text'?sectionIconPaths.Font:sectionIconPaths['Symbology and Size'];const rootLabel=document.createElement('span');rootLabel.textContent=object.label||`${object.type==='text'?'Text':'Barcode'} ${objectIndex+1}`;root.append(rootIcon,rootLabel);root.onclick=()=>switchObject(objectIndex,'Object');nav.append(root);
    const propertyNames=Object.keys(pages(object)).filter(name=>name!=='Object').sort((a,b)=>{const order=['Symbology and Size','Human Readable','Font','Text Format','Auto Fit','Border','Position','Error Handling','Data Sources'];return (order.includes(a)?order.indexOf(a):99)-(order.includes(b)?order.indexOf(b):99);});for(const name of propertyNames){const b=document.createElement('button');b.dataset.treeLast=String(name===propertyNames.at(-1));b.dataset.objectIndex=String(objectIndex);b.dataset.propertyPage=name;b.type='button';b.setAttribute('aria-selected',String(objectIndex===index&&name===page));const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML=sectionIconPaths[name]||'<path d="M4 6h16M4 12h16M4 18h16"/>';const label=document.createElement('span');label.textContent=name;b.append(icon,label);b.onclick=()=>switchObject(objectIndex,name);nav.append(b);if(name==='Data Sources')nav.append(sourceSummary(objectIndex,object));}}
    const treeScroll=document.createElement('div');treeScroll.className='op-tree-scroll';while(nav.firstChild)treeScroll.append(nav.firstChild);nav.append(treeScroll);
    const viewToolbar=document.createElement('div');viewToolbar.className='op-tree-view-toolbar';viewToolbar.setAttribute('role','toolbar');viewToolbar.setAttribute('aria-label','Object tree view');
    const viewIcons={single:'<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M2 7V2h5M17 2h5v5M22 17v5h-5M7 22H2v-5"/><circle cx="12" cy="12" r="2"/>',all:'<path d="M4 7V3h12v4M8 11V7h12v14H8zM8 17H4V7M11 11h6M11 15h6"/>'};
    for(const [mode,caption] of [['single','Show selected object'],['all','Show all objects']]){const button=document.createElement('button');button.type='button';button.dataset.treeView=mode;button.title=caption;button.setAttribute('aria-label',caption);button.setAttribute('aria-pressed',String(mode===treeViewMode));button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+viewIcons[mode]+'</svg>';button.onclick=()=>{if(treeViewMode===mode)return;treeViewMode=mode;render();};viewToolbar.append(button);}nav.prepend(viewToolbar);
    propertyPageEditor?.dispose();propertyPageEditor=null;form.replaceChildren();
    const previewGroup=dialog.querySelector('main > fieldset');if(previewGroup)previewGroup.hidden=page!=='Object';
    if(['Object','Position','Border'].includes(page)&&window.ObjectPropertiesPages){propertyPageEditor=window.ObjectPropertiesPages.mountPage(form,{page,objectId:draft.id,template:sourceCandidate(),getBounds:()=>{try{return window.LabelPreview.computeBoxes(sourceCandidate(),sampleData(sourceCandidate())).find(box=>box.index===index)||{w:Number(draft.width_mm)||0,h:Number(draft.height_mm)||0};}catch{return {w:Number(draft.width_mm)||0,h:Number(draft.height_mm)||0};}},units:{toDisplay:value=>typeof mmToUnit==='function'?mmToUnit(value,measureUnit(),editing.dpi):value,fromDisplay:value=>typeof unitToMm==='function'?unitToMm(value,measureUnit(),editing.dpi):Number(value),suffix:typeof unitSuffix==='function'?unitSuffix():'mm'},controller:{moveObject:(id,layer)=>{const candidate=sourceCandidate(),from=candidate.elements.findIndex(object=>object.id===id);if(from<0||!Number.isInteger(layer)||layer<0||layer>=candidate.elements.length)throw Error('Invalid layer.');const [moved]=candidate.elements.splice(from,1);candidate.elements.splice(layer,0,moved);documentDraft?.replaceDocument(candidate);if(sourceSession){sourceSession.cancel();sourceSession=window.SourceSession.createSession(candidate);}index=layer;draft=structuredClone(candidate.elements[index]);render();},getObject:()=>structuredClone(draft),updateObject:(_id,fn)=>{const next=structuredClone(draft);fn(next);draft=next;}},onChange:()=>{const root=nav.querySelector('[data-object-root="'+index+'"] span');if(root)root.textContent=draft.label||root.textContent;void preview();},onDiagnostic:message=>{error.textContent=message;}});void preview();return;}
    if(page==='Font'&&draft.barcode_spec){
      if(draft.font_size_pt==null)draft.font_size_pt=12.5;
      const names=['Style','Underline','Strikethrough','Outline','Width','Advanced'];let tab='Style';
      const tabs=document.createElement('div');tabs.className='op-font-tabs';const body=document.createElement('div');
      const set=(key,value)=>{draft.font_family||='Arial';draft[key]=value;void preview();};
      const control=(caption,key,kind='checkbox',options)=>{const label=document.createElement('label'),title=document.createElement('span');title.textContent=caption;let input;if(kind==='select'){input=document.createElement('select');for(const value of options){const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);}}else{input=document.createElement('input');input.type=kind;}input.name=key;if(kind==='checkbox')input.checked=key==='text_background_enabled'?(draft.text_background!=null&&draft.text_background!=='none'):Boolean(draft[key]);else input.value=draft[key]??(key==='font_family'?'Arial':key==='font_size_pt'?12.5:key==='text_width_percent'?100:key==='text_outline_width_pt'?.5:key==='text_color'?'#111111':key==='text_outline_color'?'#111111':key==='text_background'?'#ffffff':'');if(kind==='number'){input.step=key==='text_width_percent'?'1':'0.1';input.min=key==='text_width_percent'?'10':'0.1';if(key==='text_width_percent')input.max='500';}input.oninput=()=>{if(key==='text_background_enabled'){draft.font_family||='Arial';draft.text_background=input.checked?(draft.text_background&&draft.text_background!=='none'?draft.text_background:'#ffffff'):'none';void preview();}else if(kind==='checkbox')set(key,input.checked);else if(kind==='number'){if(input.checkValidity())set(key,Number(input.value));}else set(key,input.value);};label.append(title,input);return label;};
      const draw=()=>{body.replaceChildren();if(tab==='Style'){
        const lists=document.createElement('div');lists.className='op-font-lists';
        const makeList=(caption,key,values)=>{const label=document.createElement('label'),title=document.createElement('span'),select=document.createElement('select');title.textContent=caption;select.size=7;select.setAttribute('aria-label',caption);const currentStyle=draft.bold?(draft.italic?'Bold Italic':'Bold'):draft.italic?'Italic':'Regular',selected=String(draft[key]??(key==='font_family'?'Arial':key==='font_style'?currentStyle:'12.5'));const options=[...values];if(!options.includes(selected))options.unshift(selected);for(const value of options){const option=document.createElement('option');option.value=value;option.textContent=value;option.selected=value===selected;select.append(option);}select.onchange=()=>{if(key==='font_family')set('font_family',select.value);else if(key==='font_size_pt')set(key,Number(select.value));else{set('font_style',select.value);draft.bold=['Bold','Bold Italic'].includes(select.value);draft.italic=['Italic','Bold Italic'].includes(select.value);void preview();}};label.append(title,select);lists.append(label);};
        makeList('Typeface','font_family',['Arial','Arial Black','Arial Narrow','Arial Rounded MT Bold','Bahnschrift','Calibri','Cambria','Consolas','Courier New','Georgia','Segoe UI','Tahoma','Times New Roman','Trebuchet MS','Verdana']);makeList('Font Style','font_style',['Regular','Italic','Bold','Bold Italic']);makeList('Point Size','font_size_pt',['8','9','10','11','12','12.5','14','16','18','20','22','24','28','36','48','72']);body.append(lists);
        const summary=document.createElement('p');summary.className='op-font-summary';summary.textContent='Font family, style and point size update the barcode text preview and printed raster.';body.append(summary);
      }else if(tab==='Underline'||tab==='Strikethrough')body.append(control(tab,tab==='Underline'?'underline':'strike'));
      else if(tab==='Outline'){body.append(control('Outline','text_outline'),control('Outline color','text_outline_color','color'),control('Outline width (pt)','text_outline_width_pt','number'));}
      else if(tab==='Width')body.append(control('Character width (%)','text_width_percent','number'));
      else {body.append(control('White on black','text_inverse'),control('Foreground color','text_color','color'),control('Background fill','text_background_enabled'),control('Background color','text_background','color'),control('Script','script','select',['none','sub','super']),control('Small caps','small_caps'));}
      };
      for(const name of names){const button=document.createElement('button');button.type='button';button.textContent=name;button.setAttribute('aria-pressed',String(name===tab));button.onclick=()=>{tab=name;for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.textContent===tab));draw();};tabs.append(button);}form.append(tabs,body);draw();
    }
    if(page==='Data Sources'&&window.ObjectDataSourcesUI&&window.SourceSession){
      const session=ensureSourceSession();
      sourceEditor=window.ObjectDataSourcesUI.mount(form,{session,objectId:draft.id,state:sourceState,treeHost:nav,testTransform:window.zebra?.prepareSourceInputs?async(candidate,id)=>{const prepared=await window.zebra.prepareSourceInputs({template:candidate,context:{mode:'preview'}});if(!prepared.ok)throw Error(prepared.error);const result=window.SourceResolver.evaluateDocument(candidate,prepared.inputs);if(result.diagnostics.length)throw Error(result.diagnostics.map(item=>item.message).join('\n'));return result.objects[id]?.text??'';}:undefined,inspectLibrary:window.zebra?.inspectSourceLibrary?async file=>{const result=await window.zebra.inspectSourceLibrary(file);if(!result.ok)throw Error(result.error);return result;}:undefined,compileGs1:window.zebra?.compileSourceGs1?payload=>window.zebra.compileSourceGs1(payload):undefined,onChange:document=>{draft=document.elements[index];void preview();},onDiagnostic:message=>{error.textContent=message;},chooseDirectory:window.zebra?.chooseSourceDirectory?async()=>{const result=await window.zebra.chooseSourceDirectory();if(result.error)throw Error(result.error);return result.path;}:undefined,chooseFile:window.zebra?.chooseSourceFile?async()=>{const result=await window.zebra.chooseSourceFile();if(result.error)throw Error(result.error);return result.path;}:undefined});
      const sourceTree=nav.querySelector('.ose-source-tree'),selectedTool=nav.querySelector(`[data-object-index="${index}"][data-property-page="Data Sources"]`);if(sourceTree&&selectedTool){nav.querySelector(`.op-source-summary[data-object-index="${index}"]`)?.remove();selectedTool.after(sourceTree);}const sourceToolbar=sourceTree?.querySelector('.ose-toolbar');if(sourceToolbar)nav.append(sourceToolbar);
      void preview();return;
    }
    for(const f of sections[page]){
      const label=document.createElement('label'),caption=document.createElement('span'),measured=f.key.endsWith('_mm');caption.textContent=measured?`${f.label} (${unitSuffix()})`:f.label;label.append(caption);
      const input=document.createElement(f.kind==='select'?'select':f.kind==='textarea'?'textarea':'input');
      if(f.options){const values=f.options.map(item=>Array.isArray(item)?item[0]:item);if(f.key==='barcode_spec.bcid'&&draft.barcode_spec?.bcid&&!values.includes(draft.barcode_spec.bcid)){f.options.unshift(draft.barcode_spec.bcid);values.unshift(draft.barcode_spec.bcid);}for(const [index,value] of values.entries()){const option=document.createElement('option');option.value=value;option.textContent=Array.isArray(f.options[index])?f.options[index][1]:value;input.append(option);}}
      if(input.tagName==='INPUT')input.type=f.kind;input.name=f.key;
      const nested=f.key.startsWith('barcode_spec.'),propertyKey=nested?f.key.slice('barcode_spec.'.length):f.key,current=nested?draft.barcode_spec?.[propertyKey]:draft[f.key];
      if(measured)input.dataset.measureUnit='system';
      const fallback={hri_height_mm:3,hri_align:'center',data_type:'text',data_transform:'none',font_size_pt:10,...(draft.type==='qrcode'?{width_mm:(Number(draft.magnification)||4)*5}:{})}[f.key]??(f.kind==='number'?0:'');
      if(f.kind==='checkbox')input.checked=current===undefined?['enabled','show_text','barcode_spec.show_text','auto_fit_width'].includes(f.key):current===true;else if(f.kind==='color')input.value=/^#[0-9a-f]{6}$/i.test(current||'')?current:'#111111';else {const value=current??fallback;input.value=measured&&value!==''?mmToUnit(value,measureUnit(),editing.dpi):value;}
      if(f.kind==='number'){input.step='any';input.required=true;if(!['x_mm','y_mm','rotation_deg','hri_offset_mm'].includes(f.key))input.min=measured?String(mmToUnit(.01,measureUnit(),editing.dpi)):'0.01';}
      input.oninput=()=>{if(!input.checkValidity())return;const value=f.kind==='checkbox'?input.checked:f.kind==='number'?(measured?unitToMm(input.value,measureUnit(),editing.dpi):Number(input.value)):input.value;if(nested)draft.barcode_spec[propertyKey]=value;else draft[f.key]=value;if(f.key==='label'){const root=nav.querySelector(`[data-object-root="${index}"] span`);if(root)root.textContent=value;}if(f.key==='type'){for(const [key,value] of Object.entries(insertElementDefaults[draft.type]||{}))if(draft[key]==null)draft[key]=value;render();}else void preview();};label.append(input);form.append(label);
    }
    if(page==='Symbol'){const info=document.createElement('p');info.textContent=`${draft.label||'Font symbol'} · U+${Number(draft.symbol_codepoint||0).toString(16).toUpperCase().padStart(4,'0')}`;form.append(info);}
    if(page==='Picture'||page==='SVG'){
      const remove=document.createElement('button');remove.type='button';remove.dataset.removeBackground='true';remove.textContent='Remove background';remove.disabled=!!draft.placeholder;
      remove.onclick=()=>{try{window.LabelBitmap.removeBackground(draft);render();}catch(e){error.textContent=e.message;}};form.append(remove);
      const info=document.createElement('p');info.textContent=draft.placeholder?'Empty picture frame · Choose a file below to replace it.':page==='SVG'?`SVG artwork · ${draft.bitmap_width} × ${draft.bitmap_height} rasterized for label output`:`Embedded monochrome image: ${draft.bitmap_width} × ${draft.bitmap_height} pixels`;form.append(info);
      const replace=document.createElement('input');replace.type='file';replace.accept='image/png,image/jpeg,image/bmp,image/webp,image/svg+xml,.svg';replace.setAttribute('aria-label',page==='SVG'?'Replace SVG':'Replace picture (including SVG)');
      replace.onchange=async()=>{const file=replace.files[0];if(!file)return;let image;try{const url=URL.createObjectURL(file);image=new Image();try{image.src=url;await image.decode();}finally{URL.revokeObjectURL(url);}const scale=Math.min(1,4096/image.naturalWidth,4096/image.naturalHeight,Math.sqrt(16000000/(image.naturalWidth*image.naturalHeight)));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(image.naturalWidth*scale));canvas.height=Math.max(1,Math.floor(image.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,stride=Math.ceil(canvas.width/8),bytes=new Uint8Array(stride*canvas.height);for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const n=(y*canvas.width+x)*4;if(pixels[n]*.299+pixels[n+1]*.587+pixels[n+2]*.114<128&&pixels[n+3]>127)bytes[y*stride+(x>>3)]|=128>>(x&7);}const oldRatio=(Number(draft.width_mm)||1)/(Number(draft.height_mm)||1),nextRatio=canvas.width/canvas.height,isSvg=file.type==='image/svg+xml'||file.name.toLowerCase().endsWith('.svg');if(isSvg)draft.label=file.name;if(isSvg)draft.source_format='svg';else delete draft.source_format;if(!Number.isFinite(oldRatio)||oldRatio<=0){draft.width_mm=nextRatio;draft.height_mm=1;}else if(nextRatio>oldRatio)draft.height_mm=draft.width_mm/nextRatio;else draft.width_mm=draft.height_mm*nextRatio;delete draft.placeholder;Object.assign(draft,{transparent_background:true,text_background:'none',bitmap_width:canvas.width,bitmap_height:canvas.height,bitmap_hex:Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')});render();}catch(e){error.textContent=e.message;}finally{replace.value='';image?.close?.();}};form.append(replace);
    }
    if(page==='Auto Fit'){
      const label=document.createElement('label');label.textContent=`Maximum width (${unitSuffix()})`;const input=document.createElement('input');input.type='number';input.dataset.measureUnit='system';input.min=String(mmToUnit(.1,measureUnit(),editing.dpi));input.step='any';input.value=mmToUnit(editing.width_mm,measureUnit(),editing.dpi);label.append(input);form.append(label);const fit=document.createElement('button');fit.type='button';fit.textContent=draft.type==='text'?'Fit text width':'Fit barcode width';fit.onclick=()=>{try{const width=unitToMm(input.value,measureUnit(),editing.dpi);if(!(width>0))throw Error('Enter a positive width.');const candidate=sourceCandidate(),data=sampleData(candidate);if(draft.type==='text'){const box=window.LabelPreview.computeBoxes({...candidate,elements:[draft]},data)[0];if(!box?.w)throw Error('Enter text first.');const ratio=width/box.w;draft.width_mm=Math.max(.01,Number(draft.width_mm)*ratio);draft.height_mm=Math.max(.01,Number(draft.height_mm)*ratio);void preview();return;}
        if(draft.type==='image'&&draft.barcode_spec){draft.width_mm=width;void preview();return;}
        if(draft.type==='qrcode'){draft.width_mm=width;void preview();return;}
        const dimensionKey=draft.type==='datamatrix'?'magnification':linear.includes(draft.type)?'module_width':null;
        if(!dimensionKey)throw Error('Fit width is not supported for this object.');
        const probe={...candidate,elements:[{...draft,[dimensionKey]:1}]},box=window.LabelPreview.computeBoxes(probe,data)[0];
        if(!(Number(box?.w)>0))throw Error('Could not measure the barcode width.');
        const module=Math.floor(width/box.w);if(module<1)throw Error('Barcode cannot fit at the minimum module size. Increase width or shorten data.');draft[dimensionKey]=module;void preview();
      }catch(e){error.textContent=e.message;}};form.append(fit);
    }
    if(page==='Data Sources'){
      const label=document.createElement('label');label.textContent='Use named field';const select=document.createElement('select');select.setAttribute('aria-label','Use named field');select.add(new Option('Choose a data field…',''));for(const name of new Set([...Object.keys(editing.data_sources||{}),...placeholderNames(editing)]))select.add(new Option(name,name));select.onchange=()=>{if(!select.value)return;draft.text='{{'+select.value+'}}';render();};label.append(select);form.append(label);
      const configure=document.createElement('button');configure.type='button';configure.textContent='Manage data source…';configure.onclick=()=>{const match=String(draft.text||'').match(/^\{\{\s*([\w.\-]+)\s*\}\}$/);if(!match||!editing.data_sources?.[match[1]]){error.textContent='Choose a named source first. Create one with New field in Data Sources.';return;}window.DataSourcesUI.open(editing.data_sources[match[1]].category||'Embedded Data',match[1]);};form.append(configure);
    }void preview();
  }
  let liveRevision=0,lastCommitted='',liveQueued=false,liveAlerts=false;
  function requestLiveCommit(alerts=false){
    if(!dialog.open)return;
    liveRevision++;liveAlerts=liveAlerts||alerts;
    if(liveQueued)return;liveQueued=true;
    queueMicrotask(()=>{liveQueued=false;const showAlerts=liveAlerts;liveAlerts=false;void apply(liveRevision,showAlerts);});
  }
  async function apply(revision=++liveRevision,showAlerts=false){
    if(!dialog.open||!form.reportValidity())return false;
    try{
      const at=index,tpl=sourceCandidate();if(JSON.stringify(tpl)===lastCommitted)return true;
      const conflict=window.ObjectNames?.firstConflict(tpl.elements);
      if(conflict){error.textContent=conflict.message;if(showAlerts)window.ObjectNames.showAlert(document,conflict.name);return false;}
      const data=sampleData(tpl),object=tpl.elements[at];
      for(const element of tpl.elements){const result=data['$qlabel.sources']?.objects?.[element.id];if(result){const raw=result.sourceText??result.text;if(element.barcode_spec)element.barcode_spec.text=raw;else element.text=raw;element.sourceTextSnapshot=raw;}}
      await encodeCatalogBarcode(object,data);
      if(revision!==liveRevision||!dialog.open||at!==index)return false;
      window.ObjectData.resolve(object,data,true);window.LabelPreview.computeBoxes({...tpl,elements:[object]},data);
      documentDraft?.replaceDocument(tpl);pushSnapshot();editing=tpl;draft=structuredClone(object);
      refreshEditorUI();lastCommitted=JSON.stringify(sourceCandidate());touchEditor();updateUndoButtons();void persistEditor();error.textContent='';return true;
    }catch(e){error.textContent=e.message;return false;}
  }
  const close=async()=>{await apply(++liveRevision);dialog.close();};
  dialog.querySelector('header button[aria-label="Close"]').onclick=close;
  dialog.addEventListener('change',()=>requestLiveCommit(true));
  dialog.addEventListener('cancel',event=>{event.preventDefault();void close();});
  form.onsubmit=async event=>{event.preventDefault();await close();};
  dialog.addEventListener('close',()=>{liveRevision++;generation++;propertyPageEditor?.dispose();propertyPageEditor=null;sourceEditor?.dispose();sourceEditor=null;sourceSession?.cancel();sourceSession=null;documentDraft?.cancel();documentDraft=null;});
  document.addEventListener('source-inputs-ready',()=>{if(dialog.open)void preview();});
  document.addEventListener('dblclick',event=>{
    const hit=event.target.closest?.('#previewFrame .hit[data-hit]'),textEditor=event.target.closest?.('#canvasTextEditor');
    const at=hit?Number(hit.dataset.hit):textEditor?Number(textEditor.dataset.elementIndex):NaN;
    if(!Number.isInteger(at)||!editing?.elements[at]||editing.elements[at].table_model)return;
    event.preventDefault();event.stopPropagation();window.openObjectProperties(at);
  },true);
  document.addEventListener('keydown',event=>{if(event.altKey&&event.key==='Enter'&&!event.target.closest?.('dialog,input,textarea,select,[contenteditable=true]')&&Number.isInteger(editorSel)){event.preventDefault();window.openObjectProperties(editorSel);}});
  document.addEventListener('editor-selection-changed',()=>{if(!dialog.open||!Number.isInteger(window.editorSel)||window.editorSel===index||!editing?.elements?.[window.editorSel])return;const names=Object.keys(pages(editing.elements[window.editorSel]));switchObject(window.editorSel,names.includes(page)?page:'Object');});
  window.openObjectProperties=i=>{cancelTextClick();document.getElementById('canvasTextEditor')?.blur();if(!editing?.elements[i]||dialog.open)return;readEditorIntoDraft();sourceSession?.cancel();sourceSession=null;sourceStates={};sourceState={};documentDraft=window.ObjectPropertiesDocument?window.ObjectPropertiesDocument.createDocumentDraft(editing):null;index=i;draft=documentDraft?documentDraft.getDocument().elements[i]:structuredClone(editing.elements[i]);page=draft.shape_preset?'Shape':draft.symbol_font?'Symbol':barcodes.includes(draft.type)||draft.barcode_spec?'Symbology and Size':draft.type==='image'?draft.source_format==='svg'?'SVG':'Picture':'Object';dialog.querySelector('header strong').textContent=`${draft.shape_preset?draft.label||'Shape':draft.symbol_font?'Symbol':barcodes.includes(draft.type)||draft.barcode_spec?'Barcode':draft.source_format==='svg'?'SVG':draft.type==='image'?'Picture':draft.type==='text'?'Text':'Shape'} Properties`;render();lastCommitted=JSON.stringify(sourceCandidate());dialog.showModal();};
})();
