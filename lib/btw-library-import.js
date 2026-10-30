'use strict';

const DEFAULT_SIDE_EDGE_MM = 0.05 * 25.4;

function readInkBitmap(art) {
  const width = art.bitmap_width;
  const height = art.bitmap_height;
  const stride = Math.ceil(width / 8);
  const bytes = Buffer.from(art.bitmap_hex, 'hex');
  const ink = (x, y) => (bytes[y * stride + (x >> 3)] & (128 >> (x & 7))) !== 0;
  return { width, height, ink };
}

function floodComponents(art, minArea = 80) {
  const { width, height, ink } = readInkBitmap(art);
  const seen = new Uint8Array(width * height);
  const components = [];
  for (let sy = 0; sy < height; sy++) {
    for (let sx = 0; sx < width; sx++) {
      const start = sy * width + sx;
      if (seen[start] || !ink(sx, sy)) continue;
      let minX = sx;
      let maxX = sx;
      let minY = sy;
      let maxY = sy;
      let n = 0;
      const queue = [[sx, sy]];
      seen[start] = 1;
      while (queue.length) {
        const [x, y] = queue.pop();
        n += 1;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (seen[ni] || !ink(nx, ny)) continue;
          seen[ni] = 1;
          queue.push([nx, ny]);
        }
      }
      if (n >= minArea) {
        components.push({ n, minX, maxX, minY, maxY });
      }
    }
  }
  return { width, height, components };
}

function mergeBoxes(boxes) {
  if (!boxes.length) return null;
  return boxes.reduce(
    (acc, box) => ({
      minX: Math.min(acc.minX, box.minX),
      maxX: Math.max(acc.maxX, box.maxX),
      minY: Math.min(acc.minY, box.minY),
      maxY: Math.max(acc.maxY, box.maxY),
    }),
    { ...boxes[0] },
  );
}

function boxToMm(box, art, labelW_mm, labelH_mm, padPx = 2) {
  const w = art.bitmap_width;
  const h = art.bitmap_height;
  const minX = Math.max(0, box.minX - padPx);
  const minY = Math.max(0, box.minY - padPx);
  const maxX = Math.min(w - 1, box.maxX + padPx);
  const maxY = Math.min(h - 1, box.maxY + padPx);
  return {
    x_mm: (minX / w) * labelW_mm,
    y_mm: (minY / h) * labelH_mm,
    width_mm: ((maxX - minX + 1) / w) * labelW_mm,
    height_mm: ((maxY - minY + 1) / h) * labelH_mm,
  };
}

function clusterLabelRegions(art) {
  const { width, height, components } = floodComponents(art);
  const usable = components.filter((c) => {
    const cw = c.maxX - c.minX + 1;
    const ch = c.maxY - c.minY + 1;
    if (cw > width * 0.92 && ch > height * 0.92) return false;
    if (c.minX <= 1 && c.maxX >= width - 2 && ch > height * 0.5) return false;
    return true;
  });
  const groups = { textTop: [], textBottom: [], barcode: [], textRight: [] };
  for (const c of usable) {
    const cx = (c.minX + c.maxX) / 2 / width;
    const cy = (c.minY + c.maxY) / 2 / height;
    if (cx >= 0.76 && cy > 0.28 && cy < 0.72) groups.textRight.push(c);
    else if (cx >= 0.46 && cx < 0.82) groups.barcode.push(c);
    else if (cy < 0.42) groups.textTop.push(c);
    else groups.textBottom.push(c);
  }
  const merged = [];
  const top = mergeBoxes(groups.textTop);
  const bottom = mergeBoxes(groups.textBottom);
  const barcode = mergeBoxes(groups.barcode);
  const right = mergeBoxes(groups.textRight);
  if (top) merged.push({ kind: 'text', box: top });
  if (bottom) merged.push({ kind: 'text', box: bottom });
  if (barcode) merged.push({ kind: 'datamatrix', box: barcode });
  if (right) merged.push({ kind: 'text', box: right });
  return merged.filter((entry) => entry.box);
}

