'use strict';

const https = require('node:https');

const TEMPLATE_SERVICE_URL = 'https://ap1.bartendercloud.com/templaterepository/templateService/';
const THUMBNAIL_CDN = 'https://bartender-images-cdn.bartendercloud.com/';
const PAGE_SIZE = 50;

const TEMPLATES_QUERY = `
query GetTemplates($first: Int!, $after: String) {
  templates(
    first: $first
    after: $after
    order: { displayName: ASC }
    where: { and: [{ bTW: { eq: true } }] }
  ) {
    totalCount
    pageInfo { hasNextPage endCursor }
    nodes {
      name
      displayName
      description
      industries
      sizes
      shape
      btwFileName
      thumbnailFilePath
      layoutWidth
      layoutHeight
      assetCollection { type url }
    }
  }
}`;

function postGraphql(variables) {
  const body = JSON.stringify({ query: TEMPLATES_QUERY, variables });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'ap1.bartendercloud.com',
        path: '/templaterepository/templateService/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Accept: 'application/json',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (parsed.errors?.length) reject(new Error(parsed.errors.map((e) => e.message).join('; ')));
            else resolve(parsed.data);
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseSizesString(sizes) {
  const match = String(sizes || '').match(/(\d+(?:\.\d+)?)\s*"?\s*[x×]\s*(\d+(?:\.\d+)?)\s*"?/i);
  if (!match) return { width_in: null, height_in: null };
  return { width_in: Number(match[1]), height_in: Number(match[2]) };
}

function layoutToInches(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n / 1000;
}

function assetUrl(node, type) {
  const hit = (node.assetCollection || []).find((row) => row.type === type);
  return hit?.url || '';
}

function normalizeCloudNode(node) {
  const fromSizes = parseSizesString(node.sizes);
  const widthIn = fromSizes.width_in ?? layoutToInches(node.layoutWidth);
  const heightIn = fromSizes.height_in ?? layoutToInches(node.layoutHeight);
  const industry = Array.isArray(node.industries) && node.industries.length ? node.industries[0] : 'Miscellaneous';
  const thumbPath = node.thumbnailFilePath || '';
  const thumbnail_url = assetUrl(node, 'PreviewLow')
    || (thumbPath ? `${THUMBNAIL_CDN}${thumbPath.replace(/^\//, '')}` : '');
  const btw_url = assetUrl(node, 'BTW');
  const id = `cloud:${node.name || node.displayName || node.btwFileName}`;
  return {
    id,
    name: node.displayName || node.btwFileName || node.name,
    description: node.description || `${node.displayName || node.name} (${industry})`,
    industry,
    source: 'cloud',
    cloud_name: node.name,
    btw_file_name: node.btwFileName,
    btw_url,
    thumbnail_url,
    width_in: widthIn,
    height_in: heightIn,
    layout_width: node.layoutWidth,
    layout_height: node.layoutHeight,
    sizes: node.sizes || '',
  };
}

async function fetchAllCloudTemplates({ pageSize = PAGE_SIZE, maxPages = 20 } = {}) {
  const templates = [];
  let after = null;
  let totalCount = null;
  for (let page = 0; page < maxPages; page += 1) {
    const data = await postGraphql({ first: pageSize, after });
    const block = data?.templates;
    if (!block) break;
    totalCount = block.totalCount ?? totalCount;
    for (const node of block.nodes || []) templates.push(normalizeCloudNode(node));
    if (!block.pageInfo?.hasNextPage) break;
    after = block.pageInfo.endCursor;
  }
  return { totalCount: totalCount ?? templates.length, templates };
}

module.exports = {
  TEMPLATE_SERVICE_URL,
  THUMBNAIL_CDN,
  fetchAllCloudTemplates,
  normalizeCloudNode,
  parseSizesString,
  layoutToInches,
};
