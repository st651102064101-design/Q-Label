'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { INDUSTRY_DISPLAY, resolveInstalledTemplateRoot } = require('../lib/bartender-template-paths');
const { fetchAllCloudTemplates } = require('../lib/bartender-cloud-templates');
const { readBtwMetadata } = require('../lib/btw-metadata');

const PAGE_SIZE = 50;
const CLOUD_URL = 'https://templatebrowser.bartendercloud.com/bttemplatebrowser/';
const THUMBNAIL_CDN = 'https://bartender-images-cdn.bartendercloud.com/';

function parseSizeInches(fileName) {
  const match = String(fileName).match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  return { width_in: Number(match[1]), height_in: Number(match[2]) };
}

function displayNameFromFile(fileName) {
  return path.basename(fileName, '.btw').replace(/\s+-\s+Version\s+\d+$/i, '').trim();
}

function walkBtw(root, industry, bucket) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) walkBtw(full, industry || entry.name, bucket);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.btw')) {
      const topIndustry = industry || 'Miscellaneous';
      const name = displayNameFromFile(entry.name);
      const size = parseSizeInches(entry.name);
      let meta = {};
      try {
        meta = readBtwMetadata(full);
      } catch (_) {
        /* optional */
      }
      bucket.push({
        id: `local:${full.toLowerCase()}`,
        name,
        description: `${name} (${topIndustry})`,
        industry: INDUSTRY_DISPLAY[topIndustry] || topIndustry,
        source_industry: topIndustry,
        relative_path: full,
        source: 'local',
        btw_file_name: path.basename(full),
        width_in: meta.width_in ?? size?.width_in ?? null,
        height_in: meta.height_in ?? size?.height_in ?? null,
        thumbnail_url: '',
      });
    }
  }
}

function mergeCatalog(cloud, local) {
  const byKey = new Map();
  for (const item of cloud.templates) {
    let id=item.id,index=2;while(byKey.has(id))id=`${item.id}:${index++}`;
    byKey.set(id,{...item,id});
  }
  for (const item of local) {
    const key = String(item.name).toLowerCase();
    const existing = [...byKey.values()].find(row=>row.cloud_name&&String(row.name).toLowerCase()===key);
    if (existing) {
      byKey.set(existing.id, {
        ...existing,
        relative_path: item.relative_path,
        source: 'cloud+local',
      });
    } else {
      byKey.set(item.id, item);
    }
  }
  const templates = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
  return templates;
}

async function main() {
  const root = resolveInstalledTemplateRoot();
  const local = [];
  if (root) {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      walkBtw(path.join(root, entry.name), entry.name, local);
    }
  }
  console.log(`Local scan: ${local.length} templates${root ? ` from ${root}` : ' (no install folder)'}`);
  const cloud = await fetchAllCloudTemplates();
  console.log(`Cloud catalog: ${cloud.templates.length} of ${cloud.totalCount} templates`);
  const templates = mergeCatalog(cloud, local);
  const payload = {
    cloud_url: CLOUD_URL,
    template_service_url: 'https://ap1.bartendercloud.com/templaterepository/templateService/',
    thumbnail_cdn: THUMBNAIL_CDN,
    page_size: PAGE_SIZE,
    source_root: root || '',
    imported_at: new Date().toISOString(),
    count: templates.length,
    cloud_count: cloud.templates.length,
    local_count: local.length,
    templates,
  };
  const outJs = path.join(__dirname, '..', 'gui', 'template-library-catalog.js');
  const body = `'use strict';\n(function (root) {\n  const catalog = ${JSON.stringify(payload, null, 2)};\n  root.QLabelTemplateLibraryCatalog = Object.freeze(catalog);\n})(typeof window === 'undefined' ? globalThis : window);\n`;
  fs.writeFileSync(outJs, body, 'utf8');
  console.log(`Wrote ${templates.length} merged templates → ${outJs}`);
}

module.exports={mergeCatalog};
if(require.main===module)main().catch((error) => {
  console.error(error);
  process.exit(1);
});
