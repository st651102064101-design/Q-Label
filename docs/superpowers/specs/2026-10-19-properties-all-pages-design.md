# Properties ทุกหมวดตามภาพ BarTender — ข้อกำหนด

วันที่: 2026-10-19
สถานะ: ผู้ใช้ยืนยันข้อกำหนดเมื่อ 2026-10-19; แผน implementation อยู่ใน ../plans/2026-10-19-properties-all-pages.md

## เป้าหมาย
ปรับ Properties ของ Barcode และ Text ให้มีหมวด เครื่องมือ ลำดับ และการจัดกลุ่มตามภาพอ้างอิงทั้ง 14 ภาพที่ผู้ใช้ส่ง โดยใช้สี ฟอนต์ SVG และขอบมนของ Q LABEL ทุก control ที่เปิดใช้งานต้องเปลี่ยนผลจริง ไม่สร้าง control ที่เพียงบันทึกค่าแต่ไม่มีผล

## หลักฐานจากโค้ดปัจจุบัน
- `gui/object-properties.js` มี draft/Apply/OK/Cancel และ source session แล้ว แต่ navigation แสดงวัตถุเดียวและไม่มี Error Handling
- Object มี name/print toggle แต่ยังไม่มี Comments, Preprinted และ Print when
- Symbology มีชนิดและขนาด แต่ยังไม่มีกลุ่ม Dimensions/Specific Options ตามภาพ
- Human Readable มี visibility แบบ boolean, alignment และ vertical offset แต่ไม่มี per-source visibility และชุด HRI transforms ในหน้านี้
- Font มีบางชุดสำหรับ catalog barcode แต่ Text และ native barcode ยังใช้เครื่องมือคนละชุด
- Auto Fit ปัจจุบันเป็นคำสั่ง fit width ครั้งเดียว ไม่ใช่ระบบปรับหลายเงื่อนไขตามภาพ
- Border มีเฉพาะกรอบ barcode บางแบบ; Position มี X/Y/rotation ไม่มี origin/anchor dialog
- `gui/preview.js` มี SVG และ canvas raster คนละทาง ต้องตรวจทั้งสองและเส้นทาง print

## โครงหน้าต่างและต้นไม้
- รักษา resize อิสระและขั้นต่ำที่อ่านเนื้อหาได้ ตามงาน v1.022
- แถบต้นไม้ซ้าย: ชื่อวัตถุเป็น root, หมวดตามชนิดเป็นลูก, Data Sources และ source เป็นลำดับลึกลงไป มีเส้นประเชื่อมและ SVG
- สลับดูวัตถุอื่นในเอกสารเดียวกันได้จากต้นไม้ โดย draft ของวัตถุก่อนหน้ายังคงอยู่
- หมวด barcode: Object, Symbology and Size, Human Readable, Font, Text Format, Auto Fit, Border, Position, Error Handling, Data Sources
- หมวด Text: Object, Font, Text Format, Auto Fit, Border, Position, Error Handling, Data Sources
- ใช้ระบบ Apply/OK/Cancel ของ Q LABEL: Apply บันทึกทั้ง draft, OK บันทึกแล้วปิด, Cancel ทิ้งเฉพาะสิ่งที่ยังไม่ Apply
- แสดง preview ใน Object และเมื่อจำเป็นต่อการแก้ค่า; ไม่บีบ panel ของทุกหน้าด้วย preview ขนาดใหญ่เหมือนปัจจุบัน

## รายละเอียดรายหมวด

### Object
ชื่อวัตถุ, Comments multiline, Preprinted, Print when แบบ summary พร้อมปุ่มตั้งค่า และ Preview
- Preprinted แสดงในการออกแบบ แต่ไม่ส่ง artwork ในงานพิมพ์
- Print when รองรับ Always/Never และเงื่อนไขจาก named source โดยประเมินต่อ record
- เปลี่ยนชื่อแล้ว root ในต้นไม้ต้องเปลี่ยน และบันทึก/เปิดใหม่ได้

### Symbology and Size
Symbology, Dimensions (X dimension, density, ratio, height), Symbology Specific Options (check digit, HIBC, GS1, code set, GS1 wizard, text encoding), Color และ Print Method
- หน่วย dimensions ตามหน่วยแอป พร้อมแปลงค่าถูกต้อง
- density และ X dimension เป็นค่าที่สัมพันธ์กัน ค่าที่คำนวณไม่ได้ต้องไม่ให้แก้
- ตัวเลือกแต่ละ symbology เปิดได้เฉพาะ encoder ที่รองรับ ตรวจผล encoded data และขนาดจริง
- GS1 wizard ใช้ validator/compiler เดิม ไม่ต่อข้อความ AI เอง
- Print Method ต้องเลือกวิธีที่ runtime รองรับจริง และไม่แสดงตัวเลือกปลอมว่าทำงานแล้ว

### Human Readable
Visibility Full/None/Set per data source พร้อม Select; Position (Top/Bottom, alignment, vertical/horizontal offsets); Specific Options ตาม symbology; HRI transforms 4 รายการ: Character template, Search and replace, VB script, Prefix and suffix
- HRI transforms เปลี่ยนเฉพาะข้อความอ่านได้ ไม่เปลี่ยน encoded barcode
- ค่าจากแต่ละ source ต้องแยก visibility ได้ ไม่กรองด้วยการจับ substring
- SVG, raster และ prepared print ต้องมีตำแหน่ง/ข้อความตรงกัน

### Font
Typeface, Font Style และ Point Size เป็นสามคอลัมน์ด้านบน; แท็บ Style, Underline, Strikethrough, Outline, Width, Advanced
- Style มี inverse, foreground/background, subscript/superscript, small caps
- รูปแบบเหล่านี้ต้องมีผลกับ Text และ HRI รวม SVG/raster
- font family ที่มีจริงเลือกได้ และคงชื่อเดิมของเอกสารที่เครื่องไม่มี font โดยไม่แทนเงียบ ๆ

