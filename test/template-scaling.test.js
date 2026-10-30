'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const TemplateScaling = require('../gui/template-scaling');

const oldSize = { width_mm: 10, height_mm: 10 };
const newSize = { width_mm: 20, height_mm: 5 };
const elementSet = () => [
  { type: 'text', x_mm: 1, y_mm: 2, width_mm: 8, height_mm: 4, text_box_width_mm: 8, text_box_height_mm: 4, font_size_pt: 12, text_ranges: [{ start: 0, end: 1, font_size_pt: 16 }], text: 'A' },
  { type: 'barcode128', x_mm: 1, y_mm: 2, width_mm: 5, height_mm: 10, module_width: 2, bar_height_mm: 8, hri_height_mm: 3, hri_box_height_mm: 4, hri_offset_mm: 1 },
  { type: 'image', x_mm: 1, y_mm: 2, width_mm: 4, height_mm: 3, bitmap_hex: '00FF' },
  { type: 'line', x_mm: 1, y_mm: 2, width_mm: 4, height_mm: 6, thickness_mm: 0.4 },
  { type: 'box', x_mm: 1, y_mm: 2, width_mm: 2, height_mm: 3, thickness_mm: 0.2 },
  { type: 'qrcode', x_mm: 1, y_mm: 2, width_mm: 4, height_mm: 4, magnification: 4 },
  { type: 'datamatrix', x_mm: 1, y_mm: 2, width_mm: 4, height_mm: 4, magnification: 4 },
  { type: 'table', x_mm: 1, y_mm: 2, width_mm: 4, height_mm: 6, table_model: { rows: [{ cells: ['keep'] }], cellTextStyles: { '0,0': { fontSize: 12 } } } }
];
const result = (document, rules = TemplateScaling.DEFAULT_RULES) => TemplateScaling.scaleDocument(document, oldSize, newSize, rules);

test('significanceThresholdIsInclusive', () => {
  assert.equal(TemplateScaling.isSignificant(oldSize, { width_mm: 11, height_mm: 10 }), true);
  assert.equal(TemplateScaling.isSignificant(oldSize, { width_mm: 9, height_mm: 10 }), true);
  assert.equal(TemplateScaling.isSignificant(oldSize, { width_mm: 10.9999, height_mm: 10 }), false);
  assert.equal(TemplateScaling.isSignificant(oldSize, { width_mm: 10, height_mm: 11 }), true);
  assert.equal(TemplateScaling.isSignificant(oldSize, { width_mm: 10, height_mm: 10 }), false);
  assert.equal(TemplateScaling.isSignificant({ width_mm: 0, height_mm: 10 }, newSize), false);
});

test('do not scale preserves all geometry for text barcode picture and square codes',()=>{
  const elements=[elementSet()[0],elementSet()[1],elementSet()[2],elementSet()[5]];
  const output=result({elements},{text:'none',barcode:'none',picture:'none'}).document;
  assert.deepEqual(output.elements,elements.map(element=>({...element,scaling_reference_size:oldSize})),'every geometry field is unchanged and its original coordinate space is recorded');
});

test('retained artwork survives JSON reload and repeated layout changes across pages and sides',()=>{
  const original=elementSet(),document={elements:structuredClone(original),designs:{back:{elements:structuredClone(original)}},template_pages:[{design:{elements:structuredClone(original)}}]};
  TemplateScaling.retainArtworkSize(document,oldSize);
  TemplateScaling.retainArtworkSize(document,{width_mm:5,height_mm:10});
  const reloaded=JSON.parse(JSON.stringify(document));
  const scaled=TemplateScaling.scaleDocument(reloaded,{width_mm:2.5,height_mm:10},oldSize);
  assert.equal(scaled.ok,true);
  for(const design of [scaled.document,scaled.document.designs.back,scaled.document.template_pages[0].design])assert.deepEqual(design.elements,original,'all artwork types retain their original geometry after returning to their authoring size');
  assert.deepEqual(reloaded.elements[0].scaling_reference_size,oldSize,'scaling does not mutate the input');
});

