'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {convertNativeSources}=require('../lib/btw-native-source-converter');
const Resolver=require('../gui/source-resolver');
const wrap=body=>`<DataSources>${body}</DataSources>`;
const evaluate=result=>Resolver.evaluateDocument({sourceDefinitions:result.sourceDefinitions,elements:[{id:'text',type:'text',dataSourceRefs:result.dataSourceRefs}]});
test('native source XML rejects DTD and entity declarations before parsing',()=>{
 const r=convertNativeSources('<!DOCTYPE DataSources [<!ENTITY x "changed">]>'+wrap('<EmbeddedDataSource ID="x"><Value>&x;</Value></EmbeddedDataSource>'));
 assert.equal(r.complete,false);assert.ok(r.diagnostics.some(d=>d.code==='unsafe-source-xml'));assert.deepEqual(r.dataSourceRefs,[]);
});
test('native embedded strings preserve whitespace, leading zeroes, IDs, shared names and ordered concatenation',()=>{
  const xml=wrap('<EmbeddedDataSource ID="{A}" ShareName="UPC"><Value>000123</Value></EmbeddedDataSource><EmbeddedDataSource ID="{B}"><Value> / </Value></EmbeddedDataSource><EmbeddedDataSource ID="{A}" ShareName="UPC"><Value>000123</Value></EmbeddedDataSource>');
  const r=convertNativeSources(xml);assert.equal(r.complete,true);assert.deepEqual(r.dataSourceRefs,['{A}','{B}','{A}']);assert.equal(Object.keys(r.sourceDefinitions).length,2);assert.equal(r.sourceDefinitions['{A}'].name,'UPC');assert.equal(evaluate(r).objects.text.text,'000123 / 000123');
});
test('native transform sequence uses real truncation, affixes and character template resolver semantics',()=>{
  const r=convertNativeSources(wrap('<EmbeddedDataSource ID="x"><Value>01234567</Value><Transforms><TruncationTransform DiscardCharactersOnLeft="1" DiscardCharactersOnRight="1"/><CharacterTemplateTransform CharacterTemplate="??-??-??"/><PrefixSuffixTransform><Prefix>[</Prefix><Suffix>]</Suffix></PrefixSuffixTransform></Transforms></EmbeddedDataSource>'));
  assert.equal(r.complete,true);assert.equal(evaluate(r).objects.text.text,'[12-34-56]');
});
test('database sources preserve field provenance and fail print without real records rather than returning sample Value',()=>{
  const r=convertNativeSources(wrap('<InputFileDataSource ID="db"><DbFieldName RecordSetName="CSV_DATA" TableName="Text" ColumnName="CategoryLevel1Code"/><Value>Product</Value></InputFileDataSource>'));
  assert.equal(r.sourceDefinitions.db.kind,'database');assert.equal(r.sourceDefinitions.db.config.field,'CategoryLevel1Code');assert.equal(r.sourceDefinitions.db.config.sampleData,undefined);
  const doc={sourceDefinitions:r.sourceDefinitions,elements:[{id:'a',dataSourceRefs:r.dataSourceRefs}]};assert.equal(Resolver.evaluateDocument(doc,{mode:'print'}).diagnostics[0].code,'missing-field');
  assert.equal(Resolver.evaluateDocument({...doc,database_connection:{rows:[{CategoryLevel1Code:'Real'}]}},{mode:'print'}).objects.a.text,'Real');
});
test('unresolved object source never converts its cached Value into embedded text',()=>{
  const r=convertNativeSources(wrap('<ObjectValueDataSource ID="ref"><Value>20</Value></ObjectValueDataSource>'));assert.equal(r.complete,false);assert.equal(r.sourceDefinitions.ref.kind,'native-unsupported');assert.ok(r.diagnostics.some(d=>d.code==='unresolved-object-source'));
  const resolved=convertNativeSources(wrap('<ObjectValueDataSource ID="ref"><Value>20</Value></ObjectValueDataSource>'),{objectSourceTargets:{ref:'target'}});assert.equal(resolved.sourceDefinitions.ref.config.objectId,'target');
});
test('scripts retain exact event bundle and expression while rejecting unimplemented lifecycle semantics',()=>{
  const r=convertNativeSources(wrap('<ScriptDataSource ID="s" Type="AutoScript"><Value>12</Value><ScriptEvents ScriptString="Sub OnAutoSelectedEvent()&#10;Value = &quot;10&quot;&#10;End Sub"><OnAutoSelectedExpression>CINT((TotalFat / 65) * 100)</OnAutoSelectedExpression></ScriptEvents></ScriptDataSource>'));
  assert.equal(r.complete,false);assert.equal(r.sourceDefinitions.s.kind,'native-unsupported');assert.equal(r.nativeSources[0].node.ScriptEvents.OnAutoSelectedExpression,'CINT((TotalFat / 65) * 100)');assert.ok(r.diagnostics.some(d=>d.code==='unsupported-script-lifecycle'));
});
test('unknown transforms, unknown fields and enabled native serialization block conversion with original information',()=>{
  for(const body of ['<MysteryTransform Mode="x"/>','<SerializationTransform Enabled="true" SerialValue="1" RollOverValue="999999"/>']){
    const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value>001</Value><Transforms>${body}</Transforms></EmbeddedDataSource>`));assert.equal(r.complete,false);assert.ok(r.sourceDefinitions.s.transforms.some(t=>t.kind==='native-unsupported'));assert.ok(evaluate(r).diagnostics.length);
  }
  const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s" FutureMeaning="true"><Value>x</Value></EmbeddedDataSource>'));assert.equal(r.complete,false);assert.ok(r.diagnostics.some(d=>d.path.endsWith('FutureMeaning')));
});
test('native disabled script container is preserved without executing its dormant script',()=>{
  const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>safe</Value><Transforms><VbScriptTransform/><ScriptEventCode><ScriptEvents ScriptString="Sub OnProcessData()&#10;Value = &quot;changed&quot;&#10;End Sub"><OnProcessData>Value = "changed"</OnProcessData></ScriptEvents></ScriptEventCode></Transforms></EmbeddedDataSource>'));
  assert.equal(r.complete,true);assert.equal(evaluate(r).objects.text.text,'safe');assert.equal(r.nativeSources[0].node.Transforms.ScriptEventCode.ScriptEvents.OnProcessData,'Value = "changed"');
});
test('conflicting native source identities and shared names are blocking diagnostics',()=>{
  const r=convertNativeSources(wrap('<EmbeddedDataSource ID="a" ShareName="Same"><Value>one</Value></EmbeddedDataSource><EmbeddedDataSource ID="b" ShareName="Same"><Value>two</Value></EmbeddedDataSource><EmbeddedDataSource ID="a"><Value>other</Value></EmbeddedDataSource>'));assert.equal(r.complete,false);assert.ok(r.diagnostics.some(d=>d.code==='conflicting-native-source'));assert.ok(r.diagnostics.some(d=>d.code==='duplicate-source-name'));
});

test('observed native numeric filtering uses real transforms before length truncation',()=>{
 const dormant='InputMask="(999) 000-0000" OriginalEdit="(___) ___-____" CustomCharacters="0123456789ABC" PlaceHolder="_" ValidationWarning="true" RegularExpression="[0-9A-Za-z]*"';
 for(const [filter,value] of [[`MaskType="NumericOnly" ${dormant}`,'129'],[`MaskType="NumericOnly" UppercaseOnly="true" ${dormant}`,'129']]){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value>aB12-x9</Value><Transforms><CharacterFilterTransform ${filter}/><NumberOfCharactersTransform><MaximumNumberOfCharacters Maximum="4" Warn="true"/></NumberOfCharactersTransform></Transforms></EmbeddedDataSource>`));
  assert.equal(r.complete,true);assert.equal(evaluate(r).objects.text.text,value);assert.ok(evaluate(r).objects.text.validationMessages.length);
 }
});

