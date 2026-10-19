'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');const Values=require('../gui/object-property-values');
test('Preprinted and Never remain visible in design but do not print',()=>{
 for(const object of [{preprinted:true},{print_when:{mode:'never'}}]){assert.equal(Values.shouldPrintObject(object,{mode:'design'}),true);assert.equal(Values.shouldPrintObject(object,{mode:'print'}),false);}assert.equal(Values.shouldPrintObject({},{mode:'print'}),true);
});
test('source print condition treats zero as present and rejects missing sources/operators',()=>{
 const object={print_when:{mode:'source',sourceId:'s',operator:'not-empty'}};
 assert.equal(Values.shouldPrintObject(object,{mode:'print',sourceResults:{definitions:{s:{text:'0'}}}}),true);assert.equal(Values.shouldPrintObject(object,{mode:'print',sourceResults:{definitions:{s:{text:''}}}}),false);
 object.print_when.operator='equals';object.print_when.value='x';assert.equal(Values.shouldPrintObject(object,{mode:'print',sourceResults:{definitions:{s:{text:'x'}}}}),true);
 assert.throws(()=>Values.shouldPrintObject(object,{mode:'print',sourceResults:{definitions:{}}}),/Missing.*source/i);object.print_when.operator='invalid';assert.throws(()=>Values.shouldPrintObject(object,{mode:'print',sourceResults:{definitions:{s:{text:'x'}}}}),/operator/i);
});
test('native ZPL excludes preprinted and conditionally hidden objects per record',()=>{
 const {buildLabel}=require('../lib/render'),template={width_mm:60,height_mm:40,dpi:203,elements:[{type:'text',text:'PREPRINTED',preprinted:true,x_mm:1,y_mm:1,height_mm:3,width_mm:2},{type:'text',text:'CONDITIONAL',print_when:{mode:'source',sourceId:'s',operator:'equals',value:'yes'},x_mm:1,y_mm:8,height_mm:3,width_mm:2}]};
 const data=text=>({'$qlabel.sources':{definitions:{s:{text}}}}),no=buildLabel(template,[data('no')]).toString(),yes=buildLabel(template,[data('yes')]).toString();assert.ok(!no.includes('PREPRINTED'));assert.ok(!no.includes('CONDITIONAL'));assert.ok(!yes.includes('PREPRINTED'));assert.ok(yes.includes('CONDITIONAL'));
});
test('prepared print preview suppresses the same objects as native print output',()=>{
 const {preparePrintJob}=require('../lib/print-job'),template={width_mm:60,height_mm:40,dpi:203,elements:[{type:'text',text:'PREPRINTED',preprinted:true,x_mm:1,y_mm:1,height_mm:3,width_mm:2},{type:'text',text:'NEVER',print_when:{mode:'never'},x_mm:1,y_mm:8,height_mm:3,width_mm:2},{type:'text',text:'VISIBLE',x_mm:1,y_mm:15,height_mm:3,width_mm:2}]};const job=preparePrintJob({template,copies:1,connection:{type:'network',host:'127.0.0.1',port:9100}});assert.equal(job.previewTemplates[0].elements[0].enabled,false);assert.equal(job.previewTemplates[0].elements[1].enabled,false);assert.ok(job.zpl.toString().includes('VISIBLE'));assert.ok(!job.zpl.toString().includes('PREPRINTED'));assert.ok(!job.zpl.toString().includes('NEVER'));
});
