'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const PageGap=require('../gui/page-gap.js');

const page={enabled:true,width_mm:50,height_mm:40,rows:1,columns:1,left_mm:0,right_mm:0,top_mm:0,bottom_mm:0,gap_x_mm:0,gap_y_mm:0};

test('Show gap draws square 1.27 mm top and bottom tabs when margins are zero', () => {
  const markup=PageGap.render({show:true,page,templateWidth:50,templateHeight:40});
  assert.match(markup,/data-paper-tab="top" data-distance-mm="1.27"/);
  assert.match(markup,/data-paper-tab="bottom" data-distance-mm="1.27"/);
  assert.match(markup,/Top 1\.27 mm/);
  assert.match(markup,/Bottom 1\.27 mm/);
  assert.doesNotMatch(markup,/Top 0 mm|Bottom 0 mm/);
  assert.doesNotMatch(markup,/rx=/);
  assert.doesNotMatch(markup,/data-paper-backing/);
  assert.match(PageGap.backing({show:true,page,templateWidth:50,templateHeight:40}),/data-paper-backing="true" x="0" y="-1\.27" width="50" height="42\.54[0-9]*"/);
});

test('Show gap leaves a positive top margin to the margin guide instead of adding a tab', () => {
  const markup=PageGap.render({show:true,page:{...page,top_mm:3},templateWidth:50,templateHeight:40});
  assert.doesNotMatch(markup,/data-paper-tab="top"/);
  assert.match(markup,/data-paper-tab="bottom"/);
});

test('Show gap draws no tabs while hidden', () => {
  assert.equal(PageGap.render({show:false,page,templateWidth:50,templateHeight:40}),'');
});
