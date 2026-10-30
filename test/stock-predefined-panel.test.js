'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('predefined stock panel markup matches BarTender list-only tools',()=>{
  const modals=fs.readFileSync(require.resolve('../gui/workspace-modals.js'),'utf8');
  const marker="document.getElementById('stockPredefinedPanel').insertAdjacentHTML('beforeend',";
  const block=modals.slice(modals.indexOf(marker),modals.indexOf('const stockUiStyle'));
  assert.doesNotMatch(block,/Predefined stocks<\/h3>/);
  assert.doesNotMatch(block,/Select a stock to apply/);
  assert.match(block,/stockCategory/);
  assert.match(block,/stockList/);
  assert.match(block,/stockSave/);
  assert.match(block,/stockDelete/);
  assert.match(modals,/stock-list-actions\{[^}]*justify-content:flex-start/);
  assert.match(modals,/data-active-stock-panel=predefined.*#stockRfidPanel/);
  assert.match(modals,/stock-predefined-fields/);
});

test('stock guide tabs track one active panel without duplicating predefined inputs',()=>{
  const guides=fs.readFileSync(require.resolve('../gui/stock-guides-ui.js'),'utf8');
  assert.match(guides,/dataset\.activeStockPanel/);
  assert.match(guides,/rfidSizeManualRows/);
});

test('page setup keeps legacy stock fields off predefined tabpanel',()=>{
  const setup=fs.readFileSync(require.resolve('../gui/page-setup.js'),'utf8');
  assert.doesNotMatch(setup,/predefinedStockPanel\.append\(stockCard\)/);
  assert.match(setup,/stockLegacyFields/);
});

test('stock tab hides page and layout sections and foreign controls',()=>{
  const setup=fs.readFileSync(require.resolve('../gui/page-setup.js'),'utf8');
  assert.match(setup,/reparentPageSetupControls/);
  assert.match(setup,/tabStock\[aria-selected="true"\].*section:not\(#setupStock\)/);
  assert.match(setup,/pageSetupForeignStockIds/);
});

test('stock sub-tabs are enabled and scoped like BarTender',()=>{
  const setup=fs.readFileSync(require.resolve('../gui/page-setup.js'),'utf8');
  assert.match(setup,/dataset\.activeStockPanel='predefined'/);
  assert.doesNotMatch(setup,/RFID encoding is not supported by Q LABEL/);
  assert.match(setup,/stockSubTab\('rfid'/);
  assert.doesNotMatch(setup,/unavailableStockTab/);
  const guides=fs.readFileSync(require.resolve('../gui/stock-guides-ui.js'),'utf8');
  assert.doesNotMatch(guides,/class="mini stock-guide-note"/);
  assert.match(guides,/rfidSizeManualRows/);
  assert.match(guides,/magPrintPreview'\)\.disabled=m\.display==='none'/);
});
