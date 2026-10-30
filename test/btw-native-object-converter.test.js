'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {convertNativeObjects}=require('../lib/btw-native-object-converter');
// Fragments from native-object-audit/objects-2.xml and objects-3.xml (2026-10-23).
const picture='<Picture Name="Picture 3" Width="16.5862 mm" Height="16.5862 mm" ConditionalPrintType="Always" Position.X="19.1770 mm" Position.Y="10.7442 mm" ReferencePoint="CenterRight" SourceType="DataSourced" PictureSource="Base64"/>';
const line='<Line Name="Line 7" Width="46.9900 mm" ConditionalPrintType="Always" Position.X="41.9100 mm" Position.Y="51.3080 mm" ReferencePoint="Center" Length="83.8200 mm" StartPoint.X="0.0000 mm" StartPoint.Y="51.3080 mm" EndPoint.X="83.8200 mm" EndPoint.Y="51.3080 mm" Thickness="1.4224 mm" JoinStyle="None"/>';
const wrap=s=>'<Objects>'+s+'</Objects>';
test('keeps native ordering and metadata without counting DataSources as objects',()=>{
 const xml=wrap(line+'<DataSources/>'+picture+line),r=convertNativeObjects(xml);
 assert.deepEqual(r.objects.map(o=>o.nativeType),['Line','Picture','Line']);
 assert.equal(new Set(r.objects.map(o=>o.id)).size,3);
 assert.equal(r.nativeXml,xml);assert.equal(r.objects[0].properties['@Width'],'46.9900 mm');
 assert.equal(r.elements.filter(e=>e.type==='line').length,2);
});
test('line endpoint geometry survives Q LABEL endpoint reconstruction',()=>{
 const r=convertNativeObjects(wrap(line)),e=r.elements[0];
 const ends=require('../gui/line-geometry').endpoints(e);
 assert.ok(Math.abs(ends[0].x)<1e-9);assert.ok(Math.abs(ends[0].y-51.308)<1e-9);
 assert.ok(Math.abs(ends[1].x-83.82)<1e-9);assert.equal(e.thickness_mm,1.4224);
});
test('picture cannot fall back to whole-label pixels or missing assets',()=>{
 const r=convertNativeObjects(wrap(picture));assert.equal(r.elements.length,0);
 assert.ok(r.diagnostics.some(d=>d.code==='NATIVE_PICTURE_ASSET_REQUIRED'));
 const asset={kind:'native-object-picture',color_image_data:'data:image/png;base64,AA=='};
 const supplied=convertNativeObjects(wrap(picture),{pictureAssets:{'Picture 3':asset}});
 assert.equal(supplied.elements[0].type,'image');assert.equal(supplied.elements[0].width_mm,16.5862);
 assert.ok(Math.abs(supplied.elements[0].x_mm-2.5908)<1e-9);
 assert.ok(Math.abs(supplied.elements[0].y_mm-2.4511)<1e-9);
 assert.ok(!supplied.diagnostics.some(d=>d.code==='NATIVE_ANCHOR_UNVERIFIED'));
});
test('unhandled objects and properties are explicit and retain source information',()=>{
 const r=convertNativeObjects(wrap('<RichText Name="Rich Text 1"/><Shape ShapeType="Pie"/><Box Name="Box 1" Width="5 mm" Height="2 mm" Position.X="0 mm" Position.Y="0 mm" FutureFeature="yes"/>'));
 assert.equal(r.complete,false);assert.equal(r.objects.length,3);
 assert.equal(r.diagnostics.filter(d=>d.code==='NATIVE_OBJECT_UNSUPPORTED').length,2);
 assert.ok(r.diagnostics.some(d=>d.path==='@FutureFeature'));
});
test('validates XML and explicit physical units without zero substitution',()=>{
 assert.throws(()=>convertNativeObjects('<Objects><Line></Objects>'),/XML/);
 assert.throws(()=>convertNativeObjects('<!DOCTYPE Objects [<!ENTITY x "xx">]><Objects/>'),/DTD/);
 const r=convertNativeObjects(wrap('<Box Width="5" Height="2 mm" Position.X="bad" Position.Y="0 mm"/>'));
 assert.equal(r.elements.length,0);assert.ok(r.diagnostics.some(d=>d.code==='NATIVE_GEOMETRY_INVALID'));
});
test('uses explicit RGB child rather than Windows BGR parent attribute',()=>{
 const r=convertNativeObjects(wrap('<Ellipse Name="Ellipse 1" Width="144.9070 mm" Height="35.2044 mm" Position.X="3.4290 mm" Position.Y="3.1750 mm" Thickness="1.0668 mm" Mode="Solid" Color="0023249B"><FillStyle Color="00FFFFFF"><Color RGB="00FFFFFF"/></FillStyle><Color RGB="009B2423"/></Ellipse>'));
 assert.equal(r.elements[0].stroke_color,'#9b2423');assert.equal(r.elements[0].fill_color,'#ffffff');
});
test('does not certify omitted native style defaults as complete',()=>{
 const r=convertNativeObjects(wrap('<Box Name="Box 1" Width="5 mm" Height="2 mm" Position.X="0 mm" Position.Y="0 mm" ReferencePoint="TopLeft" ConditionalPrintType="Always"/>'));
 assert.equal(r.complete,false);assert.ok(r.diagnostics.some(d=>d.code==='NATIVE_STYLE_DEFAULT_UNVERIFIED'));
});
test('source adapter input is retained without replacing source behavior by sample text',()=>{
 const xml=wrap('<Text Name="Text 1" Width="46.9900 mm" Position.X="3.0480 mm" Position.Y="4.7498 mm"><Font PointSize="12.000" FontName="Arial" Weight="400"/><DataSources><EmbeddedDataSource ID="native-source"><Value>MFR</Value></EmbeddedDataSource></DataSources></Text>');
 const r=convertNativeObjects(xml,{sourcesByObject:{'Text 1':{text:'MFR',dataSourceRefs:['native-source'],complete:true}}});
 assert.equal(r.elements[0].text,'MFR');assert.deepEqual(r.elements[0].dataSourceRefs,['native-source']);
 assert.equal(r.elements[0].font_size_pt,12);assert.equal(r.elements[0].font_family,'Arial');
 assert.ok(!r.diagnostics.some(d=>d.path.startsWith('DataSources.')));
 assert.equal(r.elements[0].native_object.properties.DataSources.EmbeddedDataSource.Value,'MFR');
});
test('object source conversion carries explicit effective numeric culture evidence without inventing an OS locale',()=>{
 const xml=wrap('<Text Name="Text 1" Width="46.9900 mm" Position.X="3.0480 mm" Position.Y="4.7498 mm"><Font PointSize="12.000" FontName="Arial" Weight="400"/><DataSources><EmbeddedDataSource ID="native-number"><Value>1234.567</Value><NumberDataType CultureID="-3" InputCultureID="8192" DecimalPlaces="0"/></EmbeddedDataSource></DataSources></Text>');
 const missing=convertNativeObjects(xml);assert.ok(missing.diagnostics.some(d=>d.code==='unresolved-native-number-culture'));
 const nativeNumberCultures={'-3':{locale:'en-US',evidence:'number-profiles-results.tsv:1'},'8192':{locale:'en-US',evidence:'number-profiles-results.tsv:3'}},mapped=convertNativeObjects(xml,{nativeNumberCultures});
 assert.equal(mapped.sourceDefinitions['native-number'].dataType.nativeNumber.locale,'en-US');assert.deepEqual(mapped.sourceDefinitions['native-number'].native.numberCultureEvidence.output,nativeNumberCultures['-3']);
 assert.ok(!mapped.diagnostics.some(d=>d.code==='unresolved-native-number-culture'||d.code==='NATIVE_SOURCES_INCOMPLETE'));
});
test('known barcode symbology maps to independently editable barcode spec',()=>{
 const r=convertNativeObjects(wrap('<BarCode-UPC-A Name="Barcode 1" Width="53.7718 mm" Height="11.3538 mm" Position.X="49.9110 mm" Position.Y="37.4142 mm" ReferencePoint="Center"><XDimension Millimeters="0.550"/><HumanReadable Visibility="None"/></BarCode-UPC-A>'),{sourcesByObject:{'Barcode 1':{text:'500346072995',dataSourceRefs:['upc'],complete:true}}});
 assert.equal(r.elements[0].barcode_spec.bcid,'upca');assert.equal(r.elements[0].barcode_spec.x_mm,.55);
 assert.equal(r.elements[0].barcode_spec.text,'500346072995');assert.equal(r.elements[0].barcode_spec.show_text,false);
 assert.equal(r.complete,false);
});
test('native barcode caption visibility keeps Full distinct from per-source filtering',()=>{
 for(const[attribute,want]of [[' Visibility="DataSource"','data-source'],[' Visibility="Full"','full'],[' Visibility="None"','none'],['','full']]){
  const r=convertNativeObjects(wrap(`<BarCode-Code39-FullAscii Name="Barcode 2" Width="31.8770 mm" Height="12.7000 mm" Position.X="6.6548 mm" Position.Y="49.0728 mm"><HumanReadable${attribute}/></BarCode-Code39-FullAscii>`));
  assert.equal(r.elements[0].barcode_spec.hri_visibility,want);if(want==='none')assert.equal(r.elements[0].barcode_spec.show_text,false);
 }
});

