'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('editor visibility excludes hidden objects without renumbering visible indices',()=>{
 const source=fs.readFileSync(require.resolve('../gui/renderer.js'),'utf8'),start=source.indexOf('function editorVisibleIndices('),end=source.indexOf('\nfunction drawEditorCanvas(',start);assert.ok(start>=0&&end>start);const context={};vm.createContext(context);vm.runInContext(source.slice(start,end),context);
 const objects=[{type:'text'},{type:'barcode128',enabled:false},{type:'image',enabled:true},{type:'box',enabled:false}];
 assert.deepEqual(Array.from(context.editorVisibleIndices(objects)),[0,2]);objects[1].enabled=true;assert.deepEqual(Array.from(context.editorVisibleIndices(objects)),[0,1,2]);assert.deepEqual(Array.from(context.editorVisibleIndices([])),[]);assert.deepEqual(Array.from(context.editorVisibleIndices()),[]);
});
