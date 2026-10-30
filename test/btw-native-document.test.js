'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {convertNativeDocument}=require('../lib/btw-native-document');
// Actual Accessory Box native PageSetup COM getter snapshot, 2026-10-26.
const page={Units:'btUnitsMillimeters',Orientation:'btLandscape',LabelColumns:2,LabelRows:3,LabelSizeManual:true,LabelShape:'btRectangle',LabelCorners:'btSquare',LabelHole:false,PaperWidth:279.4,PaperHeight:215.9,MarginLeft:12.7,MarginRight:67.056,MarginTop:6.35,MarginBottom:12.725,LabelWidth:99.822,LabelHeight:65.608,LabelGapManual:false,LabelGapHorizontal:0,LabelGapVertical:0,Mirror:false,Inverse:false,StartingCorner:'btTopLeft',StartingPositionDirection:'btHorizontal',fontUsages:[{objectName:'Text 1',family:'Arial',pointSize:12},{objectName:'Barcode 1',family:'Arial',pointSize:8}]};
const format={PageSetup:{LabelRows:'3',LabelColumns:'2',RulerUnits:'Inches',PaperWidth:{Millimeters:'279.400'},PaperHeight:{Millimeters:'215.900'},MarginLeft:{Millimeters:'12.700'},MarginRight:{Millimeters:'67.056'},MarginTop:{Millimeters:'6.350'},MarginBottom:{Millimeters:'12.725'},LabelShape:'Rectangle',LabelCorners:'SquareCorners'}};
const fonts=[{family:'Arial',sha256:'b3658eadae55e682b5f69eb64c439c1ecc8f196c0bb8d4756d145d13bc86476a',availability:'installed-system-font',evidence:['native-font-probe']}];
test('maps original native page and shape without wizard defaults or stock substitution',()=>{
 const r=convertNativeDocument(format,page,{fonts,evidence:['native-page-getters']});assert.equal(r.complete,true);
 assert.equal(r.document.width_mm,99.822);assert.equal(r.document.height_mm,65.608);assert.equal(r.document.label_shape,'rectangle');
 assert.deepEqual(r.document.page,{enabled:true,unit:'in',manual_template:true,manual_gap:false,width_mm:279.4,height_mm:215.9,rows:3,columns:2,left_mm:12.7,right_mm:67.056,top_mm:6.35,bottom_mm:12.725,gap_x_mm:0,gap_y_mm:0});assert.deepEqual(r.document.fonts,fonts);assert.equal(r.document.print_order,'rows');
});
test('does not invent rounded radius, missing dimensions, units or fonts',()=>{
 for(const change of [p=>p.LabelCorners='btRound',p=>delete p.LabelWidth,p=>p.Units='btUnitsInches',p=>p.LabelHole=true]){
  const p=structuredClone(page);change(p);const r=convertNativeDocument(format,p,{fonts,evidence:['probe']});assert.equal(r.complete,false);assert.ok(r.diagnostics.length);
 }
 assert.equal(convertNativeDocument(format,page,{fonts:[],evidence:['probe']}).complete,false);
});
test('blocks contradictory format inventory and native getter observations',()=>{
 const f=structuredClone(format);f.PageSetup.PaperWidth.Millimeters='215.900';const r=convertNativeDocument(f,page,{fonts,evidence:['probe']});assert.equal(r.complete,false);assert.ok(r.diagnostics.some(d=>d.code==='NATIVE_DOCUMENT_CONTRADICTION'));
});
module.exports={page,format,fonts};
