'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const RibbonHelpIcons=require('../gui/ribbon-help-icons');

test('help ribbon actions render recognizable keyboard and about SVGs',()=>{
  const dom=new JSDOM('<!doctype html><body><button id="shortcuts"><svg data-old="true"></svg></button><button id="about"></button></body>'),document=dom.window.document;
  const shortcuts=document.querySelector('#shortcuts'),about=document.querySelector('#about');
  assert.equal(RibbonHelpIcons.apply(shortcuts,'Keyboard shortcuts',document),true);
  assert.equal(RibbonHelpIcons.apply(about,'About Q LABEL',document),true);
  const keyboard=shortcuts.querySelector('svg[data-icon="keyboard-shortcuts"]');assert.ok(keyboard,'shortcuts action receives keyboard icon');assert.equal(keyboard.querySelector('rect')?.getAttribute('rx'),'2','keyboard icon has a key frame');const keys=keyboard.querySelector('path')?.getAttribute('d')||'';assert.equal((keys.match(/M/g)||[]).length,16,'keyboard icon shows three rows of five keys and a spacebar');assert.match(keys,/M8 16\.5h8/,'keyboard icon distinguishes the spacebar');assert.equal(shortcuts.querySelector('[data-old]'),null,'semantic icon replaces the generic document icon');
  const info=about.querySelector('svg[data-icon="about"]');assert.ok(info,'about action receives about icon');assert.equal(info.querySelector('circle')?.getAttribute('r'),'9','about icon has an information circle');assert.equal(info.querySelectorAll('circle')[1]?.getAttribute('r'),'.8','about icon has the dot above its information stem');assert.match(info.querySelector('path')?.getAttribute('d')||'',/M12 11v5/,'about icon has a vertical information stem');
  assert.equal(RibbonHelpIcons.apply(about,'Unknown',document),false,'unmapped labels keep their normal ribbon icon');dom.window.close();
});
