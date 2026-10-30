'use strict';

const fs = require('node:fs');
const { parseSizesString, layoutToInches } = require('./bartender-cloud-templates');

function readBtwText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const utf16 = buffer.toString('utf16le');
  if (utf16.includes('BarTender Format File') || utf16.includes('TemplateSize')) return utf16;
  return buffer.toString('latin1');
}

function extractTag(text, tag) {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
  const match = text.match(re);
  return match ? match[1].trim() : '';
}

function parseTemplateSizeTag(value) {
  return parseSizesString(value.replace(/"/g, '"'));
}

function readBtwMetadata(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { ok: false, error: 'Template file not found.' };
  }
  const text = readBtwText(filePath);
  const templateSize = extractTag(text, 'TemplateSize') || extractTag(text, 'LabelSize');
  const pageSize = extractTag(text, 'PageSize') || extractTag(text, 'PaperSize');
  const fromTemplate = parseTemplateSizeTag(templateSize);
  const fromPage = parseTemplateSizeTag(pageSize);
  const width_in = fromTemplate.width_in ?? fromPage.width_in;
  const height_in = fromTemplate.height_in ?? fromPage.height_in;
  const name = extractTag(text, 'FormatName') || extractTag(text, 'DocumentName');
  return {
    ok: true,
    template_size: templateSize,
    page_size: pageSize,
    width_in,
    height_in,
    width_mm: width_in != null ? width_in * 25.4 : null,
    height_mm: height_in != null ? height_in * 25.4 : null,
    page_width_in: fromPage.width_in,
    page_height_in: fromPage.height_in,
    format_name: name,
  };
}

function catalogItemToDimensions(item) {
  const width_in = item.width_in ?? layoutToInches(item.layout_width);
  const height_in = item.height_in ?? layoutToInches(item.layout_height);
  const width_mm = width_in != null ? width_in * 25.4 : null;
  const height_mm = height_in != null ? height_in * 25.4 : null;
  return { width_in, height_in, width_mm, height_mm };
}

module.exports = { readBtwMetadata, catalogItemToDimensions, extractTag };
