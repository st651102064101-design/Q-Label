'use strict';

// Anteprima dell'etichetta allineata al comportamento Zebra (^A0, ^BY, ^BC).
// Disegna in millimetri (SVG) e in punti reali (canvas/PNG) con le stesse metriche.
(function () {
  const fallbackSegmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
  function fillPlaceholders(str, data) {
    if (typeof str !== 'string') return '';
    return str.replace(/\{\{\s*([\w.\-]+)\s*\}\}/g, (_, k) => {
      const v = (data || {})[k];
      return v === undefined || v === null || v === '' ? '' : String(v);
    });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function mmToDots(mm, dpi) {
    return Math.round((Number(mm) || 0) * ((dpi || 203) / 25.4));
  }

  // Keep fractional printer dots so preview, object bounds, and print output
  // agree on the requested physical barcode width.
  function zebraModuleDots(el) {
    const n = Number(el && el.module_width);
    return Number.isFinite(n) && n > 0 ? Math.max(1, n) : 2;
  }

  function barcodeText(el, data) {
    const t = ObjectData.resolve(el, data);
    if (t) return t;
    return el.type === 'ean13' ? '000000000000' : '000';
  }

  function symbolSize(el, dpi, data) {
    const text = barcodeText(el, data);
    const barH = Number(el.bar_height_mm);
    const hMm = Number.isFinite(barH) && barH > 0 ? barH : (el.bar_height_dots ? (el.bar_height_dots / dpi) * 25.4 : 10);
    const moduleMm = zebraModuleDots(el) / ((dpi || 203) / 25.4);
    let w = Math.max(8, (text.length || 3) * moduleMm * 11);
    let label = text;
    const B = (typeof window !== 'undefined') ? window.Barcode : null;
    if (B) {
      let r = null;
      if (el.type === 'ean13') {
        r = B.ean13SVG(text, 0, 0, hMm, moduleMm);
        if (!r) r = B.code128SVG(text, 0, 0, hMm, moduleMm);
      }
      else if (el.type === 'code93') r = B.code93SVG(text, 0, 0, hMm, moduleMm);
      else if (el.type === 'code39') r = B.code39SVG(text, 0, 0, hMm, moduleMm);
      else r = B.code128SVG(text, 0, 0, hMm, moduleMm);
      if (r && r.width) {
        w = r.width;
        if (r.digits) label = r.digits;
      }
    }
    let h = hMm;
    const hri = zebraHri(el, dpi);
    const hriOffset = Math.max(-hri.gapMm, Number(el.hri_offset_mm) || 0);
    const hriBoxHeight=Math.max(hri.hMm,Number(el.hri_box_height_mm)||hri.hMm);
    if (el.show_text !== false) h += hri.gapMm + hriOffset + hriBoxHeight;
    return { text, label, barH: hMm, moduleMm, w, h, hri, hriOffset, hriBoxHeight };
  }

  function zebraHri(el, dpi) {
    const dotsPerMm = (dpi || 203) / 25.4;
    return {
      hMm: Number(el.hri_height_mm)||3,
      gapMm: Math.max(0, Number.isFinite(Number(el.hri_gap_mm)) ? Number(el.hri_gap_mm) : 0.6),
      hDots: Math.round((Number(el.hri_height_mm)||3) * dotsPerMm),
      gapDots: Math.max(0, Math.round((Math.max(0, Number.isFinite(Number(el.hri_gap_mm)) ? Number(el.hri_gap_mm) : 0.6)) * dotsPerMm)),
      mod: zebraModuleDots(el),
    };
  }

  function zebraTextStyle(el, dpi, text='Text') {
    const hmm = el.height_mm || (el.height_dots ? (el.height_dots / dpi) * 25.4 : 3);
    const wmm = el.width_mm || (el.width_dots ? (el.width_dots / dpi) * 25.4 : hmm);
    const fontSize = hmm * 0.9;
    const value=String(text||' '),measure=document.createElement('canvas').getContext('2d');
    measure.font=`400 ${fontSize}px Arial, Helvetica, sans-serif`;
    const natural=measure.measureText(value).width||1;
    return { hmm, wmm, fontSize, scaleX:1, naturalWidth:natural };
  }

  function textScale(el){return {x:Math.max(.05,Math.min(20,Number(el.text_scale_x)||1)),y:Math.max(.05,Math.min(20,Number(el.text_scale_y)||1))};}

  function formattedTextLayout(el, text) {
    const size=Math.max(.1,(Number(el.font_size_pt)||9)*25.4/72),fontSize=size*(el.script==='sub'||el.script==='super'?.7:1);
    const measure=window.TextMeasure?.context()||document.createElement('canvas').getContext('2d');
    const family=el.font_family||'Arial';
    measure.font=`${el.italic?'italic ':''}${el.bold?'700':'400'} ${fontSize*96/25.4}px "${family.replace(/"/g,'')}"`;
    const widthScale=Math.max(.1,Math.min(5,(Number(el.text_width_percent)||100)/100));
    const measureFont=measure.font;
    const rawWidthOf=s=>(window.TextMeasure?window.TextMeasure.width(measureFont,s):measure.measureText(s).width)*25.4/96,widthOf=s=>rawWidthOf(s)*widthScale;
    const boxW=Math.max(1,Number(el.text_box_width_mm)||30),lines=[];
    for(const paragraph of String(text||' ').split('\n')){
      if(!el.text_wrap){lines.push(paragraph);continue;}
      const chars=window.TextMeasure?window.TextMeasure.graphemes(paragraph):fallbackSegmenter?[...fallbackSegmenter.segment(paragraph)].map(part=>part.segment):Array.from(paragraph);let line='';for(const char of chars){if(line&&widthOf(line+char)>boxW){lines.push(line);line='';}line+=char;}lines.push(line);
    }
    const naturalW=Math.max(.1,...lines.map(rawWidthOf)),w=el.text_wrap||el.text_auto_fit||el.text_box_width_mm?boxW:naturalW*widthScale;
    const rawHeight=fontSize*(1+(lines.length-1)*Math.max(.8,Number(el.line_spacing)||1.2)),boxHeight=Number(el.text_box_height_mm)||0;
    const scale=el.text_auto_fit?Math.min(1,w/(naturalW*widthScale),boxHeight>0?boxHeight/rawHeight:1):1;
    const spacing=Math.max(.8,Number(el.line_spacing)||1.2),naturalH=fontSize*scale*(1+(lines.length-1)*spacing),h=Math.max(naturalH,Number(el.text_box_height_mm)||0);
    const offset=el.vertical_align==='bottom'?h-naturalH:el.vertical_align==='middle'?(h-naturalH)/2:0;
    return {lines,w,h,fontSize:fontSize*scale,spacing,offset,family,widthOf,widthScale,supOffset:el.script==='sub'?size*.25:0};
  }
  function renderFormattedText(el,text,x,y){ if(el.letter_spacing_mm)return renderFormattedTextRanges(el,text,x,y,[]);
    const l=formattedTextLayout(el,text),color=el.text_inverse?'#fff':el.text_color||'#111',bg=el.text_inverse?'#000':el.text_background||'none';
    let out=`<rect data-text-background="true" x="${x}" y="${y}" width="${l.w}" height="${l.h}" fill="${esc(bg)}"/>`;
    if(el.stroke_color&&Number(el.thickness_mm)>0)out+=`<rect x="${x}" y="${y}" width="${l.w}" height="${l.h}" fill="none" stroke="${esc(el.stroke_color)}" stroke-width="${Number(el.thickness_mm)}"${lineDash(el)}/>`;
    l.lines.forEach((line,i)=>{
      const align=el.text_align||'left',tx=x+(align==='right'?l.w:align==='center'?l.w/2:0),anchor=align==='right'?'end':align==='center'?'middle':'start';
      const justify=align==='justify'&&i<l.lines.length-1&&Array.from(line).length>1?` textLength="${l.w}" lengthAdjust="spacing"`:'';
      const decorations=[el.underline?'underline':'',el.strike?'line-through':''].filter(Boolean).join(' ')||'none',stroke=el.text_outline?` stroke="${esc(el.text_outline_color||'#111111')}" stroke-width="${Math.max(.01,Number(el.text_outline_width_pt)||.5)*25.4/72}" paint-order="stroke fill" stroke-linejoin="round"`:'';
      const transform=l.widthScale!==1?` transform="translate(${tx} 0) scale(${l.widthScale} 1) translate(${-tx} 0)"`:'';
      out+=`<text x="${tx}" y="${y+l.offset+l.supOffset+i*l.fontSize*l.spacing}" font-size="${l.fontSize}" font-family="${esc(l.family)}" font-weight="${el.bold?'700':'400'}" font-style="${el.italic?'italic':'normal'}" font-variant="${el.small_caps?'small-caps':'normal'}" text-decoration="${decorations}" text-anchor="${anchor}" dominant-baseline="hanging" opacity="${el.text_opacity??1}" fill="${esc(color)}"${stroke}${transform}${justify}>${esc(line)||' '}</text>`;
    });return out;
  }
  function formattedRangeLines(el,text,ranges){
    const base=Math.max(.1,(Number(el.font_size_pt)||9)*25.4/72),scale=Math.max(.1,Math.min(5,(Number(el.text_width_percent)||100)/100)),width=Math.max(.1,Number(el.text_box_width_mm)||30),ctx=window.TextMeasure?.context()||document.createElement('canvas').getContext('2d'),segmenter=typeof Intl!=='undefined'&&Intl.Segmenter?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null,chars=window.TextMeasure?.graphemes(String(text??''))||(segmenter?[...segmenter.segment(String(text??''))].map(item=>item.segment):Array.from(String(text??''))),result=[{items:[],width:0,height:base}],source=String(text??'');let offset=0;
    for(const char of chars){const start=offset;offset+=char.length;if(char==='\n'){result.push({items:[],width:0,height:base});continue;}const range=(ranges||[]).find(item=>item.start<=start&&item.end>=offset)||{},family=range.font_family||el.font_family||'Arial',size=Math.max(.1,Number(range.font_size_pt||el.font_size_pt||9)*25.4/72),bold=Object.hasOwn(range,'bold')?!!range.bold:!!el.bold,italic=Object.hasOwn(range,'italic')?!!range.italic:!!el.italic;ctx.font=`${italic?'italic ':''}${bold?'700':'400'} ${size*96/25.4}px "${family.replace(/"/g,'')}"`;const glyphWidth=((window.TextMeasure?window.TextMeasure.width(ctx.font,char):ctx.measureText(char).width)*25.4/96+(Number(el.letter_spacing_mm)||0))*scale;let line=result.at(-1);if(el.text_wrap&&line.items.length&&line.width+glyphWidth>width){line={items:[],width:0,height:base};result.push(line);}line.items.push({char,start,end:offset,width:glyphWidth,style:range,size,family,bold,italic});line.width+=glyphWidth;line.height=Math.max(line.height,size);}
    if(el.text_auto_fit){const widest=Math.max(.1,...result.map(line=>line.width)),naturalHeight=result.reduce((sum,line)=>sum+line.height*Math.max(.8,Number(el.line_spacing)||1.2),0),boxHeight=Number(el.text_box_height_mm)||0,fit=Math.min(1,width/widest,boxHeight>0?boxHeight/Math.max(.1,naturalHeight):1);if(fit<1){for(const line of result){line.width*=fit;line.height*=fit;for(const item of line.items){item.width*=fit;item.size*=fit;}}}}
    return {lines:result,base,width,height:Math.max(base,Number(el.text_box_height_mm)||0),spacing:Math.max(.8,Number(el.line_spacing)||1.2),scale};
  }
  function justifyGaps(layout,line,index,text,align){
    const gaps=new Map(),last=line.items.at(-1);
    if(align!=='justify'||index===layout.lines.length-1||!last||String(text)[last.end]==='\n')return gaps;
    const spaces=line.items.filter((item,i)=>i<line.items.length-1&&/\s/u.test(item.char));
    const targets=spaces.length?spaces:line.items.filter((item,i)=>i<line.items.length-1&&!/\p{Mark}/u.test(line.items[i+1].char));
    const extra=Math.max(0,layout.width-line.width)/Math.max(1,targets.length);
    for(const item of targets)gaps.set(item,extra);return gaps;
  }
  function renderFormattedTextRanges(el,text,x,y,ranges){
    const l=formattedRangeLines(el,text,ranges),align=el.text_align||'left',offset=el.vertical_align==='bottom'?l.height-l.lines.reduce((n,line)=>n+line.height*l.spacing,0):el.vertical_align==='middle'?(l.height-l.lines.reduce((n,line)=>n+line.height*l.spacing,0))/2:0;let out='';
    l.lines.forEach((line,index)=>{const gaps=justifyGaps(l,line,index,text,align);let cursor=x+(align==='right'?l.width:align==='center'?l.width/2:0),baseline=y+offset+l.lines.slice(0,index).reduce((n,item)=>n+item.height*l.spacing,0),tx=cursor-(align==='right'?line.width:align==='center'?line.width/2:0);for(const item of line.items){const color=item.style.text_inverse?'#fff':item.style.text_color||el.text_color||'#111',background=item.style.text_inverse?'#000':item.style.text_background||'none',decorations=[(item.style.underline??el.underline)?'underline':'',(item.style.strike??el.strike)?'line-through':''].filter(Boolean).join(' ')||'none',transform=l.scale!==1?` transform="translate(${tx} 0) scale(${l.scale} 1) translate(${-tx} 0)"`:'';if(background!=='none')out+=`<rect x="${tx}" y="${baseline}" width="${item.width/l.scale}" height="${item.size}" fill="${esc(background)}"${transform}/>`;out+=`<text x="${tx}" y="${baseline}" font-size="${item.size}" font-family="${esc(item.family)}" font-weight="${item.bold?'700':'400'}" font-style="${item.italic?'italic':'normal'}" text-decoration="${decorations}" text-anchor="start" dominant-baseline="hanging" opacity="${el.text_opacity??1}" fill="${esc(color)}"${transform}>${esc(item.char)}</text>`;tx+=item.width+(gaps.get(item)||0);}});return out;
  }
  function drawFormattedTextRangesCanvas(ctx,el,text,x,y,ranges){
    const l=formattedRangeLines(el,text,ranges),align=el.text_align||'left',totalHeight=l.lines.reduce((n,line)=>n+line.height*l.spacing,0),offset=el.vertical_align==='bottom'?l.height-totalHeight:el.vertical_align==='middle'?(l.height-totalHeight)/2:0;ctx.save();ctx.globalAlpha*=el.text_opacity??1;ctx.textBaseline='top';
    l.lines.forEach((line,index)=>{const gaps=justifyGaps(l,line,index,text,align);let tx=x+(align==='right'?l.width:align==='center'?l.width/2:0),ty=y+offset+l.lines.slice(0,index).reduce((n,item)=>n+item.height*l.spacing,0);if(align==='right')tx-=line.width;else if(align==='center')tx-=line.width/2;for(const item of line.items){const style=item.style,color=style.text_inverse?'#fff':style.text_color||el.text_color||'#111',background=style.text_inverse?'#000':style.text_background||'none';ctx.font=`${item.italic?'italic ':''}${item.bold?'700 ':'400 '}${item.size}px "${item.family}"`;ctx.fillStyle=color;ctx.save();if(l.scale!==1){ctx.translate(tx,0);ctx.scale(l.scale,1);ctx.translate(-tx,0);}if(background!=='none'){ctx.fillStyle=background;ctx.fillRect(tx,ty,item.width/l.scale,item.size);ctx.fillStyle=color;}ctx.fillText(item.char,tx,ty);const measured=ctx.measureText(item.char).width;if((style.underline??el.underline)||(style.strike??el.strike)){ctx.strokeStyle=color;ctx.lineWidth=Math.max(.05,item.size*.05);if(style.underline??el.underline){ctx.beginPath();ctx.moveTo(tx,ty+item.size);ctx.lineTo(tx+measured,ty+item.size);ctx.stroke();}if(style.strike??el.strike){ctx.beginPath();ctx.moveTo(tx,ty+item.size*.5);ctx.lineTo(tx+measured,ty+item.size*.5);ctx.stroke();}}ctx.restore();tx+=item.width+(gaps.get(item)||0);}});ctx.restore();
  }
  function drawFormattedTextCanvas(ctx,el,text,x,y){
    if(el.text_align==='justify'||el.letter_spacing_mm)return drawFormattedTextRangesCanvas(ctx,el,text,x,y,[]);
    const l=formattedTextLayout(el,text),bg=el.text_inverse?'#000':el.text_background||'none',color=el.text_inverse?'#fff':el.text_color||'#111';
    ctx.save();ctx.globalAlpha*=el.text_opacity??1;if(bg!=='none'){ctx.fillStyle=bg;ctx.fillRect(x,y,l.w,l.h);}
    if(el.stroke_color&&Number(el.thickness_mm)>0){ctx.strokeStyle=el.stroke_color;ctx.lineWidth=Number(el.thickness_mm);ctx.setLineDash(el.line_style==='dash'?[2,1]:el.line_style==='dot'?[.4,.8]:[]);ctx.strokeRect(x,y,l.w,l.h);}
    ctx.fillStyle=color;ctx.font=`${el.italic?'italic ':''}${el.bold?'700':'400'} ${l.fontSize}px "${l.family}"`;if('fontVariantCaps' in ctx)ctx.fontVariantCaps=el.small_caps?'small-caps':'normal';ctx.textBaseline='top';
    const align=el.text_align||'left';ctx.textAlign=align==='right'?'right':align==='center'?'center':'left';
    l.lines.forEach((line,i)=>{const tx=x+(align==='right'?l.w:align==='center'?l.w/2:0),ty=y+l.offset+l.supOffset+i*l.fontSize*l.spacing;ctx.save();if(l.widthScale!==1){ctx.translate(tx,0);ctx.scale(l.widthScale,1);ctx.translate(-tx,0);}if(el.text_outline){ctx.strokeStyle=el.text_outline_color||'#111111';ctx.lineWidth=Math.max(.01,Number(el.text_outline_width_pt)||.5)*25.4/72;ctx.lineJoin='round';ctx.strokeText(line,tx,ty);}ctx.fillText(line,tx,ty);ctx.restore();
      if(el.underline||el.strike){const width=ctx.measureText(line).width*l.widthScale,start=tx-(align==='right'?width:align==='center'?width/2:0);ctx.strokeStyle=color;ctx.lineWidth=Math.max(.05,l.fontSize*.05);ctx.setLineDash([]);for(const offset of [el.underline?l.fontSize:0,el.strike?l.fontSize*.5:0].filter(Boolean)){ctx.beginPath();ctx.moveTo(start,ty+offset);ctx.lineTo(start+width,ty+offset);ctx.stroke();}}
    });ctx.restore();
  }
  function lineDash(el){return el.line_style==='dash'?' stroke-dasharray="2 1"':el.line_style==='dot'?' stroke-dasharray="0.4 0.8"':'';}
  function barcodeBars(value, x, y, totalW, h) {
    const seedStr = value || '000';
    let bars = '';
    let cursor = x;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 100000;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    while (cursor < x + totalW - 0.3) {
      const w = 0.25 + rnd() * 0.6;
      if (rnd() > 0.4) {
        bars += `<rect x="${cursor.toFixed(2)}" y="${y}" width="${w.toFixed(2)}" height="${h}" fill="#111"/>`;
      }
      cursor += w + 0.2;
    }
    return bars;
  }

  function qrBox(value, x, y, size, qrCache) {
    const m = qrCache && qrCache[value];
    if (m && m.size) {
      const n = m.size;
      const cell = size / n;
      let cells = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fff"/>`;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (m.data[r * n + c]) {
            cells += `<rect x="${(x + c * cell).toFixed(3)}" y="${(y + r * cell).toFixed(3)}" width="${(cell + 0.02).toFixed(3)}" height="${(cell + 0.02).toFixed(3)}" fill="#111"/>`;
          }
        }
      }
      return cells;
    }
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fff" stroke="#111" stroke-width="0.2"/>` +
      `<text x="${(x + size / 2).toFixed(2)}" y="${(y + size / 2).toFixed(2)}" font-size="${(size / 6).toFixed(2)}" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8">QR</text>`;
  }
  function matrixBox(matrix,x,y,size){
    let cells=`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fff"/>`;
    for(let row=0;row<matrix.height;row++)for(let column=0;column<matrix.width;column++)if(matrix.data[row*matrix.width+column])cells+=`<rect x="${(x+column*size/matrix.width).toFixed(3)}" y="${(y+row*size/matrix.height).toFixed(3)}" width="${(size/matrix.width+.02).toFixed(3)}" height="${(size/matrix.height+.02).toFixed(3)}" fill="#111"/>`;
    return cells;
  }

  function hriInkHeight(el,text,dpi){
    const hri=zebraHri(el,dpi),ctx=document.createElement('canvas').getContext('2d');
    ctx.font=`${hri.hMm*96/25.4}px "Arial Narrow", Arial, Helvetica, sans-serif`;ctx.textBaseline='hanging';
    const descent=ctx.measureText(String(text)).actualBoundingBoxDescent;
    return Number.isFinite(descent)&&descent>0?descent*25.4/96:hri.hMm;
  }
  function hriText(x, w, y, barH, text, el, dpi) {
    const hri = zebraHri(el, dpi);
    const boxHeight=Math.max(hri.hMm,Number(el.hri_box_height_mm)||hri.hMm),alignment=el.vertical_align||'top';
    const alignOffset=(boxHeight-hri.hMm)*(alignment==='middle'?.5:alignment==='bottom'?1:0);
    const ty = y + barH + hri.gapMm + Math.max(-hri.gapMm, Number(el.hri_offset_mm) || 0);
    if(el.font_family)return renderFormattedText({...el,text_align:el.hri_align||el.text_align||'center',text_box_width_mm:w,text_box_height_mm:boxHeight},text,x,ty);
    const align=el.hri_align||'center',tx=align==='left'?x:align==='right'?x+w:x+w/2,anchor=align==='left'?'start':align==='right'?'end':'middle';
    const measure=document.createElement('canvas').getContext('2d');measure.font=`${hri.hMm*96/25.4}px "Arial Narrow", Arial, Helvetica, sans-serif`;
    const textWidthMm=measure.measureText(String(text)).width*25.4/96,fit=textWidthMm>w?` textLength="${w.toFixed(2)}" lengthAdjust="spacingAndGlyphs"`:'';
    const bg=el.text_inverse?'#000':el.text_background||'none',color=el.text_inverse?'#fff':el.text_color||'#111';
    const textY=ty+alignOffset;
    return `<rect data-text-background="true" x="${x}" y="${ty.toFixed(2)}" width="${w}" height="${(alignOffset+hriInkHeight(el,text,dpi)).toFixed(2)}" fill="${esc(bg)}"/><text x="${tx.toFixed(2)}" y="${textY.toFixed(2)}" font-size="${hri.hMm.toFixed(2)}" font-family="Arial Narrow, Arial, Helvetica, sans-serif" font-stretch="normal" text-anchor="${anchor}"${fit} dominant-baseline="hanging" fill="${esc(color)}">${esc(text)}</text>`;
  }

  function linearBarcode(el, dpi, data) {
    const x = Number(el.x_mm) || 0;
    const y = Number(el.y_mm) || 0;
    const size = symbolSize(el, dpi, data);
    const text = size.text;
    const h = size.barH;
    const moduleMm = size.moduleMm;
    let out = '', w = size.w, label = size.label;
    if (typeof window !== 'undefined' && window.Barcode) {
      let r;
      if (el.type === 'ean13') {
        r = window.Barcode.ean13SVG(text, x, y, h, moduleMm);
        if (!r) r = window.Barcode.code128SVG(text, x, y, h, moduleMm);
      }
      else if (el.type === 'code93') r = window.Barcode.code93SVG(text, x, y, h, moduleMm);
      else if (el.type === 'code39') r = window.Barcode.code39SVG(text, x, y, h, moduleMm);
      else r = window.Barcode.code128SVG(text, x, y, h, moduleMm);
      if (r) { out = r.svg; w = r.width; if (r.digits) label = r.digits; }
    }
    if (!out) {
      out = barcodeBars(text, x, y, w, h);
    }
    label=data?.['$qlabel.sources']?.objects?.[el.id]?.hriText??label;
    if(el.text_inverse)out=out.replace(/fill="(?:#111|#000|black)"/g,'fill="#fff"');
    const showText=el.show_text!==false,hri=zebraHri(el,dpi),offset=Math.max(-hri.gapMm,Number(el.hri_offset_mm)||0);
    const textY=y+h+hri.gapMm+offset,textHeight=showText?(el.font_family?size.hriBoxHeight:hriInkHeight(el,label,dpi)+(size.hriBoxHeight-hri.hMm)*(el.vertical_align==='middle'?.5:el.vertical_align==='bottom'?1:0)):0;
    const bg=el.text_inverse?'#000':el.text_background||'none';
    if(bg!=='none'){
      const textOnly=el.barcode_fill_scope==='text'&&showText,bgY=textOnly?textY:y,bgH=textOnly?textHeight:(showText?Math.max(h,textY-y+textHeight):h);
      out=`<rect data-barcode-background="true" data-fill-scope="${textOnly?'text':'all'}" x="${x}" y="${bgY}" width="${w}" height="${bgH}" fill="${esc(bg)}"/>`+out;
    }
    if(showText)out += `<g data-barcode-hri="true">${hriText(x, w, y, h, label, el, dpi)}</g>`;
    return out;
  }

  function tableAxisLengths(items, total) {
    const minOf=item=>Math.max(Number(item.min)||.1,Number(item.contentMin)||0),maxOf=item=>Math.max(minOf(item),Number(item.max)||254);
    const fixed=items.reduce((n,item)=>n+(item.mode==='Fixed'?Math.max(minOf(item),Math.min(maxOf(item),Number(item.size)||minOf(item))):0),0);
    const weight=items.reduce((n,item)=>n+(item.mode==='Auto'?Number(item.weight)||0:0),0);
    const sizes=items.map(item=>item.mode==='Fixed'?Math.max(minOf(item),Math.min(maxOf(item),Number(item.size)||minOf(item))):Math.max(minOf(item),Math.min(maxOf(item),(total-fixed)*(Number(item.weight)||0)/Math.max(1,weight))));
    const sum=sizes.reduce((total,size)=>total+size,0);
    if(sum<total&&sizes.length)sizes[sizes.length-1]+=total-sum;
    return sizes;
  }

  function renderTableSVG(el,data,options) {
    if(window.TableTools?.ensureContentFits?.(el)&&!options?.interactive)window.TableTools.bake(el,data);
    const model=el.table_model,rows=model.rows||[],columns=model.columns||[],values=model.values||[];
    const width=Math.max(.1,Number(el.width_mm)||1),height=Math.max(.1,Number(el.height_mm)||1);
    const rowHeights=tableAxisLengths(rows,height),columnWidths=tableAxisLengths(columns,width),resolvedValues=values.map(row=>row.map(value=>window.ObjectData.resolve({text:value},data||{})));
    const padding=Math.max(0,Number(model.padding)||0),fontSize=Math.max(.1,Number(model.fontSize)||3);
    const borderWidth=Math.max(.01,Number(model.stroke)||.35),fill=esc(el.text_inverse?'#000':model.fill||'#fff'),border=esc(model.border||'#000');
    let markup=`<rect x="${el.x_mm}" y="${el.y_mm}" width="${width}" height="${height}" fill="${fill}"/>`;
    let y=0;
    for(let r=0;r<rowHeights.length;r++){
      let x=0;
      for(let c=0;c<columnWidths.length;c++){
        const cellWidth=columnWidths[c],cellHeight=rowHeights[r],style=window.TableDesign.cell(model,r,c),cellStyle=model.cellStyles?.[r+','+c]||{},cellFontSize=Math.max(.1,Number(style.fontSize)||fontSize),rowAlign=String(style.verticalAlign||rows[r]?.align||el.vertical_align||'top').toLowerCase(),columnAlign=String(style.align||columns[c]?.align||el.text_align||'left').toLowerCase(),bold=Object.prototype.hasOwnProperty.call(cellStyle,'bold')?!!cellStyle.bold:!!(style.bold||el.bold),italic=Object.prototype.hasOwnProperty.call(cellStyle,'italic')?!!cellStyle.italic:!!el.italic,underline=Object.prototype.hasOwnProperty.call(cellStyle,'underline')?!!cellStyle.underline:!!el.underline,strike=Object.prototype.hasOwnProperty.call(cellStyle,'strike')?!!cellStyle.strike:!!el.strike;
        const anchor=columnAlign==='center'?'middle':columnAlign==='right'||columnAlign==='end'?'end':'start';
        markup+=`<rect x="${Number(el.x_mm)+x}" y="${Number(el.y_mm)+y}" width="${cellWidth}" height="${cellHeight}" fill="${esc(style.fill)}"/>`;
        const cellText=String(resolvedValues[r]?.[c]||''),cellRuns=model.cellTextStyles?.[r+','+c],textSpec={...el,font_family:style.fontFamily||el.font_family||'Arial',font_size_pt:cellFontSize*72/25.4,text_wrap:cellStyle.text_wrap??el.text_wrap??true,text_auto_fit:cellStyle.text_auto_fit??el.text_auto_fit??false,letter_spacing_mm:style.letter_spacing_mm||0,text_opacity:style.text_opacity??1,text_color:style.color,bold,italic,underline,strike,text_background:"none",text_box_width_mm:Math.max(.1,cellWidth-2*padding),text_box_height_mm:Math.max(.1,cellHeight-2*padding),text_align:columnAlign==='center'?'center':columnAlign==='right'||columnAlign==='end'?'right':columnAlign==='justify'?'justify':'left',vertical_align:rowAlign==='middle'||rowAlign==='center'?'middle':rowAlign==='bottom'||rowAlign==='end'?'bottom':'top'},text=cellRuns?.length?renderFormattedTextRanges(textSpec,cellText,padding,padding,cellRuns):renderFormattedText(textSpec,cellText,padding,padding);
        const cellMarkup=model.errors?.clip?`<svg x="${el.x_mm+x}" y="${el.y_mm+y}" width="${cellWidth}" height="${cellHeight}" viewBox="0 0 ${cellWidth} ${cellHeight}" overflow="hidden">${text}</svg>`:`<g transform="translate(${el.x_mm+x} ${el.y_mm+y})">${text}</g>`;
        markup+=`<g data-table-cell="${r},${c}">${cellMarkup}</g>`;x+=cellWidth;
      }
      y+=rowHeights[r];
    }
    for(const edge of window.TableDesign.edges(model,columnWidths,rowHeights)){
      const clamp=(v,max)=>Math.max(edge.width/2,Math.min(max-edge.width/2,v)),x0=Number(el.x_mm)||0,y0=Number(el.y_mm)||0;
      markup+=`<path d="M ${x0+clamp(edge.x1,width)} ${y0+clamp(edge.y1,height)} L ${x0+clamp(edge.x2,width)} ${y0+clamp(edge.y2,height)}" fill="none" stroke="${edge.style==='Erase'?'none':esc(edge.color)}" stroke-width="${edge.width}" stroke-dasharray="${window.TableDesign.dash(edge.style,edge.width).join(' ')}"/>`;
    }
    return markup;
  }

  function updateTableSVG(host,el,data){
    const m=el.table_model,rows=m.rows||[],columns=m.columns||[],width=Number(el.width_mm),height=Number(el.height_mm),x0=Number(el.x_mm)||0,y0=Number(el.y_mm)||0;
    const content=host.firstElementChild?.localName==='g'?host.firstElementChild:host;
    let nodes=host._tableLiveNodes;
    if(!nodes||nodes.content!==content){
      nodes={content,rects:[...content.querySelectorAll(':scope > rect')],cells:[...content.querySelectorAll(':scope > g[data-table-cell]')],paths:[...content.querySelectorAll(':scope > path')]};host._tableLiveNodes=nodes;
    }
    if(nodes.cells.length!==rows.length*columns.length||nodes.rects.length!==nodes.cells.length+1)return false;
    const attr=(node,key,value)=>{const next=String(value);if(node.getAttribute(key)!==next)node.setAttribute(key,next);};
    const rectangle=(node,x,y,w,h)=>{attr(node,'x',x);attr(node,'y',y);attr(node,'width',w);attr(node,'height',h);};
    const ws=tableAxisLengths(columns,width),hs=tableAxisLengths(rows,height),pad=Math.max(0,Number(m.padding)||0),font=Math.max(.1,Number(m.fontSize)||3);
    if(content!==host)attr(content,'transform',`rotate(${Number(el.rotation_deg)||0} ${x0+width/2} ${y0+height/2})`);
    rectangle(nodes.rects[0],x0,y0,width,height);
    let y=0,n=0;
    for(let r=0;r<rows.length;r++){
      let x=0;
      for(let c=0;c<columns.length;c++,n++){
        rectangle(nodes.rects[n+1],x0+x,y0+y,ws[c],hs[r]);
        const body=nodes.cells[n].firstElementChild,style=window.TableDesign.cell(m,r,c),overrides=m.cellStyles?.[r+','+c]||{},vertical=String(style.verticalAlign||rows[r].align||el.vertical_align||'top').toLowerCase(),align=String(style.align||columns[c].align||el.text_align||'left').toLowerCase();
        if(body.localName==='svg'){rectangle(body,x0+x,y0+y,ws[c],hs[r]);attr(body,'viewBox',`0 0 ${ws[c]} ${hs[r]}`);}else attr(body,'transform',`translate(${x0+x} ${y0+y})`);
        const spec={...el,font_family:style.fontFamily||el.font_family||'Arial',font_size_pt:(Number(style.fontSize)||font)*72/25.4,text_wrap:true,letter_spacing_mm:style.letter_spacing_mm||0,text_opacity:style.text_opacity??1,text_color:style.color,bold:Object.hasOwn(overrides,'bold')?!!overrides.bold:!!(style.bold||el.bold),italic:Object.hasOwn(overrides,'italic')?!!overrides.italic:!!el.italic,underline:Object.hasOwn(overrides,'underline')?!!overrides.underline:!!el.underline,strike:Object.hasOwn(overrides,'strike')?!!overrides.strike:!!el.strike,text_background:'none',text_box_width_mm:Math.max(.1,ws[c]-2*pad),text_box_height_mm:Math.max(.1,hs[r]-2*pad),text_align:align==='center'?'center':align==='right'||align==='end'?'right':align==='justify'?'justify':'left',vertical_align:vertical==='middle'||vertical==='center'?'middle':vertical==='bottom'||vertical==='end'?'bottom':'top'};
        const value=String(window.ObjectData.resolve({text:m.values[r]?.[c]||''},data||{})||''),layout=formattedTextLayout(spec,value);
        let textNodes=body._liveTexts||(body._liveTexts=[...body.querySelectorAll(':scope > text')]);
        if(textNodes.length!==layout.lines.length||textNodes.some((node,i)=>node.textContent!==(layout.lines[i]||' '))){body.innerHTML=renderFormattedText(spec,value,pad,pad);body._liveTexts=null;body._liveRects=null;}
        else{
          const backgrounds=body._liveRects||(body._liveRects=[...body.querySelectorAll(':scope > rect')]);
          for(const rect of backgrounds){attr(rect,'width',layout.w);attr(rect,'height',layout.h);}
          const tx=pad+(spec.text_align==='right'?layout.w:spec.text_align==='center'?layout.w/2:0);
          textNodes.forEach((node,i)=>{attr(node,'x',tx);attr(node,'y',pad+layout.offset+layout.supOffset+i*layout.fontSize*layout.spacing);attr(node,'font-size',layout.fontSize);if(layout.widthScale!==1)attr(node,'transform',`translate(${tx} 0) scale(${layout.widthScale} 1) translate(${-tx} 0)`);});
        }
        x+=ws[c];
      }
      y+=hs[r];
    }
    const edges=window.TableDesign.edges(m,ws,hs);if(edges.length!==nodes.paths.length)return false;
    edges.forEach((edge,i)=>{const clamp=(v,max)=>Math.max(edge.width/2,Math.min(max-edge.width/2,v)),path=nodes.paths[i],dash=window.TableDesign.dash(edge.style,edge.width);attr(path,'d',`M ${x0+clamp(edge.x1,width)} ${y0+clamp(edge.y1,height)} L ${x0+clamp(edge.x2,width)} ${y0+clamp(edge.y2,height)}`);attr(path,'stroke-width',edge.width);attr(path,'stroke',edge.style==='Erase'?'none':edge.color);attr(path,'stroke-dasharray',dash.length?dash.join(' '):'');});
    return true;
  }

  function renderElement(el, dpi, data, qrCache, options) {
    el=ObjectData.artwork?ObjectData.artwork(el,data):el;
    const x = Number(el.x_mm) || 0;
    const y = Number(el.y_mm) || 0;
    switch (el.type) {
      case 'image': {
        if (el.placeholder) return '';
        if(el.shape_preset&&window.ShapeTools)return window.ShapeTools.render(el,x,y);
        if (el.table_model) return renderTableSVG(el,data,options);
        const styledBarcode=el.font_family&&el.barcode_spec?.show_text!==false&&el.barcode_bars,barcodeText=el.barcode_display_text||el.barcode_spec?.text||'';
        const source=styledBarcode?{...el,...el.barcode_bars}:el;
        if(options?.editorPlaceholders&&window.LabelBitmap&&!window.LabelBitmap.isValidRaster(source)){
          const width=Math.max(.1,Number(el.width_mm)||1),height=Math.max(.1,Number(el.height_mm)||1);
          return `<g data-invalid-bitmap="true"><title>Invalid image bitmap. Replace or remove this image.</title>${renderEditorPicturePlaceholder(x,y,width,height,el.corner_radius_mm)}</g>`;
        }
        const barHeight=styledBarcode?Number(el.width_mm)*source.bitmap_height/source.bitmap_width:Number(el.height_mm);
        const b = window.LabelBitmap.raster(source, mmToDots(el.width_mm, dpi), mmToDots(barHeight, dpi));
        const d = dpi / 25.4;
        const transparentBackground=el.transparent_background===true||el.source_format==='svg'||(!el.barcode_spec&&el.transparent_background!==false)||/^TIS Mark\s/.test(String(el.label||''));
        const background=el.text_inverse?'#000':el.text_background||(transparentBackground?'none':'#fff');
        let backgroundHeight=b.height/d,backgroundY=y;
        if(styledBarcode){const labelHeight=formattedTextLayout({...el,text_box_width_mm:Number(el.width_mm)},barcodeText).h;backgroundHeight=barHeight+labelHeight;if(el.barcode_fill_scope==='text'){backgroundY=y+barHeight;backgroundHeight=labelHeight;}}
        let rects=background==='none'?'':`<rect data-barcode-background="true" data-fill-scope="${el.barcode_fill_scope==='text'?'text':'all'}" x="${x}" y="${backgroundY}" width="${b.width/d}" height="${backgroundHeight}" fill="${esc(background)}"/>`;
        window.LabelBitmap.runs(b, (px, py, w) => { rects += `<rect x="${x + px / d}" y="${y + py / d}" width="${w / d}" height="${1 / d}" fill="${el.text_inverse?'#fff':'#000'}"/>`; });
        if(styledBarcode)rects+=`<g data-barcode-hri="true">${renderFormattedText({...el,text_box_width_mm:Number(el.width_mm),text_align:el.hri_align||el.text_align||'center'},barcodeText,x,y+barHeight+(Number(el.hri_offset_mm)||0))}</g>`;
        if(el.barcode_border)rects+=`<rect data-barcode-border="true" x="${x}" y="${y}" width="${b.width/d}" height="${backgroundHeight}" fill="none" stroke="${esc(el.stroke_color||'#111111')}" stroke-width="${Math.max(.01,Number(el.thickness_mm)||.2)}"/>`;
        return rects;
      }
      case 'text': {
        const text = ObjectData.resolve(el, data);
        const scale=textScale(el),body=el.font_family?renderFormattedText(el,text,0,0):(()=>{const {fontSize,naturalWidth}=zebraTextStyle(el,dpi,text),color=el.text_inverse?'#fff':el.text_color||'#111',bg=el.text_inverse?'#000':el.text_background||'none';return `<rect data-text-background="true" x="0" y="0" width="${naturalWidth}" height="${el.height_mm||fontSize}" fill="${esc(bg)}"/><text x="0" y="0" font-size="${fontSize.toFixed(2)}" font-family="Arial, Helvetica, sans-serif" font-weight="400" dominant-baseline="hanging" fill="${esc(color)}">${esc(text)||' '}</text>`;})();
        return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.x} ${scale.y})">${body}</g>`;
      }
      case 'barcode128':
      case 'code39':
      case 'code93':
      case 'ean13':
        return linearBarcode(el, dpi, data);
      case 'datamatrix': {
        const text = ObjectData.resolve(el, data);
        const size = (el.magnification || 5) * 4;
        const prepared=data?.['$qlabel.sources']?.objects?.[el.id];if(prepared?.matrix)return matrixBox(prepared.matrix,x,y,size);
        const url = !prepared?.bytes&&qrCache && qrCache['dm:' + text];
        if (url) {
          return `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${url}" style="image-rendering:pixelated"/>`;
        }
        return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fff" stroke="#111" stroke-width="0.2"/>` +
          `<text x="${(x + size / 2).toFixed(2)}" y="${(y + size / 2).toFixed(2)}" font-size="${(size / 6).toFixed(2)}" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8">DM</text>`;
      }
      case 'qrcode': {
        const text = ObjectData.resolve(el, data);
        const size = Number(el.width_mm) || (el.magnification || 4) * 5;
        const prepared=data?.['$qlabel.sources']?.objects?.[el.id];if(prepared?.matrix)return matrixBox(prepared.matrix,x,y,size);
        return qrBox(text, x, y, size, prepared?.bytes?{}:qrCache);
      }
      case 'line': {
        const t = Math.max(0.1, Number(el.thickness_mm) || 0.3);
        const endpoints=window.LineGeometry?.endpoints(el)||[{x,y},{x:x+(Number(el.width_mm)||0),y:y+(Number(el.height_mm)||0)}];
        return `<line x1="${endpoints[0].x}" y1="${endpoints[0].y}" x2="${endpoints[1].x}" y2="${endpoints[1].y}" stroke="${el.line_style==='erase'?'none':esc(el.stroke_color||'#111')}" stroke-width="${t}" stroke-linecap="butt"${lineDash(el)}/>`;
      }
      case 'box': {
        const w = Number(el.width_mm) || 0;
        const h = Number(el.height_mm) || 0;
        const t = Math.max(0.1, Number(el.thickness_mm) || 0.3);
        const radius=Math.max(0,Math.min(w/2,h/2,Number(el.corner_radius_mm)||0));
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}"${radius?` rx="${radius}" ry="${radius}"`:''} fill="${esc(el.fill_color||'none')}" stroke="${el.line_style==='erase'?'none':esc(el.stroke_color||'#111')}" stroke-width="${t}"${lineDash(el)}/>`;
      }
      case 'ellipse': {
        const w = Number(el.width_mm) || 0, h = Number(el.height_mm) || 0;
        const t = Math.max(0.1, Number(el.thickness_mm) || 0.3);
        return `<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${Math.max(0,w-t)/2}" ry="${Math.max(0,h-t)/2}" fill="${esc(el.fill_color||'none')}" stroke="${el.line_style==='erase'?'none':esc(el.stroke_color||'#111')}" stroke-width="${t}"${lineDash(el)}/>`;
      }
      case 'inverse': {
        const w = Number(el.width_mm) || 0, h = Number(el.height_mm) || 0;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#111"/>`;
      }
      default:
        return '';
    }
  }

  function renderEditorPicturePlaceholder(x,y,w,h,radius=0){
    const stroke=Math.min(Math.min(w,h),Math.max(.25,Math.min(w,h)*.055)),inset=stroke/2,ix=x+inset,iy=y+inset,iw=Math.max(.1,w-stroke),ih=Math.max(.1,h-stroke);
    return `<g fill="none" stroke="#334155" stroke-width="${stroke}" stroke-linecap="square" stroke-linejoin="miter"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="${Math.max(0,Math.min(w/2,h/2,Number(radius)||0)-inset)}" ry="${Math.max(0,Math.min(w/2,h/2,Number(radius)||0)-inset)}"/><circle cx="${ix+iw*.35}" cy="${iy+ih*.34}" r="${Math.min(iw,ih)*.12}"/><path d="M${ix+iw*.12} ${iy+ih*.82}L${ix+iw*.46} ${iy+ih*.48}L${ix+iw*.62} ${iy+ih*.64}L${ix+iw*.73} ${iy+ih*.53}L${ix+iw*.9} ${iy+ih*.82}Z"/></g>`;
  }

  function renderPreviewSVG(template, data, enabledIndices, qrCache, extras) {
    const dpi = template.dpi || 203;
    const templateW = Number(template.width_mm) || 50, templateH = Number(template.height_mm) || 25;
    const paper=extras?.paperPage&&template.page?.enabled?template.page:null;
    const W = paper?Number(paper.width_mm)||templateW:templateW;
    const H = paper?Number(paper.height_mm)||templateH:templateH;
    // Design shows one continuous sheet from the paper origin. Layout offsets
    // remain available to the layout/print preview, rather than adding a UI inset.
    const designSheet=!!extras?.designSheet;
    const originX=paper?-(Number(paper.left_mm)||0):0,originY=paper?-(Number(paper.top_mm)||0):0;
    const enabledSet = Array.isArray(enabledIndices) ? new Set(enabledIndices) : null;
    const B = typeof window !== 'undefined' ? window.Barcode : null;
    let body = '';
    const imageClipDefs=[];
    const inverseDefs=[],inverseRegions=[];
    if (template.background) {
      const bg = { ...template.background, type: 'image', x_mm: 0, y_mm: 0, width_mm: templateW, height_mm: templateH };
      body += `<g opacity="${Math.max(0.1, Math.min(1, Number(template.background.opacity) || 0.5))}">${renderElement(bg, dpi, data, qrCache,{editorPlaceholders:!!extras?.editorPlaceholders})}</g>`;
    }
    const elementBoxes = computeBoxes(template, data);
    (template.elements || []).forEach((el, i) => {
      const on = enabledSet ? enabledSet.has(i) : el.enabled !== false;
      if (on) {
        const box = elementBoxes.find(item => item.index === i);
        const x = (Number(el.x_mm) || 0) + (Number(template.margin_mm?.left) || 0);
        const y = (Number(el.y_mm) || 0) + (Number(template.margin_mm?.top) || 0);
        const markup = el.placeholder&&extras?.editorPlaceholders
          ? renderEditorPicturePlaceholder(x,y,Number(el.width_mm)||24,Number(el.height_mm)||18,el.corner_radius_mm)
          : renderElement({ ...el, x_mm: x, y_mm: y }, dpi, data, qrCache,{editorPlaceholders:!!extras?.editorPlaceholders});
        const cornerRadius=el.type==='image'&&box?Math.max(0,Math.min(box.w/2,box.h/2,Number(el.corner_radius_mm)||0)):0;
        if(cornerRadius>0){imageClipDefs.push(`<clipPath id="image-corner-clip-${i}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${box.w}" height="${box.h}" rx="${cornerRadius}" ry="${cornerRadius}"/></clipPath>`);}
        const clippedMarkup=cornerRadius>0?`<g clip-path="url(#image-corner-clip-${i})">${markup}</g>`:markup;
        const angle = el.type==='line'?0:(Number(el.rotation_deg)||0),flipX=el.flip_x?-1:1,flipY=el.flip_y?-1:1;
        const transform=(angle||flipX<0||flipY<0)&&box?`translate(${(box.x+(Number.isFinite(el.rotation_pivot_x_mm)?el.rotation_pivot_x_mm:box.w/2)).toFixed(3)} ${(box.y+(Number.isFinite(el.rotation_pivot_y_mm)?el.rotation_pivot_y_mm:box.h/2)).toFixed(3)}) rotate(${angle}) scale(${flipX} ${flipY}) translate(${-(box.x+(Number.isFinite(el.rotation_pivot_x_mm)?el.rotation_pivot_x_mm:box.w/2)).toFixed(3)} ${-(box.y+(Number.isFinite(el.rotation_pivot_y_mm)?el.rotation_pivot_y_mm:box.h/2)).toFixed(3)})`:'';
        const positionedMarkup=transform?`<g transform="${transform}">${clippedMarkup}</g>`:clippedMarkup;
        body+=`<g data-label-element="${i}">${positionedMarkup}</g>`;
        if(el.type==='inverse'&&box){
          inverseRegions.push({x,y,w:box.w,h:box.h,transform});
        }else if(inverseRegions.length){
          const clipId=`inverse-clip-${i}`,filterId=`inverse-filter-${i}`;
          inverseDefs.push(`<clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">${inverseRegions.map(region=>`<rect x="${region.x}" y="${region.y}" width="${region.w}" height="${region.h}"${region.transform?` transform="${region.transform}"`:''}/>`).join('')}</clipPath><filter id="${filterId}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/></filter>`);
          body+=`<g data-inverse-element="${i}" clip-path="url(#${clipId})"><g filter="url(#${filterId})">${positionedMarkup}</g></g>`;
        }
      }
    });
    const m = template.margin_mm || {};
    const guide = extras && !designSheet && Object.values(m).some(v => Number(v) > 0) ? `<rect x="${m.left || 0}" y="${m.top || 0}" width="${Math.max(0, templateW - (m.left || 0) - (m.right || 0))}" height="${Math.max(0, templateH - (m.top || 0) - (m.bottom || 0))}" fill="none" stroke="#16a34a" stroke-width="0.2" stroke-dasharray="1 1"/>` : '';
    const before = ((extras && extras.before) || '') + (imageClipDefs.length||inverseDefs.length?`<defs>${imageClipDefs.join('')}${inverseDefs.join('')}</defs>`:'') + guide + renderShapeOutline(template,0,0,templateW,templateH,!!(extras?.shapePreview||(extras?.paperPage&&!designSheet)));
    const after = (paper&&!designSheet?`<rect class="template-boundary" x="0" y="0" width="${templateW}" height="${templateH}" fill="none" stroke="#94a3b8" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="4 3" pointer-events="none"/>`:'')+((extras && extras.after) || '');
    const viewport=extras?.exportViewport||extras?.printContentBounds;
    return `<svg class="visual overlay" viewBox="${viewport?`${viewport.x} ${viewport.y} ${viewport.w} ${viewport.h}`:`${originX} ${originY} ${W} ${H}`}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="${viewport?'none':'xMidYMid meet'}">
      ${extras?.transparentBackground?'':`<rect x="${originX}" y="${originY}" width="${W}" height="${H}" fill="#fff"/>`}
      ${before}
      ${body}
      ${after}
    </svg>`;
  }

  function renderShapeOutline(template,x,y,w,h,showGuide=false,unitScale=1){
    const shape=['rectangle','rounded','ellipse'].includes(template?.label_shape)?template.label_shape:'rectangle';
    if(!template?.print_border&&!showGuide)return '';
    const printed=!!template.print_border,stroke=printed?'#111':'#91a4bb',width=(printed?Math.max(.1,Number(template.border_width_mm)||.3):.25)*unitScale,dash=printed?'':' stroke-dasharray="1 0.7"';
    const attrs=`data-label-shape="${shape}" fill="none" stroke="${stroke}" stroke-width="${width}"${dash} pointer-events="none"`;
    if(shape==='ellipse')return `<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${Math.max(0,w-width)/2}" ry="${Math.max(0,h-width)/2}" ${attrs}/>`;
    if(shape==='rounded'){const radius=Math.min(w/2,h/2,Math.max(0,Number(template.corner_radius_mm??2))*unitScale);return `<rect x="${x+width/2}" y="${y+width/2}" width="${Math.max(0,w-width)}" height="${Math.max(0,h-width)}" rx="${radius}" ${attrs}/>`;}
    return `<rect x="${x+width/2}" y="${y+width/2}" width="${Math.max(0,w-width)}" height="${Math.max(0,h-width)}" ${attrs}/>`;
  }

  function drawBarsFromWidths(ctx, widths, x, y, h, modulePx) {
    let cursor = x;
    for (let i = 0; i < widths.length; i++) {
      const w = widths[i] * modulePx;
      if (i % 2 === 0) ctx.fillRect(cursor, y, w, h);
      cursor += w;
    }
    return cursor - x;
  }

  function drawFont0(ctx, text, x, y, hPx, wPx) {
    if (!text) return;
    ctx.save();
    ctx.fillStyle = '#111';
    let size = Math.max(1, hPx);
    const family = '400 ' + size + 'px Arial, Helvetica, sans-serif';
    ctx.font = family;
    let m = ctx.measureText('H');
    let cap = m.actualBoundingBoxAscent || size * 0.72;
    if (cap > 0.1) size *= (hPx * 0.9) / cap;
    ctx.font = '400 ' + size + 'px Arial, Helvetica, sans-serif';
    m = ctx.measureText('H');
    cap = m.actualBoundingBoxAscent || size * 0.72;
    const measured = ctx.measureText(text).width || 1;
    const sx = 1;
    ctx.textBaseline = 'alphabetic';
    ctx.scale(sx, 1);
    ctx.fillText(text, x / sx, y + cap);
    ctx.restore();
  }

  function drawHriPx(ctx, text, barX, barW, barBottom, el, dpi) {
    const hri = zebraHri(el, dpi);
    if(el.font_family){const offset=Math.max(-hri.gapMm,Number(el.hri_offset_mm)||0);ctx.save();ctx.scale(dpi/25.4,dpi/25.4);drawFormattedTextCanvas(ctx,{...el,text_box_width_mm:barW*25.4/dpi,text_align:el.hri_align||el.text_align||'center'},text,barX*25.4/dpi,barBottom*25.4/dpi+hri.gapMm+offset);ctx.restore();return;}
    ctx.save();
    ctx.fillStyle = '#111';
    let size = Math.max(1, hri.hDots);
    ctx.font = size + 'px "Arial Narrow", Arial, Helvetica, sans-serif';
    let m = ctx.measureText('H');
    let cap = m.actualBoundingBoxAscent || size * 0.72;
    if (cap > 0.1) size *= (hri.hDots * 0.88) / cap;
    ctx.font = size + 'px "Arial Narrow", Arial, Helvetica, sans-serif';
    m = ctx.measureText('H');
    cap = m.actualBoundingBoxAscent || size * 0.72;
    const align=el.hri_align||'center',baseX=align==='left'?barX:align==='right'?barX+barW:barX+barW/2;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, baseX, barBottom + hri.gapDots + mmToDots(Math.max(-hri.gapMm,Number(el.hri_offset_mm)||0),dpi) + cap, barW);
    ctx.restore();
  }

  function drawElementCanvas(ctx, el, dpi, data, qrCache) {
    el=ObjectData.artwork?ObjectData.artwork(el,data):el;
    const x = mmToDots(el.x_mm ?? el.x, dpi);
    const y = mmToDots(el.y_mm ?? el.y, dpi);
    switch (el.type) {
      case 'image': {
        const styledBarcode=el.font_family&&el.barcode_spec?.show_text!==false&&el.barcode_bars,source=styledBarcode?{...el,...el.barcode_bars}:el;
        const barcodeText=el.barcode_display_text||el.barcode_spec?.text||'',width=mmToDots(el.width_mm,dpi),barHeight=styledBarcode?Math.max(1,Math.round(width*source.bitmap_height/source.bitmap_width)):mmToDots(el.height_mm,dpi);
        const b=window.LabelBitmap.raster(source,width,barHeight),labelHeight=styledBarcode?mmToDots(formattedTextLayout({...el,text_box_width_mm:Number(el.width_mm)},barcodeText).h,dpi):0,totalHeight=barHeight+labelHeight;
        const transparentBackground=el.transparent_background===true||el.source_format==='svg'||(!el.barcode_spec&&!el.table_model&&!el.shape_preset&&el.transparent_background!==false)||/^TIS Mark\s/.test(String(el.label||''));
        const fill=el.text_inverse?'#000':el.text_background||(transparentBackground?'none':'#fff');
        if(fill!=='none'){ctx.fillStyle=fill;ctx.fillRect(x,y,b.width,totalHeight);}
        ctx.fillStyle = el.text_inverse?'#fff':'#000';
        window.LabelBitmap.runs(b, (px, py, w) => ctx.fillRect(x + px, y + py, w, 1));
        if(styledBarcode){ctx.save();ctx.scale(dpi/25.4,dpi/25.4);drawFormattedTextCanvas({...el,text_box_width_mm:Number(el.width_mm),text_align:el.hri_align||el.text_align||'center'},barcodeText,x*25.4/dpi,y*25.4/dpi+barHeight*25.4/dpi+(Number(el.hri_offset_mm)||0));ctx.restore();}
        if(el.barcode_border){ctx.strokeStyle=el.stroke_color||'#111111';ctx.lineWidth=Math.max(1,mmToDots(Number(el.thickness_mm)||.2,dpi));ctx.strokeRect(x+ctx.lineWidth/2,y+ctx.lineWidth/2,Math.max(0,b.width-ctx.lineWidth),Math.max(0,totalHeight-ctx.lineWidth));}
        break;
      }
      case 'text': {
        const text = ObjectData.resolve(el, data);
        const h = el.height_dots || mmToDots(el.height_mm || 3, dpi);
        const w = el.width_dots || mmToDots(el.width_mm || 3, dpi);
        const scale=textScale(el);ctx.save();ctx.translate(x,y);ctx.scale(scale.x,scale.y);
        if(el.font_family){ctx.scale(dpi/25.4,dpi/25.4);drawFormattedTextCanvas(ctx,el,text,0,0);}else drawFont0(ctx,text,0,0,h,w);
        ctx.restore();
        break;
      }
      case 'barcode128':
      case 'code39':
      case 'code93':
      case 'ean13': {
        const raw = ObjectData.resolve(el, data) || (el.type === 'ean13' ? '000000000000' : '000');
        const h = el.bar_height_dots || mmToDots(el.bar_height_mm || 10, dpi);
        const modulePx = zebraModuleDots(el);
        let barW = 0;
        let label = raw;
        ctx.fillStyle = '#111';
        if (typeof window !== 'undefined' && window.Barcode) {
          if (el.type === 'ean13') {
            const enc = window.Barcode.encodeEAN13(raw);
            if (enc) {
              label = enc.digits;
              for (let i = 0; i < enc.bits.length; i++) {
                if (enc.bits[i] === '1') ctx.fillRect(x + i * modulePx, y, modulePx, h);
              }
              barW = enc.bits.length * modulePx;
            } else {
              barW = drawBarsFromWidths(ctx, window.Barcode.encode128B(raw), x, y, h, modulePx);
            }
          } else {
            const widths = el.type === 'code39' ? window.Barcode.encode39(raw)
              : el.type === 'code93' ? window.Barcode.encode93(raw)
              : window.Barcode.encode128B(raw);
            barW = drawBarsFromWidths(ctx, widths, x, y, h, modulePx);
          }
        }
        if (!barW) barW = Math.max(20, raw.length * 2.2) * (dpi / 25.4);
        label=data?.['$qlabel.sources']?.objects?.[el.id]?.hriText??label;
        if (el.show_text !== false) drawHriPx(ctx, label, x, barW, y + h, el, dpi);
        break;
      }
      case 'qrcode': {
        const text = ObjectData.resolve(el, data);
        const size = mmToDots(Number(el.width_mm) || (el.magnification || 4) * 5, dpi);
        const prepared=data?.['$qlabel.sources']?.objects?.[el.id],m=prepared?.matrix?{size:prepared.matrix.width,data:prepared.matrix.data}:!prepared?.bytes&&qrCache&&qrCache[text];
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, size, size);
        if (m && m.size) {
          const cell = size / m.size;
          ctx.fillStyle = '#111';
          for (let r = 0; r < m.size; r++) {
            for (let c = 0; c < m.size; c++) {
              if (m.data[r * m.size + c]) {
                const left = Math.floor(c * cell), top = Math.floor(r * cell);
                ctx.fillRect(x + left, y + top, Math.floor((c + 1) * cell) - left, Math.floor((r + 1) * cell) - top);
              }
            }
          }
        } else {
          ctx.strokeStyle = '#111';
          ctx.strokeRect(x, y, size, size);
        }
        break;
      }
      case 'datamatrix': {
        const text = ObjectData.resolve(el, data);
        const size = mmToDots((el.magnification || 5) * 4, dpi);
        const prepared=data?.['$qlabel.sources']?.objects?.[el.id];
        if(prepared?.matrix){const matrix=prepared.matrix;ctx.fillStyle='#fff';ctx.fillRect(x,y,size,size);ctx.fillStyle='#111';for(let row=0;row<matrix.height;row++)for(let column=0;column<matrix.width;column++)if(matrix.data[row*matrix.width+column]){const left=Math.ceil(column*size/matrix.width),top=Math.ceil(row*size/matrix.height);ctx.fillRect(x+left,y+top,Math.ceil((column+1)*size/matrix.width)-left,Math.ceil((row+1)*size/matrix.height)-top);}break;}
        const url = !prepared?.bytes&&qrCache && qrCache['dm:' + text];
        if (url) {
          const im = new Image();
          im.src = url;
          if (im.complete && im.naturalWidth) ctx.drawImage(im, x, y, size, size);
        } else {
          ctx.strokeStyle = '#111';
          ctx.strokeRect(x, y, size, size);
        }
        break;
      }
      case 'line': {
        if(el.line_style==='erase')break;
        const w = mmToDots(el.width_mm, dpi);
        const h = mmToDots(el.height_mm, dpi);
        const t = Math.max(1, el.thickness_dots || mmToDots(el.thickness_mm || 0.3, dpi));
        ctx.strokeStyle = '#111';
        ctx.lineWidth = t;
        const dashUnit=dpi/25.4;ctx.setLineDash(el.line_style==='dash'?[2*dashUnit,dashUnit]:el.line_style==='dot'?[.4*dashUnit,.8*dashUnit]:[]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
        break;
      }
      case 'box': {
        const w = mmToDots(el.width_mm, dpi);
        const h = mmToDots(el.height_mm, dpi);
        const t = Math.max(1, el.thickness_dots || mmToDots(el.thickness_mm || 0.3, dpi));
        const radius=Math.max(0,Math.min(w/2,h/2,mmToDots(Number(el.corner_radius_mm)||0,dpi))),left=x+t/2,top=y+t/2,innerW=Math.max(0,w-t),innerH=Math.max(0,h-t);
        const fill=el.fill_color||'none';if(fill!=='none'){ctx.fillStyle=fill;if(radius&&ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,radius);ctx.fill();}else ctx.fillRect(x,y,w,h);}
        if(el.line_style==='erase')break;
        ctx.strokeStyle = '#111';ctx.lineWidth = t;
        const dashUnit=dpi/25.4;ctx.setLineDash(el.line_style==='dash'?[2*dashUnit,dashUnit]:el.line_style==='dot'?[.4*dashUnit,.8*dashUnit]:[]);
        if(radius&&ctx.roundRect){ctx.beginPath();ctx.roundRect(left,top,innerW,innerH,radius);ctx.stroke();}else ctx.strokeRect(left,top,innerW,innerH);
        break;
      }
      case 'ellipse': {
        const w=mmToDots(el.width_mm,dpi),h=mmToDots(el.height_mm,dpi);
        const t=Math.max(1,el.thickness_dots||mmToDots(el.thickness_mm||0.3,dpi));
        ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,Math.max(0,(w-t)/2),Math.max(0,(h-t)/2),0,0,Math.PI*2);const fill=el.fill_color||'none';if(fill!=='none'){ctx.fillStyle=fill;ctx.fill();}
        if(el.line_style==='erase')break;
        ctx.strokeStyle='#111';ctx.lineWidth=t;const dashUnit=dpi/25.4;ctx.setLineDash(el.line_style==='dash'?[2*dashUnit,dashUnit]:el.line_style==='dot'?[.4*dashUnit,.8*dashUnit]:[]);ctx.stroke();
        break;
      }
      case 'inverse': {
        const w=mmToDots(el.width_mm,dpi),h=mmToDots(el.height_mm,dpi);
        ctx.fillStyle='#111';ctx.fillRect(x,y,w,h);
        break;
      }
      default:
        break;
    }
  }

  function rasterizeCanvas(template, data, enabledIndices, qrCache) {
    const dpi = template.dpi || 203;
    const W = Math.max(1, mmToDots(template.width_mm || 50, dpi));
    const H = Math.max(1, mmToDots(template.height_mm || 25, dpi));
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    if(template.print_border){const t=Math.max(1,mmToDots(Number(template.border_width_mm)||.3,dpi)),shape=template.label_shape||'rectangle';ctx.save();ctx.strokeStyle='#111';ctx.lineWidth=t;ctx.beginPath();if(shape==='ellipse')ctx.ellipse(W/2,H/2,Math.max(0,(W-t)/2),Math.max(0,(H-t)/2),0,0,Math.PI*2);else if(shape==='rounded'){const r=Math.min(W/2,H/2,mmToDots(Number(template.corner_radius_mm??2),dpi));ctx.roundRect(t/2,t/2,Math.max(0,W-t),Math.max(0,H-t),r);}else ctx.rect(t/2,t/2,Math.max(0,W-t),Math.max(0,H-t));ctx.stroke();ctx.restore();}
    if (template.background) {
      ctx.globalAlpha = Math.max(0.1, Math.min(1, Number(template.background.opacity) || 0.5));
      drawElementCanvas(ctx, { ...template.background, type: 'image', x_mm: 0, y_mm: 0, width_mm: template.width_mm, height_mm: template.height_mm }, dpi, data, qrCache);
      ctx.globalAlpha = 1;
    }
    const enabledSet = Array.isArray(enabledIndices) ? new Set(enabledIndices) : null;
    const elementBoxes = computeBoxes(template, data);
    (template.elements || []).forEach((el, i) => {
      const on = enabledSet ? enabledSet.has(i) : el.enabled !== false;
      if (on) {
        const box = elementBoxes.find(item => item.index === i);
        const angle = Number(el.rotation_deg) || 0,flipX=el.flip_x?-1:1,flipY=el.flip_y?-1:1,cornerRadius=el.type==='image'&&box?Math.max(0,Math.min(box.w/2,box.h/2,Number(el.corner_radius_mm)||0)):0;
        if ((angle||flipX<0||flipY<0||cornerRadius>0) && box) {
          const d = dpi / 25.4, cx = (box.x + (Number.isFinite(el.rotation_pivot_x_mm)?el.rotation_pivot_x_mm:box.w/2)) * d, cy = (box.y + (Number.isFinite(el.rotation_pivot_y_mm)?el.rotation_pivot_y_mm:box.h/2)) * d;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle * Math.PI / 180); ctx.scale(flipX,flipY); ctx.translate(-cx, -cy);
          if(cornerRadius>0){const x=(Number(el.x_mm||0)+Number(template.margin_mm?.left||0))*d,y=(Number(el.y_mm||0)+Number(template.margin_mm?.top||0))*d,w=box.w*d,h=box.h*d,r=cornerRadius*d;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();}
        }
        drawElementCanvas(ctx, { ...el, x_mm: (Number(el.x_mm) || 0) + (Number(template.margin_mm?.left) || 0), y_mm: (Number(el.y_mm) || 0) + (Number(template.margin_mm?.top) || 0) }, dpi, data, qrCache);
        if ((angle||flipX<0||flipY<0||cornerRadius>0) && box) ctx.restore();
      }
    });
    canvas.className = 'visual';
    return canvas;
  }

  function computeBoxes(template, data) {
    const dpi = template.dpi || 203;
    const W = Number(template.width_mm) || 50;
    const B = typeof window !== 'undefined' ? window.Barcode : null;
    const boxes = [];
    (template.elements || []).forEach((el, index) => {
      const x = (Number(el.x_mm) || 0) + (Number(template.margin_mm?.left) || 0);
      const y = (Number(el.y_mm) || 0) + (Number(template.margin_mm?.top) || 0);
      let w = 4, h = 4;
      if (el.type === 'text') {
        const text = ObjectData.resolve(el, data) || 'testo';
        const { hmm, wmm, naturalWidth } = zebraTextStyle(el, dpi, text);
        h = Math.max(hmm, hmm * 0.9);
        w = Math.max(.1, naturalWidth);
        if(el.font_family){const layout=formattedTextLayout(el,text);w=layout.w;h=layout.h;}
        const scale=textScale(el);w*=scale.x;h*=scale.y;
      } else if (el.type === 'barcode128' || el.type === 'code39' || el.type === 'code93' || el.type === 'ean13') {
        const size = symbolSize(el, dpi, data);
        w = size.w;
        h = size.h;
      } else if (el.type === 'qrcode') {
        w = h = Number(el.width_mm) || (el.magnification || 4) * 5;
      } else if (el.type === 'datamatrix') {
        w = h = (el.magnification || 5) * 4;
      } else if (el.type === 'image') {
        w = Number(el.width_mm) || 1; h = Number(el.height_mm) || 1;
        if(el.font_family&&el.barcode_bars&&el.barcode_spec?.show_text!==false)h=w*el.barcode_bars.bitmap_height/el.barcode_bars.bitmap_width+formattedTextLayout({...el,text_box_width_mm:w},el.barcode_spec.text).h;
      } else if (el.type === 'box' || el.type === 'ellipse' || el.type === 'inverse' || el.type === 'line') {
        w = Number(el.width_mm) || 0; h = Math.max(Number(el.height_mm) || 0, el.thickness_mm || 0.3);
      }
      boxes.push({ index, type: el.type, x, y, w, h,rotationCenter:{x:x+(Number.isFinite(el.rotation_pivot_x_mm)?el.rotation_pivot_x_mm:w/2),y:y+(Number.isFinite(el.rotation_pivot_y_mm)?el.rotation_pivot_y_mm:h/2)} });
    });
    return boxes;
  }

  function designSheetSize(template, extras) {
    if(extras?.exportViewport){const v=extras.exportViewport,dpi=extras.exportDpi||template.dpi||203;return {widthMm:v.w,heightMm:v.h,dpi,width:Math.max(1,mmToDots(v.w,dpi)),height:Math.max(1,mmToDots(v.h,dpi))};}
    const page = extras?.paperPage && template.page?.enabled ? template.page : null;
    const widthMm = Number(page ? page.width_mm : template.width_mm) || 50;
    const heightMm = Number(page ? page.height_mm : template.height_mm) || 25;
    const dpi = template.dpi || 203;
    return { widthMm, heightMm, dpi, width: Math.max(1, mmToDots(widthMm, dpi)), height: Math.max(1, mmToDots(heightMm, dpi)) };
  }

  function canvasToGraphicBytes(canvas) {
    const width = canvas.width, height = canvas.height;
    const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    const stride = Math.ceil(width / 8);
    const bytes = new Uint8Array(stride * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114 < 128 && pixels[index + 3] > 127) {
        bytes[y * stride + (x >> 3)] |= 128 >> (x & 7);
      }
    }
    return { width, height, stride, bytes, hex: Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('') };
  }

  const embeddedFonts=new Map();
  async function fontStyles(template){
    const families=new Set((template.elements||[]).map(e=>e.font_family).filter(Boolean));let css='';
    for(const sheet of document.styleSheets){let rules;try{rules=sheet.cssRules;}catch{continue;}
      for(const rule of rules||[]){if(rule.type!==CSSRule.FONT_FACE_RULE)continue;
        const family=rule.style.fontFamily.replace(/^["']|["']$/g,'');if(!families.has(family))continue;
        const match=rule.style.src.match(/url\(["']?([^"')]+)["']?\)/);if(!match)continue;
        const url=new URL(match[1],sheet.href||document.baseURI).href;
        if(!embeddedFonts.has(url))embeddedFonts.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Could not load print font');return r.blob();}).then(blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);})).catch(error=>{embeddedFonts.delete(url);throw error;}));
        css+=`@font-face{font-family:"${family}";src:url("${await embeddedFonts.get(url)}")}`;
      }
    }return css;
  }
  async function rasterizeDesignSheetCanvas(template, data, enabledIndices, qrCache, extras) {
    const size = designSheetSize(template, extras);
    if (size.width > 8192 || size.height > 8192 || size.width * size.height > 16000000) {
      throw new Error('Graphic object exceeds the print bitmap limit.');
    }
    await document.fonts.ready;
    const fonts=await fontStyles(template);
    let svg = renderPreviewSVG(template, data, enabledIndices, qrCache, {
      paperPage: !!extras?.paperPage,
      designSheet: extras?.designSheet !== false,
      ...(extras || {}),
    }).replace('<svg ', `<svg width="${size.width}" height="${size.height}" `);
    if(fonts)svg=svg.replace(/(<svg[^>]*>)/,'$1<style>'+esc(fonts)+'</style>');
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = async () => {
          try { if (image.decode) await image.decode(); } catch (_) {}
          resolve();
        };
        image.onerror = () => reject(new Error('Could not rasterize the design page'));
        image.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d');
      if(!extras?.transparentBackground){ctx.fillStyle = '#fff';ctx.fillRect(0, 0, size.width, size.height);}
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, size.width, size.height);
      canvas.className = 'visual';
      if(extras?.printContentBounds&&!extras.inkViewportResolved&&window.PrintGeometry?.rasterInkViewport){
        const current=extras.printContentBounds;
        const refined=window.PrintGeometry.rasterInkViewport(template,current,ctx.getImageData(0,0,size.width,size.height));
        if(['x','y','w','h'].some(key=>Math.abs(refined[key]-current[key])>.001)){
          return await rasterizeDesignSheetCanvas(template,data,enabledIndices,qrCache,{...extras,printContentBounds:refined,inkViewportResolved:true});
        }
      }
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  window.LabelPreview = { renderPreviewSVG, renderElement, renderShapeOutline, rasterizeCanvas, rasterizeDesignSheetCanvas, canvasToGraphicBytes, computeBoxes, drawFormattedTextCanvas, drawFormattedTextRangesCanvas, renderFormattedTextRanges, formattedRangeLines, updateTableSVG };
})();
