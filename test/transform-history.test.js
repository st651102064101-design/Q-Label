const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('../gui/transform-history');
test('reset captures a copy of the state before the latest correction and clears after use',()=>{const h=create(),object={x_mm:10,width_mm:20},before=structuredClone(object);h.remember([{element:object,before}]);before.x_mm=999;object.x_mm=25;assert.equal(h.take(object)[0].before.x_mm,10);assert.equal(h.has(object),false);assert.deepEqual(h.take(object),[]);});
test('latest correction replaces an older reset baseline',()=>{const h=create(),object={x_mm:10};h.remember([{element:object,before:{x_mm:0}}]);h.remember([{element:object,before:{x_mm:10}}]);assert.equal(h.take(object)[0].before.x_mm,10);});
test('group reset includes all edited objects and clears their reset buttons together',()=>{const h=create(),a={x_mm:10},b={x_mm:30};h.remember([{element:a,before:{x_mm:0}},{element:b,before:{x_mm:20}}]);assert.equal(h.take(a).length,2);assert.equal(h.has(b),false);});
