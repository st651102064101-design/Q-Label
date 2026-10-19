## v1.017 — 2026-10-19

- เพิ่มเมนูคลิกขวา Data Sources: New, Delete, Cut, Copy, Paste, Move Up/Down ใช้คำสั่งเดียวกับ toolbar และเลือก source ที่คลิกจริง
- รองรับ Shift+F10, ลูกศร, Escape และจำกัดเมนูในจอ; ยังไม่ยืนยัน UX/UI และพฤติกรรมทั้งหมดเทียบ BarTender 100%

## v1.016 — 2026-10-19

- Print Job Fields แสดง Transform ใหม่เฉพาะ Suppression ตาม native source-kind9 แทนการใช้เมนู Text/Number ปกติ
- คง Transform ที่ไฟล์เดิมตั้งไว้แม้ปิดใช้งาน โดยไม่เปลี่ยนค่าและลำดับ; Input Mask/Regex และพฤติกรรมทุกส่วนยังไม่ยืนยันครบ

## v1.015 — 2026-10-19

- จับคู่รหัส native กับชื่อจาก BtEnu.dll และแก้เมนู Transforms ให้ตรงตามชนิดข้อมูลครบ 9 แบบ รวมลำดับ Offset/Range ของ Number
- คง Transform เพิ่มเติมจากไฟล์เดิมโดยไม่ล้างค่าหรือเรียงการประมวลผลใหม่; รายการเมนูยืนยันได้ แต่ยังไม่ใช่หลักฐานว่าทุกพฤติกรรมเทียบเท่า 100%

## v1.014 — 2026-10-19

- เมนู Transforms ของ Text แสดง 9 รายการตามหลักฐาน BarTender และคง Transform เพิ่มเติมที่ไฟล์เดิมตั้งค่าไว้
- สลับชนิดข้อมูลแล้วรายการอัปเดต โดยไม่เปลี่ยนลำดับประมวลผลหรือค่าที่บันทึกไว้; ยังไม่รับรองทุกชนิดข้อมูล/ทุก Transform เทียบเท่า 100%

## v1.013 — 2026-10-19

- แก้หน้า Home ไม่ถาม Save จาก draft ของ Editor ที่ซ่อนอยู่ ทั้งการปิดแอปและเริ่มเปิด/สร้างโปรเจกต์
- คงการเตือนงานค้างเมื่อกลับเข้า Editor และไม่ล้างสถานะ draft เพียงเพราะตรวจหน้า Home; เพิ่ม unit และ Electron ตรวจ native close ในโปรไฟล์แยก

## v1.012 — 2026-10-19

- แก้ Properties: เนื้อหาและ Preview ไม่ล้นใต้แถบ Apply / OK / Cancel โดยให้เลื่อนเฉพาะส่วนกลาง
- หัวและปุ่มท้ายหน้าต่างอยู่ครบเมื่อย่อ ขยายเต็มจอ และคืนขนาด; เพิ่ม DOM และ Electron ตรวจกรอบจริง/ปุ่มกดได้ในโปรไฟล์แยก

## v1.011 — 2026-10-19

- แก้เคอร์เซอร์พิมพ์ข้อความให้ชิดขอบตัวอักษรและอยู่ในกรอบเขียว แทนระยะเผื่อท้ายฟอนต์
- คงการพิมพ์ การเลือกข้อความ และ Escape; ล้างเคอร์เซอร์เมื่อปิด editor พร้อมทดสอบ geometry และ Electron ในโปรไฟล์แยก

## v1.010 — 2026-10-18

- หน้า Print แสดง Serial numbers / Copies per serial number โดยตรงเมื่อมีตัวนับ ไม่ต้องติ๊ก Serialized labels เพิ่ม
- เชื่อม Serial Number ใน sidebar กับ source graph และ ledger; Save & bind selected อัปเดต barcode_spec พร้อมข้อความจริง
- Copies ของ serial เดียวกันใช้ค่าเดียวกัน และ Preview ไม่กินเลข; เปิด Print ไม่อ่าน RAW printer media อัตโนมัติ ใช้ค่าที่จำไว้และมีปุ่ม Read from Printer สำหรับ refresh
- เพิ่ม DOM/backend และ Electron flow ตรวจ sidebar → bind barcode → Print → Preview1–10; ไม่ส่งพิมพ์จริง

## v1.009 — 2026-10-18

- แก้ปุ่ม Save ใน Data Source ให้พื้นเขียว ข้อความและ SVG สีขาว ไม่เกิดไอคอนขาวบนพื้นขาว
- คง contrast ขณะ hover และเพิ่ม DOM/Electron ตรวจ computed colors จริง

## v1.008 — 2026-10-18

- เชื่อมจำนวน Serial ใน Print กับ serialization ของ Object Data Sources โดยไม่ต้องมี placeholder field เดิม
- Preview เปลี่ยนเลขตามหน้าและคงศูนย์นำหน้า; copies ต่อ serial ใช้เลขเดียวกัน และ Preview ไม่จองเลข
- เพิ่ม unit/DOM และ Electron runtime ตรวจลำดับ 0001–0010; ยังไม่รับรอง quantity จาก database/source และ parity ทุกตัวเลือกของ BarTender

## v1.007 — 2026-10-18

- เพิ่ม date patterns j/u/U/v/V/w/W/Y และ cc ตามผล formatter DLL จริง พร้อมคง quoted/escaped literals
- คำนวณวันลำดับปีและสัปดาห์จากวันที่ใน timezone ที่เลือก และแยก ISO week-year จากปีปฏิทิน
- เพิ่ม fixture 280 กรณีช่วงข้ามปี/ปีอธิกสุรทิน และ Electron ตรวจ Data Type pattern → preview → prepared print
- ยังไม่ครอบคลุม input parsing, legacy format IDs, @patterns และ locale/calendar ทุกแบบของ BarTender

## v1.006 — 2026-10-18

- เพิ่ม Character Filter: All, Currency, Hexadecimal, ASCII Letters/Alphanumeric และ ISO 646 Invariant พร้อมคง Unicode modes เดิม
- ตัวกรองใหม่เริ่มที่ All ตามหน้าตั้งค่าของ BarTender; เปลี่ยน Allowed Characters แล้ว preview และข้อมูลเตรียมพิมพ์ใช้ผลเดียวกัน
- เพิ่ม fixture จากการเรียก DLL จริง 931 กรณี, unit/DOM regression และ Electron runtime แยกโปรไฟล์
- หลักฐานนี้ครอบคลุม single-character acceptance ของ native data-entry control; ยังไม่รับรอง print-time warnings/order, Input Mask และ regex ของ BarTender ครบทั้งหมด

## v1.005 — 2026-10-18

- รวม Data Type/Transforms ของ barcode ให้ใช้ภายใน Data Sources ลดเมนูซ้ำ และคงค่าจากไฟล์เก่า
- เชื่อม Properties draft/Apply/Cancel, external source IPC, library picker และ preview ผ่านตัวประมวลผลร่วม
- เชื่อม HTTP/CLI และ desktop print กับการเตรียมข้อมูลแบบ async และ durable serialization
- คง binary QR/Data Matrix, HRI และข้อความ Unicode/control/ZPL ผ่าน preview และ output โดยไม่ตัดข้อมูล
- ยังไม่ยืนยันความเทียบเท่า BarTender 100%: native filter/masks, VBScript events/object model, Printer Clock, library variants และ hardware ยังมีช่องว่างตาม docs/reference/data-sources-verification.md
- การ push ยังถูก GitHub ปฏิเสธด้วย 403; ผล unit/runtime ต้องอ่านจากรายงานรอบล่าสุด ไม่ถือเป็นการทดสอบเครื่องพิมพ์จริง

## v1.004 — 2026-10-16

- จุดเหลืองของ barcode อยู่กลางหัวตัวเลขทั้งตอนชิดซ้ายและชิดขวา ไม่ไปติดขอบกรอบ
- ตอนลากจุดเหลือง กรอบเขียวชิดตัวเลขเหมือนตอนไม่ได้ลาก ไม่เว้นช่องว่างจากกล่อง HRI
- ขยาย unit และ Electron HRI drag ให้ตรวจตำแหน่งจุดและกรอบระหว่างลาก
- ตรวจด้วย `npm run test:basic`

## v1.003 — 2026-10-16

- ใส่เงาให้กระดาษ preview สีขาวบนพื้น workspace
- เพิ่ม unit `preview-paper-shadow.test.js`
- ตรวจด้วย `npm run test:basic`

## v1.002 — 2026-10-16

- ย้ายจุดเหลืองของ barcode ไปอยู่บนหัวตัวเลขที่อ่านได้ แทนจุดกึ่งกลางตัวอักษร
- เพิ่ม unit ตรวจตำแหน่งจุดเหลืองจากขอบบนของ glyph
- ตรวจด้วย `npm run test:basic`

## v1.001 — 2026-10-16

- แก้ตอนยึด/ขยาย barcode แล้วตัวเลขใต้แท่งถูกยืดตาม: ชดเชยทั้งแกน X และ Y บนกลุ่ม HRI ระหว่าง preview และห่อข้อความ barcode แบบ styled image ด้วย `data-barcode-hri`
- ขยาย unit ใน `svg-selection-handles.test.js` ให้ตรวจ counter-scale แบบไม่สม่ำเสมอ
- ตรวจด้วย `npm run test:basic`; ความลื่นบนจอจริงยังขึ้นกับฉาก

## v1.000 — 2026-10-16

- ลากจุดเหลืองของ barcode เพื่อจัดตัวเลขชิดซ้าย/กลาง/ขวา พร้อมเลื่อนขึ้น–ลงได้; hover เป็น cursor 4 ทิศ และจุดเหลืองยังแสดงระหว่างลาก
- ใช้ hri_align ร่วมกับ preview และ ZPL; เพิ่ม unit และ Electron runtime ตรวจ barcode 4 ชนิด, Undo/Redo และคำสั่งจัดชิด โดยไม่มีการส่งงานพิมพ์จริง
- ปรับการแสดงเลขเวอร์ชันให้คงทศนิยมสามตำแหน่งเมื่อขึ้น v1.000
- ข้อจำกัดการตรวจ: basic 519 tests ผ่าน; HRI runtime ผ่านหลัง retry แต่ benchmark การลากทั่วไปยังไม่ผ่าน display-frame budget จึงไม่ยืนยันอัตราเฟรมตามจอ

## v0.999 — 2026-10-16

- แยกเนื้อหา Settings ให้เลื่อนภายในส่วนของตัวเอง โดยหัวข้อและปุ่มควบคุมหน้าต่างคงอยู่ด้านบน
- เพิ่ม DOM regression และ Electron runtime ตรวจตำแหน่งหัวข้อเมื่อ scroll, การเข้าถึงเนื้อหาล่างสุด และการปิดหน้าต่างทั้งโหมดปกติ/resize/maximize ด้วย temporary profile; ไม่มีการส่งงานพิมพ์จริง

## v0.998 — 2026-10-16

- ลบเงาวงนอกสีเทาเข้มที่ทำให้การ์ด thumbnail หน้าที่เลือกมีเส้นดำด้านซ้ายและขวา โดยคงกรอบเลือกสีเขียวไว้
- เพิ่ม DOM regression และ Electron assertion ตรวจ selected thumbnail ว่าไม่มีเงาวงนอกและยังมีขอบเขียว; ไม่มีการส่งงานพิมพ์จริง

## v0.997 — 2026-10-16

- ปิดการเลือก option ว่าง Select printer… ใน dropdown หลักและสำเนาของ New Label Setup Wizard โดยเครื่องพิมพ์จริงยังเลือกได้ตามปกติ
- เพิ่ม regression ตรวจ disabled placeholder และการคงเครื่องพิมพ์ที่เลือกไว้ รวม Electron runtime; ไม่มีการส่งงานพิมพ์จริง

## v0.996 — 2026-10-16

- เพิ่ม SVG ลูกศรขวาใน Next และลูกศรซ้ายใน Back ของ Connect label data โดย Next ใช้ไอคอนสีขาวบนปุ่มเขียวและคงขนาด 16px
- เพิ่ม DOM regression ตรวจไอคอนหลังเปลี่ยนขั้นตอน และ Electron runtime ตรวจสี/ขนาดจริงรวมการกด Next → Back ด้วย temporary profile; ไม่มีการส่งงานพิมพ์จริง

## v0.995 — 2026-10-16

- เพิ่ม SVG reload สีขาวขนาด 16px ในปุ่ม Reload application พร้อมเว้นระยะจากข้อความและกำหนดขนาดคงที่
- แก้เส้นทาง Print History ที่ยังทำให้ startup ล้มด้วย Invalid image bitmap เมื่อ thumbnail ต้องวาด image ที่ข้อมูลขาดหรือเสีย ใช้ placeholder ในภาพประวัติโดยคงข้อมูลต้นฉบับและการตรวจ print/export
- เพิ่ม regression สำหรับ Print History และ full startup แบบ isolated profile รวมการตรวจ SVG บนปุ่มเขียวด้วย Chromium; ไม่มีการส่งงานพิมพ์จริง

## v0.994 — 2026-10-16

- แก้ workspace เปิดไม่สำเร็จเมื่อไฟล์งานมี image/background bitmap เสีย โดย editor แสดง placeholder ให้แทนภาพและเก็บข้อมูลเดิมไว้สำหรับแทนที่หรือลบ
- คงการตรวจเข้มสำหรับ print/export เพื่อไม่ส่ง bitmap เสียออกไป และเพิ่ม regression ทั้งภาพ รายละเอียดขนาด การคงข้อมูล และ bitmap limits
- `npm run test:basic` ผ่าน 513 tests; Electron runtime ตรวจ corrupt image และ artwork อื่นผ่าน แต่ `test/runtime-ui.js` หยุดภายหลังที่ Help SVG assertion ที่มีอยู่ (`Help actions use keyboard and information SVG icons`); ไม่มีการส่งงานพิมพ์จริง

## v0.993 — 2026-10-16

- แก้การเลื่อนล้อเมาส์ระหว่างกดปุ่มกลางค้าง ไม่ให้สั่ง pan/zoom ซ้อนกับการลากกระดาษ ซึ่งทำให้ preview ดูเหมือนกระดาษสั้นหรือถูกย่อ
- เพิ่ม regression สำหรับช่วงเริ่ม/จบ middle-button pan และการกลับมาใช้ wheel ตามปกติหลังปล่อยปุ่ม
- Electron runtime assertion สำหรับ middle-button + wheel ผ่าน โดยตรวจขนาดและสัดส่วนกระดาษ; `test/runtime-ui.js` หยุดภายหลังที่ assertion เดิมเรื่อง Help SVG (`Help actions use keyboard and information SVG icons`)
- รัน `npm run test:basic`; ไม่มีการส่งงานพิมพ์จริง

## v0.992 — 2026-10-16

- แก้ช่อง Width/Height ให้ยอมรับความละเอียดตามทศนิยมที่แสดง เช่น `2.0079 in` และ `0.9843 in` แทน step 0.01 ที่ทำให้ browser ปฏิเสธค่า
- เพิ่ม regression ตรวจ step ของช่องทั้งสองและการแปลงกลับเป็นขนาด mm สี่ตำแหน่ง
- รัน `npm run test:basic`; ไม่มีการส่งงานพิมพ์จริง

## v0.991 — 2026-10-16

- เพิ่มคีย์ลัดในเมนูหน้าฉลาก: `Ctrl+X` ตัดหน้า, `F2` เปลี่ยนชื่อ และ `Alt+Enter` เปิด Properties ไปยัง Page Setup > Templates
- แสดงป้ายคีย์ลัดและประกาศ shortcut ผ่าน `aria-keyshortcuts`; เพิ่ม regression ตรวจการทำงานจริงและกรณีห้ามตัดหน้าสุดท้าย
- รัน `npm run test:basic`; ไม่มีการส่งงานพิมพ์จริง

## v0.990 — 2026-10-16

- แก้ startup error panel ที่ถูก Ribbon บัง โดยแสดงข้อความ exception ใน overlay เหนือ workspace พร้อมปุ่ม Reload
- เพิ่ม DOM regression ให้ตรวจตำแหน่ง การเข้าถึงด้วย screen reader และข้อความ error ที่เห็นได้
- `npm run test:basic` รันในขั้นตรวจสอบ; ยังไม่สามารถยืนยันสาเหตุ exception ที่ทำให้ startup ล้มเหลวจากภาพที่แนบเพียงอย่างเดียว

## v0.989 — 2026-10-16

- ปรับไอคอน Properties ในเมนูหน้าฉลากเป็น sliders SVG ที่อ่านง่ายขึ้นเมื่อแสดงขนาดเล็ก
- เพิ่ม regression ตรวจ SVG และปุ่มปรับสามจุดของไอคอนจากเมนูที่ render จริง
- รัน `npm run test:basic`; ไม่มีการส่งงานพิมพ์จริง

## v0.988 — 2026-10-16

- เอาคำสั่ง Print ออกจาก Home tools ใน object context dropdown; คำสั่ง Print ใน Ribbon กลุ่ม Action ยังคงอยู่
- เพิ่ม regression ให้ตรวจว่า context menu ไม่แสดง Print และยังแสดงคำสั่งจัดวัตถุอื่นตามเดิม
- การเปลี่ยนแปลงนี้ไม่แตะเส้นทางพิมพ์; ไม่ได้ส่งงานพิมพ์จริง

## v0.987 — 2026-10-16

- เพิ่มขั้น Stock Selection ใน New Label Wizard พร้อม catalog 7,350 stocks จาก `D:\Programs\mfg.stk` ครอบคลุม 54 manufacturers; เลือกหมวด/stock แล้วเติมขนาดกระดาษ ฉลาก ขอบ ระยะห่าง จำนวนแถว/คอลัมน์ และแนววาง โดยเก็บความละเอียดของค่ามิลลิเมตร
- แก้ Next ที่ถูกบล็อกเมื่อ renderer ใช้กับ main process รุ่นเก่าซึ่งไม่มี printer DPI handler: อนุญาตใช้ nominal DPI เมื่อชื่อ printer queue ระบุค่าไว้ และแสดงข้อความให้ restart เพื่ออ่านค่าจริงจาก driver; ไม่เดาค่าเมื่อชื่อ queue ไม่มี DPI
- เพิ่ม unit regression และปรับ Electron runtime check; การทดสอบ runtime ใช้ข้อมูลแยก ไม่ส่งพิมพ์จริง
- ข้อจำกัด: DPI จากชื่อ queue เป็นค่า nominal ชั่วคราว ไม่ยืนยันค่าที่ driver รายงาน; ต้อง restart Q LABEL เพื่อใช้ driver DPI จริง

## v0.986 — 2026-10-16

- เปลี่ยนกรณี main process รุ่นเก่ายังไม่มี printer-resolution IPC จากแถบ error สีแดงเป็นข้อความแจ้งวิธีแก้แบบปกติ; ยังคงบล็อกการสร้าง label จนอ่าน DPI จาก driver ได้ และไม่เดาค่า DPI
- เพิ่ม regression test สำหรับ notice ใน bridge และ New Label Wizard; ปรับ Electron runtime assertion และ checklist
- ข้อจำกัด: เมื่อ handler ยังไม่มีใน main process ที่กำลังทำงาน จำเป็นต้องบันทึกงานและเปิด Q LABEL ใหม่หนึ่งครั้ง; การอ่าน DPI อัตโนมัติทำงานเมื่อ main process รุ่นปัจจุบันเริ่มทำงาน

## v0.985 — 2026-10-16

- แก้ป้ายขนาดเส้น/ช่องตารางที่เคลื่อนตามเมาส์ ให้ยึดจุดเริ่มลากขณะค่าตัวเลขยังอัปเดตตามการปรับขนาด และย้ายจุดยึดใหม่เมื่อเริ่ม gesture ถัดไป
- เพิ่ม DOM unit regression และ Electron runtime ตรวจการลากปรับความหนาเส้น; อัปเดต checklist/inventory
- `npm run test:basic`: unit 502 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- Electron `test/picture-home-runtime.js`: ผ่าน 13 checks รวมป้ายค่าตรึงตำแหน่งขณะตัวเลขเปลี่ยนและซ่อนเมื่อจบ gesture; appData แยก; มี GPU state warning หลัง PASS; `git diff --check` ผ่าน
- ไม่ได้ส่งงานพิมพ์จริง; ไม่เกี่ยวกับการแก้ไขนี้

## v0.984 — 2026-10-16

- เปลี่ยนปุ่มลด/เพิ่มขนาดฟอนต์ใน compact ribbon จากเครื่องหมายเป็น SVG ลูกศรขึ้น/ลง โดยคงการเปลี่ยนค่าครั้งละ 1 pt
- เพิ่มปุ่ม Print พร้อม SVG ในกลุ่ม Action ของ Home และเชื่อมกับหน้าพิมพ์เดิม
- เพิ่ม unit tests สำหรับ SVG และ Electron runtime ตรวจการเรียกหน้าพิมพ์โดยไม่ส่งงานจริง รวมถึงการเพิ่ม/ลด 1 pt; อัปเดต checklist/inventory
- `npm run test:basic`: unit 501 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`; ไม่ได้ทดสอบเครื่องพิมพ์จริง
- Electron `test/home-action-icons-runtime.js` ผ่าน: Action Print เรียก dialog เดิม, SVG up/down คงพฤติกรรม 12→13→12 pt; ไม่มีการส่งงานพิมพ์จริง

## v0.983 — 2026-10-16

- แก้ Rectangle และวัตถุ SVG ที่มีเส้นขอบพองจนปิดพื้นที่ canvas ระหว่างลาก resize โดยคง stroke width เดิมพร้อม non-scaling-stroke แทนการคูณด้วย canvas scale
- เพิ่ม regression unit ตรวจหลายระดับ zoom และ Electron runtime ตรวจ resize Rectangle พร้อม stroke, marker และ toolbar ก่อน/หลัง commit; อัปเดต checklist
- `npm run test:basic`: unit 499 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `node --test test/svg-selection-handles.test.js`: 12 ผ่าน, 0 ล้มเหลว/ข้าม; Electron `test/svg-selection-bounds-runtime.js` ผ่าน Rectangle resize, stroke 0.3 คงเดิมทั้ง preview/commit, marker/toolbar และ barcode gestures; `git diff --check` ผ่าน; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.982 — 2026-10-16

- ลบขีด tick สีเข้มใต้ตัวเลขพิกัดนอกกระดาษในไม้บรรทัด โดยคงพื้นโปร่งใสนอกกระดาษและไม่ลบพื้นส่วนที่ซ้อนกับกระดาษ
- เพิ่ม canvas unit regression สำหรับแกน X/Y และตำแหน่งป้ายที่คร่อมขอบกระดาษ; เพิ่ม Electron pixel assertion และอัปเดต inventory/checklist
- `npm run test:basic`: unit 499 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `node --test test/svg-selection-handles.test.js`: 12 ผ่าน, 0 ล้มเหลว/ข้าม; Electron `test/svg-selection-bounds-runtime.js` ผ่าน Rectangle resize, stroke 0.3 คงเดิมทั้ง preview/commit, marker/toolbar และ barcode gestures; `git diff --check` ผ่าน; ไม่ได้ทดสอบเครื่องพิมพ์จริง
- Electron `npx electron test/ruler-appearance-runtime.js`: ผ่าน pixel checks 110 ตัวอย่างทั้งแกน X/Y ในหน่วย in/mm/dots ที่ devicePixelRatio 2, ไม่พบ tick มืดทับตัวเลขนอกกระดาษ; ใช้ appData แยก ไม่พิมพ์จริง
- `git diff --check`: ผ่าน; coverage gaps ทั้งระบบที่บันทึกไว้ยังเปิดอยู่

## v0.981 — 2026-10-16

- เปลี่ยนแถบหัวของ New Label Setup Wizard เป็นสีเขียว พร้อมกรอบสีเขียวเข้มให้เข้าชุดกัน
- เพิ่ม DOM regression ใน `test/project-home.test.js` ตรวจสีแถบและกรอบ; อัปเดต inventory และ checklist
- รัน `npm run test:basic` และตรวจ `git diff --check` ตามนโยบาย; ผลอยู่ใน `test/basic-unit-result.json` และ `test/basic-unit-output.log`

## v0.980 — 2026-10-16

- ระบุกรณี main process เก่าที่ไม่มี `get-printer-resolution` หลัง renderer hot reload และแจ้งให้บันทึกงานแล้วเริ่ม Q LABEL ใหม่หนึ่งครั้ง แทนแสดง raw Electron IPC error; ไม่ใช้ DPI สมมติหรือเพิ่มตัวเลือก DPI
- handler ใน main process ปัจจุบันมีอยู่แล้ว; ตรวจการเปิด process ใหม่ให้อ่าน DPI จาก Windows driver จริง และเพิ่ม regression จำลอง handler หาย
- อัปเดต checklist/inventory; `npm run test:basic`: 498 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน; inventory ขาด 0. รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- Electron `test/printer-resolution-runtime.js` ผ่าน: Zebra driver รายงาน 608 dpi, wizard รับค่าอัตโนมัติ และจำลอง handler หายแล้วได้คำแนะนำ restart; ใช้ appData แยก ไม่ส่งพิมพ์ (มี expected missing-handler log จาก fixture และ GPU warning หลัง PASS)
- `git diff --check` ผ่าน; แอปที่เปิดตั้งแต่ก่อนเพิ่ม handler ต้องบันทึกงานและปิด–เปิดใหม่หนึ่งครั้ง การ reload renderer ไม่อัปเดต main process; coverage gaps เดิมยังเปิดอยู่

## v0.979 — 2026-10-16

- เพิ่มวงขอบสีเขียวรอบปุ่มปรับความหนาเส้นเมื่อ hover ให้เหมือนปุ่มปรับมุมโค้ง; ซ่อนวงเมื่อออกจากปุ่มหรือกลับไปที่ canvas
- เพิ่ม DOM regression และ Electron `test/picture-home-runtime.js` ตรวจวงขอบ 2px ตอน hover พร้อมการซ่อนหลังออก; อัปเดต checklist และ inventory
- `npm run test:basic`: unit 496 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- Electron `npx electron test/picture-home-runtime.js`: ผ่าน รวมวงขอบเขียวตอน hover และซ่อนเมื่อออก; profile ทดสอบแยก (มี GPU state warning หลัง PASS)
- `git diff --check`: ผ่าน มีคำเตือน LF/CRLF; coverage gaps ทั้งระบบที่บันทึกใน checklist ยังเปิดอยู่

## v0.978 — 2026-10-16

- แก้ preview ระหว่างย่อ/ขยายไม่ให้ความหนาเส้นขอบของ object เปลี่ยนตาม matrix ยืด/บีบ และคืนค่า SVG หลังจบ gesture
- ชดเชยขนาด marker, hit target และ toolbar ตามแกน resize โดยยังให้จุดควบคุมติดตามตำแหน่งกรอบ object
- เพิ่ม DOM regression ใน `test/svg-selection-handles.test.js` และ Electron runtime ใน `test/svg-selection-bounds-runtime.js`; อัปเดต inventory, checklist แถว 07 และ runtime matrix
- `npm run test:basic`: unit 495 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน; inventory ขาด 0. รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npm run test:gestures`: unit 44 ผ่าน, 0 ล้มเหลว, 0 ข้าม; Electron gesture runtime ผ่าน resize/move รวม 7 scenarios ที่จอจำลอง 120 Hz
- Electron `npx electron test/svg-selection-bounds-runtime.js`: ผ่าน 2 รอบ; Rectangle resize คง marker 10×10px, toolbar 108×36px และเส้น 0.3 ระหว่าง preview/หลัง commit; ตรวจ barcode regressions เดิมครบด้วย appData ชั่วคราว (รอบแรกมี assertion เดิมเรื่อง barcode height ไม่ผ่านชั่วคราว ก่อน rerun ผ่าน)
- `git diff --check`: ผ่าน; มีคำเตือน LF/CRLF จาก working tree; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.977 — 2026-10-16

- ปรับปุ่ม `Snap to grid` ไม่ให้มีกรอบเขียวหรือ outline ค้างจากสถานะ active/click; กรอบสีเขียวแสดงเฉพาะตอน hover
- เพิ่ม DOM regression ใน `test/ribbon-availability.test.js` และ Electron runtime `test/snap-grid-border-runtime.js`; อัปเดต checklist แถว 18 และ runtime matrix
- `npm run test:basic`: 493 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- Electron `npx electron test/snap-grid-border-runtime.js`: ผ่าน; active/focus ไม่มีกรอบและ hover แสดงกรอบเขียว; ใช้ appData ชั่วคราว (มี GPU state warning หลัง PASS)
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง line endings LF/CRLF

## v0.976 — 2026-10-16

- แก้ไอคอน SVG ของเมนู `Add blank page` ที่ว่าง เพราะไม่มี artwork สำหรับคำสั่ง Add Page; ตอนนี้แสดงไอคอนหน้าเอกสารพร้อมเครื่องหมายบวก
- เพิ่ม regression ใน `test/template-pages.test.js` และ Electron `test/template-navbar-size-runtime.js`; checklist แถว 05 ครอบคลุม SVG ของทั้ง Add และ Duplicate
- `npm run test:basic`: 492 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- Electron `npx electron test/template-navbar-size-runtime.js`: ผ่าน; ไอคอนเมนูทั้งสองมี SVG artwork; ใช้ appData ชั่วคราว
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง line endings LF/CRLF

## v0.975 — 2026-10-16

- แก้การยืด barcode ตามแกน Y ระหว่างลากให้คงขนาดตัวเลข HRI และให้ตำแหน่งตามปลายแท่งทั้ง preview และหลังปล่อยเมาส์
- เพิ่ม unit regression สำหรับการชดเชย SVG รวมถึง resize ที่วัตถุหมุน และ Electron runtime ที่วัดขนาด/ระยะ HRI ระหว่างลากกับหลัง commit; อัปเดต checklist, inventory และ runtime matrix
- `npm run test:basic`: 492 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/svg-selection-bounds-runtime.js`: ผ่าน; HRI ระหว่างลากสูง 38.86px เทียบเดิม 39px และช่องว่างเปลี่ยน 0.08px; หลังปล่อยสูง 39px และช่องว่างกลับค่าตั้งต้น; appData ชั่วคราว
- ข้อจำกัด: เครื่องมือควบคุมเดสก์ท็อปไม่พบหน้าต่างแอป (`apps: []`) จึงไม่ได้รีโหลดหน้าต่างผู้ใช้; runtime ตรวจด้วย Electron fixture และ appData แยก
- `git diff --check`: ผ่าน

## v0.974 — 2026-10-16

- ขยับปุ่มปรับมุมโค้งของรูปและกรอบให้ห่างจุดมุมวัตถุ ป้องกันการชนกับ marker ของกรอบเลือก
- เพิ่มกรอบ hover สีเขียวให้ปุ่มหมุนและย้าย รองรับ mouse/pen และไม่ตอบสนอง touch compatibility hover
- เพิ่ม regression ใน `test/line-controls.test.js` และ Electron `test/picture-home-runtime.js`; อัปเดต checklist และ inventory
- `npm run test:basic`: 490 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/picture-home-runtime.js`: ผ่าน; ช่องว่างจาก marker NW ประมาณ 6px และปุ่มหมุนมีกรอบ hover สีเขียว; ใช้ appData ชั่วคราว (Electron แสดง GPU state warning หลังจบ)
- `git diff --check`: ผ่าน

## v0.973 — 2026-10-16

- แท็บ Home, Insert, Layout, Picture, Data, View, Tools และ Help สลับ panel เมื่อเมาส์หรือปากกา hover; ยังคงคลิกและ native keyboard activation พร้อมละเว้น touch compatibility hover
- เพิ่ม DOM regression ใน `test/ribbon-availability.test.js` และ Electron runtime ใน `test/ribbon-availability-runtime.js` ตรวจ mouse/pen/touch และ click; อัปเดต inventory, checklist แถว 18 และ runtime matrix
- `npm run test:basic`: 489 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`; รอบแรกพบ ACE child-process error ชั่วคราว แต่ isolated Access test และ suite ที่รันซ้ำผ่าน
- `npx electron test/ribbon-availability-runtime.js`: ผ่าน; ตรวจ mouse/pen hover, touch hover ที่ไม่สลับแท็บ, click, คำสั่ง disabled และ File dropdown ด้วย appData ชั่วคราว (มี Electron CSP warning ใน test harness)
- `git diff --check`: ผ่าน
## v0.972 — 2026-10-16

- ป้ายองศาระหว่างลากหมุนแสดงมุมปัจจุบันเป็นเลขเต็มและอัปเดตทุกองศา; กติกา magnetic snap, Shift snap และเส้น snap guide คงเดิม
- เพิ่ม DOM regression ใน `test/svg-selection-handles.test.js` สำหรับการปัด/อัปเดต 14°, 15°, 16°; เพิ่ม Electron runtime ใน `test/svg-selection-bounds-runtime.js` ตรวจป้ายระหว่างหมุนอิสระและ snap พร้อมการกลับ 0°; อัปเดต checklist แถว 07
- `npm run test:basic`: 488 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`; `npx electron test/svg-selection-bounds-runtime.js`: ผ่านด้วย appData ชั่วคราว
- `git diff --check`: ผ่าน
## v0.971 — 2026-10-16

