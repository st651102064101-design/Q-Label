'use strict';

// Bratender targets Zebra printers, so all templates use ZPL.
const { buildZpl, extractPlaceholders, mmToDots, fillPlaceholders, renderLabelBody } = require('./zpl');
function buildLabel(template, dataList, opts = {}) {
  return buildZpl(template, dataList, opts);
}

module.exports = { buildLabel, buildZpl, extractPlaceholders, mmToDots, fillPlaceholders, renderLabelBody };
