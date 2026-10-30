'use strict';
const {XMLParser,XMLValidator}=require('fast-xml-parser');
const {compileNativeCondition}=require('../gui/source-transforms');
const options={ignoreAttributes:false,attributeNamePrefix:'@_',parseTagValue:false,parseAttributeValue:false,trimValues:false,htmlEntities:true};
const clone=value=>structuredClone(value), own=(node,key)=>Object.prototype.hasOwnProperty.call(node||{},key);
const text=value=>typeof value==='object'&&value!==null?String(value['#text']??''):String(value??'');
const attr=(node,key)=>node?.['@_'+key];
const canonical=value=>JSON.stringify(value,(_,node)=>node&&typeof node==='object'&&!Array.isArray(node)?Object.fromEntries(Object.keys(node).sort().map(key=>[key,node[key]])):node);
const behavior=definition=>{const {native,...mapped}=definition;return mapped;};
function convertNativeSources(input,{objectSourceTargets={},sourceDefinitions:existing={},nativeNumberCultures={}}={}){
  const diagnostics=[],sourceDefinitions=clone(existing),dataSourceRefs=[],nativeSources=[],transformOrders=new WeakMap();
  const fail=(code,path,message)=>diagnostics.push({code,path,message,severity:'error'});
  function fields(node,allowed,path){if(node==null||node==='')return;for(const key of Object.keys(node))if(!allowed.includes(key)&&!(key==='#text'&&/^\s*$/.test(text(node[key]))))fail('unsupported-native-field',path+'.'+key,'Unmapped native source field: '+key);}
  function nativeText(node,path){
    if(node==null||typeof node!=='object')return text(node);
    fields(node,['#text','@_Encoding'],path);const encoding=attr(node,'Encoding');
    if(encoding==null)return text(node);
    if(encoding!=='Base64'){fail('unsupported-native-text-encoding',path,'Unmapped native text encoding: '+encoding);return '';}
    const encoded=text(node).replace(/[\t\r\n ]/g,'');
    if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)){fail('invalid-native-base64',path,'Native text must contain canonical Base64 bytes');return '';}
    const bytes=Buffer.from(encoded,'base64');
    if(bytes.toString('base64')!==encoded){fail('invalid-native-base64',path,'Native Base64 has invalid padding bits');return '';}
    try{return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{fail('invalid-native-utf8',path,'Native Base64 text contains invalid UTF-8 bytes');return '';}
  }
  function decodedEvents(events,path){return Object.fromEntries(Object.entries(events||{}).filter(([key])=>!key.startsWith('@_')&&key!=='#text').map(([key,value])=>[key,nativeText(value,path+'.'+key)]));}
  function ordered(xml){
    if(Buffer.byteLength(xml)>64*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml)){fail('unsafe-source-xml','DataSources','Native source XML must be bounded and cannot declare DTDs/entities');return [];}
    const valid=XMLValidator.validate(xml);if(valid!==true){fail('invalid-source-xml','DataSources',valid.err.msg);return [];}
    const tree=new XMLParser({...options,preserveOrder:true}).parse(xml);
    let containers=[];function find(rows){for(const row of rows||[])for(const [key,value] of Object.entries(row))if(key==='DataSources')containers.push(value);else if(Array.isArray(value))find(value);}find(tree);
    if(containers.length!==1){fail('ambiguous-source-container','DataSources','Provide exactly one DataSources XML container');return [];}
    function plain(children,attrs){const result={...attrs},entries=[];for(const child of children||[])for(const [key,value]of Object.entries(child)){if(key===':@')continue;if(key==='#text'){result['#text']=(result['#text']||'')+value;continue;}const val=plain(value,child[':@']);const simplified=Object.keys(val).length===0?'':Object.keys(val).length===1&&own(val,'#text')?val['#text']:val;entries.push([key,simplified]);if(own(result,key))result[key]=Array.isArray(result[key])?[...result[key],simplified]:[result[key],simplified];else result[key]=simplified;}transformOrders.set(result,entries);return result;}
    return containers[0].filter(row=>!own(row,'#text')).map(row=>{const type=Object.keys(row).find(k=>k!==':@');return {type,node:plain(row[type],row[':@'])};});
  }
  let records;
  if(typeof input==='string')records=ordered(input);
  else if(Array.isArray(input))records=input;
  else {const container=input?.DataSources??input??{},keys=Object.keys(container).filter(k=>k!=='#text');if(keys.length>1)fail('unproven-source-order','DataSources','Mixed source kinds require ordered records or original XML');records=keys.flatMap(type=>[].concat(container[type]).map(node=>({type,node})));}
  const names=new Map(Object.values(existing).filter(s=>s.name).map(s=>[s.name,s.id]));
  function bindCondition(condition,lookup){if(!condition)return;if(condition.source&&lookup.has(condition.source))condition.definitionId=lookup.get(condition.source);for(const key of ['child','left','right'])bindCondition(condition[key],lookup);}
  function bindSourceConditions(source,lookup){for(const transform of source.transforms||[])if(transform.when==='native-condition')bindCondition(transform.condition,lookup);}
  for(const [index,record]of records.entries()){
    const {type}=record,node=record.node??{},path='DataSources['+index+']',id=attr(node,'ID');nativeSources.push(clone({type,node}));
    if(!id){fail('missing-native-source-id',path,'Native source ID is required');continue;}
    const definition={id,name:attr(node,'ShareName')||'',description:attr(node,'SubStringListDescription')||'',kind:'native-unsupported',config:{},dataType:{kind:'text'},transforms:[],native:{type,node:clone(node)}};
    const common=['@_ID','@_ShareName','@_SubStringListDescription','@_SubStringListStringID','@_CultureID','@_InputCultureID','@_CharSet','Value','Transforms','@_SuppressionType','@_PrintCondition','@_HrVisible','NumberDataType'];
    fields(node,[...common,...(type==='InputFileDataSource'?['DbFieldName']:type==='ScriptDataSource'?['ScriptEvents','@_Type','@_LastEventEdited','@_DataString']:[])],path);
    if(attr(node,'HrVisible')==='false')definition.hriVisible=false;
    else if(attr(node,'HrVisible')!=null)fail('unsupported-native-hri-visibility',path+'.@_HrVisible','Only the observed original hidden-HRI flag is verified; explicit visibility updates require further native evidence');
    if(type==='EmbeddedDataSource'){definition.kind='embedded';definition.config={value:nativeText(node.Value,path+'.Value')};}
    else if(type==='InputFileDataSource'){
      const db=node.DbFieldName;fields(db,['@_RecordSetName','@_TableName','@_ColumnName'],path+'.DbFieldName');
      if(attr(db,'ColumnName')){definition.kind='database';definition.config={field:attr(db,'ColumnName'),nativeRecordSet:attr(db,'RecordSetName'),nativeTable:attr(db,'TableName')};}
      else fail('missing-database-field',path,'Native database field identity is missing');
    }else if(type==='ObjectValueDataSource'){
      const target=objectSourceTargets[id];if(typeof target==='string'&&target){definition.kind='object';definition.config={objectId:target,value:'main'};}else fail('unresolved-object-source',path,'Native XML omits the referenced object identity; provide an evidence-backed source ID to stable object ID mapping');
    }else if(type==='ScriptDataSource'){
      definition.config={code:attr(node.ScriptEvents,'ScriptString')||'',nativeEvents:clone(node.ScriptEvents||{}),decodedEvents:decodedEvents(node.ScriptEvents,path+'.ScriptEvents')};
      fail('unsupported-script-lifecycle',path,'Native script event lifecycle and source dependencies do not yet have a verified runtime adapter; original code is retained');
    }else fail('unsupported-native-source',path,'Native source kind requires additional semantics: '+type);
    if(own(node,'NumberDataType')){
      const number=node.NumberDataType,np=path+'.NumberDataType';
      if(!number||typeof number!=='object'||Array.isArray(number))fail('unsupported-native-number-type',np,'Exactly one original number data type is required');
      else{
        fields(number,['@_CultureID','@_InputCultureID','@_UseGroupSeparator','@_ShowLeadingZero','@_DecimalPlaces','@_NegativePattern','@_HasOffset','@_HexLength','@_PrecisionType','NumericOffsetTransform'],np);
        const known={'1033':'en-US','1043':'nl-NL','1036':'fr-FR'},cultureEvidence={};
        function localeFor(key,role){
          const id=attr(number,key)??attr(node,key)??'default';if(known[id])return known[id];
          const proof=nativeNumberCultures[id];if(proof&&typeof proof==='object'&&Object.values(known).includes(proof.locale)&&typeof proof.evidence==='string'&&proof.evidence.trim()){
            cultureEvidence[role]=clone(proof);return proof.locale;
          }
          fail('unresolved-native-number-culture',np+'.'+key,'Native system/custom number culture '+id+' needs conversion-time effective locale evidence');return undefined;
        }
        const locale=localeFor('CultureID','output'),inputLocale=localeFor('InputCultureID','input'),decimals=attr(number,'DecimalPlaces')??'2',negative=attr(number,'NegativePattern')??'0',precision=attr(number,'PrecisionType');
        if(!/^\d+$/.test(decimals)||Number(decimals)>30)fail('unsupported-native-number-type',np+'.DecimalPlaces','Native decimal places must be from 0 to 30');
        if(!/^[0-4]$/.test(negative))fail('unsupported-native-number-type',np+'.NegativePattern','Native negative pattern must be from 0 to 4');
        if(precision!=null&&precision!=='LimitedTo')fail('unsupported-native-number-type',np+'.PrecisionType','Only default FixedAt and observed LimitedTo precision are mapped');
        for(const key of ['UseGroupSeparator','ShowLeadingZero','HasOffset'])if(attr(number,key)!=null&&!['true','false'].includes(attr(number,key)))fail('invalid-native-boolean',np+'.'+key,'Expected true or false');
        if(attr(number,'HexLength')!=null&&attr(number,'HexLength')!=='8')fail('unsupported-native-number-type',np+'.HexLength','Unobserved decimal profile hexadecimal setting');
        if(own(number,'NumericOffsetTransform')){
          const offset=number.NumericOffsetTransform;fields(offset,['@_Offset'],np+'.NumericOffsetTransform');
          if(Array.isArray(offset)||attr(offset,'Offset')!=='0')fail('unsupported-native-number-offset',np+'.NumericOffsetTransform','Nonzero or dynamic native numeric type offsets require additional lifecycle evidence');
        }
        if(Object.keys(cultureEvidence).length)definition.native.numberCultureEvidence=cultureEvidence;
        definition.dataType={kind:'number',nativeNumber:{profile:'BarTender12.1.0-decimal',locale,inputLocale},decimals:Number(decimals),negativePattern:Number(negative),precisionMode:precision==='LimitedTo'?'limit':'fixed',grouping:attr(number,'UseGroupSeparator')!=='false',leadingZero:attr(number,'ShowLeadingZero')!=='false'};
      }
    }
    const suppression=attr(node,'SuppressionType');
    if(suppression){if(['PreviousEmpty','NextEmpty'].includes(suppression)&&!attr(node,'PrintCondition'))definition.transforms.push({kind:'suppression',when:suppression==='PreviousEmpty'?'previous-empty':'next-empty',nativeObjectScope:true});
      else if(['SingleCondition','Expression'].includes(suppression)&&attr(node,'PrintCondition')){try{definition.transforms.push({kind:'suppression',when:'native-condition',condition:compileNativeCondition(attr(node,'PrintCondition')),nativeObjectScope:true});}catch(error){fail('unsupported-source-suppression',path,error.message);}}
      else fail('unsupported-source-suppression',path,'Native suppression expression requires a condition adapter');}
    const transforms=node.Transforms||{};
    if(transforms.ScriptEventCode?.ScriptEvents)definition.native.decodedTransformEvents=decodedEvents(transforms.ScriptEventCode.ScriptEvents,path+'.Transforms.ScriptEventCode.ScriptEvents');
    if(!transformOrders.has(transforms)&&Object.values(transforms).some(Array.isArray)&&Object.keys(transforms).length>1)fail('unproven-transform-order',path+'.Transforms','Repeated mixed transform kinds require original ordered XML');
    for(const [tag,raw]of transformOrders.get(transforms)||Object.entries(transforms)){
      if(tag==='#text'||tag==='ScriptEventCode')continue;
      for(const nativeTransform of [].concat(raw)){
        const t=nativeTransform||{},tp=path+'.Transforms.'+tag,start=diagnostics.length;let mapped;
        if(tag==='DataEntryTransform'){
          fields(t,['@_Prompt','@_PromptOnExternalKeyboard','@_Frequency','@_UpdateSubString','@_EnablePromptingOnExternalKeyboard'],tp);
          if(attr(t,'UpdateSubString')==='true'||attr(t,'EnablePromptingOnExternalKeyboard')==='true'||attr(t,'Frequency'))fail('unsupported-data-entry-lifecycle',tp,'Enabled native prompting requires the original form and event lifecycle');
        }else if(tag==='VbScriptTransform'){
          fields(t,['@_Enabled'],tp);
          if(attr(t,'Enabled')==='true')fail('unsupported-transform-script-lifecycle',tp,'OnProcessData and OnPostSerialize ordering requires a lifecycle adapter; complete original script remains in native metadata');
        }else if(tag==='CharacterFilterTransform'){
          fields(t,['@_MaskType','@_InputMask','@_OriginalEdit','@_CustomCharacters','@_PlaceHolder','@_UppercaseOnly','@_ValidationWarning','@_RegularExpression'],tp);
          const mode=attr(t,'MaskType');
          const modes={All:'all',NumericOnly:'native-digits',AlphaOnly:'native-letters',AlphanumericOnly:'native-alphanumeric',HexadecimalOnly:'native-hex',ISO646Invariant:'native-iso646',Custom:'custom'};
          if(mode!=null&&!own(modes,mode))fail('unsupported-native-filter-mode',tp,'Native filter mode requires verified semantics: '+mode);
          for(const key of ['UppercaseOnly','ValidationWarning'])if(attr(t,key)!=null&&!['true','false'].includes(attr(t,key)))fail('invalid-native-boolean',tp+'.'+key,'Expected true or false');
          // These editor settings are dormant when MaskType is NumericOnly or absent.
          mapped={kind:'filter',mode:modes[mode]||'all',...(mode==='Custom'?{characters:attr(t,'CustomCharacters')||''}:{}),removeInvalid:true,nativeValidation:{filter:attr(t,'ValidationWarning')==='true'},...(attr(t,'UppercaseOnly')==='true'?{case:'native-upper'}:{})};
        }else if(tag==='NumberOfCharactersTransform'){
          fields(t,['MaximumNumberOfCharacters','MinimumNumberOfCharacters'],tp);mapped={kind:'length',truncate:true,nativeValidation:{}};
          for(const [key,bound] of [['MaximumNumberOfCharacters','maximum'],['MinimumNumberOfCharacters','minimum']])if(own(t,key)){
            const setting=t[key],minimum=bound==='minimum';fields(setting,minimum?['@_Minimum','@_Warn','@_PadAlignment','@_PadCharacter']:['@_Maximum','@_Warn'],tp+'.'+key);
            const count=attr(setting,minimum?'Minimum':'Maximum'),warn=attr(setting,'Warn');
            if(!/^\d+$/.test(count||'')||!Number.isSafeInteger(Number(count)))fail('invalid-native-count',tp+'.'+key,'Expected nonnegative safe integer');else mapped[bound]=Number(count);
            if(warn!=null&&!['true','false'].includes(warn))fail('invalid-native-boolean',tp+'.'+key+'.Warn','Expected true or false');
            mapped.nativeValidation[bound]=warn==='true';
            if(minimum){
              const alignment=attr(setting,'PadAlignment'),character=attr(setting,'PadCharacter');
              if(alignment!=null&&!['Left','Right'].includes(alignment))fail('unsupported-native-padding',tp+'.'+key+'.PadAlignment','Native padding alignment requires a verified Left/Right value');
              // The native field stores one UTF-16 unit, even when a longer string
              // is provided. Supplementary padding would create unpaired surrogates.
              if(character!=null&&(typeof character!=='string'||!character.length||character.charCodeAt(0)===0||(character.charCodeAt(0)>=0xD800&&character.charCodeAt(0)<=0xDFFF)))fail('unsupported-native-padding',tp+'.'+key+'.PadCharacter','Native padding requires a nonempty BMP character');
              mapped.pad=character==null?'0':character.charAt(0);mapped.padSide=alignment==='Right'?'right':'left';
            }
          }
          if(mapped.minimum!=null&&mapped.maximum!=null&&mapped.minimum>mapped.maximum)fail('invalid-native-count-range',tp,'Minimum exceeds maximum');
        }else if(tag==='SearchReplaceTransform'){
          // Native ActionType 3/4 are ordinal literal replace/delete. SearchType omission
          // defaults to literal; FirstOnly limits the original left-to-right scan.
          const countText=attr(t,'NumberOfActions'),count=/^[1-9]\d*$/.test(countText||'')?Number(countText):0;
          if(!Number.isSafeInteger(count)||count<1||count>1024)fail('unsupported-native-search-profile',tp,'Native action count must be from 1 to 1024');
          const indices=Array.from({length:Number.isSafeInteger(count)&&count>=1&&count<=1024?count:0},(_,index)=>'Action-'+(index+1));
          fields(t,['@_NumberOfActions',...indices],tp);mapped={kind:'search-replace',actions:[]};
          for(const key of indices){
            const ap=tp+'.'+key,action=t[key];
            if(!action||Array.isArray(action)||typeof action!=='object'){fail('unsupported-native-search-profile',ap,'Exactly one original action is required at each native index');continue;}
            fields(action,['@_ActionType','@_SearchType','@_Description','@_EncoderType','@_SearchString','@_ReplaceString','@_FirstOnly'],ap);
            const kind=attr(action,'ActionType'),syntax=attr(action,'SearchType'),first=attr(action,'FirstOnly'),search=attr(action,'SearchString');
            if(!['3','4'].includes(kind)||(syntax!=null&&syntax!=='1')||attr(action,'EncoderType')!=='3'||typeof search!=='string'||!search||(first!=null&&!['true','false'].includes(first))||(kind==='3'&&typeof attr(action,'ReplaceString')!=='string'))fail('unsupported-native-search-profile',ap,'Action differs from the observed native literal replacement/deletion profile');
            mapped.actions.push({operation:kind==='4'?'delete':'replace',syntax:'literal',search,replace:attr(action,'ReplaceString')||'',all:first!=='true'});
          }
        }else if(tag==='PrefixSuffixTransform'){
          fields(t,['Prefix','Suffix'],tp);mapped={kind:'prefix-suffix',prefix:text(t.Prefix),suffix:text(t.Suffix)};
        }else if(tag==='CharacterTemplateTransform'){
          fields(t,['@_CharacterTemplate'],tp);mapped={kind:'character-template',pattern:attr(t,'CharacterTemplate')||''};
        }else if(tag==='TruncationTransform'){
          const mapping={DiscardCharactersOnLeft:'discardLeft',DiscardCharactersOnRight:'discardRight',KeepCharactersOnLeft:'keepLeft',KeepCharactersOnRight:'keepRight',TrimSpacesOnLeft:'trimStart',TrimSpacesOnRight:'trimEnd'};
          fields(t,Object.keys(mapping).map(k=>'@_'+k),tp);mapped={kind:'truncation'};
          for(const [key,value]of Object.entries(mapping))if(attr(t,key)!=null){const rawValue=attr(t,key);if(value.startsWith('trim')){if(!['true','false'].includes(rawValue))fail('invalid-native-boolean',tp+'.'+key,'Expected true or false');mapped[value]=rawValue==='true';}else if(!/^\d+$/.test(rawValue)||!Number.isSafeInteger(Number(rawValue)))fail('invalid-native-count',tp+'.'+key,'Expected nonnegative safe integer');else mapped[value]=Number(rawValue);}
        }else if(tag==='NumericOffsetTransform'){
          fields(t,['@_Offset'],tp);if(attr(t,'Offset')!=null&&Number.isFinite(Number(attr(t,'Offset'))))mapped={kind:'offset',amount:Number(attr(t,'Offset')),offsetSource:'constant'};else fail('unsupported-native-offset',tp,'Offset requires an explicit numeric constant');
        }else if(tag==='DateTimeOffsetTransform'&&Object.keys(t).length===0){/* Native empty offset has no configured adjustment. */}
        else fail(tag==='SerializationTransform'?'unsupported-native-serialization':'unsupported-native-transform',tp,'Native transform requires a verified semantics adapter: '+tag);
        if(diagnostics.length>start)definition.transforms.push({kind:'native-unsupported',nativeTag:tag,native:clone(t)});else if(mapped)definition.transforms.push(mapped);
      }
    }
    if(transforms.ScriptEventCode&&!own(transforms,'VbScriptTransform'))fail('unpaired-native-script',path+'.Transforms.ScriptEventCode','Script event bundle has no explicit transform activation state');
    if(names.has(definition.name)&&definition.name&&names.get(definition.name)!==id)fail('duplicate-source-name',path,'Native shared name maps to different source IDs: '+definition.name);else if(definition.name)names.set(definition.name,id);
    bindSourceConditions(definition,names);
    if(own(sourceDefinitions,id)){
      if(canonical(behavior(sourceDefinitions[id]))!==canonical(behavior(definition)))fail('conflicting-native-source',path,'Native source ID has conflicting definitions: '+id);
      else if(canonical(sourceDefinitions[id].native?.node)!==canonical(definition.native.node)){
        const metadata=sourceDefinitions[id].native||=(clone(definition.native));metadata.variants||=[];
        if(!metadata.variants.some(variant=>canonical(variant.node)===canonical(definition.native.node)))metadata.variants.push(clone(definition.native));
      }
    }else Object.defineProperty(sourceDefinitions,id,{value:definition,enumerable:true,writable:true,configurable:true});
    dataSourceRefs.push(id);
  }
  const sourceIdsByName=new Map(Object.values(sourceDefinitions).filter(source=>source.name).map(source=>[source.name,source.id]));
  for(const source of Object.values(sourceDefinitions))bindSourceConditions(source,sourceIdsByName);
  return {sourceDefinitions,dataSourceRefs,diagnostics,nativeSources,complete:diagnostics.length===0};
}
module.exports={convertNativeSources};
