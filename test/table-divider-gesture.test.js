'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyTableLineGeometry,
  paintDividerLiveFrame,
  commitDividerGesture,
} = require('../gui/table-divider-live');

function axis(size) {
  return { mode: 'Fixed', size, weight: 100, min: 0.1, max: 80, contentMin: 0.1 };
}

function tableElement() {
  return {
    type: 'image',
    x_mm: 2,
    y_mm: 3,
    width_mm: 30,
    height_mm: 20,
    table_model: {
      autoWidth: true,
      autoHeight: true,
      rows: [axis(8), axis(12)],
      columns: [axis(15), axis(15)],
      values: [['a', 'b'], ['c', 'd']],
    },
  };
}

test('applyTableLineGeometry grows a row without content-fit side effects', () => {
  const element = tableElement();
  const items = element.table_model.rows;
  items[1].size = 18;
  const original = { x: 2, y: 3, width: 30, height: 20, autoWidth: true, autoHeight: true };
  const result = applyTableLineGeometry(element, 'rows', items, { tableDelta: 6, edge: 'none' }, original);
  assert.equal(result.horizontal, false);
  assert.equal(element.height_mm, 26);
  assert.equal(element.width_mm, 30);
  assert.equal(element.x_mm, 2);
  assert.equal(element.y_mm, 3);
  assert.equal(element.table_model.autoHeight, false);
});

test('live divider frame never bakes or redraws the editor canvas', () => {
  const element = tableElement();
  const items = element.table_model.rows;
  items[0].size = 10;
  items[1].size = 16;
  let live = 0, selection = 0, bake = 0, draw = 0, fit = 0, ensure = 0;
  const calls = paintDividerLiveFrame(
    {
      paintLive: () => { live += 1; },
      paintSelection: () => { selection += 1; },
      bake: () => { bake += 1; },
      drawEditorCanvas: () => { draw += 1; },
      fitRowsToContent: () => { fit += 1; },
      ensureContentFits: () => { ensure += 1; },
    },
    {
      element,
      axis: 'rows',
      items,
      result: { tableDelta: 6, edge: 'none' },
      original: { x: 2, y: 3, width: 30, height: 20 },
    },
  );
  assert.equal(calls.bake, 0);
  assert.equal(calls.draw, 0);
  assert.equal(calls.fit, 0);
  assert.equal(calls.ensure, 0);
  assert.equal(calls.live, 1);
  assert.equal(live, 1);
  assert.equal(selection, 1, 'active cell outline should repaint after live table geometry changes');
  assert.equal(bake, 0);
  assert.equal(draw, 0);
  assert.equal(fit, 0);
  assert.equal(ensure, 0);
  assert.equal(element.height_mm, 26);
});

test('commit after divider gesture fits content once then bakes and draws once', () => {
  const element = tableElement();
  let bake = 0, draw = 0, fit = 0, ensure = 0;
  const rowCommit = commitDividerGesture(
    {
      fitRowsToContent: () => { fit += 1; },
      ensureContentFits: () => { ensure += 1; },
      bake: () => { bake += 1; },
      drawEditorCanvas: () => { draw += 1; },
    },
    { element, axis: 'rows' },
  );
  assert.deepEqual(rowCommit, { bake: 1, draw: 1, fit: 0, ensure: 1 });
  assert.equal(ensure, 1);
  assert.equal(fit, 0);
  assert.equal(bake, 1);
  assert.equal(draw, 1);

  bake = draw = fit = ensure = 0;
  const colCommit = commitDividerGesture(
    {
      fitRowsToContent: () => { fit += 1; },
      ensureContentFits: () => { ensure += 1; },
      bake: () => { bake += 1; },
      drawEditorCanvas: () => { draw += 1; },
    },
    { element, axis: 'columns' },
  );
  assert.deepEqual(colCommit, { bake: 1, draw: 1, fit: 1, ensure: 0 });
});
