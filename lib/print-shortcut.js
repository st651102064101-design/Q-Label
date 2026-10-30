'use strict';

function isPrintShortcut(input) {
  if (!input || input.type !== 'keyDown' || input.isAutoRepeat) return false;
  if (!input.control && !input.meta) return false;
  return String(input.key || '').toLowerCase() === 'p' || input.code === 'KeyP';
}

module.exports = { isPrintShortcut };
