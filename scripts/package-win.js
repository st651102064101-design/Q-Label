'use strict';

const path = require('path');
const packager = require('@electron/packager');
const root = path.resolve(__dirname, '..');
const { version } = require('../package.json');

// Ignore generated output folders only at the app root. Package-internal
// folders named "dist" (for example bwip-js/dist) are required at runtime.
function ignore(file) {
  const rel = String(file).replace(/\\/g, '/');
  return /^\/dist(?:-[^/]+)?(?:\/|$)/i.test(rel)
    || /^\/node_modules\/\.pnpm(?:\/|$)/i.test(rel)
    || /\/package-lock\.json$/i.test(rel)
    || /\/yarn\.lock$/i.test(rel)
    || /\/pnpm-lock\.yaml$/i.test(rel)
    || /\/\.git(?:\/|$)/i.test(rel)
    || /\/node_modules\/\.bin(?:\/|$)/i.test(rel)
    || /\.o(?:bj)?$/i.test(rel)
    || /\/node_gyp_bins(?:\/|$)/i.test(rel);
}

packager({
  dir: root,
  name: 'ABSS ZebraBar',
  platform: 'win32',
  arch: 'x64',
  icon: path.join(root, 'build', 'icon.ico'),
  out: path.join(root, process.env.BRATENDER_OUTPUT || 'dist-abss-zebrabar'),
  overwrite: true,
  appVersion: version,
  ignore,
}).then((paths) => {
  for (const packagedPath of paths) console.log(`Packaged app: ${packagedPath}`);
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