// Controlled native SetXML/GetXML and PNG exports, geometry-followup/*anchors.txt.
// Native quantizes 10x6 mm at (40,30) to these actual exported measurements.
test('verified unrotated native shape and picture reference points map to top-left bounds',()=>{
 const anchors={TopLeft:[0,0],TopCenter:[.5,0],TopRight:[1,0],CenterLeft:[0,.5],Center:[.5,.5],CenterRight:[1,.5],BottomLeft:[0,1],BottomCenter:[.5,1],BottomRight:[1,1]};
 for(const type of ['Box','Ellipse','Picture'])for(const [anchor,[fx,fy]]of Object.entries(anchors)){
  const r=convertNativeObjects(wrap(`<${type} Name="GeometryProbe" Width="9.9822 mm" Height="5.9944 mm" Position.X="39.9796 mm" Position.Y="29.9974 mm" ReferencePoint="${anchor}"/>`),{pictureAssets:{GeometryProbe:{kind:'native-object-picture',color_image_data:'data:image/png;base64,AA=='}}});
  const e=r.elements[0];assert.ok(Math.abs(e.x_mm-(39.9796-9.9822*fx))<1e-9,`${type}/${anchor} x`);assert.ok(Math.abs(e.y_mm-(29.9974-5.9944*fy))<1e-9,`${type}/${anchor} y`);
  assert.equal(e.rotation_deg,0);assert.ok(!r.diagnostics.some(d=>d.code.startsWith('NATIVE_ANCHOR_')));
  assert.equal(e.native_object.properties['@ReferencePoint'],anchor);
 }
});
test('native omitted shape anchor means TopLeft but rotation and unknown references remain blocked',()=>{
 const base='<Box Width="9.9822 mm" Height="5.9944 mm" Position.X="39.9796 mm" Position.Y="29.9974 mm"';
 const omitted=convertNativeObjects(wrap(base+'/>'));
 assert.equal(omitted.elements[0].x_mm,39.9796);assert.equal(omitted.elements[0].y_mm,29.9974);
 assert.ok(!omitted.diagnostics.some(d=>d.code.startsWith('NATIVE_ANCHOR_')));
 for(const attrs of [' ReferencePoint="Unknown"',' ReferencePoint="__proto__"',' ReferencePoint="Center" Rotation.Angle="90.000°"']){
  const r=convertNativeObjects(wrap(base+attrs+'/>'));assert.equal(r.complete,false);assert.ok(r.diagnostics.some(d=>d.code==='NATIVE_ANCHOR_UNVERIFIED'));
  assert.equal(r.elements[0].x_mm,39.9796);
 }
});
test('text bounds stay explicitly unverified when native single-line getters return zero',()=>{
 // A4A Label Text 1: native getters Width=0 Height=0, XML Width is 46.9900mm.
 const r=convertNativeObjects(wrap('<Text Name="Text 1" Width="46.9900 mm" Position.X="3.0480 mm" Position.Y="4.7498 mm"><Font PointSize="12.000" FontName="Arial" Weight="400"/></Text>'));
 assert.ok(r.diagnostics.some(d=>d.code==='NATIVE_TEXT_BOUNDS_UNVERIFIED'));
 assert.equal(r.complete,false);assert.equal(r.elements[0].height_mm,undefined);
});

