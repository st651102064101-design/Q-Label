'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { extractBtwPreview } = require('../lib/btw-preview');
const { buildLibraryElementsFromArtwork } = require('../lib/btw-library-import');

const A4A = path.join(
  process.env.ProgramData || 'C:\\ProgramData',
  'Seagull',
  'PrintStation',
  'wwwroot',
  'Templates',
  'Military',
  'MIL-STD-130',
  'A4A Label.btw',
);

test('library artwork decomposes A4A Label into separate text and Data Matrix objects', () => {
  if (!fs.existsSync(A4A)) {
    assert.ok(true, 'skipped — BarTender A4A template not installed');
    return;
  }
  const art = extractBtwPreview(fs.readFileSync(A4A), { width_in: 3, height_in: 1 });
  assert.ok(art);
  const built = buildLibraryElementsFromArtwork(art, 76.2, 25.4, { name: 'A4A Label' });
  assert.ok(built?.elements?.length >= 4);
  const types = built.elements.map((element) => element.type);
  assert.equal(types.filter((type) => type === 'text').length, 3);
  assert.equal(types.filter((type) => type === 'datamatrix').length, 1);
  assert.match(built.elements[0].text, /MFR 1U2R7/);
  assert.match(built.elements[1].text, /SER MH80312/);
  assert.equal(built.elements[3].text, 'UID');
  for (const element of built.elements) {
    assert.ok(element.width_mm > 0 && element.height_mm > 0);
    assert.ok(element.x_mm >= 0 && element.y_mm >= 0);
  }
});
