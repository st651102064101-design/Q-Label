'use strict';
const {XMLParser,XMLValidator}=require('fast-xml-parser');
/** Original COM PromptValues is a control/value inventory. It does not export
 * control geometry, validation, event order or the full data entry form. */
function readNativePromptValues(xml){
 if(typeof xml!=='string'||!xml.trim()||Buffer.byteLength(xml)>4*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw Error('Native form XML must be valid, bounded and free of DTD/entities');
 const root=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@',parseTagValue:false,parseAttributeValue:false,trimValues:false}).parse(xml);
 if(Object.keys(root).some(key=>key!=='Prompts'&&!key.startsWith('?'))||!root.Prompts||typeof root.Prompts!=='object'||Array.isArray(root.Prompts))throw Error('One native Prompts XML inventory required');
 const prompts=root.Prompts;
 if(Object.keys(prompts).some(key=>!['Prompt','@xmlns:xsi','@version','@encoding'].includes(key)&&!(key==='#text'&&/^\s*$/.test(prompts[key])))||prompts['@version']!==undefined&&prompts['@version']!=='1.0')throw Error('Unsupported native form inventory property');
 const controls=[],names=new Set();
 for(const prompt of [].concat(prompts.Prompt??[])){
  if(!prompt||typeof prompt!=='object'||Array.isArray(prompt)||Object.keys(prompt).some(key=>!['@Name','Value'].includes(key)&&!(key==='#text'&&/^\s*$/.test(prompt[key])))||typeof prompt['@Name']!=='string'||!prompt['@Name']||names.has(prompt['@Name'])||typeof prompt.Value!=='string')throw Error('Unsupported, missing or duplicate native form control');
  names.add(prompt['@Name']);controls.push({name:prompt['@Name'],value:prompt.Value});
 }
 return {nativeXml:xml,controls,behaviorComplete:false};
}
function readNativeDataEntryForms(xml,{sourceDefinitions={}}={}){
 if(typeof xml!=='string'||!xml.trim()||Buffer.byteLength(xml)>8*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw Error('Native full form XML must be valid and bounded');
 const options={ignoreAttributes:false,attributeNamePrefix:'@',parseTagValue:false,parseAttributeValue:false,trimValues:false},parser=new XMLParser(options),root=parser.parse(xml),diagnostics=[],forms=[];
 const fail=(path,message)=>diagnostics.push({severity:'error',code:'NATIVE_FORM_PROPERTY_UNMAPPED',path,message});
 const fields=(node,allowed,path)=>{for(const key of Object.keys(node||{}))if(!allowed.includes(key)&&!(key==='#text'&&/^\s*$/.test(node[key])))fail(path+'.'+key,'Original property requires a verified adapter');};
 const text=node=>typeof node==='object'?String(node?.['#text']??''):String(node??'');
 const measure=(value,path)=>{const m=/^([+-]?\d+(?:\.\d+)?) (in|mm)$/.exec(value||'');if(!m){fail(path,'Explicit native inch/mm dimension required');return null;}return Number(m[1])*(m[2]==='in'?25.4:1);};
 const font=(node,path)=>{fields(node,['@StretchFactor','@PointSizeString','@FontName','@PointSize','@Height','@Weight'],path);if(node?.['@StretchFactor']!=='1000'||node?.['@Weight']!=='400'||!node?.['@FontName']||!Number.isFinite(Number(node?.['@PointSize'])))fail(path,'Unverified original font style');return {family:node?.['@FontName'],size_pt:Number(node?.['@PointSize']),weight:Number(node?.['@Weight'])};};
 fields(root,['?xml','BarTenderDocument'],'document');fields(root.BarTenderDocument,['@Version','@Build','DataEntryForms'],'BarTenderDocument');
 if(root.BarTenderDocument?.['@Version']!=='12.1.0'||root.BarTenderDocument?.['@Build']!=='256160')fail('BarTenderDocument','Form carrier belongs to an unverified installed build');
 fields(root.BarTenderDocument?.DataEntryForms,['DataEntryForm'],'DataEntryForms');
 const ordered=new XMLParser({...options,preserveOrder:true}).parse(xml),controlContainers=[];
 function find(rows){for(const row of rows||[])for(const [key,value]of Object.entries(row))if(key==='Controls')controlContainers.push(value);else if(Array.isArray(value))find(value);}find(ordered);
 const {XMLBuilder}=require('fast-xml-parser'),builder=new XMLBuilder({...options,preserveOrder:true});
 const originalForms=[].concat(root.BarTenderDocument?.DataEntryForms?.DataEntryForm??[]);
 for(const [index,node]of originalForms.entries()){
  const p='forms['+index+']';fields(node,['@Name','@Width','@Height','@ConditionalPrintType','@TextColor','@ReadingOrder','@ID','@Title','@Border','@Position','@IncludeStandardButtons','TextColor','Font','Controls'],p);
  fields(node.TextColor,['@RGB'],p+'.TextColor');if(node['@TextColor']!=='00000000'||node.TextColor?.['@RGB']!=='00000000'||!node['@ID']||!node['@Name']||!node['@Title'])fail(p,'Original form identity and black text required');
  if(node['@ConditionalPrintType']!=='Always'||node['@ReadingOrder']!=='LeftToRight'||node['@Position']!=='Center'||node['@Border']!=='true'||node['@IncludeStandardButtons']!=='true')fail(p,'Form state differs from the observed original profile');
  const form={id:node['@ID'],name:node['@Name'],title:node['@Title'],width_mm:measure(node['@Width'],p+'.Width'),height_mm:measure(node['@Height'],p+'.Height'),font:font(node.Font,p+'.Font'),controls:[],native:{properties:structuredClone(node)}};forms.push(form);
  const names=new Set();
  for(const row of controlContainers[index]||[]){
   const type=Object.keys(row).find(key=>key!==':@'&&key!=='#text');if(!type)continue;
   const controlXml=builder.build([row]),c=parser.parse(controlXml)[type],cp=p+'.'+(c?.['@Name']||type),kind={EditControl:'edit',TextControl:'text',ButtonControl:'button',SeparatorControl:'separator'}[type];
   const common=['@Name','@Width','@Height','@HorizontalAlignment','@VerticalAlignment','@ConditionalPrintType','@Position.X','@Position.Y','@ReferencePoint','@TextColor','TextColor','Font','DataSourceBindings'];
   const extra={edit:['@Lines','@ScrollBars','@PasswordCharacter','@FunctionKey','@DefaultValueSource','@ShowBorder','@DefaultDataSelectionOption','ControlItems'],text:['@Placement','@TextEdited','@InputControlName','@ControlAlignment','Text'],button:['@ButtonType','@FunctionKey','@ShowBorder','Text'],separator:[]}[kind]||[];
   fields(c,[...common,...extra],cp);if(!kind)fail(cp,'Original control type is not supported: '+type);
   if(!c?.['@Name']||names.has(c['@Name']))fail(cp,'Missing or duplicate native control name');names.add(c?.['@Name']);
   if(c?.['@ConditionalPrintType']!=='Always')fail(cp,'Conditional native form control is not mapped');
   fields(c?.TextColor,['@RGB'],cp+'.TextColor');if(c?.['@TextColor']!=='00000000'||c?.TextColor?.['@RGB']!=='00000000')fail(cp,'Unverified native text color');
   if(c?.['@ReferencePoint']!==undefined&&!['TopLeft','BottomRight'].includes(c['@ReferencePoint']))fail(cp,'Unverified native control reference point');
   if(kind==='button'&&(!['BackButton','CancelButton',undefined].includes(c['@ButtonType'])||c['@FunctionKey']!=='None'||c['@ShowBorder']!=='true'))fail(cp,'Unverified native form button action');
   const sourceRefs=[];
   if(c?.DataSourceBindings&&c.DataSourceBindings!==''){
    fields(c.DataSourceBindings,['Binding'],cp+'.DataSourceBindings');for(const binding of [].concat(c.DataSourceBindings.Binding??[])){fields(binding,['@PropertyName','@DataSourceGuid'],cp+'.Binding');const id=binding['@DataSourceGuid'];if(!Object.hasOwn(sourceDefinitions,id)||binding['@PropertyName']!==c['@Name'])fail(cp+'.Binding','Exact original source GUID binding required');sourceRefs.push(id);}
   }
   if(kind==='edit'&&(c['@Lines']!=='1'||c['@DefaultValueSource']!=='UseSampleData'||c['@FunctionKey']!=='None'||c['@ShowBorder']!=='true'||c['@DefaultDataSelectionOption']!=='FirstRecord'||sourceRefs.length!==1))fail(cp,'Native edit control differs from the observed single-line profile');
   if(c?.ControlItems){fields(c.ControlItems,['@NumberOfVisibleLines','@ItemDataKey'],cp+'.ControlItems');}
   const control={name:c?.['@Name'],kind,sourceRefs,x_mm:measure(c?.['@Position.X'],cp+'.X'),y_mm:measure(c?.['@Position.Y'],cp+'.Y'),width_mm:measure(c?.['@Width'],cp+'.Width'),height_mm:measure(c?.['@Height'],cp+'.Height'),reference:c?.['@ReferencePoint']||'TopLeft',text:text(c?.Text),font:font(c?.Font,cp+'.Font'),native:{type,properties:structuredClone(c),xml:controlXml}};
   form.controls.push(control);
  }
 }
 if(!forms.length||controlContainers.length!==forms.length)fail('DataEntryForms','Original ordered controls missing');
 return {schemaVersion:1,profile:'bartender-12.1-single-line-edit',layoutComplete:diagnostics.length===0,behaviorComplete:false,forms,nativeXml:xml,diagnostics};
}
module.exports={readNativePromptValues,readNativeDataEntryForms};