test('old retained objects and new objects scale from their own reference sizes',()=>{
  const document={elements:[elementSet()[1]]};TemplateScaling.retainArtworkSize(document,oldSize);
  document.elements.push({...elementSet()[1],width_mm:2,module_width:1});
  const scaled=TemplateScaling.scaleDocument(document,{width_mm:5,height_mm:10},oldSize).document;
  assert.equal(scaled.elements[0].width_mm,5);assert.equal(scaled.elements[0].module_width,2);
  assert.equal(scaled.elements[1].width_mm,4);assert.equal(scaled.elements[1].module_width,2);
  const none=TemplateScaling.scaleDocument(document,{width_mm:5,height_mm:10},oldSize,{barcode:'none'}).document;
  assert.equal(none.elements[1].width_mm,2);assert.deepEqual(none.elements[1].scaling_reference_size,{width_mm:5,height_mm:10});
});

test('scale thickness adjusts line stroke while maintain thickness preserves it',()=>{
  const line=elementSet()[3];
  assert.equal(result({elements:[line]},{line:'scale-thickness'}).document.elements[0].thickness_mm,.8);
});

test('textScalesGeometryAndAllFontRunsProportionally', () => {
  const input = { width_mm: 10, height_mm: 10, elements: [elementSet()[0]] };
  const output = result(input).document.elements[0];
  assert.equal(output.x_mm, 2);
  assert.equal(output.y_mm, 1);
  assert.equal(output.width_mm, 4);
  assert.equal(output.height_mm, 2);
  assert.equal(output.text_box_width_mm, 4);
  assert.equal(output.text_box_height_mm, 2);
  assert.equal(output.font_size_pt, 6);
  assert.equal(output.text_ranges[0].font_size_pt, 8);
  assert.equal(input.elements[0].font_size_pt, 12, 'input remains unchanged');
});

test('textFreeRuleScalesHorizontalAndVerticalMetricsIndependently', () => {
  const element = { ...elementSet()[0], letter_spacing_mm: 0.25 };
  const output = result({ width_mm: 10, height_mm: 10, elements: [element] }, { ...TemplateScaling.DEFAULT_RULES, text: 'free' }).document.elements[0];
  assert.deepEqual([output.width_mm, output.height_mm, output.text_box_width_mm, output.text_box_height_mm], [16, 2, 16, 2]);
  assert.deepEqual([output.font_size_pt, output.text_ranges[0].font_size_pt, output.letter_spacing_mm], [6, 8, 0.5]);
});

test('barcodeScalesWidthAndHeightFieldsIndependently', () => {
  const output = result({ width_mm: 10, height_mm: 10, elements: [elementSet()[1]] }).document.elements[0];
  assert.equal(output.x_mm, 2);
  assert.equal(output.y_mm, 1);
  assert.equal(output.width_mm, 10);
  assert.equal(output.height_mm, 5);
  assert.equal(output.module_width, 4);
  assert.equal(output.bar_height_mm, 4);
  assert.equal(output.hri_height_mm, 1.5);
  assert.equal(output.hri_box_height_mm, 2);
  assert.equal(output.hri_offset_mm, 0.5);
});

test('barcodeProportionalRuleUsesTheSmallerAxisForGeometry', () => {
  const output = result({ width_mm: 10, height_mm: 10, elements: [elementSet()[1]] }, { ...TemplateScaling.DEFAULT_RULES, barcode: 'proportional' }).document.elements[0];
  assert.deepEqual([output.width_mm, output.height_mm, output.module_width, output.bar_height_mm], [2.5, 5, 1, 4]);
});

test('picturePreservesAspectRatio', () => {
  const output = result({ width_mm: 10, height_mm: 10, elements: [elementSet()[2]] }).document.elements[0];
  assert.equal(output.x_mm, 2);
  assert.equal(output.y_mm, 1);
  assert.equal(output.width_mm, 2);
  assert.equal(output.height_mm, 1.5);
  assert.equal(output.bitmap_hex, '00FF');
});

test('lineScalesEndpointsAndPreservesThickness', () => {
  const output = result({ width_mm: 10, height_mm: 10, elements: [elementSet()[3]] }).document.elements[0];
  assert.deepEqual([output.x_mm, output.y_mm, output.width_mm, output.height_mm], [2, 1, 8, 3]);
  assert.equal(output.thickness_mm, 0.4);
});

