'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('label canvas context menu omits Export Image on empty label actions',()=>{
  const source=fs.readFileSync(require.resolve('../gui/object-context-menu.js'),'utf8');
  const labelBlock=source.slice(source.indexOf('const labelGroups='),source.indexOf('const icons='));
  assert.doesNotMatch(labelBlock,/Export Image…/,'empty-canvas menu must not offer export');
});

test('export image context commands require replaceable picture selection',()=>{
  const source=fs.readFileSync(require.resolve('../gui/object-context-menu.js'),'utf8');
  assert.match(source,/selectionSupportsExportImage/);
  assert.match(source,/exportImageLabels\.has\(item\[0\]\)/);
  assert.match(source,/isReplaceablePicture/);
});
