'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('Symbols ribbon exposes a dropdown menu API separate from the modal picker',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../gui/tis-symbols.js'),'utf8');
  assert.match(source,/className='symbols-menu'/,'Symbols uses a fixed ribbon dropdown panel');
  assert.match(source,/window\.TisSymbolMenu=\{isOpen:/,'ribbon hover can open and close the dropdown without the modal');
  assert.match(source,/More Symbols…/,'dropdown offers a More Symbols entry before the full picker');
  assert.match(source,/closeSymbolsMenu\(\);void openPicker\(index\)/,'choosing a dropdown tile opens the Symbol modal');
  assert.doesNotMatch(source,/filter:grayscale\(1\)/,'symbol previews show full colour in the ribbon dropdown');
  assert.match(source,/svg:not\(\.ribbon-color-icon\)/,'ribbon Symbols keeps the shared multi-colour icon');
});
