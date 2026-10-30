'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load() {
  const context = { window: {} };
  vm.runInContext(fs.readFileSync(require.resolve('../gui/stock-apply.js'), 'utf8'), vm.createContext(context));
  vm.runInContext(fs.readFileSync(require.resolve('../gui/stock-catalog.js'), 'utf8'), vm.createContext(context));
  return context.window;
}

test('applyCatalogStockToTemplate sets page size and roll metadata from the catalog record', () => {
  const w = load();
  const stock = w.QLabelStockCatalog.getStock('ADES AG', '49908');
  const template = { width_mm: 10, height_mm: 10, page: { enabled: true, width_mm: 10, height_mm: 10, rows: 1, columns: 1 } };
  w.StockApply.applyCatalogStockToTemplate(template, stock);
  assert.equal(template.page.width_mm, stock.paper_width_mm);
  assert.equal(template.page.height_mm, stock.paper_height_mm);
  assert.equal(template.width_mm, stock.width_mm);
  assert.equal(template.stock.printer_type, 'Roll');
  assert.equal(template.stock.paper_width_mm, stock.paper_width_mm);
  const roundTrip = w.StockApply.catalogStockFromTemplate(template);
  assert.equal(roundTrip.printer_type, 'Roll');
  assert.equal(roundTrip.paper_width_mm, stock.paper_width_mm);
});

test('ADES AG 040312fo keeps catalog paper size and rounded roll preview shape', () => {
  const w = load();
  const stock = w.QLabelStockCatalog.getStock('ADES AG', '040312fo');
  assert.ok(stock, 'catalog contains 040312fo');
  const template = { width_mm: 1, height_mm: 1, page: { enabled: true, width_mm: 1, height_mm: 1, rows: 1, columns: 1 } };
  w.StockApply.applyCatalogStockToTemplate(template, stock);
  assert.equal(template.width_mm, stock.width_mm);
  assert.equal(template.height_mm, stock.height_mm);
  assert.equal(template.page.width_mm, stock.paper_width_mm);
  assert.equal(template.page.height_mm, stock.paper_height_mm);
  assert.equal(template.page.left_mm, stock.margin_left_mm);
  assert.equal(template.label_shape, 'rounded');
  assert.ok(Math.abs(template.corner_radius_mm - 3.175) < 0.001);
});

test('resolveLabelShapeFromStock rounds ADES roll rectangles like the BarTender wizard preview', () => {
  const w = load();
  const stock = w.QLabelStockCatalog.getStock('ADES AG', '40343');
  const shape = w.StockApply.resolveLabelShapeFromStock(stock);
  assert.equal(shape.label_shape, 'rounded');
  assert.ok(shape.corner_radius_mm > 0);
  assert.equal(w.StockApply.resolveLabelShapeFromStock(w.QLabelStockCatalog.getStock('Advanced Labeling', '.75" Circle')).label_shape, 'ellipse');
});
