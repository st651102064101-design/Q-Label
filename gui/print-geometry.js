'use strict';
(function (root) {
  function printerDpi(name) {
    const match = String(name || '').match(/\b(203|300|600)\s*dpi\b/i);
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
    const dpi = connection && connection.type === 'printer' ? printerDpi(connection.printer) : null;
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
    const dots = Math.round(mm * dpi / 25.4 / (dpi === 600 ? 2 : 1));
    return Math.max(-120, Math.min(120, dots));
  }
  const api = { printerDpi, normalizeTemplate, fitToPrinterPrintableArea, printerLabelTopMm, printerLabelTopDots };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PrintGeometry = api;
})(typeof window !== 'undefined' ? window : globalThis);
