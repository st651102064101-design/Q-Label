'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {catalog,encode,categoryFor}=require('../lib/barcode-catalog');
const {normalizeCatalog,filterCatalog}=require('../gui/barcode-categories');
const {renderLabelBody}=require('../lib/zpl');

test('barcode catalog assigns each supported symbology to exactly one app-specific folder',()=>{
  assert.ok(catalog.length>0);
  const ids=catalog.map(item=>item.bcid);
  assert.equal(new Set(ids).size,ids.length,'symbologies must not be duplicated');
  for(const item of catalog){
    assert.equal(item.folders.length,1,`${item.bcid} has one folder`);
    assert.equal(item.folders[0],item.category,`${item.bcid} folder matches its category`);
  }
  assert.deepEqual(categoryFor('gs1datamatrix'),'GS1 Formats');
  assert.deepEqual(categoryFor('code128'),'Core & Retail');
  assert.deepEqual(categoryFor('hibccode39'),'Medical IDs');
  assert.ok(!catalog.some(item=>['General Purpose','GS1 (by Application)','GS1 (by Symbology)','All Symbologies'].includes(item.folders[0])));
  const refreshed=normalizeCatalog([{bcid:'code128',folders:['General Purpose','All Symbologies']},{bcid:'gs1datamatrix',folders:['General Purpose','GS1 (by Symbology)']}]);
  assert.deepEqual(refreshed.map(item=>item.folders),[['Core & Retail'],['GS1 Formats']], 'UI repairs cached legacy categories from the main process');
  assert.deepEqual(filterCatalog(refreshed,'Core & Retail').map(item=>item.bcid),['code128']);
  assert.deepEqual(filterCatalog([{bcid:'code128',desc:'Code 128'}],'Core & Retail'),[], 'legacy catalog without folders is safely ignored until normalized');
  assert.deepEqual(normalizeCatalog([null,undefined,{bcid:'code128'}]).map(item=>item.bcid),['code128']);
});

test('barcode catalog still encodes a selectable barcode into a renderable bitmap',async()=>{
  const result=await encode({bcid:'code128',text:'Count01234567!',show_text:true});
  assert.ok(result.bitmap_width>0);
  assert.ok(result.bitmap_height>0);
  assert.equal(result.bitmap_hex.length,Math.ceil(result.bitmap_width/8)*result.bitmap_height*2);
  assert.match(result.src,/^data:image\/png;base64,/);
});

