const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
function setup(markup){
  const dom=new JSDOM(markup),window=dom.window,document=window.document,host=document.createElement('div');let closed=0;
  const context={document,Event:window.Event,getComputedStyle:window.getComputedStyle.bind(window),selectedIndices:()=>[],close:()=>closed++};vm.createContext(context);
  const source=fs.readFileSync(require.resolve('../gui/object-context-menu.js'),'utf8'),start=source.indexOf('  function buildHomeTools('),end=source.indexOf("  style.textContent+=",start);
  vm.runInContext(source.slice(start,end),context);context.buildHomeTools(host);
  return {window,document,host,closed:()=>closed};
}
test('Home formatting values and input/change events reach the actual Ribbon controls',()=>{
  const h=setup('<section id="ribbon-home"><div class="text-format-row"><div class="text-format-line"><label><input id="font-size" type="number" value="14"></label><select><option>Arial</option><option>Calibri</option></select></div></div></section>');
  const original=h.document.querySelector('input'),copy=h.host.querySelector('input');assert.equal(copy.value,'14');assert.equal(copy.id,'');
  const events=[];for(const type of ['input','change'])original.addEventListener(type,()=>events.push(type));copy.value='18';copy.dispatchEvent(new h.window.Event('input'));copy.dispatchEvent(new h.window.Event('change'));
  assert.equal(original.value,'18');assert.deepEqual(events,['input','change']);const select=h.host.querySelector('select');select.value='Calibri';select.dispatchEvent(new h.window.Event('change'));assert.equal(h.document.querySelector('select').value,'Calibri');
});
test('Home command cards omit clipboard tools already listed in the menu',()=>{
  const h=setup('<section id="ribbon-home"><button class="ribbon-command"><span class="ribbon-caption">Copy</span></button><button class="ribbon-command"><span class="ribbon-caption">Cut</span></button><button class="ribbon-command"><span class="ribbon-caption">Undo</span></button><button class="ribbon-command"><span class="ribbon-caption">Print</span></button><button class="ribbon-command" disabled><span class="ribbon-caption">Align left</span></button></section>');
  const cards=[...h.host.querySelectorAll('.ocm-insert-card')];assert.deepEqual(cards.map(card=>card.textContent),['Align left']);assert.equal(cards[0].disabled,true);
});
test('Home command cards invoke actual Ribbon actions and retain disabled state',()=>{
  const h=setup('<section id="ribbon-home"><button class="ribbon-command"><span class="ribbon-caption">Align left</span></button><button class="ribbon-command" disabled><span class="ribbon-caption">Align right</span></button></section>');
  let aligned=0;h.document.querySelector('button').onclick=()=>aligned++;
  const cards=h.host.querySelectorAll('.ocm-insert-card');assert.equal(cards.length,2);assert.equal(cards[1].disabled,true);cards[0].click();assert.equal(aligned,1);assert.equal(h.closed(),1);
});
test('Home formatting buttons forward their commands without duplicating handlers',()=>{
  const h=setup('<section id="ribbon-home"><div class="text-format-row"><div class="text-format-line"><button aria-pressed="false">Bold</button></div></div></section>');
  const source=h.document.querySelector('button');let clicks=0;source.onclick=()=>{clicks++;source.setAttribute('aria-pressed','true');};const copy=h.host.querySelector('button');copy.click();assert.equal(clicks,1);assert.equal(copy.getAttribute('aria-pressed'),'true');
});
test('Home formatting clone groups both rows inside one shared scroll container',()=>{
  const h=setup('<section id="ribbon-home"><div class="text-format-row"><div class="text-format-line"><button>First</button></div><div class="text-format-line"><button>Second</button></div></div></section>');
  const format=h.host.querySelector('.ocm-home-format'),scroll=format.querySelector('.ocm-home-format-scroll');assert.ok(scroll);
  assert.equal(scroll.querySelectorAll(':scope > .text-format-line').length,2);
  assert.equal(format.querySelectorAll('.ocm-home-format-scroll').length,1);
});
test('Home formatting clone displays two rows under one horizontal scrollbar',()=>{
  const source=fs.readFileSync(require.resolve('../gui/object-context-menu.js'),'utf8'),styles=[...source.matchAll(/style\.textContent\+='([^']*)'/g)].map(match=>match[1]).join(''),dom=new JSDOM('<!doctype html><head></head><body><div class="object-context-menu"><div class="ocm-home-format text-format-row"><div class="ocm-home-format-scroll"><div class="text-format-line"></div><div class="text-format-line"></div></div></div></div></body>'),element=dom.window.document.querySelector('.ocm-home-format'),sheet=dom.window.document.createElement('style');
  // Apply every context-menu override in source order and inspect the resolved CSS declarations.
  sheet.textContent=styles;dom.window.document.head.append(sheet);
  assert.equal(dom.window.getComputedStyle(element).flexDirection,'column');
  const scroll=element.querySelector('.ocm-home-format-scroll');assert.ok(scroll);
  const rows=[...scroll.querySelectorAll(':scope > .text-format-line')];assert.equal(rows.length,2);
  assert.equal(dom.window.getComputedStyle(scroll).overflowX,'auto');
  assert.ok(rows.every(row=>dom.window.getComputedStyle(row).overflowX==='visible'));
  assert.equal(dom.window.getComputedStyle(dom.window.document.querySelector('.object-context-menu')).overflowX,'hidden');
});

