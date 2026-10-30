'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
test('Insert Table menu commands each show an icon that matches their label',async()=>{
 const labels=['Insert Table…','Draw Table','Convert Text to Table…','Create Table from Database…','Excel Spreadsheet','Quick Tables…'];
 const dom=new JSDOM('<div class="table-menu">'+labels.map(label=>`<button>${label}</button>`).join('')+'</div>',{runScripts:'outside-only'}),w=dom.window;
 try{
  w.eval(fs.readFileSync(require.resolve('../gui/action-button-ui'),'utf8'));
  await new Promise(r=>setTimeout(r,0));
  const paths=labels.map(label=>{
    const button=[...w.document.querySelectorAll('.table-menu button')].find(item=>item.textContent.trim()===label);
    const d=button?.querySelector('svg path')?.getAttribute('d');
    assert.ok(d,label+' has an SVG icon');
    assert.notEqual(d,'M12 5v14M5 12h14',label+' must not use the generic plus icon');
    return d;
  });
  assert.equal(new Set(paths).size,labels.length,'each table command has its own icon');
 }finally{w.close();}
});
