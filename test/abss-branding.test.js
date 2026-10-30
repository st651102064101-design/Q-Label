'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('ABSS wizard mark SVG includes the white background',()=>{
  const svg=fs.readFileSync(path.join(__dirname,'../gui/assets/branding/abss-mark.svg'),'utf8');
  assert.match(svg,/<rect\b[^>]*fill="#fff(?:fff)?"/i);
  assert.ok(svg.indexOf('<rect')<svg.indexOf('<image'),'the white background is behind the embedded ABSS logo');
});
