'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const association = require('../lib/windows-qlabel-association');

test('resolveDocumentIconPath finds build icon.ico', () => {
  const icon = association.resolveDocumentIconPath({
    iconPath: path.join(__dirname, '../build/icon.ico'),
  });
  assert.ok(icon);
  assert.equal(fs.existsSync(icon), true);
});

test('registerWindowsQlabelDocumentType skips non-Windows', () => {
  if (process.platform === 'win32') return;
  assert.deepEqual(association.registerWindowsQlabelDocumentType(), { ok: true, skipped: true, reason: 'not-windows' });
});