test('native boolean attributes survive conversion without malformed XML',()=>{
 const r=convertNativeObjects(wrap('<RichText Name="Rich Text 1" Enabled="true" Hidden="false"/>'));
 assert.equal(r.objects[0].properties['@Enabled'],'true');assert.equal(r.objects[0].properties['@Hidden'],'false');
 assert.equal(require('fast-xml-parser').XMLValidator.validate(r.objects[0].xml),true);
});

test('connects original embedded sources to object refs without snapshot text',()=>{
 const xml=wrap('<Text Name="Text 1" Width="20 mm" Height="5 mm" Position.X="0 mm" Position.Y="0 mm" ConditionalPrintType="Always"><Font FontName="Arial" PointSize="12"/><DataSources><EmbeddedDataSource ID="source-a"><Value>00123</Value></EmbeddedDataSource></DataSources></Text>');
 const r=convertNativeObjects(xml);assert.equal(r.sourceDefinitions['source-a'].config.value,'00123');assert.deepEqual(r.elements[0].dataSourceRefs,['source-a']);assert.equal(r.elements[0].text,undefined);assert.ok(!r.diagnostics.some(d=>d.code==='NATIVE_SOURCES_REQUIRED'));
 const broken=convertNativeObjects(xml.replace('EmbeddedDataSource','UnknownDataSource').replace('</EmbeddedDataSource>','</UnknownDataSource>'));
 assert.ok(broken.diagnostics.some(d=>d.code==='NATIVE_SOURCES_INCOMPLETE'));assert.equal(broken.complete,false);
});