### Text Format
จัดกลุ่ม paragraph/alignment/wrapping และ spacing ของข้อความตามความสามารถของ object พร้อม transforms เดิมที่ไม่ทำซ้ำกับ source transforms
- แยกการจัด layout ออกจากการเปลี่ยน encoded value
- ค่าข้อความหลายบรรทัดและ Unicode ต้องไม่สูญหาย

### Auto Fit
Enable, Dimensions width/height, Content Alignment horizontal/vertical; Adjustments font point size/font scale width/character spacing/line spacing แต่ละตัวมี min/max/preferred; Linked Adjustments และ link group
- การ fit เป็น deterministic layout calculation ใช้ร่วมกันใน preview/print ไม่เปลี่ยนค่าต้นฉบับทุกครั้งที่ render
- เปิด linked group แล้วใช้ค่าปรับเดียวกันกับสมาชิกตามข้อจำกัดร่วมกัน
- ปิด checkbox แล้วตัวเลือกย่อย disabled และไม่กระทบ layout

### Border
None/Rectangle/Ellipse; Margins 4 ด้าน; Box Options corner type/size/sides; Line Properties thickness/color/transparency/dash/compound; Fill Properties color
- None ปิด controls ย่อย; กรอบและ fill มีผลใน SVG/raster และ bounds
- margins และ radius ไม่ย้ายพิกัด authored object โดยเงียบ ๆ

### Position
Anchor, X/Y พร้อม summary ของ origin และปุ่ม Advanced Position Settings, Rotation, Layer, Lock object
- Advanced dialog: X relative Left/Center/Right of Template; Y relative Top/Center/Bottom of Template
- เปลี่ยน origin/anchor แล้วรักษาตำแหน่งบนกระดาษเดิม ป้องกัน object กระโดด
- summary แก้ตรงช่องไม่ได้ ใช้ปุ่มด้านข้าง; dialog OK/Cancel staged
- Layer เปลี่ยนลำดับจริง; Lock object ป้องกัน drag/resize แต่ยังเปิด Properties เพื่อปลดล็อกได้

### Error Handling
รายการซ้าย: Content Does Not Fit, Data is Empty, Data is Invalid, File is Not Found, Script Error; ด้านขวาเป็น policy แยกแต่ละกรณี
- warning in design area, do not print object, clip to fit (เฉพาะ overflow), placeholder data (กรณีข้อมูล), write log, invalidate label พร้อม style, ask abort job, always abort job
- forced options ของ invalid/file/script เป็น disabled checked ตามภาพ
- policy ถูกประเมินหลัง resolve/encode ต่อ object/record; แยก warning, recoverable error และ fatal error
- abort ไม่ส่ง transport; ask ทำงานใน GUI เท่านั้น ส่วน CLI/server ต้องตอบ structured error แทนการค้างรอ dialog
- ไม่มีการส่งพิมพ์จริงในการทดสอบ; ตรวจ transport mock ว่าถูก/ไม่ถูกเรียก

### Data Sources
รักษาฟังก์ชันเดิมทั้งหมด รวม v1.028 summary ที่แก้ตรงช่องไม่ได้ และใช้ source editor/wizards เดิมร่วมกับต้นไม้หลายวัตถุ

## สัญญาข้อมูลและขอบเขตการเปลี่ยน
- เพิ่ม schema ของ object properties แบบ backward compatible; field ที่ไม่รู้จักต้อง round trip ไม่สูญหาย
- เก็บชื่อ/comments/preprinted/condition, border, position, fit, HRI และ error policies ใน object ที่มี stable ID
- ใช้ pure resolver/layout/policy module ร่วมกับ host ทั้ง GUI/CLI/server; adapter ของ GUI รับผิดชอบการถามผู้ใช้
- ไม่ย้ายหรือ rewrite unrelated dirty files ใน workspace; stage เฉพาะงานนี้
- ไม่อ้างว่าเหมือน 100% จนกว่าทุก control ใน matrix มีทั้ง behavior test และ visual/runtime evidence

## แผนส่งมอบและเกณฑ์รับงาน
1. Object schema + multi-object tree + transaction + Object page
2. Position/origin/anchor/layer/lock และ Border พร้อม output parity
3. Symbology/HRI/Font/Text Format พร้อม encoder/layout parity
4. Auto Fit/linked groups พร้อม deterministic bounds tests
5. Error Handling พร้อม preview diagnostics และ print abort/recovery tests
6. ตรวจเทียบทุกหมวดตามภาพที่ขนาดขั้นต่ำ/ขยาย/จอเล็ก และ regression ของ Data Sources

ทุกชุดต้องเพิ่มเวอร์ชันทีละ .001, Thai CHANGELOG, checklist และ executable tests; รัน `npm run test:basic` ทั้งหมดจนไม่มี fail/skip ก่อนส่งมอบ พร้อม Electron isolated profile, Save/Reopen, Undo/Redo, Apply/Cancel, preview/prepared-print equality และภาพหน้าจอเทียบตำแหน่ง controls

## ข้อจำกัดที่ทราบก่อนเริ่ม
- ภาพอย่างเดียวไม่ยืนยันค่า default/semantics ของทุก symbology และ Error Handling; ต้องบันทึกผล native reference เพิ่มเฉพาะจุดที่มีผลกับ output
- remote ปัจจุบัน `dextsamu/labelforge` ปฏิเสธ push ของบัญชี `st651102064101-design` ด้วย HTTP403; commit ในเครื่องทำได้ แต่ไม่ถือว่าส่งขึ้น remote สำเร็จ
