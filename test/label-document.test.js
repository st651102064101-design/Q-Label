'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const labelDocument = require('../lib/label-document');

test('label save dialog defaults to qlabel extension and filter', () => {
  const opts = labelDocument.labelDocumentSaveDialogOptions({ defaultName: 'Original-copy.qlabel' });
  assert.equal(opts.defaultPath, 'Original-copy.qlabel');
  assert.equal(opts.filters[0].extensions[0], 'qlabel');
});

test('normalizeSavedLabelDocumentPath appends qlabel when missing', () => {
  assert.equal(labelDocument.normalizeSavedLabelDocumentPath('C:\\\\Downloads\\\\My Copy'), 'C:\\\\Downloads\\\\My Copy.qlabel');
  assert.equal(labelDocument.normalizeSavedLabelDocumentPath('file.json'), 'file.json');
  assert.equal(labelDocument.normalizeSavedLabelDocumentPath('file.qlabel'), 'file.qlabel');
});

test('basenameWithoutLabelExtension strips json and qlabel', () => {
  assert.equal(labelDocument.basenameWithoutLabelExtension('C:\\\\a\\\\Copy.JSON'), 'Copy');
  assert.equal(labelDocument.basenameWithoutLabelExtension('copy.with.dots.qlabel'), 'copy.with.dots');
});
