'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
function setup(t){
 const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'dangerously',pretendToBeVisual:true});t.after(()=>dom.window.close());
 const w=dom.window;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.QLabelTemplateLibraryCatalog={templates:Array.from({length:480},(_,i)=>({id:String(i),name:'Template '+i,description:'Description',industry:i%2?'Retail':'Automotive',source:'cloud',thumbnail_url:'https://example.test/preview.png'})),page_size:50};
 const standards=require('../gui/assets/template-browser/filters/standards.json');
 const industries=require('../gui/assets/template-browser/filters/industries.json');
 const shapes=require('../gui/assets/template-browser/filters/shapes.json');
 w.fetch=async url=>{const target=String(url);if(target.includes('Standards-Technology')||target.includes('standards.json'))return{ok:true,json:async()=>standards};if(target.includes('Industries.json')||target.includes('industries.json'))return{ok:true,json:async()=>industries};if(target.includes('FilterItems')||target.includes('shapes.json'))return{ok:true,json:async()=>shapes};return{ok:false,status:404,json:async()=>({})};};
 w.eval(fs.readFileSync(require.resolve('../gui/template-browser-filter-catalog'),'utf8'));
 w.eval(fs.readFileSync(require.resolve('../gui/template-browser'),'utf8'));w.openTemplateBrowser();return {w,d:w.document.querySelector('dialog')};
}
test('Add Filter uses BarTender category tabs and filters industry tiles immediately',async t=>{
 const {w,d}=setup(t);w.prompt=()=>{throw Error('prompt must not be used');};d.querySelector('#tbAddFilter').click();
 await new Promise(resolve=>setImmediate(resolve));
 const modal=w.document.querySelector('.tb-filter-dialog');assert.ok(modal);assert.deepEqual([...modal.querySelectorAll('[role=tab]')].map(x=>x.textContent.trim()),['Standards and Technology','Industries','Shapes and Orientation']);
 assert.match(modal.querySelector('.tb-filter-tab-icon')?.src,/FilterIcons\/Standards%20and%20Technology\.svg/);
 assert.match(modal.querySelector('.tb-filter-option-image')?.src,/bartender-images-cdn\.bartendercloud\.com/);
 modal.querySelector('[data-filter-category="Industries"]').click();
 const retail=modal.querySelector('[data-filter-value="Retail"]');assert.ok(retail);retail.click();
 assert.match(d.querySelector('#tbStatus').textContent,/240 templates/);assert.equal(d.querySelector('.tb-tag').textContent,'Retail');modal.querySelector('.tb-filter-close').click();d.querySelector('.tb-chips button').click();assert.match(d.querySelector('#tbStatus').textContent,/480 templates/);
});
test('browser uses the public CDN for protected S3 preview images',t=>{
 const {w,d}=setup(t);d.close();w.QLabelTemplateLibraryCatalog.templates[0].thumbnail_url='https://bartender-template-s3-storage-gateway.s3.us-west-2.amazonaws.com/TemplateImages/previewLow/A4A+Label.png';w.openTemplateBrowser();
 assert.equal(d.querySelector('.tb-thumb img').src,'https://bartender-images-cdn.bartendercloud.com/TemplateImages/previewLow/A4A+Label.png');
});
test('filter dialog closes with Escape and no matches remains safe',async t=>{
 const {w,d}=setup(t);d.querySelector('#tbAddFilter').click();await new Promise(resolve=>setImmediate(resolve));const modal=w.document.querySelector('.tb-filter-dialog');
 modal.querySelector('[data-filter-category="Shapes and Orientation"]').click();assert.ok(modal.querySelector('[data-filter-value="Horizontal"]'));
 modal.querySelector('.tb-filter-close').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(w.document.querySelector('.tb-filter-dialog'),null);assert.equal(d.open,true);assert.equal(w.document.activeElement,d.querySelector('#tbAddFilter'));
 const search=d.querySelector('#tbSearch');search.value='no matching template';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.tb-card').length,0);assert.match(d.querySelector('#tbStatus').textContent,/0 - 0/);assert.equal(d.querySelector('#tbNext').disabled,true);
});
test('standard, industry, and orientation filters combine across categories',async t=>{
 const {w,d}=setup(t);d.close();w.QLabelTemplateLibraryCatalog.templates=[
  {id:'h',name:'Code 128 Horizontal',description:'Barcode',industry:'Automotive',width_in:3,height_in:1,source:'cloud'},
  {id:'v',name:'Data Matrix Vertical',description:'Barcode',industry:'Retail',width_in:1,height_in:3,source:'cloud'}
 ];w.openTemplateBrowser();d.querySelector('#tbAddFilter').click();await new Promise(resolve=>setImmediate(resolve));
 let modal=w.document.querySelector('.tb-filter-dialog');modal.querySelector('[data-filter-category="Standards and Technology"]').click();modal.querySelector('[data-filter-value="Code 128"]').click();
 modal.querySelector('[data-filter-category="Shapes and Orientation"]').click();modal.querySelector('[data-filter-value="Horizontal"]').click();
 assert.match(d.querySelector('#tbStatus').textContent,/1 templates found/);assert.equal(d.querySelector('.tb-card').dataset.id,'h');
 modal.querySelector('[data-filter-category="Industries"]').click();modal.querySelector('[data-filter-value="Retail"]').click();assert.match(d.querySelector('#tbStatus').textContent,/0 templates found/);
});
test('pagination shows last page, resets scroll and search, and returns selected template once',async t=>{
 const {w,d}=setup(t);assert.equal(d.querySelectorAll('.tb-card').length,50);assert.ok([...d.querySelectorAll('#tbPages button')].some(b=>b.textContent==='10'));
 d.querySelector('#tbGrid').scrollTop=400;d.querySelector('#tbNext').click();assert.equal(d.querySelector('#tbGrid').scrollTop,0);assert.match(d.querySelector('#tbStatus').textContent,/51 - 100/);
 const search=d.querySelector('#tbSearch');search.value='Template 479';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.tb-card').length,1);assert.equal(d.querySelector('#tbPrev').disabled,true);
 let picked=0;d.close();const result=w.openTemplateBrowser(()=>picked++);d.querySelector('.tb-card').click();assert.equal(picked,1);assert.equal((await result).item.id,'0');
});
test('Template Manager keeps scrolling inside the template grid without a dialog gutter',t=>{
 const {d}=setup(t),css=d.ownerDocument.querySelector('style').textContent;
 assert.match(css,/#templateBrowserDialog\.template-browser-dialog\[[^\]]*\]\s*\{[^}]*overflow:hidden!important/,'the open dialog overrides the global footer scrollbar rule');
 assert.match(css,/#templateBrowserDialog \.tb-grid\{[^}]*overflow:auto/,'the template list remains independently scrollable');
});
test('Template Manager and Q LABEL product icon use green brand colors',t=>{
 const {d}=setup(t),css=d.ownerDocument.querySelector('style').textContent,svg=fs.readFileSync(require.resolve('../build/icon.svg'),'utf8');
 assert.match(css,/#16a34a|#15803d|#22c55e/i);assert.doesNotMatch(css,/#068fbe|#0891b2|#0085a7/i);
 assert.match(svg,/#15803d/i);assert.match(svg,/#4ade80/i);
 const png=require('pngjs').PNG.sync.read(fs.readFileSync(require.resolve('../build/icon.png'))),offset=(20*png.width+64)*4;
 assert.ok(png.data[offset+1]>png.data[offset]&&png.data[offset+1]>png.data[offset+2],'window icon center is green');
 const ico=fs.readFileSync(require.resolve('../build/icon.ico'));assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),7);
});
