'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {iconForLabel,LABEL_ICONS}=require('../gui/ribbon-color-icons');

test('context menu maps common action labels to ribbon colour icons',()=>{
  for(const label of ['Cut','Copy','Paste','Duplicate','Delete','Properties…','Export label image…','Zoom in','Remove background','Reset to previous']){
    const svg=iconForLabel(label);
    assert.ok(svg,label+' should resolve to a colour icon');
    assert.match(svg,/#[0-9a-f]{6}/i,label+' should be a multi-colour SVG');
    assert.ok(!/currentColor/.test(svg),label+' must not depend on currentColor');
  }
  assert.ok(iconForLabel('Delete')===LABEL_ICONS['Delete object']);
  assert.ok(iconForLabel('Symbols')===LABEL_ICONS.Symbols);
});

test('object context menu prefers ribbon colour icons when building items',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../gui/object-context-menu.js'),'utf8');
  assert.match(source,/function menuColorIcon\(/);
  assert.match(source,/RibbonColorIcons\?\.iconForLabel/);
  assert.match(source,/ribbon-color-icon/);
});
