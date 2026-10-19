'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),Position=require('../gui/object-position');
for(const rotation_deg of [0,90,37])test('position reference round trip preserves authored location at '+rotation_deg+' degrees',()=>{
 const object={id:'a',x_mm:12.345,y_mm:8.765,rotation_deg},bounds={w:24,h:8},template={width_mm:60,height_mm:40};let next=object;
 for(const ref of [{anchor:'center',originX:'center',originY:'center'},{anchor:'bottom-right',originX:'right',originY:'bottom'},{anchor:'top-left',originX:'left',originY:'top'}]){next=Position.changePositionReference(next,ref,bounds,template);assert.equal(next.x_mm,object.x_mm);assert.equal(next.y_mm,object.y_mm);const display=Position.positionToDisplay(next,bounds,template),restored=Position.positionFromDisplay(display,bounds,template);assert.ok(Math.abs(restored.x_mm-object.x_mm)<.001);assert.ok(Math.abs(restored.y_mm-object.y_mm)<.001);}
 assert.equal(object.position,undefined);
});
test('center and right template origins expose signed coordinates and reject unknown references',()=>{
 const object={x_mm:5,y_mm:7,position:{anchor:'top-left',originX:'right',originY:'bottom'}},bounds={w:10,h:5},template={width_mm:60,height_mm:40};const display=Position.positionToDisplay(object,bounds,template);assert.equal(display.x,-55);assert.equal(display.y,-33);const moved=Position.positionFromDisplay({...display,x:-50,y:-30},bounds,template);assert.equal(moved.x_mm,10);assert.equal(moved.y_mm,10);assert.throws(()=>Position.changePositionReference(object,{anchor:'bad'},bounds,template));assert.throws(()=>Position.positionFromDisplay({...display,x:NaN},bounds,template));
});
test('asymmetric border anchor uses its frame offset and preserves original rotation center',()=>{
 const object={x_mm:10,y_mm:20,rotation_deg:37,position:{anchor:'center',originX:'left',originY:'top'}},bounds={x:7,y:18,w:28,h:14,contentBounds:{x:10,y:20,w:20,h:8}},template={width_mm:60,height_mm:40};const display=Position.positionToDisplay(object,bounds,template),restored=Position.positionFromDisplay(display,bounds,template);assert.ok(Math.abs(restored.x_mm-10)<.001);assert.ok(Math.abs(restored.y_mm-20)<.001);assert.equal(display.pivotX,10);assert.equal(display.pivotY,4);
});
