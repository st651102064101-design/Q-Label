(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const keys=['elements','width_mm','height_mm','page','margin_mm','background','print_background','print_border','label_shape','corner_radius_mm'];
  function capture(t){const result={};for(const key of keys)if(t[key]!==undefined)result[key]=clone(t[key]);return result;}
  function switchDesign(t,target){
    const active=t.design_active||'front';if(active===target)return;
    t.designs=t.designs||{};t.designs[active]=capture(t);
    const front=t.designs.front||capture(t),paper=front.page?.enabled?front.page:null;
    if(!t.designs[target])t.designs[target]=target==='page'?{elements:[],width_mm:paper?.width_mm||front.width_mm,height_mm:paper?.height_mm||front.height_mm,page:{enabled:false},margin_mm:{left:0,top:0,right:0,bottom:0},print_background:false,print_border:false,label_shape:'rectangle'}:{...clone(front),elements:[],print_background:false};
    for(const key of keys)delete t[key];Object.assign(t,clone(t.designs[target]));t.design_active=target;
    if(target!=='page')t.design_side=target;
  }
  function forPrint(source){
    const t=clone(source),active=t.design_active||'front',side=active==='page'?(t.design_side||'front'):active;
    const item=active==='page'?t.designs?.[side]:capture(t);
    if(item)for(const key of keys){delete t[key];if(item[key]!==undefined)t[key]=clone(item[key]);}
    if(side==='back'&&t.back_rotate_180)t.print_orientation=t.print_orientation==='inverted'?'normal':'inverted';
    const pageDesign=active==='page'?capture(source):t.designs?.page;
    if(t.page_template_enabled&&pageDesign){
      const p=t.page?.enabled?t.page:null,w=p?.width_mm||t.width_mm,h=p?.height_mm||t.height_mm;
      const items=[];for(let r=0;r<(p?.rows||1);r++)for(let c=0;c<(p?.columns||1);c++){
        const ox=(p?.left_mm||0)+c*(t.width_mm+(p?.gap_x_mm||0))+(t.margin_mm?.left||0),oy=(p?.top_mm||0)+r*(t.height_mm+(p?.gap_y_mm||0))+(t.margin_mm?.top||0);
        if(t.print_background&&t.background)items.push({...t.background,type:'image',x_mm:ox,y_mm:oy,width_mm:t.width_mm,height_mm:t.height_mm});
        for(const e of t.elements||[])items.push({...e,x_mm:(Number(e.x_mm)||0)+ox,y_mm:(Number(e.y_mm)||0)+oy});
        if(t.print_border){const circle=t.label_shape==='circle',diameter=Math.min(Number(t.width_mm)||0,Number(t.height_mm)||0);items.push({type:t.label_shape==='ellipse'||circle?'ellipse':'box',x_mm:ox+(circle?((Number(t.width_mm)||0)-diameter)/2:0),y_mm:oy+(circle?((Number(t.height_mm)||0)-diameter)/2:0),width_mm:circle?diameter:t.width_mm,height_mm:circle?diameter:t.height_mm,thickness_mm:t.border_width_mm||.3});}
      }
      const pageBackground=pageDesign.print_background&&pageDesign.background?[{...pageDesign.background,type:'image',x_mm:0,y_mm:0,width_mm:w,height_mm:h}]:[];
      t.elements=[...pageBackground,...(pageDesign.elements||[]),...items];t.width_mm=w;t.height_mm=h;t.page={enabled:false};t.margin_mm={left:0,top:0};t.print_border=false;t.print_background=false;
    }
    return t;
  }
  function rotateTemplateLayout(template,clockwise){
    const oldWidth=Number(template.width_mm)||0,oldHeight=Number(template.height_mm)||0;
    for(const element of template.elements||[]){
      const x=Number(element.x_mm)||0,y=Number(element.y_mm)||0,w=Number(element.width_mm)||0,h=Number(element.height_mm)||0;
      if(element.type==='line'){
        element.x_mm=clockwise?oldHeight-y:y;
        element.y_mm=clockwise?x:oldWidth-x;
        element.width_mm=clockwise?-h:h;
        element.height_mm=(clockwise?w:-w)||0;
        continue;
      }
      const angleBefore=(Number(element.rotation_deg)||0)*Math.PI/180;
      const visualWidth=Math.abs(w*Math.cos(angleBefore))+Math.abs(h*Math.sin(angleBefore));
      const visualHeight=Math.abs(w*Math.sin(angleBefore))+Math.abs(h*Math.cos(angleBefore));
      const visualX=x+(w-visualWidth)/2,visualY=y+(h-visualHeight)/2;
      const nextX=clockwise?oldHeight-visualY-visualHeight:visualY;
      const nextY=clockwise?visualX:oldWidth-visualX-visualWidth;
      const nextWidth=visualHeight,nextHeight=visualWidth;
      element.x_mm=nextX+(nextWidth-w)/2;
      element.y_mm=nextY+(nextHeight-h)/2;
      const angle=((Number(element.rotation_deg)||0)+(clockwise?90:-90))%360;
      element.rotation_deg=(angle+360)%360;
    }
    [template.width_mm,template.height_mm]=[oldHeight,oldWidth];
    return template;
  }
  const api={switchDesign,forPrint,rotateTemplateLayout};if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.PageDesignOptions=api;if(!root.document)return;
  const doc=root.document,$=id=>doc.getElementById(id),section=$('setupPage');
  const effects=doc.createElement('div');effects.className='page-effects-example';
  const effectControls=doc.createElement('div');effectControls.className='page-effects-controls';
  const mirrorControl=$('setupMirror').closest('label'),negativeControl=$('setupNegative').closest('label');
  mirrorControl.before(effects);effectControls.append(mirrorControl,negativeControl);
  const effectImage=doc.createElement('img');effectImage.id='setupEffectsImage';effectImage.width=156;effectImage.height=156;
  effects.append(effectControls,effectImage);
  const effectStyle=doc.createElement('style');effectStyle.textContent=':focus-visible{outline-color:var(--accent,#16a34a)!important;border-color:var(--accent,#16a34a)!important}button:focus:not([role=tab]){outline:2px solid var(--accent,#16a34a)!important;outline-offset:1px;border-color:var(--accent,#16a34a)!important}#pageSetupDialog .orientation-trigger:focus{outline:2px solid var(--accent,#16a34a)!important;outline-offset:1px;border-color:var(--accent,#16a34a)!important}#pageSetupDialog .checkbox input[type=checkbox]{accent-color:#16a34a;cursor:pointer;flex:0 0 15px;width:15px;height:15px}#pageSetupDialog .page-effects-example{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin:0;max-width:none}#pageSetupDialog .page-effects-controls{flex:1;min-width:0;display:grid;gap:4px}#pageSetupDialog #setupEffectsImage{display:block;width:92px;height:92px;object-fit:contain;flex:0 0 auto;background:transparent}@media(max-width:550px){#pageSetupDialog #setupEffectsImage{width:72px;height:72px}}';doc.head.append(effectStyle);
  const syncEffectsImage=()=>{const mirror=!!editing?.mirror,negative=!!editing?.negative,state=mirror?(negative?'mirror-negative':'mirror'):(negative?'negative':'normal');effectImage.dataset.effect=state;effectImage.src='assets/page-effects/'+state+'.png';effectImage.alt='Printer example: '+(mirror?'Mirror image':'Normal image')+(negative?', Negative':'');};
  $('setupMirror').addEventListener('change',syncEffectsImage);$('setupNegative').addEventListener('change',syncEffectsImage);
  $('pageSetupOpen').addEventListener('click',syncEffectsImage);doc.addEventListener('preview-updated',syncEffectsImage);syncEffectsImage();
  section.insertAdjacentHTML('afterbegin','<h3>Page size</h3><label for="setupPaperSize">Paper size</label><select id="setupPaperSize"><option value="custom">User Defined Size</option><option value="50.8,101.6">2 x 4</option><option value="101.6,101.6">4 x 4</option><option value="101.6,152.4">4 x 6</option></select>');
  const orientation=$('setupOrientation');orientation.innerHTML='<option value="normal">Portrait</option><option value="landscape">Landscape</option><option value="inverted">Portrait 180°</option><option value="landscape-inverted">Landscape 180°</option>';
  const orientationIcons={normal:'<rect x="7" y="3" width="10" height="18" rx="1"/><path d="M9 7h6M9 10h6"/>',landscape:'<rect x="3" y="7" width="18" height="10" rx="1"/><path d="M7 10h6M7 13h6"/>',inverted:'<rect x="7" y="3" width="10" height="18" rx="1"/><g transform="rotate(180 12 12)"><path d="M9 7h6M9 10h6"/></g><path d="M17 8a6 6 0 0 0-10-2M7 6V3m0 3h3"/>','landscape-inverted':'<rect x="3" y="7" width="18" height="10" rx="1"/><g transform="rotate(180 12 12)"><path d="M7 10h6M7 13h6"/></g><path d="M17 8a6 6 0 0 0-10-2M7 6V3m0 3h3"/>'};
  orientation.insertAdjacentHTML('afterend','<div class="orientation-picker"><button type="button" class="orientation-trigger" aria-haspopup="listbox" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"></svg><span></span><span class="orientation-chevron" aria-hidden="true">▾</span></button><div class="orientation-options" role="listbox" hidden></div></div>');
  const orientationPicker=orientation.nextElementSibling,orientationTrigger=orientationPicker.querySelector('.orientation-trigger'),orientationList=orientationPicker.querySelector('.orientation-options');
  orientationPicker.insertAdjacentHTML('beforeend','<style>.orientation-picker{position:relative;width:min(100%,580px);margin:5px 0}.orientation-picker .orientation-trigger{box-sizing:border-box;display:flex;align-items:center;gap:9px;width:100%;height:40px;padding:6px 10px;border:1px solid var(--border,#cbd5e1);border-radius:8px;background:var(--card,#fff);color:var(--text,#1f2937);font:13px Segoe UI,sans-serif;text-align:left;cursor:pointer}.orientation-trigger>svg,.orientation-option>svg{width:23px;height:23px;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.orientation-trigger>span:nth-of-type(1){flex:1}.orientation-chevron{color:var(--muted,#64748b)}.orientation-options{position:absolute;z-index:40;top:calc(100% + 2px);left:0;right:0;padding:4px;border:1px solid var(--border,#cbd5e1);border-radius:8px;background:var(--card,#fff);box-shadow:0 8px 20px #0f172a26}.orientation-options[hidden]{display:none}.orientation-option{display:flex;align-items:center;gap:9px;width:100%;padding:6px 9px;border:0;border-radius:5px;background:transparent;color:var(--text,#1f2937);font:13px Segoe UI,sans-serif;text-align:left;cursor:pointer}.orientation-option:hover,.orientation-option[aria-selected=true]{background:#e8f3ec;color:#08783b}</style>');
  const orientationLabels={normal:'Portrait',landscape:'Landscape',inverted:'Portrait 180°','landscape-inverted':'Landscape 180°'};
  for(const option of orientation.options){const item=document.createElement('button');item.type='button';item.className='orientation-option';item.role='option';item.dataset.value=option.value;item.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${orientationIcons[option.value]}</svg><span>${orientationLabels[option.value]}</span>`;item.onclick=()=>{orientation.value=option.value;orientation.dispatchEvent(new Event('change',{bubbles:true}));orientationList.hidden=true;orientationTrigger.setAttribute('aria-expanded','false');orientationTrigger.focus();};orientationList.append(item);}
  const syncOrientationPicker=()=>{const value=orientation.value||'normal';orientationTrigger.querySelector('svg').innerHTML=orientationIcons[value]||orientationIcons.normal;orientationTrigger.querySelector('span').textContent=orientationLabels[value]||value;orientationList.querySelectorAll('.orientation-option').forEach(option=>option.setAttribute('aria-selected',String(option.dataset.value===value)));};
  orientation.hidden=true;orientation.setAttribute('aria-hidden','true');orientationTrigger.onclick=()=>{orientationList.hidden=!orientationList.hidden;orientationTrigger.setAttribute('aria-expanded',String(!orientationList.hidden));};
  orientationTrigger.onkeydown=event=>{if(event.key==='ArrowDown'||event.key==='Enter'||event.key===' '){event.preventDefault();orientationList.hidden=false;orientationTrigger.setAttribute('aria-expanded','true');orientationList.querySelector(`[data-value="${orientation.value}"]`)?.focus();}};
  orientationList.addEventListener('keydown',event=>{const options=[...orientationList.querySelectorAll('.orientation-option')],i=options.indexOf(doc.activeElement);if(event.key==='Escape'){event.preventDefault();orientationList.hidden=true;orientationTrigger.setAttribute('aria-expanded','false');orientationTrigger.focus();}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();options[(i+(event.key==='ArrowDown'?1:-1)+options.length)%options.length].focus();}});
  doc.addEventListener('pointerdown',event=>{if(!orientationPicker.contains(event.target)){orientationList.hidden=true;orientationTrigger.setAttribute('aria-expanded','false');}});
  orientation.addEventListener('change',syncOrientationPicker);syncOrientationPicker();
  const orientHeading=[...section.querySelectorAll('h3')].find(h=>h.textContent.trim()==='Orientation and effects');
  const orientRow=orientHeading?.nextElementSibling?.classList?.contains('row')?orientHeading.nextElementSibling:null;
  if(orientHeading&&orientRow&&!section.querySelector('.setup-page-orient-grid')){
    const grid=doc.createElement('div');grid.className='setup-page-orient-grid';
    orientRow.after(grid);grid.append(orientRow,effects);
  }
  orientation.addEventListener('change',event=>{
    event.stopImmediatePropagation();if(!editing)return;readEditorIntoDraft();pushSnapshot();const selected=orientation.value,landscape=selected.startsWith('landscape'),p=editing.page;
    const w=editing.width_mm,h=editing.height_mm;
    if((landscape&&w<h)||(!landscape&&w>h)){
      PageDesignOptions.rotateTemplateLayout(editing,!landscape);
      const page=editing.page;if(page?.enabled){[page.width_mm,page.height_mm]=[page.height_mm,page.width_mm];[page.rows,page.columns]=[page.columns,page.rows];[page.left_mm,page.top_mm]=[page.top_mm,page.left_mm];[page.right_mm,page.bottom_mm]=[page.bottom_mm,page.right_mm];[page.gap_x_mm,page.gap_y_mm]=[page.gap_y_mm,page.gap_x_mm];}
    }
    editing.page_orientation=selected;editing.print_orientation=selected.includes('inverted')?'inverted':'normal';refreshEditorUI();orientation.value=selected;drawEditorCanvas();touchEditor();
  },true);
  $('setupPaperSize').onchange=()=>{const value=$('setupPaperSize').value;if(value==='custom'||!editing)return;readEditorIntoDraft();pushSnapshot();const [w,h]=value.split(',').map(Number);editing.page={...editing.page,enabled:true,width_mm:w,height_mm:h};refreshEditorUI();drawEditorCanvas();touchEditor();};
  section.insertAdjacentHTML('beforeend','<h3>Template design options</h3><label class="checkbox"><input id="setupSeparateSides" type="checkbox"> Separate designs for front and back</label><label class="checkbox"><input id="setupBackRotate" type="checkbox"> Rotate back side 180°</label><label class="checkbox"><input id="setupPageTemplate" type="checkbox"> Enable page template</label><label for="setupDesignScope">Edit design</label><select id="setupDesignScope"><option value="front">Front / item template</option><option value="back">Back / item template</option><option value="page">Page template</option></select><p class="mini">Choose a design to edit on the canvas. Front and back are printed as separate jobs. Page objects print once across the whole sheet, including its margins.</p>');
  const designScope=$('setupDesignScope');
  const refresh=()=>{if(!editing)return;$('setupSeparateSides').checked=!!editing.separate_sides;$('setupBackRotate').checked=!!editing.back_rotate_180;$('setupBackRotate').disabled=!editing.separate_sides;$('setupPageTemplate').checked=!!editing.page_template_enabled;designScope.disabled=false;for(const option of designScope.options)option.disabled=false;designScope.value=editing.design_active||'front';orientation.value=editing.page_orientation||editing.print_orientation||'normal';syncOrientationPicker();};
  function changeScope(target){readEditorIntoDraft();pushSnapshot();if(target==='back')editing.separate_sides=true;if(target==='page')editing.page_template_enabled=true;switchDesign(editing,target);editorSel=null;if(typeof editorSelection!=='undefined')editorSelection.clear();refreshEditorUI();renderEditorElements();drawEditorCanvas();touchEditor();refresh();}
  $('setupSeparateSides').onchange=()=>{readEditorIntoDraft();pushSnapshot();editing.separate_sides=$('setupSeparateSides').checked;if(!editing.separate_sides&&editing.design_active==='back')changeScope('front');refresh();drawEditorCanvas();touchEditor();};
  $('setupBackRotate').onchange=()=>{pushSnapshot();editing.back_rotate_180=$('setupBackRotate').checked;drawEditorCanvas();touchEditor();};
  $('setupPageTemplate').onchange=()=>{readEditorIntoDraft();pushSnapshot();editing.page_template_enabled=$('setupPageTemplate').checked;if(!editing.page_template_enabled&&editing.design_active==='page')changeScope(editing.design_side||'front');refresh();drawEditorCanvas();touchEditor();};
  // This select has its own design-switch transaction. Stop the generic modal
  // change handler from rereading stale Page Setup fields after the switch.
  designScope.addEventListener('change',event=>{event.stopPropagation();changeScope(designScope.value);});
  $('setupHelp').onclick=()=>root.alert('Page Setup: select a paper size or enter custom dimensions, choose one of four page orientations, and apply Mirror or Negative. Enable separate front/back designs and use Edit design to select the side. Each side is a separate print job. Rotate back side applies an additional 180° rotation when printing. Enable Page template and select it in Edit design to create page objects; they print once alongside all item labels. OK saves; Cancel restores the settings from when this window opened.');
  $('pageSetupOpen').addEventListener('click',()=>{window.reparentPageSetupControls?.();refresh();});doc.addEventListener('preview-updated',refresh);refresh();
  window.reparentPageSetupControls?.();
})(typeof window==='undefined'?globalThis:window);