- แก้ไฮไลต์แดงที่แจ้ง object ล้นขอบกระดาษให้อัปเดต path และสถานะทุกครั้งระหว่าง preview หมุน; เมื่อ object กลับมาอยู่ในขอบเขตแล้วไฮไลต์จะซ่อน
- เพิ่ม regression unit ใน `test/svg-selection-handles.test.js` และเพิ่มกรณี live rotation เข้า/ออกขอบกระดาษใน Electron `test/svg-selection-bounds-runtime.js`; อัปเดต checklist และ runtime matrix
- `npm run test:basic`: unit 487 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`; log มีคำเตือน `csstree-match` สองครั้งจาก CSS parsing แต่ไม่มี test fail
- `npx electron test/svg-selection-bounds-runtime.js`: ผ่าน; หมุนบาร์โค้ด live เป็น 345° แล้ว path/สถานะไฮไลต์ตามทัน และซ่อนเมื่อคืนมุมเดิม; ใช้ appData ชั่วคราว
- `git diff --check`: ตรวจแล้ว; Electron มี GPU state warning หลัง PASS และ exit 0; ไม่ได้ทดสอบกับเครื่องพิมพ์จริง

## v0.970 — 2026-10-16

- ปรับชื่อโปรเจกต์ในแถบด้านบนให้ขยายใช้พื้นที่ว่างระหว่างปุ่ม Quick Access กับช่อง Search โดยเว้นระยะ 8px; เมื่อหน้าต่างแคบหรือชื่อยาวจะแสดง ellipsis และคำนวณพื้นที่ใหม่เมื่อ resize
- เพิ่ม unit regression ใน `test/ribbon-availability.test.js` และ Electron runtime `test/ribbon-title-layout-runtime.js`; อัปเดต inventory, checklist และ runtime matrix
- `npm run test:basic`: unit 486 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/ribbon-title-layout-runtime.js`: ผ่าน; ชื่อยาวใช้พื้นที่ 352px ที่หน้าต่าง 1400px และ 108px ที่ 900px พร้อมเว้น 8px ก่อน Search ใน appData ชั่วคราว
- `git diff --check`: ตรวจหลังแก้; ไม่ได้ทดสอบกับเครื่องพิมพ์จริงหรือเมาส์จริง

## v0.969 — 2026-10-16

- เพิ่มปุ่ม Show gap / Hide gap ในแท็บ View; เริ่มต้นซ่อน และเปิดดูแถบช่องว่างระหว่างฉลากตามค่า page layout บน canvas ได้ โดยไม่เปลี่ยนขนาด ระยะ หรือข้อมูลพิมพ์; ปุ่มจะ disabled เมื่อไม่มี gap ให้แสดง และลูกศรวัด gap ใน Page Setup ยังทำงานตามเดิม
- เพิ่ม unit regression ใน `test/page-gap.test.js` และ Electron runtime check ใน `test/page-gap-runtime.js`; อัปเดต inventory, checklist แถว 09 และ runtime matrix
- `npm run test:basic`: 485 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; Electron runtime ผ่าน
- ข้อจำกัด: ตรวจ renderer ด้วย Electron และข้อมูล appData ชั่วคราว; ไม่ได้ทดสอบเมาส์จริงหรือพิมพ์กับเครื่องพิมพ์จริง

## v0.968 — 2026-10-16

- แก้ CSS ของ New Label Wizard ให้ SVG ไอคอนในปุ่มไม่ถูกขยายเต็มความกว้าง จึงไม่บีบข้อความ Cancel/Back/Next/Finish เป็นแนวตั้ง; SVG preview ยังคงเต็มพื้นที่แสดงผล
- เพิ่ม regression ใน `test/project-home.test.js` สำหรับขนาดไอคอน 16px, label แนวนอน และ preview เต็ม panel; อัปเดต checklist แถว 18
- `npm run test:basic`: รันครบตามนโยบาย; ผลจริงและจำนวน pass/fail/skip อยู่ใน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- Electron `npx electron test/runtime-ui.js`: wizard footer ที่ความกว้าง 440px ผ่านพร้อม icon 16px และ label อยู่บรรทัดเดียว; script ไป fail ภายหลังที่ Help icon assertion เดิมซึ่งไม่เกี่ยวกับ wizard
- `git diff --check`: ผ่าน; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.967 — 2026-10-16

- เอาแถว Resolution ออกจากขั้นเลือกเครื่องพิมพ์และหน้าสรุปใน New Label Wizard; ระบบยังอ่าน DPI จาก driver และบันทึกให้ template อัตโนมัติ
- เพิ่ม regression ให้ยืนยันว่าไม่มีแถว Resolution, DPI จาก driver ยังถูกบันทึก, stale response ไม่ทับค่าใหม่ และเมื่อ driver รายงาน DPI ไม่ได้ยังแสดง error พร้อมบล็อกการไปต่อ
- `npm run test:basic`: unit 483 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy scripts ผ่าน 3/3, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/printer-resolution-runtime.js`: ผ่าน; อ่าน DPI 608 จาก Zebra ZT411 ผ่าน renderer IPC, ยืนยันว่า UI ไม่มี Resolution และยังมี Printer language ด้วย appData ชั่วคราว; ไม่ได้ส่งงานพิมพ์
- ไม่ได้ทดสอบพิมพ์กับเครื่องพิมพ์จริง

## v0.966 — 2026-10-16

- แก้ object `Inverse` ให้กลับสี artwork ที่วางอยู่ด้านบนเฉพาะบริเวณที่ทับกัน โดยคงพื้นดำของ Inverse และ artwork ด้านนอกไว้ตามเดิม
- เพิ่ม DOM regression และ Electron pixel runtime check; อัปเดต inventory และ checklist แถว 17
- `npm run test:basic`: unit 483 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy scripts ผ่าน 3/3, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/inverse-rendering-runtime.js`: ผ่าน; ตรวจพิกเซลตัวอักษรกลับเป็นสีขาว 355 จุด, ข้อความนอกพื้นที่ยังดำ 526 จุด และพื้น Inverse ยังดำ 64 จุด ด้วย appData ชั่วคราว; รายงาน `test-results/inverse-rendering-runtime.json`
- `git diff --check`: ตรวจหลังแก้; ไม่ได้ทดสอบกับเครื่องพิมพ์จริง และไม่ได้รีโหลด renderer ในหน้าต่างผู้ใช้เพราะ session นี้ไม่มี native UI control

## v0.965 — 2026-10-16

- แก้พื้นที่รับ pointer ของจุดเหลือง HRI ที่ทับ handle สีขาวล่าง ทำให้ลาก handle ล่างแล้วปรับเฉพาะความสูงแท่ง barcode; จุดเหลืองยังเลื่อนตำแหน่งตัวเลขโดยไม่เปลี่ยนความสูงแท่ง
- เพิ่ม regression ทุก zoom สำหรับขนาด hit target 4px และ Electron drag test ยืนยันว่า handle ล่างเพิ่มความสูงแท่งโดยไม่เปลี่ยน HRI offset; จุดเหลืองปรับ HRI offset โดยไม่เปลี่ยนความสูงแท่ง; อัปเดต checklist/inventory
- `npm run test:basic`: unit 482 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy scripts ผ่าน 3/3, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/svg-selection-bounds-runtime.js`: ผ่าน; ทดสอบ drag pointer แยก handle ล่าง, HRI, NW, rotate และ move ด้วย appData ชั่วคราว ไม่ส่งงานพิมพ์
- `git diff --check`: ผ่านพร้อมคำเตือนมาตรฐาน LF/CRLF; ไม่ได้ทดสอบพิมพ์กับเครื่องพิมพ์จริง

## v0.964 — 2026-10-16

- แก้ปุ่ม Cancel/Back/Next/Finish ใน New Label Wizard ให้แบ่งความกว้างตามแถวและขึ้นบรรทัดใหม่เมื่อหน้าต่างแคบ เพื่อให้ข้อความและไอคอนอยู่ภายในปุ่ม
- เพิ่ม regression DOM ใน `test/project-home.test.js` และ Electron runtime ตรวจขอบเขตไอคอน/ข้อความที่ความกว้าง 440px; ปรับ checklist และ inventory
- `npm run test:basic`: unit 482 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy scripts ผ่าน 3/3, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/runtime-ui.js`: assertion footer ที่ 440px ผ่าน และ 18 assertions ก่อนหน้าผ่าน; สคริปต์หยุดที่ Help SVG assertion ซึ่งอยู่นอกขอบเขตการแก้ไขนี้
- `git diff --check`: ผ่านพร้อมคำเตือนมาตรฐาน LF/CRLF; รีโหลดหน้าต่าง Q LABEL เดิมแล้วเป็น v0.964; ไม่ได้ทดสอบพิมพ์กับเครื่องพิมพ์จริง

## v0.963 — 2026-10-16

- แก้กรอบเลือกสีเขียว `.sel` หายระหว่างลากจุดสีเหลือง HRI ของ barcode: เมื่อ redraw controls จะสร้างกรอบ selection กลับมาพร้อมตำแหน่งและมุมหมุนของ object; คงการปรับตำแหน่ง HRI และ controls อื่นตามเดิม
- เพิ่ม DOM regression ใน `test/svg-selection-handles.test.js` และ Electron runtime assertion ระหว่าง pointermove ใน `test/svg-selection-bounds-runtime.js`; ปรับ checklist/inventory ให้ระบุพฤติกรรมระหว่างลาก
- `npm run test:basic`: 482 passed, 0 failed, 0 skipped จาก 56 ไฟล์ unit; legacy scripts ผ่าน 3/3, inventory gap 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/svg-selection-bounds-runtime.js`: ผ่าน; ตรวจกรอบสีเขียวยังอยู่ระหว่าง HRI pointer gesture พร้อมยืนยัน resize/rotate/move และใช้ appData ชั่วคราว
- `git diff --check`: ผ่าน มีคำเตือนมาตรฐานเรื่อง LF/CRLF; ไม่ได้ทดสอบการพิมพ์กับฮาร์ดแวร์จริง

## v0.962 — 2026-10-16

- นำ dropdown Resolution 203/300/600 dpi ออกจาก New Label Wizard; แสดงค่า DPI แบบอ่านอย่างเดียวจาก `Win32_PrinterConfiguration` ของเครื่องพิมพ์ที่เลือก และบันทึกลง template ที่สร้าง
- ถ้า driver ไม่มี DPI แนวนอน/แนวตั้งที่ถูกต้องและตรงกัน จะแสดงสาเหตุและปิดกั้นการไปต่อ; การเปลี่ยนเครื่องพิมพ์จะไม่รับค่าตอบกลับเก่ามาทับ
- เพิ่ม `test/printer-resolution.test.js` และ checklist สำหรับการอ่านค่า driver, validation, error path และการบันทึก template
- `npm run test:basic`: 481 passed, 0 failed, 0 skipped จาก 56 ไฟล์ unit; legacy scripts ผ่าน 3/3, inventory gap 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/printer-resolution-runtime.js`: ผ่าน โดย renderer IPC อ่านค่า 608 DPI จาก Zebra ZT610 และยืนยันว่า Wizard แสดงเป็นค่าที่แก้ไม่ได้; ใช้ appData ชั่วคราวและไม่ส่งงานพิมพ์จริง
- `git diff --check`: ผ่าน มีคำเตือนมาตรฐานเรื่อง LF/CRLF; ไม่ได้ทดสอบการพิมพ์กับฮาร์ดแวร์จริง

## v0.961 — 2026-10-16

- clip grid ให้พอดีกับขอบกระดาษแบบ rounded และ ellipse ทำให้จุดนอกมุมโค้งหายไป โดยคงจุดด้านในกระดาษไว้
- เพิ่ม unit/DOM regression สำหรับรูปร่าง, พิกัดและการจำกัดรัศมี และ Electron pixel check ใน Chromium
- `npm run test:basic`: 476 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory ขาด 0; รายงาน `test/basic-unit-result.json`
- `npx electron test/design-grid-rounded-runtime.js`: ผ่าน; มุมกระดาษไม่มี pixel grid ส่วนจุดด้านในยังแสดง
- `git diff --check`: ผ่าน โดยมีคำเตือนมาตรฐาน LF/CRLF ใน working tree; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.960 — 2026-10-16

- แสดงจุดจับและ hit target สำหรับ resize ที่มุมซ้ายบน/ขวาล่าง ทำให้ object ทุกชนิดที่ใช้กรอบ resize ร่วมกัน รวม table แสดงมุมครบทั้งสี่; line ยังคงใช้ endpoint controls
- เพิ่ม DOM regression ครอบคลุม text, shapes, raster/SVG, barcode, QR และ table; Electron runtime ยืนยันจุดจับ barcode ทั้งสี่และลากมุมซ้ายบนได้
- `npm run test:basic`: 473 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory ขาด 0; รายงาน `test/basic-unit-result.json`
- `npx electron test/svg-selection-bounds-runtime.js`: ผ่าน; ตรวจ marker/hit target มุมทั้งสี่และลาก NW; ใช้ appData ชั่วคราว ไม่พิมพ์งานจริง
- `npm run test:gestures`: unit 44/44 ผ่าน; Electron gesture runtime ผ่านที่จอจำลอง 120 Hz โดยไม่ rebuild/bake ระหว่างลาก; ไม่ใช่การวัดจอจริง
- `git diff --check`: ผ่าน; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.959 — 2026-10-16

- เพิ่มตัวเลือก outline Solid, Dot, Dash และ Erase ใน Ribbon และเมนูคลิกขวา; Erase ซ่อนเฉพาะเส้นและคง fill ไว้
- ให้ SVG/raster preview และ export ใช้รูปแบบเส้นเดียวกัน รวมถึง custom shapes และ table borders; Erase ไม่ส่งเส้นไป ZPL และ outline style บันทึก/ย้อนใน edit history ได้
- เพิ่ม regression สำหรับตัวเลือก, fill, export, ZPL และ undo/redo; `npm run test:basic`: 472 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory ขาด 0
- `git diff --check` ผ่าน; ใช้ DOM/canvas unit tests ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.958 — 2026-10-16

- แสดงจุดจับ HRI สีเหลืองเมื่อเลือก barcode และซ่อนระหว่างลากวัตถุ
- ปรับพื้นที่รับลาก HRI ให้คงรัศมี 12px ทุก zoom ป้องกันพื้นที่โปร่งใสขนาดใหญ่ทับปุ่มหมุน/ย้าย
- เพิ่ม DOM regression สำหรับ visibility/ขนาด hit target และ Electron hit-test/drag assertions สำหรับ HRI, หมุน และย้าย
- `npm run test:basic`: 471 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0
- Electron `test/svg-selection-bounds-runtime.js`: ผ่าน hit-test/drag สำหรับ HRI, rotate และ move; ไม่ได้ทดสอบเมาส์จริงหรือเครื่องพิมพ์
- `git diff --check` ผ่าน; Electron `test/picture-home-runtime.js` ยังมี assertion เก่าที่ fail เรื่อง Home context tools ซึ่งไม่เกี่ยวกับงานนี้

## v0.957 — 2026-10-16

- แก้ dropdown Line style ใน object context menu ให้มีพื้นที่พอสำหรับความกว้าง 90px และเว้นช่องไฟก่อนข้อความ `Line` จึงไม่ทับกัน
- เพิ่ม DOM regression คำนวณระยะห่างระหว่าง dropdown กับ hint ใน context menu; คง Electron runtime check ของ Ribbon ไว้
- `npm run test:basic`: unit 469 passed, 0 failed, 0 skipped; legacy basic scripts 3/3 ผ่าน; inventory ขาด 0
- `electron test/formatting-line-spacing-runtime.js`: ผ่าน; Ribbon มี clearance 11px ส่วน grid ของ context menu ผ่าน DOM geometry regression; ไม่ได้ทดสอบเมาส์จริง
- `git diff --check` ผ่าน โดยมีคำเตือนเดิมเรื่อง line ending LF/CRLF ใน working tree; ไม่เกี่ยวกับการพิมพ์จริง

## v0.956 — 2026-10-16

- แก้ให้ปุ่ม Undo/Redo ในแถบ quick access ด้านบน disabled เมื่อไม่มีรายการใน history ของปุ่มนั้น และอัปเดตสถานะพร้อมปุ่มใน Ribbon
- เพิ่ม DOM regression สำหรับ empty/available history แยก Undo/Redo และเพิ่ม Electron runtime assertion ว่าปุ่ม quick access เริ่ม disabled เมื่อ history ว่าง
- `npm run test:basic`: unit 468 passed, 0 failed, 0 skipped; legacy basic scripts 3/3 passed; inventory ขาด 0
- Electron `test/ribbon-history-order-runtime.js`: ผ่าน ยืนยันว่า quick access Undo/Redo disabled เมื่อ history ว่าง พร้อมตรวจ focus behavior เดิม
- `git diff --check` ผ่าน; ไม่เกี่ยวกับการพิมพ์หรือเครื่องพิมพ์จริง

## v0.955 — 2026-10-16

- เพิ่ม carousel ให้ภาพ preview ในการ์ดโปรเจกต์หลายหน้าเปลี่ยนทุก 3 วินาที; โปรเจกต์หน้าเดียวไม่เปลี่ยน และคลิกการ์ดเพื่อเปิดไฟล์ยังทำงานเหมือนเดิม
- เพิ่ม fake-clock regression ครอบคลุม preview หลายหน้า, หน้าเดียว, การวนกลับ, เปิดโปรเจกต์ และล้าง timer เมื่อซ่อน Project Home
- ตรวจ `npm run test:basic`: 467 unit passed, legacy scripts 3/3; Electron `test/runtime-ui.js` ยืนยัน carousel ผ่าน แต่หยุดที่ assertion Help SVG เดิมซึ่งล้มเหลวอยู่นอกขอบเขต

## v0.954 — 2026-10-16

- แก้เมนูเพิ่มหน้าที่ยังค้างเมื่อ pointer กลับจาก dropdown มาที่ปุ่ม +; เมื่อเข้า split control เมนูปิด และ hover ลูกศรไม่เปิดซ้ำจน pointer ออกจาก control
- เพิ่ม regression ใน DOM unit และ Electron runtime เพื่อครอบคลุมการกลับเข้า control, การไม่เปิดซ้ำ และการเปิดใหม่หลัง pointer ออก
- ตรวจด้วย npm run test:basic (466 unit passed, legacy scripts 3/3) และ electron test/template-navbar-size-runtime.js; hover จำลอง ไม่ได้ทดสอบเมาส์จริง
## v0.953 — 2026-10-16

- ทำให้ Snap to grid มีผลขณะลากและปรับขนาด object โดยใช้ Grid Step และ origin ของกระดาษ; เมื่อปิดยังลากอิสระและใช้ precision เดิมของการ resize
- คงการแสดงจุดกริดและ alignment guide แยกจากการตั้งค่า Snap; เพิ่ม unit และ Electron gesture regression
- ข้อจำกัดการตรวจ: gesture ใช้ pointer จำลองใน Electron; ไม่ได้ทดสอบเมาส์จริงหรือเครื่องพิมพ์จริง

## v0.952 — 2026-10-16

- แก้เมนูเพิ่มหน้าให้ปิดทันทีเมื่อ pointer ออกจาก dropdown กลับมายังปุ่ม +; การ hover ปุ่ม + หลักไม่เปิดเมนูซ้ำ ส่วนลูกศรยังเปิดเมนูได้
- เพิ่ม regression ใน DOM unit และ Electron runtime สำหรับการกลับไปที่ +, เปิดใหม่ด้วยลูกศร และย้ายจากลูกศรเข้าเมนู
- ข้อจำกัดการตรวจ: ใช้ pointer events จำลอง ไม่ได้ทดสอบเมาส์จริง

## v0.951 — 2026-10-16

- ปรับเมนูย่อยใน right-click context menu ให้เปิดด้วย hover โดยไม่ต้องคลิก; การคลิก trigger ไม่เปิดหรือ toggle ปิดเมนูที่ hover เปิดแล้ว และคงการเปิดด้วย keyboard ไว้
- เพิ่ม DOM regression สำหรับเมนูตารางและเมนู Layer ของ object; `npm run test:basic` ครอบคลุมทั้งระบบ และ Electron `test/table-row-selection-controls-runtime.js` ตรวจเมนูตารางกับ Layer reorder/undo/redo
- ข้อจำกัดการตรวจ: hover ใช้ event จำลอง ไม่ได้ทดสอบด้วยเมาส์จริง

## v0.950 — 2026-10-16

- แก้เมนูเพิ่มหน้าไม่ให้หายระหว่างลาก pointer กลับจาก dropdown มาที่ปุ่ม +; เมนูคงเปิดเมื่อย้ายระหว่าง trigger กับเมนู และปิดเมื่อออกจากทั้งคู่
- เพิ่ม DOM regression และ Electron runtime regression ตรวจการย้าย pointer กลับปุ่มและยกเลิกเวลาปิด
- ข้อจำกัดการตรวจ: ใช้ event จำลองใน JSDOM/Electron; ไม่ได้ทดสอบเมาส์จริง

## v0.949 — 2026-10-16

- แก้ object หน้าเดิมในไฟล์เดียวกันถูกยืด เมื่อเปลี่ยน Columns เป็น 2 โดยคง object แล้วปรับกลับเป็น 1 พร้อม Scale; จำขนาดอ้างอิงของ object แต่ละตัวแทนการใช้อัตราส่วนจากช่องกระดาษล่าสุดกับทุกตัว
- รองรับ object ที่เพิ่มใหม่หลังเปลี่ยน layout, Do Not Scale, หลายหน้า/ด้าน และการบันทึกเปิด JSON กลับ; เพิ่ม DOM/unit และ Electron runtime regression
- ข้อจำกัด: ป้องกันการยืดครั้งถัดไป; ไฟล์ที่บันทึก object ยืดไปแล้วและไม่มีขนาดเดิมไม่สามารถกู้สัดส่วนต้นฉบับอัตโนมัติได้

## v0.948 — 2026-10-15

- แก้ไอคอน SVG ของปุ่ม Insert ในหน้าต่าง Symbol ที่เดิมใช้สีเขียวบนพื้นหลังสีเขียว ให้แสดงเป็นสีขาวตัดพื้นและคงขนาดมาตรฐาน
- เพิ่ม DOM และ Electron runtime regression ตรวจสีและการแสดงไอคอน
- ข้อจำกัดการตรวจ: ใช้ JSDOM และ Electron จำลอง; ไม่ได้ทดสอบบนจอจริง

## v0.947 — 2026-10-15

- ปรับเมนู … ของหน้าให้เปิดเหนือการ์ดและไม่ทับปุ่ม โดยจำกัดความสูงตามพื้นที่ที่มีและเลื่อนภายในเมื่อรายการยาว; ล้างข้อจำกัดนี้ก่อนเปิดเมนูเพิ่มหน้า
- เปิดเมนู File เมื่อ hover ด้วยเมาส์/ปากกา; คลิกหลัง hover ไม่ปิดเมนูทันที, คลิกยังเปิดเมนูได้ และปิดเมื่อ pointer ออกจากแท็บ/เมนู
- เพิ่ม DOM และ Electron regression สำหรับตำแหน่งเมนู …, hover/ปิด File และการเปิด File ด้วยคลิก
- ข้อจำกัดการตรวจ: ใช้ JSDOM และ Electron จำลอง; ไม่ได้ทดสอบบนจอจริงหรือ touch device และยังรีโหลดหน้าต่างแอปเดิมไม่ได้เพราะ Windows ปฏิเสธการ activate ขณะหน้าจอล็อกแสดงอยู่

## v0.946 — 2026-10-15

- เอาเส้นขอบและ focus outline รอบรายการ New ในเมนู File ออก โดยให้กฎเฉพาะเมนูชนะกฎ focus กลางที่โหลดภายหลัง
- เพิ่ม DOM และ Electron runtime regression ให้แน่ใจว่า New ไม่มี outline หรือ border ขณะเมนูเปิด
- ข้อจำกัดการตรวจ: ตรวจใน JSDOM และ Electron จำลอง; ไม่ได้ทดสอบบนจอจริง

## v0.945 — 2026-10-15

- ขยายไม้บรรทัดแนวตั้งด้านซ้ายให้ยาวถึงปลายกระดาษที่มองเห็น แม้ปลายกระดาษจะเลยกรอบ preview และยัง clip ตามขอบ viewport
- แสดงเลข 0 บนแกนเมื่อจุดกำเนิดอยู่ในพื้นที่ไม้บรรทัดที่มองเห็น รวมถึงกรณีตัวเลขอื่นอยู่ใกล้จนเดิมถูกข้ามเพราะระยะห่างป้าย
- เพิ่ม unit และ Electron runtime regression ตรวจเลข 0, ปลายแถบเทียบปลายกระดาษ และขีดจำกัด viewport
- ข้อจำกัดการตรวจ: ใช้ Electron runtime จำลองที่ devicePixelRatio 2; ไม่ได้ทดสอบจอจริง

## v0.944 — 2026-10-15

- แสดงขีดและตัวเลขจำนวนเต็มบนไม้บรรทัดต่อเนื่องแม้อยู่เลยขอบกระดาษ โดยพื้นหลังช่วงนอกกระดาษยังโปร่งใส
- แสดงไม้บรรทัดด้านซ้ายตลอดพื้นที่ viewport ใต้ navbar ไม่ตัดให้เหลือเฉพาะช่วงความสูงกระดาษ
- เพิ่ม unit และ Electron runtime regression สำหรับเลขนอกกระดาษ, พื้นโปร่งใส และช่วง clip ของไม้บรรทัดซ้าย
- ข้อจำกัดการตรวจ: ใช้ Electron runtime จำลองที่ devicePixelRatio 2; ไม่ได้ทดสอบจอจริงหรือ touch device

## v0.943 — 2026-10-15

- ขยับ dropdown File ไปอยู่ใต้แท็บ File ตามตำแหน่งจริง เพื่อไม่บังคำว่า File ที่ผู้ใช้กด และจำกัดความสูงตามพื้นที่จอเพื่อให้เลื่อนถึงรายการท้ายได้
- เพิ่ม Electron runtime regression ตรวจว่า dropdown ไม่ทับปุ่มแท็บ File และไม่ล้น viewport
- ข้อจำกัดการตรวจ: ตรวจด้วย Electron runtime หน้าต่างจำลอง; ไม่ได้ทดสอบจอ touch จริง

## v0.942 — 2026-10-15

- ปิด dropdown เพิ่มหน้าเมื่อ pointer ออกจากเมนู; ออกจากปุ่มลูกศรไปพื้นที่อื่นก็ปิด โดยหน่วงสั้น ๆ เฉพาะตอนข้ามช่องว่างระหว่างปุ่มกับเมนู และยกเลิกการปิดเมื่อ pointer เข้าเมนู
- เพิ่ม DOM regression และ Electron runtime ตรวจเปิด/ปิด dropdown จาก hover และสถานะ ARIA
- ข้อจำกัดการตรวจ: ยังไม่ได้ทดสอบบน touch device จริง

## v0.941 — 2026-10-15

- จัดไอคอน … ให้อยู่กึ่งกลางปุ่มเสมอ โดยเปลี่ยนจากอักขระฟอนต์เป็น SVG วงกลมสามจุดในพื้นที่เดิม
- เพิ่ม DOM และ Electron runtime regression วัดกึ่งกลางไอคอนเทียบกับกรอบปุ่ม
- ข้อจำกัดการตรวจ: ยังไม่ได้ทดสอบบน touch device จริง

## v0.940 — 2026-10-15

- แก้ไม้บรรทัดแนวตั้งที่แสดงขีดเกินขอบกระดาษ ให้ clip เฉพาะช่วงกระดาษที่มองเห็นและยาวพอดีกับความสูงกระดาษ
- เพิ่ม unit regression สำหรับขอบบน/ล่างและ viewport/navbar clipping พร้อม Electron runtime ตรวจการ clip จริงที่ devicePixelRatio 2 และทั้งหน่วย in, mm และ dots
- ข้อจำกัดการตรวจ: ยังไม่ได้ทดสอบบน touch device หรือเครื่องพิมพ์จริง (การแก้นี้ไม่เกี่ยวกับงานพิมพ์)

## v0.939 — 2026-10-15

- ปรับ dropdown ของปุ่มเพิ่มหน้าให้เปิดอยู่เหนือปุ่มและจัดขอบขวาตรงกับปุ่ม โดยคำนวณจากตำแหน่งปุ่มและจำกัดไม่ให้ล้นขอบบนของหน้าต่าง
- เพิ่ม DOM regression และ Electron runtime ตรวจว่าตำแหน่ง dropdown อยู่ด้านบนและจัดแนวถูกต้อง
- ข้อจำกัดการตรวจ: ยังไม่ได้ทดสอบบน touch device จริง

## v0.938 — 2026-10-15

- ขยายปุ่มเพิ่มหน้าแบบแบ่งส่วนให้มีขนาด 114×64px (ปุ่ม + กว้าง 72px และปุ่มลูกศรกว้าง 40px) ตามสัดส่วนภาพอ้างอิง โดยคงธีมสีอ่อน
- เมื่อชี้เมาส์ที่ปุ่มลูกศร เมนูเพิ่มหน้า/ทำสำเนาจะเปิดทันที; เพิ่มสถานะ expanded และหมุนลูกศรขณะเมนูเปิด
- เพิ่ม DOM regression และปรับ Electron runtime ให้ตรวจขนาดและการเปิดเมนูจาก hover
- ข้อจำกัดการตรวจ: ยังไม่ได้ทดสอบการใช้งานบนอุปกรณ์ touch จริง

## v0.937 — 2026-10-15

- แก้พิกัด pointer ใกล้ศูนย์ที่แสดง `-0.00` ให้เป็น `0.00` และ snap เส้น/ป้ายพิกัดสีแดงเข้ากับ tick 0 สีเขียว เมื่อค่าที่ปัดแล้วเป็นศูนย์
- เพิ่ม regression สำหรับค่าใกล้ศูนย์ทั้งบวกและลบ และคงการแสดงค่าลบจริงตามเดิม

## v0.936 — 2026-10-15

- เพิ่มปุ่มลูกศรข้างปุ่ม + เพื่อเลือกเพิ่มหน้าเปล่าหรือทำสำเนาหน้าปัจจุบัน โดยใช้เมนูและสีพื้นอ่อนตามธีม Q LABEL
- เพิ่มปุ่ม … บนหน้าเมื่อ hover/focus (คงแสดงบนหน้าที่เลือกสำหรับอุปกรณ์ touch); เปิดเมนูของหน้านั้นโดยไม่สลับหน้า และรองรับ Context Menu / Shift+F10
- เพิ่ม DOM regression และ Electron runtime สำหรับเมนูเพิ่มหน้า, ellipsis, ขนาดแถบและการคงธีมสีอ่อน; ยังไม่ได้ทดสอบบน touch device จริง

## v0.935 — 2026-10-15

- เปลี่ยน filmstrip จากพื้นดำเป็นพื้นกระจกสีอ่อน
- ซ่อน native scrollbar ของ filmstrip และ bottom preview scrollbar/corner ที่แสดงใต้แถบ; คงการเลื่อนผืนงานด้วยล้อเมาส์/ลาก
- เพิ่ม DOM regression และ Electron runtime ยืนยันสีแถบและ scrollbar ที่ซ่อน โดยใช้ appData แยกและไม่ส่งงานพิมพ์

## v0.934 — 2026-10-15

- ปรับความกว้าง filmstrip ให้พอดีกับจำนวนหน้ากับปุ่มเพิ่ม และเลื่อนแนวนอนเมื่อหน้าเกินพื้นที่ที่แสดงได้
- เพิ่มป้ายและการทำงานของคีย์ลัดในเมนูหน้า: Ctrl+C, Ctrl+V, Ctrl+D, Ctrl+Enter และ Delete; จัดการคีย์ลัดเฉพาะเมื่อโฟกัสอยู่ที่หน้า/เมนู โดยไม่ชนคีย์ลัด object
- เพิ่ม DOM regression และ Electron runtime ตรวจความกว้างแถบและคีย์ลัด; ใช้ appData แยก ไม่ส่งงานพิมพ์

## v0.933 — 2026-10-15

- ปรับพื้นไม้บรรทัดให้ทึบเฉพาะช่วงที่ตรงกับขนาดกระดาษ ส่วนพื้นที่นอกกระดาษกลับมาโปร่งใสทั้งแกน X และ Y
- คงพื้นรองตัวเลข/ขีดบนกระดาษ และเพิ่ม regression ตรวจการ clip เมื่อขอบกระดาษเลยพื้นที่ viewport
- เพิ่ม Electron pixel check สำหรับพื้นที่ด้านใน/นอกกระดาษ ทั้งหน่วย in, mm และ dots; ใช้ appData แยก ไม่ส่งงานพิมพ์

## v0.932 — 2026-10-15

- เปลี่ยนแถบ Template ด้านล่างเป็น filmstrip พื้นเข้ม แสดง SVG thumbnail ของแต่ละหน้าในการ์ดขนาด 112×64 px พร้อมเลขหน้าและกรอบสีเขียวสำหรับหน้าที่เลือก
- คงการเลือกหน้า ลากเรียง เพิ่มหน้า เมนูคลิกขวา และ Rename พร้อมชื่อที่โปรแกรมอ่านหน้าจอเข้าถึงได้
- เพิ่ม DOM regression และ Electron runtime ตรวจ thumbnail, เลขหน้า, ขนาดการ์ด, การเลือกหน้าและสีแถบ; ใช้ appData แยก ไม่ส่งงานพิมพ์

## v0.931 — 2026-10-15

- เพิ่มจุดจับ resize ที่มุมขวาบนและซ้ายล่างของ Barcode ขณะเลือก พร้อมคงจุดจับกลางทั้งสี่ด้านและจุดมุมอีกสองด้านไว้ตามเดิม
- เพิ่ม DOM regression และ Electron runtime ตรวจตำแหน่งจุดที่มองเห็นบน barcode
- ผล basic suite รอบนี้บันทึกใน UNIT_TEST_BASIC.md

## v0.930 — 2026-10-15

- เพิ่ม padding ซ้ายและขวาของข้อความในปุ่มแท็บ Template จาก 7px เป็น 12px เพื่อให้ข้อความห่างจากขอบปุ่มขึ้น
- เพิ่ม DOM และ Electron runtime assertions ตรวจ padding 12px ทั้งสองด้าน; ตรวจด้วย temporary appData ไม่ส่งงานพิมพ์
- ผลตรวจ basic suite รอบนี้บันทึกใน UNIT_TEST_BASIC.md

## v0.929 — 2026-10-15

- แก้ Print dialog แสดงเองทั้งที่ปิดอยู่จาก CSS display:flex; แสดงเฉพาะเมื่อมี open และซ่อนทันทีหลัง Cancel/X
- เพิ่ม DOM และ Electron runtime ตรวจ display และพื้นที่บนจอจริงตอน startup/หลังปิด แทนการตรวจ open อย่างเดียว
- การตรวจ runtime ใช้ profile ชั่วคราว ไม่ส่งงานพิมพ์; ผลตรวจบันทึกใน UNIT_TEST_BASIC.md

## v0.928 — 2026-10-15