test('preserves explicit native font style and width scaling for editable text',()=>{
 const r=convertNativeObjects(wrap('<Text Name="Text 1" Width="10 mm" Position.X="0 mm" Position.Y="0 mm"><Font FontName="Arial" PointSize="12" Weight="700" Scale="80" Style.Italic="true" Style.Underline="true" Style.WhiteOnBlack="true"/></Text>'));
 const e=r.elements[0];assert.equal(e.italic,true);assert.equal(e.underline,true);assert.equal(e.text_inverse,true);assert.equal(e.text_width_percent,80);assert.equal(e.bold,true);
});
test('maps native declared barcode families while retaining option completeness diagnostics',()=>{
 const names={'GS1-128':'gs1-128','GS1-QR-Code':'gs1qrcode','GS1-DataMatrix':'gs1datamatrix','Plessey':'plessey','ITF-14':'itf14','Datalogic-2-of-5':'datalogic2of5','Interleaved-2-of-5':'interleaved2of5','BC412':'bc412','Zip':'postnet','Australia-Post':'auspost','Micro-PDF417':'micropdf417','MaxiCode':'maxicode'};
 for(const [native,bcid]of Object.entries(names)){
  const r=convertNativeObjects(wrap(`<BarCode-${native} Name="Barcode 1" Width="10 mm" Height="10 mm" Position.X="0 mm" Position.Y="0 mm"/>`));
  assert.equal(r.elements[0]?.barcode_spec?.bcid,bcid,native);assert.equal(r.complete,false);
 }
});
test('uses verified post-render text metrics instead of stale XML Width',()=>{
 const metrics={kind:'native-text-metrics',font_name:'Arial',font_size_pt:12,width_mm:23.5458,height_mm:4.7498,line_height_mm:4.7498,em_height:2048,cell_ascent:1854,font_sha256:'b3658eadae55e682b5f69eb64c439c1ecc8f196c0bb8d4756d145d13bc86476a',evidence:['text-barcode-followup/isolated-results.txt']};
 const r=convertNativeObjects(wrap('<Text Name="Text 1" Width="46.9900 mm" Position.X="3.0480 mm" Position.Y="4.7498 mm"><Font FontName="Arial" PointSize="12" Weight="400"/></Text>'),{nativeTextMetrics:{'Text 1':metrics}});
 assert.equal(r.elements[0].width_mm,23.5458);assert.equal(r.elements[0].height_mm,4.7498);
 assert.equal(r.elements[0].native_text_layout.ascent_em,1854/2048);
 assert.equal(r.elements[0].native_text_layout.reference_point,'TopLeft');
 assert.ok(!r.diagnostics.some(d=>d.code==='NATIVE_TEXT_BOUNDS_UNVERIFIED'));
 const wrong=convertNativeObjects(r.nativeXml,{nativeTextMetrics:{'Text 1':{...metrics,font_name:'Missing Font'}}});assert.ok(wrong.diagnostics.some(d=>d.code==='NATIVE_TEXT_METRICS_MISMATCH'));
});
test('XML indentation is not reported as an unmapped native property',()=>{
 const r=convertNativeObjects('<Objects>\n<Box Name="B" Width="5 mm" Height="2 mm" Position.X="0 mm" Position.Y="0 mm">\n <FillStyle Mode="None"/>\n</Box>\n</Objects>');
 assert.ok(!r.diagnostics.some(d=>d.path.endsWith('#text')));
});
test('dynamic native picture keeps original source identity and uses live Base64 artwork',()=>{
 const definitions={logo:{id:'logo',kind:'embedded',dataType:{kind:'text'},config:{value:'iVBORw0KGgo='},transforms:[]}};
 const r=convertNativeObjects(wrap(picture),{sourceDefinitions:definitions,sourcesByObject:{'Picture 3':{dataSourceRefs:['logo'],complete:true}},pictureAssets:{'Picture 3':{kind:'native-object-picture',color_image_data:'data:image/png;base64,AA=='}}});
 assert.deepEqual(r.elements[0].source_picture,{encoding:'base64'});assert.deepEqual(r.elements[0].dataSourceRefs,['logo']);assert.equal(r.sourceDefinitions.logo.config.value,'iVBORw0KGgo=');
 assert.ok(!r.diagnostics.some(d=>['@SourceType','@PictureSource'].includes(d.path)));
 assert.notEqual(r.sourceDefinitions,definitions);
});
test('maps observed Accessory native paragraph auto-fit and font metadata explicitly',()=>{
 const m={kind:'native-text-metrics',font_name:'Arial',font_size_pt:12,width_mm:76.2,height_mm:8.9662,line_height_mm:4.7498,em_height:2048,cell_ascent:1854,font_sha256:'b3658eadae55e682b5f69eb64c439c1ecc8f196c0bb8d4756d145d13bc86476a',evidence:['autofit-results.txt']};
 const xml=wrap('<Text Name="Text 1" Style="Paragraph" Width="46.99 mm" Position.X="49.911 mm" Position.Y="21.0312 mm" ReferencePoint="TopCenter" ConditionalPrintType="Always"><Paragraph Alignment="Centered" ParagraphWidth="76.2 mm" ParagraphHeight="4.826 mm" ParagraphHeightMode="FitToText"/><Tabs/><Font FontName="Arial" PointSize="12" Height="-240" Weight="400" CharacterSet="16909056"><Underline/><Strikethrough/><Foreground Mode="Solid" Color="00000000"><Color RGB="00000000"/></Foreground></Font><AutoFit Enabled="true" FitWidth="76.2 mm" FitHeight="8.9662 mm" AlignVertical="2" AlignHorizontal="1" Adjustments="3" MaxPointSizeAdjustment="100.00" AdjustScaleFactor="true"/></Text>');
 const r=convertNativeObjects(xml,{nativeTextMetrics:{'Text 1':m},sourcesByObject:{'Text 1':{dataSourceRefs:['product'],complete:true}},sourceDefinitions:{product:{id:'product',kind:'embedded',config:{value:'Product Name'}}}});
 assert.equal(r.complete,true,JSON.stringify(r.diagnostics));const e=r.elements[0];assert.equal(e.text_auto_fit,true);assert.equal(e.text_wrap,true);assert.equal(e.vertical_align,'bottom');assert.equal(e.text_box_height_mm,8.9662);assert.equal(e.text_align,'center');assert.equal(e.underline,false);assert.equal(e.strike,false);
});
test('native barcode HRI keeps exact font asset and inactive HRI source definitions',()=>{
 const fontBytes=require('node:fs').readFileSync(require('node:path').join(require('node:path').dirname(require('node:path').dirname(require.resolve('bwip-js'))),'fonts/Inconsolata.otf'));
 const font={font_name:'Inconsolata',font_sha256:require('node:crypto').createHash('sha256').update(fontBytes).digest('hex'),font_data_base64:fontBytes.toString('base64')};
 const xml=wrap('<BarCode-UPC-A Name="Barcode 1" Width="45.72 mm" Height="11.3538 mm" Position.X="49.911 mm" Position.Y="37.4142 mm" ReferencePoint="Center"><HumanReadable Alignment="Bar"><BarCodeTextData><Font FontName="Inconsolata" PointSize="8" Weight="400" Height="-160" CharacterSet="16909056"><Underline/><Strikethrough/><Foreground Mode="Solid" Color="00000000"><Color RGB="00000000"/></Foreground></Font><Tabs/><AutoFit/></BarCodeTextData><Transforms><EmbeddedDataSource ID="hri-inactive"><Value>Sample Text</Value></EmbeddedDataSource></Transforms></HumanReadable></BarCode-UPC-A>');
 const r=convertNativeObjects(xml,{nativeFonts:{Inconsolata:font}}),e=r.elements[0];assert.equal(e.barcode_spec.native_hri.font_sha256,font.font_sha256);assert.equal(e.barcode_spec.native_hri.font_size_pt,8);assert.equal(e.hriSourceRefs,undefined);assert.equal(e.native_barcode_layout.hri_source_mode,'encoded');assert.deepEqual(e.native_barcode_layout.inactive_hri_source_refs,['hri-inactive']);assert.equal(r.sourceDefinitions['hri-inactive'].config.value,'Sample Text');
});
test('native UniGDI UPC target width uses observed quantizer and bars reference bounds',()=>{
 const r=convertNativeObjects(wrap('<BarCode-UPC-A Name="Barcode 1" Width="53.7718 mm" Height="11.3538 mm" Position.X="49.911 mm" Position.Y="37.4142 mm" ReferencePoint="Center" ConditionalPrintType="Always" UseAutoSizeBarCodeWidth="true" AutoSizeMinimumXDimension="5.000" AutoSizeMaximumXDimension="500.000" AutoSizeTargetBarCodeWidth="48.2600 mm" ThermalOutput="UniGDI" GS1TemplateType="None" Color="00000000"><XDimension Index="5" Mils="21.670" Millimeters="0.550" Density="5.669"/><HumanReadable Visibility="None"/><Color RGB="00000000"/></BarCode-UPC-A>'),{sourcesByObject:{'Barcode 1':{dataSourceRefs:['upc'],complete:true}},sourceDefinitions:{upc:{id:'upc',kind:'embedded',config:{value:'500346072995'}}}});
 const e=r.elements[0];assert.equal(e.barcode_spec.native_upca.profile,'UniGDI-12.1');assert.ok(Math.abs(e.width_mm-45.72)<1e-9);assert.ok(Math.abs(e.x_mm-(49.911-45.72/2))<1e-9);assert.equal(e.y_mm,37.4142-11.3538/2);assert.equal(r.complete,true,JSON.stringify(r.diagnostics));
});