test('native source filter Unicode acceptance differs from ASCII data-entry controls',()=>{
 for(const [mask,expected] of [['NumericOnly','09١'],['AlphaOnly','aBzéกAZ'],['AlphanumericOnly','aBz09éก١AZ'],['HexadecimalOnly','aB09١A'],['ISO646Invariant','aBz09,._-+AZ'],['Custom','09-+']]){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value>aBz09 $,.¢éก١😀_#-+AZ</Value><Transforms><CharacterFilterTransform MaskType="${mask}" CustomCharacters="+-0123456789"/></Transforms></EmbeddedDataSource>`));assert.equal(r.complete,true,mask+JSON.stringify(r.diagnostics));assert.equal(evaluate(r).objects.text.text,expected,mask);
 }
});

test('native uppercase uses observed scalar mapping rather than expanding sharp s',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>éßก12</Value><Transforms><CharacterFilterTransform UppercaseOnly="true"/></Transforms></EmbeddedDataSource>'));
 assert.equal(r.complete,true);assert.equal(evaluate(r).objects.text.text,'Éßก12');
});

test('native observed default minimum pads with zero on the left and maximum truncates on the right',()=>{
 for(const [input,expected] of [['12','012'],['','000'],['aB12-x9','aB1'],['abc','abc'],['😀12','😀12']]){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="rack"><Value>${input}</Value><Transforms><NumberOfCharactersTransform><MaximumNumberOfCharacters Maximum="3" Warn="true"/><MinimumNumberOfCharacters Minimum="3"/></NumberOfCharactersTransform></Transforms></EmbeddedDataSource>`));
  assert.equal(r.complete,true);assert.equal(evaluate(r).objects.text.text,expected);
 }
});

test('native transform order preserves repeated transforms separated by other kinds',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>abc</Value><Transforms><PrefixSuffixTransform><Prefix>X</Prefix></PrefixSuffixTransform><TruncationTransform DiscardCharactersOnLeft="1"/><PrefixSuffixTransform><Suffix>Y</Suffix></PrefixSuffixTransform></Transforms></EmbeddedDataSource>'));
 assert.equal(r.complete,true);assert.deepEqual(r.sourceDefinitions.s.transforms.map(t=>t.kind),['prefix-suffix','truncation','prefix-suffix']);assert.equal(evaluate(r).objects.text.text,'abcY');
});

test('native minimum with Warn pads editor data and blocks print using observed native validation',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>12</Value><Transforms><NumberOfCharactersTransform><MinimumNumberOfCharacters Minimum="10" Warn="true"/></NumberOfCharactersTransform></Transforms></EmbeddedDataSource>'));
 assert.equal(r.complete,true);assert.equal(evaluate(r).objects.text.text,'0000000012');assert.equal(evaluate(r).objects.text.validationMessages[0].nativeNumber,2602);
 const printed=Resolver.evaluateDocument({sourceDefinitions:r.sourceDefinitions,elements:[{id:'text',type:'text',dataSourceRefs:r.dataSourceRefs}]},{mode:'print'});assert.equal(printed.diagnostics[0].code,'native-validation');assert.equal(printed.objects.text,undefined);
});

test('unobserved native filter modes, padding and invalid counts remain blocking',()=>{
 for(const transform of ['<CharacterFilterTransform MaskType="RegularExpression" RegularExpression=".*"/>','<CharacterFilterTransform MaskType="InputMask" InputMask="000"/>','<CharacterFilterTransform RightToLeft="true"/>','<NumberOfCharactersTransform><MinimumNumberOfCharacters Minimum="3" PadAlignment="Center"/></NumberOfCharactersTransform>','<NumberOfCharactersTransform><MaximumNumberOfCharacters Maximum="-1"/></NumberOfCharactersTransform>']){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value>12</Value><Transforms>${transform}</Transforms></EmbeddedDataSource>`));assert.equal(r.complete,false,transform);assert.ok(r.sourceDefinitions.s.transforms.some(t=>t.kind==='native-unsupported'));
 }
});

