'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const SvgSelect=require('../gui/svg-select');

test('badge icons are escaped, coloured SVG with a sample glyph',()=>{
  const svg=SvgSelect.badgeIcon('<&>','x');
  assert.match(svg,/^<svg class="svg-select-icon"/);
  assert.ok(!svg.includes('<&>'),'glyph is escaped');
  assert.match(svg,/fill="#[0-9a-f]{6}"/);
  assert.equal(SvgSelect.badgeIcon('A','Same'),SvgSelect.badgeIcon('A','Same'),'colour is stable per name');
});

test('every Unicode block in the Symbol dialog resolves to an icon with its own glyph',()=>{
  for(const name of ['TIS','Basic Latin','Greek and Coptic','Arrows','Mathematical Operators','Currency Symbols','Box Drawing','Variation Selectors']){
    assert.ok(SvgSelect.BLOCK_GLYPHS[name],name+' has a glyph');
    assert.match(SvgSelect.blockIcon(name),/<text[^>]*>/,name);
  }
  assert.match(SvgSelect.blockIcon('Unknown Block'),/>U</,'unknown blocks fall back to their initial');
});
