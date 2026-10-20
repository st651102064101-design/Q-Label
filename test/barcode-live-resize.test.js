'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),api=require('../gui/barcode-hri-resize');
test('live barcode painting uses current model and replaces stale transform before release',()=>{
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g id="host" transform="scale(2)"><text>old</text></g></svg>'),host=dom.window.document.getElementById('host');let rendered;
 const preview={renderPreviewSVG(template){rendered=template;return '<svg><g data-label-element="0"><g transform="rotate(30)"><rect width="42" height="18"/><text>1234</text></g></g></svg>';},computeBoxes(template){return [{x:2,y:3,w:template.elements[0].width_mm,h:18}];}};
 const box=api.renderLive(host,{type:'barcode128',width_mm:42},{dpi:203,elements:[{width_mm:1}]},{},{},preview);
 assert.equal(rendered.elements[0].width_mm,42);assert.equal(host.hasAttribute('transform'),false);assert.equal(host.querySelector('rect').getAttribute('width'),'42');assert.equal(host.querySelector('text').textContent,'1234');assert.equal(box.w,42);assert.ok(host.querySelector('[transform="rotate(30)"]'));dom.window.close();
});
