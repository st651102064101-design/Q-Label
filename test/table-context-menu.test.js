'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { buildTableContextMenu } = require('../gui/table-context-menu');

function fixture() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="menu" role="menu"></div></body></html>', { pretendToBeVisual: true });
  Object.defineProperty(dom.window, 'innerWidth', { value: 900 });
  Object.defineProperty(dom.window, 'innerHeight', { value: 700 });
  const menu = dom.window.document.querySelector('#menu');
  const called = [];
  const commands = [
    ['Copy', () => called.push('Copy')], ['Duplicate', () => called.push('Duplicate')], ['Delete Table', () => called.push('Delete Table')], ['Lock Table', () => called.push('Lock Table')],
    ['Move Row Up', () => called.push('Move Row Up')], ['Move Row Down', () => called.push('Move Row Down')], ['New Row Below', () => called.push('New Row Below')], ['Delete Row', () => called.push('Delete Row')],
    ['Move Column Left', () => called.push('Move Column Left')], ['New Column to the Right', () => called.push('New Column to the Right')],
    ['Edit Cell', () => called.push('Edit Cell')], ['Fit Row to Content', () => called.push('Fit Row to Content')], ['Copy style', () => called.push('Copy style')], ['Paste style', () => called.push('Paste style')],
    ['Bring to front', () => called.push('Bring to front')], ['Bring forward', () => called.push('Bring forward')], ['Send backward', () => called.push('Send backward')], ['Send to back', () => called.push('Send to back')], ['Position', () => called.push('Position')],
  ];
  buildTableContextMenu(menu, commands, { onCommand: (_label, action) => action() });
  return { dom, menu, called };
}

test('table menu keeps related row, column, cell, style, and table actions in hover submenus', () => {
  const { dom, menu } = fixture();
  const categories = [...menu.querySelectorAll('.table-menu-group-trigger')];
  assert.deepEqual(categories.map(button => button.textContent.trim().replace('›', '')), ['Rows', 'Columns', 'Cell', 'Style', 'Layer', 'Table']);
  assert.equal(menu.querySelectorAll(':scope > button').length, 0, 'all table commands are grouped under a submenu');
  for (const group of menu.querySelectorAll('.table-menu-group')) assert.equal(group.querySelector('.table-menu-submenu').hidden, true);
  const rows = categories[0], submenu = rows.parentElement.querySelector('.table-menu-submenu');
  rows.dispatchEvent(new dom.window.Event('pointerenter'));
  assert.equal(submenu.hidden, false);
  assert.equal(rows.getAttribute('aria-expanded'), 'true');
  assert.deepEqual([...submenu.querySelectorAll('[data-command]')].map(button => button.dataset.command), ['Move Row Up', 'Move Row Down', 'New Row Below', 'Delete Row', 'Fit Row to Content']);
  const tableGroup = categories.find(button => button.textContent.includes('Table')).parentElement;
  assert.deepEqual([...tableGroup.querySelectorAll('[data-command]')].map(button => button.dataset.command), ['Copy', 'Duplicate', 'Delete Table', 'Lock Table', 'Position']);
  rows.parentElement.dispatchEvent(new dom.window.Event('pointerleave'));
  assert.equal(submenu.hidden, true);
  assert.equal(rows.getAttribute('aria-expanded'), 'false');
});

test('table submenu is opened by hover and does not toggle closed when clicked', () => {
  const { dom, menu } = fixture();
  const rows = menu.querySelector('.table-menu-group-trigger');
  const submenu = rows.parentElement.querySelector('.table-menu-submenu');
  rows.click();
  assert.equal(submenu.hidden, true, 'click alone does not open the nested menu');
  rows.dispatchEvent(new dom.window.Event('pointerenter'));
  assert.equal(submenu.hidden, false, 'hover opens the nested menu');
  rows.click();
  assert.equal(submenu.hidden, false, 'clicking the hovered trigger does not close the nested menu');
});

test('table Layer submenu exposes all four object z-order actions and dispatches each action', () => {
  const { dom, menu, called } = fixture();
  const layer = [...menu.querySelectorAll('.table-menu-group-trigger')].find(button => button.textContent.includes('Layer'));
  const submenu = layer.parentElement.querySelector('.table-menu-submenu');
  layer.dispatchEvent(new dom.window.Event('pointerenter'));
  assert.equal(submenu.hidden, false);
  const actions = ['Bring to front', 'Bring forward', 'Send backward', 'Send to back'];
  assert.deepEqual([...submenu.querySelectorAll('[data-command]')].map(button => button.dataset.command), actions);
  for (const label of actions) submenu.querySelector(`[data-command="${label}"]`).click();
  assert.deepEqual(called, actions);
});

test('table menu submenus also open by keyboard focus and dispatch the original action', () => {
  const { dom, menu, called } = fixture();
  const styleGroup = [...menu.querySelectorAll('.table-menu-group-trigger')].find(button => button.textContent.includes('Style'));
  const submenu = styleGroup.parentElement.querySelector('.table-menu-submenu');
  styleGroup.dispatchEvent(new dom.window.FocusEvent('focus'));
  assert.equal(submenu.hidden, false);
  const copyStyle = submenu.querySelector('[data-command="Copy style"]');
  copyStyle.click();
  assert.deepEqual(called, ['Copy style']);
});

test('table menu omits unavailable row and column deletion commands from their groups', () => {
  const { menu } = fixture();
  const categories = [...menu.querySelectorAll('.table-menu-group-trigger')];
  const columns = categories.find(button => button.textContent.includes('Columns')).parentElement;
  const rows = categories.find(button => button.textContent.includes('Rows')).parentElement;
  assert.equal(rows.querySelector('[data-command="Delete Column"]'), null);
  assert.equal(columns.querySelector('[data-command="Delete Row"]'), null);
});
