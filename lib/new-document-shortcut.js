'use strict';

function isNewDocumentShortcut(input){
  if(!input||input.type!=='keyDown'||(!input.control&&!input.meta)||input.alt||input.shift)return false;
  // Use the physical key so Ctrl+N also works with a Thai keyboard layout.
  const code=String(input.code||'');
  return /^Key[A-Z]$/.test(code)?code==='KeyN':String(input.key||'').toLowerCase()==='n';
}

module.exports={isNewDocumentShortcut};
