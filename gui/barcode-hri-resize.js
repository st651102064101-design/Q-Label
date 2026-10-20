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

  // Paint only the selected barcode from its current model; final and live frames share one renderer.
  function renderLive(host, element, template, data, cache, preview) {
    if(!host||!preview)return null;
    const local={...template,elements:[element]},surface=host.ownerDocument.createElementNS('http://www.w3.org/2000/svg','svg');
    surface.innerHTML=preview.renderPreviewSVG(local,data,[0],cache,{mode:'design',editorPlaceholders:true});
    const art=surface.querySelector('[data-label-element="0"]');
    if(!art)return null;
    host.removeAttribute('transform');
    host.innerHTML=[...surface.querySelectorAll('defs')].map(node=>node.outerHTML).join('')+art.innerHTML;
    return preview.computeBoxes(local,data)[0];
  }

  const api = { renderLive, preserveSize, preserveHeight };
  if (typeof module !== 'undefined') module.exports = api;
  root.BarcodeHriResize = api;
})(typeof window !== 'undefined' ? window : globalThis);
