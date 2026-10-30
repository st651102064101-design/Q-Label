'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createDocumentDraft}=require('../gui/object-properties-document');
const fixture=()=>({name:'Original',width_mm:60,height_mm:40,dpi:203,custom:{untouched:true},elements:[{type:'text',text:'A',label:'A',vendor:{keep:1}},{type:'text',text:'B',label:'B'}]});
test('document draft preserves multiple staged objects and returns independent snapshots',()=>{
 const original=fixture(),before=structuredClone(original),d=createDocumentDraft(original),[a,b]=d.getDocument().elements;
 assert.ok(a.id&&b.id&&a.id!==b.id);d.updateObject(a.id,o=>{o.comments='first';});d.updateObject(b.id,o=>{o.label='Second';});
 assert.equal(d.getObject(a.id).comments,'first');assert.equal(d.getObject(b.id).label,'Second');const copy=d.getObject(a.id);copy.vendor.keep=9;assert.equal(d.getObject(a.id).vendor.keep,1);assert.deepEqual(original,before);
 const applied=d.apply();assert.equal(applied.elements[0].comments,'first');assert.equal(applied.elements[1].label,'Second');assert.deepEqual(applied.custom,{untouched:true});assert.deepEqual(JSON.parse(JSON.stringify(applied)),applied);
});
test('cancel before Apply returns the exact legacy baseline; after Apply keeps only applied changes',()=>{
 const original=fixture(),d=createDocumentDraft(original),id=d.getDocument().elements[0].id;d.updateObject(id,o=>{o.comments='discard';});assert.deepEqual(d.cancel(),original);
 const next=createDocumentDraft(original),a=next.getDocument().elements[0].id;next.updateObject(a,o=>{o.comments='keep';});const applied=next.apply();next.updateObject(a,o=>{o.comments='discard';});assert.deepEqual(next.cancel(),applied);
});
test('source document replacement preserves shared definitions and stable object identity',()=>{
 const d=createDocumentDraft(fixture()),doc=d.getDocument(),[a,b]=doc.elements,ref=a.dataSourceRefs[0];doc.sourceDefinitions[ref].name='Shared';b.dataSourceRefs=[ref];d.replaceDocument(doc);d.updateObject(a.id,o=>{o.comments='A';});
 const applied=d.apply();assert.equal(applied.elements[0].id,a.id);assert.deepEqual(applied.elements[1].dataSourceRefs,[ref]);assert.equal(applied.sourceDefinitions[ref].name,'Shared');assert.equal(applied.elements[0].comments,'A');
});
test('layer moves use stable IDs and reject invalid mutations atomically',()=>{
 const d=createDocumentDraft(fixture()),[a,b]=d.getDocument().elements;d.moveObject(a.id,1);assert.deepEqual(d.getDocument().elements.map(o=>o.id),[b.id,a.id]);
 const before=d.getDocument();assert.throws(()=>d.updateObject(a.id,o=>{o.id=b.id;}));assert.deepEqual(d.getDocument(),before);assert.throws(()=>d.moveObject(a.id,99));assert.throws(()=>d.updateObject('missing',()=>{}));
});
