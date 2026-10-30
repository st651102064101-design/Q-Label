'use strict';

function isBarcodeElement(element) {
  if (!element) return false;
  if (['barcode128', 'code39', 'code93', 'ean13'].includes(element.type)) return true;
  return element.type === 'image' && !!element.barcode_spec;
}

/** Physical bar ink height for catalog (`image` + `barcode_spec`) and linear fallbacks. */
function catalogBarHeightMm(element, widthMm) {
  const w = Number(widthMm) || Number(element?.width_mm) || 10;
  if (element?.barcode_bars?.bitmap_width && element?.barcode_bars?.bitmap_height) {
    return w * element.barcode_bars.bitmap_height / element.barcode_bars.bitmap_width;
  }
  if (Number(element?.bar_height_mm) > 0) return Number(element.bar_height_mm);
  if (Number(element?.bitmap_width) > 0 && Number(element?.bitmap_height) > 0) {
    return w * element.bitmap_height / element.bitmap_width;
  }
  return Number(element?.height_mm) || 10;
}

function catalogHriGapMm(element) {
  return Math.max(0, Number.isFinite(Number(element?.hri_gap_mm)) ? Number(element.hri_gap_mm) : 0.6);
}

function catalogHriOffsetMm(element, gap = catalogHriGapMm(element)) {
  return Math.max(-gap, Number(element?.hri_offset_mm) || 0);
}

/** Strip object-level text box settings that would pull HRI into the bar area. */
function catalogHriTextSpec(element, widthMm) {
  return {
    ...element,
    text_box_width_mm: Number(widthMm) || Number(element?.width_mm) || 30,
    text_box_height_mm: 0,
    vertical_align: 'top',
    text_align: element?.hri_align || element?.text_align || 'center',
  };
}

const api = {
  isBarcodeElement,
  catalogBarHeightMm,
  catalogHriGapMm,
  catalogHriOffsetMm,
  catalogHriTextSpec,
};

if (typeof window !== 'undefined') Object.assign(window, api);
if (typeof module !== 'undefined' && module.exports) module.exports = api;