test('otherShapesAndTablesScaleFreely', () => {
  const output = result({ width_mm: 10, height_mm: 10, elements: [elementSet()[4], elementSet()[7]] }).document.elements;
  assert.deepEqual([output[0].width_mm, output[0].height_mm, output[0].thickness_mm], [4, 1.5, 0.4]);
  assert.deepEqual([output[1].x_mm, output[1].y_mm, output[1].width_mm, output[1].height_mm], [2, 1, 8, 3]);
  assert.deepEqual(output[1].table_model, elementSet()[7].table_model, 'table values/styles are preserved');
});

test('pictureBackedTableScalesGeometryAndFixedAxes', () => {
  const table = { type: 'image', x_mm: 1, y_mm: 2, width_mm: 4, height_mm: 6, table_model: { columns: [{ mode: 'Fixed', size: 2 }], rows: [{ mode: 'Fixed', size: 3 }], values: [['keep']] } };
  const output = result({ width_mm: 10, height_mm: 10, elements: [table] }).document.elements[0];
  assert.deepEqual([output.x_mm, output.y_mm, output.width_mm, output.height_mm], [2, 1, 8, 3]);
  assert.deepEqual([output.table_model.columns[0].size, output.table_model.rows[0].size], [4, 1.5]);
  assert.deepEqual(output.table_model.values, [['keep']]);
});

test('qrModulesStaySquare', () => {
  const output = result({ width_mm: 10, height_mm: 10, elements: [elementSet()[5], elementSet()[6]] }).document.elements;
  assert.equal(output[0].width_mm, 2);
  assert.equal(output[0].height_mm, 2);
  assert.equal(output[0].magnification, 2);
  assert.equal(output[1].magnification, 2);
});

test('scalesEveryDesignSideAndSavedTemplatePage', () => {
  const element = () => ({ type: 'box', x_mm: 2, y_mm: 2, width_mm: 2, height_mm: 2 });
  const design = () => ({ elements: [element()], designs: { front: { elements: [element()] }, back: { elements: [element()] }, page: { elements: [element()] } } });
  const input = { width_mm: 10, height_mm: 10, elements: [element()], designs: { front: { elements: [element()] }, back: { elements: [element()] }, page: { elements: [element()] } }, template_pages: [{ design: design() }, { design: design() }] };
  const output = result(input).document;
  const all = [output, ...output.template_pages.map(page => page.design)];
  for (const entry of all) {
    assert.equal(entry.elements[0].x_mm, 4);
    for (const side of ['front', 'back', 'page']) assert.equal(entry.designs[side].elements[0].x_mm, 4);
  }
  assert.equal(input.template_pages[0].design.elements[0].x_mm, 2, 'saved pages are cloned before scaling');
});

test('preservesMetadataTableStylesBindingsAndBitmapBytes', () => {
  const input = { id: 'doc-1', width_mm: 10, height_mm: 10, values: { sku: 'A1' }, elements: [{ ...elementSet()[2], binding: 'sku', alt_text: 'keep' }, elementSet()[7]] };
  const output = result(input).document;
  assert.equal(output.id, input.id);
  assert.deepEqual(output.values, input.values);
  assert.equal(output.elements[0].binding, 'sku');
  assert.equal(output.elements[0].bitmap_hex, '00FF');
  assert.deepEqual(output.elements[1].table_model, input.elements[1].table_model);
});

test('invalidNestedInputReturnsOriginalUnchanged', () => {
  for (const [oldDims, newDims] of [[{ width_mm: 0, height_mm: 10 }, newSize], [oldSize, { width_mm: Infinity, height_mm: 5 }]]) {
    assert.equal(TemplateScaling.scaleDocument({ width_mm: 10, height_mm: 10, elements: [] }, oldDims, newDims).ok, false);
  }
  const input = { width_mm: 10, height_mm: 10, elements: [{ type: 'box', x_mm: 1, y_mm: 1, width_mm: 2, height_mm: 2 }], template_pages: [null] };
  const before = structuredClone(input);
  const output = result(input);
  assert.equal(output.ok, false);
  assert.deepEqual(input, before, 'failure does not partially mutate the source document');
});