test('native minimum padding preserves observed side, original character and Unicode source length',()=>{
 for(const [attributes,input,expected]of [['','12','00012'],[' PadAlignment="Left"','12','00012'],[' PadAlignment="Right"','12','12000'],[' PadAlignment="Right" PadCharacter=" "','aB','aB   '],[' PadAlignment="Left" PadCharacter="X"','aB','XXXaB'],[' PadCharacter="ก"','12','กกก12'],[' PadCharacter="XY"','12','XXX12'],[' PadAlignment="Right"','😀12','😀1200'],[' PadAlignment="Right" PadCharacter=" "','','     ']]){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value>${input}</Value><Transforms><NumberOfCharactersTransform><MinimumNumberOfCharacters Minimum="5"${attributes}/></NumberOfCharactersTransform></Transforms></EmbeddedDataSource>`));assert.equal(r.complete,true,attributes+JSON.stringify(r.diagnostics));assert.equal(evaluate(r).objects.text.text,expected);
 }
});
test('unverified native padding units and alignment remain blocking',()=>{
 for(const attributes of [' PadCharacter="😀"',' PadCharacter=""',' PadAlignment="Center"']){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value>12</Value><Transforms><NumberOfCharactersTransform><MinimumNumberOfCharacters Minimum="5"${attributes}/></NumberOfCharactersTransform></Transforms></EmbeddedDataSource>`));assert.equal(r.complete,false,attributes);assert.ok(r.sourceDefinitions.s.transforms.some(t=>t.kind==='native-unsupported'));
 }
});

