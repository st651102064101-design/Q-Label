'use strict';
(() => {
  const dialog=document.createElement('dialog');dialog.id='objectProperties';
  dialog.innerHTML='<header><strong></strong><button type="button" aria-label="Close">×</button></header><div class="op-layout"><nav aria-label="Property pages"></nav><main><form></form><fieldset><legend>Preview</legend><div class="op-preview"></div></fieldset><p class="op-error" role="alert"></p></main></div><footer><span>Dimensions in mm. Apply updates the design and print output.</span><button type="button" data-action="apply">Apply</button><button type="button" data-action="ok">OK</button><button type="button" data-action="cancel">Cancel</button></footer>';
  document.body.append(dialog);
  const style=document.createElement('style');style.textContent='#objectProperties{width:min(820px,95vw);padding:0;border:1px solid var(--border);border-radius:7px;background:var(--card);color:var(--text)}#objectProperties::backdrop{background:#0006}#objectProperties header,#objectProperties footer{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid var(--border)}#objectProperties header strong,#objectProperties footer span{flex:1}#objectProperties footer{border-top:1px solid var(--border);font-size:11px}#objectProperties button{padding:6px 12px;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:3px;cursor:pointer}#objectProperties .op-layout{display:grid;grid-template-columns:185px 1fr;min-height:430px;max-height:72vh}#objectProperties nav{border-right:1px solid var(--border);padding:10px;overflow:auto}#objectProperties nav button{display:block;width:100%;text-align:left;margin-bottom:4px}#objectProperties nav button[aria-selected=true]{background:#dcfce7;color:#166534}#objectProperties main{padding:15px;overflow:auto}#objectProperties label{display:grid;grid-template-columns:145px 1fr;align-items:center;gap:10px;margin:10px 0}#objectProperties input,#objectProperties select,#objectProperties textarea{width:100%;box-sizing:border-box;padding:6px;color:var(--text);background:var(--card);border:1px solid var(--border)}#objectProperties input[type=checkbox]{width:auto;justify-self:start}#objectProperties fieldset{border:1px solid var(--border);margin-top:18px}.op-preview{height:210px;display:flex;justify-content:center;align-items:center;background:white;overflow:hidden}.op-preview svg{max-width:100%;max-height:100%}.op-error{color:#c62828}';document.head.append(style);
  let draft,index,page,generation=0;
  const linear=['barcode128','code39','code93','ean13'],barcodes=[...linear,'qrcode','datamatrix'];
  const form=dialog.querySelector('form'),nav=dialog.querySelector('nav'),error=dialog.querySelector('.op-error');
  const field=(key,label,kind='number',options)=>({key,label,kind,options});
  function pages(){
    const common={Object:[field('label','Object name','text'),field('description','Description','text'),field('enabled','Print object','checkbox')],Position:[field('x_mm','X (mm)'),field('y_mm','Y (mm)'),field('rotation_deg','Rotation (degrees)')]};
    if(barcodes.includes(draft.type)){
      common['Symbology and Size']=[field('type','Symbology','select',barcodes),...(linear.includes(draft.type)?[field('bar_height_mm','Bar height (mm)'),field('module_width','Module width (dots)')]:draft.type==='qrcode'?[field('width_mm','Width (mm)')]:[field('magnification','Module size')])];
      if(linear.includes(draft.type)){common['Human Readable']=[field('show_text','Show human readable','checkbox'),field('hri_offset_mm','Text offset (mm)'),field('hri_align','Alignment','select',['center','left','right'])];common.Font=[field('hri_height_mm','Human readable height (mm)')];common['Auto Fit']=[];}
      common['Data Sources']=[field('text','Embedded data / {{field}}','textarea')];
      if(!window.ObjectDataSourcesUI||!window.SourceSession)common['Data Type']=[field('data_type','Data type','select',['text','number'])];
      if(!window.ObjectDataSourcesUI||!window.SourceSession)common.Transforms=[field('data_transform','Transform','select',['none','trim','upper','lower']),field('data_prefix','Prefix','text'),field('data_suffix','Suffix','text')];
    }else if(draft.type==='text'){
      common.Font=[field('font','Zebra printer font','select',['0','A','B','C','D','E','F','G','H']),field('height_mm','Character height (mm)'),field('width_mm','Character width (mm)')];
      common['Data Sources']=[field('text','Text / {{field}}','textarea')];
    }else{
      common.Size=[field('width_mm','Width (mm)'),field('height_mm','Height (mm)')];
      if(['box','ellipse','line'].includes(draft.type))common.Line=[field('thickness_mm','Thickness (mm)')];
      if(draft.type==='image')common.Picture=[];
    }return common;
  }
  async function preview(){
    const token=++generation,target=dialog.querySelector('.op-preview');
    try{
      const template={...editing,margin_mm:{},background:null,elements:[{...draft,x_mm:0,y_mm:0,enabled:true}]},data=sampleData(editing);
      await ensureQR(qrValuesOf(template,data),null,dmValuesOf(template,data));if(token!==generation)return;
      const box=window.LabelPreview.computeBoxes(template,data)[0];template.width_mm=Math.max(1,box?.w||draft.width_mm||20);template.height_mm=Math.max(1,box?.h||draft.height_mm||10);
      target.innerHTML=window.LabelPreview.renderPreviewSVG(template,data,[0],qrCache);error.textContent='';
    }catch(e){if(token===generation){target.replaceChildren();error.textContent=e.message;}}
  }
  function render(){
    const sections=pages();if(!sections[page])page='Object';nav.replaceChildren();
    for(const name of Object.keys(sections)){const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-selected',String(name===page));b.onclick=()=>{page=name;render();};nav.append(b);}
    form.replaceChildren();
    for(const f of sections[page]){
      const label=document.createElement('label'),caption=document.createElement('span');caption.textContent=f.label;label.append(caption);
      const input=document.createElement(f.kind==='select'?'select':f.kind==='textarea'?'textarea':'input');
      if(f.options)for(const value of f.options){const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);}
      if(input.tagName==='INPUT')input.type=f.kind;input.name=f.key;
      if(f.kind==='checkbox')input.checked=draft[f.key]!==false;else input.value=draft[f.key]??({hri_height_mm:3,hri_align:'center',data_type:'text',data_transform:'none',...(draft.type==='qrcode'?{width_mm:(Number(draft.magnification)||4)*5}:{})}[f.key]??(f.kind==='number'?0:''));
      if(f.kind==='number'){input.step='0.01';input.required=true;if(!['x_mm','y_mm','rotation_deg','hri_offset_mm'].includes(f.key))input.min='0.01';}
      input.oninput=()=>{if(!input.checkValidity())return;draft[f.key]=f.kind==='checkbox'?input.checked:f.kind==='number'?Number(input.value):input.value;if(f.key==='type'){for(const [key,value] of Object.entries(insertElementDefaults[draft.type]||{}))if(draft[key]==null)draft[key]=value;render();}else void preview();};label.append(input);form.append(label);
    }
    if(page==='Picture'){
      const info=document.createElement('p');info.textContent=`Embedded monochrome image: ${draft.bitmap_width} × ${draft.bitmap_height} pixels`;form.append(info);
      const replace=document.createElement('input');replace.type='file';replace.accept='image/png,image/jpeg,image/bmp,image/webp';replace.setAttribute('aria-label','Replace picture');
      replace.onchange=async()=>{const file=replace.files[0];if(!file)return;try{const image=await createImageBitmap(file);const scale=Math.min(1,4096/image.width,4096/image.height,Math.sqrt(16000000/(image.width*image.height)));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(image.width*scale));canvas.height=Math.max(1,Math.floor(image.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);image.close();const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,stride=Math.ceil(canvas.width/8),bytes=new Uint8Array(stride*canvas.height);for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const n=(y*canvas.width+x)*4;if(pixels[n]*.299+pixels[n+1]*.587+pixels[n+2]*.114<128)bytes[y*stride+(x>>3)]|=128>>(x&7);}Object.assign(draft,{bitmap_width:canvas.width,bitmap_height:canvas.height,bitmap_hex:Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')});render();}catch(e){error.textContent=e.message;}};form.append(replace);
    }
    if(page==='Auto Fit'){
      const label=document.createElement('label');label.textContent='Maximum width (mm)';const input=document.createElement('input');input.type='number';input.min='.1';input.step='.1';input.value=editing.width_mm;label.append(input);form.append(label);const fit=document.createElement('button');fit.type='button';fit.textContent='Fit barcode width';fit.onclick=()=>{try{const width=Number(input.value);if(!(width>0))throw Error('Enter a positive width.');const probe={...editing,elements:[{...draft,module_width:1}]},box=window.LabelPreview.computeBoxes(probe,sampleData(editing))[0];const module=Math.floor(width/box.w);if(module<1)throw Error('Barcode cannot fit at the minimum module size. Increase width or shorten data.');draft.module_width=module;void preview();}catch(e){error.textContent=e.message;}};form.append(fit);
    }
    if(page==='Data Sources'){
      const label=document.createElement('label');label.textContent='Use named field';const select=document.createElement('select');select.setAttribute('aria-label','Use named field');select.add(new Option('Choose a data field…',''));for(const name of new Set([...Object.keys(editing.data_sources||{}),...placeholderNames(editing)]))select.add(new Option(name,name));select.onchange=()=>{if(!select.value)return;draft.text='{{'+select.value+'}}';render();};label.append(select);form.append(label);
      const configure=document.createElement('button');configure.type='button';configure.textContent='Manage data source…';configure.onclick=()=>{const match=String(draft.text||'').match(/^\{\{\s*([\w.\-]+)\s*\}\}$/);if(!match||!editing.data_sources?.[match[1]]){error.textContent='Choose a named source first. Create one with New field in Data Sources.';return;}window.DataSourcesUI.open(editing.data_sources[match[1]].category||'Embedded Data',match[1]);};form.append(configure);
    }void preview();
  }
  function apply(){
    if(!form.reportValidity())return false;
    try{const tpl={...editing,elements:editing.elements.map((e,i)=>i===index?draft:e)};const data=window.DataSourceEngine.resolve(tpl,{}, {globals:settings.dataSourceGlobals});window.ObjectData.resolve(draft,data,true);window.LabelPreview.computeBoxes({...tpl,elements:[draft]},data);readEditorIntoDraft();pushSnapshot();editing.elements[index]=structuredClone(draft);refreshEditorUI();touchEditor();updateUndoButtons();void persistEditor();return true;}catch(e){error.textContent=e.message;return false;}
  }
  dialog.querySelector('[data-action=apply]').onclick=apply;
  dialog.querySelector('[data-action=ok]').onclick=()=>{if(apply())dialog.close();};
  dialog.querySelector('[data-action=cancel]').onclick=dialog.querySelector('header button').onclick=()=>dialog.close();
  form.onsubmit=e=>{e.preventDefault();if(apply())dialog.close();};
  window.openObjectProperties=i=>{if(!editing?.elements[i]||dialog.open)return;readEditorIntoDraft();index=i;draft=structuredClone(editing.elements[i]);page=barcodes.includes(draft.type)?'Data Sources':'Object';dialog.querySelector('header strong').textContent=`${barcodes.includes(draft.type)?'Barcode':draft.type==='image'?'Picture':draft.type==='text'?'Text':'Shape'} Properties`;render();dialog.showModal();};
})();