- แก้ Ctrl+P แบบกดค้างส่งคำสั่งเปิด Print ซ้ำจนกด Cancel แล้ว dialog เด้งกลับ โดยกรอง auto-repeat ที่ Electron และ renderer
- เพิ่มการตรวจว่า Print ไม่เปิดเองตอน startup, Ctrl+P ครั้งแรกเปิดได้ และ key repeat ไม่เปิดซ้ำ; `npm run test:basic` ผ่าน 441 tests, legacy scripts 3/3
- Electron runtime assertions เหล่านี้ผ่านก่อนสคริปต์หยุดที่ Help icon assertion เดิม; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.927 — 2026-10-15

- ปรับปุ่ม Cancel / Back / Next / Finish ใน New Label Wizard ให้ไอคอนกับข้อความอยู่ภายในปุ่ม, ปุ่มไม่หดทับกันและขึ้นบรรทัดใหม่ได้เมื่อหน้าต่างแคบ
- ปรับระยะ ขอบมน และสถานะปุ่ม Finish ให้แยกชัดเจน; เพิ่ม DOM regression และ Electron runtime check
- `npm run test:basic`: 439 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน
- Electron `npx electron test/runtime-ui.js`: Wizard footer assertion ผ่าน; script หยุดภายหลังที่ Help icon assertion เดิม; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.926 — 2026-10-15

- แก้ปุ่ม X ของ Print modal ให้ปิดหน้าต่างได้แม้บันทึก preference ไม่สำเร็จ และตรวจทั้ง X กับ Cancel
- เพิ่ม regression unit และ Electron runtime check สำหรับการปิด modal; `npm run test:basic` ผ่าน 438 tests และ legacy 3/3
- Electron `npx electron test/runtime-ui.js` ผ่านการตรวจ X/Cancel ก่อนหยุดที่ Help icon assertion เดิม; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.925 — 2026-10-15

- แก้ปุ่ม Create a New Label ที่ดูเหมือนกดไม่ได้: ลดชั้น Project Home ให้ wizard แสดงอยู่ด้านหน้าแทนการเปิดค้างอยู่ข้างหลัง Home
- เพิ่ม DOM regression และ Electron check จากการคลิกปุ่มบนหน้า Home; ยังไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.924 — 2026-10-15

- แก้หน้าต่าง modal ให้เปิดอยู่เหนือ navbar แบบ fixed และเรียงหน้าต่างที่เปิดใหม่ไว้เหนือ modal ก่อนหน้า
- เพิ่ม regression unit test สำหรับลำดับ z-index และ Electron runtime check ใน Page Setup; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.923 — 2026-10-15

- เอาปุ่ม X ซ้ำในแถบล่างของ Print dialog ออก เหลือ Cancel ปุ่มเดียวสำหรับปิดหน้าต่าง
- เปลี่ยนไอคอน Test Print, Print และ Preview ให้เป็น SVG เครื่องพิมพ์/เครื่องพิมพ์ทดสอบ/ดูตัวอย่างแทนเครื่องหมายบวก
- เพิ่ม DOM regression และ isolated Electron runtime assertion; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.922 — 2026-10-15

- แก้การเตรียม Print แบบใช้ measured media ให้ fit artwork ภายใน label cell โดยคง paper size, rows และ columns; layout 2 คอลัมน์จึงไม่ขึ้นข้อความบังคับให้ใช้ 1 คอลัมน์
- เพิ่ม regression ตรวจขนาดหน้าและ ZPL ที่พิมพ์ artwork ครบทั้งสองคอลัมน์ พร้อม isolated Electron runtime check; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.921 — 2026-10-15

- ปรับ Print dialog ให้แถบปุ่ม Test Print / Print / Preview / Close / Cancel / Help ยึดขอบล่างของหน้าต่าง และเลื่อนเนื้อหาตั้งค่าภายในแทนการเหลือช่องว่างใต้ปุ่ม
- เพิ่ม DOM regression และ Electron runtime check; ไม่ได้ทดสอบการพิมพ์กับเครื่องจริง

## v0.920 — 2026-10-15

- คงขนาด canvas และขอบเขตกระดาษหน้าออกแบบระหว่าง draft ของ Page Setup / Scale Templates; ใช้ขนาดใหม่หลังยืนยันเท่านั้น
- Cancel/Escape กลับ Page Setup โดย canvas ยังคงขนาดเดิม; ปิด Page Setup ด้วย Cancel คืนค่าต้นฉบับ
- เพิ่ม regression ตรวจขนาดก่อน/หลัง Scale Templates OK ทั้ง DOM และ Electron; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.919 — 2026-10-15

- เพิ่ม Do Not Scale / Scale Proportionally / Scale Freely ให้ Text, Barcodes, Pictures และ Maintain Thickness / Scale Thickness ให้ Lines
- แก้ canvas หน้าออกแบบให้ใช้ขนาดฉลากต่อช่องหลังแบ่งคอลัมน์ รวมขอบกระดาษ กริด และ hover raster; Page Setup/print ยังคงขนาดกระดาษรวม
- เพิ่ม regression ของตัวเลือก สูตร scaling และ canvas 2 คอลัมน์; อ้างอิงภาพ/compiled resources ของ BarTender ไม่ได้คัดลอก source; ไม่ทดสอบเครื่องพิมพ์จริง

## v0.918 — 2026-10-15

- เปลี่ยน native confirmation เป็น dialog ของ Q LABEL พื้นโปร่ง ขอบมน ไอคอนสีเขียว และสรุปขนาดปัจจุบัน/ใหม่
- ปุ่ม Scale objects และ Keep current objects อธิบายผลการทำงานชัดเจน; ปิดหรือ Escape กลับ Page Setup โดยไม่บันทึก
- เพิ่ม DOM regression และ isolated Electron runtime; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.917 — 2026-10-15

- ปิด Page Setup ก่อนคำถามปรับขนาดและก่อนเปิด Scale Templates เพื่อไม่ให้ modal ซ้อนกัน
- กด OK แล้วกลับหน้าออกแบบโดยไม่มี Page Setup ค้าง; Cancel/Escape เปิด Page Setup กลับพร้อม draft เดิม
- ปรับ DOM regression และ Electron runtime ตรวจการปิด modal ด้านล่าง; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.916 — 2026-10-15

- แก้ Gap / Pitch ถูก disabled จากค่า manual_gap เดิมเมื่อขนาด template เป็น automatic; เปิดช่องตามจำนวนแถว/คอลัมน์และคำนวณ preview สด
- ย้าย Set Manually ของ gap ไว้เหนือช่องกรอก; manual template ยังคำนวณ gap อัตโนมัติได้
- เพิ่ม DOM regression และ isolated Electron runtime fixture; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.915 — 2026-10-15

- เพิ่มคำถามเมื่อขนาด template เปลี่ยนตั้งแต่ 10%: เลือกไม่ scale เพื่อคง artwork เดิม หรือเปิด Scale Templates
- เพิ่ม Scale Templates สำหรับปรับ Text, Barcode, Picture และ Line ตามกฎที่เลือก; ครอบคลุมทุกด้านและหน้า template พร้อมยกเลิกกลับไปแก้ Page Setup ได้
- Barcode รองรับทั้งกฎ proportional/free และตารางที่เก็บเป็น image ปรับขนาดแถว/คอลัมน์ fixed ตาม template
- Text แบบ Scale Freely ปรับ metric แนวนอน/แนวตั้งตามแกนของขนาดใหม่
- เพิ่ม unit regression และ Electron runtime fixture สำหรับ Yes/No/Cancel, การคง artwork และการ scale หลายชนิด object
- `npm run test:basic`: 424 passed, 0 failed, 0 skipped; legacy 3/3 passed; inventory gap 0
- Electron `npx electron test/page-setup-runtime.js`: ผ่านบน appData ชั่วคราว; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.914 — 2026-10-15

- เพิ่มลูกศรสองหัวใน Layout preview เพื่อแสดงระยะ gap จริงระหว่างคอลัมน์/แถว โดยไม่ต้องโฟกัสช่องกรอก
- เพิ่ม DOM regression ตรวจตำแหน่งลูกศรเทียบขอบ label และ Electron runtime ตรวจลูกศรแนวนอน
- Electron runtime ครั้งแรกหมดเวลา; รันซ้ำผ่านบน appData ชั่วคราว
- ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.913 — 2026-10-15

- ขยับชื่อ object ที่แสดงเหนือกรอบเลือกให้ชิดเส้นกรอบสีเขียวขึ้น โดยคงขนาดชื่อเดิมเมื่อซูมและไม่บังการคลิก/ลาก
- เพิ่ม regression test ตรวจระยะชื่อกับกรอบ ทั้ง DOM และ Electron runtime
- ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.912 — 2026-10-15

- แก้ปุ่ม OK ใน Page Setup ที่กดไม่ได้เมื่อ draft ของ gap ใหญ่กว่าพื้นที่กระดาษ โดยคืน gap เป็นค่าที่ใช้ได้ล่าสุดและบันทึกจำนวนคอลัมน์/แถวที่เลือก
- เพิ่ม DOM regression และ Electron runtime check สำหรับการยืนยัน layout ที่มี gap ใช้ไม่ได้
- ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.911 — 2026-10-15

- ซ่อนข้อความ รูปทรง และ artwork ของฉลากใน Preview ทุกแท็บของ Page Setup; preview ของหน้าออกแบบปกติยังแสดงวัตถุ
- แก้กรณี gap เดิมใหญ่เกินกระดาษ: ยังบันทึกจำนวนคอลัมน์ที่เลือก เปิดช่อง Horizontal gap ให้แก้ และใช้ gap ที่ปลอดภัยจนกว่าจะกรอกค่าใหม่
- เพิ่ม regression tests สำหรับ Page Setup ที่ไม่แสดง artwork และการกู้คืนคอลัมน์จาก gap ที่ใช้ไม่ได้; ไม่ได้ทดสอบเครื่องพิมพ์จริง

## v0.910 — 2026-10-15

- แก้ตัวอย่าง Layout ให้แบ่งกระดาษเป็นช่องตามจำนวนแถว/คอลัมน์ แม้กำหนดขนาดฉลากแบบ Manual และไม่แสดง object ภายในช่อง
- แท็บ Page ยังคงแสดง artwork และขนาดจริงของฉลาก; เพิ่ม regression test ทั้ง DOM และ Electron runtime
- การตรวจ Electron ใช้ appData ชั่วคราว; ไม่ได้ทดสอบการพิมพ์กับอุปกรณ์จริง

## v0.909 — 2026-10-15

- แก้ Layout ให้ใช้ PaperPreview เดียวกับแท็บอื่น อัปเดตหลายแถว/คอลัมน์ ขนาด Template แบบ Manual และเส้นบอกระยะ Gap/Width/Height ตามช่องที่โฟกัส
- เลือกหลายคอลัมน์/แถวแล้วเปิด paper layout ทันที; Gap แสดงเสมอและ disabled ตามแกนที่ใช้ไม่ได้หรือโหมดอัตโนมัติ ย้าย Gap / Pitch หลัง Template Size ตาม native dialog resource ของ BarTender
- อ้างอิง strings จาก BtEnu.dll / BarTend.exe โดยไม่ได้เปิดโปรแกรม BarTender; ไม่สามารถยืนยัน logic ภายใน binary หรือความเหมือนทุกเส้นทางของ BarTender จาก source ที่ไม่มีให้ได้
- เพิ่ม DOM regression และ Electron runtime checks สำหรับ preview/Gap/Manual dimensions; รายงานผลตรวจใน UNIT_TEST_BASIC.md

## v0.908 — 2026-10-15

- แก้ช่อง Corner radius ให้ step สอดคล้องกับจำนวนทศนิยมของหน่วยที่เลือก จึงกรอกค่า 0.0472 in ได้ และบันทึกเป็นมิลลิเมตรโดยไม่ถูกปฏิเสธจาก HTML validation
- เพิ่ม Page Setup regression test ที่เปลี่ยนค่าในช่องจริง ตรวจ validation และค่าที่บันทึก; ยังไม่ได้ตรวจ UI บนเครื่องจริง

## v0.907 — 2026-10-15

- แก้ตำแหน่งเลข 0 ของไม้บรรทัดแนวตั้งให้ตรงกับขอบกระดาษ โดยจัดจุดอ้างอิง canvas กับขอบด้านในของ frame ให้ตรงกัน รวมผลของ border และ scroll
- เพิ่ม regression unit test จำลอง frame ที่มี border และเลื่อนหน้า; ยังไม่ได้ตรวจพิกัดบนจอจริง

## v0.906 — 2026-10-15

- ให้ Page Setup ใช้รายการ `Choices` ของ `media.printmode` ที่ printer รายงานผ่าน `allcv` เพื่อเปิด Peel-off, Cutter หรือ Rewind เฉพาะโหมดที่ profile ยืนยัน; ถ้าไม่พบข้อมูลยังปิดตัวเลือกไว้
- เก็บโหมดเก่าที่ไม่ยืนยันไว้ในเอกสาร แต่ลด print job ที่เตรียมส่งเป็น Tear-off จนกว่า profile จะยืนยัน ทำให้ไม่ส่งโหมดที่อุปกรณ์อาจไม่รองรับ
- เพิ่ม unit coverage สำหรับการอ่าน capabilities จากข้อมูล printer, สถานะ Page Setup และผลลัพธ์ ZPL; ยังไม่ได้ทดสอบกับ printer จริงหรือ BarTender UI

## v0.905 — 2026-10-15

- จัดแท็บ Page Setup ตามลำดับ Stock, Page, Layout, Shape, Media Handling, Printing Order, Templates และ Background พร้อมย้ายแท็บย่อย Predefined Stocks / RFID Antenna / Magnetic Stripe ให้อยู่เหนือ controls ของ Stock
- แสดง RFID Antenna, Magnetic Stripe, Wizard และ Paper tray/source เป็น disabled พร้อมคำอธิบาย เนื่องจาก Q LABEL ยังไม่มี workflow/เส้นทาง output ที่รองรับครบ
- เพิ่ม unit และ Electron runtime assertions สำหรับลำดับแท็บ/ตำแหน่ง Stock sub-tabs และสถานะ disabled; `npm run test:basic` ผ่าน 393/393 และ legacy 3/3, Page Setup Electron runtime ผ่านด้วย appData แยก; ไม่ได้ทดสอบกับเครื่องพิมพ์จริงหรือ BarTender UI

## v0.904 — 2026-10-15

- ขยับ label `Line` ให้ห่างจากตัวเลือก Line style 8px และป้องกัน label/ช่องความหนาเส้นถูกบีบจนทับกัน
- เพิ่ม DOM unit และ Electron runtime ตรวจระยะห่างจริง (clearance 11px); `npm run test:basic` ผ่าน 392/392 และ legacy scripts 3/3
- runtime toolbar/ribbon อื่นผ่าน ยกเว้น `runtime-ui.js` ที่หยุดจาก Help icon assertion เดิมหลังผ่าน startup, version และ selection checks

## v0.903 — 2026-10-15

- คืนเครื่องมือที่ถูกซ่อนเมื่อ disabled ให้เห็นในทุกแท็บ รวมแท็บ Picture; Paste ยังแสดงเมื่อ clipboard ว่าง, แถบจัดรูปแบบแสดงแม้ยังไม่เลือก object และคำสั่งที่ใช้ไม่ได้แสดงสถานะ disabled ตามบริบท
- เพิ่ม DOM unit ตรวจการแสดงปุ่ม/ช่อง/กลุ่มที่ disabled และ Electron runtime ตรวจทุกแท็บด้วย appData แยก; ผลและข้อจำกัดอยู่ในรายงานชุดทดสอบ
- แก้ `test/runtime-ui.js` ให้ใช้ appData ชั่วคราว เพราะ `main.js` กำหนด userData ใหม่จาก appData; runtime นี้ยังมี Help icon assertion เดิมที่ fail ก่อนทำ checks ที่เหลือ

## v0.902 — 2026-10-15

- เลือกหลาย object หรือ Select All ที่มีตารางปนกับข้อความ/รูป จะไม่เปิดแท็บ Table อัตโนมัติ และไม่เปลี่ยน primary object; เปิด Table อัตโนมัติเฉพาะ selection ที่เป็นตารางทั้งหมด
- จำแท็บปกติล่าสุดและคืนแท็บเดิมเมื่อออกจาก Table แม้สลับหลายตารางก่อนหน้า; เพิ่ม DOM unit และ Electron runtime ตรวจ mixed selection, table-only และคืนแท็บ Layout โดยใช้ profile แยก

## v0.901 — 2026-10-15

- แก้ช่องสีเทาเข้มรองตัวเลขไม้บรรทัด โดยไม่ลบพื้นแถบจนเห็น workspace ทะลุ; ตัวเลขทั้งสองแนวใช้พื้นสีอ่อนเดียวกับแถบ
- เพิ่มขนาดตัวเลข 10px เป็น 15px และความหนาไม้บรรทัด 13px เป็น 19.5px พร้อมขีดแบ่งและตัวชี้พิกัด; เพิ่ม unit และ Electron pixel checks ด้วย profile แยก ไม่ใช่การวัดบนจอจริงทุก DPI

## v0.900 — 2026-10-15

- เพิ่มเมนู Clear เมื่อคลิกขวาบนพื้นที่ว่างของ Recently Used Objects ล้างทั้ง object presets และเครื่องมือล่าสุดพร้อมบันทึก settings โดยไม่แก้ object บนฉลาก
- ปิดเมนูเมื่อคลิกนอก/กด Escape และปิดใช้ Clear เมื่อรายการว่าง; เพิ่ม DOM unit สำหรับพื้นที่ว่าง/ตัว object, persistence และการคืนรายการเมื่อบันทึกล้มเหลว พร้อม Electron runtime ใน profile แยก

## v0.899 — 2026-10-15

- เพิ่มขนาดข้อความแถบ Template ด้านล่าง 50% จาก 12px เป็น 18px พร้อมปรับความสูงแท็บ ปุ่ม + และช่อง Rename ให้ข้อความไม่ถูกตัด
- เพิ่ม DOM unit และ Electron runtime ตรวจขนาดฟอนต์และพื้นที่แท็บ โดยใช้ profile ทดสอบแยก

## v0.898 — 2026-10-15

- แก้ปุ่ม + ที่มุมตารางใหญ่ผิดปกติตอน hover โดยใช้ scale ของ canvas ให้ไอคอนกว้าง 24 พิกเซลทุกระดับ zoom พร้อมพื้นที่คลิกตรงกับไอคอน
- เพิ่ม DOM unit และ Electron runtime ตรวจขนาดไอคอน/พื้นที่คลิก; runtime ใช้ fixture แยก ไม่ส่งพิมพ์จริง

## v0.897 — 2026-10-15

- เพิ่มชื่อ object เหนือมุมซ้ายบนของกรอบเลือกทุกชนิด รวมหลาย object พร้อมกัน ใช้ชื่อที่ตั้งไว้หรือชื่อชนิดเมื่อชื่อว่าง พร้อมขนาดอักษรคงที่ตาม zoom และป้ายตามกรอบระหว่างแก้ไข
- เพิ่ม DOM unit และ Electron runtime ตรวจชื่อ ตำแหน่ง การหมุน การเลือกซ้ำ และการไม่ใส่ป้ายใน artwork สำหรับพิมพ์; ผลทดสอบล่าสุดอยู่ในรายงาน basic suite โดย runtime ใช้ fixture แยกและไม่ใช่การวัด FPS บนจอจริง

## v0.896 — 2026-10-15

- ลดอาการกระตุกตอนเลือกและยกเลิกเลือก object Text ด้วยการอัปเดต selection overlay ใน SVG เดิม ไม่วาด canvas artwork ทั้งหน้า; multi-select ยังคงวาดกรอบรวมเมื่อจำเป็น
- เพิ่ม unit regression สำหรับการสลับเลือกซ้ำ, fallback เมื่อ overlay ไม่มี และ full render ของ multi-select; `npm run test:basic` ผ่าน 378/378 unit tests และ legacy checks 3/3
- Electron `runtime-ui.js` ผ่าน assertion สลับเลือก Text ซ้ำโดยคง SVG เดิมและไม่ full redraw แต่ suite หยุดที่ assertion Help SVG ซึ่งไม่เกี่ยวกับ selection; ยังไม่ได้วัด frame time บนจอจริง

## v0.895 — 2026-10-15

- แสดงจุดจับปรับขนาดที่มุมทั้งสี่ของ SVG ที่เลือก เพื่อให้ลากปรับกรอบจากมุมซ้ายและขวาได้; คงการซ่อนจุดจับมุมสำหรับรูป raster และตาราง
- เพิ่ม DOM unit และ Electron runtime coverage สำหรับจุดจับมุม SVG ทั้งสี่มุมและ hit target ที่ตรงกัน; `npm run test:basic` ผ่าน 375/375 unit tests และ legacy checks 3/3, `electron test/svg-selection-bounds-runtime.js` ผ่าน โดย runtime ตรวจจุดจับ/target ไม่ได้จำลองเมาส์ลากจริง

## v0.894 — 2026-10-15

- ปรับ hover เครื่องมือความหนาเส้นให้แสดงเส้นไกด์สีเขียวตามขอบวัตถุ และเอาเส้นเฉียงที่เชื่อมจากขอบไปยังไอคอนออก
- เพิ่ม DOM unit และ Electron runtime regression checks สำหรับ hover guide และการซ่อนเส้นเมื่อออกจาก hover; `npm run test:basic` ผ่าน 374/374 unit tests, legacy checks 3/3 และ `electron test/table-corner-controls-runtime.js` ผ่าน (มี Electron CSP warning มาตรฐานระหว่างรัน)

## v0.893 — 2026-10-15

- แก้การย้ายแถวและคอลัมน์ให้รูปแบบเซลล์และ rich-text ranges เคลื่อนตามข้อความ พร้อมคงรูปแบบเมื่อ duplicate และจัดดัชนีใหม่เมื่อ delete
- เพิ่ม unit tests ตรวจการย้ายและ duplicate/delete format ของข้อความในตาราง; `npm run test:basic` ผ่าน 372/372 และ legacy checks ผ่าน 3/3, ไม่ข้าม test; `table-row-selection-controls-runtime.js` ผ่าน

## v0.892 — 2026-10-15

- แก้การพิมพ์ข้อความในเซลล์ตารางให้ตอบสนองทันที โดยเลื่อนการ bake และวาด canvas เต็มไปทำครั้งเดียวเมื่อจบการแก้ไข และยังเก็บ undo/redo
- เพิ่ม unit test ตรวจการอัปเดตค่าทันทีและการลดงานวาดซ้ำ; `npm run test:basic` ผ่าน 370 unit tests และ legacy basic scripts 3 รายการ (ไม่ข้าม test)

## v0.882 — 2026-10-14

- แสดงแท็บ Table เมื่อเลือกหลายวัตถุที่มีตาราง โดยกำหนดตารางที่เลือกเป็นตารางหลักสำหรับเครื่องมือของแท็บ
- ไม่รัน unit test หรือ checklist ตามคำขอของผู้ใช้

## v0.881 — 2026-10-14

- แก้ปุ่มตัดบรรทัดและปรับข้อความให้พอดีให้ทำงานกับเซลล์ตารางที่เลือก และให้ preview กับภาพตารางใช้ค่ารูปแบบเดียวกัน
- ไม่รัน unit test หรือ checklist ตามคำขอของผู้ใช้

## v0.880 — 2026-10-14

- ปรับเมนูเครื่องมือและปุ่มหมุน/ย้ายของวัตถุให้คงขนาดขณะลากปรับขนาดวัตถุ
- ไม่รัน unit test หรือ checklist ตามคำขอของผู้ใช้

## v0.879 — 2026-10-14

- เปลี่ยน SVG ของปุ่ม Print ในหน้าต่างพิมพ์จากสีขาวเป็นสีเขียว accent ให้ตรงกับปุ่มข้างเคียง
- ไม่รัน unit test หรือ checklist ตามคำขอของผู้ใช้

## v0.878 — 2026-10-14

- คลิกเซลล์ตารางครั้งเดียวแล้วพิมพ์ได้ทันที; ยังลากคลุมหลายเซลล์ได้ และไม่แสดงพื้นเขียว selection ซ้อนขณะกำลังแก้ข้อความ
- เปลี่ยนกรอบ editor ของเซลล์เป็นเส้นเหลี่ยมสีเขียว ไม่มีมุมมน
- ไม่รัน unit test หรือ checklist ตามคำขอของผู้ใช้

## v0.877 — 2026-10-14

- ซ่อนคำสั่งและช่องปรับรูปแบบบน Ribbon ที่กดไม่ได้ พร้อมซ่อนกลุ่มที่ไม่มีคำสั่งให้ใช้; กลุ่มกลับมาแสดงเมื่อมี selection ที่ใช้คำสั่งนั้นได้
- ไม่รัน unit test หรืออ่าน checklist ตามคำขอของผู้ใช้

## v0.876 — 2026-10-14

- ปรับภาพ Preview Settings ให้เส้นพิกัดและตัวเลขขยับไปยังจุด grid ตาม Step เมื่อเปิด Snap พร้อมจุดหมายสีเขียว; ปิด Snap แล้วยังคงแสดงพิกัดแบบไม่ snap

- เพิ่ม unit และ Electron runtime regression สำหรับพิกัด preview; `npm run test:basic` ผ่าน 369/369 unit tests, skipped 0 และ legacy checks ผ่าน 3/3; `npx electron test/runtime-ui.js` ยืนยัน Snap preview ผ่าน แต่ suite หยุดที่ Ctrl+Z undoes insertion ซึ่งไม่ผ่าน

## v0.875 — 2026-10-14

- เปลี่ยน SVG ของปุ่ม Keyboard shortcuts ให้เป็นรูปแป้นพิมพ์ และ About Q LABEL ให้เป็นสัญลักษณ์ข้อมูลในวงกลม แทนไอคอนเอกสารทั่วไป

- เพิ่ม DOM unit ตรวจรูปทรงและการแทนที่ SVG; Electron runtime-ui ยืนยันไอคอนบน Ribbon แต่ suite ต่อมา fail ที่ Ctrl+Z undoes insertion; `npm run test:basic` ผ่าน 366/366 unit tests, skipped 0 และ legacy checks ผ่าน 3/3


## v0.874 — 2026-10-14

- แก้สถานะ active cell ของตารางให้ปิด editor และล้างกรอบ cell เมื่อกดพื้นที่นอกตารางตั้งแต่ pointerdown; คง selection เมื่อใช้ toolbar หรือคลิกในตารางเดิม

- เพิ่ม DOM regression สำหรับคลิกนอกตารางให้ปิด editor/กรอบ active และคง selection บน toolbar; `npm run test:basic` ผ่าน 365/365 unit tests, skipped 0 และ legacy checks ผ่าน 3/3; Electron cell formatting (45 checks), cell selection, zoom และ row/layer controls ผ่าน ส่วน table-properties runtime หยุดที่ harness control ที่เป็น null ก่อนถึง assertions

## v0.873 — 2026-10-14

- แก้เมนู Rename ของแท็บ Template ให้เปิดช่องแก้ชื่อ inline บนแท็บที่เลือกแทน prompt ที่ไม่แสดงในหน้าต่างแอป; กด Enter หรือคลิกออกเพื่อบันทึก และกด Escape เพื่อยกเลิก

- เพิ่ม DOM regression ตรวจเมนู Rename เปิดช่องบน Template 2, ปรับชื่อแล้วยืนยันด้วย Enter/blur, ยกเลิกด้วย Escape และตรวจ undo/dirty state; `npm run test:basic` ผ่าน 364/364 unit tests, skipped 0 และ legacy checks ผ่าน 3/3


## v0.872 — 2026-10-14

- เพิ่มการลากแท็บ Template ไปซ้าย/ขวาเพื่อสลับลำดับ โดยคงหน้า active และเนื้อหาเดิม พร้อม undo snapshot และบันทึกการเปลี่ยนแปลงหนึ่งครั้ง
- เพิ่ม DOM unit regression สำหรับ reorder ไปท้ายและกลับต้น; `npm run test:basic` ผ่าน 363/363 unit tests, skipped 0 และ legacy checks ผ่าน 3/3

## v0.871 — 2026-10-14

- เอากรอบเขียวที่ค้างรอบ slider ของแถบ zoom ออกเมื่อ focus โดยเอา outline, border และ shadow เฉพาะ slider ออก คงหน้าตาและสีปุ่ม/ตัวเลื่อนเดิม
- เพิ่ม DOM regression ตรวจรูปแบบ focus ของ range slider และเก็บเคสหัวข้อ sidebar เดิมไว้; `npm run test:basic` จะรันใหม่หลังแก้เอกสาร
- ตรวจ CSS ใน JSDOM; ไม่ได้ยืนยัน compositor บนจอจริง

## v0.870 — 2026-10-14

- แก้ Ctrl+B / Ctrl+I / Ctrl+U ให้พิจารณาสถานะรวมของ cell ที่เลือก และใช้รูปแบบเดียวกันกับทุก cell ในทุกตารางที่เลือก; กดซ้ำปิดรูปแบบได้ครบ ส่วนการเลือก cell เดียวยังคงไม่เปลี่ยนช่องข้างเคียง
- เพิ่ม DOM unit regression และขยาย Electron runtime `table-cell-formatting-runtime.js` ตรวจการเลือกหลายตาราง, toggle เปิด/ปิดทั้งสามคำสั่ง และการเลือก cell เดียว; `npm run test:basic` ผ่าน 361/361, skipped 0, legacy checks 3/3
- Electron runtime formatting (45 checks), text range, cell selection, zoom และ row controls ผ่าน; `table-properties-runtime.js` ยังหยุดที่ harness ตั้ง `checked` ให้ control ที่ค้นหาไม่พบ จึงไม่ใช่ผลยืนยัน properties runtime

## v0.869 — 2026-10-14

- แก้หัวข้อ Recently Used Objects และ Data Sources ที่โปร่งจนเห็นไอคอนด้านหลัง โดยใช้พื้นขาว glass และ backdrop blur พร้อมตัวอักษรเข้มอ่านชัดเหมือนแถบ zoom
- เพิ่ม DOM unit regression ตรวจพื้นหลังและ blur ของหัวข้อทั้งสอง; `npm run test:basic` ผ่าน 360/360 unit tests, skipped 0 และ legacy checks ผ่าน 3/3
- ตรวจ CSS ใน JSDOM; ยังไม่ได้ยืนยันภาพ blur จาก compositor บนจอจริง

## v0.868 — 2026-10-14

- แก้การลากเลือกสีเส้น/กล่อง/วงรีให้รวม input events ต่อ animation frame และอัปเดต SVG โดยตรง ลดการวาดทั้ง canvas และการบันทึกซ้ำระหว่างลาก; เมื่อเสร็จยังคง dirty/autosave policy เดิม
- เพิ่ม DOM unit regression ยืนยัน preview ใช้สีล่าสุด, มี undo snapshot เดียว, coalesce หนึ่ง frame และไม่ full render/draw/persist ระหว่างลาก; คงเส้นทาง live preview ของ text/barcode และ table เดิม
- เพิ่ม checklist และ inventory ใน `UNIT_TEST_BASIC.md`; การทดสอบจำลอง RAF ใน JSDOM ไม่ใช่การวัด smoothness บนจอจริง

## v0.867 — 2026-10-14

- แก้การลากย้ายเส้นที่วางแล้ว โดยเลื่อน endpoints เดิมทั้งคู่และสร้าง geometry กลับจากจุดปลาย ทำให้รักษามุมเส้นระหว่างลากและหลังปล่อยเมาส์
- เพิ่ม unit regression สำหรับเส้นทแยง ตรวจ endpoints และ rotation ก่อน/ระหว่าง/หลังย้าย
- `npm run test:basic` ผ่าน 358/358 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; `npm run test:gestures` ผ่าน unit 42/42 แต่ Electron runtime หยุดที่การตรวจงบเวลาเฟรมของการลาก object (p95 8.5 ms, เฉลี่ย 85.6 Hz) ซึ่งไม่ผ่านเกณฑ์ runtime; ไม่มีการส่งพิมพ์จริง

## v0.866 — 2026-10-14

- แก้ปุ่มขึ้น/ลงของความหนาเส้นให้ขยับครั้งละ 1 จุดพิมพ์ตามหน่วยที่เลือก โดยไม่ดีดไปค่าต่ำสุด/ค่าสูงสุด; ตั้งช่วงค่าและความละเอียดที่แสดงให้สอดคล้องกับหน่วย mm, inch และ dots
- เพิ่ม DOM unit regression ที่กด step ลงและตรวจค่าจริงในทั้งสามหน่วย
- `npm run test:basic` ผ่าน 357/357 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; ตรวจ unit/DOM เท่านั้น ไม่ได้ยืนยันการแสดงผลของตัวหมุน native บนทุกระบบปฏิบัติการ

## v0.865 — 2026-10-14

- แก้ Recently Used Objects ให้ตารางทุกแบบใช้ identity เดียว ไม่สร้างรายการซ้ำเมื่อจำนวนหรือขนาดแถว/คอลัมน์ต่างกัน; รวมรายการซ้ำเดิมจาก settings และใช้ตารางที่เพิ่มล่าสุดเป็น preset เดียว
- เพิ่ม unit/DOM regression ตรวจรายการเก่าที่ซ้ำ การแสดงปุ่มเดียว และการแทนด้วยตารางใหม่ที่มีขนาดแถว/คอลัมน์ไม่เท่ากัน
- `npm run test:basic` ผ่าน 356/356 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3
## v0.864 — 2026-10-14

- เพิ่มกลุ่ม Layer ในเมนูคลิกขวาของตาราง ให้ปรับ Bring to front, Bring forward, Send backward และ Send to back ได้โดยตรง พร้อมปิดคำสั่งที่ทำต่อไม่ได้และคงการเลือกตาราง/undo/redo
- เพิ่ม unit test สำหรับ layer ordering แบบหลาย object, การเลือกหลายชิ้น, ขอบเขต/no-op และเมนู Layer; runtime test ยืนยันการย้ายตารางและ undo/redo ใน Electron
- `npm run test:basic` ผ่าน 354/354 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; Electron runtime ยืนยันเมนู Layer, การย้ายตาราง, selection และ undo/redo ผ่าน

## v0.863 — 2026-10-14

