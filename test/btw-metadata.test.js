'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { readBtwMetadata } = require('../lib/btw-metadata');

test('readBtwMetadata extracts TemplateSize from installed A4A Label.btw when present', () => {
  const file = path.join(
    process.env.ProgramData || 'C:\\ProgramData',
    'Seagull',
    'PrintStation',
    'wwwroot',
    'Templates',
    'Military',
    'MIL-STD-130',
    'A4A Label.btw',
  );
  if (!fs.existsSync(file)) {
    assert.ok(true, 'skipped — BarTender templates not installed on this machine');
    return;
  }
  const meta = readBtwMetadata(file);
  assert.equal(meta.ok, true);
  assert.equal(meta.width_in, 3);
  assert.equal(meta.height_in, 1);
});
