'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROG_ID = 'QLabel.LabelDocument';
const EXT = '.qlabel';

function resolveDocumentIconPath(options = {}) {
  if (options.iconPath && fs.existsSync(options.iconPath)) return path.resolve(options.iconPath);
  const candidates = [
    path.join(process.resourcesPath || '', 'qlabel-document.ico'),
    path.join(process.resourcesPath || '', 'build', 'icon.ico'),
    path.resolve(__dirname, '../build/icon.ico'),
  ];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function registerWindowsQlabelDocumentType(options = {}) {
  if (process.platform !== 'win32') return { ok: true, skipped: true, reason: 'not-windows' };
  const exe = path.resolve(options.appPath || process.execPath);
  const icon = resolveDocumentIconPath(options);
  if (!icon) return { ok: false, error: 'Q LABEL document icon (.ico) not found.' };
  const appName = options.appName || 'Q LABEL';
  const iconRef = `${icon.replace(/\//g, '\\')},0`;
  const command = `"${exe.replace(/"/g, '\\"')}" "%1"`;
  const add = (key, value) => {
    execFileSync('reg', ['add', key, '/ve', '/d', value, '/f'], { stdio: 'ignore' });
  };
  try {
    add(`HKCU\\Software\\Classes\\${EXT}`, PROG_ID);
    add(`HKCU\\Software\\Classes\\${PROG_ID}`, `${appName} document`);
    add(`HKCU\\Software\\Classes\\${PROG_ID}\\DefaultIcon`, iconRef);
    add(`HKCU\\Software\\Classes\\${PROG_ID}\\shell\\open\\command`, command);
    return { ok: true, progId: PROG_ID, icon: iconRef };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

module.exports = {
  PROG_ID,
  EXT,
  resolveDocumentIconPath,
  registerWindowsQlabelDocumentType,
};
