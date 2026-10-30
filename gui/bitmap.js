'use strict';
(function (root) {
  function isValidRaster(element) {
    const sw = Number(element?.bitmap_width), sh = Number(element?.bitmap_height);
    const hex = element?.bitmap_hex || '';
    return Number.isInteger(sw) && Number.isInteger(sh) && sw >= 1 && sh >= 1 && sw <= 8192 && sh <= 8192 && sw * sh <= 16000000 && /^[0-9a-f]+$/i.test(hex) && hex.length === Math.ceil(sw / 8) * sh * 2;
  }
  function raster(element, width, height) {
    const sw = Number(element.bitmap_width), sh = Number(element.bitmap_height);
    const hex = element.bitmap_hex || '';
    if (!isValidRaster(element)) throw new Error('Invalid image bitmap');
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
  function removeBackground(element) {
    if(element?.type!=='image'||element.placeholder||element.table_model||element.barcode_spec||element.shape_preset)throw new Error('Select a picture or SVG first.');
    // The embedded bitmap stores ink only; white pixels are represented by zero bits.
    // Validate it before removing the separate background painted by the preview.
    raster(element,Number(element.bitmap_width),Number(element.bitmap_height));
    element.transparent_background=true;
    element.text_background='none';
    element.text_inverse=false;
    return element;
  }
  const api = { isValidRaster, raster, runs, removeBackground };
  if (typeof module !== 'undefined') module.exports = api;
  else root.LabelBitmap = api;
})(typeof window === 'undefined' ? globalThis : window);
