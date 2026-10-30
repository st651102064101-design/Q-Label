'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseSizesString, layoutToInches, normalizeCloudNode } = require('../lib/bartender-cloud-templates');

test('catalog merge preserves distinct cloud templates sharing a display name',()=>{
 const {mergeCatalog}=require('../scripts/import-bartender-templates');
 const cloud={templates:[{id:'cloud:a',cloud_name:'a',name:'Same',source:'cloud'},{id:'cloud:b',cloud_name:'b',name:'Same',source:'cloud'}]};
 const rows=mergeCatalog(cloud,[{id:'local:a',name:'Same',relative_path:'a.btw',source:'local'}]);
 assert.equal(rows.filter(x=>x.cloud_name).length,2);assert.ok(rows.some(x=>x.id==='cloud:a'));assert.ok(rows.some(x=>x.id==='cloud:b'));
});
test('catalog merge keeps every cloud row when the service repeats its name key',()=>{
 const {mergeCatalog}=require('../scripts/import-bartender-templates');
 const rows=mergeCatalog({templates:[{id:'cloud:a',name:'A',source:'cloud'},{id:'cloud:a',name:'A',source:'cloud'}]},[]);
 assert.equal(rows.length,2);assert.equal(new Set(rows.map(x=>x.id)).size,2);
});

test('parseSizesString reads inch marks from BarTender size text', () => {
  assert.deepEqual(parseSizesString('3" x 1"'), { width_in: 3, height_in: 1 });
  assert.deepEqual(parseSizesString('3.93 x 2.583'), { width_in: 3.93, height_in: 2.583 });
});

test('layoutToInches converts cloud layoutWidth thousandths', () => {
  assert.equal(layoutToInches(7000), 7);
  assert.equal(layoutToInches(4000), 4);
});

test('normalizeCloudNode maps GraphQL template fields', () => {
  const item = normalizeCloudNode({
    name: 'Accessory Box',
    displayName: 'Accessory Box',
    description: 'Basic label for boxing retail accessories',
    industries: ['Retail'],
    sizes: '3.93" x 2.583"',
    layoutWidth: '3930',
    layoutHeight: '2583',
    btwFileName: 'Accessory Box.btw',
    thumbnailFilePath: 'TemplateImages/previewLow/Accessory_Box.png',
    assetCollection: [
      { type: 'PreviewLow', url: 'https://example.test/preview.png' },
      { type: 'BTW', url: 'https://example.test/Accessory Box.btw' },
    ],
  });
  assert.equal(item.name, 'Accessory Box');
  assert.equal(item.industry, 'Retail');
  assert.equal(item.thumbnail_url, 'https://example.test/preview.png');
  assert.equal(item.btw_url, 'https://example.test/Accessory Box.btw');
  assert.equal(item.width_in, 3.93);
});
