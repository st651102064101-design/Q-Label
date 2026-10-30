'use strict';
// Synthetic integration contract; this is not a verified library conversion.
const crypto=require('node:crypto');
const source=Buffer.from('isolated native package contract fixture');
const sha=crypto.createHash('sha256').update(source).digest('hex');
function fixture(){return {schemaVersion:1,complete:true,source:{sha256:sha},verification:{complete:true,method:'native-editable-object-package',evidence:['contract-fixture-only']},diagnostics:[],nativeObjectCount:2,width_mm:50,height_mm:25,label_shape:'rectangle',page:{width_mm:50,height_mm:25,rows:1,columns:1},fonts:[],dataSourceSchemaVersion:1,sourceDocumentId:'native-document',sourceDefinitions:{named:{id:'named',name:'Part number',kind:'embedded',config:{value:'PN-123'},transforms:[],dataType:{kind:'text'}}},elements:[{id:'native-text',type:'text',x_mm:2,y_mm:3,width_mm:12,height_mm:4,dataSourceRefs:['named'],font_family:'Arial',font_size_pt:12,native_object:{id:'native-text',type:'Text',name:'Original text',properties:{},xml:'<Text Name="Original text"/>'}},{id:'native-box',type:'box',x_mm:1,y_mm:1,width_mm:20,height_mm:10,native_object:{id:'native-box',type:'Box',name:'Original box',properties:{},xml:'<Box Name="Original box"/>'}}]};}

module.exports={fixture,source,sha};
