'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {apply}=require('../gui/version-display');

test('version rollover retains three decimal places',()=>{
  const dom=fixture();apply(1,dom.window,dom.window.document);
  assert.equal(dom.window.document.title,'Q Label (1.000)');
});

function fixture(){
  const dom=new JSDOM('<!doctype html><html><head><title>Q Label</title></head><body><span id="ribbonVersion"></span><span id="appVersion">Q Label</span><small id="sidebarVersion"></small></body></html>');
  return dom;
}

test('application version is shown in the ribbon, settings, sidebar and window title',()=>{
  const dom=fixture(),win=dom.window;
  assert.equal(apply('0.849',win,win.document),true);
  assert.equal(win.document.querySelector('#ribbonVersion').textContent,'v0.849');
  assert.equal(win.document.querySelector('#appVersion').textContent,'Q Label (0.849)');
  assert.equal(win.document.querySelector('#sidebarVersion').textContent,'v0.849');
  assert.equal(win.document.title,'Q Label (0.849)');
  assert.equal(win.appDisplayVersion,'v0.849');
});

test('version display normalizes an existing v prefix and ignores empty values',()=>{
  const dom=fixture(),win=dom.window;
  assert.equal(apply('v0.849',win,win.document),true);
  assert.equal(win.document.querySelector('#ribbonVersion').textContent,'v0.849');
  assert.equal(apply('',win,win.document),false);
  assert.equal(win.document.querySelector('#ribbonVersion').textContent,'v0.849');
});

test('numeric 0.990 display version retains its three-digit step in the UI',()=>{
  const dom=fixture(),win=dom.window;
  assert.equal(apply(0.99,win,win.document),true);
  assert.equal(win.document.querySelector('#ribbonVersion').textContent,'v0.990');
  assert.equal(win.document.querySelector('#appVersion').textContent,'Q Label (0.990)');
  assert.equal(win.document.title,'Q Label (0.990)');
});
