'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load() {
  const context = { window: {} };
  vm.runInContext(fs.readFileSync(require.resolve('../gui/stock-catalog-ui.js'), 'utf8'), vm.createContext(context));
  vm.runInContext(fs.readFileSync(require.resolve('../gui/stock-catalog.js'), 'utf8'), vm.createContext(context));
  return context.window;
}

test('formatStockDisplayName matches BarTender CR-50 labeling', () => {
  const w = load();
  assert.equal(w.StockCatalogUi.formatStockDisplayName('CR50'), 'CR-50');
  assert.equal(w.StockCatalogUi.formatStockDisplayName('040312fo'), '040312fo');
  assert.equal(w.StockCatalogUi.formatStockDisplayName('ID-1'), 'ID-1');
});

test('ZDesigner printer defaults to Standard Card Sizes from mfg.stk catalog', () => {
  const w = load();
  const cat = w.QLabelStockCatalog;
  const category = w.StockCatalogUi.defaultStockCategoryForPrinter('ZDesigner ZT411-600dpi ZPL', cat);
  assert.equal(category, 'Standard Card Sizes');
  const stocks = cat.getStocks(category);
  assert.ok(stocks.some((s) => s.name === 'CR50'));
});

test('AnyDesk and other generic printers default to AOne like BarTender', () => {
  const w = load();
  const cat = w.QLabelStockCatalog;
  assert.equal(w.StockCatalogUi.defaultStockCategoryForPrinter('AnyDesk Printer', cat), 'AOne');
  assert.equal(w.StockCatalogUi.defaultStockCategoryForPrinter('OneNote (Desktop)', cat), 'AOne');
  assert.equal(w.StockCatalogUi.defaultStockCategoryForPrinter('Microsoft Print to PDF', cat), 'AOne');
  const stock = cat.getStock('AOne', '28171 - Address Label');
  assert.ok(stock);
  assert.equal(stock.columns, 2);
  assert.equal(stock.rows, 6);
});

test('manufacturer list is not filtered by printer name', () => {
  const w = load();
  const all = w.QLabelStockCatalog.getManufacturers();
  assert.deepEqual(w.StockCatalogUi.sortManufacturersForPrinter(all, 'AnyDesk Printer'), all);
  assert.deepEqual(w.StockCatalogUi.sortManufacturersForPrinter(all, 'ZDesigner ZT411-600dpi ZPL'), all);
});

test('CR50 card stock gets rounded preview radius like BarTender wizard', () => {
  const w = load();
  vm.runInContext(fs.readFileSync(require.resolve('../gui/stock-apply.js'), 'utf8'), vm.createContext({ window: w }));
  const stock = w.QLabelStockCatalog.getStock('Standard Card Sizes', 'CR50');
  assert.ok(stock);
  assert.equal(w.StockApply.resolveLabelShapeFromStock(stock).label_shape, 'rounded');
});
