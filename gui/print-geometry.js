'use strict';
(function (root) {
  function printerDpi(name) {
    const match = String(name || '').match(/\b(203|300|600)\s*dpi\b/i);
    // ZT411's nominal 600 dpi head reports 24 dots/mm (609.6 dpi).
    if(match && Number(match[1])===600 && /\bZT411\b/i.test(String(name)))return 609.6;
    return match ? Number(match[1]) : null;
  }
  function normalizeTemplate(template, connection) {
    const out = JSON.parse(JSON.stringify(template));
    for (const item of out.elements || []) {
      if (item.type === 'qrcode' && !Number(item.width_mm)) item.width_mm = (Number(item.magnification) || 4) * 5;
      for (const [dots, mm] of [['height_dots', 'height_mm'], ['width_dots', 'width_mm'], ['bar_height_dots', 'bar_height_mm'], ['thickness_dots', 'thickness_mm']]) {
        if (Number(item[dots]) > 0) {
          if (item[mm] == null) item[mm] = Number(item[dots]) * 25.4 / (Number(out.dpi) || 203);
          delete item[dots];
        }
      }
    }
    const dpi = Number(connection?.resolution_dpi)>0?Number(connection.resolution_dpi):connection && connection.type === 'printer' ? printerDpi(connection.printer) : null;
    // Keep the print origin aligned with the editor. Any calibration must be
    // explicit per printer; silently shifting the whole format clips bottom items.
    if (out.print_offset_y_mm == null) out.print_offset_y_mm = 0;
    if (!dpi || dpi === Number(out.dpi)) return out;
    const ratio = dpi / (Number(out.dpi) || 203);
    for (const item of out.elements || []) {
      if (['barcode128', 'code39', 'code93', 'ean13'].includes(item.type)) {
        item.module_width = Math.max(1, Math.round((Number(item.module_width) || 2) * ratio));
      }
    }
    out.dpi = dpi;
    return out;
  }
  // Scale full-page content into a symmetric printable area. Vertical printer
  // calibration shifts the content, so compensate the top/bottom page margins
  // in opposite directions to keep the final printed margins balanced.
  function fitToPrinterPrintableArea(template, marginMm = 1.778, offsetYmm = 0) {
    const out = JSON.parse(JSON.stringify(template));
    const page = out.page;
    if (!page?.enabled) return out;
    const width = Number(out.width_mm), height = Number(out.height_mm);
    const paperW = Number(page.width_mm), paperH = Number(page.height_mm);
    const pageMargins = ['left_mm', 'right_mm', 'top_mm', 'bottom_mm'];
    const hasPageMargins = pageMargins.some((key) => Number(page[key]) > 0);
    const templateMargins = out.margin_mm || {};
    const hasTemplateMargins = ['left', 'right', 'top', 'bottom'].some((key) => Number(templateMargins[key]) > 0);
    const fullPageDesign = Math.abs(width - paperW) < 0.02 && Math.abs(height - paperH) < 0.02;
    if (!fullPageDesign || hasPageMargins || hasTemplateMargins || !(marginMm > 0)) return out;

    if(!Number.isFinite(offsetYmm))offsetYmm=0;
    const leftMargin=marginMm,rightMargin=marginMm;
    const topMargin=Math.max(0,marginMm-offsetYmm),bottomMargin=Math.max(0,marginMm+offsetYmm);
    const safeW = width - leftMargin - rightMargin, safeH = height - topMargin - bottomMargin;
    if (!(safeW > 0 && safeH > 0)) return out;
    const sx = safeW / width, sy = safeH / height;
    for (const item of out.elements || []) {
      item.x_mm = Number(item.x_mm ?? item.x ?? 0) * sx;
      item.y_mm = Number(item.y_mm ?? item.y ?? 0) * sy;
      for (const key of ['width_mm', 'thickness_mm']) if (item[key] != null) item[key] = Number(item[key]) * sx;
      for (const key of ['height_mm', 'bar_height_mm']) if (item[key] != null) item[key] = Number(item[key]) * sy;
      if (item.type === 'datamatrix') item.magnification = (Number(item.magnification) || 5) * Math.min(sx, sy);
      if (item.type === 'qrcode') {
        if (item.width_mm == null) item.width_mm = (Number(item.magnification) || 4) * 5 * sx;
      }
      if (['barcode128', 'code39', 'code93', 'ean13'].includes(item.type)) {
        item.module_width = (Number(item.module_width) || 2) * sx;
      }
    }
    out.width_mm = safeW;
    out.height_mm = safeH;
    out.margin_mm = { left: 0, top: 0, right: 0, bottom: 0 };
    page.left_mm = leftMargin;
    page.right_mm = rightMargin;
    page.top_mm = topMargin;
    page.bottom_mm = bottomMargin;
    return out;
  }
  function printerLabelTopMm(connection, settings = {}) {
    const key = connection.printer || `${connection.type}:${connection.ip || connection.usb || ''}`;
    const saved = settings.printerVerticalOffsets?.[key];
    // No hidden feed shift: neutral settings preserve the paper coordinates.
    const mm = saved == null ? 0 : Number(saved);
    if (!Number.isFinite(mm)) throw new Error('Invalid printer vertical offset');
    return mm;
  }
  function printerLabelTopDots(connection, dpi, settings = {}) {
    const mm = printerLabelTopMm(connection,settings);
    // Zebra 600 dpi firmware doubles ^LT values.
    const dots = Math.round(mm * dpi / 25.4 / (dpi >= 600 ? 2 : 1));
    return Math.max(-120, Math.min(120, dots));
  }
  // Design stores objects in template space. Page left/top is the paper origin,
  // so a field at x = -left_mm sits on the left edge of the sheet.
  function paperLayout(template) {
    const page = template && template.page && template.page.enabled ? template.page : null;
    const margin = (template && template.margin_mm) || {};
    return {
      originX: (page ? Number(page.left_mm) || 0 : 0) + (Number(margin.left) || 0),
      originY: (page ? Number(page.top_mm) || 0 : 0) + (Number(margin.top) || 0),
      paperW: Number(page ? page.width_mm : template && template.width_mm) || 0,
      paperH: Number(page ? page.height_mm : template && template.height_mm) || 0,
      templateW: Number(template && template.width_mm) || 0,
      templateH: Number(template && template.height_mm) || 0,
      cells: page ? Math.max(1, Number(page.rows) || 1) * Math.max(1, Number(page.columns) || 1) : 1,
    };
  }
  // Place a full-sheet bitmap so print origin + x_mm lands at paper (0, 0).
  function sheetImageElement(layout, graphic) {
    const multi = Number(layout.cells) > 1;
    return {
      type: 'image',
      x_mm: multi ? 0 : -(Number(layout.originX) || 0),
      y_mm: multi ? 0 : -(Number(layout.originY) || 0),
      width_mm: multi ? Number(layout.templateW || layout.paperW) : Number(layout.paperW),
      height_mm: multi ? Number(layout.templateH || layout.paperH) : Number(layout.paperH),
      bitmap_width: graphic.width,
      bitmap_height: graphic.height,
      bitmap_hex: graphic.hex,
    };
  }
  function fitSheetToMeasuredMedia(template,image){
    const media=template.print_media;if(!media)return {...template,print_border:false,print_background:false,elements:[image]};
    const width=Number(media.width_mm),height=Number(media.height_mm);
    if(!(width>0&&height>0))throw Error('Measured label width and height must be positive.');
    if(paperLayout(template).cells>1){
      // The raster contains one authored label, while the printer repeats that
      // label at each configured page cell. Fit only within this cell and keep
      // the physical paper layout intact.
      const cellWidth=Number(template.width_mm),cellHeight=Number(template.height_mm);
      const safeLeft=Math.max(0,Number(media.inset_left_mm)||0),safeRight=Math.max(0,Number(media.inset_right_mm)||0);
      const safeWidth=Math.max(1,Math.min(width,cellWidth)-safeLeft-safeRight),safeHeight=Math.max(1,Math.min(height,cellHeight));
      const scale=Math.min(safeWidth/image.width_mm,safeHeight/image.height_mm);
      const w=media.fit==='fill'?safeWidth:Math.min(safeWidth,image.width_mm*scale),h=media.fit==='fill'?safeHeight:Math.min(safeHeight,image.height_mm*scale);
      return {...template,print_border:false,print_background:false,elements:[{...image,x_mm:safeLeft+(safeWidth-w)/2,y_mm:(safeHeight-h)/2,width_mm:w,height_mm:h}]};
    }
    // Stock liner is outside the label; it must not shrink the label artwork.
    // Only explicitly configured printable insets reserve space inside a label.
    const safeLeft=Math.max(0,Number(media.inset_left_mm)||0),safeRight=Math.max(0,Number(media.inset_right_mm)||0);
    const safeWidth=Math.max(1,width-safeLeft-safeRight);
    const scale=Math.min(safeWidth/image.width_mm,height/image.height_mm);
    // Explicit fill maps the whole design to the measured sticker, without
    // cropping edge objects or reserving unused space for a different ratio.
    const w=media.fit==='fill'?safeWidth:Math.min(safeWidth,image.width_mm*scale),h=media.fit==='fill'?height:Math.min(height,image.height_mm*scale);
    return {...template,width_mm:width,height_mm:height,page:{enabled:false},margin_mm:{left:0,right:0,top:0,bottom:0},print_border:false,print_background:false,elements:[{...image,x_mm:safeLeft+(safeWidth-w)/2,y_mm:(height-h)/2,width_mm:w,height_mm:h}]};
  }
  // Include overflowing artwork before rasterization; fitting a cropped bitmap
  // afterwards cannot restore the bottom of a logo.
  function printContentBounds(template,boxes,indices){
    const layout=paperLayout(template),enabled=Array.isArray(indices)?new Set(indices):null;
    let left=-layout.originX,top=-layout.originY,right=left+layout.paperW,bottom=top+layout.paperH;
    for(const box of boxes){
      const el=template.elements[box.index];if(!el||el.enabled===false||(enabled&&!enabled.has(box.index)))continue;
      const ink=bitmapInkBounds(el);
      const area=ink?{x:box.x+ink.x*box.w,y:box.y+ink.y*box.h,w:ink.w*box.w,h:ink.h*box.h}:box;
      const a=(Number(el.rotation_deg)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),cx=box.x+box.w/2,cy=box.y+box.h/2;
      for(const [x,y] of [[area.x,area.y],[area.x+area.w,area.y],[area.x,area.y+area.h],[area.x+area.w,area.y+area.h]]){
        const rx=cx+(x-cx)*c-(y-cy)*s,ry=cy+(x-cx)*s+(y-cy)*c;
        left=Math.min(left,rx);top=Math.min(top,ry);right=Math.max(right,rx);bottom=Math.max(bottom,ry);
      }
    }
    return {x:left,y:top,w:right-left,h:bottom-top};
  }
  function bitmapInkBounds(el){
    const w=Number(el.bitmap_width),h=Number(el.bitmap_height),hex=el.bitmap_hex;
    if(el.type!=='image'||el.barcode_bars||!Number.isInteger(w)||!Number.isInteger(h)||!hex||hex.length!==Math.ceil(w/8)*h*2)return null;
    const stride=Math.ceil(w/8);let left=w,top=h,right=-1,bottom=-1;
    for(let y=0;y<h;y++)for(let bx=0;bx<stride;bx++){
      const byte=parseInt(hex.slice((y*stride+bx)*2,(y*stride+bx)*2+2),16);if(!byte)continue;
      for(let bit=0;bit<8;bit++){const x=bx*8+bit;if(x<w&&(byte&(128>>bit))){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
    }
    return right<0?{x:0,y:0,w:0,h:0}:{x:left/w,y:top/h,w:(right-left+1)/w,h:(bottom-top+1)/h};
  }
  // Keep the authored page, but discard invisible overflow from object boxes.
  // Use the same threshold as the final monochrome graphic.
  function rasterInkViewport(template,viewport,image){
    const layout=paperLayout(template);let left=-layout.originX,top=-layout.originY,right=left+layout.paperW,bottom=top+layout.paperH;
    const {width,height,data}=image;let minX=width,minY=height,maxX=-1,maxY=-1;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const p=(y*width+x)*4;
      if(data[p]*.299+data[p+1]*.587+data[p+2]*.114<128&&data[p+3]>127){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    }
    if(maxX>=0){left=Math.min(left,viewport.x+minX*viewport.w/width);top=Math.min(top,viewport.y+minY*viewport.h/height);right=Math.max(right,viewport.x+(maxX+1)*viewport.w/width);bottom=Math.max(bottom,viewport.y+(maxY+1)*viewport.h/height);}
    return {x:left,y:top,w:right-left,h:bottom-top};
  }
  const api = { printerDpi, normalizeTemplate, fitToPrinterPrintableArea, printerLabelTopMm, printerLabelTopDots, paperLayout, sheetImageElement, fitSheetToMeasuredMedia, printContentBounds, rasterInkViewport };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PrintGeometry = api;
})(typeof window !== 'undefined' ? window : globalThis);
