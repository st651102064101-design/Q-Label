(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ObjectPropertyValues=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function validateObjectProperties(object){const out=[],c=object.print_when;if(c){if(!['always','never','source'].includes(c.mode))out.push({code:'invalid-print-condition',message:'Invalid Print when mode.'});if(c.mode==='source'&&(!c.sourceId||!['empty','not-empty','equals','not-equals'].includes(c.operator)))out.push({code:'invalid-print-condition',message:'Choose a named source and a valid condition operator.'});}return out;}
 function shouldPrintObject(object,context={}){
  if(context.mode==='design')return true;
  if(object.preprinted===true)return false;
  const c=object.print_when||{mode:'always'},errors=validateObjectProperties(object);if(errors.length)throw Error(errors[0].message);
  if(c.mode==='always')return true;if(c.mode==='never')return false;
  const definitions=context.sourceResults?.definitions||context.values?.['$qlabel.sources']?.definitions||{};
  if(!Object.prototype.hasOwnProperty.call(definitions,c.sourceId))throw Error('Missing named source for Print when: '+c.sourceId);
  const result=definitions[c.sourceId];if(result==null||result.text===undefined)throw Error('Named source for Print when has no resolved value: '+c.sourceId);const value=String(result.text??'');
  switch(c.operator){case 'empty':return value==='';case 'not-empty':return value!=='';case 'equals':return value===String(c.value??'');case 'not-equals':return value!==String(c.value??'');default:throw Error('Invalid condition operator.');}
 }
 return {validateObjectProperties,shouldPrintObject};
});
