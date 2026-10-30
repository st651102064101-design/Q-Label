'use strict';
const {XMLParser,XMLBuilder,XMLValidator}=require('fast-xml-parser');
/** Lossless conversion-time envelope, not an assertion of rendering parity. */
function readNativeObjectExport(xml){
 if(typeof xml!=='string'||Buffer.byteLength(xml)>64*1024*1024)throw Error('Native XML must be a bounded string');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Native XML DTD/entity declarations are unsupported');
 const valid=XMLValidator.validate(xml);if(valid!==true)throw Error('Invalid native export XML');
 const opts={preserveOrder:true,ignoreAttributes:false,attributeNamePrefix:'@',parseTagValue:false,parseAttributeValue:false,trimValues:false};
 const parsed=new XMLParser(opts).parse(xml),root=parsed.find(n=>Object.hasOwn(n,'NativeObjects'));
 if(!root)throw Error('NativeObjects envelope required');
 if(root[':@']?.['@Units']!=='mm')throw Error('Native export units must be mm');
 const count=Number(root[':@']?.['@Count']);if(!Number.isSafeInteger(count)||count<0)throw Error('Invalid native count');
 const objects=[],indices=new Set(),builder=new XMLBuilder(opts);
 for(const entry of root.NativeObjects){
  if(!Object.hasOwn(entry,'Object')){if(Object.keys(entry).some(k=>!['#text',':@'].includes(k)))throw Error('Unknown native envelope member');continue;}
  const attrs=entry[':@']||{},index=Number(attrs['@Index']);
  if(!Number.isSafeInteger(index)||index!==objects.length||indices.has(index))throw Error('Native object index is duplicated or out of order');
  indices.add(index);
  const payload=entry.Object.filter(n=>!Object.hasOwn(n,'ExportedPicture')&&!Object.hasOwn(n,'ExportError'));
  const exportErrors=entry.Object.filter(n=>Object.hasOwn(n,'ExportError')).map(n=>({stage:n[':@']?.['@Stage'],message:n[':@']?.['@Message']}));
  const picture=entry.Object.find(n=>Object.hasOwn(n,'ExportedPicture'));
  const asset=picture?.[':@']?.['@File'];
  if(asset&&!/^picture-\d+\.png$/.test(asset))throw Error('Invalid native picture asset path');
  objects.push({index,name:attrs['@Name'],nativeType:attrs['@Type'],xml:builder.build(payload),pictureFile:asset||null,exportErrors});
 }
 if(objects.length!==count)throw Error('Native object count does not match exported wrappers');
 return {schemaVersion:1,units:'mm',nativeObjectCount:count,objects,nativeXml:xml,reconstructionComplete:false};
}
module.exports={readNativeObjectExport};
