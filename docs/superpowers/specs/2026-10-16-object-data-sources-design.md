# Object Data Sources — Q LABEL

วันที่: 2026-10-16
สถานะ: แบบรายละเอียดสำหรับผู้ใช้ตรวจ หลังอนุมัติแนวทาง A; ยังไม่อนุมัติ implementation plan

## 1. เป้าหมายและหลักฐาน

ผู้ใช้ต้องการ double click object → Properties → Data Sources ซึ่งตั้งค่าและประมวลผลได้เทียบเท่า BarTender ทั้งการแสดงผลและงานพิมพ์ ไม่ใช่เพียงสร้าง controls ตามภาพ ผู้ใช้เลือกแนวทาง A คือ engine ภายใน Q LABEL ร่วมกันระหว่าง preview กับ print

หลักฐานอ้างอิงคือหน้าต่าง Barcode Properties ที่ตรวจใน BarTender และคู่มือที่ติดตั้ง `D:/Programs/Help/BarTender.chm`: `DataSources_PropertyPage_barcode.htm`, `Available_Data_Sources.htm`, `Available_Transforms_LP.htm`, `HIDD_DATASOURCEPAGE.htm`, `DS_ObjectValue.htm`, `DS_ExternalFile.htm`, `DS_ExistingNamedDS.htm`, `Managed/Serialization.html`, `Managed/Suppression.html` และ `HIDD_SEARCH_REPLACE_TRANSFORM.htm`

การตรวจที่ผ่านมาให้หลักฐานรายการ features และ semantics บางส่วน ยังไม่ใช่หลักฐานว่าพฤติกรรมทุกกรณีเทียบเท่า 100% การส่งมอบต้องมี comparison matrix ที่เก็บผลจริง และแสดงข้อจำกัดที่ยังไม่ได้พิสูจน์

## 2. ขอบเขตและลำดับการส่งมอบ

ครอบคลุม Text, native barcode, barcode catalog, QR/Data Matrix และ source ของข้อมูลใน table ตามความสามารถของ object นั้น โดยไม่เพิ่มการรองรับ encoder/RFID เป็น object ใหม่ในงานนี้ ความสามารถที่อาศัย hardware ต้องรายงานแยกจากผลบนคอมพิวเตอร์

แยกงานเป็นห้าช่วงที่ทดสอบได้ แต่ยังคงเป้าหมายรวมครบเมนู:

1. Ordered source model, migration, Properties tree/toolbar, Embedded Data, named references และ concatenation
2. Data types และ deterministic transforms พร้อม Unicode, locale และข้อมูล binary
3. Source adapters, dependency graph, database/record context, external file และ job metadata
4. Serialization state, VBScript compatibility, GS1 wizard และ printer-specific integration
5. ตรวจ behavior matrix ทั้งหมด, migration ของไฟล์จริงที่ทำสำเนาไว้ และ preview/print parity

แต่ละช่วงห้ามแสดงความสามารถที่ยังไม่มี implementation เป็นตัวเลือกที่ใช้ได้ รายการที่ไม่พร้อมต้องมีสถานะและเหตุผล และถือเป็นช่องว่างที่ยังไม่ผ่านเป้าหมายรวม

## 3. รูปแบบข้อมูล

เพิ่ม `dataSourceSchemaVersion: 1` และ registry `sourceDefinitions` ระดับ document แต่ละ definition มี stable UUID, optional unique name, description, source kind/config, data type/config และ transform configuration

Object มี `dataSourceRefs` เป็นรายการ stable definition IDs ตามลำดับการต่อข้อความ และ object ทุกตัวมี stable object ID การอ้างข้ามหน้าใช้ page ID + object ID แทน array index เพื่อให้ reorder และ insert ไม่เปลี่ยนเป้าหมาย

Named source ใช้ definition เดียวร่วมกัน การเปลี่ยนค่าจึงกระทบทุก reference ส่วน Duplicate source สร้าง UUID ใหม่และ clone config; Paste เปิดทางเลือก copy หรือ linked reference เมื่อข้อมูลที่คัดลอกเป็น named source การลบ definition ที่ถูกใช้อยู่ต้องแสดงผู้ใช้งานทั้งหมดและไม่สร้าง dangling references โดยเงียบ

Metadata ของ runtime เช่น pending async request, resolved preview cache และ handles ของไฟล์ไม่บันทึกในเอกสาร การบันทึกต้อง round trip ได้ทั้ง unknown metadata จากเวอร์ชันก่อนและข้อมูล binary ที่มี encoding ชัดเจน

### Migration