- เมื่อเลือก object ตารางโดยยังไม่ได้เลือก cell ให้คำสั่งฟอนต์ ขนาด สี พื้นเซลล์ แนวจัดวาง ตัวหนา เอียง ขีดเส้นใต้ และขีดทับ ใช้กับทุก cell; หากเลือกบาง cell จะคงขอบเขตเฉพาะ cell ที่เลือก
- เพิ่ม unit test ตรวจเป้าหมายทั้งตาราง/เฉพาะ cell และ runtime test ยืนยันรูปแบบทุกชนิดถูกบันทึกครบทุก cell
- `npm run test:basic` ผ่าน 349/349 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; runtime cell formatting (33 checks), cell selection, cell zoom และ row-selection controls ผ่าน; `table-properties-runtime.js` ยัง fail เพราะ harness พยายามตั้ง `checked` บน control ที่เป็น null

## v0.862 — 2026-10-14

- แก้กรอบสีเขียวของ active cell ให้คำนวณตำแหน่งและขนาดใหม่ตาม row/column ทุกครั้งที่ลากเส้นแบ่ง รวมถึงหลังยืนยันหรือยกเลิกการ resize
- เพิ่ม unit regression ตรวจกรอบเลือกตามขนาดแถว/คอลัมน์ใหม่ และตรวจ live divider เรียก repaint หลังอัปเดต geometry โดยไม่ bake หรือวาด canvas เพิ่มระหว่างเฟรม
- `npm run test:basic` ผ่าน 348/348 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; runtime cell formatting, cell selection, cell zoom และ row-selection controls ผ่าน ส่วน `table-properties-runtime.js` fail เพราะ harness พยายามตั้ง checked บน control ที่ไม่มี
- ยังไม่ได้ทดสอบบนจอจริง; Electron runtime ใช้ fixture แยกและไม่ยืนยัน refresh rate ของจอ

## v0.861 — 2026-10-14

- แก้กรอบแก้ข้อความใน cell ตารางสูงเกินเส้นสีเขียวเมื่อ viewport ใช้ scale แนวนอนและแนวตั้งต่างกัน โดยคำนวณขนาดแยกตามแกนและจำกัดความสูง textarea ไม่ให้เกินแถว
- เพิ่ม regression unit test จำลอง horizontal scale 5x กับ vertical scale 2x และตรวจกรอบ editor ให้สูง 40px ตามแถว ไม่ใช่ 100px ตาม scale แนวนอน
- `npm run test:basic` ผ่าน 347/347 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; runtime `table-cell-formatting`, `table-cell-selection`, `table-cell-zoom` และ `table-row-selection-controls` ผ่าน ส่วน `table-properties-runtime.js` ยัง fail เพราะ harness อ่าน/คลิก control ที่ไม่มีใน section ปัจจุบัน
- ยังไม่ได้วัดภาพบนจอจริง; runtime test ตรวจ geometry ใน Electron ไม่ใช่การรับรอง refresh rate ของจอ

## v0.860 — 2026-10-14

- เปลี่ยนตัวเลขบน ruler แนวนอนและแนวตั้งเป็นสีเขียว และลบพื้นหลังทึบเฉพาะบริเวณตัวเลข โดยคงการล้างเส้น tick ที่ลอดใต้ตัวเลข
- เพิ่ม canvas unit test ตรวจสีและการไม่มีการวาดพื้นหลังของตัวเลขทั้งสองแกน
- `npm run test:basic` ผ่าน 346/346 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; Electron runtime `runtime-ui.js` ยังมีข้อจำกัดเดิมที่ assertion Ctrl+Z หลังแทรก QR

## v0.859 — 2026-10-14

- ลบปุ่ม `...` ออกจาก floating toolbar ของเส้น รูป และข้อความ และปรับความกว้างแถบให้พอดีกับปุ่มที่เหลือ
- เพิ่ม unit regression ยืนยันว่าไม่มีปุ่ม More และยังคง Lock, Duplicate, Delete, Move, Rotate และ Reset ตามเดิม; เมนูคลิกขวายังคงเป็นทางเข้าคำสั่งเพิ่มเติม
- `npm run test:basic` ผ่าน 344/344 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; `runtime-ui.js` ยัง fail ที่ assertion Ctrl+Z หลังแทรก QR ซึ่งเป็นข้อจำกัดเดิม ส่วน `table-ribbon-runtime.js`, `table-ribbon-switch-runtime.js`, `action-button-ui-runtime.js` และ `ribbon-history-order-runtime.js` ผ่าน
- `UNIT_TEST_BASIC.md` เพิ่มกรณี floating toolbar ไม่มีปุ่ม More สำหรับเส้น/รูป/ข้อความ และยืนยัน actions ที่เหลือ; รายงาน basic อยู่ที่ `test/basic-unit-result.json` และ `test/basic-unit-output.log`

## v0.858 — 2026-10-14

- แก้ Ctrl+B / Ctrl+I / Ctrl+U และปุ่มจัดรูปแบบให้กระทบเฉพาะช่วงข้อความที่เลือกในเซลล์ตาราง; ครอบคลุมตัวหนา/เอียง/ขีดเส้นใต้/ขีดทับ, ฟอนต์, ขนาด, สี, พื้นหลัง, inverse และ Clear Formatting
- ทำให้ตัวเรนเดอร์ preview และ bitmap ของตารางแสดง style ตามช่วงที่บันทึกไว้ รวมทั้งรักษาระยะช่วงเมื่อแทรก/ลบข้อความ
- เพิ่ม unit 6 เคส และ runtime regression ตรวจคีย์ลัด, toolbar, SVG, bitmap, Clear Formatting และการไม่เปลี่ยนตัวอักษรข้างเคียง; `npm run test:basic` ผ่าน 344/344, skipped 0 และ legacy scripts ผ่าน 3/3
- Electron table formatting/selection/zoom/row controls และ table ribbon/switch/action/history ผ่าน รวม runtime ใหม่ `table-cell-text-range-runtime.js`; `table-properties-runtime.js` ยัง fail เพราะ harness เรียก `openObjectProperties` สำหรับ table แล้วพยายามใช้ checkbox ที่ไม่มี (เคยบันทึกข้อจำกัดนี้ใน v0.854), ส่วน `runtime-ui.js` ยัง fail ที่ Ctrl+Z หลังแทรก QR (เคยบันทึกข้อจำกัดนี้ใน v0.855)
- รายงาน basic: `test/basic-unit-result.json` และ `test/basic-unit-output.log`; `git diff --check` ผ่าน
- Runtime table formatting, cell selection/zoom/row controls, ribbon/switch/action buttons และคีย์ลัดช่วงข้อความผ่าน; `table-properties-runtime.js` ยัง fail เพราะ harness เรียก `openObjectProperties` สำหรับ table แล้วพยายามใช้ checkbox ที่ไม่มี (เคยบันทึกข้อจำกัดนี้ใน v0.854), ส่วน `runtime-ui.js` ยัง fail ที่ Ctrl+Z หลังแทรก QR (เคยบันทึกข้อจำกัดนี้ใน v0.855)
- รายงาน basic: `test/basic-unit-result.json` และ `test/basic-unit-output.log`; `git diff --check` ผ่าน

## v0.857 — 2026-10-14

- เชื่อม checkbox Auto Save ใน System Settings เข้ากับระบบบันทึกจริง โดยค่าเริ่มต้นเป็น manual จนผู้ใช้เปิด Auto Save; ปิดแล้วการแก้ไขไม่ถูกเขียนเบื้องหลัง และ Ctrl+S/File → Save ยังบันทึกได้
- เปิด Auto Save ขณะมีงานค้างจะตั้งบันทึกทันที; ใน manual mode เมื่อเปลี่ยน/สร้าง label ที่มีงานค้างจะแสดง Save/Don't Save/Cancel เพื่อป้องกันการสูญหาย
- บันทึกค่าที่เลือกลง settings, ยกเลิก timer เดิมเมื่อปิด, แสดงค่าปัจจุบันเมื่อเปิด Settings และคืนค่า checkbox พร้อมแจ้ง error เมื่อบันทึก preference ไม่สำเร็จ
- เพิ่ม `test/auto-save-policy.test.js` ครอบคลุม debounce, manual mode, เปิด Auto Save ขณะ dirty, persistence และ error; เพิ่ม inventory/checklist ใน `UNIT_TEST_BASIC.md`
- `npm run test:basic` ผ่าน 338/338 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; Electron `auto-save-policy-runtime.js` ผ่านการทดสอบ settings, persistence, manual dirty edits, Save/Don't Save/Cancel และ re-enable ขณะ dirty
- `git diff --check` ผ่าน; basic report อยู่ที่ `test/basic-unit-result.json` และ `test/basic-unit-output.log`

## v0.856 — 2026-10-14

- แก้ปุ่ม Undo/Redo บน quick access ไม่ให้ค้างกรอบ active สีเขียวหลังคลิกด้วยเมาส์ โดยเอา focus ออกทันทีหลัง action; การใช้คีย์บอร์ดยังคง focus ไว้
- เพิ่ม DOM unit และ Electron runtime regression สำหรับ mouse click ที่ blur ปุ่มและ keyboard activation ที่คง focus; อัปเดต checklist ใน `UNIT_TEST_BASIC.md`
- `npm run test:basic` ผ่าน 333/333 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; `ribbon-history-order-runtime.js` ผ่านและยืนยันทั้งสองรูปแบบ focus
- Runtime `table-ribbon-runtime.js`, `table-ribbon-switch-runtime.js`, `action-button-ui-runtime.js` ผ่าน; `runtime-ui.js` ยังล้มที่ Ctrl+Z หลังแทรก QR (ปัญหาที่บันทึกไว้ตั้งแต่ v0.855)
- `git diff --check` ผ่าน; basic report อยู่ที่ `test/basic-unit-result.json` และ `test/basic-unit-output.log`

## v0.855 — 2026-10-14

- ทำให้ปุ่ม Undo และ Redo เป็นสีเทา ไม่มีกรอบ/พื้น active เมื่อ history ของปุ่มนั้นไม่มีรายการ และกลับมาใช้สีปกติเมื่อกดได้
- แยกการ sync disabled state เป็น helper และเพิ่ม DOM unit tests ตรวจสถานะ Undo/Redo แยกกัน รวมถึง computed style ของทั้งสองปุ่ม; บันทึกใน `UNIT_TEST_BASIC.md`
- `npm run test:basic` ผ่าน 332/332 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3
- Runtime `ribbon-history-order.js`, `table-ribbon-runtime.js`, `table-ribbon-switch-runtime.js`, `action-button-ui-runtime.js` ผ่าน; `runtime-ui.js` ล้มที่เคส Ctrl+Z ยกเลิกการแทรก QR ก่อนตรวจปุ่ม และล้มซ้ำเมื่อรันเดี่ยว
- `git diff --check` ผ่าน; basic report อยู่ที่ `test/basic-unit-result.json` และ `test/basic-unit-output.log`

## v0.854 — 2026-10-14

- แก้กรอบสีเขียวขณะพิมพ์แก้ไขข้อความในเซลล์ตารางให้เป็นมุมเหลี่ยม โดย override `border-radius` ที่ textarea รับมาจากสไตล์ส่วนกลาง
- เพิ่ม regression assertion ตรวจ computed border radius ของ cell editor และอัปเดต checklist ใน `UNIT_TEST_BASIC.md`
- `npm run test:basic` ผ่าน 330/330 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; runtime ตารางผ่าน 4 จาก 5 checks ที่กำหนด
- `table-properties-runtime.js` ยัง fail ที่ harness หา checkbox ของ table style ไม่พบ (`Cannot set properties of null (setting 'checked')`); เป็นข้อจำกัดเดิมของ runtime check ที่บันทึกไว้ก่อนหน้า

## v0.853 — 2026-10-14

- จัดเมนูคลิกขวาของตารางเป็นหมวด Rows, Columns, Cell, Style และ Table โดย hover หรือ focus เพื่อเปิดคำสั่งย่อย ลดจำนวนรายการระดับเมนูหลักและความสูงเมนู
- คงคำสั่งและ action เดิม รวมถึงคำสั่งลบแถว/คอลัมน์ที่แสดงเฉพาะเมื่อเลือกแกนตรงกัน; เพิ่ม unit regression สำหรับ hover, keyboard focus และการเรียก action
- `npm run test:basic` ผ่าน 330/330 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; `electron test/table-row-selection-controls-runtime.js` ผ่านการเปิดหมวดและเพิ่มแถวจาก submenu
- `git diff --check` ผ่าน; coverage gaps อื่นยังเปิดตามที่บันทึกใน `UNIT_TEST_BASIC.md`

## v0.852 — 2026-10-14

- ซ่อนจุด resize กลมที่มุมขวาบนและซ้ายล่างของตาราง แล้วแสดงปุ่ม SVG + เมื่อ hover หรือ focus
- คลิกมุมขวาบนเพิ่มคอลัมน์ และคลิกมุมซ้ายล่างเพิ่มแถวทันที โดยคงข้อมูลเดิมและรองรับ undo; เพิ่มการตรวจรูปแบบตารางและขีดจำกัด 100 แถว/คอลัมน์
- เพิ่ม unit และ Electron runtime regression checks สำหรับ SVG control, การซ่อน handle และการเพิ่มแถว/คอลัมน์ทันที
- `npm run test:basic` ผ่าน 327/327 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3
- Runtime ตารางเฉพาะทางใหม่ผ่าน รวม cell formatting/selection/zoom และ row selection; `test/table-properties-runtime.js` เดิม fail ที่ checkbox selector ว่าง เพราะไม่ได้เปิด table properties dialog ก่อนค้นหา control
- ยังมี coverage gaps อื่นตามที่บันทึกไว้ใน `UNIT_TEST_BASIC.md`

## v0.851 — 2026-10-14

- แก้เส้นที่ลากทแยงให้วาดจาก endpoint เดียวกับจุดจับ ทำให้แนวเส้นและตำแหน่งปลายทั้งสองตรงกันทุกทิศทาง
- เพิ่ม regression tests สำหรับ pointer preview/commit และ SVG rendering ครบทั้ง 4 quadrant; ปรับ checklist เส้นใน `UNIT_TEST_BASIC.md`
- `npm run test:basic` ก่อนอัปเดตเวอร์ชันผ่าน 323/323 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; กำลังรันซ้ำหลังปรับ metadata
- `npm run test:gestures` ผ่าน 41/41 unit tests และ Electron runtime checks บนจอ 120 Hz (เฉลี่ย 117.6–120 Hz); ยังไม่ได้วัดจอ 380 Hz จริง
- coverage gaps ของ basic tests ยังเปิดตามที่บันทึกใน `UNIT_TEST_BASIC.md`
## v0.850 — 2026-10-14

- แก้ตัวนำทาง record ให้แสดงเมื่อมี data source แบบ auto-row เท่านั้น และจัดรูปแบบขนาดฉลาก/กระดาษเป็นทศนิยมคงที่เพื่อไม่ให้แสดงค่า float ยาว
- ซ่อม test fixture ให้โหลด/จำลอง helper และ IPC ตามสัญญาจริง เพิ่ม assertion ขนาด stock ที่แสดง และตรวจโหลดประวัติแก้ไขใน Save As
- `npm run test:basic` ผ่าน 321/321 unit tests, skipped 0 และ legacy scripts ผ่าน 3/3; Access integration ผ่านบน Windows ACE ที่ติดตั้งในเครื่องนี้
- ยังมี coverage gaps ใน `UNIT_TEST_BASIC.md`; ผลผ่านนี้หมายถึง tests ที่มีอยู่ ไม่ได้ยืนยัน coverage ครบทุก flow ที่ระบุไว้

## v0.849 — 2026-10-14

- แก้เลขเวอร์ชันไม่แสดงบนแถบด้านบน โดยเพิ่ม badge ข้างชื่อ Q LABEL และอัปเดตพร้อมกับเวอร์ชันใน Settings, Sidebar และชื่อหน้าต่าง
- เพิ่ม DOM unit test ตรวจเลขเวอร์ชันครบทุกตำแหน่ง รวมการ normalize prefix และไม่ล้างค่าด้วยเวอร์ชันว่าง
- `test/version-display.test.js` ผ่าน 2/2; `npm run test:basic` รัน 321 unit ผ่าน 310/ล้มเหลว 11/ข้าม 0 และ legacy scripts ผ่าน 3/3 (fail อยู่ใน database navigator, barcode, clipboard, page setup, Save As และ tool placement)
- Electron `test/runtime-ui.js` ผ่าน assertion เวอร์ชันบน ribbon/Settings/Sidebar/title แล้ว แต่รันต่อไปล้มที่ Ctrl+Z test เดิมซึ่งไม่เกี่ยวกับเวอร์ชัน

## v0.848 — 2026-10-14

- เพิ่ม regression test ที่จำลอง double-click เข้า cell editor แล้วลบข้อความหลายบรรทัดผ่าน `input` event เพื่อยืนยันว่าแถวและตารางยุบตามข้อความจริง ไม่ได้ทดสอบเฉพาะฟังก์ชันย่อแถวโดยตรง
- อัปเดต checklist ตารางใน `UNIT_TEST_BASIC.md` ให้ครอบคลุมเส้นทางแก้ข้อความใน cell editor
- `test/table-content-fit.test.js` ผ่าน 5/5; `npm run test:basic` รันครบทุก unit และ legacy scripts โดยผลและความล้มเหลวของระบบอื่นที่ไม่เกี่ยวกับการยุบแถวบันทึกตามรอบล่าสุดในรายงาน
- `test/table-cell-selection-runtime.js` ผ่าน; runtime test นี้ตรวจ cell selection/formatting ไม่ใช่การวัดการแสดงผลจอจริง

## v0.847 — 2026-10-14

- แก้ให้แถวและตารางย่อตามทันทีเมื่อแก้ข้อความหลายบรรทัดให้สั้นลงหรือลบออก โดยอัปเดต content minimum และปรับความสูงตารางตามส่วนที่แถวลดลง
- เพิ่ม regression unit test ใน `table-content-fit.test.js` ตรวจขนาดแถว ขนาดตาราง และแถวข้างเคียง
- ตรวจ unit test เฉพาะตาราง 4/4 ผ่าน; ชุด basic ทั้งระบบรันแล้วและยังพบความล้มเหลวเดิมหลายส่วน (รายงานล่าสุดจะบันทึกจำนวนจริง)

## v0.846 — 2026-10-14

- แก้กระตุกตอนขยาย/หดความสูงแถว (และเส้นคอลัมน์): ระหว่างลากใช้ `updateTableSVG` สด ไม่ bake และไม่ `drawEditorCanvas` ทุกเฟรม — bake/fit ครั้งเดียวตอนปล่อยเมาส์
- เพิ่ม unit test `table-divider-gesture.test.js`
- ตรวจด้วย `npm run test:basic`; ความลื่นบนจอจริงยังขึ้นกับความซับซ้อนของตาราง

## v0.845 — 2026-10-14

- แก้หดแถวตารางที่มีข้อความให้ลงมาพอดีกับข้อความได้: เลิกให้ contentMin ติดล็อกสูงเกิน (ไม่นำ contentMin เก่ามาคำนวณซ้ำ) และใช้ความสูงบรรทัดเดียวกับ preview
- เพิ่ม unit test `table-content-fit.test.js`
- ตรวจด้วย `npm run test:basic`; การลากเส้นแถวบนจอจริงยังขึ้นกับฉาก

## v0.844 — 2026-10-14

- ลดค้างตอนลาก/ย่อ-ขยายต่อ: gesture undo แชร์ database rows และ object ที่ไม่ถูกแก้, เลื่อน record revision ไปหลังปล่อยเมาส์, เทียบ revision ด้วย fingerprint แทน JSON.stringify, ไม่ rebuild canvas ทั้งหน้าตอนเริ่มลาก และไม่สร้าง SVG ใหม่ทุกเฟรมตอน resize กล่อง/วงรี
- ขยาย unit test `edit-history.test.js` ตาม UNIT_TEST_BASIC.md
- ตรวจด้วย `npm run test:basic`; ความลื่นบนจอจริงยังขึ้นกับความซับซ้อนของฉาก

## v0.843 — 2026-10-14

- แก้ค้าง ~1 วินาทีตอนเริ่มลากหรือย่อ-ขยาย object: ไม่ JSON.stringify เทมเพลตทั้งก้อนรวม bitmap บนเฟรมแรก ให้ clone เบาแบบแชร์สตริงภาพ และเลื่อนบันทึก edit history ออกจาก hot path
- เพิ่ม unit test `edit-history.test.js` (แชร์ bitmap_hex, ความเร็วเทียบ JSON, revive/serialize)
- ตรวจด้วย `npm run test:basic` (unit ที่เกี่ยวกับ undo/gesture ผ่าน; ชุดอื่นยังมี fail เดิมนอกขอบเขต เช่น Save As harness); `test:gestures` unit 40 ผ่าน แต่ runtime text-move พลาดงบเฟรมจอ 120 Hz ครั้งนี้ (เฉลี่ย ~84 Hz)

## v0.842 — 2026-10-14

- แก้ resize สร้าง SVG ทั้งหน้าใหม่และ rasterize ตารางซ้ำทุกเฟรม ให้เปลี่ยนเฉพาะ object ที่กำลังลาก และบันทึกภาพตารางหลังปล่อยเมาส์
- รวม pointer event เป็นตำแหน่งล่าสุดหนึ่งครั้งต่อ requestAnimationFrame ตามรอบ refresh ของจอ ไม่มีการล็อกที่ 60 หรือ 120 Hz
- ใช้ cache สำหรับวัดข้อความและแยก grapheme; เลิกอ่านพิกัด paste และ hover ระหว่าง transform
- แก้การปล่อยเมาส์ก่อนเฟรมถัดไปและลากกลับตำแหน่งเริ่มต้นไม่ให้ค้างพิกัดเก่า
- unit test ผ่าน 40 ข้อ รวมรอบเฟรมจำลอง 60/120/144/240/380 Hz; runtime benchmark จอ 120 Hz ผ่านการลาก/ขยายกล่อง ข้อความ ตาราง และรูปภาพ
- 380 Hz เป็นการทดสอบ scheduler แบบจำลอง ยังไม่ได้วัดการแสดงผลจริงบนจอ 380 Hz และ FPS ขึ้นกับความซับซ้อนของฉากกับฮาร์ดแวร์
- อัปเดตด้วยการ reload renderer ของโปรแกรมเดิม ไม่ restart โปรแกรม

## v0.841 — 2026-10-14

- ดักเหตุการณ์ปิดหน้าต่างใน Electron ก่อนเกิด native beforeunload alert เพื่อแสดงกล่อง Save ของแอปแทน
- เชื่อมปุ่ม Save / Don’t Save เข้ากับการอนุมัติปิดหน้าต่างหลังบันทึกหรือทิ้งการแก้ไขเสร็จ
- ยืนยันสีเขียวและไอคอน SVG ของปุ่ม Save ในกล่องยืนยัน
- ตรวจ syntax และ diff แล้ว; ยังไม่ทดสอบการปิดหน้าต่างจริง

## v0.840 — 2026-10-14

- เพิ่มไอคอน SVG บันทึกสีขาวให้ปุ่ม Save ในกล่องถามบันทึกก่อนปิด พร้อมจัดไอคอนและข้อความให้อยู่กึ่งกลาง
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ทดสอบกล่องถามบันทึกในหน้าจอจริง

## v0.839 — 2026-10-14

- ใช้ค่าความโปร่งใส 30% และเบลอ 18px ร่วมกันกับแถบซูม แถบเลือกเทมเพลต และแถบ Recent Objects
- ทำพื้นหลังภายในแถบ Recent Objects ให้โปร่งใส เพื่อให้เห็นเอฟเฟกต์กระจกและฉากหลังสม่ำเสมอ
- ตรวจ diff แล้ว; ยังไม่ได้ตรวจภาพจริงในแอป

## v0.838 — 2026-10-14

- จัดกรอบเลือกเซลล์ให้ใช้ตำแหน่งขอบเดียวกับเส้นตารางโดยไม่ปัดตามพิกเซลของภาพ
- ปรับโหมดแก้ไขให้ใช้ฟอนต์ ขนาด ความหนาเอียง ระยะบรรทัด และความกว้างข้อความชุดเดียวกับเซลล์ เพื่อให้จำนวนบรรทัดก่อนและระหว่างแก้ไขตรงกัน
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้เปิดทดสอบภาพจริง

## v0.837 — 2026-10-14

- ป้องกันข้อความในตารางถูกตัดเมื่อย่อคอลัมน์ โดยคำนวณความกว้างต่ำสุดจากตัวอักษรที่กว้างที่สุดและให้ข้อความตัดบรรทัด
- คำนวณความสูงขั้นต่ำของแต่ละแถวตามข้อความที่ตัดบรรทัด และจำกัดการย่อแถวไม่ให้ต่ำกว่าความสูงที่แสดงข้อความได้
- ขยายตารางเมื่อขนาดขั้นต่ำของเนื้อหาเกินขนาดกรอบ และรองรับการลากเส้นแบ่งทั้งแถว/คอลัมน์แบบคู่และแบบปรับตาราง
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ลากปรับขนาดผ่านหน้าจอจริง

## v0.836 — 2026-10-14

- แก้ Alt+Q ให้ทำงานได้ตามปุ่ม Q จริง แม้ layout แป้นพิมพ์จะแสดงตัวอักษรคนละตัว
- จำกัดคีย์ลัดให้เป็น Alt+Q โดยไม่ชน Ctrl/AltGr และโฟกัสช่องค้นหาโดยไม่เลื่อนหน้า
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้กดคีย์ลัดผ่านหน้าจอจริง

## v0.835 — 2026-10-14

- ทำไอคอนเมฆเป็นสวิตช์ Auto Save ที่จำสถานะไว้ และเปลี่ยนเป็นไอคอน Save เมื่อปิด
- คงคำสั่ง File > Save / Ctrl+S ไว้สำหรับบันทึกเองเมื่อปิด Auto Save
- เพิ่มกล่องยืนยันแบบ Save / Don’t Save / Cancel เมื่อปิดหน้าต่างขณะมีการแก้ไขค้าง; Don’t Save จะข้ามการบันทึกตอนปิดจริง
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้คลิกทดสอบกล่องยืนยันในหน้าจอจริง

## v0.834 — 2026-10-14

- ทำไอคอนเมฆบนแถบด้านบนเป็นปุ่มเปิด/ปิด Auto Save และแสดงสถานะด้วยไอคอนเมฆหรือ Save
- เมื่อปิด Auto Save การแก้ไขจะยังไม่ถูกบันทึกเอง; ใช้ File > Save เพื่อบันทึกเองได้
- เมื่อปิดหน้าต่างขณะมีงานค้าง จะแสดง Save / Don’t Save / Cancel และ Don’t Save จะทิ้งงานค้างจริง
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจกล่องยืนยันบนหน้าจอจริง

## v0.833 — 2026-10-14

- เปลี่ยนคำสั่ง Save ในเมนู File เป็น Auto Save พร้อมไอคอนเมฆและเครื่องหมายถูก
- เพิ่มคำอธิบายว่าเอกสารถูกบันทึกอัตโนมัติ และคลิกเพื่อบันทึกทันทีได้
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจภาพหน้าจอหลังรีโหลด

## v0.832 — 2026-10-14

- ข้อความในทุกเซลล์ตัดบรรทัดตามความกว้างคอลัมน์ ทั้งข้อความปกติและข้อความที่จัดรูปแบบ
- ขยายความสูงของแถวตามข้อความเมื่อแก้เนื้อหา หรือบีบคอลัมน์ให้แคบลง โดยรักษาตำแหน่งข้อความและเส้นตารางให้ตรงกัน
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจภาพหน้าจอหลังรีโหลด

## v0.831 — 2026-10-14

- เปลี่ยนไอคอนแผ่นดิสก์เป็นเมฆพร้อมเครื่องหมายถูก เพื่อสื่อว่าบันทึกอัตโนมัติ
- เพิ่มชื่อช่วยการเข้าถึงและคำอธิบายไอคอนว่า Auto save is on
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจภาพหน้าจอหลังรีโหลด

## v0.830 — 2026-10-14

- เอาปุ่มไอคอนบันทึกออกจากแถบเครื่องมือด่วนด้านบนตามภาพ
- คำสั่ง Undo และ Redo ยังคงอยู่ในแถบเดิม
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจภาพหน้าจอหลังรีโหลด

## v0.829 — 2026-10-14

- ไม้บรรทัดแสดงเฉพาะเลขจำนวนเต็ม เช่น 0, 1, 2, 3, 4 และซ่อนเลขเศษส่วนอย่าง 0.5 หรือ 1.5
- ยังคงเส้นขีดย่อยไว้ และเว้นระยะตัวเลขเพื่อให้อ่านชัดทั้งแนวนอนและแนวตั้ง
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจภาพหน้าจอหลังรีโหลด

## v0.828 — 2026-10-14

- ปรับแถบโลโก้ให้กว้างตามเนื้อหา ลดช่องว่างก่อนปุ่มบันทึกและชื่อเอกสาร
- ตรวจ diff แล้ว; ยังไม่ได้ตรวจภาพหน้าจอหลังรีโหลด

## v0.827 — 2026-10-14

- เพิ่มตัวอย่างสีข้อความและสีพื้นเซลล์ทันทีระหว่างเลือกสีในตาราง
- เมื่อยืนยันสีจะบันทึกลงรูปแบบเซลล์ที่เลือกตามเดิม; หากยกเลิกการเลือก สีตัวอย่างจะกลับตามค่าที่บันทึกไว้
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ทดสอบการเลือกสีผ่านหน้าต่างสีจริง

## v0.826 — 2026-10-14

- ลดความถี่ตัวเลขไม้บรรทัด แสดงเฉพาะขีดหลักบนหน้ากระดาษและเว้นระยะอย่างน้อย 64 พิกเซล
- ลดการกระตุกระหว่างซูมโดยขยาย SVG เดิมระหว่างแอนิเมชัน แล้ววาดตัวควบคุมใหม่เมื่อซูมจบ
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้วัดความลื่นบนจอจริง

## v0.825 — 2026-10-14

- ปรับไม้บรรทัดแนวนอนและแนวตั้งให้แสดงตัวเลขเฉพาะขีดหลัก โดยเว้นขีดย่อยไว้ช่วยอ่านระยะ
- รองรับค่าขีดหลักแบบทศนิยมเมื่อซูมมาก และลดปัญหาตัวเลขเบียดกันจนอ่านยาก
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ทดสอบภาพไม้บรรทัดในหน้าจอแอปจริง

## v0.824 — 2026-10-14

- ปุ่ม Bold, Italic, Underline และ Strikethrough แสดง active เมื่อรูปแบบนั้นเปิดอยู่ในเซลล์ที่เลือก
- คลิกปุ่มเพื่อเปิดรูปแบบให้ทุกเซลล์ที่เลือก หรือปิดทั้งหมดเมื่อเปิดอยู่ครบ และอัปเดตสถานะหลังเปลี่ยน
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ทดสอบสถานะปุ่มในหน้าจอแอปจริง

## v0.823 — 2026-10-14

- ปรับลากเส้นแบ่งแถว/คอลัมน์ให้ประมวลผลตำแหน่งล่าสุดเพียงครั้งเดียวต่อ animation frame ตาม refresh rate ของจอ
- รวมการ bake ตารางและวาด canvas ไว้ในรอบเดียวต่อเฟรม และบันทึกประวัติ/เอกสารเมื่อปล่อยเมาส์
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้วัด frame rate บนจอจริง

## v0.822 — 2026-10-14

- แก้ปุ่ม Underline ให้สลับรูปแบบตามทุกเซลล์ที่เลือก: ถ้ายังไม่ครบจะขีดเส้นใต้ทั้งหมด และถ้าขีดอยู่ครบแล้วจะปิดทั้งหมด
- อัปเดตสถานะปุ่มและ render ตารางหลังเปลี่ยนค่า
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ทดสอบคลิกในหน้าจอแอปจริง

## v0.821 — 2026-10-14

- แก้การแสดง Italic ของเซลล์ตารางให้ใช้ cell style ทั้งใน canvas และ SVG preview พร้อมรองรับการปิดรูปแบบเฉพาะเซลล์
- ทำให้ Bold, Underline และ Strikethrough ใช้ค่า override ของ cell style อย่างสอดคล้องกัน
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ทดสอบการแสดง Italic ในหน้าจอแอปจริง

## v0.820 — 2026-10-14

- ย้ายช่อง Search tools มาอยู่แถวเดียวกับโลโก้ ชื่อเอกสาร และปุ่ม Quick Access พร้อมจัดกึ่งกลางแถว
- เอาแถวค้นหาแยกออกเพื่อไม่ให้เพิ่มความสูงหรือดันแถบชื่อระบบลง
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจตำแหน่งจริงในหน้าต่างแอป

## v0.819 — 2026-10-14

- แก้ปุ่มเพิ่ม/ลดขนาดตัวอักษรใน Table ribbon ให้คง selection ของเซลล์และส่งค่าปรับไปยังตารางจริง
- ช่องตัวเลขยืนยันการแก้ด้วย Enter หรือเมื่อออกจากช่อง เพื่อให้แก้ค่าได้โดยไม่ขัดจังหวะระหว่างพิมพ์
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ทดสอบการปรับขนาดในหน้าจอแอปจริง

## v0.818 — 2026-10-14

- จัดช่อง Search tools ให้อยู่กึ่งกลางในแถวบนสุดของ ribbon โดยแยกจากแถวแท็บ
- คงแบรนด์ ชื่อเอกสาร และปุ่ม Quick Access ไว้แถวล่าง ไม่ให้ตกลงไปปะปนกับแถวค้นหา
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจตำแหน่งจริงในหน้าต่างแอป

## v0.817 — 2026-10-14

- ปรับเส้นแบ่งแถว/คอลัมน์และกรอบเลือกเซลล์ให้ใช้พิกัดที่คำนวณจากความละเอียด bitmap เดียวกัน เพื่อลดความคลาดสะสมระหว่างเส้นตารางกับ highlight
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจภาพในหน้าจอแอปจริง

## v0.816 — 2026-10-14

- ย้ายช่อง Search tools ไปไว้แถวบนสุดเหนือแถบ Quick Access และแท็บ เหมือนตำแหน่งค้นหาใน Word
- ลดช่องว่างระหว่างแบรนด์ ปุ่ม Save/Undo/Redo และชื่อเอกสารให้แถบบนชิดกันขึ้น
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจหน้าตาในแอปจริง

