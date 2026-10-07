'use strict';
const bitmap = require('../gui/bitmap');
const QRCode = require('qrcode');
const Barcode = require('../gui/barcode');
const bwipjs = require('bwip-js');

/**
 * Costruttore di etichette ZPL per Zebra ZD410.
 * Converte un "template" JSON dinamico (misure in mm) + dati in un buffer ZPL pronto da inviare alla stampante.
 */

function mmToDots(mm, dpi) {
  return Math.round((Number(mm) || 0) * (dpi / 25.4));
}

function zebraModuleDots(el) {
  const n = Number(el && el.module_width);
  if (!Number.isFinite(n) || n <= 0) return 2;
  // Fractional modules are used only by the print-safe-area transform to
  // preserve the barcode's overall scale when fitting to label margins.
  return Math.max(1, n);
}

function hriStyle(dpi) {
  return {
    gap: mmToDots(0.6, dpi),
    height: mmToDots(3, dpi),
    width: mmToDots(3, dpi),
  };
}

// Sostituisce i placeholder {{campo}} con i valori presenti in data.
// Se un campo manca, lascia una stringa vuota (evita "{{undefined}}" in stampa).
function fillPlaceholders(str, data) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{\s*([\w.\-]+)\s*\}\}/g, (_, key) => {
    const val = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), data);
    return val === undefined || val === null ? '' : String(val);
  });
}

// In pratica per la maggior parte delle etichette (testo/numeri/date) non servono caratteri
// speciali ZPL nel contenuto. Usiamo una escape "soft": sostituiamo solo se il testo contiene
// davvero ^ o ~, altrimenti lasciamo il testo intatto per non complicare l'output.
function safeFieldData(text) {
  const s = String(text);
  if (s.includes('^') || s.includes('~')) {
    return s.replace(/\^/g, '').replace(/~/g, '');
  }
  return s;
}

// Editor measures text from the top of the box. ^FT uses the baseline, so
// the baseline is placed at yTop+height to keep the glyphs in that same box.
function appendText(lines, x, yTop, text, font, rotate, h, w) {
  if (rotate) {
    lines.push(`^FO${x},${yTop}`);
    lines.push(`^A${font}${rotate},${h},${w}`);
  } else {
    lines.push(`^FT${x},${yTop + h}`);
    lines.push(`^A${font}N,${h},${w}`);
  }
  lines.push(`^FD${text}^FS`);
}

function appendLinearBarcode(lines, el, dpi, x, y, text, cmd) {
  const height = el.bar_height_dots || mmToDots(el.bar_height_mm || 10, dpi);
  const moduleWidth = zebraModuleDots(el);
  let bits = [];
  if (el.type === 'ean13') {
    const encoded = Barcode.encodeEAN13(text);
    // Letters such as "TEST" are not an EAN-13. Skip this barcode so the
    // rest of the label still prints instead of failing the whole job.
    if (!encoded) return;
    text = encoded.digits;
    bits = Array.from(encoded.bits, bit => bit === '1');
  } else {
    const widths = el.type === 'code39' ? Barcode.encode39(text)
      : el.type === 'code93' ? Barcode.encode93(text) : Barcode.encode128B(text);
    widths.forEach((width, index) => { for (let i = 0; i < width; i++) bits.push(index % 2 === 0); });
  }
  const barW = bits.length * moduleWidth;
  const stride = Math.ceil(barW / 8);
  const row = Buffer.alloc(stride);
  for (let px = 0; px < barW; px++) {
    if (bits[Math.floor(px / moduleWidth)]) row[px >> 3] |= 0x80 >> (px & 7);
  }
  const bytes = Buffer.alloc(stride * height);
  for (let py = 0; py < height; py++) row.copy(bytes, py * stride);
  lines.push(`^FO${x},${y}^GFA,${bytes.length},${bytes.length},${stride},${bytes.toString('hex').toUpperCase()}^FS`);
  if (el.show_text !== false) {
    const hri = hriStyle(dpi);
    const fontH = hri.height;
    // Use a wider font cell so Zebra font 0 captions do not print visibly
    // condensed compared with the editor preview. ^BY from the bars stays in
    // effect and would magnify this text by the module width, so reset it.
    const fontW = Math.max(1, Math.round(fontH * 0.72));
    const offsetDots = Math.max(-hri.gap, mmToDots(Number(el.hri_offset_mm) || 0, dpi));
    const tyTop = y + height + hri.gap + offsetDots;
    lines.push('^BY1');
    // Place HRI by its top edge so the whole font cell ends at the label edge;
    // baseline placement left unused space below the caption on printed labels.
    lines.push(`^FO${x},${tyTop}`);
    lines.push(`^A0N,${fontH},${fontW}`);
    // Let the printer measure proportional glyphs and center them over bars.
    lines.push(`^FB${barW},1,0,C,0`);
    lines.push(`^FD${text}^FS`);
  }
}

