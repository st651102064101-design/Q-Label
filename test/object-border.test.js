'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),Layout=require('../gui/object-layout');
test('border margins and compound stroke bounds expand ink without moving authored object',()=>{
 const object={x_mm:10,y_mm:12,border:{kind:'rectangle',margins:{top:2,left:3,bottom:4,right:5},line:{widthMm:1,compound:'double',color:'#000000',opacity:1},corner:'rectangular',sides:'all',fill:'none'}},before=structuredClone(object),geometry=Layout.borderGeometry(object,{x:10,y:12,w:20,h:8});assert.equal(geometry.x,7);assert.equal(geometry.y,10);assert.equal(geometry.w,28);assert.equal(geometry.h,14);assert.equal(geometry.strokes.length,2);assert.equal(geometry.bounds.x,5.5);assert.equal(geometry.bounds.y,8.5);assert.deepEqual(object,before);
});
test('all rectangle corner effects and ellipse produce real paths; invalid sizes fail',()=>{
 for(const corner of ['rectangular','rounded','beveled','concave','inverted']){const g=Layout.borderGeometry({border:{kind:'rectangle',corner,cornerSizeMm:2}},{x:0,y:0,w:20,h:10});assert.ok(g.path);assert.ok(Layout.borderSvg(g).includes('data-object-border'));}
 const ellipse=Layout.borderGeometry({border:{kind:'ellipse'}},{x:0,y:0,w:20,h:10});assert.ok(ellipse.path.includes('A'));assert.throws(()=>Layout.borderGeometry({border:{kind:'rectangle',margins:{left:-1}}},{x:0,y:0,w:20,h:10}));assert.equal(Layout.borderGeometry({border:{kind:'none'}},{x:0,y:0,w:20,h:10}),null);
});
test('sides select visible edges and compound presets have distinct line patterns',()=>{
 for(const sides of ['all','none','vertical','horizontal']){const g=Layout.borderGeometry({border:{kind:'rectangle',sides}},{x:0,y:0,w:20,h:10});assert.equal(g.strokes.length===0,sides==='none');}
 const signatures=Object.keys(Layout.compounds).map(compound=>JSON.stringify(Layout.borderGeometry({border:{kind:'rectangle',line:{compound,widthMm:1}}},{x:0,y:0,w:20,h:10}).strokes));assert.equal(new Set(signatures).size,7);
});
test('border defaults match measured native margins and point width while legacy fields stay compatible',()=>{
 const g=Layout.borderConfig({border:{kind:'rectangle'}});assert.equal(g.margins.top,3.175);assert.equal(g.line.widthMm,25.4/72);const legacy=Layout.borderConfig({barcode_border:true,thickness_mm:.2});assert.equal(legacy.margins.left,0);assert.equal(legacy.line.widthMm,.2);
});
