'use strict';

// Smoke test senza dipendenze: verifica le parti core (generatori e encoder).
// Eseguire con: node test/smoke.js
const assert = require('assert');
const path = require('path');

const { buildLabel, extractPlaceholders } = require('../lib/render');
const barcode = require('../gui/barcode.js'); // esporta module.exports in Node

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + ' → ' + e.message); process.exitCode = 1; }
}

const tpl = {
  dpi: 203, width_mm: 60, height_mm: 40,
  field_meta: { cat: { type: 'select', options: ['A', 'B'] } },
  elements: [
    { type: 'text', x_mm: 3, y_mm: 3, height_mm: 4, text: '{{title}}' },
    { type: 'barcode128', x_mm: 3, y_mm: 12, bar_height_mm: 10, text: '{{code}}' },
    { type: 'qrcode', x_mm: 45, y_mm: 10, magnification: 4, text: '{{code}}' },
  ],
};

console.log('Bratender smoke test');

test('300 dpi template on 600 dpi printer preserves millimetres and barcode width', () => {
  const { normalizeTemplate } = require('../gui/print-geometry');
  const source = { dpi: 300, width_mm: 60, height_mm: 60, elements: [
    { type: 'text', x_mm: 52, y_mm: 0, height_mm: 3, width_mm: 3, text: 'Test' },
    { type: 'barcode128', x_mm: 0, y_mm: 34, bar_height_mm: 23, module_width: 9, text: 'Test', show_text: false },
    { type: 'qrcode', x_mm: 0, y_mm: 0, magnification: 4, text: 'Test' },
  ] };
  const normalized = normalizeTemplate(source, { type: 'printer', printer: 'Zebra ZT411 (600 dpi)' });
  assert.strictEqual(source.dpi, 300, 'source is not mutated');
  assert.strictEqual(normalized.dpi, 600);
  assert.strictEqual(normalized.print_offset_y_mm, 0, 'no implicit global print shift is applied');
  assert.strictEqual(normalized.elements[0].x_mm, 52);
  assert.strictEqual(normalized.elements[1].module_width, 18, 'wide modules must not shrink');
  assert.strictEqual(normalized.elements[2].width_mm, 20, 'QR retains editor size');
  const z = buildLabel(normalized, [{}]).toString();
  const { mmToDots } = require('../lib/zpl');
  assert.ok(z.includes('^PW' + mmToDots(60, 600)));
  assert.ok(z.includes('^FT' + mmToDots(52, 600) + ',' + mmToDots(3, 600)));
  const graphics = [...z.matchAll(/\^GFA,(\d+),(\d+),(\d+),([0-9A-F]+)/g)];
  assert.strictEqual(graphics.length, 2, 'barcode and QR use preview encoders');
  const expectedBarWidth = barcode.encode128B('Test').reduce((a, b) => a + b, 0) * 18;
  assert.strictEqual(Number(graphics[0][3]), Math.ceil(expectedBarWidth / 8));
  assert.strictEqual(Number(graphics[0][1]) / Number(graphics[0][3]), mmToDots(23, 600));
  const qrSide = mmToDots(20, 600);
  assert.strictEqual(Number(graphics[1][3]), Math.ceil(qrSide / 8));
  assert.strictEqual(Number(graphics[1][1]) / Number(graphics[1][3]), qrSide);
  assert.deepStrictEqual(normalizeTemplate(normalized, { type: 'printer', printer: 'Zebra ZT411 (600 dpi)' }), normalized);
  assert.ok(z.includes('^LT0'), 'default print output resets stored printer offsets without shifting the layout');
  const { printerLabelTopDots } = require('../gui/print-geometry');
  const calibratedDots = printerLabelTopDots({ type: 'printer', printer: 'Zebra ZT411 (600 dpi)' }, 600, {});
  const calibratedZpl = buildLabel(normalized, [{}], { labelTopDots: calibratedDots }).toString();
  assert.ok(/\^MNY\s*\^LT14/.test(calibratedZpl), '600 dpi printer receives the calibrated downward shift after media mode');
});

test('extractPlaceholders trova i campi', () => {
  assert.deepStrictEqual(extractPlaceholders(tpl), ['title', 'code']);
});

test('buildLabel ZPL (default) produce ^XA...^XZ', () => {
  const z = buildLabel(tpl, [{ title: 'X', code: 'ABC' }]).toString();
  assert.ok(z.startsWith('^XA') && z.trimEnd().endsWith('^XZ'), 'delimitatori ZPL');
});

test('+Line emits a diagonal graphic and +Box emits a rectangle', () => {
  const z = buildLabel({ dpi: 203, width_mm: 60, height_mm: 40, elements: [
    { type: 'line', x_mm: 2, y_mm: 3, width_mm: 12, height_mm: 7, thickness_mm: 0.4 },
    { type: 'box', x_mm: 18, y_mm: 3, width_mm: 12, height_mm: 7, thickness_mm: 0.4 },
  ] }, [{}]).toString();
  assert.match(z, /\^GD\d+,\d+,\d+,B,L\^FS/, 'line uses ZPL diagonal command');
  assert.match(z, /\^GB\d+,\d+,\d+\^FS/, 'box uses ZPL graphic box command');
});