test('native UPC HRI keeps a verified original font and separate digit layout without a centered text substitute',()=>{
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
 const font=fs.readFileSync(path.join(path.dirname(path.dirname(require.resolve('bwip-js'))),'fonts/Inconsolata.otf'));
 const sha=crypto.createHash('sha256').update(font).digest('hex');
 const xml=wrap('<BarCode-UPC-A Name="Barcode 1" Width="45.7200 mm" Height="11.3538 mm" Position.X="49.9110 mm" Position.Y="37.4142 mm" ReferencePoint="Center" ConditionalPrintType="Always"><HumanReadable Alignment="Bar"><BarCodeTextData><Font FontName="Inconsolata" PointSize="8.000" Height="-160" Weight="400" CharacterSet="16909056"><Underline/><Strikethrough/><Foreground Mode="Solid" Color="00000000"><Color RGB="00000000"/></Foreground></Font><Tabs/><AutoFit/></BarCodeTextData></HumanReadable></BarCode-UPC-A>');
 const options={nativeHriFonts:{'Barcode 1':{kind:'native-hri-font',font_name:'Inconsolata',font_size_pt:8,font_sha256:sha,font_data_base64:font.toString('base64'),evidence:['native-HRI-font-fixture']}}};
 const r=convertNativeObjects(xml,options),e=r.elements[0];assert.equal(e.barcode_spec.native_hri.font_sha256,sha);assert.equal(e.barcode_spec.native_hri.font_name,'Inconsolata');assert.equal(e.font_family,undefined,'native segmented HRI must not become a generic centered caption');
 assert.ok(!r.diagnostics.some(d=>d.code==='NATIVE_PROPERTY_UNMAPPED'&&d.path.startsWith('HumanReadable.BarCodeTextData')));
 assert.equal(r.complete,false,'font support alone cannot certify remaining native encoding/geometry');
 const bad=structuredClone(options);bad.nativeHriFonts['Barcode 1'].font_name='Wrong font';const failed=convertNativeObjects(xml,bad);assert.equal(failed.elements[0].barcode_spec.native_hri,undefined);assert.ok(failed.diagnostics.some(d=>d.code==='NATIVE_HRI_FONT_MISMATCH'));
 bad.nativeHriFonts['Barcode 1'].font_name='Inconsolata';bad.nativeHriFonts['Barcode 1'].font_sha256='0'.repeat(64);assert.ok(convertNativeObjects(xml,bad).diagnostics.some(d=>d.code==='NATIVE_HRI_FONT_MISMATCH'));
});