test('native Base64 embedded Value decodes observed UTF-8 bytes including controls without losing the carrier',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value Encoding="Base64">w6ng\n uIHwn5iAAQ0K</Value></EmbeddedDataSource>'));
 assert.equal(r.complete,true,JSON.stringify(r.diagnostics));assert.equal(r.sourceDefinitions.s.config.value,'éก😀\u0001\r\n');assert.equal(evaluate(r).objects.text.text,'éก😀\u0001\r\n');assert.equal(r.nativeSources[0].node.Value['@_Encoding'],'Base64');
});

test('native Base64 script events decode as metadata while original code and lifecycle blockers survive',()=>{
 const r=convertNativeSources(wrap('<ScriptDataSource ID="s"><Value>0</Value><ScriptEvents ScriptString="Sub OnAutoSelectedEvent()&#13;&#10;Value = &quot;0&quot;&#13;&#10;End Sub"><OnAutoSelectedEvent Encoding="Base64">VmFsdWUgPSAiMCINCg==</OnAutoSelectedEvent><OnAutoSelectedExpression>CInt((Cholesterol / 300) * 100)</OnAutoSelectedExpression></ScriptEvents></ScriptDataSource>'));
 assert.equal(r.complete,false);assert.equal(r.sourceDefinitions.s.config.decodedEvents.OnAutoSelectedEvent,'Value = "0"\r\n');assert.equal(r.sourceDefinitions.s.config.nativeEvents.OnAutoSelectedEvent['#text'],'VmFsdWUgPSAiMCINCg==');assert.ok(r.diagnostics.some(d=>d.code==='unsupported-script-lifecycle'));assert.equal(r.sourceDefinitions.s.kind,'native-unsupported');
});

