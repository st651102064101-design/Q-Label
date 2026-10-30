'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeWindowsPrinterNames,
  buildBarTenderPrinterList,
  resolveWindowsPrinterQueueName,
  fillPrinterSelect,
} = require('../lib/windows-printers');

test('Windows printer list matches BarTender order including Default row', () => {
  const installed = [
    'ZDesigner ZT411-600dpi ZPL',
    'Zebra ZT610 (600 dpi)',
    'Zebra ZT411 (600 dpi)',
    'OneNote (Desktop)',
    'Microsoft Print to PDF',
    'HP Universal Printing PCL 6',
    'AnyDesk Printer',
    'PDF',
  ];
  assert.deepEqual(buildBarTenderPrinterList(installed, 'HP Universal Printing PCL 6'), [
    'AnyDesk Printer',
    'Default (currently HP Universal Printing PCL 6)',
    'HP Universal Printing PCL 6',
    'Microsoft Print to PDF',
    'OneNote (Desktop)',
    'PDF',
    'ZDesigner ZT411-600dpi ZPL',
    'Zebra ZT411 (600 dpi)',
    'Zebra ZT610 (600 dpi)',
  ]);
});

test('Default printer row resolves to the installed queue name', () => {
  assert.equal(
    resolveWindowsPrinterQueueName('Default (currently HP Universal Printing PCL 6)'),
    'HP Universal Printing PCL 6',
  );
  assert.equal(resolveWindowsPrinterQueueName('Zebra ZT411 (600 dpi)'), 'Zebra ZT411 (600 dpi)');
});

test('Windows printer enumeration is alphabetic and naturally sorts model numbers', () => {
  const discovered = [
    'Zebra ZT610 (600 dpi)',
    'Zebra ZT411 (600 dpi)',
    'ZDesigner ZT411-600dpi ZPL',
    'OneNote (Desktop)',
    'Microsoft Print to PDF',
    'HP Universal Printing PCL 6',
    'AnyDesk Printer',
  ].join('\r\n');

  assert.deepEqual(normalizeWindowsPrinterNames(discovered), [
    'AnyDesk Printer',
    'HP Universal Printing PCL 6',
    'Microsoft Print to PDF',
    'OneNote (Desktop)',
    'ZDesigner ZT411-600dpi ZPL',
    'Zebra ZT411 (600 dpi)',
    'Zebra ZT610 (600 dpi)',
  ]);
});

test('Windows printer enumeration ignores empty lines and trims queue names', () => {
  assert.deepEqual(normalizeWindowsPrinterNames('  HP Universal  \r\n\r\n Zebra ZT411 \n'), [
    'HP Universal',
    'Zebra ZT411',
  ]);
});

test('fillPrinterSelect keeps BarTender order instead of prepending saved printers', () => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<select id="printerSelect"></select>');
  const select = dom.window.document.getElementById('printerSelect');
  const ordered = buildBarTenderPrinterList(
    ['ZDesigner ZT411-600dpi ZPL', 'AnyDesk Printer', 'Zebra ZT610 (600 dpi)'],
    'ZDesigner ZT411-600dpi ZPL',
  );
  fillPrinterSelect(select, ordered, 'ZDesigner ZT411-600dpi ZPL');
  assert.deepEqual(
    [...select.options].map((option) => option.value),
    ordered,
  );
});