- Legacy literal `text` และ `barcode_spec.text` เปลี่ยนเป็น Embedded Data โดยรักษาอักขระทุกตัว
- Tokens `{{field}}` แปลงเป็น reference โดยรักษาลำดับ literal/token และ binding กับ registry เดิม
- `data_transform`, `data_prefix`, `data_suffix`, `data_type` ต้องรักษาผลหลังการรวมข้อความเดิม ไม่ย้าย prefix/suffix ไปซ้ำทุก segment
- ไฟล์เก่าที่ใช้ serial แบบ index ต้องรักษาค่าเดิมจนผู้ใช้เลือกเปลี่ยนโหมด explicit; ห้ามเลื่อนหมายเลขขณะโหลด
- ทำ migration บน draft ในหน่วยความจำ; การเปิดไฟล์ไม่เขียนทับไฟล์โดยอัตโนมัติเมื่อ Auto Save ปิด และความล้มเหลวไม่ทำลายต้นฉบับ
- ทดสอบ migration ซ้ำได้โดยไม่เพิ่ม source ซ้ำ และ save/reopen แล้วได้ผลเหมือนก่อน migration

## 4. การประมวลผลร่วม

แยก core ที่ไม่พึ่ง DOM ออกจาก main-process adapters:

- `source-model`: schema validation, stable IDs, clone/link, migration, source list operations
- `source-resolver`: dependency graph และ evaluation โดยรับ context ชัดเจน
- `source-types`: parsing/formatting รวม Unicode และ binary representations
- `source-transforms`: transform functions ที่รับ input + immutable config
- `source-adapters`: database, files, global/library, clock, job, script และ printer capabilities
- `source-session`: preview cancellation/cache และ print-job snapshot/serialization transaction
- `object-data-sources-ui`: tree, tabs, editors, toolbar และ dialogs ที่เชื่อม model

Context ระบุ mode (`design`, `preview`, `print`), document revision, record index, copy index, job ID, total copies, locale/time zone, frozen clock และ printer capabilities การ resolve คืนค่า typed result พร้อม diagnostics และ provenance ของ definition/object

Dependency cycles ต้องรายงานเส้นทางอ้างอิง; source ที่ไม่มีข้อมูลต้องใช้กฎ default/validation ตาม config ไม่เปลี่ยนเป็น empty string ทุกกรณี ข้อมูลล้มเหลวหนึ่ง object ต้องไม่ทำให้ทั้ง workspace เปิดไม่ได้ แต่ print ต้องหยุดก่อนส่งงานหาก object ที่จะพิมพ์มี error ที่ยังไม่แก้

Preview และ print ใช้ core และ config เดียวกัน ต่างกันเฉพาะ context ที่กำหนด เช่นเวลาและ record ตัว preview แสดง sampled clock/serial โดยไม่ commit state เมื่อ print เริ่มให้ snapshot document, record set และ inputs เพื่อลดการเปลี่ยนข้อมูลกลาง job

ลำดับ transform ข้ามกลุ่มต้องอ่านและพิสูจน์ด้วย reference fixtures ก่อนลง implementation plan; ห้ามอนุมานจากลำดับแสดงใน dialog ส่วน Search and Replace actions ทำตามลำดับในรายการตามคู่มือ เมื่อยังไม่มีหลักฐานลำดับข้ามกลุ่ม ให้ capability นั้นอยู่ในสถานะยังไม่ verified แทนการอ้างว่าตรงต้นแบบ

## 5. UI และ lifecycle

Double click object และ context menu Properties เข้าสู่ dialog เดียวกัน ภายใต้ Data Sources แสดง source rows ตามลำดับ แถวที่เลือกควบคุมสามแท็บ Data Source / Data Type / Transforms

Data Source แสดง Name, Description, Type และ editor เฉพาะประเภท ส่วน Type change wizard ต้องแสดงผลของการแปลงและไม่ล้าง config เดิมจนยืนยัน Name wizard ตรวจชื่อซ้ำและความหมายของการสร้าง/ผูก named source ส่วน special characters picker ต้องใส่อักขระจริงและมี representation ที่อ่านได้สำหรับ control characters

Toolbar มี New, GS1 wizard, Delete, Cut, Copy, Paste, Move Up/Down พร้อมคีย์ลัด Ctrl+X/C/V และ Ctrl+Up/Down เฉพาะเมื่อ focus อยู่ที่ source list; textarea ใช้คีย์ลัดแก้ข้อความตามปกติ Move Up/Down disabled ที่ขอบรายการ และ Paste disabled เมื่อไม่มี payload ที่รองรับ

แก้ค่าบน draft แล้ว preview อัปเดตทันทีเมื่อ valid; invalid input แสดง error ใกล้ field และไม่เขียนค่าผิดเข้าตัวเอกสาร Async preview ติด revision token และทิ้งผลเก่าที่ตอบกลับช้า

