'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const GestureMeasure = require('../gui/gesture-measure');

test('gesture measurement updates its value without following the pointer', () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const measure = GestureMeasure.create(dom.window.document);
  measure.begin({ clientX: 80, clientY: 35 });
  measure.show('0.02 in');
  const badge = measure.element;
  const pinnedPosition = { left: badge.style.left, top: badge.style.top };
  measure.show('0.05 in');

  assert.equal(badge.textContent, '0.05 in');
  assert.equal(badge.style.left, pinnedPosition.left);
  assert.equal(badge.style.top, pinnedPosition.top);
  measure.hide();
  assert.equal(badge.hidden, true);

  measure.begin({ clientX: 240, clientY: 110 });
  measure.show('0.07 in');
  assert.equal(badge.style.left, '254px');
  assert.equal(badge.style.top, '124px');
  dom.window.close();
});
