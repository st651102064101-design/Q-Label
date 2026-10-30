# Page Setup / Layout — อ้างอิง BarTender

วันที่ 2026-10-15, Q LABEL v0.909

ตรวจไฟล์ที่ติดตั้งใน `D:/Programs/` โดยอ่าน UTF-16 resources/strings จาก `BtEnu.dll` และ `BarTend.exe` โดยไม่ได้เปิดโปรแกรม BarTender และไม่ได้แก้ไฟล์เหล่านั้น

## หลักฐานที่อ่านได้

Resource ของ Layout ใน BtEnu.dll เรียงกลุ่มดังนี้:

1. `Layout`, `Ro&ws:`, `&Columns:` และ native `msctls_updown32`
2. `Margins`, `&Top:`, `&Bottom:`, `&Left:`, `&Right:`
3. `Template Size`, `Wi&dth:`, `&Height:`, `&Set Manually`
4. `Gap / Pitch`, `H&orizontal:`, `&Vertical:`, `Set &Manually`
5. `Page size:`, `Template size:` และหมายเหตุเกี่ยวกับ design ใน margin area

BarTend.exe มีชื่อ `LayoutPage`, `PageLayoutRows`, `PageLayoutColumns`, `VerticalGap`, `HorizontalGap` และ schema สำหรับ `Manual label size`, `Manual label gap`, `Label Gap Horiz`, `Label Gap Vert`.

พบข้อความ validation ใน BtEnu.dll ว่า template width/height คูณจำนวน columns/rows รวม margins และ gaps ต้องไม่เกิน paper width/height

ไฟล์เหล่านี้เป็น compiled binary ไม่มี source ของ LayoutPage ให้คัดลอกโดยตรง Resource บอกโครงสร้าง controls และข้อความได้ แต่ไม่พิสูจน์ event handlers หรือ behavior ทุกกรณีของ BarTender จึงไม่ได้อ้างว่าการทำงานทั้งหมดเหมือนกัน 100%

## การแก้ Q LABEL

- ใช้ PaperPreview ตัวเดียวกับแท็บอื่น ยกเลิก renderer ของ Layout ที่แยกออกไปและซ่อน preview กลาง
- Preview อ่าน model ที่ commit แล้ว; ค่าที่ validation ปฏิเสธไม่เข้าไปสร้าง geometry ผิดรูป
- ขนาด template อัตโนมัติ: `(paper − leading margin − trailing margin − (count − 1) × gap) / count`
- ขนาด template แบบ manual: preview ใช้ width/height ที่ผู้ใช้กรอกจริง
- Gap อัตโนมัติเมื่อ template เป็น manual: `(paper − margins − count × template) / (count − 1)` โดยไม่ต่ำกว่า 0
- เลือกมากกว่า 1 row/column เปิด separate paper layout เพื่อให้ preview และ print model ตรงกัน
- ช่อง gap แสดงเสมอ; แกนที่มี count = 1 หรือ gap แบบ auto ใช้ disabled; คงค่าของแกนไว้เมื่อเปลี่ยน count กลับ
- เรียง Template Size ก่อน Gap / Pitch ตาม resource
- Focus ที่ width/height/gap แสดงเส้นบอกระยะใน preview กลาง

## การตรวจ

DOM unit cases อยู่ใน `test/page-setup.test.js`; Chromium/Electron checks อยู่ใน `test/page-setup-runtime.js` ใช้ appData ชั่วคราวและไม่มีงานพิมพ์จริง หน้าต่างทดสอบซ่อนอยู่ จึงส่ง focusin event เองหลังตั้ง activeElement โดยไม่แย่ง focus ของผู้ใช้

ยังไม่ได้ตรวจ native BarTender side by side, ทดสอบเครื่องพิมพ์จริง หรือยืนยันว่า binary มี behavior ครบตามที่ตีความจาก strings
