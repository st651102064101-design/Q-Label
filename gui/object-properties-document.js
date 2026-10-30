(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./source-model'));else root.ObjectPropertiesDocument=factory(root.SourceModel);})(typeof globalThis!=='undefined'?globalThis:this,function(Model){
 'use strict';
 const clone=value=>structuredClone(value);
 function createDocumentDraft(template){
  let baseline=clone(template),draft=Model.migrate(template);
  const indexOf=id=>{const index=draft.elements.findIndex(object=>object.id===id);if(index<0)throw Error('Object no longer exists.');return index;};
  function replaceDocument(document){const next=clone(document);Model.validate(next);draft=Model.syncCaches(next);}
  return {
   getDocument:()=>clone(draft),
   getObject:id=>clone(draft.elements[indexOf(id)]),
   updateObject(id,updater){const index=indexOf(id),next=clone(draft);updater(next.elements[index]);if(next.elements[index].id!==id)throw Error('Object identity cannot change.');replaceDocument(next);},
   replaceDocument,
   moveObject(id,layer){const index=indexOf(id);if(!Number.isInteger(layer)||layer<0||layer>=draft.elements.length)throw Error('Invalid layer.');const next=clone(draft),[object]=next.elements.splice(index,1);next.elements.splice(layer,0,object);replaceDocument(next);},
   apply(){Model.validate(draft);draft=Model.syncCaches(clone(draft));baseline=clone(draft);return clone(baseline);},
   cancel(){draft=Model.migrate(baseline);return clone(baseline);}
  };
 }
 return {createDocumentDraft};
});
