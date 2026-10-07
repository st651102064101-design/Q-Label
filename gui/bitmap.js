'use strict';
(function (root) {
  function raster(element, width, height) {
    const sw = Number(element.bitmap_width), sh = Number(element.bitmap_height);
    const hex = element.bitmap_hex || '';
    if (!Number.isInteger(sw) || !Number.isInteger(sh) || sw < 1 || sh < 1 || sw > 4096 || sh > 4096 || sw * sh > 16000000 || !/^[0-9a-f]+$/i.test(hex) || hex.length !== Math.ceil(sw / 8) * sh * 2) throw new Error('Invalid image bitmap');
    width = Math.max(1, Math.round(width)); height = Math.max(1, Math.round(height));
    if (width * height > 16000000) throw new Error('Image exceeds maximum print size');
    const stride = Math.ceil(width / 8), sourceStride = Math.ceil(sw / 8);
    const bytes = new Uint8Array(stride * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const sx = Math.min(sw - 1, Math.floor(x * sw / width)), sy = Math.min(sh - 1, Math.floor(y * sh / height));
      const b = parseInt(hex.slice((sy * sourceStride + (sx >> 3)) * 2, (sy * sourceStride + (sx >> 3)) * 2 + 2), 16);
      if (b & (128 >> (sx & 7))) bytes[y * stride + (x >> 3)] |= 128 >> (x & 7);
    }
    return { width, height, stride, bytes };
  }
  function runs(bitmap, visit) {
    for (let y = 0; y < bitmap.height; y++) {
      let start = -1;
      for (let x = 0; x <= bitmap.width; x++) {
        const black = x < bitmap.width && (bitmap.bytes[y * bitmap.stride + (x >> 3)] & (128 >> (x & 7)));
        if (black && start < 0) start = x;
        if (!black && start >= 0) { visit(start, y, x - start); start = -1; }
      }
    }
  }
  const api = { raster, runs };
  if (typeof module !== 'undefined') module.exports = api;
  else root.LabelBitmap = api;
})(typeof window === 'undefined' ? globalThis : window);
