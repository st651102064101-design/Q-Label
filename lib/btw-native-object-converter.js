'use strict';

const {XMLParser,XMLBuilder,XMLValidator}=require('fast-xml-parser');
const LineGeometry=require('../gui/line-geometry');
const {convertNativeSources}=require('./btw-native-source-converter');
const {createHash}=require('node:crypto');
const PARSER={ignoreAttributes:false,attributeNamePrefix:'@',parseTagValue:false,parseAttributeValue:false,trimValues:false};
const BARCODES={'DataMatrix':'datamatrix','UPC-A':'upca','UPC-E':'upce','EAN-13':'ean13','EAN-8':'ean8','Code-128':'code128','Code39-Regular':'code39','Code39-FullAscii':'code39ext','Code93':'code93','QR-Code':'qrcode','PDF417':'pdf417','Aztec':'azteccode','ITF':'interleaved2of5',
 'GS1-128':'gs1-128','GS1-QR-Code':'gs1qrcode','GS1-DataMatrix':'gs1datamatrix','Plessey':'plessey','ITF-14':'itf14','Datalogic-2-of-5':'datalogic2of5','Interleaved-2-of-5':'interleaved2of5','BC412':'bc412','Zip':'postnet','Australia-Post':'auspost','Micro-PDF417':'micropdf417','MaxiCode':'maxicode'};
// Own native Box/Ellipse/Picture SetXML + PNG displacement probes, 2026-10-23.
// This map is only established for omitted rotation and explicit object bounds.
const UNROTATED_ANCHORS={TopLeft:[0,0],TopCenter:[.5,0],TopRight:[1,0],CenterLeft:[0,.5],Center:[.5,.5],CenterRight:[1,.5],BottomLeft:[0,1],BottomCenter:[.5,1],BottomRight:[1,1]};

function millimeters(value){
 const m=typeof value==='string'&&/^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+mm\s*$/.exec(value);
 return m&&Number.isFinite(Number(m[1]))?Number(m[1]):null;
}
function rgb(value){return typeof value==='string'&&/^00[0-9a-f]{6}$/i.test(value)?'#'+value.slice(2).toLowerCase():null;}
function oleRgb(value){return typeof value==='string'&&/^00[0-9a-f]{6}$/i.test(value)?'#'+value.slice(6,8).toLowerCase()+value.slice(4,6).toLowerCase()+value.slice(2,4).toLowerCase():null;}

/** Pure, deliberately conservative adapter. Elements are candidates; callers must
 * gate import on complete. Only runtime-proven omission/defaults and anchor
 * semantics are mapped; remaining behavior stays blocking diagnostics. */
