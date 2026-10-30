'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { updateUndoRedoButtons } = require('../gui/history-button-state');
const { bindButtonAction } = require('../gui/quick-access');

function fixture() {
  const css = fs.readFileSync(path.join(__dirname, '../gui/history-button-state.css'), 'utf8');
  const html = `<!doctype html><style>.edbar button{color:#1f2937;background:#fff;border:1px solid #16a34a;opacity:.7}</style><style>${css}</style><div class="edbar"><button id="undoBtn"><svg></svg></button><button id="redoBtn"><svg></svg></button><div class="ribbon-quick-commands"><button aria-label="Undo (Ctrl+Z)"></button><button aria-label="Redo (Ctrl+Y)"></button></div></div>`;
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  return { dom, undo: dom.window.document.querySelector('#undoBtn'), redo: dom.window.document.querySelector('#redoBtn'), quickUndo: dom.window.document.querySelector('[aria-label="Undo (Ctrl+Z)"]'), quickRedo: dom.window.document.querySelector('[aria-label="Redo (Ctrl+Y)"]') };
}

test('Undo and Redo are gray and lose active styling when their history is empty', () => {
  const { dom, undo, redo } = fixture();
  updateUndoRedoButtons([], [], undo, redo);
  for (const button of [undo, redo]) {
    assert.equal(button.disabled, true);
    const style = dom.window.getComputedStyle(button);
    assert.equal(style.color, 'rgb(148, 163, 184)');
    assert.equal(style.opacity, '1');
    assert.equal(style.borderTopColor, 'rgba(0, 0, 0, 0)');
    assert.equal(style.backgroundColor, 'rgba(0, 0, 0, 0)');
  }
});

test('Undo and Redo independently return to enabled state when their matching history exists', () => {
  const { undo, redo } = fixture();
  updateUndoRedoButtons([{}], [], undo, redo);
  assert.equal(undo.disabled, false);
  assert.equal(redo.disabled, true);
  updateUndoRedoButtons([], [{}], undo, redo);
  assert.equal(undo.disabled, true);
  assert.equal(redo.disabled, false);
  updateUndoRedoButtons([{}], [{}], undo, redo);
  assert.equal(undo.disabled, false);
  assert.equal(redo.disabled, false);
});

test('quick access Undo and Redo are disabled and enabled with their matching history', () => {
  const { undo, redo, quickUndo, quickRedo } = fixture();
  updateUndoRedoButtons([], [], undo, redo, quickUndo, quickRedo);
  assert.equal(quickUndo.disabled, true);
  assert.equal(quickRedo.disabled, true);

  updateUndoRedoButtons([{}], [], undo, redo, quickUndo, quickRedo);
  assert.equal(quickUndo.disabled, false);
  assert.equal(quickRedo.disabled, true);

  updateUndoRedoButtons([], [{}], undo, redo, quickUndo, quickRedo);
  assert.equal(quickUndo.disabled, true);
  assert.equal(quickRedo.disabled, false);
});

test('quick access button clears pointer focus after click but keeps keyboard focus', () => {
  const dom = new JSDOM('<!doctype html><button id="action"></button>', { pretendToBeVisual: true });
  const button = dom.window.document.querySelector('#action');
  let calls = 0;
  bindButtonAction(button, () => { calls++; });

  button.focus();
  button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, detail: 1 }));
  assert.equal(calls, 1);
  assert.equal(dom.window.document.activeElement, dom.window.document.body);

  button.focus();
  button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, detail: 0 }));
  assert.equal(calls, 2);
  assert.equal(dom.window.document.activeElement, button);
});
