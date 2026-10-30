'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  APP_NAME,
  APP_ID,
  applicationWindowTitle,
  isBrandedWindowTitle,
  configureApplicationIdentity,
  pinBrowserWindowTitle,
} = require('../gui/app-branding');

test('application window title uses Q Label with version in parentheses', () => {
  assert.equal(applicationWindowTitle('1.110'), 'Q Label (1.110)');
  assert.equal(applicationWindowTitle(''), 'Q Label');
  assert.equal(isBrandedWindowTitle('Q Label (1.110)'), true);
  assert.equal(isBrandedWindowTitle('Electron'), false);
});

test('configureApplicationIdentity sets app name and Windows AppUserModelId', () => {
  const calls = [];
  const fakeApp = {
    setName(name) { calls.push(['name', name]); },
    setAppUserModelId(id) { calls.push(['id', id]); },
  };
  configureApplicationIdentity(fakeApp, { packaged: true });
  assert.deepEqual(calls, [['name', APP_NAME], ['id', APP_ID]]);
  calls.length = 0;
  configureApplicationIdentity(fakeApp, { packaged: false });
  assert.deepEqual(calls, [['name', APP_NAME], ['id', `${APP_ID}.dev`]]);
});

test('pinBrowserWindowTitle blocks Electron page titles but allows Q Label titles', () => {
  const events = {};
  const contents = { on(event, handler) { events[`wc:${event}`] = handler; } };
  const win = {
    _title: '',
    webContents: contents,
    setTitle(title) { this._title = title; },
    on(event, handler) { events[event] = handler; },
  };
  pinBrowserWindowTitle(win, 'Q Label (1.110)');
  assert.equal(win._title, 'Q Label (1.110)');
  const blocked = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  events['page-title-updated'](blocked, 'Electron');
  assert.equal(blocked.defaultPrevented, true);
  assert.equal(win._title, 'Q Label (1.110)');
  const allowed = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  events['page-title-updated'](allowed, 'Q Label (1.111)');
  assert.equal(allowed.defaultPrevented, false);
});