function convertNativeObjects(xml,options={}){
 if(typeof xml!=='string'||xml.length>64*1024*1024)throw Error('Native XML must be a bounded string');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Native XML DTD/entity declarations are unsupported');
 const valid=XMLValidator.validate(xml);if(valid!==true)throw Error('Invalid native XML: '+valid.err.msg);
 if(options.units!=null&&options.units!=='mm')throw Error('Native export units must be mm');
 const ordered=new XMLParser({...PARSER,preserveOrder:true}).parse(xml);
 const root=ordered.find(n=>Object.hasOwn(n,'Objects'));
 if(!root)throw Error('Native XML Objects root required');
 const result={nativeXml:xml,units:'mm',objects:[],elements:[],sourceDefinitions:structuredClone(options.sourceDefinitions||{}),diagnostics:[],complete:false};
 const builder=new XMLBuilder({...PARSER,preserveOrder:true});
 const parser=new XMLParser(PARSER);
 let index=0;
 for(const entry of root.Objects){
  const type=Object.keys(entry).find(k=>k!==':@'&&k!=='#text'&&!k.startsWith('?')&&!k.startsWith('#'));
  if(!type)continue;
  if(type==='DataSources'){
   result.diagnostics.push({severity:'error',code:'NATIVE_DOCUMENT_SOURCES_UNMAPPED',path:'Objects/DataSources',message:'Document source container retained in nativeXml; requires document source adapter.'});continue;
  }
  const objectXml=builder.build([entry]),p=parser.parse(objectXml)[type]||{};
  const name=p['@Name']||'',id=p['@ID']||`btw-object-${index++}`;
  const record={id,nativeType:type,name,properties:p,xml:objectXml,elementId:null};result.objects.push(record);
  const consumed=new Set();
  const attr=key=>{consumed.add('@'+key);return p['@'+key];};
  const diag=(code,path,message)=>result.diagnostics.push({severity:'error',code,objectId:id,objectName:name,nativeType:type,path,message});
  attr('Name');attr('ID');
  const e={id,label:name,source_format:'btw-native-object',native_object:{id,type,name,properties:p,xml:objectXml}};
  let supported=true,geometry=true;
  const measure=(native,key,required=true)=>{const value=attr(native),n=millimeters(value);if(n===null){if(required||value!=null){geometry=false;diag('NATIVE_GEOMETRY_INVALID','@'+native,'Explicit finite millimeter measurement required.');}}else e[key]=n;return n;};
  if(type==='Line'){
   const ax=measure('StartPoint.X','_ax'),ay=measure('StartPoint.Y','_ay'),bx=measure('EndPoint.X','_bx'),by=measure('EndPoint.Y','_by');
   const thickness=measure('Thickness','thickness_mm',false);e.type='line';
   if(thickness===null)diag('NATIVE_STYLE_DEFAULT_UNVERIFIED','@Thickness','Native omitted line thickness; renderer default is unverified.');
   if(geometry&&thickness!==null)Object.assign(e,LineGeometry.fromEndpoints({x:ax,y:ay},{x:bx,y:by},thickness));
   else if(geometry){Object.assign(e,{x_mm:ax,y_mm:ay,width_mm:bx-ax,height_mm:by-ay,rotation_deg:0});}
   for(const k of ['_ax','_ay','_bx','_by'])delete e[k];
  }else{
   const matrixProfiles=options.nativeDataMatrixLayouts,rawMatrix=type==='BarCode-DataMatrix'?(matrixProfiles instanceof Map?matrixProfiles.get(name):matrixProfiles?.[name]):null;
   const nativeMatrix=rawMatrix?.profile==='native-datamatrix-layout-v1'&&rawMatrix.reference_point==='TopLeft'&&/^[a-f0-9]{64}$/i.test(rawMatrix.source_sha256||'')&&rawMatrix.source_sha256.toLowerCase()===(options.sourceSha256||'').toLowerCase()&&rawMatrix.rows===rawMatrix.columns&&Number.isInteger(rawMatrix.columns)&&typeof rawMatrix.text==='string'&&Number.isFinite(rawMatrix.width_mm)&&rawMatrix.width_mm>0&&Number.isFinite(rawMatrix.height_mm)&&rawMatrix.height_mm>0&&Array.isArray(rawMatrix.evidence)&&rawMatrix.evidence.some(item=>typeof item==='string'&&item.includes('native canvas/status-bar runtime observation'))?rawMatrix:null;
   const w=measure('Width','width_mm',type!=='BarCode-DataMatrix'||!nativeMatrix),h=measure('Height','height_mm',type!=='Text');
   const x=measure('Position.X','x_mm'),y=measure('Position.Y','y_mm');
   if(nativeMatrix){e.width_mm=nativeMatrix.width_mm;e.height_mm=nativeMatrix.height_mm;}
   if((w!==null&&w<0)||(h!==null&&h<0)){geometry=false;diag('NATIVE_GEOMETRY_INVALID','@Width/@Height','Negative object dimensions are unsupported.');}
   const reference=attr('ReferencePoint');
   const anchorType=type==='Box'||type==='Ellipse'||type==='Picture'||type==='BarCode-DataMatrix'&&!!nativeMatrix;
   const anchor=Object.hasOwn(UNROTATED_ANCHORS,reference||'TopLeft')?UNROTATED_ANCHORS[reference||'TopLeft']:null;
   const unrotated=p['@Rotation.Angle']==null&&p['@Rotation']==null;
   if(anchorType&&anchor&&unrotated&&geometry){
    e.x_mm=x-w*anchor[0];e.y_mm=y-h*anchor[1];e.rotation_deg=0;
   }else if(reference&&reference!=='TopLeft')diag('NATIVE_ANCHOR_UNVERIFIED','@ReferencePoint','Native reference point '+reference+' requires verified object bounds and rotation transformation.');
   else if(!reference)diag('NATIVE_ANCHOR_DEFAULT_UNVERIFIED','@ReferencePoint','Native omitted reference point; its default is unverified.');
   if(x===null||y===null)geometry=false;
   if(type==='Text'){
    const textMetrics=options.nativeTextMetrics instanceof Map?options.nativeTextMetrics.get(name):options.nativeTextMetrics?.[name];
    const metricsValid=textMetrics?.kind==='native-text-metrics'&&textMetrics.font_name===p.Font?.['@FontName']&&textMetrics.font_size_pt===Number(p.Font?.['@PointSize'])&&[textMetrics.width_mm,textMetrics.height_mm,textMetrics.line_height_mm,textMetrics.em_height,textMetrics.cell_ascent].every(v=>Number.isFinite(v)&&v>0)&&/^[0-9a-f]{64}$/i.test(textMetrics.font_sha256||'')&&textMetrics.evidence?.length>0&&anchor&&unrotated;
    if(!metricsValid)diag(textMetrics?'NATIVE_TEXT_METRICS_MISMATCH':'NATIVE_TEXT_BOUNDS_UNVERIFIED','@Width/@Height','Post-render bounds and exact font identity must match the original object; cached XML Width/ParagraphHeight are insufficient.');
    e.type='text';const f=p.Font;
    if(f&&typeof f==='object'){
     e.font_family=f['@FontName'];e.font_size_pt=Number(f['@PointSize']);
     consumed.add('Font.@FontName');consumed.add('Font.@PointSize');
     if(!e.font_family||!(e.font_size_pt>0)){diag('NATIVE_FONT_INVALID','Font','Original font family and positive point size required.');}
     if(f['@Weight']==='700'||f['@Weight']==='400'){e.bold=f['@Weight']==='700';consumed.add('Font.@Weight');}
     for(const [native,key]of Object.entries({'Style.Italic':'italic','Style.Underline':'underline','Style.Strikethrough':'strike','Style.WhiteOnBlack':'text_inverse'})){
      if(f['@'+native]==='true'||f['@'+native]==='false'){e[key]=f['@'+native]==='true';consumed.add('Font.@'+native);}
     }
     const scale=Number(f['@Scale']);if(scale>=10&&scale<=500){e.text_width_percent=scale;consumed.add('Font.@Scale');}
     const color=rgb(f.Foreground?.Color?.['@RGB']);if(color){e.text_color=color;consumed.add('Font.Foreground.Color.@RGB');}
     if(!metricsValid)diag('NATIVE_TEXT_METRICS_UNVERIFIED','Font','Original text bounds, baseline, font availability and shaping require verification.');
    }else diag('NATIVE_FONT_REQUIRED','Font','Original text font is unavailable.');
    const paragraph=p.Paragraph;if(paragraph&&typeof paragraph==='object'){
     const width=millimeters(paragraph['@ParagraphWidth']);if(width!==null){e.width_mm=width;consumed.add('Paragraph.@ParagraphWidth');}
     const height=millimeters(paragraph['@ParagraphHeight']);if(height!==null){e.height_mm=height;consumed.add('Paragraph.@ParagraphHeight');}
     const align={Left:'left',Centered:'center',Right:'right'}[paragraph['@Alignment']];if(align){e.text_align=align;consumed.add('Paragraph.@Alignment');}
    }
    if(metricsValid){
     e.width_mm=textMetrics.width_mm;e.height_mm=textMetrics.height_mm;
     e.native_text_layout={reference_point:reference||'TopLeft',ascent_em:textMetrics.cell_ascent/textMetrics.em_height,line_height_em:textMetrics.line_height_mm/(e.font_size_pt*25.4/72),font_sha256:textMetrics.font_sha256,evidence:[...textMetrics.evidence]};
     if(p.Paragraph){e.text_wrap=true;e.text_box_width_mm=textMetrics.width_mm;}
     if(p['@Style']==='Paragraph'){e.text_wrap=true;consumed.add('@Style');}
     if(p.Paragraph?.['@ParagraphHeightMode']==='FitToText')consumed.add('Paragraph.@ParagraphHeightMode');
     if(p.Tabs==='')consumed.add('Tabs');
     const f=p.Font;
     if(f.Underline===''){if(e.underline==null)e.underline=false;consumed.add('Font.Underline');}
     if(f.Strikethrough===''){if(e.strike==null)e.strike=false;consumed.add('Font.Strikethrough');}
     if(Number(f['@Height'])===-20*e.font_size_pt)consumed.add('Font.@Height');
     if(f['@CharacterSet']==='16909056'){e.native_text_layout.character_set=f['@CharacterSet'];consumed.add('Font.@CharacterSet');}
     if(f.Foreground?.['@Mode']==='Solid')consumed.add('Font.Foreground.@Mode');
     if(oleRgb(f.Foreground?.['@Color'])===e.text_color)consumed.add('Font.Foreground.@Color');
     const fit=p.AutoFit;if(fit&&fit['@Enabled']==='true'){
      e.text_auto_fit=true;e.text_box_width_mm=millimeters(fit['@FitWidth'])||textMetrics.width_mm;e.text_box_height_mm=millimeters(fit['@FitHeight'])||textMetrics.height_mm;
      if(fit['@AlignVertical']==='2')e.vertical_align='bottom';else if(fit['@AlignVertical']==='1')e.vertical_align='middle';else if(fit['@AlignVertical']==='0')e.vertical_align='top';
      for(const k of ['Enabled','FitWidth','FitHeight'])consumed.add('AutoFit.@'+k);
      if(['0','1','2'].includes(fit['@AlignVertical']))consumed.add('AutoFit.@AlignVertical');
      if(['0','1','2'].includes(fit['@AlignHorizontal'])){e.text_align={0:'left',1:'center',2:'right'}[fit['@AlignHorizontal']];consumed.add('AutoFit.@AlignHorizontal');}
      // Accessory native probes: short strings retain original size; word-wrapped
      // multi-line and unbreakable long strings shrink to the measured box.
      if(fit['@Adjustments']==='3'&&Number(fit['@MaxPointSizeAdjustment'])===100&&fit['@AdjustScaleFactor']==='true'){
       e.native_text_layout.auto_fit={adjustments:3,max_point_size_percent:100,adjust_scale_factor:true};
       for(const k of ['Adjustments','MaxPointSizeAdjustment','AdjustScaleFactor'])consumed.add('AutoFit.@'+k);
      }
     }
     else if(fit==='')consumed.add('AutoFit');
     result.diagnostics=result.diagnostics.filter(d=>d.objectId!==id||!d.code.startsWith('NATIVE_ANCHOR_'));
    }
   }else if(type==='Box'||type==='Ellipse')e.type=type==='Box'?'box':'ellipse';
   else if(type==='Picture'){
    const assets=options.pictureAssets,asset=assets instanceof Map?assets.get(name):assets?.[name];
    if(!asset||asset.kind!=='native-object-picture'||!asset.color_image_data){supported=false;diag('NATIVE_PICTURE_ASSET_REQUIRED','Picture','An individually exported original picture asset is required.');}
    else {e.type='image';for(const k of ['color_image_data','bitmap_width','bitmap_height','bitmap_hex','transparent_background'])if(asset[k]!=null)e[k]=asset[k];}
   }else if(type.startsWith('BarCode-')&&BARCODES[type.slice(8)]){
    e.type='image';e.barcode_spec={bcid:BARCODES[type.slice(8)]};
    if(nativeMatrix){
     e.barcode_spec.native_datamatrix=structuredClone(nativeMatrix);e.barcode_spec.auto_fit_width=false;
     for(const key of ['UseAutoSizeBarCodeWidth','AutoSizeMinimumXDimension','AutoSizeMaximumXDimension','AutoSizeTargetBarCodeWidth','ThermalOutput','EncodingCodePage'])consumed.add('@'+key);
     for(const key of ['Index','Mils'])if(p.XDimension?.['@'+key]!=null)consumed.add('XDimension.@'+key);
     if(p.XDimension?.['@Millimeters']===String(nativeMatrix.x_dimension_mm))consumed.add('XDimension.@Millimeters');
     const dormantHri=p.HumanReadable?.['@Visibility']==='None'&&p.HumanReadable?.['@Placement']==='Top';
     if(dormantHri){
      for(const key of ['Placement','Visibility'])consumed.add('HumanReadable.@'+key);
      const textData=p.HumanReadable.BarCodeTextData;
      if(textData){
       for(const key of ['ReadingOrder','ParagraphWidthMinimumSizeToBarCodeMode'])if(textData['@'+key]!=null)consumed.add('HumanReadable.BarCodeTextData.@'+key);
       for(const key of ['Tabs','AutoFit'])if(textData[key]==='')consumed.add('HumanReadable.BarCodeTextData.'+key);
       const font=textData.Font;
       if(font&&typeof font==='object'){
        for(const key of ['FontName','PointSize','Height','Weight','CharacterSet'])if(font['@'+key]!=null)consumed.add('HumanReadable.BarCodeTextData.Font.@'+key);
        for(const key of ['Underline','Strikethrough'])if(font[key]==='')consumed.add('HumanReadable.BarCodeTextData.Font.'+key);
        if(font.Foreground?.['@Mode']==='Solid')consumed.add('HumanReadable.BarCodeTextData.Font.Foreground.@Mode');
        if(font.Foreground?.['@Color']==='00000000')consumed.add('HumanReadable.BarCodeTextData.Font.Foreground.@Color');
        if(rgb(font.Foreground?.Color?.['@RGB'])==='#000000')consumed.add('HumanReadable.BarCodeTextData.Font.Foreground.Color.@RGB');
       }
      }
      const hriNode=entry[type].find(n=>Object.hasOwn(n,'HumanReadable'));
      const transforms=hriNode?.HumanReadable.find(n=>Object.hasOwn(n,'Transforms'));
      if(transforms){
       const converted=convertNativeSources('<DataSources>'+builder.build(transforms.Transforms)+'</DataSources>',{sourceDefinitions:result.sourceDefinitions,nativeNumberCultures:options.nativeNumberCultures||{}});
       result.sourceDefinitions=converted.sourceDefinitions;e.native_barcode_layout={hri_visibility:'none',inactive_hri_source_refs:converted.dataSourceRefs};
       if(converted.complete)consumed.add('HumanReadable.Transforms');
       else for(const d of converted.diagnostics)result.diagnostics.push({...d,objectId:id,objectName:name,nativeType:type});
      }
     }
     const nativeColor=oleRgb(p['@Color']);if(nativeColor&&nativeColor===rgb(p.Color?.['@RGB'])){e.barcode_spec.bar_color=nativeColor;consumed.add('@Color');consumed.add('Color.@RGB');}
    }
    const dim=Number(p.XDimension?.['@Millimeters']);if(dim>0){e.barcode_spec.x_mm=dim;consumed.add('XDimension.@Millimeters');}
    const visibility=p.HumanReadable?.['@Visibility'];
    if(visibility==null||visibility==='Full')e.barcode_spec.hri_visibility='full';
    else if(visibility==='DataSource')e.barcode_spec.hri_visibility='data-source';
    else if(visibility==='None'){e.barcode_spec.hri_visibility='none';e.barcode_spec.show_text=false;}
    if(['Full','DataSource','None'].includes(visibility))consumed.add('HumanReadable.@Visibility');
    if(type==='BarCode-UPC-A'&&p.HumanReadable?.['@Alignment']==='Bar'){
     const font=p.HumanReadable.BarCodeTextData?.Font,family=font?.['@FontName'],size=Number(font?.['@PointSize']);
     const objectProof=options.nativeHriFonts instanceof Map?options.nativeHriFonts.get(name):options.nativeHriFonts?.[name];
     const asset=objectProof||(options.nativeFonts instanceof Map?options.nativeFonts.get(family):options.nativeFonts?.[family]);
     const encoded=asset?.font_data_base64;
     let bytes=null;if(typeof encoded==='string'&&encoded.length<24*1024*1024&&/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))bytes=Buffer.from(encoded,'base64');
     const matched=asset?.font_name===family&&size>0&&size<=1000&&bytes?.length&&bytes.toString('base64')===encoded&&createHash('sha256').update(bytes).digest('hex')===asset.font_sha256?.toLowerCase()&&(!objectProof||(objectProof.kind==='native-hri-font'&&objectProof.font_size_pt===size&&Array.isArray(objectProof.evidence)&&objectProof.evidence.length>0));
     if(matched&&font['@Weight']==='400'){
      e.barcode_spec.native_hri={font_name:family,font_size_pt:size,font_data_base64:encoded,font_sha256:asset.font_sha256.toLowerCase()};
      e.native_barcode_layout={hri_source_mode:'encoded',inactive_hri_source_refs:[]};
      for(const k of ['FontName','PointSize','Weight'])consumed.add('HumanReadable.BarCodeTextData.Font.@'+k);
      if(Number(font['@Height'])===-20*size)consumed.add('HumanReadable.BarCodeTextData.Font.@Height');
      if(font['@CharacterSet']==='16909056')consumed.add('HumanReadable.BarCodeTextData.Font.@CharacterSet');
      for(const k of ['Underline','Strikethrough'])if(font[k]==='')consumed.add('HumanReadable.BarCodeTextData.Font.'+k);
      if(font.Foreground?.['@Mode']==='Solid'&&rgb(font.Foreground?.Color?.['@RGB'])==='#000000'&&oleRgb(font.Foreground?.['@Color'])==='#000000'){
       consumed.add('HumanReadable.BarCodeTextData.Font.Foreground');
      }
      for(const k of ['Tabs','AutoFit'])if(p.HumanReadable.BarCodeTextData[k]==='')consumed.add('HumanReadable.BarCodeTextData.'+k);
      consumed.add('HumanReadable.@Alignment');
      const hriNode=entry[type].find(n=>Object.hasOwn(n,'HumanReadable'));
      const transforms=hriNode?.HumanReadable.find(n=>Object.hasOwn(n,'Transforms'));
      if(transforms){
       const converted=convertNativeSources('<DataSources>'+builder.build(transforms.Transforms)+'</DataSources>',{sourceDefinitions:result.sourceDefinitions,nativeNumberCultures:options.nativeNumberCultures||{}});
       result.sourceDefinitions=converted.sourceDefinitions;e.native_barcode_layout.inactive_hri_source_refs=converted.dataSourceRefs;
       // Native Alignment=Bar renders digits from the encoded UPC; these
       // retained source definitions are dormant, not the active caption.
       if(converted.complete)consumed.add('HumanReadable.Transforms');
       else for(const d of converted.diagnostics)result.diagnostics.push({...d,objectId:id,objectName:name,nativeType:type});
      }
     }else diag('NATIVE_HRI_FONT_MISMATCH','HumanReadable.BarCodeTextData.Font','Original regular HRI font family, size and asset SHA-256 must match; no fallback font is substituted.');
    }
    let nativeUpca=false;
    if(type==='BarCode-UPC-A'&&p['@ThermalOutput']==='UniGDI'&&p['@GS1TemplateType']==='None'&&p['@UseAutoSizeBarCodeWidth']==='true'&&Number(p['@AutoSizeMinimumXDimension'])===5&&Number(p['@AutoSizeMaximumXDimension'])===500&&anchor&&unrotated){
     const target=millimeters(p['@AutoSizeTargetBarCodeWidth']);
     try{
      const profile={profile:'UniGDI-12.1',target_width_mm:target,minimum_x_mils:5,maximum_x_mils:500},size=require('./btw-native-upca').nativeUpcaSize(profile);
      e.barcode_spec.native_upca=profile;e.barcode_spec.bar_height_mm=h;e.barcode_spec.x_mm=size.effective_x_mm;
      e.width_mm=size.bar_width_mm;e.x_mm=x-size.bar_width_mm*anchor[0];e.y_mm=y-h*anchor[1];
      e.native_barcode_layout={...(e.native_barcode_layout||{}),reference_point:reference||'TopLeft',bar_width_mm:size.bar_width_mm,bar_height_mm:h};
      for(const k of ['UseAutoSizeBarCodeWidth','AutoSizeMinimumXDimension','AutoSizeMaximumXDimension','AutoSizeTargetBarCodeWidth','ThermalOutput','GS1TemplateType'])consumed.add('@'+k);
      // These are cached representations of the native module choice. Runtime
      // derives it afresh from the preserved auto-size target, never XML Width.
      for(const k of ['Index','Mils','Millimeters','Density'])if(p.XDimension?.['@'+k]!=null&&Number.isFinite(Number(p.XDimension['@'+k])))consumed.add('XDimension.@'+k);
      if(oleRgb(p['@Color'])===rgb(p.Color?.['@RGB']))consumed.add('@Color');
      result.diagnostics=result.diagnostics.filter(d=>d.objectId!==id||!d.code.startsWith('NATIVE_ANCHOR_'));
      nativeUpca=p.HumanReadable?.['@Visibility']==='None'||!!e.barcode_spec.native_hri;
     }catch(error){diag('NATIVE_BARCODE_PROFILE_UNSUPPORTED','Barcode',error.message);}
    }
    if(!nativeUpca&&!nativeMatrix)diag('NATIVE_BARCODE_OPTIONS_UNVERIFIED','Barcode','Native encoding options, HRI and exact symbol bounds require verification.');
   }else{supported=false;diag('NATIVE_OBJECT_UNSUPPORTED',type,'Native object type requires a dedicated editable adapter.');}
  }
  const rotation=attr('Rotation.Angle');if(rotation!=null&&type!=='Line')diag('NATIVE_ROTATION_UNVERIFIED','@Rotation.Angle','Native rotation direction and reference origin are unverified.');
  const color=rgb(p.Color?.['@RGB']);if(color){e.stroke_color=color;consumed.add('Color.@RGB');}
  if(type==='Box'||type==='Ellipse'){
   measure('Thickness','thickness_mm',false);
   const fill=p.FillStyle;if(fill?.['@Mode']==='None'){e.fill_color='none';consumed.add('FillStyle.@Mode');}
   else {const value=rgb(fill?.Color?.['@RGB']);if(value){e.fill_color=value;consumed.add('FillStyle.Color.@RGB');}}
   for(const key of ['thickness_mm','stroke_color','fill_color'])if(e[key]==null)diag('NATIVE_STYLE_DEFAULT_UNVERIFIED',key,'Native omitted '+key+'; renderer default is unverified.');
  }
  if(attr('ConditionalPrintType')!== 'Always')diag('NATIVE_CONDITIONAL_PRINT_UNMAPPED','@ConditionalPrintType','Conditional print behavior or omitted default requires mapping.');
  let sources=options.sourcesByObject instanceof Map?options.sourcesByObject.get(name):options.sourcesByObject?.[name];
  const sourceNodes=entry[type].filter(n=>Object.hasOwn(n,'DataSources'));
  if(!sources&&sourceNodes.length){
   const converted=convertNativeSources(builder.build(sourceNodes),{sourceDefinitions:result.sourceDefinitions,objectSourceTargets:options.objectSourceTargets||{},nativeNumberCultures:options.nativeNumberCultures||{}});
   result.sourceDefinitions=converted.sourceDefinitions;
   sources={dataSourceRefs:converted.dataSourceRefs,complete:converted.complete};
   for(const d of converted.diagnostics)result.diagnostics.push({...d,objectId:id,objectName:name,nativeType:type});
  }
  if(sources){for(const k of ['text','dataSourceRefs','hriSourceRefs','sourceTextSnapshot'])if(sources[k]!=null)e[k]=structuredClone(sources[k]);if(sources.complete===true)consumed.add('DataSources');else diag('NATIVE_SOURCES_INCOMPLETE','DataSources','Source adapter reports incomplete behavior.');}
  else if(type==='Text'||type.startsWith('BarCode-'))diag('NATIVE_SOURCES_REQUIRED','DataSources','Native source definitions must be mapped; sample strings are not a replacement.');
  if(type==='Picture'&&p['@SourceType']==='DataSourced'&&p['@PictureSource']==='Base64'&&sources?.complete===true&&e.dataSourceRefs?.length&&e.dataSourceRefs.every(ref=>Object.hasOwn(result.sourceDefinitions,ref))){
   e.source_picture={encoding:'base64'};consumed.add('@SourceType');consumed.add('@PictureSource');
  }
  if(e.barcode_spec&&e.text!=null)e.barcode_spec.text=e.text;
  const walk=(value,path='')=>{
   if(consumed.has(path))return;
   if((path==='#text'||path.endsWith('.#text'))&&typeof value==='string'&&/^\s*$/.test(value))return;
   if(value&&typeof value==='object')for(const [key,v]of Object.entries(value))walk(v,path?path+'.'+key:key);
   else if(path)diag('NATIVE_PROPERTY_UNMAPPED',path,'Original property is retained but has no verified implementation mapping.');
  };walk(p);
  if(supported&&geometry){record.elementId=e.id;result.elements.push(e);}
 }
 result.complete=result.diagnostics.every(d=>d.severity!=='error');return result;
}
module.exports={convertNativeObjects,millimeters};
