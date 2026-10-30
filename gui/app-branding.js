'use strict';

const APP_NAME = 'Q Label';
const APP_ID = 'com.qlabel.app';

function normalizeDisplayVersion(displayVersionLabel) {
  const raw = String(displayVersionLabel ?? '').trim().replace(/^v/i, '');
  if (!raw) return '';
  return /^\d+(?:\.\d{1,2})?$/.test(raw) ? Number(raw).toFixed(3) : raw;
}

function applicationWindowTitle(displayVersionLabel) {
  const version = normalizeDisplayVersion(displayVersionLabel);
  return version ? `${APP_NAME} (${version})` : APP_NAME;
}

function isBrandedWindowTitle(pageTitle) {
  const normalized = String(pageTitle || '').trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === APP_NAME.toLowerCase()) return true;
  return normalized.startsWith(`${APP_NAME.toLowerCase()} (`) && normalized.endsWith(')');
}

function configureApplicationIdentity(app, { packaged = false } = {}) {
  if (!app) return;
  app.setName(APP_NAME);
  if (process.platform === 'win32') {
    app.setAppUserModelId(packaged ? APP_ID : `${APP_ID}.dev`);
  }
}

function pinBrowserWindowTitle(win, title) {
  if (!win) return;
  const pinned = String(title || applicationWindowTitle('')).trim() || APP_NAME;
  const apply = () => win.setTitle(pinned);
  apply();
  win.webContents.on('did-finish-load', apply);
  win.on('page-title-updated', (event, pageTitle) => {
    if (isBrandedWindowTitle(pageTitle)) return;
    event.preventDefault();
    apply();
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    APP_NAME,
    APP_ID,
    normalizeDisplayVersion,
    applicationWindowTitle,
    isBrandedWindowTitle,
    configureApplicationIdentity,
    pinBrowserWindowTitle,
  };
}