## v0.815 — 2026-10-14

- ปรับกรอบ highlight ของเซลล์ตารางให้ใช้ขนาดตามขอบเซลล์จริง และไม่ย่อเพิ่มตามความหนาเส้นตาราง
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจภาพในหน้าจอแอปจริง

## v0.814 — 2026-10-14

- ป้องกันชื่อ object ใน Recently Used Objects ซ้ำกัน โดยสร้างชื่อจากชนิด/รายละเอียด เช่น ขนาดตาราง ชื่อไฟล์ภาพ หรือรหัสสัญลักษณ์ และเติมลำดับเมื่อชื่อฐานซ้ำ
- คงการรวม object ที่ซ้ำกันตาม identity และปรับชื่อข้อมูลเก่าที่บันทึกไว้ตอนแสดงรายการ
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ตรวจการแสดงผลในหน้าจอแอปจริง

## v0.813 — 2026-10-14

- เมนูตารางแสดง Delete Row เฉพาะเมื่อเลือกแถว และ Delete Column เฉพาะเมื่อเลือกคอลัมน์ รองรับการเลือกหลายแถวหรือหลายคอลัมน์แล้วลบทั้งหมดที่เลือก
- เมื่อเลือกครบทุกเซลล์ ซ่อน Delete Row และ Delete Column เพื่อให้ใช้ Delete Table แทน
- ตรวจ syntax และ diff แล้ว; ยังไม่ได้ทดสอบการคลิกและลบในหน้าจอแอปจริง

## v0.812 — 2026-10-14

- เมื่อเลือกครบทุกเซลล์ในตาราง ซ่อนปุ่ม ... รายแถวและรายคอลัมน์ แล้วแสดงปุ่มเมนูตารางเพียงปุ่มเดียวตรงกึ่งกลางด้านบน
- ปุ่มเมนูเดียวเปิดคำสั่งตารางเดิม โดยอิงเซลล์ที่ active ล่าสุด และไม่เปลี่ยนปุ่มเมื่อเลือกเพียงบางเซลล์/บางแถว/บางคอลัมน์
- ตรวจ syntax และเลขเวอร์ชันแล้ว; ตรวจการแสดงผลและเมนูบนหน้าจอแอปจริง

## v0.811 — 2026-10-14

- เพิ่มแถบคำสั่งด่วนด้านบนแบบ Word พร้อมปุ่มบันทึก, Undo และ Redo ที่เรียกคำสั่งเดิมของโปรแกรม และแสดงชื่อเอกสาร
- เปลี่ยนแถบหน้าต่าง Windows เป็นพื้นที่ title bar สีอ่อนพร้อมปุ่มหน้าต่างเดิม และวางแถบ Quick Access กับ Ribbon ไว้ด้านล่างอย่างเป็นระเบียบ
- ตรวจ syntax, เลขเวอร์ชัน และหน้าตาแถบในหน้าต่างแอปจริงแล้ว; ยังไม่ได้กดทดสอบคำสั่ง Save/Undo/Redo แยกทีละปุ่ม

## v0.810 — 2026-10-14

- กำหนดค่าเริ่มต้นการจัดแนวเซลล์เป็นชิดซ้ายและชิดบน เพื่อไม่ให้ dropdown ว่างเมื่อแถวหรือคอลัมน์ใช้ค่า Start/Center/End
- ทำให้การจัดแนวซ้าย กลาง ขวา และบน กลาง ล่าง ส่งผลกับตำแหน่งข้อความในภาพตัวอย่างตารางจริง
- เพิ่ม runtime test ตรวจ 33 เงื่อนไข; ผ่านชุดจัดรูปแบบเซลล์และ unit tests ของ Table Design 15 กรณี; ชุด Table Properties เก่าล้มเหลวเพราะเรียก API ที่ไม่เปิดคุณสมบัติตารางแล้ว

## v0.809 — 2026-10-14

- ขยายคอลัมน์สุดท้ายให้เต็มความกว้างกรอบตาราง เมื่อขนาดคอลัมน์รวมสั้นกว่ากรอบ เพื่อกำจัดแถบขาวด้านขวา
- ใช้การคำนวณเดียวกันในตัววาดตารางและเครื่องมือแก้ไข เพื่อให้เส้นขอบตรงกัน
- ตรวจ syntax ผ่าน; ยังไม่ได้ตรวจการวาดตารางบนหน้าจอจริง
## v0.808 — 2026-10-14

- ลดความหนาเส้นเริ่มต้นของเส้นตรง สี่เหลี่ยม และวงรีจาก 0.4 mm เป็น 0.3 mm (บางลง 25%)
- กำหนดค่าต่ำสุดของช่องความหนาเส้นเป็นหนึ่งจุดพิมพ์ และแสดงทศนิยม 2 ตำแหน่งเพื่อไม่ให้ค่าบางแสดงเป็น 0.0
- ตรวจ syntax ผ่าน; ยังไม่ได้ตรวจการวาดเส้นบนหน้าจอจริง

## v0.807 — 2026-10-14

- ซ่อนคำสั่งที่ใช้ไม่ได้จากเมนูคลิกขวาบนพื้นที่ว่าง รวมถึงตัวควบคุมจัดรูปแบบที่ปิดใช้งาน
- คงไว้เฉพาะเครื่องมือที่พร้อมใช้งาน และจัด divider ตามกลุ่มที่แสดงจริง
- ตรวจ syntax ผ่าน; ยังไม่ได้ตรวจเมนูบนหน้าจอจริง

## v0.806 — 2026-10-14

- ขยับปุ่มปรับความโค้งมุมของภาพออกจากมุมกรอบ 12 px เพื่อลดการซ้อนกับจุดจับเลือกวัตถุ
- ตรวจ syntax ผ่าน; ยังไม่ได้ตรวจตำแหน่งบนหน้าจอจริง

## v0.805 — 2026-10-14

- รองรับการลาก Database Field ลงบนเซลล์ตารางโดยตรง โดยบันทึกเป็นตัวแปรที่เชื่อมกับฐานข้อมูล
- เพิ่มการอ่านตัวแปรจากเซลล์ตารางในพรีวิวและการเลือกชุดข้อมูลตามเรคคอร์ด
- ตรวจไวยากรณ์ไฟล์ JavaScript แล้ว; ยังไม่ได้รันทดสอบการทำงานในแอป

## v0.804 — 2026-10-14

- จำกัดการจัดรูปแบบและการจัดแนวให้มีผลเฉพาะเซลล์ที่เลือก รองรับการเลือกหลายเซลล์ และปิดคำสั่งเมื่อไม่มีเซลล์ที่เลือก
- รองรับฟอนต์ ขนาด สีพื้น สีข้อความ ตัวหนา ตัวเอียง ขีดเส้นใต้ ขีดฆ่า และแนวข้อความแยกตามเซลล์
- เพิ่ม runtime test สำหรับการเลือกเดี่ยว หลายเซลล์ การไม่เปลี่ยนเซลล์อื่น และกรณีไม่มีเซลล์ที่เลือก; ผ่าน

## v0.803 — 2026-10-14

- แก้คำสั่ง Strikethrough ให้ใช้ property `strike` ที่ตัววาดข้อความรองรับ
- ให้ Italic, Underline และ Strikethrough จัดรูปแบบเฉพาะเซลล์ที่เลือกผ่าน cell styles

## v0.802 — 2026-10-14

- ปิดเมนูคลิกขวาของตารางทันทีเมื่อกดเมาส์นอกเมนู รวมถึงคลิกซ้ายเลือกเซลล์อื่น

## v0.801 — 2026-10-14

- แก้กรอบเลือกเซลล์ตารางค้างตำแหน่งเดิม โดยวาดกรอบใหม่หลังตารางเปลี่ยนขนาดหรือจบการลาก
- ล้างกรอบเลือกเซลล์เมื่อเปลี่ยนการเลือกออกจากตาราง

## v0.800 — 2026-10-14

- แก้ข้อความในเซลล์ตารางที่ใช้ฟอนต์จัดรูปแบบให้ตัดบรรทัดตามความกว้างช่องเสมอ
- คำนวณความสูงแถวจากขนาดฟอนต์และระยะบรรทัดที่แสดงจริง พร้อมตัดบรรทัดภาษาไทยโดยไม่แยก combining grapheme

## v0.799 — 2026-10-14

- ขณะลากตาราง ให้ย้ายกรอบไฮไลต์เซลล์ไปพร้อมกับตัวตารางแบบเรียลไทม์

## v0.798 — 2026-10-14

- ปรับกรอบไฮไลต์เซลล์ตารางให้เยื้องเข้าด้านในตามความหนาเส้นกริดและระดับซูม ลดการทับเส้นแบ่งช่อง

## v0.797 — 2026-10-14

- ปรับแถบจัดรูปแบบสองแถวในเมนูคลิกขวา Home ให้เลื่อนแนวนอนด้วย scrollbar เดียวร่วมกัน
- ตรวจการจัด DOM และ CSS ของแถบเลื่อนร่วมด้วยชุดทดสอบเฉพาะ

## v0.796 — 2026-10-14

- เพิ่มคำสั่ง Group/ Ungroup บนเมนูคลิกขวา Canvas และรองรับ Ctrl+G
- เมื่อเลือกวัตถุที่จัดกลุ่ม จะเลือกและคัดลอกสมาชิกทั้งกลุ่มจาก Canvas ได้
- วางหรือทำสำเนากลุ่มแล้วแยก group id เพื่อไม่ให้กระทบกลุ่มเดิม
- ทดสอบ Group, Ungroup, คัดลอก/วางจากเมนู Canvas และ Ctrl+G ใน Electron ผ่าน

## v0.795 — 2026-10-12

- ย้ายกลุ่ม Undo/Redo ไปต่อจากกลุ่ม Clipboard ซึ่งมีคำสั่ง Delete object บน Home Ribbon
- ทดสอบลำดับกลุ่ม Ribbon ใน Electron ผ่าน

## v0.794 — 2026-10-12

- เพิ่ม SVG ที่แตกต่างและสื่อหน้าที่ของคำสั่งแถบ Picture เช่น แทนที่ภาพ ลบพื้นหลัง ความโปร่งใส หมุน และกลับภาพ
- ตรวจคำสั่งภาพ 9 รายการใน Electron ว่ามี SVG ครบและไม่ซ้ำกัน

## v0.793 — 2026-10-12

- แก้การคืนแท็บ Ribbon หลังเลิกเลือกตาราง ไม่ให้เปิดเมนู File เองเมื่อไม่มีแท็บเดิม
- คง Navbar ของ Picture เมื่อคลิกเลือกภาพต่อจากตาราง
- ทดสอบเลือกตารางไปภาพและล้างการเลือกใน Electron ผ่าน

## v0.792 — 2026-10-12

- แสดงเมนูจุดสามจุดของการเลือกเซลล์ไว้กึ่งกลางขอบบนของตาราง แทนตำแหน่งหัวช่อง
- ให้เมนูที่เปิดจากปุ่มนี้อ้างอิงแถวและคอลัมน์ของเซลล์ที่เลือก
- เพิ่มการตรวจสอบตำแหน่งปุ่ม เมนู และคำสั่งเพิ่มแถวใน Electron

## v0.791 — 2026-10-12

- ซ่อนแถบเครื่องมือตารางด้านล่างทันทีเมื่อเปลี่ยนจากแท็บ Table ไปแท็บ Home หรือแท็บ Ribbon อื่น
- แสดงแถบเครื่องมือตารางอีกครั้งเมื่อเลือกแท็บ Table
- ทดสอบสลับ Home/Table ใน Electron ผ่าน

## v0.790 — 2026-10-12

- ให้ช่องแก้ไขเซลล์ตารางติดตามตำแหน่ง ขนาด และตัวอักษรตามการซูมและเลื่อนกระดาษทุกเฟรม
- แก้การอ้างอิงข้อมูลเก่าหลังอ่าน draft เพื่อให้ข้อความและความสูงแถวอัปเดตตรงกับตารางที่บันทึก
- ทดสอบใน Electron ผ่านทั้งซูมเข้า/ออก ตำแหน่งเซลล์ ขนาดตัวอักษร แถวขยายระหว่างพิมพ์ และกด Esc แล้วข้อความคงอยู่

## v0.789 — 2026-10-12

- ให้ข้อความในเซลล์ตารางตัดบรรทัดตามความกว้างของช่องจริง รวมถึงข้อความภาษาไทย
- ขยาย/ย่อความสูงแถวทันทีระหว่างพิมพ์ และคงข้อความพร้อมความสูงแถวเมื่อกด Esc เพื่อออกจากช่อง

## v0.788 — 2026-10-12

- นำหน้าต่าง Object Properties ออกจากแอป รวมถึง Barcode Properties และ Picture Properties
- ลบคำสั่ง Properties จากเมนูคลิกขวาและแถบ Picture; คำสั่ง Edit ยังคงใช้แก้ข้อความแบบ inline ได้

## v0.787 — 2026-10-12

- ปรับแถบ Home ในเมนูคลิกขวาให้แบ่งเครื่องมือจัดรูปแบบเป็นสองแถว ลดการเลื่อนแถบทั้งชุด
- เมื่อแต่ละแถวยาวเกินพื้นที่ เลื่อนได้เฉพาะแถวนั้นเพื่อให้ยังเข้าถึงทุกคำสั่ง
- ตรวจจำนวนแถวและการเลื่อนแยกแต่ละแถวผ่าน DOM test

## v0.786 — 2026-10-12

- เพิ่มตัวควบคุมปรับรัศมีมุมให้ภาพที่เลือก โดยลากหรือใช้ปุ่มลูกศรและ Home/End
- ตัดมุมโค้งของภาพให้ตรงกันใน Canvas, SVG preview และภาพ raster ที่ส่งออก
- ทดสอบตัวควบคุมจริงใน Electron และตรวจว่าพื้นที่ภาพถูกตัดตามมุมผ่าน

## v0.784 — 2026-10-12

- เพิ่มแท็บ Picture ใน Ribbon เมื่อเลือกภาพ พร้อมคำสั่งแทนที่ภาพ ลบพื้นหลัง ปรับพื้นโปร่งใส หมุน กลับภาพ เปิดคุณสมบัติ ลบ คัดลอก ทำซ้ำ ล็อก และจัดแนว/ลำดับภาพ
- เชื่อมการกลับภาพแนวนอนและแนวตั้งให้แสดงผลทั้งใน Canvas และภาพที่ส่งออก
- ทดสอบการเลือกภาพและคำสั่งลบพื้นหลัง/กลับภาพใน Electron จริงผ่าน

## v0.783 — 2026-10-12

- เพิ่ม Remove background ในเมนูภาพและหน้าแก้ไขภาพ เพื่อลบพื้นขาวของภาพขาวดำเป็นโปร่งใส โดยเก็บลายภาพเดิม
- ภาพที่นำเข้าใหม่ใช้พื้นโปร่งใส และแสดงตารางหมากรุกใน preview ของตัวแก้ไขภาพ
- ทดสอบคลิกปุ่มใน Electron จริง: alpha ของพื้นเปลี่ยนจาก 255 เป็น 0 ลายภาพคงเดิม และบันทึกความโปร่งใสกลับไฟล์ได้ ผ่านทั้งเมนูภาพและหน้าแก้ไขภาพ

## v0.782 — 2026-10-12

- เพิ่มเมนู Recent Files ใน dropdown File สำหรับไฟล์ label ที่เคยเปิดหรือตั้งแต่สร้างและบันทึก
- บันทึกลำดับและเวลาที่เปิดล่าสุด แสดงรายการ 50 ไฟล์ล่าสุด พร้อมค้นหาและเปิดกลับได้
- ตรวจ syntax ผ่าน; ไม่ได้ทดสอบการเปิดไฟล์ผ่านหน้าจอ

## v0.781 — 2026-10-12

- แก้ไฮไลต์ล้นกระดาษให้คำนวณตำแหน่งเป็นรูปทรงคงที่ตามหน้า และอัปเดตเส้นทางวัตถุทุกเฟรมขณะลาก
- ป้องกัน mask ของพื้นที่กระดาษเลื่อนตามวัตถุ ทำให้ส่วนที่ล้นแสดงทันทีโดยไม่ต้องปล่อยเมาส์
- ตรวจ syntax ผ่าน; ไม่ได้ทดสอบการลากในแอป

## v0.780 — 2026-10-12

- ตรวจการล้นกระดาษตามรูปทรงจริง รวมถึงมุมมนและวงรี ไม่ยึดเฉพาะกรอบสี่เหลี่ยมของหน้า
- แสดงไฮไลต์ส่วนที่วัตถุเลยแนวโค้งมุมกระดาษ ทั้งก่อนและระหว่างลาก
- ตรวจ syntax ผ่าน; ไม่ได้ทดสอบภาพในแอป

## v0.779 — 2026-10-12

- ปรับช่องเลือกขนาดตารางให้เป็นช่องสี่เหลี่ยมสม่ำเสมอ และแสดงขนาดที่เลือกชัดเจน
- ปรับรายการคำสั่งใต้ช่องตารางให้ใช้ขนาดปุ่ม ระยะห่าง ไอคอน และสถานะโฟกัสตามมาตรฐานเดียวกับเมนูอื่น
- จัดตำแหน่งเมนูให้อยู่ในหน้าต่าง และเพิ่มการเลือกช่องด้วยคีย์บอร์ด
- ตรวจ syntax ผ่าน; ไม่ได้ทดสอบการโต้ตอบในแอป

## v0.778 — 2026-10-12

- แสดง SVG ที่นำเข้าโดยไม่มีพื้นหลังสีขาว เพื่อให้ส่วนโปร่งใสของภาพแสดงตามจริง
- ตรวจ syntax ผ่าน

## v0.777 — 2026-10-12

- ปรับให้ไฮไลต์ส่วนที่วัตถุล้นขอบกระดาษอัปเดตตามทันทีระหว่างลาก รวมทั้งวัตถุที่หมุน
- ขยับชั้นไฮไลต์พร้อมวัตถุโดยไม่เรนเดอร์หน้าใหม่ทุกเฟรม และเผื่อขอบเขต mask ระหว่างลาก
- ตรวจ syntax ผ่าน

## v0.776 — 2026-10-12

- อนุญาตให้ลาก object เลยขอบกระดาษได้ทุกด้าน รวมถึงขอบบน โดยไม่บังคับตำแหน่งให้อยู่ในกระดาษ
- ตรวจ syntax ผ่าน

## v0.775 — 2026-10-12

- แก้ modal ที่ปิดอยู่ไม่ให้แสดงตั้งแต่เปิดแอป โดยจำกัด layout sticky ไว้เฉพาะ dialog ที่เปิด
- ตรวจ syntax ผ่าน

## v0.774 — 2026-10-12

- จัดปุ่มท้าย modal ให้อยู่ติดด้านล่าง พร้อมเลื่อนเนื้อหาแยกด้านบน และใช้กับ modal อื่นที่มี footer
- ตรวจ syntax ผ่าน; ยังไม่ได้ตรวจ modal ทุกชนิดบนหน้าจอจริง

## v0.773 — 2026-10-12

- ปรับไอคอน SVG ในปุ่ม Print ให้ใช้สีน้ำเงินเข้มและมองเห็นชัดบนพื้นปุ่ม

## v0.772 — 2026-10-12

- เอากรอบโฟกัสด้านข้างของปุ่มแท็บ Template ออกเมื่อคลิก และคงเครื่องหมายแท็บที่เลือก

## v0.771 — 2026-10-12

- ไฮไลต์สีโปร่งแสงเฉพาะส่วนของวัตถุที่ล้นออกนอกกระดาษ เพื่อให้เห็นตำแหน่งที่เกินขอบ
- ตรวจ syntax ผ่าน ยังไม่ได้ตรวจการแสดงผลในหน้าจอจริง

## v0.770 — 2026-10-12

- นำหน้า Table Properties ออกจาก ribbon, เมนูคลิกขวา และทางเข้า Properties ทั่วไปสำหรับตาราง

## v0.769 — 2026-10-12

- เอาระยะขอบด้านในไอคอน Picture ออก ให้ขอบภาพชิดกรอบเลือกทั้ง 4 ด้าน โดยรวมความหนาเส้น

## v0.768 — 2026-10-12

- แก้ navbar เลื่อนลงและซ้อนกัน โดยให้ ribbon ตารางอยู่ในแถบหลักใต้แท็บ และเคารพการซ่อนแท็บ
- ตรวจ syntax ผ่าน ยังไม่ได้ตรวจหน้าจอใช้งานจริง

## v0.767 — 2026-10-12

- แก้ navbar และ ribbon ซ้อนทับกัน โดยจัดตำแหน่ง ribbon ใต้ navbar ตามความสูงจริง

## v0.766 — 2026-10-12

- แสดงปุ่มจัดการเพียงปุ่มเดียวกึ่งกลางสำหรับช่วงเซลล์ที่เลือกในแถวหรือคอลัมน์เดียว

## v0.765 — 2026-10-12

- ปรับการแก้ข้อความในเซลล์ตารางให้ตัดบรรทัดโดยไม่แสดง scrollbar ภายใน
- เพิ่มความสูงแถวตามจำนวนบรรทัดที่ข้อความตัดจริงหลังแก้ไขเซลล์

## v0.764 — 2026-10-12

- ปรับไอคอน SVG ควบคุมมุมกระดาษให้เป็นเส้นโค้ง Bézier ที่เปลี่ยนตามค่า corner radius ปัจจุบัน

## v0.763 — 2026-10-12

- แก้แถบ Home ในเมนู Text Actions ให้ control เรียงเป็นแถวเดียวและเลื่อนแนวนอนได้
- ป้องกันปุ่มและช่องกรอกถูกบีบเมื่อเนื้อหาเกินความกว้างเมนู

## v0.762 — 2026-10-12

- แก้ปุ่มนำทางรายการข้อมูลให้ใช้ไอคอน SVG ลูกศรที่ชัดเจน แทนการถูกแปลงเป็นไอคอนบวก
- ปรับขนาดปุ่มก่อนหน้า/ถัดไปให้สม่ำเสมอ

## v0.761 — 2026-10-12

- จัดกลุ่ม Lock/Unlock ไว้คู่กับ Copy, Duplicate และ Delete Table ในเมนู ... ของตาราง
- คงคำสั่งลบแถวและลบคอลัมน์ไว้ในกลุ่มจัดการตาราง

## v0.760 — 2026-10-12

- แก้ ribbon ของ Table ไม่ให้ control สำรองแสดงซ้อนและทำให้แถบอยู่แนวเดียวกับ navbar หลัก
- จำกัด dropdown ในแถบตารางให้เปิดได้ครั้งละเมนู และปิดได้ด้วยการคลิกนอกหรือกด Escape

## v0.759 — 2026-10-12

- แก้ navbar ที่อาจหายหลังเปลี่ยนขนาดหน้าต่างหรือมีการเปลี่ยน layout โดยวัดขนาดใหม่และคืนสถานะแสดงผลเมื่อแอปกลับมาโฟกัส

## v0.758 — 2026-10-12

- เพิ่มชุดปุ่มรูปแบบเส้นขอบตาราง: ทั้งหมด, รอบนอก, ด้านใน, แนวนอน, แนวตั้ง และไม่มีเส้น
- เพิ่มตัวเลือกเส้นทึบ/ประ/จุด, แถบปรับความหนา และพาเลตต์สีพร้อมเลือกสีเอง โดยใช้กับเซลล์ที่เลือกหรือตารางได้

## v0.757 — 2026-10-12

- ปรับแถบเครื่องมือ Home ในเมนู QR Code ให้คำสั่งทั้งหมดเรียงเป็นแถวเดียว
- เพิ่มการเลื่อนแนวนอนเมื่อแถบเครื่องมือยาวเกินพื้นที่เมนู

## v0.756 — 2026-10-12

- ปรับเมนู `...` ของตารางให้เปิดด้วยสไตล์และไอคอนเมนูคำสั่งชุดเดียวกับระบบ โดยยังมีคำสั่งเฉพาะตารางครบ
- ตรวจ runtime ว่าเมนูเปิดได้จากปุ่ม `...` ของแถวและคอลัมน์

## v0.755 — 2026-10-12

- เมื่อเลือกทั้งคอลัมน์ แสดงปุ่ม `...` เพียงปุ่มเดียวตรงกึ่งกลางด้านบนของคอลัมน์
- เชื่อมปุ่ม `...` ของคอลัมน์กับเมนูคำสั่งตาราง และป้องกันตัวตรวจดับเบิลคลิกพื้นที่ว่างไม่ให้กลืนการกดปุ่มควบคุมตาราง
- ผ่าน runtime test สำหรับเมนูแถวและคอลัมน์ รวมถึงคำสั่งเพิ่มแถว

## v0.754 — 2026-10-12

- ปรับเมนูจัดการตารางจากกรอบ card รายแถวเป็นรายการเรียบ และแบ่งหมวดด้วยเส้นคั่น
- ใช้ hover และ focus สีเขียวตามธีม พร้อมจำกัดความสูงเมนูให้อยู่ในหน้าจอ
- ผ่าน runtime test ว่าเมนูเปิดและคำสั่งเพิ่มแถวยังทำงาน

## v0.753 — 2026-10-12

- ปิดการเปิดหน้าต่าง Properties อัตโนมัติเมื่อดับเบิลคลิกวัตถุทุกชนิด
- คงการดับเบิลคลิกเพื่อแก้ไขข้อความในเซลล์ตาราง และคงคำสั่ง Properties ที่ผู้ใช้เปิดจากเมนู
- ผ่าน runtime test สำหรับข้อความ รูปร่าง และตาราง รวมถึงตรวจว่าคำสั่ง Properties แบบชัดเจนยังเปิดหน้าต่างได้

## v0.752 — 2026-10-12

- เอา dropdown `More table tools` ออกจาก ribbon เพื่อไม่ให้แสดงเมนูซ้ำกับเมนูจัดการแถว
- ย้าย Copy style, Paste style, Lock, Position และ Table properties ไปไว้ในเมนูจัดการตารางของปุ่มแถว
- เพิ่ม runtime test ตรวจการไม่มี dropdown เดิมและการเพิ่มแถวจากเมนูใหม่

## v0.751 — 2026-10-12

- เชื่อมปุ่ม `...` ของแถวที่เลือกกับเมนูจัดการตารางสีธีม Q LABEL
- รองรับคีย์ Enter/Space และทดสอบเปิดเมนูพร้อมเพิ่มแถวจริงผ่านคำสั่งในเมนู

## v0.750 — 2026-10-12

- เมื่อเลือกครบทั้งแถว แสดงปุ่มเมนูแถวเพียงปุ่มเดียวตรงกึ่งกลางด้านบนของตาราง
- เพิ่ม runtime test ตรวจตำแหน่งเมนูแถวและตรวจว่าการเลือกเซลล์ปกติยังมีปุ่มหัวแถว/คอลัมน์

## v0.749 — 2026-10-12

- ปรับกรอบเลือก SVG ให้ตัดขอบว่างรอบ viewBox และพอดีกับพิกเซลภาพที่มองเห็น
- เพิ่ม runtime test ตรวจกรอบเลือก SVG เทียบกับขอบพิกเซลจริง

## v0.748 — 2026-10-12

- ล้างไฮไลต์เซลล์เมื่อคลิกพื้นที่อื่นบน canvas และเก็บสถานะเลือกไว้เมื่อคลิกในตารางหรือหัวเลือกแถว/คอลัมน์
- เพิ่ม runtime test ตรวจการล้าง selection เมื่อคลิกนอกตาราง

## v0.747 — 2026-10-12

- เปลี่ยน SVG ลบแถวและลบคอลัมน์ให้สื่อแนวที่ลบแยกกัน แทนไอคอนถังขยะซ้ำ
- เพิ่ม runtime test ตรวจ SVG แยกชนิดในแถบเครื่องมือและเมนูคลิกขวา

## v0.746 — 2026-10-12

- ป้องกัน Ribbon ของตารางถูกซ่อนขณะยังเลือกตารางอยู่ และคืนการแสดงผลเมื่อสถานะแท็บ Table ยัง active
- เพิ่ม runtime test จำลอง navbar หายและตรวจว่ากลับมาแสดงครบความสูง

## v0.745 — 2026-10-12

- ปรับเมนูคลิกขวาให้วัดขนาดจริงและขยับตำแหน่งขึ้นเมื่อพื้นที่ด้านล่างไม่พอ พร้อมจำกัดให้อยู่ในขอบหน้าต่าง
- เพิ่ม runtime test เปิดเมนูตรงมุมล่างขวาและตรวจขอบเขตเมนู

## v0.744 — 2026-10-12

- เมื่อคลิกเซลล์อื่นขณะตัวแก้ข้อความเปิดอยู่ ให้บันทึกช่องเดิมและย้ายกรอบเลือกไปช่องใหม่ทันที
- เพิ่ม runtime test คลิกเปลี่ยนเซลล์ระหว่างพิมพ์และตรวจค่าที่บันทึกกับตำแหน่งกรอบเลือก

## v0.743 — 2026-10-12

- ป้องกันช่องตารางและกรอบเลือกสีเขียวล้นขอบ เมื่อค่าขนาดขั้นต่ำของแถวหรือคอลัมน์รวมกันเกินขนาดตาราง
- เพิ่ม runtime test จำลองค่าขนาดขั้นต่ำที่ทำให้เกิดการล้น และตรวจกรอบเลือกเทียบขอบตาราง

## v0.742 — 2026-10-12

- ขยายปุ่มในเมนูตารางให้เต็มความกว้าง dropdown รวมพื้นที่ hover และจัด selector ให้ทับสไตล์ Ribbon เดิม
- เพิ่ม runtime assertion ตรวจว่าปุ่มเมนูกว้างเต็ม dropdown

## v0.741 — 2026-10-12

- ปรับเมนูแถวและคอลัมน์ให้เป็นรายการแนวนอน กดง่าย อ่านครบ และมีขนาดกะทัดรัดขึ้น
- เพิ่มทดสอบ runtime ตรวจรูปแบบปุ่มในเมนูตาราง

## v0.740 — 2026-10-12

- เพิ่มคลิกครั้งเดียวซ้ำบนช่องตารางที่เลือกสีเขียวเพื่อเปิดช่องพิมพ์ข้อความ โดยยังลากเลือกหลายช่องได้
- เพิ่มทดสอบ runtime การเปิดตัวแก้ไขและบันทึกข้อความจากช่องที่เลือก

## v0.739 — 2026-10-12

- แก้ Table Properties ให้แก้ตารางตัวปัจจุบันและวาด canvas ทันที แต่ละคำสั่ง Undo/Redo ได้ พร้อมรีเฟรชอ้างอิงหลัง Undo/Redo
- แก้สลับ Border Painter ไป Eraser โดยตรง
- เพิ่มทดสอบ runtime ทุกส่วนของ Table Properties 110 จุด รวม CSV ผ่าน IPC จำลอง file picker และ unit test ตาราง 15 ข้อ

## v0.737 — 2026-10-12

- เอาพื้นการ์ดและเงาออกจากแถบ Table จัดเป็น Ribbon แบน ใช้ปุ่ม SVG สีเขียวและเส้นแบ่งตาม UI ของ Q LABEL
- ลดเงาและมุมมนของเมนูย่อยให้เข้ากับเมนูระบบ

## v0.736 — 2026-10-12

- ซ่อนปุ่มเลือกแถว/คอลัมน์ทั้งหมด และแสดงเฉพาะปุ่มของแนวเซลล์ที่เลือกอยู่ รวมถึงรองรับหลายแนวเมื่อเลือกหลายเซลล์

## v0.735 — 2026-10-12

- เปลี่ยนกรอบและพื้นไฮไลต์เซลล์ที่เลือกจากสีม่วงเป็นสีเขียว Q LABEL

## v0.734 — 2026-10-12

- เปลี่ยนแถบ Table และเมนูตารางให้ใช้สีพื้น ขอบ ข้อความ และสีเขียวจากธีม Q LABEL พร้อมไฮไลต์เซลล์สีเขียว
- คงไอคอน SVG และการเลือกหลายเซลล์เดิมไว้

## v0.733 — 2026-10-12

- ไฮไลต์เซลล์ตารางสีม่วง รองรับ Ctrl เลือกหลายช่อง Shift เลือกช่วง ลากเลือก แถว/คอลัมน์ผ่านปุ่มหัวตาราง และลูกศรคีย์บอร์ด
- สีและตัวหนาใช้กับช่องที่เลือก Delete ล้างเนื้อหา และ Escape กลับเลือกทั้งตาราง

## v0.732 — 2026-10-12

- จัดแถบ Table เป็นแถวเดียวสีเข้ม พร้อม SVG และเมนูย่อยเส้นขอบ แถว/คอลัมน์ และเครื่องมือเพิ่มเติมตามภาพอ้างอิง
- เพิ่ม SVG ในเมนูคลิกขวาตารางและจำกัดความสูงเพื่อเลื่อนรายการได้

## v0.731 — 2026-10-12

- เลือกตารางแล้วเปิดแท็บ Table อัตโนมัติ พร้อมเครื่องมือฟอนต์ สี เส้นขอบ ระยะขอบเซลล์ แถวและคอลัมน์ ปรับพอดีเนื้อหา คัดลอกรูปแบบ ล็อก และตำแหน่ง
- คลิกเซลล์เพื่อกำหนดเซลล์ที่จัดรูปแบบ เพิ่มคำสั่งจัดการแถว/คอลัมน์ในเมนูคลิกขวา และคืนแท็บเดิมเมื่อเลิกเลือกตาราง
- ยังไม่รองรับการรวมเซลล์ รายการหัวข้อ หรือ timeline แบบ Canva

## v0.730 — 2026-10-12

- ปรับกรอบเลือกตารางให้คำนวณจากพิกเซลเส้นตารางจริง ตัดพื้นที่ขาวส่วนเกินด้านล่าง
- ตรวจ syntax และเตรียมทดสอบภาพจาก renderer

## v0.729 — 2026-10-12

- ตรวจ dependency ก่อนเริ่มทดสอบความลื่นและรายงาน startup error ใน terminal แทนกล่อง JavaScript error
- ยืนยัน printer-media-profile และ print-ipc โหลดได้; ปิด process ทดสอบเก่าที่ค้าง