function renderElement(el, dpi, data) {
  const x = mmToDots(el.x_mm ?? el.x, dpi);
  const y = mmToDots(el.y_mm ?? el.y, dpi);
  const lines = [];

  // Un codice a barre/QR con dato vuoto può bloccare la stampante: in quel caso salta l'elemento.
  const barcodeTypes = ['barcode128', 'code39', 'ean13', 'code93', 'qrcode', 'datamatrix'];
  if (barcodeTypes.includes(el.type)) {
    const t = safeFieldData(fillPlaceholders(el.text, data));
    if (!t || !t.trim()) return '';
  }

  switch (el.type) {
    case 'image': {
      const b = bitmap.raster(el, mmToDots(el.width_mm, dpi), mmToDots(el.height_mm, dpi));
      const hex = Buffer.from(b.bytes).toString('hex').toUpperCase();
      lines.push(`^FO${x},${y}^GFA,${b.bytes.length},${b.bytes.length},${b.stride},${hex}^FS`);
      break;
    }
    case 'text': {
      const text = safeFieldData(fillPlaceholders(el.text, data));
      const font = el.font || '0';
      const h = el.height_dots || mmToDots(el.height_mm || 3, dpi);
      const w = el.width_dots || mmToDots(el.width_mm || 3, dpi);
      appendText(lines, x, y, text, font, el.rotate, h, w);
      break;
    }
    case 'barcode128': {
      const text = safeFieldData(fillPlaceholders(el.text, data));
      appendLinearBarcode(lines, el, dpi, x, y, text, '^BCN,{h},N,N,N');
      break;
    }
    case 'code39': {
      const text = safeFieldData(fillPlaceholders(el.text, data));
      appendLinearBarcode(lines, el, dpi, x, y, text, '^B3N,N,{h},N,N');
      break;
    }
    case 'ean13': {
      const raw = safeFieldData(fillPlaceholders(el.text, data));
      const digits = raw.replace(/\D/g, '');
      if (Barcode.encodeEAN13(digits)) {
        appendLinearBarcode(lines, el, dpi, x, y, digits, '^BEN,{h},N,N');
      } else if (raw.trim()) {
        appendLinearBarcode(lines, { ...el, type: 'barcode128' }, dpi, x, y, raw, '^BCN,{h},N,N,N');
      }
      break;
    }
    case 'code93': {
      const text = safeFieldData(fillPlaceholders(el.text, data));
      appendLinearBarcode(lines, el, dpi, x, y, text, '^BAN,{h},N,N');
      break;
    }
    case 'datamatrix': {
      const text = safeFieldData(fillPlaceholders(el.text, data));
      const matrix = bwipjs.raw({
        bcid: 'datamatrix', text, scale: 1,
        padding: 0, paddingwidth: 0, paddingheight: 0,
        includetext: false,
      })[0];
      if (!matrix || !matrix.pixx || !matrix.pixy || !matrix.pixs) throw new Error('Unable to encode Data Matrix.');
      // The editor presents magnification as a physical symbol size (4 mm per
      // step). Native ^BX treats it as printer dots per module, which made the
      // printed symbol much smaller than its preview. Rasterize the same matrix
      // at the exact preview dimensions instead.
      const side = Math.max(1, Math.min(4096, mmToDots((Number(el.magnification) || 5) * 4, dpi)));
      const stride = Math.ceil(side / 8);
      const bytes = Buffer.alloc(stride * side);
      for (let py = 0; py < side; py++) {
        const row = Math.min(matrix.pixy - 1, Math.floor(py * matrix.pixy / side));
        for (let px = 0; px < side; px++) {
          const col = Math.min(matrix.pixx - 1, Math.floor(px * matrix.pixx / side));
          if (matrix.pixs[row * matrix.pixx + col]) bytes[py * stride + (px >> 3)] |= 0x80 >> (px & 7);
        }
      }
      lines.push(`^FO${x},${y}`);
      lines.push(`^GFA,${bytes.length},${bytes.length},${stride},${bytes.toString('hex').toUpperCase()}^FS`);
      break;
    }
    case 'qrcode': {
      const text = safeFieldData(fillPlaceholders(el.text, data));
      // Render the same matrix and physical size as the editor. ^BQ's native
      // magnification is in printer dots, not the millimetres used by the UI.
      const matrix = QRCode.create(text, { errorCorrectionLevel: 'M' }).modules;
      const size = Math.max(matrix.size, mmToDots(Number(el.width_mm) || (el.magnification || 4) * 5, dpi));
      const stride = Math.ceil(size / 8);
      const bytes = Buffer.alloc(stride * size);
      for (let py = 0; py < size; py++) {
        const row = Math.min(matrix.size - 1, Math.ceil((py + 1) * matrix.size / size) - 1);
        for (let px = 0; px < size; px++) {
          const col = Math.min(matrix.size - 1, Math.ceil((px + 1) * matrix.size / size) - 1);
          if (matrix.data[row * matrix.size + col]) bytes[py * stride + (px >> 3)] |= 0x80 >> (px & 7);
        }
      }
      lines.push(`^FO${x},${y}^GFA,${bytes.length},${bytes.length},${stride},${bytes.toString('hex').toUpperCase()}^FS`);
      break;
    }
    case 'line': {
      const w = mmToDots(el.width_mm, dpi);
      const h = mmToDots(el.height_mm, dpi);
      const thickness = el.thickness_dots || mmToDots(el.thickness_mm || 0.3, dpi) || 1;
      lines.push(`^FO${x},${y}`);
      if (h <= thickness) lines.push(`^GB${Math.max(1, w)},${thickness},${thickness}^FS`);
      else if (w <= thickness) lines.push(`^GB${thickness},${Math.max(1, h)},${thickness}^FS`);
      else lines.push(`^GD${w},${h},${thickness},B,L^FS`);
      break;
    }
    case 'box': {
      const w = mmToDots(el.width_mm, dpi);
      const h = mmToDots(el.height_mm, dpi);
      const thickness = el.thickness_dots || mmToDots(el.thickness_mm || 0.3, dpi) || 1;
      lines.push(`^FO${x},${y}`);
      lines.push(`^GB${w},${h},${thickness}^FS`);
      break;
    }
    case 'ellipse': {
      const w=mmToDots(el.width_mm,dpi),h=mmToDots(el.height_mm,dpi);
      const thickness=el.thickness_dots||mmToDots(el.thickness_mm||0.3,dpi)||1;
      lines.push(`^FO${x},${y}^GE${w},${h},${thickness}^FS`);
      break;
    }
    case 'inverse': {
      const w=mmToDots(el.width_mm,dpi),h=mmToDots(el.height_mm,dpi);
      lines.push(`^FO${x},${y}^GB${w},${h},${Math.min(w,h)}^FS`);
      break;
    }
    default:
      throw new Error(`Tipo di elemento non supportato: ${el.type}`);
  }
  return lines.join('');
}

