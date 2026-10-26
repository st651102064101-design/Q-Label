'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {LABEL_ICONS,PALETTE}=require('../gui/ribbon-color-icons');

test('every ribbon icon is a self-contained colour SVG using the shared palette',()=>{
  const allowed=new Set(Object.values(PALETTE).map(c=>c.toLowerCase()));
  for(const [label,svg] of Object.entries(LABEL_ICONS)){
    assert.match(svg,/^<svg viewBox="0 0 24 24"[^>]*aria-hidden="true"/,label);
    assert.ok(!/currentColor/.test(svg),label+' must not depend on text colour');
    assert.ok(!/<script|onload|href=/i.test(svg),label+' has no active content');
    const colours=new Set((svg.match(/#[0-9a-fA-F]{6}/g)||[]).map(c=>c.toLowerCase()));
    assert.ok(colours.size>=2,label+' uses at least two colours');
    for(const c of colours)assert.ok(allowed.has(c),label+' uses off-palette colour '+c);
  }
});

test('icons exist for every command on Home, Insert, Layout, Picture, Data, View and Tools',()=>{
  const required=['Print','Cut','Copy','Paste','Duplicate','Delete object','Undo','Redo','SVG','Text','Rectangle','Ellipse','Line','Inverse','Picture','Insert Barcode','Insert Symbols','Insert Table','Insert Shapes','Page Setup','Label Properties','Align left','Align horizontal center','Align right','Align top','Align vertical center','Align bottom','Distribute horizontally','Distribute vertically','Bring to front','Send to back','Delete picture','Lock picture','Replace picture','Remove background','Transparent background','Rotate left','Rotate right','Flip horizontal','Flip vertical','Align center','Align middle','Connect database','Values to Print','List Fields','Zoom in','Zoom out','Fit page','Preview Settings','Show grid','Show gap','Snap to grid','Print calibration','Settings','Printer connection'];
  assert.deepEqual(required.filter(label=>!LABEL_ICONS[label]),[]);
});
