'use strict';
(() => {
  let sequence=0;
  function focusDimension(field,spec,id){
    const {axis,a,b,position,reference}=spec,horizontal=axis==='x';
    const line=(from,to,attrs='')=>horizontal?`<line x1="${from}" y1="${position}" x2="${to}" y2="${position}" ${attrs}/>`:`<line x1="${position}" y1="${from}" x2="${position}" y2="${to}" ${attrs}/>`;
    const extension=value=>horizontal?`<line data-dimension-extension="true" x1="${value}" y1="${position-3}" x2="${value}" y2="${reference}" stroke-dasharray="2 2"/>`:`<line data-dimension-extension="true" x1="${position-3}" y1="${value}" x2="${reference}" y2="${value}" stroke-dasharray="2 2"/>`;
    const short=b-a<12,marker=`url(#${id}measureArrow)`,arrows=short?line(a-10,a,`data-external-arrow="true" marker-end="${marker}"`)+line(b+10,b,`data-external-arrow="true" marker-end="${marker}"`):'';
    const gap=field==='pageGapX'?' data-layout-gap-dimension="horizontal"':field==='pageGapY'?' data-layout-gap-dimension="vertical"':'';
    return `<g data-layout-dimension="${field}"${gap} pointer-events="none" fill="none" stroke="#111" stroke-width=".8">${extension(a)}${extension(b)}${line(a,b,`data-measure-span="true"${short?'':` marker-start="${marker}" marker-end="${marker}"`}`)}${arrows}</g>`;
  }
  function designArtwork(source,x,y,width,height,rotate180=false){
    if(!source||!window.LabelPreview||!(Number(source.width_mm)>0&&Number(source.height_mm)>0))return '';
    let markup='';try{let values=source.values||{};values=window.DataSourceEngine?.resolve(source,values)||values;markup=window.LabelPreview.renderPreviewSVG(source,values,null,null,{});}catch(_){return '';}
    const start=markup.indexOf('>'),end=markup.lastIndexOf('</svg>');if(start<0||end<=start)return '';
    const inner=markup.slice(start+1,end),sw=Number(source.width_mm),sh=Number(source.height_mm),content=rotate180?`<g transform="rotate(180 ${sw/2} ${sh/2})">${inner}</g>`:inner;
    // The page cell and the item template can have different aspect ratios
    // when margins or multiple columns are configured. Never stretch the
    // artwork non-uniformly: it makes barcodes and text look clipped or
    // distorted in Page Setup even though the saved template is unchanged.
    return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${sw} ${sh}" preserveAspectRatio="xMidYMid meet" overflow="hidden" aria-hidden="true">${content}</svg>`;
  }
  function render(target,template,unit='mm',artwork=false,workspace=false,section='Layout'){
    if(!template)return;
    const inPageSetup=!workspace&&!!target.closest?.('#pageSetupDialog');
    const setupRollMedia=inPageSetup&&!['Sheet','Card','Page'].includes(String(template.stock?.printer_type||'Roll'));
    const catalogStock=section==='Stock'&&!workspace&&window.StockApply?.catalogStockFromTemplate?.(template);
    if(catalogStock&&window.StockPreview&&!(inPageSetup&&(setupRollMedia||template.stock?.rfid_antenna?.enabled||['front','back'].includes(template.stock?.magnetic_stripe?.display)))){
      // StockPreview keeps nodes it does not own; Page Setup must show exactly one preview, so start from an empty pane.
      const inSetup=!!target.closest?.('#pageSetupDialog');
      if(inSetup)target.replaceChildren();
      window.StockPreview.render(target,catalogStock,unit);
      if(inSetup){
        // Fill the pane edge to edge (no letterbox strips) and name the sheet size like the native dialog.
        target.querySelector('svg')?.setAttribute('preserveAspectRatio','xMidYMid slice');
        const divisor=unit==='in'?25.4:1,size=value=>Number((value/divisor).toFixed(3)).toString(),caption=target.querySelector('small');
        if(caption&&(Math.abs(catalogStock.paper_width_mm-catalogStock.width_mm)>.01||Math.abs(catalogStock.paper_height_mm-catalogStock.height_mm)>.01))caption.innerHTML='Page Size: '+size(catalogStock.paper_width_mm)+' × '+size(catalogStock.paper_height_mm)+' '+unit+'<br>'+caption.innerHTML;
      }
      return;
    }
    const showArtwork=!!artwork||workspace;
    const scope=template.design_active||'front';
    const frontDesign=scope==='front'?template:(template.designs?.front||template);
    const backDesign=scope==='back'?template:(template.designs?.back||frontDesign);
    const itemDesign={...(scope==='back'?backDesign:frontDesign),label_shape:template.label_shape,corner_radius_mm:template.corner_radius_mm,print_border:template.print_border,border_width_mm:template.border_width_mm};
    let page=frontDesign.page?.enabled?{...frontDesign.page}:(template.page?.enabled?{...template.page}:null);
    if(page&&!page.enabled&&scope!=='page')page=null;
    const rows=Math.max(1,Number(page?.rows)||1),columns=Math.max(1,Number(page?.columns)||1),itemW=page?.enabled&&!page.manual_template?(Number(page.width_mm)-Number(page.left_mm||0)-Number(page.right_mm||0)-(columns-1)*Number(page.gap_x_mm||0))/columns:(Number(frontDesign.width_mm)||Number(template.width_mm)),itemH=page?.enabled&&!page.manual_template?(Number(page.height_mm)-Number(page.top_mm||0)-Number(page.bottom_mm||0)-(rows-1)*Number(page.gap_y_mm||0))/rows:(Number(frontDesign.height_mm)||Number(template.height_mm));
    const w=Number(page?.width_mm||(scope==='page'?template.width_mm:itemW)),h=Number(page?.height_mm||(scope==='page'?template.height_mm:itemH));
    if(!(w>0&&h>0)){target.textContent='Enter valid paper dimensions.';return;}
    const linerLeft=Math.max(0,Number(template.stock?.liner_left_mm)||0),linerRight=Math.max(0,Number(template.stock?.liner_right_mm)||0);
    const left=Number(page?.left_mm)||0,right=Number(page?.right_mm)||0,top=Number(page?.top_mm)||0,bottomMargin=Number(page?.bottom_mm)||0;
    const singleRoll=rows===1&&columns===1;
    const rollContinuation=inPageSetup?setupRollMedia:singleRoll;
    const rollChromePx=rollContinuation?42:0,viewMargin=28;
    const maxLabelH=340-rollChromePx-viewMargin;
    const continuationGap=0;
    const scale=Math.min(198/(w+linerLeft+linerRight),maxLabelH/(h+2*continuationGap)),x=(250-(w+linerLeft+linerRight)*scale)/2+linerLeft*scale,y=(340-h*scale)/2,id='mp'+(++sequence);
    const layoutCellW=page?.enabled&&section==='Layout'?(Number(page.width_mm)-Number(page.left_mm||0)-Number(page.right_mm||0)-(columns-1)*Number(page.gap_x_mm||0))/columns:itemW;
    const layoutCellH=page?.enabled&&section==='Layout'?(Number(page.height_mm)-Number(page.top_mm||0)-Number(page.bottom_mm||0)-(rows-1)*Number(page.gap_y_mm||0))/rows:itemH;
    let labels='';const cols=columns,shape=itemDesign.label_shape||'rectangle';
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const cellW=section==='Layout'?layoutCellW:itemW,cellH=section==='Layout'?layoutCellH:itemH;
      const lx=x+((page?.left_mm||0)+c*(cellW+(page?.gap_x_mm||0)))*scale,ly=y+((page?.top_mm||0)+r*(cellH+(page?.gap_y_mm||0)))*scale;
      const lw=cellW*scale,lh=cellH*scale,radius=Math.min(cellW/2,cellH/2,Math.max(0,Number(itemDesign.corner_radius_mm??2)))*scale,cellShape=shape==='ellipse'?`<ellipse data-preview-cell="true" data-label-shape="ellipse" cx="${lx+lw/2}" cy="${ly+lh/2}" rx="${lw/2}" ry="${lh/2}" fill="white" stroke="#222" stroke-width=".8"/>`:shape==='circle'?`<circle data-preview-cell="true" data-label-shape="circle" cx="${lx+lw/2}" cy="${ly+lh/2}" r="${Math.min(lw,lh)/2}" fill="white" stroke="#222" stroke-width=".8"/>`:`<rect data-preview-cell="true" data-label-shape="${shape}" x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="${shape==='rounded'?radius:0}" fill="white" stroke="#222" stroke-width=".8"/>`;labels+=`<g data-layout-cell="${r},${c}">${cellShape}</g>`;
    }
    const edge=x+w*scale,bottom=y+h*scale;
    let marks=section==='Printed Item Shape'?'':`M${x-5} ${y-20}V${bottom+20}M${edge+5} ${y-20}V${bottom+20}M${x} ${y-7}H${edge}M${x} ${bottom+7}H${edge}`;
    if(section!=='Printed Item Shape')for(let c=0;c<=cols;c++){const cellW=section==='Layout'?layoutCellW:itemW,t=x+((page?.left_mm||0)+c*(cellW+(page?.gap_x_mm||0))-(c===cols?(page?.gap_x_mm||0):0))*scale;marks+=`M${t} ${y-20}V${y-5}M${t} ${bottom+5}V${bottom+20}`;}
    const fmt=v=>{const value=mmToUnit(v,unit,template.dpi);return unit==='in'?Number(value.toFixed(3)).toString():value.toFixed(2);};
    const labelLeft=x+left*scale,labelRight=x+(w-right)*scale,labelTop=y+top*scale,labelBottom=y+(h-bottomMargin)*scale;
    let dimensions='';
    if(!workspace&&section==='Layout'){
      const gapX=Number(page?.gap_x_mm)||0,gapY=Number(page?.gap_y_mm)||0;
      const focused=document.activeElement?.id;
      const horizontal=(a,b)=>({axis:'x',a,b,position:Math.max(8,y-22),reference:labelTop}),vertical=(a,b)=>({axis:'y',a,b,position:x-12,reference:labelLeft});
      const specs={pageTop:vertical(y,labelTop),pageBottom:vertical(labelBottom,bottom),pageLeft:horizontal(x,labelLeft),pageRight:horizontal(labelRight,edge),edW:horizontal(labelLeft,labelLeft+itemW*scale),edH:vertical(labelTop,labelTop+itemH*scale),pageGapX:horizontal(labelLeft+layoutCellW*scale,labelLeft+(layoutCellW+gapX)*scale),pageGapY:vertical(labelTop+layoutCellH*scale,labelTop+(layoutCellH+gapY)*scale)};
      const spec=specs[focused];
      if(spec&&!document.activeElement.disabled&&!document.activeElement.readOnly&&(focused!=='pageGapX'||columns>1)&&(focused!=='pageGapY'||rows>1))dimensions=focusDimension(focused,spec,id);
    }
    const pageSetupSingle=inPageSetup;
    const workspaceColor=localStorage.getItem('previewWorkspaceColor')||getComputedStyle(document.querySelector('.preview-pane')||document.body).getPropertyValue('--preview-workspace').trim()||'#4b5563';
    const gridPitch=Math.max(2,Number(document.getElementById('gridStep')?.value||.5)*scale),gridDef=workspace&&document.getElementById('chkGrid')?.checked?`<pattern id="${id}grid" width="${gridPitch}" height="${gridPitch}" patternUnits="userSpaceOnUse"><circle cx="${gridPitch/2}" cy="${gridPitch/2}" r=".35" fill="#64748b" opacity=".65"/></pattern>`:'';target.innerHTML=`<svg viewBox="0 0 250 340" role="img" aria-label="Paper and label layout preview"><defs>${gridDef}<marker id="${id}arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M 8 1 L 1 4 L 8 7" fill="none" stroke="#252a30" stroke-width="1.5"/></marker><marker id="${id}gapArrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M 8 1 L 1 4 L 8 7" fill="none" stroke="#07883f" stroke-width="1.5"/></marker><filter id="${id}s"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity=".3"/></filter><clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w*scale}" height="${h*scale}"/></clipPath></defs><rect width="250" height="340" fill="${workspaceColor}"/><rect x="${x}" y="${y}" width="${w*scale}" height="${h*scale}" fill="white" stroke="#111" stroke-width="1" shape-rendering="crispEdges"/><g clip-path="url(#${id}c)">${labels}</g><path d="${marks}" fill="none" stroke="#7b8490" stroke-width=".8" shape-rendering="crispEdges"/><g class="margin-dimensions">${dimensions}</g></svg><small>Template Size: ${fmt(itemW)} × ${fmt(itemH)} ${unit}</small>`;
    // Continuous backing fades locally beside the label, rather than at the viewport edges.
    const paperSvg=target.querySelector('svg');
    if(dimensions)paperSvg.querySelector('defs').insertAdjacentHTML('beforeend',`<marker id="${id}measureArrow" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0L6 3L0 6Z" fill="#111"/></marker>`);
    paperSvg.dataset.previewSection=section;
    if(paperSvg)paperSvg.style.background=pageSetupSingle?'linear-gradient(180deg,#c4d5ec,#8aa2c4)':workspaceColor;
    if(paperSvg&&pageSetupSingle)paperSvg.querySelector(':scope > rect')?.setAttribute('fill','none');
    const labelShape=itemDesign.label_shape||'rectangle';
    const rollCellW=section==='Layout'?layoutCellW:itemW,rollCellH=section==='Layout'?layoutCellH:itemH;
    const rollX=x+left*scale,rollY=y+top*scale,rollW=(setupRollMedia?columns*rollCellW+(columns-1)*Number(page?.gap_x_mm||0):itemW)*scale,rollH=(setupRollMedia?rows*rollCellH+(rows-1)*Number(page?.gap_y_mm||0):itemH)*scale,rollEdge=rollX+rollW,rollBottom=rollY+rollH;
    const itemCorner=Math.min(itemW/2,itemH/2,Math.max(0,Number(template.corner_radius_mm??2)))*scale;
    let paperRx=0;
    if(singleRoll){
      if(labelShape==='rounded')paperRx=itemCorner;
      else if(labelShape==='circle')paperRx=Math.min(rollW,rollH)/2;
    }
    const base=paperSvg.querySelector(':scope > rect:nth-of-type(2)');
    if(paperRx>0){
      paperSvg.querySelector('clipPath rect')?.setAttribute('rx',paperRx);
      base?.setAttribute('rx',paperRx);
      base?.setAttribute('stroke','none');
    }

    if(rollContinuation){
      const bartenderSoft=section==='Printed Item Shape',setupRoll=setupRollMedia;
      const capRx=paperRx>0?paperRx:Math.min(8,rollW*.06);
      paperSvg.querySelector('defs').insertAdjacentHTML('beforeend',`<linearGradient id="${id}upper" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient id="${id}lower" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient><filter id="${id}labelLift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="2.8" flood-color="#ffffff" flood-opacity=".95"/></filter>`);
      let continuationInner='';
      if(setupRoll){
        // BarTender Page Setup roll: open-ended neighbouring labels that fade into the backing, and liner edges that fade at both ends.
        // Outer fragments need visual clearance even when the actual internal row gap is zero.
        const capH=Math.max(8,Math.min(14,rollCellH*scale*.12)),gap=3,topEnd=rollY-gap,topStart=topEnd-capH,bottomStart=rollBottom+gap,bottomEnd=bottomStart+capH;
        if(base){base.setAttribute('y',topStart);base.setAttribute('height',bottomEnd-topStart);}
        const sideL=x-linerLeft*scale,sideR=x+(w+linerRight)*scale,linerTop=topStart-5,linerBottom=bottomEnd+5;
        paperSvg.querySelector('defs').insertAdjacentHTML('beforeend',`<linearGradient id="${id}capFadeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="${id}capLineTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1a1a" stop-opacity="0"/><stop offset="1" stop-color="#1a1a1a"/></linearGradient><linearGradient id="${id}capFadeBottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="${id}capLineBottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1a1a"/><stop offset="1" stop-color="#1a1a1a" stop-opacity="0"/></linearGradient><linearGradient id="${id}linerFade" gradientUnits="userSpaceOnUse" x1="0" y1="${linerTop}" x2="0" y2="${linerBottom}"><stop offset="0" stop-color="#3a3a3a" stop-opacity="0"/><stop offset=".12" stop-color="#3a3a3a"/><stop offset=".88" stop-color="#3a3a3a"/><stop offset="1" stop-color="#3a3a3a" stop-opacity="0"/></linearGradient>`);
        continuationInner=`<line data-paper-liner="left" x1="${sideL}" y1="${linerTop}" x2="${sideL}" y2="${linerBottom}" stroke="url(#${id}linerFade)" stroke-width=".9"/><line data-paper-liner="right" x1="${sideR}" y1="${linerTop}" x2="${sideR}" y2="${linerBottom}" stroke="url(#${id}linerFade)" stroke-width=".9"/>`;
        for(const [name,y1,y2]of [['capFadeTop',topStart,topEnd],['capLineTop',topStart,topEnd],['capFadeBottom',bottomStart,bottomEnd],['capLineBottom',bottomStart,bottomEnd]]){
          const gradient=paperSvg.querySelector('#'+id+name);gradient.setAttribute('gradientUnits','userSpaceOnUse');gradient.setAttribute('y1',y1);gradient.setAttribute('y2',y2);
        }
        paperSvg.querySelector('defs').insertAdjacentHTML('beforeend',`<clipPath id="${id}capTop"><rect x="${sideL-1}" y="${topStart}" width="${sideR-sideL+2}" height="${capH+.5}"/></clipPath><clipPath id="${id}capBottom"><rect x="${sideL-1}" y="${bottomStart-.5}" width="${sideR-sideL+2}" height="${capH+.5}"/></clipPath>`);
        const faceW=rollCellW*scale,faceH=rollCellH*scale;
        const cornerRadius=labelShape==='rounded'?Math.min(faceW/2,faceH/2,Math.max(0,Number(template.corner_radius_mm??2))*scale):0;
        if(cornerRadius>0){
          // Keep both upper arcs visible; fade only after the rounded corners.
          const gradient=paperSvg.querySelector('#'+id+'capLineBottom'),stop=document.createElementNS('http://www.w3.org/2000/svg','stop');
          stop.setAttribute('offset',Math.min(1,cornerRadius/capH));stop.setAttribute('stop-color','#1a1a1a');
          gradient.insertBefore(stop,gradient.lastElementChild);
        }
        for(let c=0;c<columns;c++){
          const start=rollX+c*(rollCellW+Number(page?.gap_x_mm||0))*scale;
          const r=cornerRadius;
          const face=(sy,attrs)=>labelShape==='ellipse'?`<ellipse ${attrs} cx="${start+faceW/2}" cy="${sy+faceH/2}" rx="${faceW/2}" ry="${faceH/2}"/>`:labelShape==='circle'?`<circle ${attrs} cx="${start+faceW/2}" cy="${sy+faceH/2}" r="${Math.min(faceW,faceH)/2}"/>`:`<rect ${attrs} x="${start}" y="${sy}" width="${faceW}" height="${faceH}" rx="${r}"/>`;
          continuationInner+=`<g clip-path="url(#${id}capTop)">${face(topEnd-faceH,`data-paper-sliver="top" data-column="${c}" data-seam-y="${topEnd}" fill="url(#${id}capFadeTop)" stroke="url(#${id}capLineTop)" stroke-width=".8"`)}</g><g clip-path="url(#${id}capBottom)">${face(bottomStart,`data-paper-sliver="bottom" data-column="${c}" data-seam-y="${bottomStart}" fill="url(#${id}capFadeBottom)" stroke="#1a1a1a" stroke-width=".8"`)}</g>`;
        }
      }else if(bartenderSoft){
        const sliverH=Math.max(12,Math.min(20,rollH*.09)),gap=Math.max(5,Math.min(9,rollH*.03)),topY=rollY-gap-sliverH,bottomY=rollBottom+gap,stackTop=topY,stackBottom=bottomY+sliverH,linerW=Math.max(2,Math.min(4,rollW*.018));
        const fades=`<rect x="${rollX}" y="${topY+sliverH*.35}" width="${rollW}" height="${gap+sliverH*.55}" rx="${capRx}" fill="url(#${id}upper)" pointer-events="none"/><rect x="${rollX}" y="${rollBottom-gap-sliverH*.55}" width="${rollW}" height="${gap+sliverH*.55}" rx="${capRx}" fill="url(#${id}lower)" pointer-events="none"/>`;
        const slivers=`<rect data-paper-sliver="top" x="${rollX}" y="${topY}" width="${rollW}" height="${sliverH}" rx="${capRx}" fill="white" stroke="#1a1a1a" stroke-width=".85"/><rect data-paper-sliver="bottom" x="${rollX}" y="${bottomY}" width="${rollW}" height="${sliverH}" rx="${capRx}" fill="white" stroke="#1a1a1a" stroke-width=".85"/>`;
        const sides=`<rect data-paper-liner="left" x="${rollX-linerW}" y="${stackTop}" width="${linerW}" height="${stackBottom-stackTop}" fill="white" stroke="#1a1a1a" stroke-width=".55"/><rect data-paper-liner="right" x="${rollEdge}" y="${stackTop}" width="${linerW}" height="${stackBottom-stackTop}" fill="white" stroke="#1a1a1a" stroke-width=".55"/>`;
        continuationInner=`${sides}${slivers}${fades}`;
      }else{
        const rollGap=Math.max(3,Math.min(7,rollH*.035)),backingHeight=Math.max(8,Math.min(14,rollH*.07)),stackTop=rollY-rollGap-backingHeight,stackBottom=rollBottom+rollGap+backingHeight,stackHeight=stackBottom-stackTop,rollerRx=Math.min(capRx,backingHeight/2+2);
        paperSvg.querySelector('defs').insertAdjacentHTML('beforeend',`<linearGradient id="${id}roller" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8bec6"/><stop offset=".32" stop-color="#eef1f4"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#8d97a3"/></linearGradient>`);
        const rollers=`<rect data-paper-roller="top" x="${rollX}" y="${stackTop}" width="${rollW}" height="${backingHeight}" rx="${rollerRx}" fill="url(#${id}roller)" stroke="#5f6a74" stroke-width=".65"/><rect data-paper-roller="bottom" x="${rollX}" y="${rollBottom+rollGap}" width="${rollW}" height="${backingHeight}" rx="${rollerRx}" fill="url(#${id}roller)" stroke="#5f6a74" stroke-width=".65"/>`;
        const fades=`<rect x="${rollX}" y="${stackTop+backingHeight*.2}" width="${rollW}" height="${rollGap+backingHeight*.75}" rx="${capRx}" fill="url(#${id}upper)" pointer-events="none"/><rect x="${rollX}" y="${rollBottom-rollGap-backingHeight*.75}" width="${rollW}" height="${rollGap+backingHeight*.75}" rx="${capRx}" fill="url(#${id}lower)" pointer-events="none"/>`;
        const continuationOutline=paperRx>0?`<rect data-paper-stack-outline="true" x="${rollX}" y="${stackTop}" width="${rollW}" height="${stackHeight}" fill="none" stroke="#111" stroke-width=".95" rx="${paperRx}"/>`:`<path data-paper-stack-outline="true" d="M${rollX} ${stackTop}V${rollY-rollGap}H${rollEdge}V${stackTop}M${rollX} ${stackBottom}V${rollBottom+rollGap}H${rollEdge}V${stackBottom}" fill="none" stroke="#111" stroke-width=".95"/>`;
        continuationInner=`${rollers}${fades}${continuationOutline}`;
      }
      (base||paperSvg.querySelector(':scope > rect')).insertAdjacentHTML('afterend',`<g data-paper-continuation="true" data-paper-style="${setupRoll?'bartender-roll':bartenderSoft?'bartender':'mechanical'}" shape-rendering="geometricPrecision" filter="url(#${id}labelLift)">${continuationInner}</g>`);
      if(setupRoll&&base){base.setAttribute('fill','#d0d0d0');base.setAttribute('stroke','none');base.removeAttribute('filter');}
      else if(bartenderSoft&&base){base.setAttribute('fill','none');base.setAttribute('stroke','none');}
      else if(paperRx>0&&base)base.setAttribute('filter',`url(#${id}labelLift)`);
    }
    if(pageSetupSingle&&base&&!setupRollMedia)base.style.filter='drop-shadow(0 3px 6px rgba(0,0,0,.35))';
    if(pageSetupSingle&&page?.enabled&&(Math.abs(w-itemW)>.01||Math.abs(h-itemH)>.01)){const caption=target.querySelector('small');if(caption)caption.innerHTML=`Page Size: ${fmt(w)} × ${fmt(h)} ${unit}<br>`+caption.innerHTML;}
    if(!workspace){
      const svg=target.querySelector('svg'),content=svg.querySelector(':scope > g[clip-path]');
      const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
      let cells='',stockGuideLayers='';
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const cellW=section==='Layout'?layoutCellW:itemW,cellH=section==='Layout'?layoutCellH:itemH;
        const lx=x+((page?.left_mm||0)+c*(cellW+(page?.gap_x_mm||0)))*scale,ly=y+((page?.top_mm||0)+r*(cellH+(page?.gap_y_mm||0)))*scale,lw=cellW*scale,lh=cellH*scale;
        const shape=itemDesign.label_shape||'rectangle',radius=Math.min(lw/2,lh/2,Math.max(0,Number(itemDesign.corner_radius_mm??2))*scale);
        const cellShape=shape==='ellipse'?`<ellipse data-preview-cell="true" data-label-shape="ellipse" cx="${lx+lw/2}" cy="${ly+lh/2}" rx="${lw/2}" ry="${lh/2}" fill="white" stroke="#222" stroke-width=".8"/>`:shape==='circle'?`<circle data-preview-cell="true" data-label-shape="circle" cx="${lx+lw/2}" cy="${ly+lh/2}" r="${Math.min(lw,lh)/2}" fill="white" stroke="#222" stroke-width=".8"/>`:`<rect data-preview-cell="true" data-label-shape="${shape}" x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="${shape==='rounded'?radius:0}" fill="white" stroke="#222" stroke-width=".8"/>`;
        if(inPageSetup&&window.StockGuides){const guide=window.StockGuides.render(template,cellW,cellH,{side:scope==='back'?'back':'front'});if(guide){const guideClip=id+'stockGuide'+r+'_'+c;stockGuideLayers+=`<defs><clipPath id="${guideClip}">${cellShape.replace('data-preview-cell="true"','')}</clipPath></defs><g data-stock-guide-cell="${r},${c}" clip-path="url(#${guideClip})" pointer-events="none"><svg x="${lx}" y="${ly}" width="${lw}" height="${lh}" viewBox="0 0 ${cellW} ${cellH}" overflow="hidden">${guide}</svg></g>`;}}
        if(section==='Layout'){cells+=`<g data-layout-cell="${r},${c}">${cellShape}</g>`;continue;}
        const pageScope=scope==='page',cellStroke=section==='Printed Item Shape'?` stroke="#1a1a1a" stroke-width=".85"`:'' ,sample=pageScope||inPageSetup?'':`<rect data-preview-cell="true" x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="white"${cellStroke}/>`;
        const itemArtwork=pageScope||!showArtwork?'':designArtwork(itemDesign,lx,ly,lw,lh,scope==='back'&&!!template.back_rotate_180);
        const rr=String(template.print_corner).startsWith('bottom')?rows-1-r:r,cc=String(template.print_corner).endsWith('right')?cols-1-c:c;
        const order=template.print_order==='columns'?cc*rows+rr+1:rr*cols+cc+1;
        const labelTemplate=itemDesign;
        const labelOutline=pageScope?`<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="none" stroke="#16a34a" stroke-width="1" stroke-dasharray="3 2"/>`:(inPageSetup&&!labelTemplate.print_border)||section==='Printed Item Shape'?'':(window.LabelPreview?.renderShapeOutline(labelTemplate,lx,ly,lw,lh,!inPageSetup,scale)||`<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="none" stroke="#111" stroke-width=".8"/>`);
        const cut=shape==='ellipse'?`<ellipse cx="${lx+lw/2}" cy="${ly+lh/2}" rx="${lw/2}" ry="${lh/2}"/>`:shape==='circle'?`<circle cx="${lx+lw/2}" cy="${ly+lh/2}" r="${Math.min(lw,lh)/2}"/>`:`<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="${shape==='rounded'?radius:0}"/>`,clip=id+'shape'+r+'_'+c;
        // Preview face edges use the Layout style, independently of printed borders.
        cells+=`<defs><clipPath id="${clip}">${cut}</clipPath></defs>${inPageSetup?cellShape:''}<g clip-path="url(#${clip})">${sample}${itemArtwork}${labelOutline}</g>`;
        if(section==='Printing Order')cells+=`<text data-print-order="${order}" x="${lx+lw/2}" y="${ly+lh/2}" text-anchor="middle" dominant-baseline="middle" font-size="${Math.max(9,Math.min(22,lh/3))}" fill="#159957">${section==='Printing Order'?order:'Aa →'}</text>`;
      }
      const pageDesign=scope==='page'?template:(template.page_template_enabled?template.designs?.page:null);
      const pageArtwork=showArtwork&&section!=='Layout'&&pageDesign?designArtwork(pageDesign,x,y,w*scale,h*scale):'';
      const pageGuide=template.page_template_enabled&&scope==='page'?`<rect data-page-template-guide="true" x="${x+1}" y="${y+1}" width="${Math.max(0,w*scale-2)}" height="${Math.max(0,h*scale-2)}" rx="${template.label_shape==='rounded'?Math.max(0,Number(template.corner_radius_mm??2))*scale:0}" fill="none" stroke="#16a34a" stroke-width="1.2" stroke-dasharray="3 2" pointer-events="none"/>`:'';
      let sidesVisual='';
      if(template.separate_sides&&section!=='Layout'){const frontStroke=scope==='front'?'#16a34a':'#94a3b8',backStroke=scope==='back'?'#2563eb':'#94a3b8',frontWidth=scope==='front'?2:1,backWidth=scope==='back'?2:1;const backContent=template.back_rotate_180?'<g transform="rotate(180 22 15)"><rect x="3" y="4" width="10" height="5" rx="1" fill="#2563eb"/><text x="8" y="8" text-anchor="middle" font-size="4" font-weight="700" fill="#fff">B</text><path d="M5 14h29M5 18h23M5 22h30" stroke="#263547" stroke-width="1.5"/><path d="M34 11l4 4-4 4" fill="none" stroke="#2563eb" stroke-width="1.2"/></g>':'<g><rect x="3" y="4" width="10" height="5" rx="1" fill="#2563eb"/><text x="8" y="8" text-anchor="middle" font-size="4" font-weight="700" fill="#fff">B</text><path d="M5 14h29M5 18h23M5 22h30" stroke="#263547" stroke-width="1.5"/></g>';sidesVisual=`<g data-sides-preview="true" transform="translate(8 7)" pointer-events="none"><g><rect x="0" y="0" width="44" height="30" rx="2" fill="#fff" stroke="${frontStroke}" stroke-width="${frontWidth}"/><rect x="3" y="4" width="10" height="5" rx="1" fill="#16a34a"/><text x="8" y="8" text-anchor="middle" font-size="4" font-weight="700" fill="#fff">F</text><path d="M5 14h29M5 18h23M5 22h30" stroke="#263547" stroke-width="1.5"/></g><g transform="translate(47 0)"><rect x="0" y="0" width="44" height="30" rx="2" fill="#fff" stroke="${backStroke}" stroke-width="${backWidth}"/>${backContent}</g>${template.back_rotate_180?'<path d="M86 2a7 7 0 0 1 6 8m0 0-3-2m3 2 2-3" fill="none" stroke="#2563eb" stroke-width="1.5"/>':''}</g>`;}
      content.innerHTML=pageArtwork+cells+pageGuide+sidesVisual;
      if(stockGuideLayers)svg.insertAdjacentHTML('beforeend',`<g data-stock-guides="true">${stockGuideLayers}</g>`);
      if(!setupRollMedia&&itemDesign.label_shape!=='rectangle'){const backing=svg.querySelector(':scope > rect:nth-of-type(2)');if(backing)backing.setAttribute('fill','#d2d2d2');}
      if(section==='Stock'&&(template.stock?.type||'die-cut')==='die-cut'){
        let cuts='';
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
          const gx=x+((page?.left_mm||0)+c*(itemW+(page?.gap_x_mm||0)))*scale;
          const gy=y+((page?.top_mm||0)+r*(itemH+(page?.gap_y_mm||0)))*scale;
          const gw=itemW*scale,gh=itemH*scale;
          cuts+=`<rect data-die-cut="true" x="${gx+.8}" y="${gy+.8}" width="${Math.max(0,gw-1.6)}" height="${Math.max(0,gh-1.6)}" fill="none" stroke="#07883f" stroke-width="1.8" stroke-dasharray="2.5 1.5" vector-effect="non-scaling-stroke"/>`;
        }
        content.insertAdjacentHTML('beforeend',`<g data-die-cut-guides="true" pointer-events="none">${cuts}</g>`);
      }
      const transforms=[];if(template.print_orientation==='inverted')transforms.push(`rotate(180 ${x+w*scale/2} ${y+h*scale/2})`);if(template.mirror)transforms.push(`translate(${2*x+w*scale} 0) scale(-1 1)`);content.setAttribute('transform',transforms.join(' '));
      if(template.negative){const filter=document.createElementNS('http://www.w3.org/2000/svg','filter');filter.id=id+'negative';filter.innerHTML='<feColorMatrix type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/>';svg.querySelector('defs').append(filter);content.setAttribute('filter',`url(#${filter.id})`);}
      const stock=template.stock||{},linerLeft=Math.max(0,Number(stock.liner_left_mm)||0)*scale,linerRight=Math.max(0,Number(stock.liner_right_mm)||0)*scale;
      if(section==='Stock'){svg.insertAdjacentHTML('beforeend',`<g data-stock-type="${escape(stock.type||'die-cut')}"><rect data-liner="left" x="${x-linerLeft}" y="${y}" width="${linerLeft}" height="${h*scale}" fill="#b5c6d8" opacity=".7"/><rect data-liner="right" x="${edge}" y="${y}" width="${linerRight}" height="${h*scale}" fill="#b5c6d8" opacity=".7"/>${stock.type==='black-mark'?`<rect data-black-mark="true" x="${x}" y="${bottom+3}" width="${Math.min(w*scale,30)}" height="5" fill="#111"/>`:stock.type==='continuous'?'<text x="125" y="310" text-anchor="middle" font-size="10">Continuous media ↓</text>':`<path data-stock-gap="true" d="M${x} ${bottom+5}H${edge}" stroke="#07883f" stroke-width="1.8" stroke-dasharray="2.5 1.5"/><path data-gap-dimension="true" d="M${edge+2} ${bottom}V${bottom+7}" fill="none" stroke="#07883f" stroke-width="1.2" marker-start="url(#${id}gapArrow)" marker-end="url(#${id}gapArrow)"/><text data-gap-label="true" x="${edge+5}" y="${bottom+4}" dominant-baseline="middle" fill="#07883f" font-size="6" font-weight="700">Gap</text>`}</g>`);}
      const mode={T:'Tear-off',P:'Peel-off',C:'Cutter',R:'Rewind'}[template.print_mode||'T'];
      if(section==='Media Handling'){const offset=Number(template.tear_off)||0;const icons={T:'<path d="M110 291h30" stroke-dasharray="3 2"/>',P:'<path d="M110 285h18q12 0 12 12M128 285v13"/>',C:'<path d="m110 283 30 13m-30 0 30-13"/><circle cx="110" cy="283" r="3"/><circle cx="110" cy="296" r="3"/>',R:'<circle cx="125" cy="288" r="9"/><circle cx="125" cy="288" r="3"/><path d="M134 288h10"/>'};svg.insertAdjacentHTML('beforeend',`<g data-media-mode="${escape(mode)}" data-tear-offset="${offset}"><path d="M${x} ${bottom+12+offset*.08}H${edge}" stroke="#159957" stroke-dasharray="3 2"/><g fill="none" stroke="#159957" stroke-width="1.5">${icons[template.print_mode||'T']||icons.T}</g><text x="125" y="310" text-anchor="middle" font-size="11">${mode} · ${offset} steps</text></g>`);}
    }
    if(pageSetupSingle){
      // Native Page Setup draws the sheet and its labels without dimension ticks. Stock-type guides stay on the Stock tab.
      const setupSvg=target.querySelector('svg');
      setupSvg.querySelector('path[stroke="#7b8490"]')?.remove();
      for(const guide of setupSvg.querySelectorAll('[data-die-cut-guides],[data-stock-type]'))guide.setAttribute('visibility','hidden');
    }
    if(workspace){
      const svg=target.querySelector('svg'),back=svg.querySelector(':scope > rect');
      back.setAttribute('fill',document.getElementById('previewBackgroundColor')?.value||'#4b5563');
      const fixedNav=document.body.classList.contains('navbar-fixed'),fixedRuler=document.body.classList.contains('ruler-fixed');
      let chrome='';
      if(fixedNav)chrome+='<rect width="250" height="29" fill="white"/><text x="7" y="8" font-size="5" fill="#263547">File    Home    Insert    Layout    Data    View</text><path d="M8 14h7v9H8z M24 16h10v7H24z M44 14v9m-3-3 3 3 3-3 M60 15h8v8h-8z" fill="none" stroke="#263547" stroke-width="1"/>';
      if(fixedRuler){const top=fixedNav?29:0;chrome+=`<rect y="${top}" width="250" height="10" fill="#c8d2de"/><rect y="${top+10}" width="10" height="${330-top}" fill="#c8d2de"/><path d="${Array.from({length:25},(_,i)=>`M${i*10} ${top+10}v-${i%5?3:6}`).join(' ')}" stroke="#526174" stroke-width=".5"/>`;}
      if(document.getElementById('showRulerCoordinates')?.checked){
        const snapEnabled=workspace&&!!document.getElementById('chkSnap')?.checked;
        const stepMm=Number(document.getElementById('gridStep')?.value||.5);
        const pointerMm=window.PreviewSnap.coordinates(w*.67,h*.42,snapEnabled,stepMm);
        const pointerX=x+pointerMm.xMm*scale,pointerY=y+pointerMm.yMm*scale;
        const pointerLabel=value=>`${mmToUnit(value,unit,template.dpi)} ${unit}`;
        const xLabel=pointerLabel(pointerMm.xMm),yLabel=pointerLabel(pointerMm.yMm),pointerColor=snapEnabled?'#16a34a':'#dc2626';
        chrome+=`<g data-pointer-preview="true" data-snap-enabled="${snapEnabled}" data-x-mm="${pointerMm.xMm}" data-y-mm="${pointerMm.yMm}" aria-label="Pointer coordinate preview" pointer-events="none"><path d="M${pointerX} ${y}V${y+h*scale} M${x} ${pointerY}H${x+w*scale}" fill="none" stroke="${pointerColor}" stroke-width=".65" stroke-dasharray="2 1" opacity=".85"/><circle cx="${pointerX}" cy="${pointerY}" r="${snapEnabled?2.4:1.6}" fill="#fff" stroke="${pointerColor}" stroke-width=".8"/>${snapEnabled?`<circle data-snap-target="true" cx="${pointerX}" cy="${pointerY}" r=".7" fill="${pointerColor}"/>`:''}<text x="${pointerX+3}" y="${y+8}" fill="${pointerColor}" font-size="5" font-weight="600" paint-order="stroke" stroke="#fff" stroke-width="2">${xLabel}</text><text x="${x+13}" y="${pointerY-2}" fill="${pointerColor}" font-size="5" font-weight="600" paint-order="stroke" stroke="#fff" stroke-width="2">${yLabel}</text></g>`;
      }
      if(!document.body.classList.contains('preview-hide-horizontal-scrollbar'))chrome+='<rect x="10" y="333" width="230" height="7" fill="white" fill-opacity=".72"/><rect x="65" y="335" width="115" height="3" rx="1.5" fill="#6b7280"/>';
      if(!document.body.classList.contains('preview-hide-vertical-scrollbar'))chrome+='<rect x="243" y="39" width="7" height="294" fill="white" fill-opacity=".72"/><rect x="245" y="115" width="3" height="140" rx="1.5" fill="#6b7280"/>';
      svg.insertAdjacentHTML('beforeend',chrome);
    }
  }
  function renderReferenceRoll(svg,template,options={}){
    const rows=Math.max(1,Number(template.page?.rows)||1),columns=Math.max(1,Number(template.page?.columns)||1),multiple=rows*columns>1;
    const width=Number(multiple?template.page?.width_mm:template.width_mm),height=Number(multiple?template.page?.height_mm:template.height_mm);if(!(width>0&&height>0))return;
    const linerLeftMm=Math.max(0,Number(template.stock?.liner_left_mm)||0),linerRightMm=Math.max(0,Number(template.stock?.liner_right_mm)||0);
    const crossWidth=width+linerLeftMm+linerRightMm;
    const scale=Math.min(154/crossWidth,180/height),w=width*scale,h=height*scale;
    const linerLeft=linerLeftMm*scale,linerRight=linerRightMm*scale;
    const totalW=w+linerLeft+linerRight,pageX=(198-totalW)/2,x=pageX+linerLeft,y=(270-h)/2;
    const shape=template.label_shape||'rectangle',radius=shape==='rounded'?Math.min(w/2,h/2,Math.max(options.sideEdges||options.wizardRounded?Math.min(w,h)*.12:0,Math.max(0,Number(template.corner_radius_mm)||0)*scale)):0;
    const id='referenceRoll'+(++sequence),sliver=12,gap=2,upper=y-gap,lower=y+h+gap,outerLeft=pageX,outerRight=pageX+totalW;
    const face=(attrs,dy=0)=>shape==='ellipse'?`<ellipse ${attrs} cx="${x+w/2}" cy="${y+h/2+dy}" rx="${w/2}" ry="${h/2}"/>`:shape==='circle'?`<circle ${attrs} cx="${x+w/2}" cy="${y+h/2+dy}" r="${Math.min(w,h)/2}"/>`:`<rect ${attrs} x="${x}" y="${y+dy}" width="${w}" height="${h}" rx="${radius}"/>`;
    const linerColor=options.sideEdges||options.wizardPreview?'#e9e9e9':'#a8a8a8';
    const linerVisual=(linerLeft?`<rect data-liner="left" x="${pageX}" y="${y}" width="${linerLeft}" height="${h}" fill="${linerColor}"/>`:'')+(linerRight?`<rect data-liner="right" x="${x+w}" y="${y}" width="${linerRight}" height="${h}" fill="${linerColor}"/>`:'');
    svg.setAttribute('viewBox','0 0 198 270');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.dataset.wizardPreviewStyle='bartender';
    svg.innerHTML=`<defs><linearGradient id="${id}background" x2="0" y2="1"><stop stop-color="#c7d9ee"/><stop offset="1" stop-color="#89a6c4"/></linearGradient><clipPath id="${id}face">${face('')}</clipPath><clipPath id="${id}top"><rect x="${pageX-2}" y="${upper-sliver}" width="${totalW+4}" height="${sliver}"/></clipPath><clipPath id="${id}bottom"><rect x="${pageX-2}" y="${lower}" width="${totalW+4}" height="${sliver}"/></clipPath><linearGradient id="${id}topFade" x2="0" y2="1"><stop stop-color="#bfbfbf"/><stop offset=".8" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="${id}bottomFade" x2="0" y2="1"><stop stop-color="#fff"/><stop offset=".2" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#bfbfbf"/></linearGradient><linearGradient id="${id}topMaskFade" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="white"/></linearGradient><linearGradient id="${id}bottomMaskFade" x2="0" y2="1"><stop stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="${id}topMask" maskUnits="userSpaceOnUse" x="${pageX-2}" y="${upper-sliver}" width="${totalW+4}" height="${sliver}"><rect x="${pageX-2}" y="${upper-sliver}" width="${totalW+4}" height="${sliver}" fill="url(#${id}topMaskFade)"/></mask><mask id="${id}bottomMask" maskUnits="userSpaceOnUse" x="${pageX-2}" y="${lower}" width="${totalW+4}" height="${sliver}"><rect x="${pageX-2}" y="${lower}" width="${totalW+4}" height="${sliver}" fill="url(#${id}bottomMaskFade)"/></mask></defs><rect data-reference-background="true" data-gradient-id="${id}background" width="198" height="270" fill="${options.sideEdges||options.wizardRounded||options.wizardPreview?`url(#${id}background)`:'#bfbfbf'}"/>${options.sideEdges||options.wizardPreview?`<g><rect data-reference-liner="true" x="${pageX}" y="${upper-sliver}" width="${totalW}" height="${lower+sliver-upper+sliver}" fill="${linerColor}"/></g>`:''}<g>${linerVisual}</g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="none"/><g data-paper-continuation="true" data-paper-style="bartender"><path data-paper-liner="left" d="M${outerLeft-2} ${upper-sliver}V${lower+sliver}M${outerRight+2} ${upper-sliver}V${lower+sliver}" stroke="#555" stroke-width=".6" fill="none"/><path d="M${outerLeft-1} ${upper-sliver}V${lower+sliver}M${outerRight+1} ${upper-sliver}V${lower+sliver}" stroke="#fff" stroke-width="1" fill="none"/><g clip-path="url(#${id}top)" mask="url(#${id}topMask)">${face('data-paper-sliver="top" fill="white" stroke="#333" stroke-width=".7"',-h-gap)}</g><g clip-path="url(#${id}bottom)" mask="url(#${id}bottomMask)">${face('data-paper-sliver="bottom" fill="white" stroke="#333" stroke-width=".7"',h+gap)}</g></g><g clip-path="url(#${id}face)">${face(`data-preview-cell="true" data-label-shape="${shape}" fill="white" stroke="#222" stroke-width="1.2"`)}</g>`;
    svg.style.background='#bfbfbf';
    if(multiple){
      const content=svg.querySelector(':scope > g:last-child');content.removeAttribute('clip-path');content.replaceChildren();
      const iw=Number(template.width_mm)*scale,ih=Number(template.height_mm)*scale;
      let cells='';
      for(let row=0;row<Math.min(rows,100);row++)for(let col=0;col<Math.min(columns,100);col++){
        const cx=x+(Number(template.page.left_mm||0)+col*(Number(template.width_mm)+Number(template.page.gap_x_mm||0)))*scale,cy=y+(Number(template.page.top_mm||0)+row*(Number(template.height_mm)+Number(template.page.gap_y_mm||0)))*scale;
        const attr='data-preview-cell="true" data-stock-label="true" data-label-shape="'+shape+'" fill="white" stroke="#222" stroke-width=".7"';
        cells+=shape==='ellipse'?`<ellipse ${attr} cx="${cx+iw/2}" cy="${cy+ih/2}" rx="${iw/2}" ry="${ih/2}"/>`:shape==='circle'?`<circle ${attr} cx="${cx+iw/2}" cy="${cy+ih/2}" r="${Math.min(iw,ih)/2}"/>`:`<rect ${attr} x="${cx}" y="${cy}" width="${iw}" height="${ih}" rx="${Math.min(radius,iw/2,ih/2)}"/>`;
      }
      content.innerHTML=cells;
    }
    svg.querySelectorAll('[data-preview-cell]').forEach(cell=>cell.setAttribute('data-stock-label','true'));
  }
  function renderSingleSheet(svg,template,options={}){
    renderReferenceRoll(svg,options.finished?{...template,stock:{}}:template,{wizardPreview:true,wizardRounded:template.label_shape==='rounded'});
    if(options.finished){svg.querySelector('[data-reference-liner]')?.parentElement.remove();svg.querySelector('[data-paper-continuation]')?.remove();svg.style.background='transparent';}
    const face=svg.querySelector('[data-preview-cell]');if(!face)return;
    face.setAttribute('fill',template.background_color||'#fff');
    if(template.background_picture){
      const x=Number(face.getAttribute('x')||0),y=Number(face.getAttribute('y')||0),width=Number(face.getAttribute('width')||0),height=Number(face.getAttribute('height')||0);
      const cx=Number(face.getAttribute('cx')||0),cy=Number(face.getAttribute('cy')||0),rx=Number(face.getAttribute('rx')||face.getAttribute('r')||0),ry=Number(face.getAttribute('ry')||face.getAttribute('r')||0);
      const image=document.createElementNS('http://www.w3.org/2000/svg','image');image.setAttribute('href',template.background_picture);image.setAttribute('x',width?x:cx-rx);image.setAttribute('y',height?y:cy-ry);image.setAttribute('width',width||rx*2);image.setAttribute('height',height||ry*2);image.setAttribute('preserveAspectRatio','xMidYMid slice');image.setAttribute('clip-path',face.parentElement.getAttribute('clip-path'));svg.append(image);
    }
  }
  window.PaperPreview={render,renderReferenceRoll,renderSingleSheet};
  const style=document.createElement('style');style.textContent='#pageSetupDialog .nw-stock-preview linearGradient[id$="background"] stop:first-child{stop-color:#c4d5ec}#pageSetupDialog .nw-stock-preview linearGradient[id$="background"] stop:last-child{stop-color:#8aa2c4}#pageSetupDialog .nw-stock-preview linearGradient[id$="fadeTop"] stop:first-child{stop-color:#c4d5ec}#pageSetupDialog .nw-stock-preview linearGradient[id$="fadeBottom"] stop:last-child{stop-color:#8aa2c4}.modal-preview-layout{display:grid;grid-template-columns:minmax(0,1fr) 338px;align-items:start}.modal-paper-preview{padding:12px;min-width:0;position:sticky;top:0;text-align:center}.modal-paper-preview>svg{width:100%;height:442px;display:block;border:1px solid #88939e}.modal-paper-preview small{display:block;font-size:11px;line-height:1.8;margin-top:9px;color:var(--text)}.margin-dimension{stroke:#252a30;stroke-width:.85;fill:none}.layout-gap-dimension{stroke:#252a30;stroke-width:1.2;fill:none}.margin-dimension-label{fill:#252a30;font:8px "Segoe UI",sans-serif;font-weight:600;paint-order:stroke;stroke:#ededed;stroke-width:2.5;stroke-linejoin:round}#pageSetupDialog>.modal-preview-layout{align-items:stretch;min-width:0;min-height:0;height:100%;overflow:hidden}#pageSetupDialog>.modal-preview-layout>main{box-sizing:border-box;width:100%;height:100%;min-width:0;min-height:0;max-height:none;overflow:auto;overflow-x:hidden;scrollbar-width:none}#pageSetupDialog>.modal-preview-layout>main::-webkit-scrollbar{display:none;width:0;height:0}#pageSetupDialog .modal-paper-preview{box-sizing:border-box;min-height:0;max-height:100%;overflow:auto}#pageSetupDialog main{min-width:0}#stockPreview,#stockSizeNote{display:none!important}#newLabelWizard .nw-body{grid-template-columns:minmax(0,1fr) 338px}#newLabelWizard aside{display:block;background:none;padding:0}#newLabelWizard aside svg{max-height:442px;height:auto;width:100%}#newLabelWizard{width:min(850px,96vw)}@media(max-width:650px){.modal-preview-layout{grid-template-columns:minmax(0,1fr) 234px}.modal-paper-preview{padding:6px}.modal-paper-preview>svg{height:325px}#newLabelWizard .nw-body{grid-template-columns:minmax(0,1fr) 234px}#newLabelWizard aside{display:block}}';document.head.append(style);
  function attach(dialog,content,provider,artwork=false){
    if(!content)return;const wrapper=document.createElement('div');wrapper.className='modal-preview-layout';content.before(wrapper);wrapper.append(content);const aside=document.createElement('aside');aside.className='modal-paper-preview';wrapper.append(aside);
    const workspace=dialog.querySelector('header strong')?.textContent==='Preview Settings';
    const update=()=>{if(!dialog.open)return;const tab=dialog.querySelector('nav button[aria-selected=true]'),section=dialog.id==='pageSetupDialog'&&tab?.id.startsWith('tab')?tab.id.slice(3):tab?.textContent||'Layout';render(aside,provider(),typeof measureUnit==='function'?measureUnit():'mm',artwork,workspace,section);};
    const changed=event=>{
      const designControl=dialog.id==='pageSetupDialog'&&event.target.matches('#setupSeparateSides,#setupBackRotate,#setupPageTemplate,#setupDesignScope');
      // These controls commit from their own change handlers. Reading the
      // whole form on their earlier input event can refresh stale values and
      // undo the user's click before change is delivered.
      if(designControl){if(event.type==='change')queueMicrotask(update);return;}
      if(dialog.id==='pageSetupDialog'&&event.target.matches('input:not([type=file]),select')&&event.target.checkValidity()&&typeof readEditorIntoDraft==='function')readEditorIntoDraft();
      queueMicrotask(update);
    };
    new MutationObserver(update).observe(dialog,{attributes:true,attributeFilter:['open']});dialog.addEventListener('input',changed);dialog.addEventListener('change',changed);dialog.addEventListener('focusin',()=>queueMicrotask(update));dialog.addEventListener('focusout',()=>queueMicrotask(update));dialog.addEventListener('click',()=>queueMicrotask(update),true);
    const nav=dialog.querySelector('nav');if(nav)new MutationObserver(update).observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-selected']});
    new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});
    document.addEventListener('preview-updated',update);
  }
  window.PaperPreview.attach=attach;
  attach(document.getElementById('pageSetupDialog'),document.querySelector('#pageSetupDialog main'),()=>editing);
  for(const dialog of document.querySelectorAll('.workspace-dialog'))if(!/History/.test(dialog.querySelector('header strong')?.textContent||''))attach(dialog,dialog.querySelector('.dialog-body'),()=>editing,true);
})();