/**
 * Renderizza un singolo set di dati usando un template.
 * @param {object} template - { dpi, width_mm, height_mm, elements: [...] }
 * @param {object} data - valori da inserire nei placeholder {{campo}}
 * @returns {string} ZPL per una etichetta (senza ^XA/^XZ)
 */
// Fit stale positions to the printable template without changing symbol sizes.
function printableElement(el, template, data, originX, originY) {
  const dpi = template.dpi || 203, dpm = dpi / 25.4;
  let w = Number(el.width_mm) || 0, h = Number(el.height_mm) || 0;
  if (['barcode128', 'code39', 'code93', 'ean13'].includes(el.type)) {
    const text = safeFieldData(fillPlaceholders(el.text, data) || '');
    let modules;
    const ean = el.type === 'ean13' ? Barcode.encodeEAN13(text.replace(/\D/g, '')) : null;
    if (ean) modules = ean.bits.length;
    else modules = (el.type === 'code39' ? Barcode.encode39(text) : el.type === 'code93' ? Barcode.encode93(text) : Barcode.encode128B(text)).reduce((a,b)=>a+b,0);
    w = Math.ceil(modules * zebraModuleDots(el) / 8) * 8 / dpm;
    const hriOffset = el.show_text === false ? 0 : Math.max(-0.6, Number(el.hri_offset_mm) || 0);
    h = (el.bar_height_dots || mmToDots(el.bar_height_mm || 10, dpi)) / dpm + (el.show_text === false ? 0 : 3.6 + hriOffset);
  } else if (el.type === 'datamatrix') w = h = (Number(el.magnification) || 5) * 4;
  else if (el.type === 'qrcode') w = h = Number(el.width_mm) || (Number(el.magnification) || 4) * 5;
  else if (el.type === 'text') {
    const text = String(fillPlaceholders(el.text, data) || '');
    h = (el.height_dots || mmToDots(el.height_mm || 3, dpi)) / dpm;
    w = text.length * (el.width_dots || mmToDots(el.width_mm || h, dpi)) / dpm * 0.66;
  } else if (el.type === 'line') {
    const thickness = (el.thickness_dots || mmToDots(el.thickness_mm || 0.3,dpi) || 1) / dpm;
    w = Math.max(w, thickness); h = Math.max(h, thickness);
  }
  // Reserve one printer dot for coordinate rounding at the far edge.
  const maxW = template.width_mm - 1 / dpm, maxH = template.height_mm - 1 / dpm;
  if (w > maxW || h > maxH) throw new Error('Element exceeds template size: ' + (el.name || el.type) + '. Reduce its size before printing.');
  const x = Math.max(0, Math.min(Number(el.x_mm ?? el.x) || 0, maxW - w));
  const y = Math.max(0, Math.min(Number(el.y_mm ?? el.y) || 0, maxH - h));
  return { ...el, x_mm: originX + x, y_mm: originY + y };
}

