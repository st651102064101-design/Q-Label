'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Connect database ribbon command uses a recognizable database connection SVG',()=>{
  const source=fs.readFileSync(require.resolve('../gui/ribbon.js'),'utf8');
  assert.match(source,/'Connect database':'<svg data-icon="connect-database"/);
  assert.match(source,/data-icon="connect-database"[^]*?<ellipse cx="9" cy="5"/,'icon has the database cylinder');
  assert.match(source,/data-icon="connect-database"[^]*?M14 13h8v7/,'icon includes the connection port');
  assert.match(source,/g=group\(data,'Label data'\);button\(g,'Connect database'/,'icon is bound to the Connect database command');
});

test('data source dialog actions use the app button hierarchy and responsive footer',()=>{
  const source=fs.readFileSync(require.resolve('../gui/data-sources.js'),'utf8');
  assert.match(source,/\.data-source-dialog footer \.delete\{margin-right:auto/);
  assert.match(source,/\.data-source-dialog footer \[type=submit\]\{[^}]*background:var\(--accent/);
  assert.match(source,/\.data-source-dialog footer button:disabled\{opacity:\.48;cursor:not-allowed\}/);
  assert.match(source,/@media\(max-width:600px\)\{\.data-source-dialog/);
});

test('data source items use a context menu for CRUD instead of inline icons',()=>{
  const source=fs.readFileSync(require.resolve('../gui/data-sources.js'),'utf8');
  assert.match(source,/source-context-menu/);
  assert.match(source,/data-action="edit"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m10\.9 2\.1/);
  assert.match(source,/data-action="delete"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2\.5 4\.5/);
  assert.match(source,/contextMenu\.querySelector\('\[data-action="edit"\] span'\)\.textContent='Edit '\+label/);
  assert.match(source,/contextMenu\.querySelector\('\[data-action="delete"\] span'\)\.textContent='Delete '\+label/);
  assert.match(source,/oncontextmenu=event=>\{event\.preventDefault\(\);showContextMenu/);
  assert.match(source,/event\.key==='ContextMenu'\|\|event\.key==='F10'&&event\.shiftKey/);
  assert.match(source,/\.source-item::before\{content:none!important\}/);
  assert.doesNotMatch(source,/className='source-action/);
});

