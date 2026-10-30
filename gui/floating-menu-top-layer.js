(function () {
  'use strict';

  const supportsPopover = typeof HTMLElement.prototype.showPopover === 'function';

  function prepare(menu) {
    if (!menu || menu.dataset.floatingTopLayer === '1') return;
    menu.dataset.floatingTopLayer = '1';
    if (supportsPopover) menu.popover = 'manual';
  }

  function show(menu) {
    if (!menu) return;
    prepare(menu);
    if (menu.parentNode !== document.body) document.body.append(menu);
    menu.hidden = false;
    if (supportsPopover && menu.popover === 'manual') {
      try { menu.showPopover(); } catch (_) { /* already open */ }
    }
  }

  function hide(menu) {
    if (!menu) return;
    menu.hidden = true;
    if (supportsPopover && menu.popover === 'manual') {
      try { menu.hidePopover(); } catch (_) { /* already closed */ }
    }
  }

  window.FloatingMenuTopLayer = { prepare, show, hide, supportsPopover };
})();
