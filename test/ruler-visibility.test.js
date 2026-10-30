'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { savedRulerVisible, applyRulerVisibility, toggleRulerVisibility, isRulerVisible } = require('../gui/ruler-visibility');

test('savedRulerVisible maps legacy auto-hide and fixed modes', () => {
  assert.equal(savedRulerVisible({ rulerMode: 'auto-hide' }), false);
  assert.equal(savedRulerVisible({ rulerMode: 'hidden' }), false);
  assert.equal(savedRulerVisible({ rulerMode: 'fixed' }), true);
  assert.equal(savedRulerVisible({ rulerVisible: true }), true);
});

test('applyRulerVisibility toggles ruler-fixed without hover auto mode', () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="previewRuler"></div><div id="previewLeftRuler"></div></body></html>', { pretendToBeVisual: true });
  const { document } = dom.window;
  const previousDocument = globalThis.document;
  globalThis.document = document;
  try {
    applyRulerVisibility(true, { persist: false });
    assert.equal(isRulerVisible(), true);
    assert.equal(document.getElementById('previewRuler').style.display, 'block');
    applyRulerVisibility(false, { persist: false });
    assert.equal(isRulerVisible(), false);
    assert.equal(document.getElementById('previewRuler').style.display, 'none');
    toggleRulerVisibility({ persist: false });
    assert.equal(isRulerVisible(), true);
  } finally {
    globalThis.document = previousDocument;
    dom.window.close();
  }
});

test('Preview Settings markup no longer includes ruler behavior dropdown', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../gui/workspace-modals.js'), 'utf8');
  assert.doesNotMatch(source, /Ruler behavior/);
  assert.doesNotMatch(source, /rulerModeSelect/);
});
