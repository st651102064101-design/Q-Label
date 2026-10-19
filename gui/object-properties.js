'use strict';
(() => {
  const dialog=document.createElement('dialog');dialog.id='objectProperties';
  dialog.innerHTML='<header><strong></strong><button type="button" aria-label="Close">×</button></header><div class="op-layout"><nav aria-label="Property pages"></nav><main><form></form><fieldset><legend>Preview</legend><div class="op-preview"></div></fieldset><p class="op-error" role="alert"></p></main></div><footer><span>Dimensions in mm. Apply updates the design and print output.</span><button type="button" data-action="apply">Apply</button><button type="button" data-action="ok">OK</button><button type="button" data-action="cancel">Cancel</button></footer>';
  document.body.append(dialog);
  const style=document.createElement('style');style.textContent='#objectProperties{width:min(820px,95vw);padding:0;border:1px solid var(--border);border-radius:7px;background:var(--card);color:var(--text)}#objectProperties::backdrop{background:#0006}#objectProperties header,#objectProperties footer{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid var(--border)}#objectProperties header strong,#objectProperties footer span{flex:1}#objectProperties footer{border-top:1px solid var(--border);font-size:11px}#objectProperties button{padding:6px 12px;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:3px;cursor:pointer}#objectProperties .op-layout{display:grid;grid-template-columns:185px 1fr;min-height:430px;max-height:72vh}#objectProperties nav{border-right:1px solid var(--border);padding:10px;overflow:auto}#objectProperties nav button{display:block;width:100%;text-align:left;margin-bottom:4px}#objectProperties nav button[aria-selected=true]{background:#dcfce7;color:#166534}#objectProperties main{padding:15px;overflow:auto}#objectProperties label{display:grid;grid-template-columns:145px 1fr;align-items:center;gap:10px;margin:10px 0}#objectProperties input,#objectProperties select,#objectProperties textarea{width:100%;box-sizing:border-box;padding:6px;color:var(--text);background:var(--card);border:1px solid var(--border)}#objectProperties input[type=checkbox]{width:auto;justify-self:start}#objectProperties fieldset{border:1px solid var(--border);margin-top:18px}.op-preview{height:210px;display:flex;justify-content:center;align-items:center;background:white;overflow:hidden}.op-preview svg{max-width:100%;max-height:100%}.op-error{color:#c62828}';document.head.append(style);
  const propertiesLayoutStyle=document.createElement('style');
  propertiesLayoutStyle.textContent='#objectProperties[open]{display:flex;flex-direction:column;box-sizing:border-box;height:min(720px,calc(100dvh - 24px));max-height:calc(100dvh - 24px);overflow:hidden}#objectProperties>header,#objectProperties>footer{flex-shrink:0;background:var(--card,#fff)}#objectProperties .op-layout{flex:1 1 auto;grid-template-columns:185px minmax(0,1fr);min-width:0;min-height:0;max-height:none;overflow:hidden}#objectProperties .op-layout>nav,#objectProperties .op-layout>main{min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain}#objectProperties main>fieldset{min-width:0}';
  document.head.append(propertiesLayoutStyle);
  let draft,index,page,generation=0,sourceSession=null,sourceEditor=null,sourceState={};
  function sourceCandidate(){
    const document=sourceSession?sourceSession.draft:structuredClone(editing);
    document.elements[index]=structuredClone(draft);return document;
  }
  function ensureSourceSession(){
    if(!sourceSession){sourceSession=window.SourceSession.createSession(sourceCandidate());draft=sourceSession.draft.elements[index];}
    else sourceSession.update(document=>{document.elements[index]=structuredClone(draft);});
    return sourceSession;
  }
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
      const candidate=sourceCandidate(),template={...candidate,margin_mm:{},background:null,page:{enabled:false},elements:[{...draft,x_mm:0,y_mm:0,enabled:true}]},data=sampleData(candidate);
      await ensureQR(qrValuesOf(template,data),null,dmValuesOf(template,data));if(token!==generation)return;
      const box=window.LabelPreview.computeBoxes(template,data)[0];template.width_mm=Math.max(1,box?.w||draft.width_mm||20);template.height_mm=Math.max(1,box?.h||draft.height_mm||10);
      target.innerHTML=window.LabelPreview.renderPreviewSVG(template,data,[0],qrCache);error.textContent='';
    }catch(e){if(token===generation){target.replaceChildren();error.textContent=e.message;}}
  }
  function render(){
    sourceEditor?.dispose();sourceEditor=null;
    const sections=pages();if(!sections[page])page='Object';nav.replaceChildren();
    for(const name of Object.keys(sections)){const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-selected',String(name===page));b.onclick=()=>{page=name;render();};nav.append(b);}
    form.replaceChildren();
    if(page==='Data Sources'&&window.ObjectDataSourcesUI&&window.SourceSession){
      const session=ensureSourceSession();
      sourceEditor=window.ObjectDataSourcesUI.mount(form,{session,objectId:draft.id,state:sourceState,treeHost:nav,testTransform:window.zebra?.prepareSourceInputs?async(candidate,id)=>{const prepared=await window.zebra.prepareSourceInputs({template:candidate,context:{mode:'preview'}});if(!prepared.ok)throw Error(prepared.error);const result=window.SourceResolver.evaluateDocument(candidate,prepared.inputs);if(result.diagnostics.length)throw Error(result.diagnostics.map(item=>item.message).join('\n'));return result.objects[id]?.text??'';}:undefined,inspectLibrary:window.zebra?.inspectSourceLibrary?async file=>{const result=await window.zebra.inspectSourceLibrary(file);if(!result.ok)throw Error(result.error);return result;}:undefined,compileGs1:window.zebra?.compileSourceGs1?payload=>window.zebra.compileSourceGs1(payload):undefined,onChange:document=>{draft=document.elements[index];void preview();},onDiagnostic:message=>{error.textContent=message;},chooseDirectory:window.zebra?.chooseSourceDirectory?async()=>{const result=await window.zebra.chooseSourceDirectory();if(result.error)throw Error(result.error);return result.path;}:undefined,chooseFile:window.zebra?.chooseSourceFile?async()=>{const result=await window.zebra.chooseSourceFile();if(result.error)throw Error(result.error);return result.path;}:undefined});
      void preview();return;
    }
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
  async function apply(){
    if(!form.reportValidity())return false;
    try{
      const tpl=sourceCandidate(),data=sampleData(tpl);
      window.ObjectData.resolve(draft,data,true);window.LabelPreview.computeBoxes({...tpl,elements:[draft]},data);readEditorIntoDraft();pushSnapshot();
      if(sourceSession){sourceSession.update(document=>{document.elements[index]=structuredClone(draft);for(const element of document.elements){const result=data['$qlabel.sources']?.objects?.[element.id];if(result){const raw=result.sourceText??result.text;if(element.barcode_spec)element.barcode_spec.text=raw;else element.text=raw;element.sourceTextSnapshot=raw;}}});editing=sourceSession.commit();sourceSession=window.SourceSession.createSession(editing);draft=sourceSession.draft.elements[index];render();}
      else editing.elements[index]=structuredClone(draft);
      refreshEditorUI();touchEditor();updateUndoButtons();void persistEditor();return true;
    }catch(e){error.textContent=e.message;return false;}
  }
  dialog.querySelector('[data-action=apply]').onclick=()=>{void apply();};
  dialog.querySelector('[data-action=ok]').onclick=async()=>{if(await apply())dialog.close();};
  dialog.querySelector('[data-action=cancel]').onclick=dialog.querySelector('header button').onclick=()=>dialog.close();
  form.onsubmit=async e=>{e.preventDefault();if(await apply())dialog.close();};
  dialog.addEventListener('close',()=>{generation++;sourceEditor?.dispose();sourceEditor=null;sourceSession?.cancel();sourceSession=null;});
  document.addEventListener('source-inputs-ready',()=>{if(dialog.open)void preview();});
  document.addEventListener('dblclick',event=>{
    const hit=event.target.closest?.('#previewFrame .hit[data-hit]'),textEditor=event.target.closest?.('#canvasTextEditor');
    const at=hit?Number(hit.dataset.hit):textEditor?Number(textEditor.dataset.elementIndex):NaN;
    if(!Number.isInteger(at)||!editing?.elements[at]||editing.elements[at].table_model)return;
    event.preventDefault();event.stopPropagation();window.openObjectProperties(at);
  },true);
  document.addEventListener('keydown',event=>{if(event.altKey&&event.key==='Enter'&&!event.target.closest?.('dialog,input,textarea,select,[contenteditable=true]')&&Number.isInteger(editorSel)){event.preventDefault();window.openObjectProperties(editorSel);}});
  window.openObjectProperties=i=>{cancelTextClick();document.getElementById('canvasTextEditor')?.blur();if(!editing?.elements[i]||dialog.open)return;readEditorIntoDraft();sourceSession?.cancel();sourceSession=null;sourceState={};index=i;draft=structuredClone(editing.elements[i]);page=barcodes.includes(draft.type)?'Symbology and Size':'Object';dialog.querySelector('header strong').textContent=`${barcodes.includes(draft.type)?'Barcode':draft.type==='image'?'Picture':draft.type==='text'?'Text':'Shape'} Properties`;render();dialog.showModal();};
})();