function renderLabelBody(template, data, opts = {}) {
  const dpi = template.dpi || 203;
  const parts = [];
  const page = template.page?.enabled ? template.page : null;
  const paperW = page ? Number(page.width_mm) : Number(template.width_mm);
  const paperH = page ? Number(page.height_mm) : Number(template.height_mm);
  const rows = page ? Number(page.rows) : 1, cols = page ? Number(page.columns) : 1;
  if (!(paperW > 0 && paperH > 0 && Number.isInteger(rows) && rows > 0 && rows <= 100 && Number.isInteger(cols) && cols > 0 && cols <= 100)) throw new Error('Invalid paper dimensions or layout');
  if (page && ((Number(page.left_mm)||0)+(Number(page.right_mm)||0)+cols*template.width_mm+(cols-1)*(Number(page.gap_x_mm)||0)>paperW+0.01 || (Number(page.top_mm)||0)+(Number(page.bottom_mm)||0)+rows*template.height_mm+(rows-1)*(Number(page.gap_y_mm)||0)>paperH+0.01)) throw new Error('Template layout exceeds paper size. Adjust Page setup or use Fit template size.');
  parts.push(`^PW${mmToDots(paperW, dpi)}`);
  // Apply the document length to gap/mark media as well as continuous stock.
  // Otherwise a retained printer bitmap length can clip the bottom fields.
  parts.push(`^LL${mmToDots(paperH, dpi)},Y`);
  const margin = template.margin_mm || {};
  parts.push('^LH0,0');
  parts.push(template.print_orientation === 'inverted' ? '^POI' : '^PON');
  parts.push(template.mirror ? '^PMY' : '^PMN');
  parts.push(template.negative ? '^LRY' : '^LRN');
  // Print calibration is applied after media tracking so it moves this format.
  const labelTopDots = Number(opts.labelTopDots) || 0;
  parts.push(`^LS${Math.round(Number(opts.labelShiftDots) || 0)}`);
  parts.push('^FWN');
  // Modalità di stampa: 'T' = tear-off (strappo), la stampante fa avanzare l'etichetta
  // fino alla barra di strappo dopo la stampa. Default: tear-off.
  parts.push(`^MM${template.print_mode || 'T'}`);
  // Rilevamento media: 'Y' = etichette con gap/spazio (default per rotoli comuni).
  // Usare 'M' per etichette con tacca nera (black mark).
  parts.push(`^MN${template.media_tracking || 'Y'}`);
  parts.push(`^LT${Math.round(labelTopDots)}`);
  const tear = Number(template.tear_off);
  if (template.tear_off !== undefined && Number.isFinite(tear)) {
    if (!Number.isInteger(tear) || tear < -120 || tear > 120) throw new Error('Tear-off must be an integer from -120 to 120');
    parts.push(`~TA${tear < 0 ? '-' : ''}${String(Math.abs(tear)).padStart(3, '0')}`);
  }
  // Intensità/velocità: l'opzione globale (opts) ha priorità sul template.
  const darkness = (opts && opts.darkness !== undefined && opts.darkness !== '' && opts.darkness !== null) ? opts.darkness : template.darkness;
  const speed = (opts && opts.speed !== undefined && opts.speed !== '' && opts.speed !== null) ? opts.speed : template.speed;
  if (darkness !== undefined) parts.push(`~SD${darkness}`);
  if (speed !== undefined) parts.push(`^PR${speed}`);

  // Selezione elementi da stampare:
  // - opts.enabledIndices (array di indici) sovrascrive tutto (usato dalla GUI)
  // - altrimenti si rispetta il flag "enabled" del singolo elemento (default: true)
  const enabledSet = Array.isArray(opts.enabledIndices) ? new Set(opts.enabledIndices) : null;
  const elements = template.elements || [];
  for(let cell=0;cell<rows*cols;cell++) {
    let row = template.print_order === 'columns' ? cell % rows : Math.floor(cell / cols);
    let col = template.print_order === 'columns' ? Math.floor(cell / rows) : cell % cols;
    if(String(template.print_corner).startsWith('bottom')) row=rows-1-row;
    if(String(template.print_corner).endsWith('right')) col=cols-1-col;
    const originX = (page ? (Number(page.left_mm)||0)+col*(template.width_mm+(Number(page.gap_x_mm)||0)) : 0) + (Number(margin.left)||0);
    const originY = (page ? (Number(page.top_mm)||0)+row*(template.height_mm+(Number(page.gap_y_mm)||0)) : 0) + (Number(margin.top)||0);

  if (template.print_border) {
    const thickness=Math.max(1,mmToDots(Number(template.border_width_mm)||0.3,dpi));
    const width=mmToDots(template.width_mm,dpi),height=mmToDots(template.height_mm,dpi);
    parts.push('^FO'+mmToDots(originX,dpi)+','+mmToDots(originY,dpi)+(template.label_shape==='ellipse'?'^GE'+width+','+height+','+thickness:'^GB'+width+','+height+','+thickness+',B,'+(template.label_shape==='rounded'?8:0))+'^FS');
  }
  if (template.print_background && template.background) {
    const bg = { ...template.background, type: 'image', x_mm: 0, y_mm: 0, width_mm: template.width_mm, height_mm: template.height_mm };
    parts.push(renderElement({ ...bg, x_mm: originX, y_mm: originY }, dpi, data));
  }
  elements.forEach((el, i) => {
    const on = enabledSet ? enabledSet.has(i) : el.enabled !== false;
    if (on) parts.push(renderElement(printableElement(el, template, data, originX, originY), dpi, data));
  });
  }
  return parts.join('\n');
}

