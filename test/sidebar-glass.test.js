'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

test('Recently Used Objects and Data Sources headers use opaque white glass blur',()=>{
  const html=fs.readFileSync(require.resolve('../gui/index.html'),'utf8');
  const glass=html.match(/<style id="shared-glass-controls">([\s\S]*?)<\/style>/)?.[1];
  assert.ok(glass,'shared glass control styles are present');
  const dom=new JSDOM(`<style>${glass}</style><aside id="insertSidebar"><section class="insert-recent-objects"><div class="insert-sidebar-title">Recently Used Objects</div></section><section class="insert-data-sources"><div class="insert-sidebar-title data-title">Data Sources</div></section></aside>`);
  const {document,getComputedStyle}=dom.window;
  for(const selector of ['.insert-recent-objects .insert-sidebar-title','.insert-data-sources .insert-sidebar-title']){
    const title=document.querySelector(selector),style=getComputedStyle(title);
    assert.equal(style.backgroundColor,'rgba(255, 255, 255, 0.78)','header has a white glass surface that hides content underneath');
    assert.equal(style.backdropFilter,'blur(18px)','header blurs the content behind it');
    assert.equal(style.color,'rgb(31, 41, 55)','header text remains legible on white');
  }
  dom.window.close();
});

test('zoom range slider does not keep a green focus border',()=>{
  const html=fs.readFileSync(require.resolve('../gui/index.html'),'utf8');
  const theme=html.match(/<style id="green-accent-theme">([\s\S]*?)<\/style>/)?.[1];
  assert.ok(theme,'green accent theme styles are present');
  const dom=new JSDOM(`<style>${theme}</style><div class="preview-pane"><div class="preview-zoom-control"><input type="range"></div></div>`);
  const slider=dom.window.document.querySelector('input[type="range"]');slider.focus();
  const style=dom.window.getComputedStyle(slider);
  assert.equal(style.outlineStyle,'none','focus does not draw an outline around the slider');
  assert.equal(style.borderTopColor,'rgba(0, 0, 0, 0)','focus does not draw a green border around the slider');
  assert.equal(style.boxShadow,'none','focus does not leave a green shadow around the slider');
  dom.window.close();
});

test('sidebar width resize grip is transparent and remains keyboard accessible',()=>{
 const dom=new JSDOM('<aside id="insertSidebar"></aside><div id="previewFrame"></div>',{runScripts:'outside-only',url:'https://example.test/'}),w=dom.window;
 w.ResizeObserver=class {observe(){}};w.requestAnimationFrame=()=>0;w.eval(fs.readFileSync(require.resolve('../gui/sidebar-contrast'),'utf8'));
 const grip=w.document.querySelector('[aria-label="Resize tools sidebar"]');assert.ok(grip);assert.equal(w.getComputedStyle(grip).backgroundColor,'rgba(0, 0, 0, 0)');assert.equal(w.getComputedStyle(grip).borderRightWidth,'0px');
 assert.equal(grip.tabIndex,0);const sidebar=w.document.getElementById('insertSidebar');sidebar.getBoundingClientRect=()=>({width:164});grip.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));assert.equal(sidebar.style.width,'174px');dom.window.close();
});

