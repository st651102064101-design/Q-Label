'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { INDUSTRY_DISPLAY } = require('../lib/bartender-template-paths');
const { publicLibraryUrl } = require('../lib/bartender-library-files');

test('BTW downloads use the public CDN while preserving asset path and filename encoding',()=>{
 assert.equal(publicLibraryUrl('https://bartender-template-s3-storage-gateway.s3.us-west-2.amazonaws.com/Production/A4A+Label.btw'),'https://bartender-images-cdn.bartendercloud.com/Production/A4A+Label.btw');
 assert.equal(publicLibraryUrl('https://example.test/label.btw'),'https://example.test/label.btw');
});

test('BarTender industry folders map to Template Browser display tags', () => {
  assert.equal(INDUSTRY_DISPLAY.Military, 'Defense');
  assert.equal(INDUSTRY_DISPLAY.Automotive, 'Automotive');
  assert.equal(INDUSTRY_DISPLAY.Retail, 'Retail');
});

test('generated template catalog includes A4A Label and pagination page size', () => {
  const catalogPath = path.join(__dirname, '../gui/template-library-catalog.js');
  const source = fs.readFileSync(catalogPath, 'utf8');
  assert.match(source, /"cloud_count":\s*480/);
  assert.ok(/"count":\s*\d+/.test(source));
  assert.match(source, /"page_size":\s*50/);
  assert.match(source, /"name":\s*"A4A Label"/);
  assert.match(source, /"industry":\s*"Defense"/);
  assert.match(source, /templatebrowser\.bartendercloud\.com/);
});

test('main process exposes BarTender cloud template browser IPC', () => {
  const mainSource = fs.readFileSync(path.join(__dirname, '../gui/main.js'), 'utf8');
  assert.match(mainSource, /open-bartender-template-cloud/);
  assert.match(mainSource, /templatebrowser\.bartendercloud\.com/);
});

test('new document wizard banner shows Zebra ZT410-style printer artwork', () => {
  const svg = fs.readFileSync(path.join(__dirname, '../gui/assets/branding/new-document-banner.svg'), 'utf8');
  assert.match(svg, /ZT410/);
  assert.match(svg, /READY/);
  assert.doesNotMatch(svg, /data:image\/png;base64/);
});
