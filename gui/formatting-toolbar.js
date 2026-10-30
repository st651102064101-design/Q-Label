(function(){
  'use strict';
  const host=document.getElementById('ribbon-home');if(!host)return;
  const panel=document.createElement('div');panel.className='ribbon-group text-format-tools';
  const row=document.createElement('div');row.className='text-format-row';panel.append(row);
  const caption=document.createElement('div');caption.className='ribbon-group-label';caption.textContent='Text and object formatting';panel.append(caption);host.append(panel);
  const clipboardGroup=host.querySelector('[data-ribbon-group="clipboard"]'),historyGroup=host.querySelector('#undoBtn')?.closest('.ribbon-group');if(clipboardGroup){host.append(clipboardGroup);if(historyGroup)host.append(historyGroup);}
  const controls=[];
  const targets=()=>typeof editing!=='undefined'&&editing?(editorSelection.size?[...editorSelection]:[editorSel]).map(i=>editing.elements[i]).filter(Boolean):[];
  const hasText=e=>e.type==='text'||!!e.table_model||(!!e.barcode_spec&&e.barcode_spec.show_text!==false)||(['barcode128','code39','code93','ean13'].includes(e.type)&&e.show_text!==false);
  const linearBarcode=e=>['barcode128','code39','code93','ean13'].includes(e?.type);
  const usesTextColors=e=>e?.type==='text'||linearBarcode(e)||!!e?.barcode_spec;
  const supportsControl=window.FormattingCapabilities?.supportsControl||(()=>false);
  const dimensions=e=>{try{return window.LabelPreview?.computeBoxes({...editing,elements:[e]},sampleData(editing))[0]||null;}catch{return null;}};
  const textTargets=()=>targets().filter(hasText);
  let liveNumericEdit=null,lastLiveNumericValue;
  const numericPrecision=value=>{const text=String(value);return Math.min(15,(text.split('.')[1]||'').length);};
  const formatThickness=value=>Number(mmToUnit(value,measureUnit(),editing?.dpi)).toFixed(numericPrecision(controls.find(control=>control.key==='thickness_mm')?.field.step||'.1')).replace(/(?:\.0+|(\.\d*?[1-9])0+)$/,'$1');
  let colorPreviewFrame=null;
  const pendingTextColors=new Map();
  function queueTextColorPreview(objects,key){
    for(const object of objects){const index=editing?.elements?.indexOf(object);if(index>=0)pendingTextColors.set(index,{object,property:key});}
    if(colorPreviewFrame!==null)return;
    colorPreviewFrame=requestAnimationFrame(()=>{
      colorPreviewFrame=null;
      const svg=document.querySelector('#previewFrame .canvaswrap > svg');
      let rebuildFullBarcodeFill=false;
      for(const [index,{object,property}] of pendingTextColors){
        const group=svg?.querySelector(`[data-label-element="${index}"]`);
        if(property==='stroke_color'&&usesTextColors(object)){const color=object.text_inverse?'#fff':object.text_color||'#111';group?.querySelectorAll('text').forEach(node=>node.setAttribute('fill',color));}
        else if((property==='stroke_color'||property==='fill_color')&&!usesTextColors(object)){
          const selector=object.type==='line'?'line':object.type==='box'?'rect':object.type==='ellipse'?'ellipse':null;
          const primitive=selector&&group?.querySelector(selector);
          if(primitive)primitive.setAttribute(property==='stroke_color'?'stroke':'fill',object[property]||(property==='stroke_color'?'#111':'none'));
        }
        else{
          const color=object.text_inverse?'#000':object.text_background||'none';
          group?.querySelectorAll('[data-text-background],[data-barcode-background]').forEach(node=>node.setAttribute('fill',color));
          const isBarcode=linearBarcode(object)||!!object.barcode_spec;
          if(isBarcode&&object.barcode_fill_scope!=='text'&&color!=='none'&&!group?.querySelector('[data-barcode-background][data-fill-scope="all"]'))rebuildFullBarcodeFill=true;
        }
      }
      pendingTextColors.clear();touchEditor();
      // With No fill selected there is no full-area rect in the existing SVG
      // to recolor. Rebuild once so the newly chosen color creates that rect
      // immediately, while the native color picker is still open.
      if(rebuildFullBarcodeFill)drawEditorCanvas();
    });
  }
  async function change(key,value,textOnly=true,live=false,formatTableCells=false){
    const retainedCellKeys=[...(window.TableCellSelection?.keys||[])];
    const cellEditor=document.querySelector('.table-cell-editor'),rangeKey=({bold:'bold',italic:'italic',underline:'underline',strike:'strike',font_family:'font_family',font_size_pt:'font_size_pt',stroke_color:'text_color',fill_color:'text_background',text_inverse:'text_inverse'})[key];
    if(cellEditor&&cellEditor.selectionStart!==cellEditor.selectionEnd&&rangeKey)return window.TableTools?.formatTextRange(rangeKey,value,false,!live)||false;
    if(!(textOnly?textTargets():targets()).length)return;
    document.getElementById('canvasTextEditor')?.blur();document.querySelector('.table-cell-editor')?.blur();
    const barcodeImages=new Map();
    const colorOnly=live&&(key==='stroke_color'||key==='fill_color');
    for(const i of (editorSelection.size?[...editorSelection]:[editorSel])){const e=editing.elements[i];if(!colorOnly&&e?.barcode_spec&&e.barcode_spec.show_text!==false&&!e.barcode_bars){const r=await window.zebra.barcodeEncode({...e.barcode_spec,show_text:false});if(!r.ok){alert(r.error);return;}barcodeImages.set(i,r);}}
    const editToken=`${key}:${(editorSelection.size?[...editorSelection]:[editorSel]).join(',')}`;
    if(live){if(liveNumericEdit!==editToken){readEditorIntoDraft();pushSnapshot();liveNumericEdit=editToken;}lastLiveNumericValue=value;}
    else if(liveNumericEdit===editToken&&Object.is(lastLiveNumericValue,value)){liveNumericEdit=null;return;}
    else {liveNumericEdit=null;readEditorIntoDraft();pushSnapshot();}
    for(const [i,r] of barcodeImages)if(editing.elements[i]?.barcode_spec)editing.elements[i].barcode_bars={bitmap_width:r.bitmap_width,bitmap_height:r.bitmap_height,bitmap_hex:r.bitmap_hex};
    // Reading the editor replaces the template. Resolve objects afterwards.
    const objects=(textOnly?textTargets():targets()).filter(e=>!['text_wrap','text_auto_fit'].includes(key)||supportsControl(e,key));
    const tableCellKeys=objects.length===1&&objects[0].table_model&&editorSelection.size<=1?retainedCellKeys:[];
    const shortcutCellKeys=formatTableCells?tableCellKeys:[];
    for(const e of objects){
      const changingTextColor=(key==='stroke_color'||key==='fill_color')&&usesTextColors(e);
      if(hasText(e)&&!changingTextColor){e.font_family ||= 'Arial';e.font_size_pt ||= e.table_model?e.table_model.fontSize*72/25.4:e.type==='text'?Math.max(1,(Number(e.height_mm)||3)*.9*72/25.4):(Number(e.hri_height_mm)||3)*72/25.4;}
      if(e.type==='text'&&['text_align','text_wrap','text_auto_fit'].includes(key)){const box=dimensions(e);e.text_box_width_mm ||=Math.max(1,box?.w||30);if(key==='text_auto_fit')e.text_box_height_mm ||=Math.max(.1,box?.h||Number(e.height_mm)||3);}
      if(e.type==='text'&&key==='vertical_align')e.text_box_height_mm ||=10;
      if(e.type==='text'&&key==='line_style')e.thickness_mm ||= .3;
      if(usesTextColors(e)&&(key==='stroke_color'||key==='fill_color'))e[key==='stroke_color'?'text_color':'text_background']=value;
      else if(linearBarcode(e)){
        if(key==='text_box_width_mm'){
          // Keep the requested physical width. Rounding modules to whole dots
          // made W jump by an entire module (often several millimetres).
          // Raster output distributes fractional module widths across printer
          // dots, so the overall symbol can match the requested width.
          const modules=barcodeModuleCount(e),dpi=Number(editing.dpi)||203,dots=Math.max(1,value*dpi/25.4/Math.max(1,modules));
          e.module_width=dots;
        }else if(key==='text_box_height_mm'){
          const box=dimensions(e),oldBar=Math.max(2,Number(e.bar_height_mm)||10),reserved=Math.max(0,(box?.h||oldBar)-oldBar);
          e.bar_height_mm=Math.max(2,Math.round((value-reserved)*10)/10);
        }else if(key==='line_spacing')e.hri_gap_mm=value;
        else if(key==='vertical_align'){e.vertical_align=value;e.hri_box_height_mm=Math.max(Number(e.hri_box_height_mm)||0,(Number(e.hri_height_mm)||3)*2);}
        else e[key]=value;
      }else if(e.table_model&&['text_wrap','text_auto_fit'].includes(key)&&tableCellKeys.length){
        window.TableDesign?.applyCellStyle(e.table_model,tableCellKeys,{[key]:value});
      }else if(key==='dash_pattern'){Object.assign(e,window.LineDash.fieldsFor(value));if(e.table_model)e.table_model.lineStyle={solid:'Solid',dash:'Dashed',erase:'Erase'}[e.line_style];}else if(!(formatTableCells&&e.table_model&&['bold','italic','underline','strike'].includes(key)))e[key]=value;
      if(e.table_model){
        if(formatTableCells&&['bold','italic','underline','strike'].includes(key)){
          const cells=window.TableDesign?.styleTargets(e.table_model,shortcutCellKeys,!shortcutCellKeys.length)||[];
          if(!shortcutCellKeys.length)e[key]=value;
          window.TableDesign?.applyCellStyle(e.table_model,cells,{[key]:value});
        }
        if(key==='font_size_pt')e.table_model.fontSize=value*25.4/72;
        if(key==='fill_color'||key==='text_background')e.table_model.fill=value==='none'?'#ffffff':value;
        if(key==='stroke_color')e.table_model.border=value;
        if(key==='line_style')e.table_model.lineStyle=({solid:'Solid',dash:'Dashed',dot:'Dotted',erase:'Erase'})[value]||value;
        if(key==='thickness_mm')e.table_model.stroke=value;
        window.TableTools?.bake(e);
      }
      if(['barcode128','code39','code93','ean13'].includes(e.type)){
        if(key==='font_size_pt')e.hri_height_mm=value*25.4/72;
        if(key==='text_align')e.hri_align=value==='justify'?'left':value;
      }
    }
    if(colorOnly&&(key==='stroke_color'||key==='fill_color')&&objects.length&&objects.every(object=>usesTextColors(object)||['line','box','ellipse'].includes(object.type))){queueTextColorPreview(objects,key);return;}
    renderEditorElements();drawEditorCanvas();touchEditor();void persistEditor();sync();
    if(key==='font_family')document.fonts.load('12px '+JSON.stringify(value)).then(()=>{drawEditorCanvas();sync();});
  }
  function toggleFormattingShortcut(key){
    const objects=textTargets();if(!objects.length)return false;
    const selectedCellKeys=objects.length===1&&editorSelection.size<=1?[...(window.TableCellSelection?.keys||[])]:[];
    const states=[];
    objects.forEach((object,index)=>{
      if(!object.table_model){states.push(!!object[key]);return;}
      const model=object.table_model,cells=window.TableDesign?.styleTargets(model,index===0?selectedCellKeys:[],!(index===0&&selectedCellKeys.length))||[];
      for(const id of cells){const [row,column]=id.split(',').map(Number),cell=window.TableTools?.cellTextAppearance?.(object,model,row,column)||window.TableDesign.cell(model,row,column),stored=model.cellStyles?.[id]||{};states.push(!!cell[key]);}
    });
    if(!states.length)return false;
    change(key,!states.every(Boolean),true,false,true);return true;
  }
  function input(key,label,type,values,textOnly=true){const wrapper=document.createElement('label');wrapper.title=label;if(key==='thickness_mm')wrapper.classList.add('format-thickness-control');const field=document.createElement(values?'select':'input');field.setAttribute('aria-label',label);field.title=label;if(values){for(const [value,name] of values){const option=document.createElement('option');option.value=value;option.textContent=name;field.append(option);}}else field.type=type;if(type==='number'){field.min=key==='font_size_pt'?'1':'0';field.max=key==='font_size_pt'?'1000':'100';field.step='.1';}const measured=key.endsWith('_mm');if(measured)field.dataset.measureUnit='system';let noColor=null;if(type==='color'&&key==='fill_color'){wrapper.classList.add('format-fill-color');noColor=document.createElement('span');noColor.className='format-no-color-indicator';noColor.setAttribute('aria-hidden','true');noColor.innerHTML='<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="2.5" width="15" height="15" rx="2" fill="#fff" fill-opacity=".88" stroke="#475569" stroke-width="1.4"/><path d="M5 15 15 5" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round"/></svg>';noColor.hidden=true;}const readValue=()=>{let value=field.value;if(type==='number'){value=Number(value);if(!Number.isFinite(value)||field.validity.badInput||field.validity.rangeUnderflow||field.validity.rangeOverflow)return null;if(key==='thickness_mm'&&measured){const minimum=25.4/(Number(editing?.dpi)||203),minimumUnit=mmToUnit(minimum,measureUnit(),editing?.dpi);if(value<minimumUnit){value=minimumUnit;field.value=String(minimumUnit);field.defaultValue=field.value;}}value=measured?unitToMm(value,measureUnit(),editing?.dpi):Math.round(value*10)/10;}return value;};field.oninput=()=>{if(type==='color'){if(noColor)noColor.hidden=true;change(key,field.value,textOnly,true);return;}if(type!=='number')return;const value=readValue();if(value!==null){field.dataset.pendingValue=String(value);change(key,value,textOnly,true);}};field.onchange=()=>{const value=readValue();if(value===null)return;if(type==='number')field.value=key==='thickness_mm'?formatThickness(value):measured?String(mmToUnit(value,measureUnit(),editing?.dpi)):value.toFixed(1);const editToken=`${key}:${(editorSelection.size?[...editorSelection]:[editorSel]).join(',')}`;if(type==='color'&&liveNumericEdit===editToken){if(Object.is(lastLiveNumericValue,value)){liveNumericEdit=null;sync();}else change(key,value,textOnly,true);return;}if(type==='number'&&field.dataset.pendingValue===String(value)){delete field.dataset.pendingValue;change(key,value,textOnly,false);return;}change(key,value,textOnly);};field.onblur=()=>{delete field.dataset.pendingValue;if(type==='number'){const value=readValue();if(value!==null){field.value=key==='thickness_mm'?formatThickness(value):measured?String(mmToUnit(value,measureUnit(),editing?.dpi)):value.toFixed(1);if(key==='thickness_mm')field.defaultValue=field.value;}}};if(['font_size_pt','text_box_width_mm','text_box_height_mm','line_spacing','thickness_mm'].includes(key)){const hint=document.createElement('span');if(key==='thickness_mm')hint.classList.add('format-unit-hint');hint.textContent={font_size_pt:'pt',text_box_width_mm:'W',text_box_height_mm:'H',line_spacing:'↕',thickness_mm:'Line'}[key];wrapper.append(hint);}wrapper.append(field);if(noColor)wrapper.append(noColor);row.append(wrapper);controls.push({field,key,textOnly,noColor});return field;}
  const families=['Arial','Arial Unicode MS','Cambria','Cambria Math','Segoe UI Symbol','Segoe UI Historic','Segoe UI Emoji','Symbol','Wingdings','Wingdings 2','Wingdings 3','Webdings'];
  const fonts=input('font_family','Font family','text',families.map(n=>[n,n]));fonts.className='format-font';
  input('font_size_pt','Font size (pt)','number').className='format-size';
  function command(key,label,html,value){const button=document.createElement('button');button.type='button';const shortcut=({bold:'Ctrl+B',italic:'Ctrl+I',underline:'Ctrl+U',strike:'Ctrl+Shift+X'})[key];button.title=shortcut?label+' ('+shortcut+')':label;button.setAttribute('aria-label',label);if(shortcut)button.setAttribute('aria-keyshortcuts',shortcut.replace('Ctrl','Control'));button.innerHTML=html;if(['bold','italic','underline','strike'].includes(key))button.dataset.textFormat=key;button.onpointerdown=event=>{const editor=document.querySelector('.table-cell-editor');if(editor&&editor.selectionStart!==editor.selectionEnd)event.preventDefault();};button.onclick=()=>{const editor=document.querySelector('.table-cell-editor');if(['bold','italic','underline','strike','text_inverse'].includes(key)&&editor&&editor.selectionStart!==editor.selectionEnd){window.TableTools?.formatTextRange(key,undefined,true);return;}const target=textTargets()[0],cellKeys=target?.table_model&&editorSelection.size<=1?[...(window.TableCellSelection?.keys||[])]:[],isActive=()=>{if(!target)return false;if(target.table_model&&['text_wrap','text_auto_fit'].includes(key)){const fallback=key==='text_wrap';const states=cellKeys.length?cellKeys.map(id=>{const [r,c]=id.split(',').map(Number);return !!(window.TableDesign?.cell(target.table_model,r,c)?.[key]??target[key]??fallback);}):[!!(target[key]??fallback)];return states.length>0&&states.every(Boolean);}return !!target[key];};if(target?.table_model&&['bold','italic','underline','strike'].includes(key))toggleFormattingShortcut(key);else change(key,value===undefined?!isActive():value);};row.append(button);controls.push({field:button,key,textOnly:true,value});return button;}
  command('bold','Bold','<b>B</b>');command('italic','Italic','<i>I</i>');command('underline','Underline','<u>U</u>');
  command('text_inverse','White text on black','<b>W</b>');command('text_wrap','Wrap text within its box or table cell','↵');command('text_auto_fit','Auto fit text','↔');
  const clearFormatting=document.createElement('button');clearFormatting.type='button';clearFormatting.title='Clear All Formatting';clearFormatting.setAttribute('aria-label','Clear All Formatting');
  clearFormatting.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 16 5-12 5 12M5 11h6"/><path d="m14 20-3-3 6-6 4 4-5 5h-2Z" stroke="#a855b5"/><path d="m14 14 4 4" stroke="#a855b5"/></svg>';
  clearFormatting.onpointerdown=event=>{const editor=document.querySelector('.table-cell-editor');if(editor&&editor.selectionStart!==editor.selectionEnd)event.preventDefault();};
  clearFormatting.onclick=()=>{
    const cellEditor=document.querySelector('.table-cell-editor');if(cellEditor&&cellEditor.selectionStart!==cellEditor.selectionEnd){window.TableTools?.formatTextRange('clear');return;}
    if(!textTargets().length)return;
    const clearCellKeys=[...(window.TableCellSelection?.keys||[])];cellEditor?.blur();
    if(colorPreviewFrame!==null){cancelAnimationFrame(colorPreviewFrame);colorPreviewFrame=null;}pendingTextColors.clear();liveNumericEdit=null;
    readEditorIntoDraft();pushSnapshot();
    for(const object of textTargets()){
      if(object.table_model){const model=object.table_model,keys=clearCellKeys.length?clearCellKeys:model.rows.flatMap((_,r)=>model.columns.map((_,c)=>r+','+c));for(const id of keys){model.cellStyles||={};model.cellStyles[id]={...(model.cellStyles[id]||{}),fontFamily:'Arial',fontSize:11*25.4/72,color:'#111111',bold:false,italic:false,underline:false,strike:false,text_inverse:false,letter_spacing_mm:0,text_opacity:1};if(model.cellTextStyles)delete model.cellTextStyles[id];}window.TableTools?.bake?.(object);continue;}
      for(const key of ['bold','italic','underline','strike','script','text_color','text_background','text_inverse','text_scale_x','text_scale_y'])delete object[key];
      object.font_family='Arial';object.font_size_pt=11;
      if(object.table_model){object.table_model.fontSize=11*25.4/72;for(const key of ['bold','italic','underline','strike','text_color','text_background'])delete object.table_model[key];window.TableTools?.bake?.(object);}
    }
    renderEditorElements();drawEditorCanvas();touchEditor();void persistEditor();sync();
  };
  row.append(clearFormatting);
  const firstRowCount=row.childElementCount;
  for(const [value,label,icon] of [['left','Align text left','M3 5h18M3 10h12M3 15h18M3 20h12'],['center','Center text','M3 5h18M6 10h12M3 15h18M6 20h12'],['right','Align text right','M3 5h18M9 10h12M3 15h18M9 20h12']])command('text_align',label,`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="${icon}"/></svg>`,value);
  input('text_box_width_mm','Width','number',null,false);input('line_spacing','Line spacing','number');input('vertical_align','Vertical alignment','text',[['top','Top'],['middle','Middle'],['bottom','Bottom']]);
  input('text_box_height_mm','Text box height','number');
  input('stroke_color','Text color / outline color','color',null,false);input('fill_color','Text background / object fill','color',null,false);input('barcode_fill_scope','Barcode fill area','text',[['text','Text area only'],['all','Full barcode']],false);
  const clear=document.createElement('button');clear.type='button';clear.className='format-no-fill';clear.title='No fill / transparent';clear.setAttribute('aria-label','No fill / transparent');clear.innerHTML='<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="2.5" y="2.5" width="15" height="15" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 15 15 5" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>';clear.onclick=()=>change('fill_color','none',false);row.append(clear);controls.push({field:clear,textOnly:false});
  const lineStyleField=input('line_style','Line style','text',[['solid','Solid'],['dot','Dot'],['dash','Dash'],['erase','Erase']],false);const thicknessField=input('thickness_mm','Line thickness','number',null,false);
  // BarTender-style menus: dash swatches and pt presets. The hidden select stays as the legacy value holder.
  const lineMenusReady=!!(window.LineMenus&&window.LineDash);
  if(lineMenusReady)lineStyleField.hidden=true;
  const dashIndex=()=>{const e=targets()[0];if(!e)return 0;if(e.table_model)return ({Solid:0,Dashed:2,Dash:2,Dotted:7,Dot:7,Erase:-1})[e.table_model.lineStyle]??0;return window.LineDash.selectedIndex(e);};
  const dashUi=lineMenusReady?window.LineMenus.dashPicker(window.LineDash.DASHES,dashIndex,index=>change('dash_pattern',index,false)):null;
  if(dashUi)lineStyleField.closest('label').append(dashUi.button);
  const compoundUi=lineMenusReady&&window.LineCompound?window.LineMenus.compoundPicker(window.LineCompound.COMPOUNDS,()=>window.LineCompound.keyOf(targets()[0]),key=>change('compound',key,false)):null;
  if(compoundUi)lineStyleField.closest('label').append(compoundUi.button);
  const minLineMm=25.4/(Number(editing?.dpi)||203);
  const widthArrow=lineMenusReady?window.LineMenus.widthPicker(thicknessField,()=>{const e=targets()[0];return Number(e?.table_model?e.table_model.stroke:e?.thickness_mm)||.3;},mm=>change('thickness_mm',Math.max(mm,25.4/(Number(editing?.dpi)||203)),false),minLineMm):null;
  if(widthArrow)thicknessField.closest('label').append(widthArrow);
  // BarTender-style color popup replaces the native picker; the input stays as the value holder.
  if(window.ColorPicker)for(const c of controls.filter(item=>item.key==='stroke_color'||item.key==='fill_color')){
    c.field.addEventListener('click',event=>{
      event.preventDefault();
      if(c.field.disabled)return;
      const target=targets()[0],isFill=c.key==='fill_color',textColor=!!target&&usesTextColors(target);
      window.ColorPicker.open(c.field,{
        value:c.field.value,
        allowNone:isFill?!clear.disabled:!textColor,
        onPick:hex=>{c.field.value=hex;c.field.dispatchEvent(new Event('input',{bubbles:true}));c.field.dispatchEvent(new Event('change',{bubbles:true}));},
        onNone:()=>{if(isFill)clear.onclick();else change('dash_pattern',-1,false);}
      });
    });
  }
  const lines=[document.createElement('div'),document.createElement('div')];
  lines.forEach(line=>line.className='text-format-line');
  [...row.children].forEach((control,index)=>lines[index<firstRowCount?0:1].append(control));
  row.append(...lines);
  function syncLineMenus(){if(!dashUi||!widthArrow)return;const selected=targets(),usable=!!selected.length&&selected.every(item=>supportsControl(item,'line_style'));dashUi.button.disabled=!usable;widthArrow.disabled=!usable;if(usable)dashUi.refresh();if(compoundUi){const compoundable=usable&&selected.every(item=>!item.table_model&&!item.shape_preset&&['line','box','ellipse'].includes(item.type));compoundUi.button.disabled=!compoundable;if(compoundable)compoundUi.refresh();}}
  function sync(){
    syncLineMenus();
    clearFormatting.disabled=!textTargets().length;
    const first=textTargets()[0],object=targets()[0],cellEditor=document.querySelector('.table-cell-editor'),hasCellTextSelection=!!(cellEditor&&cellEditor.selectionStart!==cellEditor.selectionEnd);
    for(const c of controls){
      const e=c.textOnly?first:object,capabilityKey=c.field===clear?'clear_fill':c.key;
      const selected=targets();
      c.field.disabled=!selected.length||!selected.every(item=>supportsControl(item,capabilityKey));
      if(c.field.disabled&&c.field.tagName==='BUTTON'){c.field.setAttribute('aria-pressed','false');c.field.classList.remove('is-active');}
      c.field.classList.toggle('unavailable-tool',c.field.disabled);
      c.field.closest('label')?.classList.toggle('unavailable-tool',c.field.disabled);
      if(!e||c.field.disabled)continue;
      if(c.field.tagName==='BUTTON'){let pressed=c.value===undefined?!!e[c.key]:e[c.key]===c.value;if(e.table_model&&['text_wrap','text_auto_fit'].includes(c.key)){const keys=editorSelection.size<=1?[...(window.TableCellSelection?.keys||[])]:[],fallback=c.key==='text_wrap',states=keys.map(id=>{const [r,col]=id.split(',').map(Number);return !!(window.TableDesign?.cell(e.table_model,r,col)?.[c.key]??e[c.key]??fallback);});pressed=states.length?states.every(Boolean):!!(e[c.key]??fallback);}if(e.table_model&&['bold','italic','underline','strike'].includes(c.key)){const model=e.table_model,keys=[...(window.TableCellSelection?.keys||[])],ids=keys.length?keys:model.rows.flatMap((_,r)=>model.columns.map((_,col)=>r+','+col));pressed=ids.length>0&&ids.every(id=>{const [r,col]=id.split(',').map(Number);return !!window.TableTools?.cellTextAppearance?.(e,model,r,col)[c.key];});}c.field.setAttribute('aria-pressed',String(pressed));c.field.classList.toggle('is-active',pressed);continue;}
      if(document.activeElement===c.field||hasCellTextSelection&&['font_family','font_size_pt','bold','italic','underline','strike','stroke_color','fill_color','text_inverse'].includes(c.key))continue;
      let key=c.key;
      if(hasCellTextSelection&&(key==='stroke_color'||key==='fill_color')){key=key==='stroke_color'?'text_color':'text_background';const label=key==='text_color'?'Text color':'Text background';c.field.title=label;c.field.setAttribute('aria-label',label);const wrapper=c.field.closest('label');if(wrapper)wrapper.title=label;}
      else if((key==='stroke_color'||key==='fill_color')&&usesTextColors(e)){key=key==='stroke_color'?'text_color':'text_background';const label=key==='text_color'?'Text color':'Text background';c.field.title=label;c.field.setAttribute('aria-label',label);const wrapper=c.field.closest('label');if(wrapper)wrapper.title=label;}
      else if(key==='stroke_color'||key==='fill_color'){const label=key==='stroke_color'?'Outline / line color':'Object fill';c.field.title=label;c.field.setAttribute('aria-label',label);const wrapper=c.field.closest('label');if(wrapper)wrapper.title=label;}
      const defaults={font_family:'Arial',font_size_pt:(Number(e.height_mm)||3)*.9*72/25.4,text_color:'#111111',text_background:'#ffffff',text_box_width_mm:30,text_box_height_mm:10,line_spacing:1.2,vertical_align:'top',stroke_color:'#111111',fill_color:'#ffffff',barcode_fill_scope:'all',line_style:'solid',thickness_mm:.3};
      let value=e[key]??defaults[key]??'';
      if(e.table_model){if(c.key==='font_size_pt')value=Number(e.table_model.fontSize)*72/25.4;if(c.key==='fill_color')value=e.table_model.fill||'#ffffff';if(c.key==='stroke_color')value=e.table_model.border||'#000000';if(c.key==='line_style')value=({Solid:'solid',Dash:'dash',Dashed:'dash',Dot:'dot',Dotted:'dot',Erase:'erase'})[e.table_model.lineStyle]||'solid';if(c.key==='thickness_mm')value=e.table_model.stroke??.3;}
      if(linearBarcode(e)){if(c.key==='text_box_width_mm'||c.key==='text_box_height_mm')value=dimensions(e)?.[c.key==='text_box_width_mm'?'w':'h']??value;if(c.key==='line_spacing')value=e.hri_gap_mm??.6;}
      if(c.noColor)c.noColor.hidden=value!=='none';if(c.field.dataset.measureUnit==='system')value=mmToUnit(value,measureUnit(),editing?.dpi);if(c.key==='thickness_mm'){const step=String(mmToUnit(25.4/(Number(editing?.dpi)||203),measureUnit(),editing?.dpi));c.field.min='0';c.field.step=step;c.field.max=String(mmToUnit(100,measureUnit(),editing?.dpi));}
      const numeric=Number(value);c.field.value=c.field.type==='number'&&Number.isFinite(numeric)?c.key==='thickness_mm'?numeric.toFixed(numericPrecision(c.field.step)).replace(/(?:\.0+|(\.\d*?[1-9])0+)$/,'$1'):numeric.toFixed(1):value;if(c.key==='thickness_mm')c.field.defaultValue=c.field.value;
    }
  }
  document.addEventListener('keydown',event=>{if(!(event.ctrlKey||event.metaKey)||event.target?.closest?.('input,textarea,select,[contenteditable=true]'))return;const key=event.shiftKey&&event.code==='KeyX'?'strike':{KeyB:'bold',KeyI:'italic',KeyU:'underline'}[event.code]||{b:'bold',i:'italic',u:'underline'}[String(event.key||'').toLowerCase()];if(key&&toggleFormattingShortcut(key)){event.preventDefault();event.stopPropagation();}});document.addEventListener('preview-updated',sync);document.addEventListener('editor-selection-changed',sync);document.addEventListener('pointerup',()=>queueMicrotask(sync));sync();
  const style=document.createElement('style');style.textContent='.text-format-tools[hidden]{display:none!important}.text-format-tools{flex:0 0 auto}.text-format-row{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:4px;height:64px;flex:none}.text-format-line{display:flex;align-items:center;gap:3px;height:30px;flex:none;white-space:nowrap}.text-format-row input,.text-format-row select,.text-format-row button{box-sizing:border-box}.text-format-row label{display:flex;align-items:center;gap:2px;font-size:11px}.text-format-row label.format-thickness-control{flex:0 0 auto;margin-left:8px;gap:4px}.text-format-row .format-unit-hint{flex:0 0 auto;white-space:nowrap}.text-format-row input,.text-format-row select{height:30px;padding:3px;border:1px solid var(--border,#cbd5e1);border-radius:3px;background:var(--card,#fff);color:var(--text,#1f2937);font:12px Segoe UI,sans-serif}.text-format-row input[type=number]{width:55px}.text-format-row input[aria-label="Line thickness"]{width:90px}.text-format-row input[type=color]{width:32px;padding:2px}.text-format-row label.format-fill-color{position:relative}.text-format-row .format-no-color-indicator{position:absolute;left:10px;top:8px;width:12px;height:12px;pointer-events:none}.text-format-row .format-no-color-indicator[hidden]{display:none}.text-format-row .format-no-color-indicator svg{display:block;width:100%;height:100%}.text-format-row .format-font{width:160px}.text-format-row select[aria-label="Barcode fill area"]{width:112px}.text-format-row button{height:30px;min-width:28px;padding:4px;border:1px solid transparent;background:transparent;color:var(--text,#1f2937);border-radius:3px;cursor:pointer}.text-format-row button svg{width:20px;height:20px;display:block}.text-format-row button[aria-pressed=true]{background:#dcfce7;border-color:#86efac}.text-format-row button:disabled,.text-format-row input:disabled,.text-format-row select:disabled{opacity:.4;cursor:default}';
  for(const [name,file] of [['Arial','arial.ttf'],['Arial Unicode MS','ARIALUNI.TTF'],['Cambria','cambria.ttc'],['Cambria Math','CambriaMath.ttf'],['Segoe UI Symbol','seguisym.ttf'],['Segoe UI Historic','seguihis.ttf'],['Segoe UI Emoji','seguiemj.ttf'],['Symbol','symbol.ttf'],['Wingdings','wingding.ttf'],['Wingdings 2','WINGDNG2.TTF'],['Wingdings 3','WINGDNG3.TTF'],['Webdings','webdings.ttf']])style.textContent+=`@font-face{font-family:"${name}";src:url("assets/WordSymbols/fonts/${file}")}`;
  style.textContent+='.text-format-row button.format-no-fill{font:400 11px "Segoe UI",sans-serif;white-space:nowrap}';
  document.head.append(style);
})();
