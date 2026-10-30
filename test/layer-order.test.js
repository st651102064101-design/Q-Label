'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { reorder, move } = require('../gui/layer-order');

test('bring to front and send to back preserve the relative order of selected layers', () => {
  const elements = ['A', 'B', 'C', 'D'];
  const front = reorder(elements, [1, 3], 'front');
  assert.deepEqual(front.elements, ['A', 'C', 'B', 'D']);
  assert.deepEqual(front.selection, [2, 3]);
  assert.equal(front.changed, true);
  const back = reorder(elements, [1, 3], 'back');
  assert.deepEqual(back.elements, ['B', 'D', 'A', 'C']);
  assert.deepEqual(back.selection, [0, 1]);
});

test('bring forward and send backward move selected layers one step without crossing each other', () => {
  const elements = ['A', 'B', 'C', 'D'];
  assert.deepEqual(reorder(elements, [1, 2], 'forward').elements, ['A', 'D', 'B', 'C']);
  assert.deepEqual(reorder(elements, [1, 2], 'backward').elements, ['B', 'C', 'A', 'D']);
});

test('layer reordering ignores invalid selections and reports no-op boundary moves', () => {
  const elements = ['A', 'B'];
  const unchanged = reorder(elements, [0, -1, 5], 'backward');
  assert.deepEqual(unchanged.elements, ['A', 'B']);
  assert.deepEqual(unchanged.selection, [0]);
  assert.equal(unchanged.changed, false);
  assert.deepEqual(reorder(elements, [1], 'forward').elements, elements);
  assert.equal(reorder(elements, [1], 'forward').changed, false);
});

test('drag reordering moves one layer to a valid index and leaves invalid moves unchanged', () => {
  const elements = ['A', 'B', 'C'];
  assert.deepEqual(move(elements, 0, 2), ['B', 'C', 'A']);
  assert.deepEqual(move(elements, -1, 2), elements);
  assert.deepEqual(elements, ['A', 'B', 'C']);
});