test('More Barcodes menu uses an SVG chevron instead of a text character',()=>{
  const source=fs.readFileSync(require.resolve('../gui/insert-tools.js'),'utf8');
  assert.match(source,/more-barcodes-arrow" viewBox="0 0 16 16"[^>]*><path d="m6 3 5 5-5 5"\/><\/svg>/);
  assert.doesNotMatch(source,/more-barcodes-arrow[^<]*&gt;/);
});

test('barcode picker avoids nested vertical scrollbars',()=>{
  const source=fs.readFileSync(require.resolve('../gui/barcode-catalog.js'),'utf8');
  assert.match(source,/#advancedBarcodePicker\{[^}]*overflow:hidden/);
  assert.match(source,/#advancedBarcodePicker\{[^}]*scrollbar-width:none/);
  assert.match(source,/#advancedBarcodePicker::-webkit-scrollbar\{display:none\}/);
  assert.match(source,/\.bc-list\{[^}]*overflow:auto/);
  assert.match(source,/\.bc-detail\{[^}]*overflow:hidden/);
  assert.match(source,/@media\(max-height:620px\)/);
});

test('barcode picker shows six columns on desktop and keeps a compact responsive grid',()=>{
  const source=fs.readFileSync(require.resolve('../gui/barcode-catalog.js'),'utf8');
  assert.match(source,/width:min\(1540px,calc\(100vw - 32px\)\)/,'desktop picker can expand so six cards stay readable');
  assert.match(source,/\.bc-list\{display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/,'desktop catalog uses six columns');
  assert.match(source,/@media\(max-width:760px\)[\s\S]*?\.bc-list\{grid-template-columns:repeat\(auto-fill,minmax\(145px,1fr\)\)/,'narrow screens switch to a responsive card grid');
});

test('barcode category pills reserve space for their focus ring so the top border is not clipped',()=>{
  const source=fs.readFileSync(require.resolve('../gui/barcode-catalog.js'),'utf8');
  assert.match(source,/\.bc-toolbar nav\{[^}]*overflow:auto;padding:4px 3px 5px/,'scroll row has enough top and side padding for the focused pill outline');
  assert.match(source,/\.bc-toolbar nav::-webkit-scrollbar\{display:none\}/,'hiding the scroll bar preserves the pill row height');
});

test('users can import SVG artwork into a persistent custom-symbol category',async()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-insert"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.WordSymbols=[];w.HalalSymbols=[];w.TextDecoder=TextDecoder;w.TextEncoder=TextEncoder;w.alert=()=>{};
  const raw='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="alert(1)"><script>alert(2)</script><path d="M2 2h20v20H2z"/><image href="https://example.invalid/pixel.png"/></svg>';
  const files=[{name:'Safety Mark.svg',mime:'image/svg+xml',base64:Buffer.from(raw).toString('base64')}];let saved={};let pickedKind='';
  w.zebra={getSettings:async()=>saved,saveSettings:async value=>(saved={...saved,...value}),pickFile:async kind=>(pickedKind=kind,{canceled:false,files})};
  w.eval(fs.readFileSync(require.resolve('../gui/tis-symbols'),'utf8'));
  w.document.querySelector('[aria-label="Insert Symbols"]').click();await new Promise(resolve=>w.setTimeout(resolve,0));
  w.document.querySelector('.symbols-menu-more')?.click();await new Promise(resolve=>w.setTimeout(resolve,0));
  const modal=w.document.querySelector('.tis-picker');assert.ok(modal,'symbol picker opens from the ribbon dropdown');assert.ok([...modal.querySelectorAll('.tis-category-select option')].some(option=>option.value==='Custom'&&option.textContent==='Custom'),'custom category is labeled in English');
  modal.querySelector('.tis-import').click();await new Promise(resolve=>w.setTimeout(resolve,0));
  assert.equal(pickedKind,'symbol','the native file chooser uses the symbol import filter');assert.equal(saved.customSymbols.length,1,'the imported symbol is persisted in user settings');
  assert.equal(saved.customSymbols[0].name,'Safety Mark');assert.equal(saved.customSymbols[0].category,'Custom');
  const sanitized=Buffer.from(saved.customSymbols[0].src.split(',')[1],'base64').toString('utf8');assert.doesNotMatch(sanitized,/<script|onload=|https:\/\//i,'unsafe SVG code and remote image references are removed');assert.match(sanitized,/<path/,'safe vector artwork remains available');
  const category=modal.querySelector('.tis-category-select');category.value='Custom';category.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(modal.querySelector('.tis-symbol-card')?.getAttribute('aria-label'),'Safety Mark','the imported artwork appears in the custom category');
  assert.match(modal.querySelector('.tis-import-status').textContent,/Imported 1 symbol/);dom.window.close();
});

test('symbol picker Insert button keeps its SVG icon visible on the green action button',async()=>{
  const dom=new JSDOM('<!doctype html><body><div id="ribbon-insert"></div></body>',{runScripts:'dangerously',url:'http://localhost'}),w=dom.window;
  w.WordSymbols=[];w.HalalSymbols=[];w.zebra={getSettings:async()=>({})};
  w.eval(fs.readFileSync(require.resolve('../gui/tis-symbols'),'utf8'));
  w.eval(fs.readFileSync(require.resolve('../gui/action-button-ui'),'utf8'));
  w.document.querySelector('[aria-label="Insert Symbols"]').click();await new Promise(resolve=>w.setTimeout(resolve,0));
  w.document.querySelector('.symbols-menu-more')?.click();await new Promise(resolve=>w.setTimeout(resolve,0));
  const button=w.document.querySelector('.tis-picker .tis-insert'),icon=button?.querySelector('svg');
  assert.ok(icon,'the Insert action has a real SVG icon');
  assert.equal(w.getComputedStyle(button).backgroundColor,'rgb(22, 163, 74)','the Insert action keeps its green primary surface');
  assert.equal(w.getComputedStyle(icon).stroke,'rgb(255, 255, 255)','the icon contrasts against the green button instead of blending into it');
  assert.equal(w.getComputedStyle(icon).width,'16px','the SVG keeps the standard action icon size');
  dom.window.close();
});

test('barcode picker thumbnails preserve the full symbol and its aspect ratio',()=>{
  const source=fs.readFileSync(require.resolve('../gui/barcode-catalog.js'),'utf8');
  assert.match(source,/\.bc-card img\{[^}]*width:auto;max-width:100%;height:auto;max-height:72px;object-fit:contain;object-position:center/);
  assert.doesNotMatch(source,/\.bc-card img\{[^}]*image-rendering:pixelated/);
  assert.match(source,/\.bc-card\{[^}]*min-height:128px/);
});

test('Wrap text carries barcode human-readable wrapping into printed ZPL',()=>{
  const template={dpi:203,width_mm:100,height_mm:40,elements:[{type:'barcode128',x_mm:1,y_mm:1,bar_height_mm:10,module_width:1,hri_height_mm:6,show_text:true,text:'1234567890123456789012345678901234567890',text_wrap:true}]};
  const wrapped=renderLabelBody(template,{});
  const wrappedFieldBlock=/\^FB\d+,(\d+),0,C,0/.exec(wrapped);
  assert.ok(Number(wrappedFieldBlock?.[1])>1,'wrapped barcode should reserve multiple readable-text lines');
  assert.match(wrapped,/\^FD[^\n]*\\&[^\n]*\^FS/);
  const unwrapped=renderLabelBody({...template,elements:[{...template.elements[0],text_wrap:false}]},{});
  assert.doesNotMatch(unwrapped,/\\&/);
  assert.match(unwrapped,/\^FB\d+,1,0,C,0/);
});

test('editing a catalog barcode updates its bitmap immediately without Apply and does not save on opening',async()=>{
 const dom=new JSDOM('<body></body>',{runScripts:'dangerously'}),w=dom.window;let saves=0;
 Object.assign(w,{BarcodeCategories:require('../gui/barcode-categories'),editing:{dpi:203,elements:[{type:'image',label:'object 1',width_mm:20,barcode_spec:{bcid:'code128',text:'12345678',show_text:true}}]},readEditorIntoDraft:()=>{},pushSnapshot:()=>{},renderEditorElements:()=>{},updateEditorPreview:()=>{},touchEditor:()=>{},persistEditor:async()=>{saves++;},IntersectionObserver:class{observe(){}unobserve(){}}});
 w.zebra={barcodeCatalog:async()=>[{bcid:'code128',desc:'Code 128',text:'12345678'}],barcodeEncode:async spec=>({ok:true,src:'data:image/png;base64,AA==',bitmap_width:80,bitmap_height:spec.show_text?40:20,bitmap_hex:spec.show_text?'AA':'BB'})};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.eval(fs.readFileSync(require.resolve('../gui/barcode-catalog'),'utf8'));await w.openAdvancedBarcodePicker(0);await new Promise(r=>setImmediate(r));const d=w.document.querySelector('dialog');assert.equal(saves,0);assert.equal(d.querySelector('.bc-insert').hidden,true);
 d.querySelector('[type=checkbox]').click();await new Promise(r=>setImmediate(r));assert.equal(w.editing.elements[0].barcode_spec.show_text,false);assert.equal(w.editing.elements[0].bitmap_hex,'BB');assert.equal(saves,1);
 const input=d.querySelector('textarea');input.value='87654321';input.dispatchEvent(new w.Event('input'));d.querySelector('.bc-cancel').click();await new Promise(r=>setImmediate(r));assert.equal(d.open,false);assert.equal(w.editing.elements[0].barcode_spec.text,'87654321');assert.equal(saves,2);dom.window.close();
});

test('barcode picker hides the image until it loads and reports preview failures without a broken-image icon',async()=>{
  for(const outcome of ['success','error','throw']){
    const dom=new JSDOM('<body></body>',{runScripts:'dangerously'}),w=dom.window;
    Object.assign(w,{BarcodeCategories:require('../gui/barcode-categories'),IntersectionObserver:class{observe(){}unobserve(){}}});
    w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
    w.zebra={barcodeCatalog:async()=>[{bcid:'code128',desc:'Code 128',text:'12345678'}],barcodeEncode:async()=>{
      if(outcome==='throw')throw Error('Encoder unavailable');
      if(outcome==='error')return {ok:false,error:'Invalid barcode data'};
      return {ok:true,src:'data:image/png;base64,AA==',bitmap_width:80,bitmap_height:40,bitmap_hex:'AA'};
    }};
    w.eval(fs.readFileSync(require.resolve('../gui/barcode-catalog'),'utf8'));
    await w.openAdvancedBarcodePicker();await new Promise(resolve=>setImmediate(resolve));
    const dialog=w.document.querySelector('#advancedBarcodePicker'),image=dialog.querySelector('.bc-preview-image img'),status=dialog.querySelector('.bc-preview-status');
    assert.ok(image.hidden,`${outcome}: image remains hidden until it loads`);
    if(outcome==='success'){
      assert.equal(status.textContent,'Loading preview…');
      image.onload();
      assert.equal(image.hidden,false);
      assert.equal(status.textContent,'');
    }else{
      assert.equal(status.textContent,'Preview unavailable.');
      assert.equal(dialog.querySelector('.bc-error').textContent,outcome==='throw'?'Encoder unavailable':'Invalid barcode data');
      assert.equal(dialog.querySelector('.bc-insert').disabled,true);
    }
    dom.window.close();
  }
});
