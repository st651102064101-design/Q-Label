'use strict';
const assert=require('assert/strict');
const {resolve}=require('../gui/data-source-engine');
const {preparePrintJob}=require('../lib/print-job');
const template={width_mm:60,height_mm:30,dpi:203,values:{entry:'default'},elements:[{type:'text',x_mm:2,y_mm:2,height_mm:3,text:'{{serial}} {{named}} {{date}}'}],data_sources:{
  serial:{type:'serial',start:100,step:2,digits:4},date:{type:'date',format:'YYYY-MM-DD'},time:{type:'time',format:'HH:mm:ss'},
  table:{type:'table',rows:[{sku:'a'},{sku:'b'}],column:'sku',row:'auto'},entry:{type:'entry',value:'default'},
  named:{type:'expression',value:'{{table}}-{{entry}}',transform:'upper'},global:{type:'global',key:'site',value:'fallback'},job:{type:'job',key:'page'}
}};
const values=resolve(template,{entry:'custom'},{index:1,total:2,globals:{site:'shared'},now:new Date(2026,9,7,12,34,56).getTime()});
assert.equal(values.serial,'0102');assert.equal(values.date,'2026-10-07');assert.equal(values.time,'12:34:56');assert.equal(values.named,'B-CUSTOM');assert.equal(values.global,'shared');assert.equal(values.job,'2');
const job=preparePrintJob({template,copies:2,data:{entry:'custom'},connection:{type:'ip',host:'127.0.0.1'}});
assert.equal(job.dataList[0].serial,'0100');assert.equal(job.dataList[1].serial,'0102');assert.equal(job.dataList[1].named,'B-CUSTOM');assert.match(job.zpl.toString(),/0100 A-CUSTOM/);assert.match(job.zpl.toString(),/0102 B-CUSTOM/);
assert.throws(()=>resolve({...template,data_sources:{a:{type:'expression',value:'{{b}}'},b:{type:'expression',value:'{{a}}'}}}),/Circular/);
assert.throws(()=>resolve(template,{}, {index:2}),/outside/);
const objects={elements:[{type:'text',text:'{{entry}}'}],values:{entry:'live'}};assert.equal(resolve({...objects,elements:[...objects.elements,{type:'text',text:'{{object.0}}'}]})['object.0'],'live');
console.log('PASS data source resolution, print ZPL, object references, circular references and record bounds (no print jobs sent)');
