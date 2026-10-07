'use strict';

// Anteprima dell'etichetta allineata al comportamento Zebra (^A0, ^BY, ^BC).
// Disegna in millimetri (SVG) e in punti reali (canvas/PNG) con le stesse metriche.
(function () {
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

  // Larghezza modulo come impostata (anche decimale). Il riquadro di selezione
  // usa lo stesso valore, così le barre non escono dalle maniglie.
  function zebraModuleDots(el) {
    const n = Number(el && el.module_width);
    return Number.isFinite(n) && n > 0 ? Math.max(1, Math.round(n)) : 2;
  }

  function barcodeText(el, data) {
    const t = fillPlaceholders(el.text, data);
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
    if (el.show_text !== false) h += hri.gapMm + hriOffset + hri.hMm;
    return { text, label, barH: hMm, moduleMm, w, h, hri, hriOffset };
  }

  function zebraHri(el, dpi) {
    const dotsPerMm = (dpi || 203) / 25.4;
    return {
      hMm: 3,
      gapMm: 0.6,
      hDots: Math.round(3 * dotsPerMm),
      gapDots: Math.max(2, Math.round(0.6 * dotsPerMm)),
      mod: zebraModuleDots(el),
    };
  }

  function zebraTextStyle(el, dpi) {
    const hmm = el.height_mm || (el.height_dots ? (el.height_dots / dpi) * 25.4 : 3);
    const wmm = el.width_mm || (el.width_dots ? (el.width_dots / dpi) * 25.4 : hmm);
    const fontSize = hmm * 0.9;
    const natural = fontSize * 0.52;
    const target = wmm * 0.66;
    const scaleX = target / Math.max(0.01, natural);
    return { hmm, wmm, fontSize, scaleX };
  }

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

  function hriText(x, w, y, barH, text, el, dpi) {
    const hri = zebraHri(el, dpi);
    const ty = y + barH + hri.gapMm + Math.max(-hri.gapMm, Number(el.hri_offset_mm) || 0);
    return `<text x="${(x + w / 2).toFixed(2)}" y="${ty.toFixed(2)}" font-size="${hri.hMm.toFixed(2)}" font-family="Arial Narrow, Arial, Helvetica, sans-serif" font-stretch="normal" text-anchor="middle" dominant-baseline="hanging" fill="#111">${esc(text)}</text>`;
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
    if (el.show_text !== false) out += hriText(x, w, y, h, label, el, dpi);
    return out;
  }

  function renderElement(el, dpi, data, qrCache) {
    const x = Number(el.x_mm) || 0;
    const y = Number(el.y_mm) || 0;
    switch (el.type) {
      case 'image': {
        const b = window.LabelBitmap.raster(el, mmToDots(el.width_mm, dpi), mmToDots(el.height_mm, dpi));
        const d = dpi / 25.4;
        let rects = `<rect x="${x}" y="${y}" width="${b.width / d}" height="${b.height / d}" fill="#fff"/>`;
        window.LabelBitmap.runs(b, (px, py, w) => { rects += `<rect x="${x + px / d}" y="${y + py / d}" width="${w / d}" height="${1 / d}" fill="#000"/>`; });
        return rects;
      }
      case 'text': {
        const text = fillPlaceholders(el.text, data);
        const { fontSize, scaleX } = zebraTextStyle(el, dpi);
        return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scaleX.toFixed(3)} 1)"><text x="0" y="0" font-size="${fontSize.toFixed(2)}" font-family="Arial Narrow, Arial, Helvetica, sans-serif" font-weight="600" dominant-baseline="hanging" fill="#111">${esc(text) || ' '}</text></g>`;
      }
      case 'barcode128':
      case 'code39':
      case 'code93':
      case 'ean13':
        return linearBarcode(el, dpi, data);
      case 'datamatrix': {
        const text = fillPlaceholders(el.text, data);
        const size = (el.magnification || 5) * 4;
        const url = qrCache && qrCache['dm:' + text];
        if (url) {
          return `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${url}" style="image-rendering:pixelated"/>`;
        }
        return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#fff" stroke="#111" stroke-width="0.2"/>` +
          `<text x="${(x + size / 2).toFixed(2)}" y="${(y + size / 2).toFixed(2)}" font-size="${(size / 6).toFixed(2)}" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8">DM</text>`;
      }
      case 'qrcode': {
        const text = fillPlaceholders(el.text, data);
        const size = Number(el.width_mm) || (el.magnification || 4) * 5;
        return qrBox(text, x, y, size, qrCache);
      }
      case 'line': {
        const w = Number(el.width_mm) || 0;
        const h = Number(el.height_mm) || 0;
        const t = Math.max(0.1, Number(el.thickness_mm) || 0.3);
        return `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="#111" stroke-width="${t}" stroke-linecap="butt"/>`;
      }
      case 'box': {
        const w = Number(el.width_mm) || 0;
        const h = Number(el.height_mm) || 0;
        const t = Math.max(0.1, Number(el.thickness_mm) || 0.3);
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#111" stroke-width="${t}"/>`;
      }
      case 'ellipse': {
        const w = Number(el.width_mm) || 0, h = Number(el.height_mm) || 0;
        const t = Math.max(0.1, Number(el.thickness_mm) || 0.3);
        return `<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${Math.max(0,w-t)/2}" ry="${Math.max(0,h-t)/2}" fill="none" stroke="#111" stroke-width="${t}"/>`;
      }
      case 'inverse': {
        const w = Number(el.width_mm) || 0, h = Number(el.height_mm) || 0;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#111"/>`;
      }
      default:
        return '';
    }
  }

  function renderPreviewSVG(template, data, enabledIndices, qrCache, extras) {
    const dpi = template.dpi || 203;
    const W = Number(template.width_mm) || 50;
    const H = Number(template.height_mm) || 25;
    const enabledSet = Array.isArray(enabledIndices) ? new Set(enabledIndices) : null;
    let body = '';
    if (template.background) {
      const bg = { ...template.background, type: 'image', x_mm: 0, y_mm: 0, width_mm: W, height_mm: H };
      body += `<g opacity="${Math.max(0.1, Math.min(1, Number(template.background.opacity) || 0.5))}">${renderElement(bg, dpi, data, qrCache)}</g>`;
    }
    const elementBoxes = computeBoxes(template, data);
    (template.elements || []).forEach((el, i) => {
      const on = enabledSet ? enabledSet.has(i) : el.enabled !== false;
      if (on) {
        const box = elementBoxes.find(item => item.index === i);
        const x = (Number(el.x_mm) || 0) + (Number(template.margin_mm?.left) || 0);
        const y = (Number(el.y_mm) || 0) + (Number(template.margin_mm?.top) || 0);
        const markup = renderElement({ ...el, x_mm: x, y_mm: y }, dpi, data, qrCache);
        const angle = Number(el.rotation_deg) || 0;
        if (angle && box) body += `<g data-label-element="${i}"><g transform="rotate(${angle} ${(box.x + box.w / 2).toFixed(3)} ${(box.y + box.h / 2).toFixed(3)})">${markup}</g></g>`;
        else body += `<g data-label-element="${i}">${markup}</g>`;
      }
    });
    const m = template.margin_mm || {};
    const guide = extras && Object.values(m).some(v => Number(v) > 0) ? `<rect x="${m.left || 0}" y="${m.top || 0}" width="${Math.max(0, W - (m.left || 0) - (m.right || 0))}" height="${Math.max(0, H - (m.top || 0) - (m.bottom || 0))}" fill="none" stroke="#e57a16" stroke-width="0.2" stroke-dasharray="1 1"/>` : '';
    const before = ((extras && extras.before) || '') + guide;
    const after = (extras && extras.after) || '';
    return `<svg class="visual overlay" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>
      ${before}
      ${body}
      ${after}
    </svg>`;
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
    const family = '600 ' + size + 'px "Arial Narrow", Arial, Helvetica, sans-serif';
    ctx.font = family;
    let m = ctx.measureText('H');
    let cap = m.actualBoundingBoxAscent || size * 0.72;
    if (cap > 0.1) size *= (hPx * 0.9) / cap;
    ctx.font = '600 ' + size + 'px "Arial Narrow", Arial, Helvetica, sans-serif';
    m = ctx.measureText('H');
    cap = m.actualBoundingBoxAscent || size * 0.72;
    const measured = ctx.measureText(text).width || 1;
    const targetW = Math.max(1, text.length * wPx * 0.66);
    const sx = targetW / measured;
    ctx.textBaseline = 'alphabetic';
    ctx.scale(sx, 1);
    ctx.fillText(text, x / sx, y + cap);
    ctx.restore();
  }

  function drawHriPx(ctx, text, barX, barW, barBottom, el, dpi) {
    const hri = zebraHri(el, dpi);
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
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, barX + barW / 2, barBottom + hri.gapDots + cap);
    ctx.restore();
  }

  function drawElementCanvas(ctx, el, dpi, data, qrCache) {
    const x = mmToDots(el.x_mm ?? el.x, dpi);
    const y = mmToDots(el.y_mm ?? el.y, dpi);
    switch (el.type) {
      case 'image': {
        const b = window.LabelBitmap.raster(el, mmToDots(el.width_mm, dpi), mmToDots(el.height_mm, dpi));
        ctx.fillStyle = '#fff'; ctx.fillRect(x, y, b.width, b.height);
        ctx.fillStyle = '#000';
        window.LabelBitmap.runs(b, (px, py, w) => ctx.fillRect(x + px, y + py, w, 1));
        break;
      }
      case 'text': {
        const text = fillPlaceholders(el.text, data);
        const h = el.height_dots || mmToDots(el.height_mm || 3, dpi);
        const w = el.width_dots || mmToDots(el.width_mm || 3, dpi);
        drawFont0(ctx, text, x, y, h, w);
        break;
      }
      case 'barcode128':
      case 'code39':
      case 'code93':
      case 'ean13': {
        const raw = fillPlaceholders(el.text, data) || (el.type === 'ean13' ? '000000000000' : '000');
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
        if (el.show_text !== false) drawHriPx(ctx, label, x, barW, y + h, el, dpi);
        break;
      }
      case 'qrcode': {
        const text = fillPlaceholders(el.text, data);
        const size = mmToDots(Number(el.width_mm) || (el.magnification || 4) * 5, dpi);
        const m = qrCache && qrCache[text];
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
        const text = fillPlaceholders(el.text, data);
        const size = mmToDots((el.magnification || 5) * 4, dpi);
        const url = qrCache && qrCache['dm:' + text];
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
        const w = mmToDots(el.width_mm, dpi);
        const h = mmToDots(el.height_mm, dpi);
        const t = Math.max(1, el.thickness_dots || mmToDots(el.thickness_mm || 0.3, dpi));
        ctx.strokeStyle = '#111';
        ctx.lineWidth = t;
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
        ctx.strokeStyle = '#111';
        ctx.lineWidth = t;
        ctx.strokeRect(x + t / 2, y + t / 2, Math.max(0, w - t), Math.max(0, h - t));
        break;
      }
      case 'ellipse': {
        const w=mmToDots(el.width_mm,dpi),h=mmToDots(el.height_mm,dpi);
        const t=Math.max(1,el.thickness_dots||mmToDots(el.thickness_mm||0.3,dpi));
        ctx.strokeStyle='#111';ctx.lineWidth=t;ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,Math.max(0,(w-t)/2),Math.max(0,(h-t)/2),0,0,Math.PI*2);ctx.stroke();
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
        const angle = Number(el.rotation_deg) || 0;
        if (angle && box) {
          const d = dpi / 25.4, cx = (box.x + box.w / 2) * d, cy = (box.y + box.h / 2) * d;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle * Math.PI / 180); ctx.translate(-cx, -cy);
        }
        drawElementCanvas(ctx, { ...el, x_mm: (Number(el.x_mm) || 0) + (Number(template.margin_mm?.left) || 0), y_mm: (Number(el.y_mm) || 0) + (Number(template.margin_mm?.top) || 0) }, dpi, data, qrCache);
        if (angle && box) ctx.restore();
      }
    });
    canvas.className = 'visual';
    return canvas;
  }

  function computeBoxes(template, data) {
    const dpi = template.dpi || 203;
    const boxes = [];
    (template.elements || []).forEach((el, index) => {
      const x = (Number(el.x_mm) || 0) + (Number(template.margin_mm?.left) || 0);
      const y = (Number(el.y_mm) || 0) + (Number(template.margin_mm?.top) || 0);
      let w = 4, h = 4;
      if (el.type === 'text') {
        const text = fillPlaceholders(el.text, data) || 'testo';
        const { hmm, wmm } = zebraTextStyle(el, dpi);
        h = Math.max(4, hmm * 0.9);
        w = Math.max(6, text.length * wmm * 0.66);
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
      } else if (el.type === 'box' || el.type === 'ellipse' || el.type === 'inverse' || el.type === 'line') {
        w = Number(el.width_mm) || 0; h = Math.max(Number(el.height_mm) || 0, el.thickness_mm || 0.3);
      }
      boxes.push({ index, type: el.type, x, y, w, h });
    });
    return boxes;
  }

  window.LabelPreview = { renderPreviewSVG, rasterizeCanvas, computeBoxes };
})();