function sampleTextsForLibrary(libraryName, regions) {
  const name = String(libraryName || '').toLowerCase();
  if (name.includes('a4a')) {
    const textQueue = ['MFR 1U2R7', 'SER MH80312', 'UID'];
    let textIndex = 0;
    return regions.map((region) => {
      if (region.kind === 'datamatrix') {
        return { text: '[)>\x1e06\x1dS1U2R7\x1dMH80312\x1d\x1e\x04' };
      }
      const value = textQueue[textIndex] ?? `Text ${textIndex + 1}`;
      textIndex += 1;
      return { text: value };
    });
  }
  let textCounter = 0;
  let barcodeCounter = 0;
  return regions.map((region) => {
    if (region.kind === 'datamatrix') {
      barcodeCounter += 1;
      return { text: `SAMPLE-${barcodeCounter}` };
    }
    textCounter += 1;
    return { text: `Text ${textCounter}` };
  });
}

function buildTextElement(geom, text, index) {
  const height_mm = Math.max(2.5, Math.min(geom.height_mm * 0.85, 6));
  return {
    type: 'text',
    label: `Text ${index + 1}`,
    x_mm: geom.x_mm,
    y_mm: geom.y_mm,
    width_mm: Math.max(geom.width_mm, 8),
    height_mm,
    font_family: 'Arial',
    text,
    text_align: 'left',
    vertical_align: 'top',
    source_format: 'btw-library-decomposed',
  };
}

function buildDataMatrixElement(geom, text, index) {
  const side = Math.max(geom.width_mm, geom.height_mm);
  const size = Math.max(8, Math.min(side, 28));
  const magnification = Math.max(3, Math.min(12, Math.round(size / 3.5)));
  return {
    type: 'datamatrix',
    label: `Barcode ${index + 1}`,
    x_mm: geom.x_mm,
    y_mm: geom.y_mm,
    width_mm: size,
    height_mm: size,
    magnification,
    text,
    source_format: 'btw-library-decomposed',
  };
}

function buildLibraryElementsFromArtwork(art, labelW_mm, labelH_mm, libraryMeta = {}) {
  if (!art?.bitmap_hex || !(art.bitmap_width > 0) || !(art.bitmap_height > 0)) return null;
  const regions = clusterLabelRegions(art);
  if (regions.length < 2) return null;
  const samples = sampleTextsForLibrary(libraryMeta.name || libraryMeta.format_name, regions);
  let textCount = 0;
  let barcodeCount = 0;
  const elements = regions.map((region, index) => {
    const geom = boxToMm(region.box, art, labelW_mm, labelH_mm);
    const sample = samples[index]?.text ?? '';
    if (region.kind === 'datamatrix') {
      barcodeCount += 1;
      return buildDataMatrixElement(geom, sample, barcodeCount - 1);
    }
    textCount += 1;
    return buildTextElement(geom, sample, textCount - 1);
  });
  return {
    elements,
    decomposed: true,
    side_edges_mm: DEFAULT_SIDE_EDGE_MM,
  };
}

function applyLibraryElementsToTemplate(template, art, libraryMeta) {
  const width_mm = Number(template.width_mm);
  const height_mm = Number(template.height_mm);
  const built = buildLibraryElementsFromArtwork(art, width_mm, height_mm, libraryMeta);
  if (!built) return template;
  return {
    ...template,
    elements: built.elements,
    bartender_library_template: {
      ...(template.bartender_library_template || {}),
      artwork_imported: true,
      objects_decomposed: true,
      decomposition: 'btw-preview-clusters',
    },
  };
}

module.exports = {
  buildLibraryElementsFromArtwork,
  applyLibraryElementsToTemplate,
  clusterLabelRegions,
  DEFAULT_SIDE_EDGE_MM,
};