test('malformed Base64, invalid UTF-8 and unknown text encoding are blocking rather than cached text',()=>{
 for(const [encoding,value] of [['Base64','not!base64'],['Base64','wA=='],['Base64','Zh=='],['UTF16','VGV4dA==']]){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value Encoding="${encoding}">${value}</Value></EmbeddedDataSource>`));assert.equal(r.complete,false,encoding+value);assert.ok(r.diagnostics.some(d=>['invalid-native-base64','invalid-native-utf8','unsupported-native-text-encoding'].includes(d.code)));
 }
});

test('native pretty printed structure ignores indentation while preserving whitespace inside Value',()=>{
 const r=convertNativeSources(`<DataSources>\n <EmbeddedDataSource ID="s">\n  <Transforms>\n   <DataEntryTransform/>\n   <VbScriptTransform/>\n  </Transforms>\n  <Value> 001\n </Value>\n </EmbeddedDataSource>\n</DataSources>`);
 assert.equal(r.complete,true,JSON.stringify(r.diagnostics));assert.equal(evaluate(r).objects.text.text,' 001\n ');
 const bad=convertNativeSources('<DataSources><EmbeddedDataSource ID="s">unmapped<Value>x</Value></EmbeddedDataSource></DataSources>');assert.equal(bad.complete,false);
});

test('observed native ingredient brace replacement uses existing literal search engine for every occurrence',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>{Milk} and {milk} {{x}}</Value><Transforms><SearchReplaceTransform NumberOfActions="2"><Action-1 ActionType="3" SearchType="1" Description="Start Tag" EncoderType="3" SearchString="{" ReplaceString="&lt;b&gt;"/><Action-2 ActionType="3" SearchType="1" Description="End Tag" EncoderType="3" SearchString="}" ReplaceString="&lt;/b&gt;"/></SearchReplaceTransform></Transforms></EmbeddedDataSource>'));
 assert.equal(r.complete,true,JSON.stringify(r.diagnostics));assert.equal(evaluate(r).objects.text.text,'<b>Milk</b> and <b>milk</b> <b><b>x</b></b>');
 const other=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>x</Value><Transforms><SearchReplaceTransform NumberOfActions="1"><Action-1 ActionType="3" SearchType="2" EncoderType="3" SearchString="x" ReplaceString="y"/></SearchReplaceTransform></Transforms></EmbeddedDataSource>'));assert.equal(other.complete,false);
});

test('native literal replace and delete profiles preserve case, default syntax and first-only behavior',()=>{
 for(const [kind,syntax,first,expected]of [['3',' SearchType="1"','', 'X AB Ab aB XXX'],['4',' SearchType="1"','', ' AB Ab aB '],['3','','','X AB Ab aB XXX'],['4','','',' AB Ab aB '],['3',' SearchType="1"',' FirstOnly="true"','X AB Ab aB ababab'],['4',' SearchType="1"',' FirstOnly="true"',' AB Ab aB ababab']]){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value>ab AB Ab aB ababab</Value><Transforms><SearchReplaceTransform NumberOfActions="1"><Action-1 ActionType="${kind}"${syntax}${first} EncoderType="3" SearchString="ab"${kind==='3'?' ReplaceString="X"':''}/></SearchReplaceTransform></Transforms></EmbeddedDataSource>`));
  assert.equal(r.complete,true,JSON.stringify(r.diagnostics));assert.equal(evaluate(r).objects.text.text,expected);
 }
});
test('native literal replacement treats dollar patterns as text and applies native action indices in order',()=>{
 const escaped=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>.x..</Value><Transforms><SearchReplaceTransform NumberOfActions="1"><Action-1 ActionType="3" SearchType="1" EncoderType="3" SearchString="." ReplaceString="$&amp;$1\\"/></SearchReplaceTransform></Transforms></EmbeddedDataSource>'));
 assert.equal(escaped.complete,true,JSON.stringify(escaped.diagnostics));assert.equal(evaluate(escaped).objects.text.text,'$&$1\\x$&$1\\$&$1\\');
 const ordered=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>a ab aa</Value><Transforms><SearchReplaceTransform NumberOfActions="2"><Action-2 ActionType="3" SearchType="1" EncoderType="3" SearchString="ab" ReplaceString="Y"/><Action-1 ActionType="3" SearchType="1" EncoderType="3" SearchString="a" ReplaceString="ab"/></SearchReplaceTransform></Transforms></EmbeddedDataSource>'));
 assert.equal(ordered.complete,true,JSON.stringify(ordered.diagnostics));assert.equal(evaluate(ordered).objects.text.text,'Y Yb YY');
 const overlap=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>aaaaa</Value><Transforms><SearchReplaceTransform NumberOfActions="1"><Action-1 ActionType="3" SearchType="1" EncoderType="3" SearchString="aa" ReplaceString="b"/></SearchReplaceTransform></Transforms></EmbeddedDataSource>'));
 assert.equal(overlap.complete,true);assert.equal(evaluate(overlap).objects.text.text,'bba');
});
test('native literal replacement keeps every action in large original lookup transforms',()=>{
 const actions=Array.from({length:80},(_,i)=>`<Action-${i+1} ActionType="3" SearchType="1" EncoderType="3" SearchString="H${200+i}" ReplaceString="statement ${i+1}"/>`).join('');
 const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value>H200 / H279 / H200</Value><Transforms><SearchReplaceTransform NumberOfActions="80">${actions}</SearchReplaceTransform></Transforms></EmbeddedDataSource>`));
 assert.equal(r.complete,true,JSON.stringify(r.diagnostics));assert.equal(r.sourceDefinitions.s.transforms[0].actions.length,80);assert.equal(evaluate(r).objects.text.text,'statement 1 / statement 80 / statement 1');
});
test('native literal action conversion rejects missing, duplicate, extra and unknown action semantics',()=>{
 for(const content of ['NumberOfActions="2"><Action-1 ActionType="3" SearchType="1" EncoderType="3" SearchString="x" ReplaceString="y"/>','NumberOfActions="1"><Action-1 ActionType="3" SearchType="1" EncoderType="3" SearchString="x" ReplaceString="y"/><Action-2 ActionType="4" EncoderType="3" SearchString="x"/>','NumberOfActions="1"><Action-1 ActionType="3" SearchType="1" EncoderType="3" FirstOnly="maybe" SearchString="x" ReplaceString="y"/>','NumberOfActions="1"><Action-1 ActionType="3" SearchType="1" EncoderType="3" SearchString="" ReplaceString="y"/>','NumberOfActions="1"><Action-1 ActionType="3" SearchType="1" EncoderType="2" SearchString="x" ReplaceString="y"/>','NumberOfActions="1"><Action-1 ActionType="3" SearchType="1" EncoderType="3" SearchString="x" ReplaceString="y"/><Action-1 ActionType="3" SearchType="1" EncoderType="3" SearchString="x" ReplaceString="z"/>']){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s"><Value>x</Value><Transforms><SearchReplaceTransform ${content}</SearchReplaceTransform></Transforms></EmbeddedDataSource>`));assert.equal(r.complete,false,content);assert.ok(r.sourceDefinitions.s.transforms.some(t=>t.kind==='native-unsupported'));
 }
});

