'use strict';
/** Explicit native PageSetup getters plus original GetFormatProperties inventory.
 * No inferred page sizes, gaps, shape radius, font availability or stock. */
function convertNativeDocument(formatProperties,snapshot,{fonts=[],evidence=[],formsMode='block'}={}){
 const diagnostics=[],document={},fail=(code,path,message)=>diagnostics.push({severity:'error',code,path,message});
 const page=formatProperties?.PageSetup;
 if(!page||!snapshot||snapshot.Units!=='btUnitsMillimeters')fail('NATIVE_DOCUMENT_REQUIRED','PageSetup','Original inventory and explicit millimeter native getter snapshot required.');
 if(!Array.isArray(evidence)||!evidence.length)fail('NATIVE_DOCUMENT_REQUIRED','evidence','Native document behavior evidence required.');
 const s=snapshot||{},measure=key=>{const n=s[key];if(!Number.isFinite(n)||n<0)fail('NATIVE_DOCUMENT_MEASURE',key,'Finite nonnegative native millimeter getter required.');return n;};
 const nativeForms=formatProperties?.Forms;
 if(nativeForms!==undefined){
  const enabled=nativeForms?.['@Enabled'];
  if(!['true','false'].includes(enabled))fail('NATIVE_DOCUMENT_FORMS_UNMAPPED','Forms','Explicit native form enabled state required.');
  const excluded=enabled==='true'&&formsMode==='exclude';
  document.native_forms={enabled:enabled==='true'&&!excluded,original_enabled:enabled==='true',excluded,promptingEnabled:typeof s.EnablePrompting==='boolean'?s.EnablePrompting:null,controls:[],behaviorComplete:false};
  if(s.PromptValuesXml!==undefined){
   try{Object.assign(document.native_forms,require('./btw-native-forms').readNativePromptValues(s.PromptValuesXml));}
   catch(error){fail('NATIVE_DOCUMENT_FORMS_UNMAPPED','PromptValues',error.message);}
  }
  if(enabled==='true'&&!excluded)fail('NATIVE_DOCUMENT_FORMS_UNMAPPED','Forms','Enabled native data entry forms require original control bindings, layout, validation and event lifecycle; PromptValues alone is an inventory.');
 }
 const width=measure('LabelWidth'),height=measure('LabelHeight');
 if(!(width>0&&height>0))fail('NATIVE_DOCUMENT_MEASURE','LabelSize','Positive native label dimensions required.');
 document.width_mm=width;document.height_mm=height;
 const p={enabled:true,unit:page?.RulerUnits==='Inches'?'in':page?.RulerUnits==='Millimeters'?'mm':null,manual_template:s.LabelSizeManual,manual_gap:s.LabelGapManual,width_mm:measure('PaperWidth'),height_mm:measure('PaperHeight'),rows:s.LabelRows,columns:s.LabelColumns,left_mm:measure('MarginLeft'),right_mm:measure('MarginRight'),top_mm:measure('MarginTop'),bottom_mm:measure('MarginBottom'),gap_x_mm:measure('LabelGapHorizontal'),gap_y_mm:measure('LabelGapVertical')};
 if(!p.unit||![p.manual_template,p.manual_gap,s.Mirror,s.Inverse].every(value=>typeof value==='boolean')||![p.rows,p.columns].every(value=>Number.isInteger(value)&&value>0)||!(p.width_mm>0&&p.height_mm>0))fail('NATIVE_DOCUMENT_REQUIRED','PageSetup','Explicit original units, flags and positive page/count values required.');
 document.page=p;
 const shape={btRectangle:'rectangle',btSquare:'rectangle',btRound:'circle',btEllipse:'ellipse'}[s.LabelShape];
 if(!shape||s.LabelHole!==false)fail('NATIVE_DOCUMENT_SHAPE_UNMAPPED','LabelShape','Native shape or hole requires a dedicated mapping.');
 document.label_shape=shape;
 if(s.LabelCorners==='btRound'&&shape==='rectangle'){
  document.label_shape='rounded';
  if(!Number.isFinite(s.CornerRadiusMm)||s.CornerRadiusMm<0)fail('NATIVE_DOCUMENT_RADIUS_UNVERIFIED','LabelCorners','Native rounded radius is not exposed by PageSetup; explicit additional runtime evidence required.');
  else document.corner_radius_mm=s.CornerRadiusMm;
 }else if(s.LabelCorners!=='btSquare')fail('NATIVE_DOCUMENT_SHAPE_UNMAPPED','LabelCorners','Unverified native corner mode.');
 else document.corner_radius_mm=0;
 if(!['btPortrait','btLandscape','btPortrait180','btLandscape180'].includes(s.Orientation))fail('NATIVE_DOCUMENT_ORIENTATION_UNMAPPED','Orientation','Unverified native orientation.');
 document.print_orientation=['btPortrait180','btLandscape180'].includes(s.Orientation)?'inverted':'normal';document.mirror=s.Mirror;document.negative=s.Inverse;
 if(s.StartingCorner!=='btTopLeft'||!['btHorizontal','btVertical'].includes(s.StartingPositionDirection))fail('NATIVE_DOCUMENT_ORDER_UNMAPPED','StartingCorner','Unverified native starting corner/order.');
 document.print_order=s.StartingPositionDirection==='btVertical'?'columns':'rows';
 for(const key of ['PaperWidth','PaperHeight','MarginLeft','MarginRight','MarginTop','MarginBottom']){
  const raw=page?.[key]?.Millimeters,n=typeof raw==='string'&&/^\d+(?:\.\d+)?$/.test(raw)?Number(raw):null;
  if(n===null||!Number.isFinite(s[key])||Math.abs(n-s[key])>.00051)fail('NATIVE_DOCUMENT_CONTRADICTION',key,'Original format inventory does not match native getter measurements.');
 }
 if(Number(page?.LabelRows)!==s.LabelRows||Number(page?.LabelColumns)!==s.LabelColumns)fail('NATIVE_DOCUMENT_CONTRADICTION','LabelCount','Original format inventory and native count disagree.');
 const formatShape={btRectangle:'Rectangle',btSquare:'Square',btRound:'Circle',btEllipse:'Ellipse'}[s.LabelShape],formatCorners={btSquare:'SquareCorners',btRound:'RoundCorners'}[s.LabelCorners];
 if(page?.LabelShape!==formatShape||page?.LabelCorners!==formatCorners)fail('NATIVE_DOCUMENT_CONTRADICTION','LabelShape','Original format inventory and native shape disagree.');
 if(!Array.isArray(fonts)||fonts.some(font=>!font?.family||!/^[a-f0-9]{64}$/i.test(font.sha256||'')||font.availability!=='installed-system-font'||!Array.isArray(font.evidence)||!font.evidence.length))fail('NATIVE_DOCUMENT_FONT_UNVERIFIED','fonts','Exact available native font identity and evidence required.');
 for(const usage of s.fontUsages||[])if(!fonts.some(font=>font.family===usage.family))fail('NATIVE_DOCUMENT_FONT_UNVERIFIED',usage.objectName,'Original native object font unavailable.');
 document.fonts=structuredClone(fonts);document.native_document={formatProperties:structuredClone(formatProperties),pageSnapshot:structuredClone(snapshot),evidence:[...evidence]};
 return {complete:diagnostics.length===0,document,diagnostics};
}
module.exports={convertNativeDocument};
