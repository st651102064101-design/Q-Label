(function (root) {
  'use strict';

  function savedRulerVisible(saved) {
    if (typeof saved?.rulerVisible === 'boolean') return saved.rulerVisible;
    if (saved?.rulerMode === 'fixed') return true;
    if (saved?.rulerMode === 'auto-hide' || saved?.rulerMode === 'hidden') return false;
    return false;
  }

  function isRulerVisible() {
    return root.document.body.classList.contains('ruler-fixed');
  }

  function applyRulerVisibility(visible, { persist = false } = {}) {
    const show = !!visible;
    root.document.body.classList.toggle('ruler-fixed', show);
    const ruler = root.document.getElementById('previewRuler');
    const yRuler = root.document.getElementById('previewLeftRuler');
    const display = show ? 'block' : 'none';
    if (ruler) ruler.style.display = display;
    if (yRuler) yRuler.style.display = display;
    if (show && typeof root.updatePreviewRuler === 'function') root.updatePreviewRuler();
    else if (typeof root.updateRulerPointerMarkers === 'function') root.updateRulerPointerMarkers();
    else if (typeof root.drawPreviewRuler === 'function') root.drawPreviewRuler();
    if (persist && root.zebra?.saveSettings) {
      void root.zebra.saveSettings({ rulerVisible: show, rulerMode: show ? 'fixed' : 'hidden' });
    }
    const doc = root.document;
    if (doc) {
      const EventCtor = doc.defaultView?.Event || root.Event;
      doc.dispatchEvent(new EventCtor('ruler-visibility-changed'));
    }
    return show;
  }

  function toggleRulerVisibility({ persist = true } = {}) {
    return applyRulerVisibility(!isRulerVisible(), { persist });
  }

  const api = { savedRulerVisible, isRulerVisible, applyRulerVisibility, toggleRulerVisibility };
  if (typeof module !== 'undefined') module.exports = api;
  root.RulerVisibility = api;
})(typeof window !== 'undefined' ? window : globalThis);
