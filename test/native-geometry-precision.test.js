'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function reader(){const source=fs.readFileSync(require.resolve('../gui/renderer'),'utf8');const context={editing:{unit:'mm',dpi:600},MM_PROPS:['x_mm','y_mm','width_mm','height_mm'],unitMeta:u=>({decimals:u==='in'?4:2}),mmPerUnit:u=>u==='in'?25.4:1,measureUnit:()=> 'mm',measureDpi:()=>600};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function mmToUnit('),source.indexOf('function unitSuffix(')),context);vm.runInContext(source.slice(source.indexOf('function readElementRow('),source.indexOf('// Legge i controlli',source.indexOf('function readElementRow('))),context);return context;}
function row(bound,values){return {_boundObject:bound,querySelector:()=>({value:'image'}),querySelectorAll:()=>Object.entries(values).map(([prop,value])=>({dataset:{prop},type:'number',value:String(value),valueAsNumber:Number(value)}))};}
test('saving native geometry preserves original precision when displayed measurement has not changed',()=>{
 const c=reader(),bound={native_object:{id:'original'},width_mm:16.5862,height_mm:16.5862,x_mm:2.5908,y_mm:2.4511};const r=c.readElementRow(row(bound,{width_mm:16.59,height_mm:16.59,x_mm:2.59,y_mm:2.45}),'image','mm');for(const k of ['width_mm','height_mm','x_mm','y_mm'])assert.equal(r[k],bound[k],k);
 const inches=c.readElementRow(row(bound,{width_mm:c.mmToUnit(bound.width_mm,'in',600)}),'image','in');assert.equal(inches.width_mm,bound.width_mm);
});
test('native measurements still accept actual edits and ordinary elements retain existing conversion',()=>{
 const c=reader(),bound={native_object:{id:'original'},width_mm:16.5862};assert.equal(c.readElementRow(row(bound,{width_mm:20}),'image','mm').width_mm,20);assert.equal(c.readElementRow(row({width_mm:16.5862},{width_mm:16.59}),'image','mm').width_mm,16.59);
});