## v0.728 — 2026-10-12

- ลากวัตถุต่อเนื่องโดยไม่ปัดตำแหน่งเป็นขั้นระหว่างลาก ปรับระยะดูดแนวเป็น 5 พิกเซล และกรอบหลายวัตถุเคลื่อนพร้อมกัน
- ลดเงาระหว่างลาก; ทดสอบ Electron บนจอ 120 Hz กับ 30 วัตถุ หลังอุ่นระบบ: เฉลี่ย 120.00 Hz, median 8.30 ms, p95 8.40 ms และไม่สร้าง canvas ใหม่ระหว่างลาก
- ผลทดสอบใช้ pointer events จำลองในหน้าต่างจริง ไม่รับรองทุกขนาดเอกสารหรือทุกเครื่อง

## v0.727 — 2026-10-12

- คลิกหรือลากฟิลด์ข้อมูลแล้วแสดงค่าจริงของคอลัมน์ตามเมาส์ เช่น Text = N แสดง N แทนตารางที่มี + ค่ายาวตัดเหลือคำเดียวแบบ new...

## v0.726 — 2026-10-12

- เครื่องมือคงขนาดบนหน้าจอเมื่อซูม และเลือกหลายวัตถุแสดงแถบเดียวพร้อมกรอบเส้นประ
- ตรวจ syntax; ยังไม่ได้ตรวจหน้าจอจริง

## v0.725 — 2026-10-12

- ปรับกรอบเลือกตารางให้แนบกับขอบเส้นตาราง ลดช่องว่างด้านล่าง
- ดึง commit ล่าสุดจาก remote แล้ว; ยังรวมเข้า branch ไม่ได้เพราะไฟล์ที่แก้ค้างชนกับ remote

## v0.180 — 2026-10-07

- ซ่อนปุ่ม Print calibration และ Settings รูปเฟืองบนแถบหัวหน้าจอเริ่มต้นตามที่ขอ
- คงการตั้งค่าไว้ในเมนูภายในโปรแกรม
- อัปเดตแอปเดิม ไม่ต้องติดตั้งใหม่

## v0.179 — 2026-10-07

- เมื่อเพิ่ม Text จะโฟกัสช่องแก้ข้อความและเลือกข้อความเดิมให้พิมพ์แทนได้ทันที
- ดับเบิลคลิกวัตถุข้อความบนกระดาษเพื่อเข้าแก้ไขข้อความได้ทันที
- อัปเดตแอปเดิม ไม่ต้องติดตั้งใหม่

## v0.178 — 2026-10-07

- เอาข้อความ placeholder สีเขียวที่ซ้ำกับข้อความ Preview ออกจากกรอบเลือก เหลือชื่อวัตถุบนป้ายกำกับด้านบน
- อัปเดตแอปเดิม ไม่ต้องติดตั้งใหม่

## v0.177 — 2026-10-07

- แก้ข้อความตัวอย่าง Text ซ้อนกันเมื่อเลือกกล่องข้อความว่าง ให้เหลือการวาดจาก Preview เพียงชุดเดียว
- อัปเดตแอปเดิมโดยไม่ต้องติดตั้งใหม่

## v0.176 — 2026-10-07

- แก้ Ctrl+Z หลังลากจุดปรับขนาด หมุน หรือปรับข้อความบาร์โค้ด โดยคืนโฟกัสให้ผืนงานก่อน
- อัปเดตไฟล์ในแอปเดิม ไม่ต้องติดตั้งใหม่

## v0.175 — 2026-10-07

- ปรับจุดจับข้อความใต้บาร์โค้ดให้อยู่บริเวณกึ่งกลางตัวอักษรและเคารพการจัดชิดซ้าย/ขวา
- ให้เส้นกริดเริ่มจากขอบกระดาษจริง ครบเต็มหน้ากระดาษ Preview
- แก้ในแอปเดิม ไม่ต้องติดตั้งใหม่

## v0.174 — 2026-10-07

- แก้ Auto สำหรับข้อความและบาร์โค้ดให้ใช้ภาพจากตัวเรนเดอร์ Preview
- ยกเลิกค่าเลื่อนกระดาษเริ่มต้นที่ซ่อนอยู่ และป้องกันการส่งพิกัด ZPL ติดลบที่ทำให้วัตถุซ้อน
- สำรองแล้วคืนค่าชดเชยเครื่องนี้จากย่อ 93% / เลื่อนขึ้น 5 มม. เป็น 100% / 0 มม.
- อัปเดตแอปเดิม ไม่ต้องติดตั้งใหม่; ยังไม่ได้ยืนยันกับกระดาษพิมพ์จริง

## v0.173 — 2026-10-07

- ปรับกรอบเลือกวัตถุ เส้นหมุน และเส้นช่วยจัดแนวสีเขียวให้บางคงที่ 1 px
- อัปเดตไฟล์ในแอปเดิมโดยตรง ไม่ต้องติดตั้งใหม่

## v0.172 — 2026-10-07

- เอาพื้นเทาโปร่งแสงในกรอบลากเลือกออก คงเส้นประสีเขียวแบบบางไว้
- อัปเดตไฟล์แอปเดิมโดยตรง ไม่ต้องติดตั้งโปรแกรมใหม่

## v0.171 — 2026-10-07

- ปรับเส้นประกรอบลากเลือกให้บางคงที่ 1 px และลดความเข้มพื้นโปร่งแสง

## v0.170 — 2026-10-07

- แก้ Ribbon แท็บ Insert ไม่ให้ขยายลงแนวตั้ง; จำกัดพื้นที่แผงคำสั่งและให้เลื่อนแนวนอนแยกภายในแผง
- จัด Table เป็นกลุ่ม ribbon แนวนอนของตัวเอง ไม่ดันความสูงของแถบ

## v0.169 — 2026-10-07

- เพิ่มหน่วยอ่านอย่างเดียวต่อท้ายช่องกว้าง/สูงใน Page Setup, Template, Object Properties, Ribbon, New Label และ Table
- หน่วยตรงตามค่าจริงของแต่ละช่อง และเปลี่ยนตามหน่วยระบบในช่องที่รองรับการแปลงหน่วย
- ล้างแพ็กเกจ v0.166 ที่สร้างไว้เพื่อคืนพื้นที่ดิสก์

## v0.168 — 2026-10-07

- ซ่อนชื่อสถานะ Editing และชื่อไฟล์จากมุมขวาบนของ ribbon ตามคำขอ

## v0.167 — 2026-10-07

- จำกัดการลากวัตถุและกลุ่มให้อยู่ในขอบกระดาษ โดยจัดชิดขอบได้พอดี
- จำกัดการปรับขนาด object ไม่ให้เส้นกรอบและตารางยื่นนอกกระดาษขาวใน Design
- แก้ขอบเขตการ Snap และเส้นช่วยจัดแนวให้ตรงกับกรอบ Page

## v0.166 — 2026-10-07

- แก้การลากและปรับขนาดวัตถุให้ถึงขอบกระดาษจริง รวมพื้นที่สีขาวที่อยู่นอกขอบ Template
- ปรับจุด snap และเส้นช่วยจัดแนวให้ใช้ขนาดกระดาษจาก Page Setup
- รองรับการวางวัตถุด้วยการลากจาก Insert ในพื้นที่ขอบกระดาษ

## v0.165 — 2026-10-07

- เปลี่ยนข้อความสถานะเป็น badge มุมขวาบน จำกัดความกว้าง รองรับข้อความยาวและปุ่มปิด SVG
- แจ้งเตือนสำเร็จหายเองใน 5 วินาที ข้อผิดพลาด 10 วินาที
- Save และ Save As แจ้งสำเร็จผ่าน badge แทนหน้าต่าง alert

## v0.164 — 2026-10-07

- แก้ระบบพิมพ์ไม่ย้ายตำแหน่งวัตถุใกล้ขอบอัตโนมัติ
- ภาพ PNG ใช้ SVG เดียวกับ Design เพื่อให้ฟอนต์ บาร์โค้ด และขนาดกระดาษตรงกัน
- แก้จุดเริ่มกระดาษ Design ให้สอดคล้องกับระยะขอบการพิมพ์ โดยไม่แสดงเส้นประ Template
- ค่าเริ่มต้นวิธีพิมพ์ข้อความและบาร์โค้ดเป็น Graphic Output; ค่าที่ผู้ใช้บันทึกไว้ยังใช้ตามเดิม
- ยังไม่ได้ตรวจด้วยการพิมพ์กระดาษจริง

## v0.163 — 2026-10-07

- แก้หน้า Design แสดงกระดาษสีขาวต่อเนื่อง ตัดเส้นประขอบ Template และระยะเยื้องจากขอบ Page ที่ทำให้เหมือนมี gap
- ใช้จุดเริ่มต้นกระดาษในการแสดงผล Design; คงขนาดกระดาษตาม Page Setup และการจัดหน้าในระบบพิมพ์
- เทียบกับหน้าต่าง BarTender ที่เปิดอยู่; ไม่ส่งงานพิมพ์จริง

## v0.162 — 2026-10-07

- แก้ Save As ใช้หน้าต่างบันทึกไฟล์ Windows และแสดงข้อความเมื่อ Save สำเร็จ
- เพิ่ม Table: เลือกขนาดผ่านกริด แก้เซลล์ ขนาดตาราง เปิดจัดการด้วยดับเบิลคลิก และนำเข้า CSV/JSON/XML
- ตารางบันทึกเป็นวัตถุข้อความและกรอบที่พิมพ์ได้ รองรับ Undo และเลือกหลายวัตถุ
- ยังไม่รองรับการเชื่อม Excel Online, Access และ BarTender Data Builder โดยตรง; Excel ต้องส่งออก CSV

# Changelog

## v0.161 — 2026-10-07

- โฟกัส Canvas หลังคลิกเลือกวัตถุ เพื่อให้ Ctrl+Z และ Ctrl+X ส่งคำสั่งถึงตัวแก้ไขได้เสมอ
- Ctrl+X ใช้รายการวัตถุที่เลือกจริง และรองรับตัด/วางหลายวัตถุพร้อมกัน
- ทดสอบคลิกเลือกวัตถุจริงบน Canvas, Ctrl+X ลบ และ Ctrl+Z กู้คืน โดยไม่ส่งงานพิมพ์

## v0.160 — 2026-10-07

- แสดง SVG รูปทรงฉลากใน Page Setup และ Canvas ตาม Rectangle, Rounded rectangle หรือ Ellipse พร้อมเส้นตัวอย่างเมื่อยังไม่สั่งพิมพ์ขอบ
- ตัวเลือก Print borders และความหนาแสดงใน Preview, ส่งออกภาพ และ ZPL ที่พิมพ์จริง
- เปลี่ยนปุ่มปิด Page Setup และ Workspace dialog เป็น SVG X ที่จัดกึ่งกลาง
- ทดสอบการเปลี่ยนรูปทรงและยืนยันคำสั่งขอบใน ZPL โดยไม่ส่งงานไปเครื่องพิมพ์

## v0.159 — 2026-10-07

- เพิ่ม SVG แบบจุดและลูกศรที่รายการ More Barcodes… เพื่อบอกว่ามีหน้ารายการเพิ่มเติมให้เปิด
- ตรวจว่าไอคอนแสดงพร้อมข้อความและยังเปิด Barcode Picker ได้

## v0.158 — 2026-10-07

- ปรับ SVG ของคำสั่งในแท็บ Layout ให้สื่อ Page Setup, Label Properties, การจัดแนว, กระจายวัตถุ และลำดับชั้นตามข้อความ
- ตรวจว่าแต่ละคำสั่งแสดงไอคอน SVG ที่กำหนดตรงกับข้อความ

## v0.157 — 2026-10-07

- เปลี่ยนไอคอน Zoom in, Zoom out และ Fit page ให้สื่อความหมายด้วย SVG เฉพาะคำสั่ง
- Fit page รีเซ็ตการซูม แพน และตัวแสดงเปอร์เซ็นต์ให้ตรงกัน
- ทดสอบไอคอนและคำสั่งซูมใน UI; ไม่ส่งงานพิมพ์จริง

## v0.156 — 2026-10-07

- ทำให้ปุ่ม Snap to grid แสดงสถานะเปิด/ปิดชัดเจนและซิงก์กับการตั้งค่าจริง
- ตรวจการปัดตำแหน่งตามระยะกริดเมื่อเปิด และการวางตำแหน่งละเอียด 0.1 มม. เมื่อปิด

## v0.155 — 2026-10-07

- ซ่อนวัตถุฉลากในภาพตัวอย่างพื้นที่ทำงานของหน้าตั้งค่า โดยยังคงแสดงกระดาษ กรอบฉลาก ระยะขอบ และแถบไม้บรรทัด/เมนูตามการตั้งค่า
- เพิ่มการตรวจ UI ว่า Preview พื้นที่ทำงานไม่ฝังภาพวัตถุลงบนกระดาษ

## v0.154 — 2026-10-07

- Canvas ใช้ขนาดกระดาษ Page จริง พร้อมปรับสัดส่วน ซูม และไม้บรรทัดตามกระดาษ
- แสดงเส้นประขอบฉลากและข้อความเมื่อขนาดฉลากหรือ Layout เกินกระดาษ
- Page Setup อัปเดต Canvas ทันทีและรับขนาดกระดาษทศนิยมเช่น 2.953 นิ้ว
- ทดสอบ Electron ผ่านโดยกรอกกระดาษ 2.953 × 2.090 นิ้วและตรวจสัดส่วน Canvas; ไม่ส่งงานพิมพ์จริง

## v0.153 — 2026-10-07

- แก้ดับเบิลคลิกวัตถุให้เปิด Properties ได้แม้ Canvas สร้างใหม่หลังคลิกเลือก
- บาร์โค้ดเปิดหน้า Data Sources ทันที เลือกและจัดการฟิลด์ที่ผูกได้
- เพิ่ม Data Type, Transforms, Prefix/Suffix และการตรวจข้อมูลตัวเลขที่มีผลใน Preview และ ZPL
- เพิ่มขนาดและการจัดแนวข้อความใต้บาร์โค้ด รวม Fit ความกว้างตามขนาดที่กำหนด
- ทดสอบ Electron การดับเบิลคลิกและแก้ Prefix ผ่าน พร้อมตรวจ ZPL ขนาดตัวอักษรและการจัดแนว; ไม่ส่งงานพิมพ์จริง
- ยังไม่เทียบเท่าคุณสมบัติ BarTender 100% เช่น Symbology อื่นและการตั้งค่าขั้นสูงทั้งหมด

## v0.152 — 2026-10-07

- ปุ่ม New field เปิดหน้าตั้งค่าแหล่งข้อมูลเพื่อใส่ชื่อ ค่า และเลือกประเภทได้
- เพิ่ม Save & insert text และ Save & bind selected เพื่อใช้ฟิลด์บนฉลากทันที
- ทดสอบ Electron ผ่าน: สร้างฟิลด์ LOT-42 บันทึกและเพิ่มข้อความที่ผูกฟิลด์; ไม่ส่งงานพิมพ์จริง

## v0.151 — 2026-10-07

- จำกัดความยาวชื่อ Data Sources ภายใน Sidebar โดยใช้ … และแสดงชื่อเต็มเมื่อชี้เมาส์
- เพิ่ม SVG แยกตามหมวดแหล่งข้อมูล และแก้ความกว้างรายการไม่ให้เกิดแถบเลื่อนแนวนอน
- ตรวจ syntax และการทำงาน Electron ผ่าน

## v0.150 — 2026-10-07

- รองรับ Shift + คลิกเพื่อเพิ่มหรือนำวัตถุออกจากชุดที่เลือกหลายชิ้น
- รองรับ Shift + ลากกรอบเพื่อเลือกวัตถุเพิ่มจากชุดเดิม
- ตรวจ syntax และแพ็กผ่าน

## v0.149 — 2026-10-07

- แสดง Code 128, Code 39, Code 93, EAN-13, QR Code และ Data Matrix ใน Dropdown Barcode ทันที
- เรียงชนิดที่ใช้ล่าสุดไว้ด้านบนและคง More Barcodes สำหรับหน้าต่างเลือกพร้อมตัวอย่าง
- ตรวจ syntax และแพ็กผ่าน

## v0.148 — 2026-10-07

- เปลี่ยน File > Open ให้เปิดหน้าต่างเลือกไฟล์ JSON ของ Windows โดยตรง แล้วเปิดฉลากที่เลือก
- บันทึกฉลากปัจจุบันก่อนเปิดไฟล์ใหม่
- ตรวจ syntax และแพ็กผ่าน; ไม่ได้ทดสอบหน้าต่างเลือกไฟล์ Windows ด้วยการคลิกจริง

## v0.147 — 2026-10-07

- เพิ่มกรอบสีฟ้าอ่อนเมื่อ Hover วัตถุ แยกจากกรอบสีเขียวของวัตถุที่เลือก
- กรอบตามขอบและมุมหมุนของวัตถุ ความหนาคงที่เมื่อซูม และไม่ขวางการคลิกหรือลาก
- ตรวจ syntax และแพ็กผ่าน; ไม่ได้ทดสอบการพิมพ์จริง

## v0.146 — 2026-10-07

- เพิ่ม Data Sources 15 หมวด พร้อมสร้าง แก้ไข ลบ ลากผูกข้อมูล และบันทึกกับฉลาก
- รองรับวันเวลา เลขลำดับ CSV/JSON ฟิลด์กรอกตอนพิมพ์ ชื่อแหล่งข้อมูล Library ค่าร่วม ค่าวัตถุ และข้อมูลงานพิมพ์
- ใช้ตัวคำนวณเดียวกันใน Preview และ ZPL ตรวจวงจรอ้างอิงและระเบียนเกินจำนวน
- ทดสอบตัวคำนวณและ ZPL รวมถึงหน้าตั้งค่าใน Electron ผ่าน; ไม่ส่งงานพิมพ์จริง
- Database/External File ใช้สำเนา CSV/JSON ที่นำเข้า; ยังไม่รองรับ SQL server, Visual Basic และการเรียกฟอร์แมตที่เก็บในเครื่องพิมพ์

## v0.145 — 2026-10-07

- ลากเครื่องมือ Insert ลงกระดาษเพื่อวางตามตำแหน่งที่ปล่อยได้ รวมรูปภาพและบาร์โค้ด
- รวมบาร์โค้ดเป็นปุ่มเดียว มีรายการใช้ล่าสุดและหน้าต่างค้นหา เลือกชนิด และดูตัวอย่างสำหรับ 6 ชนิดที่รองรับ
- ทดสอบ Electron ผ่านทั้งลากวาง เลือก QR หน้าแรก เมนู File และการทำงานเดิม; ไม่ส่งงานพิมพ์จริง

## v0.144 — 2026-10-07

- เมื่อเปิดเมนู File ให้ Navbar/Ribbon และแท็บเดิมยังแสดงอยู่ พร้อมตรึงแถบไว้จนกว่าจะปิดเมนู
- ปิดเมนูแล้วกลับไปใช้แท็บก่อนหน้า โดยไม่ทำให้ Ribbon หาย
- ทดสอบผ่าน Electron จริง รวมการเปิด/ปิด File ขณะใช้ Navbar แบบ Auto-hide; ไม่ส่งงานพิมพ์จริง

## v0.143 — 2026-10-07

- แก้เริ่มแอปไม่สำเร็จจากช่อง Copies และปุ่มคำสั่งที่ถูกถอดออกเมื่อสร้าง Ribbon โดยเก็บคำสั่งต้นฉบับไว้ใน DOM
- รอสร้าง UI ทุกสคริปต์ครบก่อนเริ่มโหลด Workspace เพื่อให้เปิดหน้าแรกได้สม่ำเสมอ และแก้การผูกปุ่มรูปภาพเก่าที่ไม่มีแล้ว
- ป้องกันการเพิ่มวัตถุซ้ำจากปุ่ม Recent Objects
- ทดสอบผ่าน Electron จริงสองรอบ: หน้าแรก, QR, Ctrl+Z/X, File, Stock, New wizard, Print dialog และกลับหน้าแรก; ไม่ส่งงานพิมพ์จริง
- แพ็กพร้อมอัปเดต Shortcut และเปิดเวอร์ชันล่าสุด

## v0.142 — 2026-10-07

- เมื่อปิดเมนู File ด้วยคลิกซ้ำ คลิกนอกเมนู กด Escape หรือเลือกคำสั่ง ให้กลับไปยังแท็บก่อนหน้าและเอาสถานะ Active ออกจาก File
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ตรวจการคลิกผ่านหน้าต่างจริง

## v0.141 — 2026-10-07

- ย้ายการค้นหาเครื่องพิมพ์ออกจากขั้นตอนโหลดงาน เพื่อให้แอปแสดงหน้า Label ได้แม้ Windows Print Spooler ช้า และกำหนด timeout 8 วินาที
- คงเครื่องพิมพ์ที่บันทึกไว้ ไม่เลือก Zebra ตัวแรกแทนเมื่อเริ่มแอป
- แสดงข้อความและปุ่ม Reload เมื่อเริ่ม Workspace ไม่สำเร็จ
- ปรับ Launch-ABSS-ZebraBar.ps1 ให้สร้าง/อัปเดต Shortcut บน Desktop และเปิดแพ็กเกจเวอร์ชันล่าสุด
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ทดสอบสถานการณ์ Print Spooler ค้างกับเครื่องจริง

## v0.140 — 2026-10-07

- ปรับข้อความบอกระยะ Margin ในภาพตัวอย่างให้ใหญ่และหนาขึ้นเพื่ออ่านง่าย
- ปรับแท็บ Stock ให้เลือก Document Specific, Standard Stocks และ User Defined พร้อมบันทึก/ลบ Stock ที่กำหนดเองได้
- การเลือก Stock ใช้ขนาดฉลากและชนิดสื่อ โดยไม่รีเซ็ตระยะขอบหรือ Layout; ย้ายตัวเลือกขนาดกระดาษเดิมออกจาก Stock
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ตรวจการใช้งานผ่านหน้าต่างจริง

## v0.139 — 2026-10-07

- เปลี่ยน File จากแผง Ribbon เป็นเมนู Dropdown เมื่อคลิก และเอาคำสั่งแทรกวัตถุออกจากเมนู File
- เพิ่ม Open/Import, Save/Save As, Page Setup, Print Preview/Print, Export และ Exit โดยเชื่อมกับคำสั่งที่แอปรองรับ
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ตรวจเมนูผ่านหน้าต่างจริง

## v0.138 — 2026-10-07

- เพิ่มตัวเลือก Grid Step 0.25 mm ใน Preview และ Settings ให้เลือกและบันทึกได้
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ตรวจหน้าต่างจริง

## v0.137 — 2026-10-07

- เปลี่ยนแถบ Objects ให้แสดงเฉพาะเครื่องมือที่ผู้ใช้เลือกหรือเรียกใช้ และจำรายการไว้ข้ามการเปิดแอป
- จัดเครื่องมือล่าสุดไว้บนสุด และแก้ชื่อชนิดบาร์โค้ดเป็น Code 128/39/93, QR Code, EAN-13 และ Data Matrix
- เชื่อมคำสั่งจากแท็บ File/Insert และการลากวัตถุให้บันทึกประวัติการใช้
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ตรวจการทำงานผ่านหน้าต่างจริง

## v0.136 — 2026-10-07

- เพิ่มคำสั่งแทรกวัตถุในแท็บ File ทั้งข้อความ บาร์โค้ดหลายชนิด QR, DataMatrix, รูปภาพ และรูปทรง โดยเชื่อมกับเครื่องมือสร้างเดิม
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ตรวจการใช้งานผ่านหน้าต่างจริง

## v0.135 — 2026-10-07

- ปรับ Ctrl+Z/Ctrl+X ให้ไม่ดักปุ่มเมื่อโฟกัสอยู่ในช่องกรอก เลือก หรือกล่องข้อความ เพื่อให้ undo/cut ของช่องทำงานตามปกติ
- ลดช่องว่างเหนือแท็บในหน้าต่าง Print
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ตรวจหน้าต่างจริง

## v0.134 — 2026-10-07

- เปลี่ยนแท็บที่เลือกใน Page Setup เป็นเทาเข้ม ลบพื้นดำและเส้นเหลือง
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ตรวจหน้าต่างจริง

## v0.133 — 2026-10-07

- เปลี่ยนพื้นหลังภาพตัวอย่างหน้ากระดาษจากฟ้าเป็นเทาอ่อน และสีรองตัวเลข Margin เป็นเทา
- ตรวจ syntax และแพ็กแอปผ่าน; ยังไม่ได้ตรวจหน้าต่างจริง

## v0.132 — 2026-10-07

- ขยายเมนู File: เปิดรายการงานพร้อมค้นหา, แยก Import JSON, Save as ตั้งชื่อและยืนยันก่อนทับไฟล์, Print Preview, Page Setup, กลับหน้ารายการงาน และ Exit
- เชื่อมคำสั่งกับระบบบันทึกและพิมพ์จริง โดยคงหน้าตา Ribbon ของแอปตามคำขอ
- ยังไม่รองรับไฟล์ .btw และฟังก์ชันเฉพาะรุ่นของ BarTender; ไม่ได้ยืนยันหน้าตาผ่านหน้าต่างจริงหรือส่งงานพิมพ์จริง

## v0.131 — 2026-10-07

- ปรับภาพ Page Setup ให้ใกล้ BarTender ด้วยพื้นหลังไล่เฉดฟ้า กระดาษขาว เส้นวัดระยะเข้ม และลูกศรบอก Margin
- คงตัวเลขระยะ Margin เพื่ออ่านค่าที่ปรับได้ชัดเจน
- ตรวจ syntax และแพ็กผ่าน

## v0.130 — 2026-10-07

- เพิ่มลูกศรสองหัวและตัวเลขกำกับระยะ margin บน ล่าง ซ้าย ขวาในภาพ Page Setup
- ภาพตัวอย่างอัปเดตตามค่าที่กำลังแก้
- ตรวจ syntax และแพ็กผ่าน

## v0.129 — 2026-10-07

- แก้ช่อง Margin ให้พิมพ์ค่าทศนิยมอย่าง 0.0 ได้ โดยไม่เขียนค่ากลับทับช่องระหว่างพิมพ์
- คงการบันทึกและอัปเดตตัวอย่างทันทีหลังแก้ค่า
- ตรวจ syntax และแพ็กผ่าน

## v0.128 — 2026-10-07

- เปลี่ยนพื้นหลังฟ้าในภาพตัวอย่าง Page Setup เป็นสีเทากลางอ่อน
- ตรวจ syntax และแพ็กผ่าน

## v0.127 — 2026-10-07

- ปรับ sidebar ซ้ายให้พื้นหลังโปร่งแสงและเบลอ พร้อมแยกความโปร่งของหัวข้อและแถบล่าง
- ตรวจ syntax และแพ็กผ่าน

## v0.126 — 2026-10-07

- เพิ่มความหนาเส้นไกด์จัดแนวเป็น 2 เท่าจากค่าปัจจุบัน
- ตรวจ syntax และแพ็กผ่าน

## v0.125 — 2026-10-07

- แก้การยืด Line ให้รักษาแนวเดิม ลดการเกิดเส้นเฉียงจากการลากด้ามจับ
- จำกัดความหนาเส้นสูงสุด 5 mm เพื่อไม่ให้ลากแล้วกลายเป็นแถบดำขนาดใหญ่
- ตรวจ syntax และแพ็กผ่าน; ต้องทดลองลากใน UI เพื่อยืนยัน

## v0.124 — 2026-10-07

- เพิ่มความหนาเส้นไกด์จัดแนว 50% ทั้งเส้นไกด์ทั่วไปและเส้นกึ่งกลาง
- ตรวจ syntax และแพ็กผ่าน

## v0.123 — 2026-10-07

- เพิ่มเส้นไกด์ขณะลากวัตถุ ให้ snap แนวตั้ง/แนวนอนกับขอบและกึ่งกลางฉลากหรือวัตถุอื่น
- ใช้ tolerance 0.75 mm พร้อมเส้นสีแยกแนวจัดกึ่งกลาง และล้างไกด์เมื่อปล่อยเมาส์
- ตรวจ syntax และแพ็กผ่าน; การลากโต้ตอบต้องยืนยันในหน้าต่างแอป

## v0.122 — 2026-10-07

- คืนการส่งตำแหน่งพิมพ์ตาม v0.119 ตามคำขอผู้ใช้ โดยแยก feed offset จาก Calibration อีกครั้ง
- คง ^LL…,N เพื่อคืนการใช้ความยาวฉลากจากเซ็นเซอร์ และเก็บค่าปรับของผู้ใช้ไว้ให้ปรับเลื่อนลงเอง
- ตรวจ syntax และแพ็กผ่าน; ยังไม่ได้ยืนยันผลพิมพ์บนเครื่องจริง

## v0.121 — 2026-10-07

- ถอน ^LL…,Y ที่เพิ่มใน v0.120 หลังผลพิมพ์จริงเกิดงานข้ามสองฉลาก; ส่ง ^LL…,N ให้ฉลาก gap/mark ใช้ความยาวจากเซ็นเซอร์อีกครั้ง
- ตรวจคำสั่งและแพ็กผ่าน; ยังต้องยืนยันตำแหน่งเริ่มงานและขอบล่างกับเครื่องจริง

## v0.120 — 2026-10-07

- ส่ง ^LL พร้อมตัวเลือก Y ให้ความสูงเอกสารใช้กับฉลากมี gap/mark ด้วย เพื่อไม่ใช้พื้นที่พิมพ์เก่าที่อาจตัดด้านล่าง
- ส่ง ^LT0 และรวม feed correction ที่บันทึกไว้กับการเลื่อนพิกัดหลังสเกล ป้องกัน LT ทำให้พื้นที่ด้านล่างถูกตัด; ไม่เปลี่ยนขนาดหน้ากระดาษหรือค่าผู้ใช้
- ทดสอบ ZPL เรื่องความสูงและตำแหน่งเส้นขอบผ่าน; ยังต้องยืนยันกับเครื่องพิมพ์จริง

## v0.119 — 2026-10-07

- แก้ Calibration แนวตั้งให้เลื่อนพิกัด ZPL ตาม mm โดยตรงหลังปรับสเกล ไม่บีบค่าลงที่ ±120 steps จน 50 และ 85 ให้ผลเหมือนกัน
- แยก offset ของงานจาก feed offset ของเครื่อง; แจ้งข้อผิดพลาดเมื่อ offset เกินความสูงฉลาก และอธิบาย 0.85 mm กับ 85 mm
- ตรวจ syntax และ assertions การเลื่อนพิกัด/สเกลผ่าน; ยังไม่ได้ยืนยันผลบนเครื่องพิมพ์จริง

## v0.118 — 2026-10-07

- ล้างตัวเลือกเก่าทันทีเมื่อเปิด Print และปิด Print/Test Print/Preview ระหว่างโหลดเครื่องพิมพ์ล่าสุดและบันทึกการเปลี่ยนเครื่อง
- ป้องกันการส่งงานก่อนเครื่องพร้อมและการเปลี่ยนเครื่องระหว่างส่งงาน; หากเครื่องที่จำไว้หายจะให้เลือกเองแทน fallback ไปเครื่องแรก
- ตรวจ syntax และ build; ยังไม่ได้ยืนยันการพิมพ์ด้วยเครื่องจริง

## v0.117 — 2026-10-07

- เพิ่ม Object Properties เมื่อดับเบิลคลิกวัตถุ แยกหมวด Barcode, Text, Picture และ Shape พร้อม Preview, Apply, OK, Cancel และ Undo
- เชื่อมชนิดบาร์โค้ด ขนาด ข้อมูล Human Readable ฟอนต์ ตำแหน่ง การหมุน และเปลี่ยนภาพกับค่าที่ใช้เรนเดอร์และพิมพ์จริง
- อ้างอิงภาพและเอกสารทางการ BarTender; เซสชันนี้ควบคุมโปรแกรม Windows โดยตรงไม่ได้ จึงยังไม่ยืนยัน UI เทียบกับโปรแกรมจริงหรือการพิมพ์บนเครื่องจริง
- ตรวจ syntax และแพ็กผ่าน; smoke test ผ่าน 10 ข้อ ล้มเหลว 2 ข้อเรื่องตำแหน่ง/ขนาดบาร์โค้ดในการพิมพ์

## v0.116 — 2026-10-07

- หน้าต่าง Print โหลดค่าเครื่องพิมพ์ล่าสุดจาก Settings บน disk ทุกครั้งก่อนแสดงรายการ เพื่อไม่ใช้ state เก่าจากหน้าต่างเดิม
- ให้ค่าที่บันทึกไว้เป็นตัวเลือกหลัก จึงไม่ย้อนกลับไป ZT610 หาก Settings ระบุ ZT411 อยู่

## v0.115 — 2026-10-07

- แก้การจำเครื่องพิมพ์ให้ state หลักอัปเดตทันทีเมื่อเลือกเครื่องใหม่ และรอการบันทึก Settings ให้เสร็จก่อนดำเนินการต่อ
- หน้าต่าง Print จะซิงก์เครื่องที่เลือกกลับไปยังหน้าออกแบบและบันทึกค่าเดียวกัน ป้องกันค่า ZT610 เก่ากลับมาทับ

## v0.114 — 2026-10-07

- เพิ่มการลองส่งงานผ่าน Windows spooler ซ้ำอัตโนมัติหนึ่งครั้ง หาก queue กำลังเริ่มต้น เพื่อให้การกด Print ครั้งแรกส่งงานได้โดยไม่ต้องกดซ้ำ

## v0.113 — 2026-10-07

- แก้หน้าต่าง Print ให้ใช้เครื่องพิมพ์ที่เลือกอยู่ในหน้าออกแบบก่อนค่าที่บันทึกเก่า เพื่อไม่ให้ ZT610 กลับมาแทนเครื่องที่ผู้ใช้เลือก
- หากยังไม่มีเครื่องที่เลือก จึงค่อยใช้ค่าเครื่องพิมพ์ล่าสุดจาก Settings เป็น fallback

## v0.112 — 2026-10-07

