'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

function previewWindow() {
  const dom = new JSDOM('<body></body>', { runScripts: 'outside-only' });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = () => ({
    measureText: text => ({ width: String(text).length * 5, actualBoundingBoxDescent: 2 }),
    fillRect() {},
    fillStyle: '#000',
  });
  w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AA==';
  w.ObjectData = require('../gui/object-data');
  w.Barcode = require('../gui/barcode');
  w.LabelBitmap = require('../gui/bitmap');
  Object.assign(w, require('../gui/barcode-element'));
  w.eval(fs.readFileSync(require.resolve('../gui/preview'), 'utf8'));
  return { dom, w };
}

test('design sheet renders linear barcodes as a single raster image', () => {
  const { dom, w } = previewWindow();
  const template = {
    width_mm: 50,
    height_mm: 30,
    dpi: 203,
    margin_mm: { left: 0, top: 0 },
    elements: [{
      type: 'barcode128',
      x_mm: 2,
      y_mm: 2,
      bar_height_mm: 10,
      module_width: 2,
      show_text: false,
      text: '12345678',
    }],
  };
  const svg = w.LabelPreview.renderPreviewSVG(template, {}, null, {}, { designSheet: true, editorPlaceholders: true });
  const doc = new w.DOMParser().parseFromString(svg, 'image/svg+xml');
  const group = doc.querySelector('[data-label-element="0"]');
  assert.ok(group.querySelector('image'), 'linear barcode ink is rasterized for the editor');
  assert.equal(group.querySelectorAll('rect[fill="#111"]').length, 0, 'bar modules are not emitted as hundreds of SVG rects');
  dom.window.close();
});

test('design sheet renders catalog barcode bars as a single raster image', () => {
  const { dom, w } = previewWindow();
  const template = {
    width_mm: 50,
    height_mm: 30,
    dpi: 203,
    margin_mm: { left: 0, top: 0 },
    elements: [{
      type: 'image',
      x_mm: 2,
      y_mm: 2,
      width_mm: 30,
      height_mm: 14,
      font_family: 'Arial',
      barcode_spec: { bcid: 'code128', text: '12345678', show_text: true },
      barcode_bars: { bitmap_width: 16, bitmap_height: 8, bitmap_hex: 'ffff0000ffff0000ffff0000ffff0000' },
    }],
  };
  const svg = w.LabelPreview.renderPreviewSVG(template, {}, null, {}, { designSheet: true, editorPlaceholders: true });
  const doc = new w.DOMParser().parseFromString(svg, 'image/svg+xml');
  const group = doc.querySelector('[data-label-element="0"]');
  const moduleRects = [...group.querySelectorAll('rect')].filter(rect => rect.getAttribute('fill') === '#000' || rect.getAttribute('fill') === '#111');
  assert.ok(group.querySelector('image'), 'catalog barcode bars use one raster layer in the editor');
  assert.equal(moduleRects.length, 0, 'catalog bitmap is not expanded into per-module SVG rects');
  dom.window.close();
});
