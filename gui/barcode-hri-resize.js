(function(root){
  'use strict';

  /**
   * Counter the live barcode resize matrix so human-readable text keeps its
   * authored glyph size. Anchor at the top-center so the baseline still tracks
   * the bar bottoms as the bars grow/shrink.
   */
  function preserveSize(group, scaleX, scaleY) {
    if (!group) return false;
    const sx = Number(scaleX);
    const sy = Number(scaleY);
    if (!Number.isFinite(sx) || sx <= 0 || !Number.isFinite(sy) || sy <= 0) return false;
    if (Math.abs(sx - 1) < 1e-9 && Math.abs(sy - 1) < 1e-9) {
      group.removeAttribute('transform');
      return true;
    }
    const box = group.getBBox();
    const x = box.x + box.width / 2;
    const y = box.y;
    group.setAttribute('transform', `translate(${x} ${y}) scale(${1 / sx} ${1 / sy}) translate(${-x} ${-y})`);
    return true;
  }

  /** @deprecated Prefer preserveSize; kept for call sites that only resize height. */
  function preserveHeight(group, scaleY) {
    return preserveSize(group, 1, scaleY);
  }

  /** Follow the readable text alignment at the authored bar/text boundary. */
  function handlePoint(spec) {
    const gap = Math.max(0, Number.isFinite(Number(spec.gap)) ? Number(spec.gap) : 0.6);
    const offset = Math.max(-gap, Number(spec.offset) || 0);
    const authoredTop = (Number(spec.y) || 0) + (Number(spec.barHeight) || 10) + gap + offset;
    const x = (Number(spec.x) || 0) + (Number(spec.w) || 0) * (spec.align === 'left' ? 0 : spec.align === 'right' ? 1 : 0.5);
    return { x, y: authoredTop };
  }

  /** Keep the green selection frame hugging the bars and HRI ink, not the unused HRI box. */
  function huggingSelection(box, ink, barHeight) {
    const barBottom = (Number(box.y) || 0) + Math.max(.1, Number(barHeight) || Number(box.h) || 10);
    const inkBottom = ink && Number.isFinite(ink.y) && Number.isFinite(ink.h) ? ink.y + ink.h : barBottom;
    return { ...box, h: Math.max(.1, Math.max(barBottom, inkBottom) - (Number(box.y) || 0)) };
  }

  // Paint only the selected barcode from its current model; final and live frames share one renderer.
  function renderLive(host, element, template, data, cache, preview) {
    if(!host||!preview)return null;
    const local={...template,elements:[element]},surface=host.ownerDocument.createElementNS('http://www.w3.org/2000/svg','svg');
    surface.innerHTML=preview.renderPreviewSVG(local,data,[0],cache,{mode:'design',editorPlaceholders:true,liveGesture:true});
    const art=surface.querySelector('[data-label-element="0"]');
    if(!art)return null;
    host.removeAttribute('transform');
    host.innerHTML=[...surface.querySelectorAll('defs')].map(node=>node.outerHTML).join('')+art.innerHTML;
    return preview.computeBoxes(local,data)[0];
  }

  const api = { renderLive, preserveSize, preserveHeight, handlePoint, huggingSelection };
  if (typeof module !== 'undefined') module.exports = api;
  root.BarcodeHriResize = api;
})(typeof window !== 'undefined' ? window : globalThis);
