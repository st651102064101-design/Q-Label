'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const { version } = require('../package.json');
const defaultShare = 'S:\\Solution\\Software\\Q Labels';
const shareDir = process.env.QLABEL_INSTALLER_DIR || defaultShare;
const buildOut = process.env.QLABEL_BUILD_OUTPUT || path.join(shareDir, '_build');
const tempDir = process.env.QLABEL_BUILD_TEMP || path.join(shareDir, '_temp');
const distDir = buildOut;

function run(command) {
  console.log(`> ${command}`);
  fs.mkdirSync(buildOut, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });
  const env = {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: 'false',
    TEMP: tempDir,
    TMP: tempDir,
  };
  execSync(command, { cwd: root, stdio: 'inherit', env });
}

run('npm run build:database');
run(`npx electron-builder --win nsis --config.directories.output=${JSON.stringify(buildOut)}`);

const installers = fs.readdirSync(distDir).filter(name => /^Q Label Setup .*\.exe$/i.test(name));
if (!installers.length) {
  console.error('No NSIS installer found in dist/.');
  process.exit(1);
}
installers.sort((a, b) => fs.statSync(path.join(distDir, b)).mtimeMs - fs.statSync(path.join(distDir, a)).mtimeMs);
const latest = installers[0];
const source = path.join(distDir, latest);

if (!fs.existsSync(shareDir)) {
  fs.mkdirSync(shareDir, { recursive: true });
}
const target = path.join(shareDir, latest);
fs.copyFileSync(source, target);
console.log(`Installer: ${source}`);
console.log(`Copied to: ${target}`);
console.log(`Version: ${version}`);