test('native conditional suppression follows observed boolean, null, exact string and object-only semantics',()=>{
 const cases=[['IsFalse([Flag])','00',true],['IsFalse([Flag])','false',true],['IsTrue([Flag])','no',true],['[Flag] Is Null',' ',true],['IsNullOrEmpty([Flag])',' ',false],['Not IsNullOrEmpty([Flag])',' ',true],["[Flag] = 'YES'",'Yes',true],["[Flag] = '1'",'01',false],["IsNullOrEmpty([Flag]) Or [Flag] = '0'",'',true]];
 for(const [condition,input,suppressed]of cases){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="flag" ShareName="Flag"><Value>${input}</Value></EmbeddedDataSource><EmbeddedDataSource ID="s" ShareName="Marker" SuppressionType="Expression" PrintCondition="${condition.replace(/</g,'&lt;')}"><Value>MARKER</Value></EmbeddedDataSource>`));assert.equal(r.complete,true,condition+JSON.stringify(r.diagnostics));
  const result=Resolver.evaluateDocument({sourceDefinitions:r.sourceDefinitions,elements:[{id:'x',type:'text',dataSourceRefs:['s']}]});assert.equal(result.objects.x.text,suppressed?'':'MARKER',condition+':'+input);assert.equal(result.namedValues.Marker,'MARKER');
 }
 const unknown=convertNativeSources(wrap('<EmbeddedDataSource ID="s" SuppressionType="Expression" PrintCondition="Eval([Flag])"><Value>x</Value></EmbeddedDataSource>'));assert.equal(unknown.complete,false);
});

test('native named suppression dependencies must resolve live sources and are never cached samples',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s" ShareName="Marker" SuppressionType="SingleCondition" PrintCondition="IsFalse([Missing])"><Value>MARKER</Value></EmbeddedDataSource>'));assert.equal(r.complete,true);
 const result=Resolver.evaluateDocument({sourceDefinitions:r.sourceDefinitions,elements:[{id:'x',type:'text',dataSourceRefs:['s']}]});assert.ok(result.diagnostics.some(d=>/Missing/.test(d.message)));assert.equal(result.objects.x,undefined);assert.equal(result.namedValues.Marker,'MARKER');
});

test('native condition shared-source identity survives a later display name change',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="flag" ShareName="Flag"><Value>0</Value></EmbeddedDataSource><EmbeddedDataSource ID="s" SuppressionType="SingleCondition" PrintCondition="IsFalse([Flag])"><Value>MARKER</Value></EmbeddedDataSource>'));
 r.sourceDefinitions.flag.name='Renamed';const result=Resolver.evaluateDocument({sourceDefinitions:r.sourceDefinitions,elements:[{id:'x',type:'text',dataSourceRefs:['s']}]});assert.deepEqual(result.diagnostics,[]);assert.equal(result.objects.x.text,'');
});
test('reusing an unchanged native conditional source registry does not create a false identity conflict',()=>{
 const xml=wrap('<EmbeddedDataSource ID="flag" ShareName="Flag"><Value>0</Value></EmbeddedDataSource><EmbeddedDataSource ID="s" SuppressionType="SingleCondition" PrintCondition="IsFalse([Flag])"><Value>MARKER</Value></EmbeddedDataSource>');const first=convertNativeSources(xml),again=convertNativeSources(xml,{sourceDefinitions:first.sourceDefinitions});assert.equal(again.complete,true,JSON.stringify(again.diagnostics));
});
test('native carriers with the same mapped behavior retain both original XML variants without a false source conflict',()=>{
 const first=convertNativeSources(wrap('<EmbeddedDataSource ID="s" ShareName="ProductName"><Transforms><VbScriptTransform/><ScriptEventCode><ScriptEvents ScriptString="Sub OnProcessData()&#10;End Sub"><OnProcessData/></ScriptEvents></ScriptEventCode></Transforms><Value>Product Name</Value></EmbeddedDataSource>'));
 const second=convertNativeSources(wrap('<EmbeddedDataSource ShareName="ProductName" ID="s">\n <Transforms><VbScriptTransform/><ScriptEventCode><ScriptEvents ScriptString="Sub OnProcessData()&#10;    End Sub"><OnProcessData/></ScriptEvents></ScriptEventCode></Transforms>\n <Value>Product Name</Value>\n</EmbeddedDataSource>'),{sourceDefinitions:first.sourceDefinitions});assert.equal(second.complete,true,JSON.stringify(second.diagnostics));assert.equal(second.sourceDefinitions.s.native.node.Transforms.ScriptEventCode.ScriptEvents['@_ScriptString'],'Sub OnProcessData()\nEnd Sub');assert.equal(second.sourceDefinitions.s.native.variants.length,1);assert.equal(second.sourceDefinitions.s.native.variants[0].node.Transforms.ScriptEventCode.ScriptEvents['@_ScriptString'],'Sub OnProcessData()\n    End Sub');
 const conflict=convertNativeSources(wrap('<EmbeddedDataSource ID="s" ShareName="ProductName"><Value>Changed</Value></EmbeddedDataSource>'),{sourceDefinitions:first.sourceDefinitions});assert.equal(conflict.complete,false);assert.ok(conflict.diagnostics.some(d=>d.code==='conflicting-native-source'));
});
test('native XML standard numeric character references decode in source text and script attributes',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><Value>&#x41;&#8364;&#10;</Value></EmbeddedDataSource>'));assert.equal(r.complete,true);assert.equal(r.sourceDefinitions.s.config.value,'A€\n');
});
test('native neighbor conditions do not suppress when the requested neighbor position does not exist',()=>{
 for(const condition of ['[@previousDataSource] Is Null','IsNullOrEmpty([@previousDataSource])','[@nextDataSource] Is Null','IsNullOrEmpty([@nextDataSource])']){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s" SuppressionType="SingleCondition" PrintCondition="${condition}"><Value>MARKER</Value></EmbeddedDataSource>`));assert.equal(r.complete,true);assert.equal(evaluate(r).objects.text.text,'MARKER',condition);
 }
});
test('native numeric source types map observed decimal locale parsing and presentation without changing original Value',()=>{
 const type='<NumberDataType CultureID="1043" InputCultureID="1033" UseGroupSeparator="false" ShowLeadingZero="false" DecimalPlaces="1" NegativePattern="1" HasOffset="true" HexLength="8"><NumericOffsetTransform Offset="0"/></NumberDataType>';
 const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s" ShareName="Weight">${type}<Value>1234.567</Value></EmbeddedDataSource>`));assert.equal(r.complete,true,JSON.stringify(r.diagnostics));assert.equal(r.sourceDefinitions.s.config.value,'1234.567');assert.equal(r.sourceDefinitions.s.dataType.nativeNumber.locale,'nl-NL');assert.equal(evaluate(r).objects.text.text,'1234567,0');
 const changed=structuredClone(r);changed.sourceDefinitions.s.config.value='1,234.56';assert.equal(evaluate(changed).objects.text.text,'1234,6');
 const us=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><NumberDataType CultureID="1033" InputCultureID="1033" PrecisionType="LimitedTo" NegativePattern="1"/><Value>-1.005</Value></EmbeddedDataSource>'));assert.equal(us.complete,true,JSON.stringify(us.diagnostics));assert.equal(evaluate(us).objects.text.text,'-1.01');
});
test('native numeric invalid input remains blank for print like the controlled native preview',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="s"><NumberDataType CultureID="1033" InputCultureID="1033"/><Value>abc</Value></EmbeddedDataSource>'));assert.equal(r.complete,true,JSON.stringify(r.diagnostics));
 const result=Resolver.evaluateDocument({sourceDefinitions:r.sourceDefinitions,elements:[{id:'text',type:'text',dataSourceRefs:r.dataSourceRefs}]},{mode:'print'});assert.deepEqual(result.diagnostics,[]);assert.equal(result.objects.text.text,'');
});
test('native numeric unresolved OS cultures require explicit conversion-time culture evidence',()=>{
 const xml=wrap('<EmbeddedDataSource ID="s"><NumberDataType CultureID="-3" InputCultureID="8192" DecimalPlaces="0"/><Value>1234.567</Value></EmbeddedDataSource>');
 const unresolved=convertNativeSources(xml);assert.equal(unresolved.complete,false);assert.ok(unresolved.diagnostics.some(d=>d.code==='unresolved-native-number-culture'));
 const resolved=convertNativeSources(xml,{nativeNumberCultures:{'-3':{locale:'en-US',evidence:'number-profiles-results.tsv:1'},'8192':{locale:'en-US',evidence:'number-profiles-results.tsv:3'}}});assert.equal(resolved.complete,true,JSON.stringify(resolved.diagnostics));assert.equal(evaluate(resolved).objects.text.text,'1,235');assert.equal(resolved.sourceDefinitions.s.native.numberCultureEvidence.output.evidence,'number-profiles-results.tsv:1');
 const unproven=convertNativeSources(xml,{nativeNumberCultures:{'-3':{locale:'en-US'},'8192':{locale:'en-US'}}});assert.equal(unproven.complete,false);
});
test('native numeric conversion rejects unobserved nonzero offsets, precision modes and field values',()=>{
 for(const node of ['<NumberDataType CultureID="1033" InputCultureID="1033" HasOffset="true"><NumericOffsetTransform Offset="10"/></NumberDataType>','<NumberDataType CultureID="1033" InputCultureID="1033" PrecisionType="MaximumPrecision"/>','<NumberDataType CultureID="1033" InputCultureID="1033" DecimalPlaces="31"/>','<NumberDataType CultureID="1033" InputCultureID="1033" UseGroupSeparator="yes"/>','<NumberDataType CultureID="1033" InputCultureID="1033" HasOffset="true" SourceType="NamedDataSource"><NumericOffsetTransform SourceType="NamedDataSource" Offset="0"/></NumberDataType>']){
  const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s">${node}<Value>12</Value></EmbeddedDataSource>`));assert.equal(r.complete,false,node);assert.ok(r.diagnostics.length);
 }
});
test('native hidden HRI source retains encoded data and live named values while hiding only its barcode caption part',()=>{
 const r=convertNativeSources(wrap('<EmbeddedDataSource ID="prefix" ShareName="Prefix" HrVisible="false"><Value>Q</Value></EmbeddedDataSource><EmbeddedDataSource ID="qty" ShareName="Quantity"><Value>900</Value></EmbeddedDataSource>'));
 assert.equal(r.complete,true,JSON.stringify(r.diagnostics));assert.equal(r.sourceDefinitions.prefix.hriVisible,false);
 const doc={sourceDefinitions:r.sourceDefinitions,elements:[{id:'barcode',type:'image',barcode_spec:{bcid:'code39ext',hri_visibility:'data-source'},dataSourceRefs:['prefix','qty']},{id:'text',type:'text',dataSourceRefs:['prefix','qty']}]};
 let values=Resolver.evaluateDocument(doc);assert.deepEqual(values.diagnostics,[]);assert.equal(values.objects.barcode.text,'Q900');assert.equal(values.objects.barcode.hriText,'900');assert.equal(values.objects.text.text,'Q900');assert.equal(values.namedValues.Prefix,'Q');
 doc.sourceDefinitions.qty.config.value='256';values=Resolver.evaluateDocument(JSON.parse(JSON.stringify(doc)));assert.equal(values.objects.barcode.text,'Q256');assert.equal(values.objects.barcode.hriText,'256');assert.equal(values.namedValues.Prefix,'Q');
 doc.elements[0].barcode_spec.hri_visibility='full';values=Resolver.evaluateDocument(doc);assert.equal(values.objects.barcode.hriText??values.objects.barcode.text,'Q256','native Full mode includes a source even when its individual HRI flag is false');
 delete doc.elements[0].barcode_spec.hri_visibility;values=Resolver.evaluateDocument(doc);assert.equal(values.objects.barcode.hriText??values.objects.barcode.text,'Q256','omitted native visibility is Full');
});
test('native unverified HRI visibility values remain explicit diagnostics',()=>{
 for(const flag of ['true','yes','0']){const r=convertNativeSources(wrap(`<EmbeddedDataSource ID="s" HrVisible="${flag}"><Value>Q</Value></EmbeddedDataSource>`));assert.equal(r.complete,false,flag);assert.ok(r.diagnostics.some(d=>d.code==='unsupported-native-hri-visibility'));}
});