/**
 * Genera lo ZPL completo per N copie / N record di dati.
 * @param {object} template
 * @param {object[]} dataList - array di oggetti dati, una etichetta per elemento
 * @param {object} opts - { copiesPerLabel: number, enabledIndices: number[] }
 * @returns {Buffer}
 */
function buildZpl(template, dataList, opts = {}) {
  const copies = opts.copiesPerLabel || 1;
  const chunks = [];
  let lastBody = null, repeat = 0;
  const flush = () => { if (lastBody !== null) chunks.push(`^XA\n${lastBody}\n^PQ${repeat}\n^XZ`); };
  for (const data of dataList) {
    const body = renderLabelBody(opts.templateForData ? opts.templateForData(data) : template, data, opts);
    if (opts.optimizeCopies) {
      if (body === lastBody) repeat += copies;
      else { flush(); lastBody = body; repeat = copies; }
      continue;
    }
    for (let i = 0; i < copies; i++) {
      chunks.push(`^XA\n${body}\n^XZ`);
    }
  }
  if (opts.optimizeCopies) flush();
  return Buffer.from(chunks.join('\n'), 'ascii');
}

/**
 * Estrae la lista dei placeholder {{campo}} presenti in un template,
 * nell'ordine in cui appaiono, senza duplicati. Utile alla GUI per generare i campi.
 */
function extractPlaceholders(template) {
  const found = [];
  const seen = new Set();
  const scan = (str) => {
    if (typeof str !== 'string') return;
    const re = /\{\{\s*([\w.\-]+)\s*\}\}/g;
    let m;
    while ((m = re.exec(str)) !== null) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        found.push(m[1]);
      }
    }
  };
  for (const el of template.elements || []) scan(el.text);
  return found;
}

module.exports = { mmToDots, fillPlaceholders, buildZpl, renderLabelBody, extractPlaceholders, printableElement };
