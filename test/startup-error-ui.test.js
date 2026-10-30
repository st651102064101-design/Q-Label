'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const StartupErrorUI=require('../gui/startup-error-ui');

test('startup failures render their error above the ribbon with a working retry control',()=>{
  const dom=new JSDOM('<!doctype html><body><header class="word-ribbon"></header><main id="previewFrame"></main></body>',{url:'http://localhost'});
  const {document}=dom.window;
  const error=new Error('Could not load label data: malformed template.');
  const overlay=StartupErrorUI.show(error,document);
  const detail=overlay.querySelector('.workspace-startup-error-detail');
  const retry=overlay.querySelector('button');

  assert.equal(overlay.parentElement,document.body,'failure panel is attached above workspace content');
  assert.equal(overlay.getAttribute('role'),'alert','startup failures are announced to assistive technology');
  assert.match(overlay.style.position,/fixed/,'the alert is not clipped by the preview frame');
  assert.ok(Number(overlay.style.zIndex)>1000,'the alert sits above the ribbon');
  assert.equal(detail.textContent,error.message,'the actual exception message stays visible');
  assert.equal(retry.textContent.trim(),'Reload application');
  const icon=retry.querySelector('svg');
  assert.ok(icon,'Reload application shows a reload SVG');
  assert.equal(icon.getAttribute('stroke'),'currentColor');
  assert.ok(icon.querySelector('path')?.getAttribute('d'));
  assert.equal(icon.getAttribute('width'),'16');
  assert.equal(document.activeElement,retry,'keyboard focus moves to the recovery action');

  const second=StartupErrorUI.show(new Error('A later startup failure.'),document);
  assert.equal(document.querySelectorAll('.workspace-startup-error').length,1,'a newer failure replaces the stale panel');
  assert.equal(second.querySelector('.workspace-startup-error-detail').textContent,'A later startup failure.');
  dom.window.close();
});
