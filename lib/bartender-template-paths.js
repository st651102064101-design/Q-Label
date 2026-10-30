'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CANDIDATE_ROOTS = [
  path.join(process.env.ProgramData || 'C:\\ProgramData', 'Seagull', 'PrintStation', 'wwwroot', 'Templates'),
  path.join(
    process.env.ProgramData || 'C:\\ProgramData',
    'Seagull',
    'Installer',
    '{3D92A6C1-C804-48BA-8344-6A0E4466066E}',
    '466066E',
    'BarTender',
    'Templates',
  ),
];

/** Industry folder names → BarTender Template Browser display tags (screenshot). */
const INDUSTRY_DISPLAY = {
  Military: 'Defense',
  Automotive: 'Automotive',
  Retail: 'Retail',
  Logistics: 'Logistics',
  Healthcare: 'Healthcare',
  'Life Sciences': 'Healthcare',
  Food: 'Food',
  Shipping: 'Shipping',
  Signage: 'Signage',
  Telecommunications: 'Telecommunications',
  Cannabis: 'Cannabis',
  'Consumer Appliance': 'Retail',
  'Fraud Prevention': 'Miscellaneous',
  'Hazardous Materials GHS': 'Miscellaneous',
  'Heavy Equipment': 'Automotive',
  Miscellaneous: 'Miscellaneous',
};

function resolveInstalledTemplateRoot() {
  for (const root of CANDIDATE_ROOTS) {
    if (fs.existsSync(root)) return root;
  }
  return '';
}

module.exports = { CANDIDATE_ROOTS, INDUSTRY_DISPLAY, resolveInstalledTemplateRoot };