test('Data Matrix prints at the same physical magnification as the editor preview', () => {
  const dpi = 600;
  const size = require('../lib/zpl').mmToDots(3 * 4, dpi);
  const stride = Math.ceil(size / 8);
  const z = buildLabel({ dpi, width_mm: 60, height_mm: 60, elements: [
    { type: 'datamatrix', x_mm: 5, y_mm: 5, magnification: 3, text: '{{code}}' },
  ] }, [{ code: 'TEST' }]).toString();
  assert.ok(z.includes(`^GFA,${stride * size},${stride * size},${stride},`), 'Data Matrix bitmap has the exact preview side length in printer dots');
  assert.ok(!z.includes('^BX'), 'does not reinterpret millimetre scale as ^BX printer dots');
});

test('tutti i template vengono emessi in ZPL per i profili Zebra', () => {
  for (const language of ['zpl', 'tspl', 'epl', 'cpcl', 'ezpl']) {
    const out = buildLabel(Object.assign({ language }, tpl), [{ title: 'X', code: 'ABC' }]).toString();
    assert.ok(out.startsWith('^XA') && out.trimEnd().endsWith('^XZ'), 'linguaggio ' + language);
  }
});

test('barcode con dato vuoto viene saltato (ZPL)', () => {
  const z = buildLabel(tpl, [{ title: 'Solo testo', code: '' }]).toString();
  assert.ok(!z.includes('^BC') && !z.includes('^BQ'), 'niente barcode/QR vuoti');
});

test('ZPL usa x/y/altezza barcode ตามที่ลาก ไม่ขยับและไม่ย่อ', () => {
  const { mmToDots } = require('../lib/zpl');
  const dpi = 600;
  const z = buildLabel({
    dpi, width_mm: 60, height_mm: 60,
    elements: [{
      type: 'barcode128', x_mm: 10, y_mm: 41, bar_height_mm: 15.5,
      module_width: 10, show_text: true, text: '{{code}}',
    }],
  }, [{ code: 'Campo' }]).toString();
  const x = mmToDots(10, dpi);
  const y = mmToDots(41, dpi);
  const h = mmToDots(15.5, dpi);
  assert.ok(z.includes(`^FO${x},${y}`), 'origin ตามที่ลาก');
  const graphic = z.match(/\^GFA,(\d+),(\d+),(\d+),([0-9A-F]+)/);
  assert.ok(graphic, 'barcode graphic uses the same encoder as the preview');
  assert.strictEqual(Number(graphic[1]) / Number(graphic[3]), h, 'bar height matches editor');
  const hriY = y + h + mmToDots(0.6, dpi);
  const hriFontW = Math.round(mmToDots(3, dpi) * 0.72);
  const barWidth = barcode.encode128B('Campo').reduce((a, b) => a + b, 0) * 10;
  assert.ok(z.includes(`^FO${x},${hriY}^A0N,${mmToDots(3, dpi)},${hriFontW}^FB${barWidth},1,0,C,0`), 'printer centers proportional text within the actual barcode width');
  assert.ok(z.includes('^LT0') && z.includes('^LS0'), 'reset stored printer offsets');
});

test('ข้อความ ZPL ใช้เส้นฐานให้ชิดกล่องเดียวกับ Editor', () => {
  const { mmToDots } = require('../lib/zpl');
  const dpi = 600;
  const z = buildLabel({
    dpi, width_mm: 60, height_mm: 60,
    elements: [{ type: 'text', x_mm: 0, y_mm: 0, height_mm: 3, width_mm: 3, text: 'NO1' }],
  }, [{}]).toString();
  const h = mmToDots(3, dpi);
  assert.ok(z.includes(`^FT0,${h}`), 'baseline = ขอบบน + ความสูงตัวอักษร');
  assert.ok(!z.includes('^FO0,0'), 'ไม่วางต้นข้อความที่ y=0 แบบตัดขอบบน');
});

test('Code128: pattern validi e checksum ("AB" = 57 moduli)', () => {
  assert.strictEqual(barcode.PATTERNS.length, 107);
  const w = barcode.encode128B('AB');
  assert.strictEqual(w.reduce((a, b) => a + b, 0), 57);
});

test('EAN-13: cifra di controllo corretta e 95 moduli', () => {
  assert.strictEqual(barcode.ean13CheckDigit('978030640615'), 7);
  const e = barcode.encodeEAN13('978030640615');
  assert.strictEqual(e.bits.length, 95);
  assert.ok(e.bits.startsWith('101') && e.bits.endsWith('101'));
});

test('Code93: tutti i pattern sommano 9', () => {
  const w = barcode.encode93('TEST'); // deve produrre una sequenza non vuota
  assert.ok(w.length > 10);
});

console.log(`\n${passed} test superati.`);
