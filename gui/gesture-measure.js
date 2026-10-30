'use strict';

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.GestureMeasure = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function create(document, offset = 14) {
    let badge = null;
    let anchor = null;
    const ensureBadge = () => {
      if (badge) return badge;
      badge = document.createElement('div');
      badge.id = 'tableLineMeasure';
      badge.style.cssText = 'position:fixed;z-index:20000;padding:2px 6px;border:1px solid #16a34a;border-radius:4px;background:#fff;color:#166534;font:12px Segoe UI,sans-serif;pointer-events:none;white-space:nowrap;';
      document.body.append(badge);
      return badge;
    };
    return {
      begin(point) {
        const x = Number(point?.clientX), y = Number(point?.clientY);
        anchor = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
      },
      show(text) {
        const x = anchor?.x, y = anchor?.y;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const node = ensureBadge();
        node.hidden = false;
        node.textContent = String(text);
        node.style.left = `${x + offset}px`;
        node.style.top = `${y + offset}px`;
      },
      hide() {
        if (badge) badge.hidden = true;
        anchor = null;
      },
      get element() { return badge; },
    };
  }

  return { create };
});
