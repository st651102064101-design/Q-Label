'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const TableAxisOperations=require('../gui/table-axis-operations.js');

const model=()=>({rows:[{mode:'Auto'},{mode:'Auto'}],columns:[{mode:'Auto'},{mode:'Auto'}],values:[['a','b'],['c','d']],edgeStyles:{'h:1:0':{color:'#f00'},'v:0:1':{color:'#0f0'}}});

test('adding a row moves an explicit horizontal boundary below the new row', () => {
  const m=model();
  assert.equal(TableAxisOperations.apply(m,true,0,'add'),true);
  assert.deepEqual(Object.keys(m.edgeStyles).sort(),['h:2:0','v:0:1'].sort());
});

test('adding a column moves an explicit vertical boundary right of the new column', () => {
  const m=model();
  assert.equal(TableAxisOperations.apply(m,false,0,'add'),true);
  assert.deepEqual(Object.keys(m.edgeStyles).sort(),['h:1:0','v:0:2'].sort());
});
