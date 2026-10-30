'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

test('preview paper sits flat on the workspace without a decorative shadow plate', () => {
  const html = fs.readFileSync(require.resolve('../gui/index.html'), 'utf8');
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('\n');
  const dom = new JSDOM(`<style>${styles}</style><section class="preview-pane"><div class="preview-frame"><div class="canvaswrap"><svg></svg></div></div></section>`);
  const { document, getComputedStyle } = dom.window;
  const paper = getComputedStyle(document.querySelector('.canvaswrap'));
  const sheet = getComputedStyle(document.querySelector('.canvaswrap > svg'));
  assert.equal(paper.boxShadow, 'none', 'the paper wrapper does not cast an offset shadow');
  assert.ok(!String(sheet.filter).includes('drop-shadow'), 'the paper sheet has no drop-shadow filter');
  dom.window.close();
});