- แก้หน้าต่าง Print ไม่ให้ใช้ค่าเครื่องพิมพ์เก่าที่ค้างใน select มาทับค่าล่าสุด
- ใช้เครื่องพิมพ์ที่บันทึกใน Settings เป็นค่าเริ่มต้นหลัก จึงไม่กลับไปเลือก ZT610 หากผู้ใช้เลือก ZT411 ไว้ล่าสุด
- ตรวจ syntax ผ่าน

## v0.111 — 2026-10-07

- คืนค่า vertical offset เดิมของระบบเป็นค่าฐาน 1.2 mm เมื่อยังไม่มีค่าที่บันทึกไว้ เพื่อให้ตรงกับงานก่อนเพิ่มหน้า Calibration
- ค่าในหน้า Calibration ยังคงเป็นค่าปรับเพิ่มและถูกจำข้ามการเปิดโปรแกรม
- ป้องกันค่า offset รวมเกินขีดจำกัด Zebra ±120 steps ด้วยการจำกัดให้อยู่ในช่วงที่เครื่องรับได้ แทนการทำให้ปุ่ม Print ใช้งานไม่ได้
- ตรวจ syntax ผ่าน

## v0.110 — 2026-10-07

- จำเครื่องพิมพ์ล่าสุดทันทีเมื่อเลือกในหน้าต่าง Print ไม่ต้องกด Print ก่อน
- เปิดหน้าต่าง Print ครั้งถัดไปจะเลือกเครื่องเดิมอัตโนมัติ และซิงก์กับค่าหน้า Settings
- ตรวจ syntax ผ่าน

## v0.109 — 2026-10-07

- แก้ Ctrl+P ระดับ Electron ให้รองรับทั้งค่า key และ code ของคีย์บอร์ด
- หน่วง callback เปิด Print ไปยังรอบ event ถัดไป เพื่อให้หน้าต่าง Print เปิดได้แน่นอนหลัง Electron ดักคีย์ลัด
- ตรวจ syntax ผ่าน

## v0.108 — 2026-10-07

- แก้การพิมพ์เครื่อง Zebra ที่เป็นพอร์ต IP ให้ส่ง RAW TCP 9100 ก่อน Windows spooler
- รองรับกรณี Windows queue ขึ้น Error หรือมีงานค้าง โดยไม่ต้องรอ queue ก่อนส่งงาน
- หาก RAW TCP ใช้ไม่ได้จะ fallback ไป spooler และแจ้ง error ที่ชัดเจน
- ตรวจ syntax ผ่าน

## v0.107 — 2026-10-07

- แก้ hotkey ให้ตรวจสถานะเอกสารที่กำลังแก้ไขโดยตรง ไม่ขึ้นกับ style ของ editor view
- รองรับ event ที่ส่งมาเป็น key หรือ code ทำให้ Ctrl+Z/Ctrl+X และ hotkey อื่นไม่หลุดเมื่อโฟกัสอยู่บน SVG/Ribbon
- ตรวจ syntax และตรวจเส้นทาง hotkey fallback ผ่าน

## v0.106 — 2026-10-07

- ลดพื้นที่รับคลิกของจุดย่อ/ขยายเหลือใกล้จุดจับจริง เพื่อไม่ให้คลิกภายในวัตถุแล้วกลายเป็นการปรับขนาด
- คลิกในตัววัตถุยังใช้ย้ายวัตถุ ส่วนการปรับขนาดต้องคลิกที่จุดจับหรือเส้นขอบโดยตรง
- ตรวจ syntax ผ่าน

## v0.105 — 2026-10-07

- ปรับแถบ Object Tools ให้โปร่งใสและเบลอพื้นหลังเล็กน้อย
- ปรับปุ่มภายในให้โปร่งใสกลมกลืนกับ workspace พร้อมคงเส้นขอบและสถานะ disabled/hover
- ตรวจ syntax ผ่าน

## v0.104 — 2026-10-07

- ปรับ Page Setup ให้ใกล้ BarTender มากขึ้นด้วยแท็บกระชับ กลุ่มการตั้งค่าชัดเจน และปุ่ม OK / Cancel / Help
- คงการคำนวณ Layout, Rows/Columns, Margins, Template Size และ Gap/Pitch ให้ทำงานกับ Preview และบันทึกค่าจริง
- ตรวจ syntax ผ่าน

## v0.103 — 2026-10-07

- แก้ Ctrl+Z และ Ctrl+X ให้ดักใน capture phase โดยตรงก่อน SVG, ribbon หรือ browser selection จะรับ event
- Ctrl+Z ทำ Undo, Shift+Ctrl+Z ทำ Redo และ Ctrl+X ทำ Cut วัตถุที่เลือกจริงบน Canvas
- ช่องกรอกข้อความยังคงใช้คีย์ลัดแก้ไขข้อความตามปกติ
- ตรวจ syntax และตรวจเส้นทาง hotkey capture ผ่าน

## v0.102 — 2026-10-07

- แก้ Text object หายจาก Preview เมื่อคลิกเลือกหรือยกเลิกการเลือก
- ในโหมดแก้ไขจะแสดงข้อความตัวอย่าง “Text” สำหรับ Text ที่ยังไม่มีค่า ส่วนการพิมพ์จริงยังคงข้ามค่าที่ว่างตามเดิม
- ตรวจ syntax ผ่าน

## v0.101 — 2026-10-07

- แยก Test Print ออกจาก Print ปกติ: ส่งเพียง 1 ฉลากจากข้อมูลชุดแรก
- Test Print ไม่ใช้ serialization, CSV หลายรายการ, Print to file, การล้างคิว หรือการ optimize สำเนา
- Test Print ไม่บันทึกค่าในเอกสารและไม่ปิดหน้าต่าง Print หลังส่งงาน
- ตรวจ syntax ผ่าน

## v0.100 — 2026-10-07

- แยก SVG ไอคอนใน Ribbon Insert ให้ตรงกับชื่อและหน้าที่ของแต่ละรายการ
- Text, Rectangle, Ellipse, Line, Inverse, Picture, Code 128/39/93, EAN-13, QR code และ DataMatrix ใช้รูปไอคอนคนละแบบ
- ตรวจ syntax ผ่าน

## v0.099 — 2026-10-07

- จัดข้อความสถานะและคำแนะนำของ Preview ให้อยู่ด้านบนของพื้นที่ Preview
- ย้ายแถบ Zoom ให้ชิดด้านล่างของพื้นที่ Preview เสมอ และไม่ทับข้อความด้านบน
- ตรวจ syntax ผ่าน

## v0.098 — 2026-10-07

- ปิดการรีโหลดหน้าโปรแกรมด้วย Ctrl+R, Ctrl+Shift+R, Ctrl+F5 และ F5 ทั้งระดับ Electron และหน้าเว็บ
- ป้องกันไม่ให้การกดคีย์ลัดทำให้หน้าตัวแก้ไขกลับไปเป็น skeleton หรือเริ่มโหลดข้อมูลใหม่
- ตรวจ syntax ผ่าน

## v0.097 — 2026-10-07

- แก้การส่งพิมพ์ค้างเมื่อ Windows printer queue อยู่สถานะ Error โดยเพิ่ม fallback ส่ง ZPL ผ่าน RAW TCP 9100 เมื่อพอร์ตเครื่องเป็น IP
- ลดเวลารอ spooler จาก 30 วินาทีเหลือ 10 วินาที และแจ้ง error ที่อ่านได้แทนการค้างที่ “Sending to printer…”
- ตรวจ syntax ผ่าน; fallback ใช้ได้เมื่อเครื่องพิมพ์เปิดรับข้อมูลที่พอร์ต RAW 9100

## v0.096 — 2026-10-07

- ลดเฉพาะความหนาของแถบไม้บรรทัดลงประมาณ 50% จาก 26px เป็น 13px
- คืนขนาดตัวเลขไม้บรรทัดเป็น 10px เพื่อให้อ่านได้ชัดเจน ตัวเลขไม่ได้ถูกลดขนาดตามแถบ
- ตรวจ syntax ผ่าน

## v0.095 — 2026-10-07

- ปรับป้ายชื่อวัตถุที่เลือกให้เกาะกับขอบเส้นสีน้ำเงินและไม่ถูกตัดเมื่อวัตถุอยู่ใกล้ขอบบน
- ลดขนาดป้ายชื่อและตัวอักษรลงประมาณ 50% ให้ใกล้เคียง ZebraDesigner
- ไม่เปลี่ยนขนาดข้อความจริงบนฉลากหรือผลพิมพ์
- ตรวจ syntax ผ่าน

## v0.094 — 2026-10-07

- แก้ปุ่มรูปเฟืองหน้า Home ให้เปิดหน้าตั้งค่าได้จริง โดยซ่อน Home overlay ก่อนเปิด Settings
- ยก z-index ของ Settings modal ให้แสดงเหนือ Home และส่วนอื่นของแอป
- ตรวจ syntax ผ่าน

## v0.093 — 2026-10-07

- ปรับ Insert/Data Sources sidebar ด้านซ้ายให้เริ่มใต้ Navbar และใช้เฉพาะความสูงพื้นที่ที่เหลือ จึงไม่ถูก Navbar บัง
- เมื่อ Navbar ซ่อน Sidebar จะกลับมาใช้พื้นที่เต็มโดยอัตโนมัติ
- ตรวจ syntax ผ่าน

## v0.092 — 2026-10-07

- เปลี่ยนสี accent ของระบบจากน้ำเงินเป็นเขียว ทั้งตัวแปรธีม ปุ่มเลือกวัตถุ เครื่องมือด้านซ้าย หน้า Home และสถานะการลากวาง
- คงสีแดง เหลือง เทา และสีของเนื้อหาฉลากไว้ตามความหมายเดิม
- ตรวจ syntax ผ่าน

## v0.091 — 2026-10-07

- แก้ Ctrl+P ให้เปิดหน้าต่าง Print ได้จากหน้าแก้ไข แม้ Electron จะดักคีย์ลัดก่อนส่งเข้าเว็บ
- ไม่ยกเลิกการเปิดหน้าพิมพ์เพราะ Home overlay ยังถูกสร้างอยู่ และยังคงกันการเปิดซ้ำเมื่อหน้าพิมพ์เปิดแล้ว
- ตรวจ syntax ผ่าน

## v0.090 — 2026-10-07

- แก้ Ctrl+Z และ Ctrl+X ในหน้าแก้ไขให้เรียก Undo และ Cut ของวัตถุได้สม่ำเสมอ พร้อมหยุด event ไม่ให้คำสั่งของเบราว์เซอร์แย่งการทำงาน
- ช่องข้อความยังคงใช้ Undo/Cut ของข้อความตามปกติ
- ตรวจ syntax ผ่าน; smoke test เดิมมี 2 กรณีล้มเหลวจากข้อจำกัดการคำนวณขนาดบาร์โค้ดที่มีอยู่ก่อนการแก้ครั้งนี้

## v0.089 — 2026-10-07

- เปลี่ยน skeleton ตอนเริ่มโปรแกรมเป็นโครงหน้า Home / Recent projects และปิดเมื่อโหลดเสร็จ
- เพิ่มหน้า Print calibration แยกจาก Page Setup เข้าจาก Home, Tools หรือ Print Offset ปรับตำแหน่ง 0.001 mm และสเกลแต่ละแกน 0.001% บันทึกทันทีและจำค่าข้ามการเปิดโปรแกรม
- ใช้ค่าปรับเทียบกับ ZPL จริงและ Print Preview รวมภาพและบาร์โค้ด โดยคงขนาดกระดาษเดิม ยกเลิกการเพิ่มขอบและย่ออัตโนมัติในเส้นทางพิมพ์
- ตรวจ syntax และสร้างแพ็กเกจ Windows; ยังไม่ได้ยืนยันด้วยการพิมพ์กระดาษจริง ความละเอียดจริงปัดตาม dpi และการขยับแนวตั้งจำกัดตามคำสั่งเครื่องพิมพ์


## v0.088 — 2026-10-07

- เพิ่มแถบ Insert ด้านซ้ายหน้าตาใกล้ ZebraDesigner พร้อม Text, Barcode, Picture, Rectangle, Ellipse, Line และ Inverse; คลิกเพื่อเพิ่ม หรือ drag ไปวางตรงตำแหน่งบนฉลาก
- เพิ่ม Data Sources แบบลากฟิลด์ในฉลากหรือค่า Barcode ไปวางเพื่อสร้างข้อความหรือผูกกับ Text/Barcode; เพิ่มฟิลด์ใหม่จากแถบนี้ได้
- เพิ่มการแสดงผลและ ZPL สำหรับ Ellipse และพื้นที่ Inverse สีดำ; แหล่งข้อมูลที่แสดงรองรับฟิลด์ในฉลากและค่า object ปัจจุบัน ยังไม่รวมฐานข้อมูล/สคริปต์ของ BarTender
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ยืนยันการลากวางในหน้าต่างแอปจริง

## v0.087 — 2026-10-07

- ขณะลากมุมรูปภาพ จะล็อกอัตราส่วนเฉพาะตอนกด Shift และยกเลิกการล็อกทันทีเมื่อปล่อย Shift แม้เมาส์ไม่ขยับ
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ตรวจการลากผ่านหน้าต่างจริง

## v0.086 — 2026-10-07

- เพิ่มตัวควบคุม Zoom มุมขวาล่างของ Preview ตามภาพ มีปุ่มลด/เพิ่ม แถบเลื่อน และเปอร์เซ็นต์ที่อัปเดตตามการซูมด้วย Ctrl+ล้อเมาส์และคำสั่งใน Ribbon
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ทดสอบปฏิสัมพันธ์ในหน้าต่างแอปจริง

## v0.085 — 2026-10-07

- ลดขนาดตัวเลขและขีดสเกลของไม้บรรทัดลง 50% โดยคงช่วงหน่วย ตำแหน่งศูนย์ และความสูงแถบไม้บรรทัดเดิม
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว

## v0.084 — 2026-10-07

- แก้พื้นที่พิมพ์ของงานเต็มหน้าให้เว้นระยะซ้าย/ขวาเท่ากัน แทนการเผื่อด้านขวามากกว่าด้านซ้าย
- ชดเชย offset แนวตั้งในระยะขอบบน/ล่างของงานพิมพ์และภาพ Preview ให้เส้นใกล้ขอบล่างไม่เลื่อนพ้นพื้นที่พิมพ์
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้พิมพ์ทดสอบกับเครื่องจริง

## v0.083 — 2026-10-07

- ปรับการลากย้ายวัตถุให้ขยับ SVG เฉพาะชิ้นที่เลือกด้วย animation frame โดยไม่วาด Barcode และ Grid ใหม่ระหว่างลาก แล้วจัดวาง/บันทึกตำแหน่งเมื่อปล่อยเมาส์
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว

## v0.082 — 2026-10-07

- เพิ่ม Shift+ลากที่มุมรูปภาพเพื่อล็อกอัตราส่วนเดิมและยึดมุมตรงข้ามไว้; เมื่อลากโดยไม่กด Shift ยังคงปรับกว้างและสูงแยกกันได้
- เพิ่มคำแนะนำคีย์ลัดใน Preview และตรวจ syntax/สร้างแพ็กเกจ Windows แล้ว

## v0.081 — 2026-10-07

- แก้กรอบเลือกวัตถุ Line ให้คำนวณตามความหนาเส้นที่ตั้งฉากกับแนวเส้น โดยไม่ขยายเกินปลายเส้นแบบ butt cap เพื่อให้กรอบสีน้ำเงินตรงกับเส้นจริง
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว

## v0.080 — 2026-10-07

- เพิ่ม skeleton shimmer ในหน้า Preview ระหว่างเริ่มแอปและโหลดโปรเจ็กต์ พร้อมซ่อนเมื่อพร้อมใช้งานและรองรับการตั้งค่าลดภาพเคลื่อนไหว
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว

## v0.079 — 2026-10-07

- เพิ่มป้ายระบุชนิดวัตถุและจุดหมุนที่ลากได้ในหน้าออกแบบ บันทึกมุมหมุนในโปรเจ็กต์ และแสดงการหมุนใน Preview แบบ SVG และภาพ raster
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; การหมุน ZPL ที่ส่งไปพิมพ์ยังไม่รองรับ

## v0.078 — 2026-10-07

- ขยายจุดจับปรับขนาดตรงมุมเล็กน้อย และเปลี่ยนจุดกึ่งกลางด้านบน ล่าง ซ้าย และขวาเป็นสี่เหลี่ยม โดยคงพื้นที่รับเมาส์และพฤติกรรมลากเดิม
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว

## v0.077 — 2026-10-07

- ปรับสีไม้บรรทัดนอกช่วงกระดาษให้กลืนกับพื้น Preview สีเทาเข้ม และช่วงตรงขนาดกระดาษเป็นสีเทาอ่อนแบบ ZebraDesigner พร้อมปรับสีตัวเลขและขีดให้อ่านชัด
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว

## v0.076 — 2026-10-07

- จับ Ctrl+P/⌘+P จากระดับหน้าต่างแอปและเปิดหน้าพิมพ์ได้โดยไม่เรียกหน้าพิมพ์ของ Chromium
- ปรับหน้าพิมพ์ให้เป็นหน้าต่างกะทัดรัด มีแท็บ Printer, Object Print Method, Performance และ Printer’s Cache ตามภาพอ้างอิง พร้อมคงการพิมพ์และ Preview
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ทดลองส่งงานไปพิมพ์กับเครื่องจริง

## v0.075 — 2026-10-07

- ปรับสัดส่วน Navbar ให้ใกล้กับ ZebraDesigner โดยลดความสูงแท็บและแถบคำสั่ง พร้อมคงขนาดไอคอนและข้อความให้อ่านง่าย
- ตรวจเลขเวอร์ชันและสร้างแพ็กเกจ Windows แล้ว; เทียบจากภาพ ZebraDesigner ที่ผู้ใช้ส่งไว้ เนื่องจากหน้าต่างโปรแกรมสดไม่ปรากฏในรายการแอปของเครื่องมือ

## v0.074 — 2026-10-07

- ขยายข้อความ ไอคอน และระยะของ Navbar กลับเป็นขนาดมาตรฐานของ Ribbon เพื่อให้อ่านและกดได้ใกล้เคียง ZebraDesigner
- ตรวจเลขเวอร์ชันและสร้างแพ็กเกจ Windows แล้ว

## v0.073 — 2026-10-07

- ปรับงานพิมพ์ฉลากที่ออกแบบเต็มหน้ากระดาษให้ย่ออยู่ในขอบและชิดซ้าย ลดช่องว่างซ้าย พร้อมเผื่อพื้นที่พิมพ์ด้านขวา
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ทดสอบพิมพ์กับเครื่องจริง

## v0.072 — 2026-10-07

- ขยับแถบเครื่องมือจัดหน้าออกจากขอบ Preview เพื่อไม่ให้ทับ scrollbar ด้านขวา
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ตรวจตำแหน่งด้วยเมาส์ในหน้าต่างจริง

## v0.071 — 2026-10-07

- เปลี่ยนจุดจับสีเขียวให้เป็นสีน้ำเงินเดียวกับเส้นกรอบ และคงจุดลากข้อความบาร์โค้ดสีเหลืองไว้
- ลดขนาดจุดจับและความหนาเส้นกรอบลง 50%; ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว

## v0.070 — 2026-10-07

- ลบแผนภาพตารางเปล่าและข้อความสรุปขนาดที่ซ้ำออกจากแท็บ Layout โดยคงการตั้งค่าและตัวอย่างกระดาษด้านขวาไว้
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ตรวจหน้าต่างแอปด้วยตนเอง

## v0.069 — 2026-10-07

- แทนแถบเลื่อนจำลองด้วย scrollbar แนวนอนและแนวตั้งที่ลาก thumb, คลิกราง และใช้ปุ่มลูกศรได้
- ผูกตำแหน่ง thumb เข้ากับ wheel, Ctrl/Shift+wheel, zoom และลากกลางเมาส์ ให้แถบกับหน้า Preview เคลื่อนพร้อมกัน
- ซ่อนแถบเมื่อเห็นกระดาษครบ และแสดงเมื่อกระดาษล้นพื้นที่; ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว

## v0.068 — 2026-10-07

- ปิด Ctrl+R และ Ctrl+Shift+R ที่ทำให้ Chromium reload หน้าโปรแกรมจน Preview กลับเป็นหน้าว่าง
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว

## v0.067 — 2026-10-07

- ให้คลิกที่พื้นที่ใดก็ได้บนการ์ดเพื่อเปิดโปรเจกต์ และคงปุ่ม × สำหรับลบ/นำ sample ออกจากรายการ
- เพิ่มเมนูคลิกขวาสำหรับ Rename, Show in folder, Copy path, Open a copy, Pin/Unpin และ Remove/Delete ตามชนิดโปรเจกต์
- บันทึกชื่อไฟล์และย้ายค่าตั้งค่าที่ผูกกับโปรเจกต์เมื่อ rename; เพิ่ม IPC ที่ตรวจว่าไฟล์อยู่ในรายการโปรเจกต์ก่อนจัดการ
- ตรวจ syntax แล้ว; ยังไม่ได้ทดลองเมนูจากหน้าต่างแอป

## v0.066 — 2026-10-07

- เปลี่ยน Ctrl+wheel ให้ซูมเข้าออกตามตำแหน่งเมาส์ และคำนวณตำแหน่งหลัง scroll อย่างถูกต้อง
- ซ่อน scrollbar ทั้งสองแกนเมื่อกระดาษอยู่ครบภายใน Preview และแสดงอีกครั้งเมื่อกระดาษเกินกรอบ
- ตรวจ syntax และสร้างแพ็กเกจ Windows; ยังไม่ได้ตรวจด้วยเมาส์ในหน้าต่างจริง


## v0.065 — 2026-10-07

- ให้ภาพตัวอย่างใน Preview Settings เปลี่ยนตามโหมด Navbar/Ruler, Grid และสีพื้นหลังทันที
- ใช้ข้อมูลตัวอย่างเดียวกับฉลากปัจจุบัน และรีเฟรชเมื่อสถานะการตั้งค่าเปลี่ยน
- ปรับพื้นที่ Preview และขนาดกระดาษหลัง navbar แสดง/ซ่อนเสร็จ แม้ไม้บรรทัดซ่อนอยู่
- ตรวจ syntax และแพ็กเกจ Windows แล้ว; ยังไม่ได้ตรวจภาพทุกโหมดผ่านหน้าต่างจริง


## v0.064 — 2026-10-07

- ลดขนาดเนื้อหา navbar ลง 25% ทั้งข้อความ ไอคอน ปุ่ม ช่องกรอก และระยะห่าง ด้วยสัดส่วนเดียวกัน
- ลดความสูง navbar ตามเนื้อหา และใช้ความสูงจริงจัด Preview/ไม้บรรทัดใต้แถบ
- สร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ตรวจภาพทุกแท็บในหน้าต่างจริง


## v0.063 — 2026-10-07

- แก้พื้น ขีด และตัวเลขไม้บรรทัดแนวนอนให้อยู่ในแถบเดียวกันใต้ navbar
- แก้ศูนย์ไม้บรรทัดให้ตรงกับขอบกระดาษเมื่อเลื่อน scrollbar โดยไม่บวก scroll ซ้ำ
- ตรวจ syntax และสร้างแพ็กเกจ Windows; ยังไม่ได้ยืนยันภาพจากหน้าต่างจริง


## v0.062 — 2026-10-07

- แก้ wheel ให้ขยับหน้า Preview โดยตรงได้ครบแนวตั้งและแนวนอน ไม่ติดเมื่อพื้นที่ scroll ไม่มีระยะเลื่อน
- ล้อปกติเลื่อนขึ้นลง, Shift+wheel เลื่อนซ้ายขวา, Ctrl+wheel เลื่อนขึ้นลง และขยับหน้าไปตามการลากกลางเมาส์
- เปิด scrollbar แนวนอน/แนวตั้งของ Preview; ตรวจ syntax และแพ็กเกจแล้ว ยังไม่ได้ยืนยันการเลื่อนในหน้าต่าง ZebraBar หลังเปิด

## v0.061 — 2026-10-07

- จัด navbar ให้ชิดขอบบนและเต็มความกว้าง พร้อมตัดระยะขอบและมุมโค้งออก
- ขยับพื้นที่ Preview ลงตามความสูง navbar ตอนแสดง ทำให้ scrollbar ด้านขวาเริ่มใต้ navbar และต่อถึงขอบล่าง
- เปิด scrollbar ของ Preview ให้มองเห็นและลากได้; ตรวจ syntax และแพ็กเกจแล้ว ยังไม่ได้ยืนยันภาพจากหน้าต่างหลังเปิด

## v0.060 — 2026-10-07

- ย้ายไม้บรรทัดแนวนอนลงมาเริ่มใต้ navbar เมื่อ navbar แสดง เพื่อไม่ให้แถบเครื่องมือบังตัวเลขและขีดบอกระยะ
- ให้พื้นและเส้นแกนของไม้บรรทัดตามตำแหน่งเดียวกัน และปรับตามเมื่อ navbar ซ่อนหรือแสดง
- ตรวจ syntax และแพ็กเกจแล้ว; ยังไม่ได้ยืนยันภาพจากหน้าต่างแอปหลังเปิด

## v0.059 — 2026-10-07

- แสดงจุดจับปรับขนาดสีเขียวครบ 8 ตำแหน่งเมื่อเลือกวัตถุ ให้ลากจากมุมและกึ่งกลางขอบได้เหมือน BarTender
- เพิ่มจุดสีเหลืองบนข้อความ HRI ของ Barcode ให้ลากข้อความขึ้นลงแยกจากแท่งบาร์โค้ด และบันทึกตำแหน่งไว้ในโปรเจกต์
- ให้ Preview และ ZPL ที่ส่งพิมพ์ใช้ตำแหน่งข้อความเดียวกัน; ตรวจ syntax และแพ็กเกจแล้ว ยังไม่ได้พิมพ์ทดสอบกับเครื่องจริง

## v0.058 — 2026-10-07

- จำกัดไม้บรรทัดแนวตั้งให้เริ่มใต้ขอบ navbar ที่กำลังแสดง เพื่อไม่ให้ขีดและพื้นไม้บรรทัดโผล่ซ้อนใต้แถบเมนู
- คำนวณขอบใหม่เมื่อ navbar แสดง/ซ่อนและเมื่อพื้นที่ Preview ปรับขนาด
- ตรวจ syntax และแพ็กเกจ Windows; ยังไม่ได้ตรวจตำแหน่ง navbar ทุกขนาดหน้าต่าง

## v0.057 — 2026-10-07

- ปรับ scroll surface ให้อยู่หลังเนื้อหากระดาษ เพื่อไม่ดันฉลากออกนอก viewport ตอนเปิดเอกสาร
- คง scrollbar แนวนอน/แนวตั้งและ wheel navigation พร้อมพื้นที่เลื่อนจริง
- ตรวจ syntax และแพ็กเกจ Windows; กำลังตรวจการวางกระดาษเริ่มต้นบนหน้าจอ

## v0.056 — 2026-10-07

- แก้ Preview ให้มีพื้นที่ scroll เกินกรอบและใช้ scrollbar แนวนอน/แนวตั้งเลื่อนกระดาษได้จริง แม้กระดาษเริ่มต้นจะพอดีกับหน้าจอ
- ผูกล้อเมาส์เลื่อนแนวตั้ง, Shift+wheel แนวนอน และ Ctrl+wheel แนวตั้ง พร้อมปรับไม้บรรทัดตามตำแหน่ง scroll
- ตรวจ syntax และแพ็กเกจ Windows; ยังไม่ได้ยืนยันการลาก/scroll ผ่านหน้าต่างจริงหลังการแก้

## v0.055 — 2026-10-07

- เพิ่มปุ่มลบ/นำออกจากรายการบนการ์ด Recent projects และ Browse all labels
- CUSTOM ยืนยันก่อนลบไฟล์โปรเจกต์ถาวร; SAMPLE ยืนยันก่อนซ่อนออกจากรายการ โดยไม่ลบไฟล์ที่มากับแอป
- ล้างสถานะ Recent และ Page Setup ของรายการที่ลบ พร้อมรีเฟรชหน้า Home
- ตรวจ syntax และสร้างแพ็กเกจ Windows; ยังไม่ได้ทดสอบลบไฟล์จริงจากหน้าจอ

## v0.054 — 2026-10-07

- เพิ่ม scrollbar แนวนอน/แนวตั้งที่ลากได้ใน Preview และคงการเลื่อนด้วยล้อเมาส์/Shift+wheel
- ปรับไม้บรรทัดให้ตามกระดาษหลังเลื่อน และใช้แถบเลื่อนของพื้นที่ Preview โดยตรง
- ตรวจ syntax และสร้างแพ็กเกจ Windows; ยังไม่ได้ตรวจการลาก scrollbar จริงบนอุปกรณ์ทุกขนาด

## v0.053 — 2026-10-07

- เพิ่ม Preview ด้านขวาใน Page Setup, New Label Wizard, Print, Document Properties และ modal ตั้งค่าฉลาก/วัตถุ/ข้อมูล/Preview Settings
- ใช้ภาพกระดาษ ขอบและแนวแบ่งฉลาก พร้อม Page Size / Template Size ที่อัปเดตตามค่าที่แก้; ย้าย Preview เดิมใน Stock ออกเพื่อไม่ให้ซ้ำ
- สร้างแพ็กเกจ Windows และเปิดเวอร์ชันใหม่; ยังไม่ได้ตรวจทุกขนาดกระดาษและทุก modal บนหน้าจอจริง

## v0.052 — 2026-10-07

- ตรวจ Print ของ BarTender และเพิ่ม Ctrl+P Print dialog พร้อม Quantity, Options, Offset, Object Print Method, Performance และ Printer’s Cache
- เชื่อม Print/Test Print, Preview, CSV records, serialization, copies, ZPL export, Document/Printer Properties และ cache ของ ZebraBar
- ตรวจ print-job tests และ TCP loopback สำเร็จ; ยังไม่ได้ยืนยันผลบนกระดาษจริง และ smoke เดิมยังไม่ผ่าน 2 กรณีตำแหน่ง/วัตถุเกินขนาด

## v0.051 — 2026-10-07

- ปรับพื้นหลังช่วงไม้บรรทัดที่ตรงกับขนาดกระดาษให้ทึบและเข้มขึ้น พร้อมเน้นขีดและตัวเลขในช่วงกระดาษ
- คงตำแหน่งและสเกลไม้บรรทัดตามขอบกระดาษจริงขณะเลื่อนและซูม
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ตรวจทุกตำแหน่งการเลื่อนบนหน้าจอจริง

## v0.050 — 2026-10-07

- เพิ่มหน้า Home สำหรับเลือกโปรเจกต์/ฉลากล่าสุด ค้นหาและดูฉลากทั้งหมด หรือเริ่มฉลากใหม่
- เพิ่มทางลัดเปิดไฟล์ฉลากและเปิด Settings จากหน้าเริ่มต้น; เลือกฉลากเพื่อเข้าสู่หน้าออกแบบ
- หน้า Home แสดงเครื่องพิมพ์ปัจจุบันและเวอร์ชัน; เปิดเป็นหน้าแรกหลังเริ่มแอป
- ตรวจ syntax และแพ็กเกจ Windows; ยังไม่ได้ยืนยันการเลือกฉลากจากหน้า Home ผ่านหน้าจอ

## v0.049 — 2026-10-07

- ดู New Label Setup Wizard ใน ZebraDesigner Essentials ที่เปิดอยู่จริง และเพิ่ม Wizard ตามลำดับเดียวกันในปุ่ม New และ Ctrl+N
- เลือกเครื่องพิมพ์ กระดาษ แนวฉลาก ขนาด ระยะขอบ แถว/คอลัมน์ พร้อมภาพตัวอย่างและหน้าสรุป
- Finish สร้างฉลากเปล่าตามค่าที่เลือก; Cancel เก็บงานเดิม ตรวจขอบกระดาษ และแปลงหน่วย mm/in
- ตรวจ syntax และแพ็กเกจ Windows; ยังไม่ได้ยืนยันผลพิมพ์จริง

## v0.048 — 2026-10-07

- เพิ่มตัวเลือกการแสดงไม้บรรทัดใน Preview Settings ระหว่าง Fixed กับ Auto-hide
- บันทึกและโหลดการตั้งค่าไม้บรรทัดให้คงเดิมเมื่อเปิดแอปใหม่
- ตรวจ syntax และแพ็กเกจ Windows แล้ว; ยังไม่ได้ยืนยันการสลับตัวเลือกผ่านหน้าจอจริง

## v0.047 — 2026-10-07

- แก้การเปิด Page Setup ด้วยดับเบิลคลิก โดยตรวจจังหวะคลิกที่กรอบพรีวิวซึ่งไม่ถูกสร้างใหม่ระหว่างคลิก
- เปิดหน้าตั้งค่าเฉพาะเมื่อดับเบิลคลิกพื้นที่ว่างภายในกระดาษ; คลิกวัตถุไม่เรียก Page Setup
- ตรวจ syntax และเตรียมแพ็กเกจ Windows; ตรวจการทำงานบนหน้าจอจริงหลังเปิดรุ่นใหม่

## v0.046 — 2026-10-07

- เพิ่มตัวเลือก Navbar ใน Preview Settings ระหว่าง Fixed กับ Auto-hide
- บันทึกค่าที่เลือกใน Settings และโหลดกลับมาเมื่อเปิดแอป
- ตรวจ syntax และสร้างแพ็กเกจ Windows แล้ว; ยังไม่ได้ทดสอบเปลี่ยนตัวเลือกผ่านหน้าจอจริง

## v0.045 — 2026-10-07

- ดับเบิลคลิกบนพื้นที่ว่างภายในฉลากเพื่อเปิด Page Setup ได้ทันที
- ดับเบิลคลิกบนวัตถุยังคงเปิดหน้าจัดการ Elements; คลิกนอกแผ่นฉลากไม่เปิดหน้าตั้งค่า
- แพ็กเกจสำหรับ Windows สร้างแล้ว; ยังไม่ได้ทดสอบการคลิกในหน้าจอจริง

## v0.044 — 2026-10-07