test('text context formatting uses three compact rows and preserves forwarded input events',()=>{
 const h=setup('<section id="ribbon-home"><div class="text-format-row"><div class="text-format-line"><label><select aria-label="Font family"><option>Arial</option></select></label><label><input aria-label="Font size (pt)" value="11.5"></label><button aria-label="Bold">B</button><button aria-label="Italic">I</button><button aria-label="Underline">U</button><button aria-label="Strike">S</button></div><div class="text-format-line"><button aria-label="Align text left">Left</button><label><input aria-label="Width" value="30"></label><label><input aria-label="Line spacing" value="1.2"></label></div></div></section>');
 const rows=h.host.querySelectorAll('.ocm-home-format-scroll > .text-format-line');assert.equal(rows.length,3);assert.ok(rows[0].querySelector('[aria-label="Font family"]'));assert.ok(rows[0].querySelector('[aria-label="Bold"]'));assert.ok(rows[1].querySelector('[aria-label="Align text left"]'));assert.ok(rows[2].querySelector('[aria-label="Width"]'));
 const original=h.document.querySelector('[aria-label="Line spacing"]');let changed=0;original.addEventListener('change',()=>changed++);const field=rows[2].querySelector('[aria-label="Line spacing"]');field.value='1.5';field.dispatchEvent(new h.window.Event('change'));assert.equal(original.value,'1.5');assert.equal(changed,1);h.window.close();
});

test('object action icons are distinct SVGs and Copy still invokes its original command',()=>{
 const source=fs.readFileSync(require.resolve('../gui/object-context-menu.js'),'utf8'),dom=new JSDOM('<body></body>');let copied=0;const ctx={document:dom.window.document,window:{},editing:{elements:[{type:'text'}]},elementClipboard:[{type:'text'}],close(){},copySelectedElement(){copied++;}};vm.createContext(ctx);
 const groups=source.slice(source.indexOf('  const groups ='),source.indexOf('  let contextPastePoint'));const icons=source.slice(source.indexOf('  const icons='),source.indexOf('  function fitObjects'));const add=source.slice(source.indexOf('  function addItem('),source.indexOf('  const insertTools='));
 vm.runInContext(groups+icons+add+';globalThis.entries=groups.flat();',ctx);const seen=new Set();
 for(const entry of ctx.entries){const host=dom.window.document.createElement('div');ctx.addItem(entry,true,false,host);const glyph=host.querySelector('.ocm-icon');assert.ok(glyph.querySelector('svg'),entry[0]+' needs SVG');assert.equal(glyph.textContent,'');assert.ok(!seen.has(glyph.innerHTML),entry[0]+' needs a distinct icon');seen.add(glyph.innerHTML);if(entry[0]==='Copy')host.querySelector('button').click();}
 assert.equal(copied,1);dom.window.close();
});
