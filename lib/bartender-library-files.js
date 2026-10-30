'use strict';

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const http = require('node:http');
const { resolveInstalledTemplateRoot } = require('./bartender-template-paths');

function libraryDir(userData) {
  return path.join(userData, 'library-templates');
}

function safeFileName(name) {
  return String(name || 'template').replace(/[<>:"/\\|?*]+/g, '_').slice(0, 120);
}

function publicLibraryUrl(url) {
  return String(url || '').replace(/^https:\/\/bartender-template-s3-storage-gateway\.s3\.us-west-2\.amazonaws\.com\//i, 'https://bartender-images-cdn.bartendercloud.com/');
}

function localInstalledPath(item) {
  const relative = item.relative_path;
  if (relative && fs.existsSync(relative)) return relative;
  const root = resolveInstalledTemplateRoot();
  if (!root || !relative) return '';
  const candidate = path.join(root, path.basename(String(relative)));
  return fs.existsSync(candidate) ? candidate : relative;
}

function downloadUrl(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadUrl(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed (${res.statusCode})`));
        return;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function ensureLibraryBtwFile(item, userData) {
  const dir = libraryDir(userData);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = safeFileName(item.btw_file_name || `${item.name}.btw`);
  const dest = path.join(dir, fileName);
  if (fs.existsSync(dest)) return { ok: true, path: dest, cached: true };
  if (item.source === 'local' || item.relative_path) {
    const src = localInstalledPath(item);
    if (src && fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      return { ok: true, path: dest, copied: true };
    }
  }
  if (item.btw_url) {
    await downloadUrl(publicLibraryUrl(item.btw_url), dest);
    return { ok: true, path: dest, downloaded: true };
  }
  return { ok: false, error: 'No template file source available.' };
}

module.exports = { ensureLibraryBtwFile, libraryDir, localInstalledPath, publicLibraryUrl };