Close/OK commit draft เป็นหนึ่ง undo transaction ตามการใช้งาน dialog; Cancel/Escape คืนค่าก่อนเปิดทั้งหมด การเปิด nested source dialog ไม่ commit parent โดยไม่ตั้งใจ หลัง commit ต้องเชื่อม dirty state, Auto Save, manual Save และ recent preview ตาม policy เดิม

## 6. Data Source adapters

| Source | พฤติกรรมที่ต้องมี |
|---|---|
| Embedded Data | literal, multiline, Unicode/control characters, default reply |
| Clock | system/printer clock, date/time formatting, frozen print context; ตรวจ device-font และ printer capability |
| Database Field | connection/field, record selection, null/default, validation/type conversion และ missing connection |
| Library Phrase | phrase ID, language/variant, missing library และ update policy; local Q LABEL library ไม่อ้างว่าเปิด Data Builder format ได้จนทดสอบจริง |
| Global Data Field | persistent shared value, revision และ conflict policy ตามขอบเขต installation |
| Object Value | resolved concatenated value จาก stable object/page reference; main/HRI/GS1 values เฉพาะที่ object รองรับ |
| Print Job Field | document/job/printer/page/template metadata พร้อมค่าที่ preview และ print ต่างกันอย่างมีเหตุผล |
| External File | fixed path หรือ named-source path, text/binary, encoding, missing/unreadable file และ reread ตอน print |
| Visual Basic Script | syntax/runtime errors, result, events และ object model ที่พิสูจน์ความเข้ากันได้แล้ว |
| Printer Code Template Field | placeholder และ formatting ตาม export/print mode; ไม่ส่ง placeholder เป็นค่าจริงโดยเงียบ |
| Table Data Field | table record context, field/functions, null และ row bounds |
| Named Data Source | shared reference, rename propagation, missing reference, duplicate-name validation |

File/script access ทำผ่าน main process; renderer ไม่อ่านไฟล์หรือรัน shell โดยตรง Script runner แยก process, มี timeout/cancellation และ error location ไม่ใช้ token substitution แทน VBScript แล้วเรียกว่า compatible การเลือก runtime และ BarTender object-model subset เป็น feasibility gate ที่ต้องพิสูจน์ก่อนเปิดใช้ VBScript

## 7. Data Type และ Transforms

Data types ครบ Text, Date, Time, Number, Currency, Percentage, Fraction, Binary, Picture พร้อม dependent options และ available transform matrix

- Date/Time: locale/calendar, custom patterns, local/UTC และ invalid date
- Number: grouping/precision/sign/native digits รวม hexadecimal, Roman และ scientific notation ตามต้นแบบ
- Currency/Percentage/Fraction: rounding, locale, precision และ formatting ที่ไม่สูญเสียค่าโดยไม่แจ้ง
- Binary: byte-preserving encoding/decoding; Picture: format/color/dithering/quality/size ตาม capability จริง

Transforms ครบ Suppression, Character Filter, Compression, Offset, Range Checking, Truncation, Number of Characters, Character Template, Search and Replace, VB Script, Serialization, Prefix and Suffix

แต่ละ transform มี config validation, disabled/active summary, source preview ก่อน/หลัง และ tests สำหรับค่าปกติ/ขอบเขต/ผิดรูปแบบ Suppression ต้องทดสอบ previous/next empty และ named-source conditions; truncation/length ต้องระบุนิยาม characters ให้ตรงกับ reference สำหรับ Unicode

Search and Replace มี ordered action list, Add/Delete/Cut/Copy/Paste/Move, test input/output และ Import/Export ที่ไม่ execute payload จากไฟล์เป็นโค้ด ส่วน Compression ต้องได้ bytes ที่ encoder รองรับ ไม่ใช่เพียงลดขนาดข้อความเพื่อแสดง

## 8. Serialization และ GS1

Serialization ต้องรองรับ increment/decrement, character set/method, padding, rollover, reset และ scope ต่อ copy/record/job ตาม behavior fixtures Preview/การเปิด properties/Cancel/failed validation ต้องไม่ใช้หมายเลขจริง

Print session จองค่าภายใต้ job ID และบันทึกสถานะส่งสำเร็จ/ล้มเหลว/ไม่ทราบผล แยกจากการสร้าง print payload หากส่งไป printer แล้วขาดการตอบกลับ ห้ามใช้ค่าซ้ำอัตโนมัติ ต้องมี recovery ที่ผู้ใช้ตัดสินใจได้; ความหมายของ 'สำเร็จ' ต้องระบุว่า spool/transport accepted หรือเครื่องพิมพ์ยืนยันจริงตาม driver

