'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {resolveMediaModes}=require('../gui/page-setup-capabilities');

test('media mode capabilities are supported only with explicit profile evidence',()=>{
  const connection={type:'ip',ip:'192.0.2.10',port:9100};
  const key='ip:192.0.2.10:9100';
  const unknown=resolveMediaModes(connection,{});
  assert.equal(unknown.T.state,'supported','ZPL tear-off is available in Q LABEL output');
  for(const mode of ['P','C','R'])assert.equal(unknown[mode].state,'unknown',mode+' requires printer capability evidence');

  const confirmed=resolveMediaModes(connection,{[key]:{capabilities:{mediaModes:['T','P']}}});
  assert.equal(confirmed.P.state,'supported');
  assert.equal(confirmed.C.state,'unsupported','a complete capability list can explicitly rule out cutter mode');
  assert.equal(confirmed.R.state,'unsupported');
  assert.match(confirmed.C.reason,/not supported/i);

  const incomplete=resolveMediaModes(connection,{[key]:{}});
  assert.equal(incomplete.P.state,'unknown','legacy printer profiles without capabilities fail closed');
  assert.match(incomplete.P.reason,/does not confirm/i);
});