test('A4A native object export converts all four editable objects with matched text and DataMatrix evidence',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const fixture=path.join(__dirname,'fixtures/native-a4a');
 const exported=require('../lib/btw-object-package').readNativeObjectExport(fs.readFileSync(path.join(fixture,'objects.xml'),'utf8'));
 const nativeMatrix=JSON.parse(fs.readFileSync(path.join(fixture,'datamatrix.json'),'utf8'));
 const metrics={kind:'native-text-metrics',font_name:'Arial',font_size_pt:12,width_mm:23.5458,height_mm:4.7498,line_height_mm:4.7498,em_height:2048,cell_ascent:1854,font_sha256:'b3658eadae55e682b5f69eb64c439c1ecc8f196c0bb8d4756d145d13bc86476a',evidence:['D:/QLabelNativeLibraryAudit-20261023/text-barcode-followup/native-text-emf-results.txt']};
 const xml='<Objects>'+exported.objects.map(object=>object.xml).join('')+'</Objects>';
 const r=convertNativeObjects(xml,{sourceSha256:nativeMatrix.source_sha256,nativeTextMetrics:{'Text 1':metrics,'Text 2':{...metrics,width_mm:28.321},'Text 3':{...metrics,width_mm:7.2898}},nativeDataMatrixLayouts:{'Barcode 1':nativeMatrix}});
 assert.deepEqual(r.elements.map(e=>e.native_object.name),['Text 1','Text 2','Barcode 1','Text 3']);
 const barcode=r.elements[2];assert.equal(barcode.barcode_spec.bcid,'datamatrix');assert.equal(barcode.width_mm,nativeMatrix.width_mm);assert.equal(barcode.height_mm,nativeMatrix.height_mm);
 assert.deepEqual(barcode.dataSourceRefs,['{7C584D3B-0408-41AE-8D78-398DD1B3799F}','{3A289CBD-0C8C-4854-A3E3-F31C5FECBA28}','{D18EC51C-EEFD-4A7F-BA4C-712EDD83442A}','{5DC90542-4AEC-4E52-B24A-7F3A812F573D}','{00283D55-62B6-4941-BEF1-BA6BE3DBB203}','{77902523-3D90-4BB6-8A28-9C3C6AF6ABF8}','{E9C64ABC-650B-42B3-BF59-309D4062A67D}','{2B0BB4DD-8476-4752-9130-6A58ED0BF852}']);
 assert.deepEqual(barcode.native_barcode_layout.inactive_hri_source_refs,['{C57B5F90-1ECF-4246-81FB-EB5086A9D1CC}']);
 assert.equal(r.sourceDefinitions['{5DC90542-4AEC-4E52-B24A-7F3A812F573D}'].name,'CAGE');assert.equal(r.sourceDefinitions['{E9C64ABC-650B-42B3-BF59-309D4062A67D}'].name,'SER');
 assert.ok(!r.diagnostics.some(d=>d.objectName==='Barcode 1'&&['NATIVE_GEOMETRY_INVALID','NATIVE_BARCODE_OPTIONS_UNVERIFIED','NATIVE_PROPERTY_UNMAPPED'].includes(d.code)));
 assert.equal(r.complete,true,JSON.stringify(r.diagnostics));assert.ok(!r.diagnostics.some(d=>d.code==='NATIVE_ANCHOR_DEFAULT_UNVERIFIED'));
});