GS1 wizard ต้องเก็บ AI definitions, fixed/variable length, check digits, separators/FNC1, human-readable form และ symbology restrictions โดยทดสอบ encoded bytes และ decoded values การใช้วงเล็บใน HRI ไม่ถือว่ามี FNC1 ใน barcode โดยอัตโนมัติ

## 9. การทดสอบและเกณฑ์รับงาน

Comparison matrix หนึ่งแถวต่อ control/command/conditional behavior มี: reference version, source help topic, fixture config, input/context, expected result, actual Q LABEL result, automated/manual/hardware classification และสถานะ observed/implemented/verified/blocked

Fixture ต้องเป็นเอกสารชั่วคราว ไม่เปลี่ยนไฟล์ต้นฉบับที่ผู้ใช้เปิดอยู่ การตรวจ UI ใช้ native BarTender เป็น reference และ Q LABEL isolated profile ผลพิมพ์เริ่มจาก payload/raster ก่อนทดสอบ hardware ที่ระบุ

Acceptance ที่ต้องผ่านทุกช่วง:

1. Text + barcode native/catalog ใช้ค่าเดียวกันใน Properties, editor, print preview, export และ print payload เมื่อ context เดียวกัน
2. ต่อ Embedded + Named + Database sources แล้ว reorder/duplicate/link/unlink ได้ผลถูกต้อง; Undo/Redo และ save/reopen รักษา references
3. Invalid type/config, missing file/field/library และ cyclic references แสดง errors โดยไม่ทำ workspace ล่มหรือพิมพ์ค่าผิด
4. Cancel nested/parent dialog และ Auto Save off ไม่บันทึก draft ที่ยกเลิก
5. Clock/serial preview ไม่เปลี่ยน persisted state; concurrent jobs และ retry ไม่ใช้ serial ซ้ำโดยไม่แจ้ง
6. ทุก source/type/transform ที่แสดง enabled มีผลจริงและ automated regression; unsupported integration มีเหตุผลที่ตรวจสอบได้
7. รัน `npm run test:basic`, ปรับ `UNIT_TEST_BASIC.md`, Electron integration และ reference fixtures หลังเปลี่ยน production code; รายงาน coverage gaps ตามจริง

จะใช้คำว่าเทียบเท่าครบขอบเขตได้เมื่อ matrix ไม่มีแถว blocked/unverified สำหรับขอบเขตที่ตกลงไว้ ห้ามใช้จำนวนเมนูที่สร้างครบเป็นหลักฐาน 100%

## 10. ข้อกำหนดที่ต้องพิสูจน์ก่อนวางแผน implementation ส่วนที่เกี่ยวข้อง

1. Transform order และ default/validation ราย field: อ่าน nested help และทำ fixture input ที่แยกผลของลำดับได้
2. Named-source copy/link และ Properties commit semantics: ใช้ fixture สอง object เพื่อวัด propagation และ Cancel
3. VBScript runtime/object model: ตรวจ runtime ที่ติดตั้งและ prototype ใน isolated process ก่อนกำหนด compatibility level
4. Serialization persistence/failure/reset: ตรวจ reference jobs ที่ไม่ส่งเครื่องจริงก่อน แล้วแยก hardware cases
5. Binary/picture compression และ GS1: ตรวจ bytes/decoder ด้วยตัวอย่างอิสระ
6. Printer-clock/library/PCT integration: ต้องมี capability evidence ก่อนเปิดใช้และก่อนอ้างความเทียบเท่า

รายการข้างต้นเป็น acceptance gates ที่มีวิธีตรวจชัดเจน ไม่ใช่อนุญาตให้ผู้พัฒนาข้าม feature ที่ยาก หากต้องเปลี่ยนเป้าหมายความเข้ากันได้ต้องนำผลและทางเลือกกลับให้ผู้ใช้ตัดสินใจ

## 11. การตรวจแบบและขั้นตอนถัดไป

แบบเลือก engine ภายใน Q LABEL, stable references และ shared evaluator ตามแนวทาง A ครอบคลุม model/UI/data flow/error handling/migration/testing พร้อมแยกสิ่งที่มีหลักฐานจากสิ่งที่ต้องพิสูจน์แล้ว

หลังผู้ใช้อนุมัติเอกสารนี้ จึงเขียน implementation plan แบ่งงานและกำหนด reference probes/verification รายช่วง จากนั้นให้ผู้ใช้เลือกวิธีดำเนินแผนตาม Superpowers งานนี้ยังไม่มีการเปลี่ยน production Data Sources code จากเอกสารนี้