- ปรับงานพิมพ์ของแบบที่ใช้พื้นที่เต็มฉลากให้ย่อเข้า safe area ตามระยะขอบ 0.07 นิ้วของ BarTender โดยคงขนาดกระดาษ 2.5×2.5 นิ้วไว้
- ใช้การจัดวางเดียวกันกับภาพพรีวิวพิมพ์ เพื่อป้องกันวัตถุด้านขวาและด้านล่างถูกตัด
- ตรวจเทียบ Page Setup ของ BarTender แล้ว; ยังไม่ได้ทดลองพิมพ์บนเครื่องจริง

## v0.043 — 2026-10-07

- ปรับเลขเวอร์ชันที่แสดงใน title bar และตัวแอปเป็นรูปแบบทศนิยมสามหลัก
- ซิงก์เลขแสดงผล 0.043 กับ package version 0.0.43 และปรับหัวข้อ changelog รุ่นเก่าให้ใช้รูปแบบเดียวกัน
- ตรวจ syntax และแพ็ก EXE แล้ว


## v0.042 — 2026-10-07

- เพิ่มปุ่ม Show/Hide grid ในแท็บ View กดแล้วสลับเส้นกริดบนฉลากทันที
- แสดงสถานะปุ่มตามค่า Grid และ sync ร่วมกับ Preview Settings
- ตรวจ syntax และแพ็ก EXE แล้ว


## v0.041 — 2026-10-07

- ปรับฉากหลัง modal ให้โปร่งสีเทาเข้ม เห็นหน้าเดิมอยู่ด้านหลัง ไม่ปูพื้นขาวทึบเต็มหน้าต่าง
- ใช้ฉากหลังเดียวกันกับหน้าตั้งค่าและหน้าช่วยเหลือ
- ตรวจ syntax และแพ็ก EXE แล้ว


## v0.040 — 2026-10-07

- ลดเวลาซ่อน Ribbon หลังเมาส์ออกจากแถบเหลือ 90 มิลลิวินาที และทำ transition ให้สั้นลง
- ซ่อนตามตำแหน่ง pointer โดยไม่ค้างเพราะปุ่ม Ribbon มี focus
- ตรวจ syntax และแพ็ก EXE แล้ว


## v0.039 — 2026-10-07

- เปลี่ยน toolbar เป็น Ribbon แบบแท็บ แบ่ง File, Home, Insert, Layout, Data, View, Tools และ Help โดยแสดงคำกำกับเครื่องมือ
- เชื่อมเครื่องมือไฟล์ พิมพ์ แทรกวัตถุ barcode clipboard undo/redo จัดแนว ลำดับวัตถุ และ zoom เข้ากับคำสั่งจริง
- เพิ่มช่องตำแหน่งและขนาดวัตถุใน Ribbon และปิดเครื่องมือที่ต้องเลือกวัตถุจนกว่าจะเลือก
- คงการซ่อน Ribbon เมื่อ mouse ออกจากด้านบน พร้อมพื้นที่ preview เต็มจอ
- ตรวจ syntax และแพ็ก EXE; เครื่องมือขั้นสูงอย่าง RFID, ฐานข้อมูล และ rich text ของ BarTender ยังไม่รองรับ


## v0.038 — 2026-10-07

- ซ่อน toolbar ด้านบนเมื่อ pointer ออกจากบริเวณขอบบน และแสดงเมื่อเลื่อนเมาส์กลับขึ้นไป
- แสดง toolbar แบบ overlay ไม่ดันพื้นที่ preview หรือไม้บรรทัดลง
- ตรวจ syntax และแพ็ก EXE แล้ว


## v0.037 — 2026-10-07

- ขยายพื้นที่ preview และไม้บรรทัดจนชิดขอบพื้นที่ทำงาน เอาระยะเผื่อด้านล่างออก
- ย้ายขนาดฉลากและคำแนะนำไปชิดมุมขวาล่างด้วยตัวอักษรขนาดเล็ก โดยวางทับบนพื้นที่ preview
- ตรวจ syntax และแพ็ก EXE แล้ว


## v0.036 — 2026-10-07

- ตัดพื้นที่ว่างและข้อความใต้ preview ออก ให้ฉาก preview ขยายเต็มพื้นที่ที่มี
- เปลี่ยนพื้นหลัง workspace เป็นเทาเข้ม และเพิ่มตัวเลือกสีใน Preview Settings ซึ่งจำค่าหลังปิดโปรแกรม
- ตรวจ syntax, แพ็ก EXE และเปิดตรวจหน้าจอจริง


## v0.035 — 2026-10-07

- ดู BarTender ที่เปิดอยู่และทดลองเลื่อนแนวตั้ง: กระดาษเลื่อนและจุดศูนย์ไม้บรรทัดเลื่อนตาม
- แก้ preview ให้เป็นพื้นที่เต็มหน้าจอ ยกเลิกกรอบจำกัด 780px และการจัดกึ่งกลางซ้ำ
- ไม้บรรทัดอยู่ขอบพื้นที่ทำงาน แสดงค่าติดลบและสเกลตามซูม; ล้อเลื่อนขึ้นลง Shift เลื่อนซ้ายขวา Ctrl ซูม และลากด้วยปุ่มกลางเพื่อเลื่อนกระดาษ
- แก้พื้นดำภายใน modal Printers and Templates ให้ใช้สีพื้นตามธีม
- ตรวจ syntax และแพ็ก EXE; ตรวจภาพและการเลื่อนจริงในโปรแกรมหลังเปิด


## v0.034 — 2026-10-07

- เปลี่ยนฉากหลัง modal เป็นสีพื้นทึบตามธีม เพื่อไม่ให้ลาย preview หรือวัตถุสีดำทะลุให้เห็นรอบ modal
- ปรับ modal ตั้งค่าและช่วยเหลือให้ใช้ฉากหลังทึบแบบเดียวกัน
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ตรวจภาพหน้าจอหลังเปิด modal จริง

## v0.033 — 2026-10-07

- เปลี่ยนการเลื่อน preview จาก scrollbar เป็นขยับตัว label ภายในกรอบโดยตรง และซ่อน scrollbar
- ล้อเมาส์เลื่อน preview ขึ้นลง, Shift/trackpad เลื่อนซ้ายขวา และ Ctrl+ล้อเมาส์ซูมตาม pointer โดยคงมุมมองไว้หลังวาด preview ใหม่
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบการเลื่อนผ่าน UI จริง

## v0.032 — 2026-10-07

- ลดความทึบของฉากหลัง modal ไม่ให้หน้าหลักมืดดำมากเกินไป
- ปิด modal ทันทีเมื่อกด Done, ปิดหน้าต่าง, กด Escape หรือคลิกฉากหลัง แล้วบันทึกข้อมูลต่อโดยไม่ค้าง overlay
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบปิด modal ผ่าน UI จริง

## v0.031 — 2026-10-07

- คงระดับซูมและตำแหน่งเลื่อนของ preview ไว้หลังเลือก/ลาก/แก้ไข object ไม่รีเซ็ตกลับตำแหน่งเดิม
- ปรับ Ctrl+Scroll ให้ซูมโดยยึดตำแหน่ง pointer และให้ Shift/Scroll เลื่อน canvas ในแกนที่กำหนดได้ต่อเนื่องเหมือนพื้นที่ทำงานของ BarTender
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบการเลื่อนผ่าน UI จริง

## v0.030 — 2026-10-07

- ปรับกรอบเลือกเส้นให้ครอบ stroke จริงจากตำแหน่งปลายเส้นและความหนา
- ลากขอบบน/ล่างของเส้นเพื่อปรับความหนา stroke โดยรักษาพิกัดและแนวเส้น ไม่ทำให้เส้นเอียงหรือยืดกรอบ
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบลากปรับขนาดผ่าน UI จริง

## v0.029 — 2026-10-07

- ทำปุ่มจัดแนวบนแถบด้านขวาให้จัดวัตถุเดี่ยวกับขอบ/กึ่งกลางฉลากได้ และจัดหลายวัตถุเทียบกับวัตถุหลักที่เลือก
- เปิดใช้การกระจายวัตถุเมื่อเลือกอย่างน้อย 3 ชิ้น พร้อมปิดปุ่มและแสดงคำแนะนำเมื่อเลือกไม่ครบ
- เก็บสถานะก่อนจัดแนวเพื่อให้ Undo ย้อนกลับได้
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบการโต้ตอบผ่าน UI จริง

## v0.028 — 2026-10-07

- แก้ preview ให้เป็นพื้นที่ scroll ได้จริงสำหรับเลื่อนขึ้นลงและซ้ายขวา
- ปรับ Shift+Scroll ให้เลื่อนแนวนอนได้ทั้งกรณีที่ระบบส่ง deltaX หรือ deltaY และให้ Ctrl+Scroll ซูมเข้าออกได้
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบใช้งานจริงกับเมาส์/เครื่องผู้ใช้

## v0.027 — 2026-10-07

- เอาพื้นหลังเทา hover ของพื้นที่เลือกวัตถุออก เพื่อไม่ให้ดูเหมือนมีเงาเกินจาก object
- จำกัดพื้นที่เลือกเส้นให้ตรงกับแนวเส้นและความหนาจริง คลิกในพื้นที่ว่างรอบเส้นแล้วจะไม่เลือกเส้น
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบกับเครื่องพิมพ์จริง

## v0.026 — 2026-10-07

- แก้ไม้บรรทัดให้เริ่มทำงานหลังวาด preview และแสดงตามตำแหน่ง label เมื่อเมาส์อยู่บน preview รวมถึงอัปเดตเมื่อซูมหรือเลื่อน
- ย้ายแถบจัดแนววัตถุไปด้านขวาของ preview และแสดงเมื่อเลือกวัตถุ เช่น barcode
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบการใช้งานจริงบนเครื่องพิมพ์

## v0.025 — 2026-10-07

- ปรับกรอบเลือกและจุดจับปรับขนาดให้พอดีกับขอบวัตถุจริง รวมถึงเส้นที่มีความหนา
- คงพื้นที่รับคลิกแบบขยายไว้เพื่อให้เลือกวัตถุขนาดเล็กได้ง่าย โดยไม่ทำให้กรอบสีน้ำเงินใหญ่เกินวัตถุ
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบใช้งานจริงบนเครื่องผู้ใช้

## v0.024 — 2026-10-07

- เพิ่มเลื่อนมุมมอง Preview ด้วยล้อเมาส์ขึ้น/ลง และ Shift+ล้อเมาส์หรือ wheel แนวนอนเพื่อเลื่อนซ้าย/ขวา
- เพิ่ม Ctrl+ล้อเมาส์เพื่อซูม 50%–400% โดยรักษาตำแหน่งใต้ pointer และกลับขนาดพอดีพื้นที่เมื่อ preview ถูกวาดใหม่
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบใช้งานจริงบนเครื่องผู้ใช้


## v0.023 — 2026-10-07

- เพิ่มไม้บรรทัดแนวนอนและแนวตั้งรอบ label ใน preview แสดงเมื่อเมาส์อยู่บน preview และซ่อนเมื่อเลื่อนออก
- ใช้หน่วยระบบ mm/cm/in/mil/dots และอิงสเกลจากขนาด label ที่แสดงจริง ไม้บรรทัดเป็น overlay จึงไม่ติดไปกับภาพพิมพ์หรือ export
- ตรวจ syntax และแพ็กแล้ว ยังไม่ได้ทดสอบใช้งานจริงบนเครื่องผู้ใช้


## v0.022 — 2026-10-07

- แก้ hit area ปรับขนาดที่ไม่ได้ถูกสร้างบนกรอบ object ที่เลือก ทำให้ลากขอบและมุมไม่ได้
- เพิ่มพื้นที่จับแบบโปร่งใสที่กลางขอบและทั้ง 4 มุม โดยไม่มีจุดวงกลมหรือสี่เหลี่ยมปรากฏ และคงเส้นกรอบเลือกสีฟ้าไว้
- ตรวจ syntax และแพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบการลากจริงบนเครื่องผู้ใช้


## v0.021 — 2026-10-07

- เพิ่มแถบเครื่องมือ SVG สำหรับจัดแนวและกระจายวัตถุ ซ่อนไว้เมื่อไม่มี object ถูกเลือก และแสดงเมื่อคลิกเลือกบน canvas
- รองรับ multi-select เพื่อจัดแนวเทียบกับวัตถุที่เลือกตัวแรก และกระจายระยะเมื่อเลือกตั้งแต่ 3 ชิ้น
- ตรวจ syntax; ยังไม่ได้ทดสอบพิมพ์จริง


## v0.020 — 2026-10-07

- แก้ชื่อ history ซ้ำที่ทำให้สคริปต์ Modal หยุดโหลด จึงย้ายฟอร์มไม่ได้และ preview ไม่แสดง
- ย้าย sidebar เครื่องพิมพ์และเทมเพลต กับ Grid Snap และ Export image ไปอยู่ใน Modal เปิดผ่าน navbar
- ขยายพื้นที่ preview เต็มใต้ navbar และปรับ canvas ตามพื้นที่หน้าจอ
- ตรวจ syntax รวมสคริปต์แล้ว ยังไม่ได้ทดสอบพิมพ์จริง


## v0.019 — 2026-10-07

- ย้าย Properties Values Elements List Fields และ Print History เป็น Modal เปิดจาก SVG navbar พื้นที่หลักแสดง canvas
- เพิ่ม Shape และกรอบพิมพ์ Rectangle Rounded rectangle Ellipse พร้อมความหนาเส้น เพิ่ม starting corner และ stock presets
- เพิ่มแท็บ Templates แจ้งขอบเขตที่รองรับ ยังไม่รองรับ RFID Magnetic stripe งานสองหน้า และ job/group cover templates
- บันทึกก่อนปิด Modal รองรับ Escape และ double-click องค์ประกอบเพื่อเปิด Elements
- ยังไม่ได้ทดสอบพิมพ์จริง


## v0.018 — 2026-10-07

- แยกไอคอน Save as new ออกจาก Copies: Save as new ใช้เอกสารพร้อมเครื่องหมายบวก ส่วน Copies ใช้กระดาษซ้อนพร้อมเส้นจำนวน


## v0.017 — 2026-10-07

- ปรับ UI เป็นแนวทาง Zebra ด้วยพื้นขาว/เทา ตัวอักษรและแถบด้านข้างสีดำ พร้อมสีเหลืองเน้นรายการและสถานะเลือก
- ปรับปุ่มหลัก เส้นเลือกบน editor เมนู Page Setup และการ์ดให้ใช้ชุดสีและมุมที่สอดคล้องกัน
- ยังใช้ไอคอนและชื่อ ABSS ZebraBar ของแอป ไม่ใช้โลโก้ทางการ และไม่ได้ทดสอบพิมพ์จริง


## v0.016 — 2026-10-07

- เปลี่ยนปุ่ม Remove field ให้ใช้ไอคอน SVG ถังขยะ จัดให้อยู่ในปุ่มขนาดคงที่ ไม่ตัดข้อความหลายบรรทัด
- เพิ่ม tooltip และ aria-label เพื่อให้ยังทราบชื่อคำสั่งและรองรับ screen reader


## v0.015 — 2026-10-07

- เปลี่ยนแถบคำสั่งเป็น navbar แถวเดียว ใช้ SVG สำหรับ Undo Redo Page Setup Export Import Delete Save as new และ Print พร้อม tooltip และชื่อสำหรับ screen reader
- รักษาไอคอน Print ระหว่างพิมพ์ ปิดการกดซ้ำและแสดง animation พร้อมสถานะใน tooltip และข้อความสถานะเดิม
- หน้าจอแคบเลื่อนแถบแนวนอนได้ ไม่แตกเป็นสองแถว คงช่องจำนวน Copies
- แพ็กโปรแกรมแล้ว ยังไม่ได้ทดสอบพิมพ์จริง


## v0.014 — 2026-10-07

- รวม Page Setup เป็น Modal แยก Stock, Page, Layout, Media Handling, Printing Order และ Background โดยใช้ฟิลด์เดิมและ autosave
- เพิ่มกลับทิศพิมพ์ 180 องศา Mirror Negative Print mode และลำดับพิมพ์ตามแถวหรือคอลัมน์ มีผลในคำสั่ง ZPL จริง
- กด Done ปิดหน้าต่าง หรือ Escape จะบันทึกข้อมูลก่อนปิด
- ยังไม่รองรับงานสองหน้าและการหมุน 90 องศา ไม่ได้พิมพ์ทดสอบจริง


## v0.013 — 2026-10-06

- แก้พิกัดตอนพิมพ์ให้รวม Page margins ในตำแหน่งแต่ละชิ้นโดยตรง และรีเซ็ต orientation/mirror/reverse ที่อาจค้างจากงานก่อนหน้า
- ย้ายชิ้นที่เกินขอบเทมเพลตกลับเข้าในพื้นที่พิมพ์ โดยรักษาขนาดบาร์โค้ด QR Data Matrix และกรอบ ไม่แก้ตำแหน่งในหน้า editor
- หากชิ้นใหญ่กว่าพื้นที่เทมเพลตจะแสดงข้อผิดพลาดแทนการพิมพ์ตัดขอบ
- ยังไม่ได้ทดสอบพิมพ์บนสติกเกอร์จริง


## v0.012 — 2026-10-06

- เพิ่มแก้คืนค่าอัตโนมัติสำหรับเทมเพลต nuovo-modello เมื่อพบค่าผิดจาก regression ก่อนหน้า: Template 2.5 นิ้วและ margin 0.7 นิ้ว จะคืนเป็น Template 2.36 นิ้วและ margin 0.07 นิ้วตามภาพ
- ตรวจ JavaScript syntax; จะตรวจ smoke tests ก่อนแพ็ก และยังไม่ได้พิมพ์ทดสอบบนสติกเกอร์จริง

## v0.011 — 2026-10-06

- ลบชุด Template margins ที่ซ้ำออก ให้แก้ Top/Bottom/Left/Right margins ได้จาก Page setup แห่งเดียว
- ย้าย Template Width/Height เข้า Page setup เพิ่ม Set manually และคำนวณขนาดเทมเพลตอัตโนมัติตามกระดาษ margin แถว/คอลัมน์ และ gap ได้
- เพิ่มช่อง Horizontal/Vertical gap และปรับ preset ให้ตรงภาพตัวอย่าง: กระดาษ 2.5 × 2.5 นิ้ว เทมเพลต 2.36 × 2.36 นิ้ว margin 0.07 นิ้ว
- ตรวจ syntax และ smoke tests ทั้ง 12 รายการผ่าน; ยังไม่ได้ทดสอบงานพิมพ์จริง

## v0.010 — 2026-10-06

- ปุ่มพิมพ์แสดง Preparing print… ก่อนเริ่มและ Printing… ระหว่างส่งงาน พร้อมปิดปุ่มกันกดซ้ำ; แสดงผลสำเร็จหรือ Print failed พร้อมสาเหตุหลังทำงาน
- ปรับการส่ง RAW ผ่าน Windows ให้ส่งข้อมูลจนครบเมื่อ spooler รับเป็นช่วง และแจ้งข้อผิดพลาดเมื่อข้อมูลส่งไม่ครบหรือใช้เวลาเกิน 30 วินาที
- ตรวจ JavaScript syntax และ smoke tests 12 รายการผ่าน; ไม่ได้ส่งงานพิมพ์จริงระหว่างตรวจ

## v0.009 — 2026-10-06

- ย้ายตัวเลือกหน่วยวัดไปไว้ที่ Settings และใช้หน่วยจากระบบเดียวกันใน Editor กับ Page setup
- เปลี่ยนหน่วยแล้วคงขนาดจริงของเทมเพลตและกระดาษไว้ โดยแปลงเฉพาะค่าที่แสดง

## v0.008 — 2026-10-06

- เพิ่ม Page setup แยกขนาดกระดาษจริงจากเทมเพลต รองรับหน่วย in/mm/cm, แถว/คอลัมน์, margin และ gap พร้อมภาพผังหน้าและปุ่ม Fit template
- ใช้ขนาดกระดาษในคำสั่ง ZPL จริงและ Export print image; ตั้ง nuovo-modello เป็น 2.5 × 2.5 นิ้ว พร้อมจัดเทมเพลตเดิม 60 mm กลางกระดาษ
- สำรองไฟล์เทมเพลตก่อนเปลี่ยนค่า และตรวจการแปลงขนาด/margin/หลายคอลัมน์ก่อน build


## v0.007 — 2026-10-06

- เปลี่ยนชื่อแอปที่แสดงในหน้าต่าง ส่วนหัว และชื่อไฟล์โปรแกรมที่แพ็กเป็น **ABSS ZebraBar**
- เปลี่ยนชื่อ shortcut บน Desktop เป็น **ABSS ZebraBar**; สร้าง shortcut ชื่อใหม่โดยไม่ลบ shortcut เก่า
- คงชื่อพื้นที่จัดเก็บข้อมูลภายในเป็น Bratender เพื่อให้เทมเพลตและการตั้งค่าเดิมยังอยู่ครบ
- ยังไม่ได้ทดสอบการติดตั้งบนเครื่อง Zebra จริง

## v0.006 — 2026-10-06

- ตั้งภาษา UI เป็น English เท่านั้น ลบตัวเลือกภาษาออก และย้ายหน้าตั้งค่าที่เคยบันทึก Italian กลับเป็น English อัตโนมัติ
- ลบชุดคำแปล Italian ที่ไม่ใช้แล้ว และปรับข้อความ Stock กับค่าเริ่มต้นของเทมเพลตใหม่ให้เป็น English

## v0.005 — 2026-10-06

- แก้สาเหตุที่ค่าชดเชยเดิมไม่ทำให้ตำแหน่งพิมพ์ขยับ: ตัวสร้าง ZPL คำนวณค่า `^LT` ไว้แต่ไม่ได้แทรกลงในชุดคำสั่งจริง ตอนนี้ส่ง `^LT14` สำหรับเครื่อง 600 dpi หลังตั้ง media mode แล้ว ทำให้ชดเชยลง 1.2 mm มีผลกับงานพิมพ์จริงและ Export print image
- เพิ่ม smoke test ยืนยันว่าชุด ZPL สำหรับเครื่อง 600 dpi มี `^MNY^LT14` เพื่อป้องกัน regression
- ยังควรเทียบป้ายจริงเพื่อยืนยันระยะกับเครื่องและวัสดุที่ใช้อยู่

## v0.004 — 2026-10-06

- เพิ่ม Stock ใน Editor: ชื่อวัสดุฉลาก ประเภท Die-Cut / Continuous / Black Mark และความกว้างกระดาษรองที่ยื่นซ้ายและขวา หน่วย mm พร้อมบันทึกอัตโนมัติแยกเทมเพลต
- เพิ่มภาพตัวอย่างฉลากบนกระดาษรอง และแสดงความกว้างรวมกระดาษรอง ขนาดฉลากใช้ Width/Height เดิม กระดาษรองไม่เพิ่ม margin หรือขยับองค์ประกอบของป้าย
- ประเภท Stock กำหนดโหมดตรวจจับวัสดุของ Zebra ใน ZPL (^MNY / ^MNN / ^MNM) ยังไม่ได้ยืนยันกับวัสดุจริงทุกประเภท

## v0.003 — 2026-10-06

- เพิ่มค่าชดเชยตำแหน่งพิมพ์ลงอีก 20% จากค่าเริ่มต้น +1 mm เป็น +1.2 mm ตามคำขอ เพื่อปรับงานที่ขอบบนล้นและขอบล่างห่าง
- เครื่อง Zebra ZT411 (600 dpi) ที่เลือกอยู่ยังไม่มีค่าชดเชยบันทึก จึงใช้ค่าเริ่มต้นใหม่ทันที ค่าใน Preview ไม่ถูกเลื่อน
- ตรวจ ZPL ว่าส่ง ^LT14 แทน ^LT12 บน 600 dpi (มีการปัดเศษตามขั้นของเครื่องพิมพ์) ยังต้องยืนยันกับป้ายพิมพ์จริง

## v0.002 — 2026-10-06

- แก้ข้อความใต้ Code128, Code39, Code93 และ EAN-13 ในคำสั่งพิมพ์ให้จัดกึ่งกลางภายในความกว้างของบาร์โค้ดแต่ละอันด้วย ^FB แบบ center ให้เครื่องพิมพ์คำนวณความกว้างฟอนต์จริง แทนการประมาณจากจำนวนอักขระที่ทำให้ข้อความเบี้ยวซ้าย
- คงขนาดตัวอักษรและพิกัดแนวตั้งเดิม การแก้มีผลกับการพิมพ์และ Export print image
- เอาเลขเวอร์ชันที่เขียนค้างใน HTML ออก ให้แสดงเลขจากข้อมูลเวอร์ชันของแอป
- ตรวจคำสั่งจัดกึ่งกลางและ smoke tests; ยังไม่ได้ยืนยันบนป้ายพิมพ์จริง

## v0.001 — 2026-10-06

เริ่มใช้เลขเวอร์ชันที่แสดงในโปรแกรมรูปแบบ v0.01 โดยรุ่นถัดไปเป็น v0.002, v0.003 ตามลำดับ รุ่นนี้รวบรวมงานที่แก้ไว้ก่อนเริ่มนับเวอร์ชันใหม่ ไม่ใช่การสร้างประวัติย้อนหลังแยกแต่ละรุ่น

- แสดงเวอร์ชันที่แถบด้านซ้าย ชื่อหน้าต่าง และหน้า Settings
- เพิ่มการชดเชยตำแหน่งพิมพ์แนวตั้ง เริ่มต้น +1 mm และจำค่าแยกเครื่องพิมพ์ เพื่อปรับงานที่เลื่อนขึ้น ขอบบนถูกตัด และขอบล่างเหลือช่องว่าง คำนวณคำสั่งสำหรับ Zebra 600 dpi โดยเฉพาะ ยังต้องยืนยันระยะกับป้ายพิมพ์จริง
- ขยายตัวอักษรใต้บาร์โค้ดในคำสั่งพิมพ์เพื่อลดอาการตัวอักษรถูกบีบ
- คลิกพื้นที่ว่างใน Preview เพื่อยกเลิกการเลือก ลากกรอบเลือกหลาย element และ Ctrl+คลิกเพื่อเพิ่ม/นำออกจากกลุ่ม พร้อมลากย้ายกลุ่มได้
- เอาจุดวงกลมบนกรอบเลือกออก
- แก้ขั้นตอนแพ็กแอปให้รวมไฟล์ runtime ภายใน bwip-js/dist เพื่อแก้ Cannot find module bwip-js-node.js
- ฟีเจอร์ที่มีอยู่ในรุ่นเริ่มต้น: Editor เป็นหน้าทำงานหลัก บันทึกเทมเพลตและค่าที่กรอกอัตโนมัติ ลบเทมเพลตได้ กรองรายชื่อเครื่องพิมพ์ Zebra รองรับคีย์ลัด ส่งออกภาพพิมพ์ และแสดงสถานะระหว่างส่งงานพิมพ์

เลข v1.x ด้านล่างเป็นประวัติเดิมของโครงการก่อนเริ่มใช้เลขเวอร์ชันใหม่

Tutte le modifiche rilevanti a LabelForge. / All notable changes to LabelForge.

## v1.18.0
Estende l'allineamento introdotto da @PaloTrucoo in v1.17.0. / Builds on @PaloTrucoo's alignment from v1.17.0.
- 🔤 **Allineamento del testo** (sinistra/centro/destra). In ZPL usa il blocco nativo `^FB` (esatto);
  in TSPL/EPL/EZPL/CPCL la posizione è stimata. / Text alignment (native `^FB` in ZPL).
- 🎯 **Centra sull'etichetta**: con `align` centro/destra e senza `box_width_mm`, la box è l'intera
  etichetta e `x_mm` fa da margine. Ideale per codici a lunghezza variabile. / Center on label automatically.
- 🖱️ **Editor**: pulsanti rapidi ⇤ ↔ ⇥ sull'elemento, guida visiva tratteggiata della box con asse di
  centratura, e riquadri di selezione/trascinamento allineati alla posizione reale (larghezza barcode
  reale invece della stima). / Quick align buttons, visual box guide, accurate hitboxes.
- 🖨️ CPCL: allineamento anche per i barcode (non coperto in v1.17.0). / Barcode alignment in CPCL too.
- 🐛 Il ridimensionamento con la maniglia ora regola l'altezza barre anche per Code39/Code93/EAN‑13.
- 🧪 6 nuovi smoke test sull'allineamento (14 totali); output dei template esistenti invariato.
- 📖 Documentate le proprietà `align` / `box_width_mm` nel README (EN/IT).

## v1.17.0
- 🎯 **Allineamento barcode** (grazie @PaloTrucoo — Juan Manuel): nuove proprietà `align`
  (sinistra/centro/destra) e `box_width_mm` per gli elementi barcode (Code128, Code39, Code93,
  EAN‑13). Il codice viene centrato o allineato a destra dentro una larghezza di riferimento.
  Applicato in modo coerente sia all'anteprima sia a tutti i backend (ZPL/TSPL/EPL/EZPL), così
  stampa e anteprima restano identiche. Retrocompatibile: default "sinistra" = nessun cambiamento. /
  Barcode alignment (left/center/right within a reference box width), consistent across preview and
  all backends. Thanks @PaloTrucoo.

## v1.16.1
- 🐛 Fix (issue #1, grazie @gyfooya): in modalità Editor, selezionando un altro modello ora si
  ricarica l'editor con quel modello (prima si aggiornava solo l'anteprima e serviva riclickare
  "Editor"). / Selecting a template while in Editor mode now reloads the editor with it.

## v1.16.0
- 🔌 **Integrazione**: print server HTTP (`POST /print`, `GET /templates`, `GET /health`, token opzionale, CORS)
  e **watch-folder** (deposita un file JSON → stampa). Avviabili da CLI (`serve`/`watch`) o dal pannello
  Impostazioni dell'app (toggle "Print server"). / HTTP print server + watch-folder integration.
- 📖 Documentazione tecnica d'integrazione: `docs/INTEGRATION.md` (API, esempi, schema del job).

## v1.14.0
- 🌍 **Interfaccia bilingue** English (predefinito) + Italiano, con selettore lingua nelle Impostazioni. / Bilingual UI (English default + Italian), switchable in Settings.
- 🎨 Icona dell'app dedicata (exe, installer, finestra). / Dedicated app icon.
- 🧪 Smoke test + workflow CI di test; metadati `package.json` completi; `SECURITY.md` e `CODE_OF_CONDUCT.md`.
- 📝 Correzioni documentazione (EZPL, versioni). / Docs fixes.

## v1.12.0
- 🩺 **Diagnostica stampante**: verifica raggiungibilità di rete, stato reale della stampante
  (errori tipo carta finita / testina aperta / pausa via `~HQES`), stato e coda della stampante
  Windows, con suggerimenti mirati (es. IP cambiato).
- 🧭 Mappatura colonne CSV → campi del modello (import robusto con qualsiasi intestazione).
- ⬇ Generazione di un CSV di esempio con le colonne giuste per il modello selezionato.
- 🎛️ Pannello **Impostazioni** unificato: connessione, stampante, tema, copie predefinite,
  intensità/velocità di stampa, griglia editor, linguaggio predefinito, ripristino, apri cartella.
- 🧰 Barra editor ridisegnata (gruppi, titolo del modello, azioni rapide).
- 🛡️ I codici a barre/QR con dato vuoto non vengono più inviati (evita blocchi della stampante).

## Funzionalità principali (storico)
- 🖨️ Stampa via rete (porta 9100), stampante Windows per nome, o USB (Linux/Mac).
- 🌐 Linguaggi: **ZPL** (testato) + **TSPL/EPL/CPCL/EZPL** (sperimentali).
- 🔠 Codici: testo, Code128, Code39, Code93, EAN‑13, QR Code, DataMatrix; linee e riquadri.
- 🎨 Editor visuale con anteprima live (barcode e QR reali), trascinamento, ridimensionamento, snap.
- 🧩 Campi dinamici `{{campo}}`: testo, menu a tendina, liste con quantità (una etichetta per voce).
- ⚡ Stampa automatica dopo scansione; import CSV per stampe in blocco.
- 🕘 Storico con ristampa, ricerca modelli, tema chiaro/scuro, scorciatoie, undo/redo.
- 📦 Pacchettizzazione `.exe` e build automatica Windows/Linux/macOS via GitHub Actions.

Nota: solo ZPL è testato su hardware reale; gli altri linguaggi sono sperimentali.











## v0.738 — 2026-10-12

- เพิ่มรูปแบบปุ่มกลางทั้งระบบสำหรับไดอะล็อกและเมนูคำสั่ง: ปุ่มโค้งมน สีตามธีม เขียวเมื่อชี้/โฟกัส พร้อม SVG ตามหน้าที่
- ปรับปุ่ม Close, Help และปุ่มท้ายไดอะล็อกให้ใช้รูปแบบเดียวกัน โดยรักษาคำสั่งเดิม











## v0.784 — 2026-10-12

- เพิ่มแท็บ Picture ใน Ribbon เมื่อเลือกภาพ พร้อมคำสั่งแทนที่ภาพ ลบพื้นหลัง ปรับพื้นโปร่งใส หมุน กลับภาพ เปิดคุณสมบัติ ลบ และจัดแนว/ลำดับภาพ
- เชื่อมการกลับภาพแนวนอนและแนวตั้งให้แสดงผลทั้งใน Canvas และภาพที่ส่งออก
- ตรวจ syntax ผ่าน; กำลังตรวจการโต้ตอบในแอปก่อนส่งมอบ

## v0.785 — 2026-10-12

- ย้ายกลุ่ม Clipboard (Cut, Copy, Duplicate, Delete) ไปต่อท้ายแถบจัดรูปแบบข้อความและวัตถุใน Home ตามตำแหน่งไอคอนยางลบในภาพอ้างอิง
- ทดสอบลำดับกลุ่ม Ribbon ใน Electron จริง



## v0.856 — 2026-10-14

- แก้ปุ่ม Undo/Redo บน quick access ไม่ให้ค้างกรอบ active สีเขียวหลังคลิกด้วยเมาส์ โดยเอา focus ออกทันทีหลัง action
- คง focus indicator เมื่อใช้คีย์บอร์ด และเพิ่ม DOM unit regression ตรวจทั้งการคลิกเมาส์และคีย์บอร์ด
- อ่านและอัปเดต `UNIT_TEST_BASIC.md` ใน inventory และ checklist; ผล basic/runtime จะบันทึกหลังรันตรวจครบ
