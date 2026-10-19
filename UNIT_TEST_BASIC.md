# UNIT TEST BASIC — Q LABEL ทั้งระบบ

สร้างตามคำขอผู้ใช้วันที่ 2026-10-14 ใช้กับการแก้ไขทุกครั้งถัดไป

## ข้อบังคับก่อนและหลังแก้ไข

1. อ่านเอกสารนี้และ `AGENTS.md` **ก่อนแก้ทุกครั้ง** ตรวจทั้ง inventory และ checklist ทั้งระบบด้านล่าง
2. หลังแก้ให้รัน **unit test basic ทุกส่วนทั้งหมด** ด้วย `npm run test:basic` ห้ามเลือกเฉพาะส่วนที่แก้
3. ทุกพฤติกรรมใหม่หรือพฤติกรรมที่เปลี่ยนต้องเพิ่ม/ปรับ executable unit test และเพิ่มเคสในเอกสารนี้ในงานเดียวกัน ไฟล์ test ใหม่ต้องเพิ่มใน inventory ด้วย
4. ตรวจเอกสารนี้ทุกครั้ง ถ้าเคสเดิมเพียงพอให้ระบุในผลส่งมอบว่าใช้เคสใด หากมีส่วนใหม่ต้องเพิ่มแถว checklist และ inventory
5. เมื่อ test ไม่ผ่าน ให้หาสาเหตุ แก้ และรัน basic suite **ทั้งหมดอีกครั้ง** ห้ามลบ test, ใส่ skip, ลด assertion หรือเปลี่ยน expected เพื่อซ่อนปัญหา
6. test ต้องตรวจพฤติกรรมและผลลัพธ์จริง ใช้ assertion ไม่ถือว่าตรวจ syntax, อ่าน source ด้วย regex หรือกดปุ่มโดยไม่มี assertion แทน unit test พฤติกรรมครบแล้ว
7. ใช้ temporary directory, fixture, fake clock และ mock IPC/เครื่องพิมพ์ ไม่แก้หรือทิ้งงานจริงของผู้ใช้ ห้ามส่งพิมพ์จริงเพื่อรัน basic tests; TCP transport ใช้ loopback เท่านั้น
8. ใช้ Node สำหรับ unit tests; DOM ใช้ JSDOM/mock เท่าที่จำเป็น ระบุชัดว่า test ไหนต้องมี ACE/Windows หรือเป็น integration
9. ส่งรายงาน pass/fail/skip ตามจริง ห้ามเขียนว่า “ผ่านทั้งหมด” ถ้ายังมี failed, skipped, test ไม่ได้รัน หรือ coverage ที่ยังขาด
10. คงโปรแกรมของผู้ใช้ไว้ เปิดใช้งานการแก้ renderer ด้วยการรีหน้าเดิม การรัน test process แยกต้องใช้ข้อมูลทดสอบแยกจากโปรแกรมจริง

## คำสั่งบังคับ

รันจากโฟลเดอร์ `labelforge`:

```powershell
npm run test:basic
```

คำสั่งนี้ค้นหา `test/*.test.js` ทุกไฟล์อัตโนมัติ รันทั้งหมด และรันสคริปต์พื้นฐาน 3 รายการด้านล่างต่อ แม้ขั้นตอนก่อนหน้าจะ fail เพื่อให้ได้รายงานครบทุกขั้นตอน จากนั้นคืน exit code ไม่เป็นศูนย์เมื่อมีขั้นตอน fail หรือ inventory ไม่ครบ

รายงานล่าสุดอยู่ที่ `test/basic-unit-result.json` และรายละเอียด assertion อยู่ใน `test/basic-unit-output.log` ไฟล์รายงานที่เก่าไม่ใช่ผลของการแก้ไขครั้งล่าสุด

สำหรับการตรวจเพิ่มเติม:

```powershell
git diff --check
npm run test:gestures
```

`git diff --check` เป็นการตรวจไฟล์ ส่วน `test:gestures` มีทั้ง unit และ Electron runtime benchmark จึงไม่ใช้แทน `test:basic`

## Inventory: executable tests ที่ต้องรันทุกครั้ง

รายการนี้เป็นรายการไฟล์จริง ไม่ใช่หลักฐานว่า coverage ทุกเคสใน checklist ครบแล้ว เมื่อเพิ่มไฟล์ใหม่ต้องเพิ่มแถวที่นี่ คำสั่ง `test:basic` ตรวจจับไฟล์ unit ที่ยังไม่ได้ลงรายการ

| ไฟล์ | จุดตรวจหลัก / ประเภท |
|---|---|
| `test/basic-test-policy.test.js` | การค้นหาไฟล์ unit ทั้งหมดและการตรวจ inventory / unit |
| `test/source-model.test.js` | ordered refs, migration แบบไม่แก้ต้นฉบับ, stable IDs หลายหน้า/ด้าน, round trip, clone/link และแก้ข้อความโดยตรง / unit |
| `test/source-resolver.test.js` | typed per-object graph, concatenation, cycles, context sources, diagnostics และข้อมูลภายนอกที่ยังไม่พร้อม / unit |
| `test/source-session.test.js` | draft/commit/cancel, shared named definitions และทิ้ง async response ที่ล้าสมัย / unit |
| `test/source-types.test.js` | Unicode/control bytes, numeric formats, locale, dates/timezones และ binary validation / unit |
| `test/source-transforms.test.js` | character-template ตามตัวอย่างคู่มือ, HRI แยก encoded data, replace/filter/range/length/truncation/prefix/suffix / unit |
| `test/source-counter.test.js` | เลขจำนวนเต็มขนาดใหญ่และศูนย์นำหน้า, automatic/alphabetic/alphanumeric/hex/custom sequence และการข้ามตัวอักษรสับสน / unit |
| `test/source-matrix.test.js` | QR/Data Matrix matrix จาก byte จริง, ไม่แปลง byte เป็น UTF-8 และ reject byte ผิดช่วง / encoder integration |
| `test/access-database.test.js` | อ่าน Access, ไฟล์ผิดชนิด/ไม่มีไฟล์ / unit และ Windows ACE integration |
| `test/auto-save-policy.test.js` | debounce, ปิด Auto Save แล้วไม่มีการบันทึกเบื้องหลัง, ตั้งค่า checkbox ที่ System Settings, บันทึก preference และจัดการ persistence error / unit และ DOM unit |
| `test/barcode-catalog.test.js` | ประเภท barcode, encode, หมวด, custom SVG, readable text, Symbol picker Insert button มี SVG ที่มองเห็นตัดกับพื้นสีเขียว / unit |
| `test/context-home-tools.test.js` | คำสั่ง Home ใน object context menu, ซ่อน Print ที่ไม่ต้องการใน dropdown โดยคงคำสั่งอื่น, forwarding event, enabled/disabled / DOM unit |
| `test/data-sources-ui.test.js` | dialog และ context menu ของ data source / unit |
| `test/database-manager.test.js` | SQLite, field type, filter/sort, alias, prompt, query validation / unit |
| `test/database-origin-marker.test.js` | field token และ source marker / unit |
| `test/database-setup.test.js` | import, ชื่อ field, setup และการ bind; Next/Back มี SVG ลูกศรขวา/ซ้ายและคงไอคอนหลังเปลี่ยนขั้นตอน / unit + DOM |
| `test/design-grid.test.js` | ระยะ grid, สัดส่วน, visible/snap, snap delta/pointer coordinates with page-origin phase and pass-through when disabled; grid clip ตามขอบ rounded/ellipse paper รวมตำแหน่งและรัศมีมุมจาก renderer / unit + DOM |
| `test/preview-snap.test.js` | Preview Settings แสดงตำแหน่งพิกัดที่ snap ตามระยะ grid และกลับเป็นพิกัดเดิมเมื่อปิด Snap; โหลด module ใน browser |
| `test/preview-navigation.test.js` | middle-button pan state ปิดกั้น wheel pan/zoom ตลอดช่วงกดค้าง, ปล่อย pointer ที่ไม่ตรงกันไม่ยกเลิก gesture และ wheel กลับทำงานหลัง pointer จบ / unit + browser module |
| `test/bitmap-recovery.test.js` | Bitmap validator ใช้กฎเดียวกับ decoder; editor preview ใช้ placeholder แทน image/background ที่ bitmap เสียโดยคงไฟล์งานเดิมและ artwork อื่น; Print History thumbnail ที่ image ไม่มี bitmap ไม่ขัดขวาง startup; ส่วน non-editor render ยังคงปฏิเสธ bitmap เสีย / unit + DOM; Electron full startup และ recovery button ตรวจใน `test/startup-bitmap-runtime.js` |
| `test/project-home.test.js` | ปุ่ม Create a New Label เปิด wizard และ wizard อยู่เหนือ Project Home; title bar สีเขียวและกรอบเขียวเข้ม; ปุ่ม footer แบ่งความกว้างตามแถว, wrap ก่อนข้อความล้น, ไอคอนขนาดกะทัดรัด 16px และ label อยู่แนวนอนในปุ่ม โดย SVG preview ยังเต็ม panel; การ์ดโปรเจกต์หลายหน้าเปลี่ยน preview ทุก 3 วินาที, การ์ดหน้าเดียวคงภาพเดิม, wrap กลับหน้าแรก, คลิกเปิดไฟล์ตามปกติและล้าง timer เมื่อ Home ซ่อน / DOM unit; Electron ตรวจที่ 440px ใน `test/runtime-ui.js` |
| `test/edit-history.test.js` | clone undo แชร์ bitmap_hex, gesture clone แชร์ database rows/elements ที่ไม่แก้, fingerprint แทน JSON.stringify, revive/serialize / unit |
| `test/editor-selection-render.test.js` | สลับเลือก/ยกเลิกเลือก Text ซ้ำใช้ selection overlay เดิมโดยไม่วาด canvas เต็ม, fallback เมื่อ overlay ใช้ไม่ได้ และ full render เมื่อ multi-select ต้องสร้างกรอบรวม / unit |
| `test/formatting-hotkeys.test.js` | Ctrl+B/I/U ขณะเลือกหลายตารางพร้อมกันใช้กับทุก cell, toggle ปิดเมื่อทั้งหมดเปิด และไม่เปลี่ยน cell ข้างเคียงเมื่อเลือก cell เดียว / DOM unit |
| `test/formatting-capabilities.test.js` | ความสามารถตามชนิด object, formatting toolbar แสดงโดยคำสั่งที่ไม่รองรับเป็น disabled เมื่อไม่เลือก object, ปุ่มเพิ่ม/ลดความหนาเส้นทีละ 1 จุดพิมพ์โดยไม่ snap ไป minimum ทุกหน่วย, label `Line` เว้นระยะจาก Line style ทั้งใน Ribbon และ context menu และไม่ชนช่องตัวเลข, Solid/Dot/Dash/Erase เหมือนกันใน Ribbon/context menu, Erase ซ่อนเฉพาะเส้นคง fill ใน SVG/raster/ZPL, style อยู่ใน undo/redo และ export, และลากเลือกสีเส้น coalesce SVG preview ต่อเฟรมโดยไม่ full redraw/persist / DOM unit |
| `test/frame-input.test.js` | pointer burst, coalesced input, flush/cancel, รอบเฟรม 60–380 Hz / unit |
| `test/gesture-geometry.test.js` | resize matrix, rotation, pivot และตำแหน่งขอบ; HRI drag จัดชิดซ้าย/กลาง/ขวาโดยคง vertical offset และ clamp / unit |
| `test/gesture-measure.test.js` | ป้ายค่าระหว่างลากอัปเดตตัวเลขแต่ยึดตำแหน่งที่เริ่มลาก และ reset จุดยึดเมื่อจบ gesture / DOM unit |
| `test/history-button-state.test.js` | Undo/Redo ใน Ribbon และ quick access disabled เมื่อ stack ว่าง, เปิดกลับแยกกันตาม stack, Ribbon เป็นสีเทาและไม่มี active styling, quick access คลิกเมาส์แล้ว blur แต่คง keyboard focus / DOM unit |
| `test/image-export.test.js` | รูปแบบ, ขนาด, DPI และ viewport export / unit |
| `test/inverse-rendering.test.js` | วัตถุ Inverse กลับ RGB ของ artwork ที่วางทีหลังเฉพาะบริเวณซ้อนทับ โดยคง artwork ก่อนหน้า/นอกพื้นที่และพื้นดำไว้ / DOM unit; ตรวจพิกเซล Electron เพิ่มด้วย `test/inverse-rendering-runtime.js` |
| `test/layer-order.test.js` | Bring to front/forward และ Send backward/to back, multi-selection, ขอบเขต, no-op และย้าย layer ด้วย drag / unit |
| `test/layer-menu-hover.test.js` | เมนู Layer จาก object context menu เปิดด้วย hover โดยไม่ต้องคลิก, click ไม่เปิด/ไม่ปิดเมนูที่ hover เปิดแล้ว / DOM unit |
| `test/line-controls.test.js` | ปุ่มและการควบคุมเส้น, ลากย้ายเส้นทแยงหลังวางโดยรักษามุมและ endpoints ก่อน/หลัง commit, floating toolbar ไม่มีปุ่ม More สำหรับเส้น/รูป/ข้อความ, ปุ่มหมุน/ย้ายแสดงกรอบเขียวเมื่อ mouse/pen hover และคืนสถานะเมื่อ pointer leave โดยไม่ตอบสนอง touch hover / unit |
| `test/line-geometry.test.js` | endpoint, quadrants, ย้าย/หมุน, snap และ preview SVG เส้นทแยงตรงกับ endpoint / unit |
| `test/modal-windows.test.js` | Settings title stays outside its separate content scroll area; modal resize อิสระแยกแกน/ขนาดขั้นต่ำตามเนื้อหา และ modal ที่เปิดใหม่อยู่เหนือ navbar กับ modal ก่อนหน้า / DOM unit |
| `test/object-distance-guides.test.js` | ขอบ object, ระยะใกล้สุด, หมุน และ guide / unit |
| `test/object-selection-name.test.js` | ชื่อ object เหนือมุมซ้ายบนและชิดกรอบเลือก, ชื่อกำหนดเอง/ชื่อว่าง, escape markup, ชื่อยาว, zoom และ rotation / DOM unit |
| `test/page-gap.test.js` | gap overlay ซ่อนตั้งต้น, วาดแถบตามระยะ/rows/columns ที่ตั้งใน Page Setup โดยไม่รับ pointer, toggle สลับ Show/Hide พร้อม ARIA/disabled เมื่อไม่มี gap และไม่แก้ข้อมูล layout / DOM unit; Electron ตรวจ canvas, selection, model invariance และลูกศร Page Setup |
| `test/page-setup.test.js` | Page Setup tab order, Stock encoder tabs visible/disabled with explanations, paper/units/margins/layout/apply and dialog rollback, inch width/height accepts four displayed decimals, inch width/height step follows displayed precision and accepts four decimals such as 2.0079/0.9843; inch corner radius accepts and stores four decimal places; every Page Setup tab hides object artwork, editor preview retains artwork, Layout divides blank paper into selected rows/columns in manual mode, always draws physical gap arrows between label cells on both axes, unusable saved gap does not block column selection and restores editable gap field, OK recovers an unusable gap draft and saves selected columns with the last usable gap, automatic template recovers saved manual_gap=false and keeps applicable gap editable, manual gap toggle precedes inputs, Page Setup closes before confirmation and Scale Templates; scaling OK leaves both dialogs closed; Cancel/Escape restores Page Setup draft, app-styled accessible confirmation with current/new sizes, explicit Scale/Keep choices, Escape restores draft without saving, complete scaling option lists, editor paper bounds/canvas stay at opening size through Page Setup and Scale Templates draft/Cancel, then shrink to one template only after acceptance, significant-size threshold prompt, Yes/No paths, modal current/new sizes and percentages/default rules, modal Cancel/Escape retains Page Setup draft, OK scales artwork with one undo snapshot and one persistence, validation error rollback / DOM + unit |
| `test/page-setup-capabilities.test.js` | Media modes resolve supported/unsupported/unknown from selected printer profile evidence / unit |
| `test/photo-registration.test.js` | registration รูป, อัตราส่วนและพิกัด / unit |
| `test/print-regressions.test.js` | print routing, validation, duplicate submit, graphic/page origin, measured-media fitting preserves multi-column page geometry and repeats artwork into every column, Print dialog uses semantic printer/preview/cancel SVGs and one Cancel action, titlebar X closes even after preference persistence failure, Cancel closes without saving, closed Print has display:none at startup/after Cancel/X, held Ctrl+P does not reopen after Cancel and Electron shortcut rejects auto-repeat, footer stays at the dialog bottom while settings content scrolls / unit + DOM |
| `test/printer-media-profile.test.js` | media profile และค่ากระดาษ, แยก print-mode choices จาก `media.printmode` ใน `allcv` มาเป็น capability ของ profile / unit และ loopback integration |
| `test/stock-catalog.test.js` | รายชื่อผู้ผลิตและ stock จาก `mfg.stk`, การแปลง mil เป็น mm และค่าขนาด/ขอบ/gap แบบสี่ตำแหน่ง / unit |
| `test/startup-error-ui.test.js` | startup failure แสดง exception เหนือ Ribbon แบบไม่ถูก clip, อ่านได้ด้วย screen reader, โฟกัสปุ่ม Reload พร้อม SVG reload สีขาวขนาด 16px และแทนที่ error เก่า / DOM unit |
| 	est/startup-error-ui.test.js | startup failure แสดง exception เหนือ Ribbon แบบไม่ถูก clip, อ่านได้ด้วย screen reader, โฟกัสปุ่ม Reload และแทนที่ error เก่า / DOM unit |
| `test/printer-resolution.test.js` | Select printer… placeholder disabled in main/wizard and selected real printer preserved; bridge ส่งชื่อเครื่องพิมพ์ผ่าน IPC และ stale main process ใช้ nominal DPI ที่ระบุในชื่อ printer queue พร้อม notice ให้ restart โดยไม่แสดง error; ชื่อที่ไม่มี DPI ไม่สร้างค่าขึ้นเอง; ตรวจ DPI แนวนอน/แนวตั้งจาก Windows printer driver, ปฏิเสธค่าที่หาย/ไม่ตรง/ผิดช่วง, wizard ไม่แสดงแถว Resolution, บล็อกเมื่อไม่มี DPI, ป้องกัน response เก่าทับเครื่องพิมพ์ใหม่ และบันทึก DPI ใน template; wizard เลือก predefined stock ADES AG 49908 และบันทึกขนาดละเอียดสี่ตำแหน่ง / unit และ DOM unit |
| `test/recent-thumbnails.test.js` | recent thumbnail และสัดส่วนภาพ, รวม table identity ให้เหลือรายการเดียวแม้จำนวน/ขนาด rows และ columns ต่างกัน, ล้าง duplicate เก่าจาก settings และเก็บ table ล่าสุด / unit และ DOM unit |
| `test/ribbon-help-icons.test.js` | ปุ่ม Keyboard shortcuts ใช้ SVG รูปแป้นพิมพ์และ About Q LABEL ใช้ SVG info-circle แทนไอคอนเอกสารทั่วไป / DOM unit |
| `test/ribbon-availability.test.js` | ปุ่ม/ช่อง/กลุ่มและ text formatting ที่ disabled ยังคงมองเห็น, แท็บ Picture ยังอยู่ใน ribbon, รายการ New ใน File menu ไม่มี outline/border แม้กฎ focus กลางโหลดทีหลัง, ชื่อโปรเจกต์ใช้พื้นที่ก่อน Search และคำนวณใหม่เมื่อ resize; Snap to grid แสดง border เฉพาะ hover ไม่ค้างเมื่อ active/click; แท็บ Home, Insert, Layout, Picture, Data, View, Tools, Help เปิดเมื่อ mouse/pen hover, ไม่สลับเมื่อ touch ส่ง hover compatibility event, ยังคง click และ native button keyboard activation / DOM unit |
| `test/ribbon-action-icons.test.js` | SVG up/down ที่แตกต่างกันสำหรับการเพิ่ม/ลดขนาดฟอนต์, SVG เครื่องพิมพ์พร้อม viewBox และ aria-hidden / DOM unit |
| `test/ribbon-file-hover.test.js` | เมนู File เปิดเมื่อ pointer เมาส์/ปากกา hover, ไม่เปิดจาก touch hover ที่สังเคราะห์ และยกเลิก close timer ที่ค้าง / DOM unit |
| `test/sidebar-glass.test.js` | หัวข้อ Recently Used Objects และ Data Sources ใช้พื้นขาวโปร่งแบบ glass/backdrop blur, ตัวเลื่อน zoom ไม่มีกรอบ focus สีเขียวค้าง / DOM unit |
| `test/ruler-labels.test.js` | ตัวเลข ruler ทั้งสองแนวเป็นสีเขียว 15px บนแถบ 19.5px; เลขนอกกระดาษยังแสดงบนพื้นโปร่งใส โดยลบ tick มืดที่อยู่ใต้ตัวเลขและไม่ลบพื้นส่วนที่ทับช่วงกระดาษ; พื้นช่วงวัดกระดาษไม่ clearRect จนเกิดช่องสีเข้ม, พื้นนอกขอบกระดาษโปร่งใส, clip กับ viewport, แถบแนวตั้งยาวถึงปลายกระดาษที่มองเห็นแม้เลย frame และแสดงเลข 0 เมื่อ origin อยู่ในพื้นที่ที่มองเห็น, จุด 0 แกนตั้งตรงกับขอบกระดาษเมื่อ frame มี border และ scroll, ค่าติดลบที่ปัดเป็นศูนย์ไม่แสดง `-0.00` และตัวชี้/ป้ายพิกัด snap เข้าจุด 0 เมื่อค่าที่แสดงเป็นศูนย์ / canvas unit |
| `test/save-as-end-to-end.test.js` | Save As, cancel/error, serialization, IPC, ไฟล์ temporary และโหลดประวัติแก้ไขกลับ / integration ผ่าน mock |
| `test/svg-properties.test.js` | SVG properties และการคงข้อมูล / DOM unit |
| `test/svg-selection-handles.test.js` | ทุก object ที่ใช้กรอบ resize ร่วมกัน (text, shapes, raster/SVG, barcode, QR และ table) แสดง marker และ hit target มุมทั้งสี่; ระหว่าง resize จุดมุม, hit target, toolbar และเครื่องมือคงขนาดหน้าจอพร้อมยึดตำแหน่งกับ object; เส้นขอบ artwork ไม่พองจนปิดพื้นที่ canvas เมื่อซูมสูง โดยคง stroke width เดิมที่ไม่คูณ canvas scale ระหว่าง preview และคืน SVG attributes หลังจบ; selected barcode แสดงจุดลาก HRI และ hit target มีรัศมีคงที่ 4px ทุก zoom เพื่อไม่ทับ handle ล่าง; HRI drag ปรับ offset และไม่เปลี่ยนความสูงแท่ง, ส่วน handle สีขาวล่าง resize ความสูงแท่งและคง HRI offset โดย HRI คงขนาดทั้งแกน X/Y และตำแหน่งตามปลายแท่งทั้งช่วงลาก/หลังปล่อย (`gui/barcode-hri-resize.js` preserveSize); วาด controls ใหม่ระหว่างลาก HRI แล้วยังคงกรอบเลือกสีเขียว; ไฮไลต์ overflow เปลี่ยน path/สถานะเมื่อหมุนออกนอกกระดาษ และซ่อนอีกครั้งเมื่อกลับเข้ากระดาษ; ป้ายองศาหมุนแสดงเลขเต็มและอัปเดตทุก 1° / DOM unit |
| `test/table-design.test.js` | cell style, whole-table style targets and multi-cell scoped updates, borders, row/column resize, autofit, keep and reindex cell styles/rich-text ranges on row/column move, duplicate and delete / unit |
| `test/table-ribbon-selection.test.js` | mixed selection คงแท็บเดิม/primary object, table-only selection เปิด Table, สลับตารางแล้วยังจำแท็บปกติเดิม, empty/text-only ไม่เปิด Table / DOM unit |
| `test/table-content-fit.test.js` | contentMin ลดตามข้อความปัจจุบัน, จำลอง double-click เปิด cell editor แล้วลบข้อความหลายบรรทัดผ่าน input event ตรวจว่าทั้งแถวและตารางยุบ, พิมพ์หลายตัวแล้ว model เปลี่ยนทันทีโดยไม่ bake/วาด canvas ต่ออักษรและ commit bake/วาดครั้งเดียวตอน blur, กรอบเขียว cell editor มุมเหลี่ยม, ความสูงกรอบ editor ใช้ vertical SVG scale แยกจาก horizontal scale และไม่เกินขอบแถว, กรอบ active cell ขยายตามขนาด row/column ใหม่เมื่อ repaint, คลิกนอกตารางปิด cell editor และล้าง active cell outline โดยคลิก toolbar ยังคง selection, หดแถว Word line ถึงพื้นข้อความ, contentExtent / DOM unit |
| `test/table-corner-controls.test.js` | SVG + ที่มุมขวาบน/ซ้ายล่าง, hover icon คงขนาด 24px และ hit target 32px ทุก zoom, click/keyboard action, เพิ่มแถว/คอลัมน์ว่างโดยคงข้อมูลเดิม, ปฏิเสธตารางผิดรูปและ limit 100 / DOM unit |
| `test/table-context-menu.test.js` | จัดคำสั่งตารางเป็นกลุ่ม Rows/Columns/Cell/Style/Layer/Table, submenu เปิดด้วย hover/focus โดย click ไม่เปิดหรือ toggle ปิด, ส่ง action layer z-order ทั้ง 4 แบบ, ส่ง action เดิม และซ่อนคำสั่งลบแกนที่ไม่เกี่ยว / DOM unit |
| `test/table-divider-gesture.test.js` | ลากเส้นแถว/คอลัมน์แบบ live ไม่ bake/draw ทุกเฟรม, เรียก repaint กรอบ active cell หลัง live geometry update, commit หลัง pointerup ครั้งเดียว / unit |
| `test/stroke-width-control.test.js` | hover เครื่องมือความหนาเส้นแสดงวงขอบเขียวรอบปุ่มรัศมี 17px หนา 2px และเส้นไกด์ตามขอบวัตถุ, ซ่อนเมื่อออกจาก hover, ไม่มีเส้นเฉียงโยงจากขอบไปไอคอน และล้างสถานะเมื่อกลับมาที่ canvas / DOM unit |
| `test/text-measure.test.js` | font cache, invalidate, Thai/emoji grapheme / unit |
| `test/template-pages.test.js` | Selected thumbnail keeps its green border without dark outer shadow rings; filmstrip แสดง SVG thumbnail ของ artwork ทุกหน้า, เลขหน้า, ขนาดการ์ดและปุ่มเพิ่ม, split add control 114×64px (72px + 40px), hover ที่ลูกศรเปิดเมนูทันทีและเมนูอยู่เหนือปุ่ม/จัดขอบขวาตรง พร้อม ARIA expanded, เมนูปิดทันทีเมื่อ pointer จาก dropdown เข้า split control และไม่เปิดซ้ำเมื่อผ่านลูกศรจน pointer ออกจาก control; ปุ่ม + หลักไม่เปิดเมนูและ hover ลูกศรเปิดได้หลัง pointer ออกจาก control, ย้ายจากลูกศรเข้าเมนูแล้วคงเปิด, เพิ่มหน้าเปล่า/ทำสำเนาเมื่อเลือก, พื้น light glass, ellipsis SVG แสดงเมื่อ hover/focusและไอคอนอยู่กึ่งกลางปุ่ม, เปิดเมนูโดยไม่เปลี่ยนหน้า, เมนู … ยึดกับการ์ดหน้า เปิดเหนือปุ่มและจำกัดความสูง/เลื่อนภายในเมื่อพื้นที่เหนือไม่พอ โดยไม่ทับปุ่มหรือสืบทอดข้อจำกัดไปยังเมนูเพิ่มหน้า, ไม่สร้าง native scrollbar ของ thumbnail/bottom preview, ความกว้างตามจำนวนหน้าและเลื่อนด้วยล้อ/drag เมื่อเกินพื้นที่, accessible name, เลือกหน้า, ลาก reorder ซ้าย/ขวาพร้อมคงหน้า active และ content, undo/dirty/persistence ครั้งเดียวต่อ reorder, เมนูแสดงและทำงาน Ctrl+X/Ctrl+C/Ctrl+V/Ctrl+D/Ctrl+Enter/Delete/F2/Alt+Enter เมื่อ focus อยู่ที่แท็บหรือเมนูหน้า; Cut disabled เมื่อเหลือหน้าเดียวและย้ายหน้าลง clipboard เมื่อยังมีหน้าอื่น, F2 แก้ชื่อ และ Alt+Enter เปิด Page Setup > Templatesโดยไม่เรียก object hotkeys, Properties ใช้ SVG sliders ที่แสดงรางและปุ่มปรับ 3 จุดแยกกัน; Rename inline ผ่าน Enter/blur และ Escape cancel / DOM unit |
| `test/template-scaling.test.js` | Do Not Scale preserves geometry, Scale Thickness adjusts line stroke, template size threshold (10% inclusive), proportional/free text with independent horizontal/vertical metrics, text/barcode/picture/line/shape/table/QR geometry formulas, barcode proportional/free choices, picture-backed table row/column sizing, all design sides and template pages, metadata preservation, atomic failure / unit |
| `test/text-range-format.test.js` | รูปแบบข้อความเป็นช่วง UTF-16, bold/italic/underline/strike/font/size/color/background/inverse, toggle/clear เฉพาะ selection, normalize และเลื่อน offset หลังแก้ข้อความ / unit |
| `test/tool-placement.test.js` | วาง object, point/drag, preview/commit เส้นทแยงตรงกับ pointer และชนิด tool / DOM unit |
| `test/transform-history.test.js` | transform history และ reset เดี่ยว/กลุ่ม / unit |
| `test/barcode-hri-drag-runtime.js` | Electron runtime: HRI left/center/right, vertical drag, cursor, live marker, Undo/Redo และ ZPL alignment; isolated appData |
| `test/version-display.test.js` | รองรับ rollover v1.000; แสดงเลขเวอร์ชันเดียวกันใน ribbon, settings, sidebar และ window title; normalize prefix/empty และคงเวอร์ชันตัวเลข 0.990 เป็น v0.990 / DOM unit |
| `test/data-sources.js` | serial/date/time, expression, circular reference, print values / basic assertions |
| `test/print-job.js` | copies, records, offset, cache, export และ TCP loopback / basic integration assertions |
| `test/smoke.js` | core render/encoder และคำสั่งเครื่องพิมพ์ / basic assertions |

## Checklist พื้นฐานที่ต้องครอบคลุมทั้งระบบ

แต่ละแถวต้องมี assertion สำหรับกรณีปกติ กรณีว่าง/ขอบเขต กรณีผิดพลาด และความคงอยู่ของข้อมูลที่เกี่ยวข้อง อย่าตีความชื่อไฟล์ test ว่าครอบคลุมทุกข้อโดยอัตโนมัติ

| ส่วนระบบ | เคส basic บังคับ |
|---|---|
| 01 เริ่มโปรแกรม / หน้าเลือกโปรเจ็กต์ | ไม่มีโปรเจ็กต์, โหลด recent, ไฟล์หาย/JSON เสีย, เลือกโปรเจ็กต์, fallback settings, malformed image/background bitmap แสดง placeholder ใน editor โดยไม่ขัดขวาง workspace และคงข้อมูลต้นฉบับให้แทนที่/ลบได้ แต่ print/export ยังคงปฏิเสธ bitmap ที่เสีย (`test/bitmap-recovery.test.js`), หน้าเลือกโปรเจ็กต์ไม่มีคำเตือน unsaved เมื่อไม่มีการแก้ไข |
| 02 New / Open / Import / Close | สร้าง blank/default label, open/import สำเร็จ, cancel ไม่เปลี่ยนงาน, ไฟล์ผิดชนิด, เปลี่ยน/ปิด label โดยรักษาการตัดสินใจ save/discard/cancel |
| 03 Save / Auto Save / Save As | save/load round trip, System Settings toggle ที่ persist mode และ debounce ด้วย fake timer, Auto Save ปิดโดย default จนผู้ใช้ opt in, ปิด Auto Save แล้ว edit ไม่เขียนไฟล์เบื้องหลัง, เปิด Auto Save ขณะ dirty บันทึกตาม policy, manual Ctrl+S/Save, success/error, บันทึกสำเร็จล้าง dirty, ไม่มีการแก้ไม่ dirty, undo กลับข้อมูลที่บันทึกแล้วไม่ dirty, Save As ไม่ทับต้นฉบับ |
| 04 Unsaved prompt / Exit / Reload | clean ไม่ถาม, manual mode เมื่อเปลี่ยน/สร้าง label ที่มี dirty edits ให้ถาม Save/Don't Save/Cancel, Save สำเร็จก่อนนำทาง, Don't Save ทิ้งเฉพาะเมื่อเลือก, Cancel อยู่หน้าเดิม, autosave off ไม่แอบบันทึก, reload เก็บงานตาม policy, prompt ไม่ซ้อน |
| 05 Templates / Recent / Pages | การ์ดโปรเจกต์ carousel preview ตาม template_pages ทุก 3 วินาทีเมื่อมีหลายหน้า, หน้าเดียวคงเดิม, คลิกเปิดโปรเจกต์ได้และล้าง timer เมื่อซ่อน Home; CRUD, rename/duplicate/pin/remove, template pages เพิ่ม/เลือก/เปลี่ยนชื่อผ่านเมนู Rename ที่เปิด inline input บนหน้าและ Enter ยืนยัน/Escape ยกเลิก/blur ยืนยัน/ชื่อว่างไม่ถูกบันทึก/ลบ/ลาก reorder ซ้าย/ขวาโดยรักษาหน้า active และข้อมูลหน้า, filmstrip มี SVG thumbnail แยกตาม artwork ของแต่ละหน้า, เลขหน้า, selected state, accessible name, ขนาดคงที่, พื้น light glass, ellipsis แสดงเมื่อ hover/focus และเปิดเมนูโดยไม่เปลี่ยนหน้า, เมนู … อยู่เหนือการ์ด/ไม่ทับปุ่มและเลื่อนภายในเมื่อพื้นที่ไม่พอ, ลูกศรข้าง + เปิดเมนูเพิ่มหน้าเปล่าหรือทำสำเนาเมื่อเลือก โดยทั้งสองรายการมี SVG artwork ที่วาดได้ (`test/template-pages.test.js`, Electron `test/template-navbar-size-runtime.js`), ความกว้างพอดีกับจำนวนหน้าและปุ่มเพิ่ม, เลื่อนด้วยล้อ/drag เมื่อเกินพื้นที่โดยไม่แสดง native scrollbar, ซ่อน bottom scrollbar ของ preview ขณะออกแบบ, active index ไม่เกินจำนวนหน้า, ข้อมูลหน้าไม่ปน, thumbnail ไม่บีบ/ตัดภาพ, คีย์ลัดหน้าใน context menu แสดงและทำงาน, Recently Used Objects มี table ได้รายการเดียวแม้จำนวน/ขนาดแถวและคอลัมน์ต่างกัน และ migration ยุบรายการ table ซ้ำเก่าพร้อมบันทึกกลับ settings |
| 06 การเลือก / Layers / Groups / Clipboard | click/select/multi-select/marquee, ป้ายชื่อทุกชนิด object เหนือมุมซ้ายบนเมื่อเลือก รวม multi-select, ชื่อกำหนดเอง/ชื่อว่าง/ชื่อยาว/markup ต้องปลอดภัย, ขนาดตาม zoom และตาม rotation, ไม่ปนใน artwork, select/deselect Text ซ้ำโดยไม่ full redraw เมื่อมี overlay พร้อมและยกเลิกเลือกจากพื้นที่ว่าง, multi-select สร้างกรอบรวมได้, fallback เมื่อ overlay หาย, เมนูย่อย Layer ใน object context menu เปิดด้วย hover และ ArrowRight โดยไม่ต้องคลิก, ออกจาก pointer แล้วปิด; object context dropdown ไม่มีคำสั่ง Print แต่ยังแสดง Home actions ที่ใช้กับวัตถุได้ (`test/context-home-tools.test.js`); group/ungroup, lock/unlock, z-order (front/forward/backward/back, preserve multi-selection order, update selection indices, undo/redo), drag reorder, hidden object, copy/cut/paste/duplicate, ID ใหม่ไม่ชน, cancel ไม่เปลี่ยน model |
| 07 Move / Resize / Rotate / History | พิกัดและขนาดแต่ละ anchor, min/max, aspect ratio, rotated pivot, หลาย object, Shift/Alt, origin return, pointerup flush, cancel, undo/redo/reset, outline style เป็นส่วนหนึ่งของ history fingerprint; ย้อนกลับ/ทำซ้ำได้ (`test/formatting-capabilities.test.js`, `test/edit-history.test.js`), object ที่ไม่ถูกแก้คงข้อมูลเดิม, ปุ่ม Undo/Redo ทั้ง Ribbon และ quick access disabled เมื่อ history ของตนว่างและเปิดใช้งานแยกกันเมื่อมีรายการตรง stack, Snap to grid เปิดแล้วลาก/resize เข้าระยะ Grid Step ที่อิง origin กระดาษ; ปิดแล้วลากอิสระและ resize คง precision เดิมโดยไม่เข้าระยะ Grid Step; จุด grid อยู่เฉพาะในขอบ rounded/ellipse paper, alignment guides ยังคงเมื่อเส้นจัดแนวอยู่บนจุด grid, ลากย้ายเส้นทแยงหลังวางต้องรักษามุมและ endpoints ทั้งระหว่าง preview และหลัง commit, object ที่ใช้กรอบ resize ร่วมกันทุกชนิดแสดงและลาก marker มุม NW/NE/SW/SE ได้ รวม table; ระหว่าง resize จุดมุม, hit target, toolbar และเครื่องมือไม่ถูกยืดและยังยึดกับตำแหน่ง object; ความหนาเส้นขอบ artwork คงเดิมทั้ง preview/commit และไม่คูณด้วย zoom จนบังพื้นที่ canvas (`test/svg-selection-handles.test.js`, Electron `test/svg-selection-bounds-runtime.js`) (`test/svg-selection-handles.test.js`, Electron `test/svg-selection-bounds-runtime.js`); เส้นใช้ endpoint controls ของตน, barcode HRI handle แสดงจุดเหลืองเมื่อเลือกและพื้นที่ลากคงรัศมี 4px ไม่ทับ handle resize ล่างหรือปุ่มหมุน/ย้ายที่ zoom ต่างกัน; ลาก handle สีขาวล่างเพิ่มความสูง barcode โดยคง HRI offset และคงขนาดตัวเลข/ตำแหน่งสัมพันธ์กับปลายแท่งทั้งช่วง preview กับหลัง commit (`gui/barcode-hri-resize.js`, Electron `test/svg-selection-bounds-runtime.js`), ส่วนลากจุดเหลืองเปลี่ยนเฉพาะ HRI offset; วาด controls ใหม่ระหว่างลากจุด HRI แล้วยังกรอบเลือกสีเขียว `.sel` อยู่ครบโดยตำแหน่งกรอบตาม object, ป้ายองศาระหว่างหมุนเป็นเลขเต็มอัปเดตตามมุมจริงทุก 1° โดยคง snap และ snap guide (DOM unit ตรวจ 14°, 15°, 16°; Electron ตรวจป้ายทั้งหมุนอิสระและ snap ขณะลาก), ไฮไลต์แดงตามตำแหน่งและสถานะ overflow ระหว่าง preview การหมุนและซ่อนเมื่อกลับเข้ากระดาษ (unit `test/svg-selection-handles.test.js`, Electron `test/svg-selection-bounds-runtime.js`), ปุ่มปรับมุมโค้งอยู่ห่างจุด NW ของ object อย่างน้อย 4px; ปุ่มหมุน/ย้ายมีกรอบเขียวเมื่อ mouse/pen hover และล้างสถานะเมื่อ pointer leave (`test/line-controls.test.js`, Electron `test/picture-home-runtime.js`), จับ undo ตอนลาก/ย่อ-ขยายไม่ JSON.stringify bitmap/rows บนเฟรม gesture (gesture clone แชร์ database rows และ element ที่ไม่ถูกแก้, เลื่อน record revision ไปหลัง pointerup, เทียบ revision ด้วย fingerprint); ป้ายวัดความหนาเส้น/ขนาดช่องตารางอัปเดตตัวเลขแต่ตรึงตำแหน่งไว้ที่จุดเริ่มลาก แล้วซ่อนเมื่อจบ gesture (`test/gesture-measure.test.js`, Electron `test/picture-home-runtime.js`) |
| 08 Pointer / Refresh-rate / Zoom / Pan | รับตำแหน่งล่าสุดหนึ่งครั้งต่อเฟรม, coalesced event, ลากแท็บ template ซ้าย/ขวาเพื่อ reorder, 60/120/144/240/380 Hz ด้วย fake RAF, ไม่มี fixed FPS cap, zoom anchor, min/max zoom, fit page, wheel burst, pan clamp, middle-button drag ขณะ wheel ไม่เริ่ม pan/zoom ซ้อนและไม่เปลี่ยนขนาด/สัดส่วนกระดาษ preview, ปล่อย/ยกเลิก pointer แล้ว wheel ใช้ได้ตามเดิม และไม่สะสม handler (`test/preview-navigation.test.js`, Electron `test/runtime-ui.js`) |
| 09 Grid / Ruler / Units / Guides | mm/in/dots round trip ตาม DPI, tick spacing ตาม zoom, ตัวเลขไม้บรรทัดเป็นจำนวนเต็ม สีเขียวและแสดงต่อทั้งใน/นอกกระดาษโดยพื้นที่นอกกระดาษยังโปร่งใส, minor ticks ไม่มีเลขทศนิยม, ไม้บรรทัดซ้ายยาวถึงปลายกระดาษหรือ viewport ใต้ navbar แล้วแต่ว่าถึงก่อนและแสดง 0 เมื่อ origin มองเห็น, pointer marker ตรงพิกัด, พิกัดที่ปัดเป็นศูนย์ไม่แสดงเครื่องหมายลบและ marker/ป้ายจัดตรงกับ tick 0, toggle Show/Hide gap ใน View เริ่มซ่อนและแสดงเฉพาะแถบ gap ตาม page layout เมื่อเปิดโดยไม่แก้ค่า template/print; ปุ่ม disabled เมื่อไม่มี gap, gap arrows ใน Page Setup ไม่เปลี่ยน (`test/page-gap.test.js`, Electron `test/page-gap-runtime.js`), snap/guide เดี่ยว/กลุ่ม/หมุน, ไม่เรียก layout เต็มใน hot path |
| 10 Text / Formatting | ไทย/อังกฤษ/emoji/newline/empty, font size/family, bold/italic/underline/strike เปิดและปิดจริง, active state ตาม selection, mixed styles, live text color ไม่ต้องปิด picker, alignment, wrap, line spacing, ไม่มี glyph ขาด; ช่วงข้อความที่เลือกใน table cell รับ Ctrl+B/I/U และ toolbar font/size/color/background/inverse/clear โดยอักษรข้างเคียงไม่เปลี่ยน; เมื่อเลือกหลาย table object แล้วกด Ctrl+B/I/U ต้องเปลี่ยนทุก cell ในทุก table ที่เลือก, กดซ้ำปิดรูปแบบครบ และเมื่อเลือก cell เดียวต้องไม่เปลี่ยน cell ข้างเคียง |
| 11 Tables ทั้งหมด | เพิ่ม/ลบ/duplicate row-column, ย้าย row/column แล้ว cellStyles กับ cellTextStyles ต้องเคลื่อนตาม cell; duplicate คัดลอก format และ delete ต้อง reindex format ของ cell ที่เหลือ, เพิ่มคอลัมน์ที่มุมขวาบนและแถวที่มุมซ้ายล่างเมื่อคลิกปุ่ม SVG +, ปุ่ม + ซ่อนจน hover/focus และมุมเหล่านั้นไม่มีจุด resize กลม, hover ปุ่มปรับความหนาแสดงวงขอบเขียวรอบตัวปุ่มและเส้นสีเขียวตามขอบตารางและไม่มีเส้นเฉียงเชื่อมไอคอน, เมนูคลิกขวาจัดกลุ่มคำสั่งแถว/คอลัมน์/เซลล์/รูปแบบ/ตารางและเปิด submenu ด้วย hover/focus พร้อมเรียก action เดิม, fixed/auto/min/max, ตัวเลข/ข้อความยาว/ข้อความไทย, column แคบแล้ว wrap และ row โต, shrink ถึงขนาดที่พอดีโดยไม่ตัด (contentMin คำนวณจากข้อความปัจจุบัน, double-click เปิด cell editor แล้วลบ/ย่อข้อความผ่าน input event ต้องลดความสูงแถวและตาราง, พิมพ์ข้อความต่อเนื่องแล้ว input/model อัปเดตทันทีโดยไม่ bake หรือวาด canvas ทุกตัวอักษร และ bake/วาดครั้งเดียวเมื่อจบการแก้, กรอบ cell editor มุมเหลี่ยมไม่โค้ง, ความสูงกรอบ editor ตาม vertical SVG scale และไม่เกินเส้นขอบแถว, คลิกนอกตารางต้องปิด editor และล้างกรอบ active cell แต่คลิก toolbar คง selection, หดด้วยเส้น Word ได้), กรอบ active cell ต้องตามขนาด row/column ระหว่าง resize สดและหลัง commit, เลือก object ตารางแล้วการจัดฟอนต์/ขนาด/สี/พื้นเซลล์/แนวจัดวาง/ตัวหนา/เอียง/ขีดเส้นใต้/ขีดทับต้องมีผลทุก cell; เมื่อเลือกบาง cell ต้องเปลี่ยนเฉพาะช่องที่เลือก, หน้าดู/หน้าแก้ตัดบรรทัดตรงกัน, selection/hover ตรงขอบจริง, cell format/border/fill, undo/redo, table ไม่ถูก rasterize ทุกเฟรม, ลากเส้นแถว/คอลัมน์ใช้ updateTableSVG สดโดยไม่ bake/drawEditorCanvas ทุก RAF (bake ครั้งเดียวตอนปล่อยเมาส์), ลากสีเส้นรวม input หลายครั้งเป็น SVG preview ต่อเฟรมและไม่มี full render/persist |
| 12 Images / SVG / Shapes / Lines / Symbols | import/replace, invalid bitmap/SVG, transparency/background removal, natural aspect, SVG bounds, แสดงจุดจับลากที่มุมทั้งสี่ของ SVG และคงจุดจับเดิมสำหรับ raster/table, bitmap sizing, shape preset, ellipse/box stroke, line endpoint crossing/rotation/thickness และ SVG body ตรงกับจุดจับเมื่อวาดทแยง, ปุ่มลูกศรปรับความหนาเส้นทีละ 1 จุดพิมพ์ตามหน่วยและไม่กระโดดไป minimum, floating toolbar ของเส้น/รูป/ข้อความไม่มีปุ่ม More และ actions ที่เหลือยังทำงาน, symbol catalog และ persistence |
| 13 Data Sources | constant/embedded/entry/global/object/expression/table/job/date/time/serial, leading zeros, empty/missing, recursive/circular references, overrides, data type และ mapping, เปลี่ยน record ไม่แก้ข้อมูลต้นฉบับ |
| 14 Database ทั้งหมด | CSV/JSON/Excel/XML/SQLite/Access ที่รองรับจริง, header/alias ชนกัน, ไม่มี row, column หาย, Unicode, SQL read-only, parameter missing, joins/filter/sort/limit, reload/reconnect/cancel/failure, record navigator และ field binding |
| 15 Page / Label / Stock / Printer Settings | Page Setup tabs in BarTender order, Stock sub-tabs and unsupported RFID/Magnetic Stripe tabs visible/disabled with explanations, disabled Wizard and tray/source reasons, printer media modes enabled only when the selected profile's `media.printmode` choices from `allcv` confirm support (otherwise unknown/unsupported stays disabled), preserved legacy mode cannot emit an unsupported command, New Label Wizard hides Resolution from printer and summary steps and reads/stores DPI automatically from the selected Windows printer driver's matching horizontal/vertical resolution; missing/invalid driver DPI is explained and blocks Next/Finish, stale main-process IPC uses neutral restart guidance and may use only nominal DPI explicitly present in the selected queue name, changing printer ignores stale responses (`test/printer-resolution.test.js`); predefined stock category/name and dimensions, paper size, margin, gap, rows, columns and orientation are applied from the full `mfg.stk` catalog without precision loss (`test/stock-catalog.test.js`, `test/printer-resolution.test.js`); Windows Electron runtime reads installed driver DPI and verifies stock ADES AG 49908 dimensions; no printing (`electron test/printer-resolution-runtime.js`); width/height/DPI, inch/mm conversion and readable preview precision (mm 2 places/in 3 places), corner radius accepts the precision displayed by the selected unit (including 0.0472 in), margins/gap/rows/columns (multi-column/row auto-enables layout; invalid saved gap cannot prevent column state/controls from updating; clicking OK with an invalid gap restores the last usable gap and saves selected rows/columns; gap controls follow axis and manual/automatic state; Layout preview continuously shows two-headed gap arrows spanning physical cell edges on both axes; every Page Setup preview shows blank paper without user objects; editor preview retains artwork; Layout divides into blank cells in manual template mode; focus arrows and shared preview), orientation/rotation/separate sides, paper shape, printer profile, calibration/offset, page/template/print outer edges and origins align; template scaling threshold, proportional/free text metrics by axis, proportional text and picture geometry, free/proportional barcode choices, free shape/table geometry including picture-backed table axes, constant line thickness, square QR/Data Matrix modules, every design side and saved template page, metadata/table/bitmap preservation, and atomic rollback (`test/template-scaling.test.js`); 10% inclusive threshold prompt, size/percentage display, defaults, No keeps artwork geometry, modal Cancel/Escape keeps Page Setup open, OK commits one scaled change and one undo snapshot, validation failure rollback (`test/page-setup.test.js`); isolated mixed-artwork Yes/No/Cancel and saved-side/page runtime (`electron test/page-setup-runtime.js`) |
| 16 Print / Protocol / Server / CLI | measured-media graphic fitting preserves multi-column paper geometry and emits artwork for every label; Print dialog shows semantic Test Print/Print/Preview/Cancel SVG icons and has one footer Cancel control; titlebar Close closes despite preference-save rejection, Cancel closes, held Ctrl+P does not reopen after Cancel, and app startup keeps Print closed with no visible layout box; Cancel/titlebar X remove the dialog from the screen (`test/print-regressions.test.js`, Electron `test/runtime-ui.js`); action footer stays flush with the modal bottom while settings scroll internally; render ของ ZPL/TSPL/EPL/CPCL/EZPL ที่รองรับ, barcode/QR/check digit, copies/serial/data records, quantity invalid, clipping/layout origin, mock transport printer/IP/USB, error/timeout, ไม่ส่งซ้ำหลัง ambiguous failure, CLI parse/validation และ server request validation |
| 17 Preview / Export / History | preview ตรง model, line outline Solid/Dot/Dash/Erase ตรงกันระหว่าง SVG และ raster, Erase คง fill และไม่ส่ง outline ไป ZPL, undo/redo เก็บ outline style (`test/formatting-capabilities.test.js`); วัตถุ Inverse เติมพื้นดำและกลับ RGB ของ artwork ที่อยู่ด้านบนเฉพาะส่วนตัดกัน โดยคง artwork ปกติด้านนอก (`test/inverse-rendering.test.js`, พิกเซล Electron `test/inverse-rendering-runtime.js`); vector/raster มีขนาดตรงกัน, export PNG/SVG/รูปแบบอื่นที่รองรับ, DPI/alpha/crop/selection, malformed input, cancellation, print/edit history round trip และจำกัดจำนวนรายการ; Undo/Redo disabled/enabled สอดคล้องกับ stack ทั้ง Ribbon และ quick access |
| 18 Search / Hotkeys / Ribbon / UI | Alt+Q focus search, Ctrl+S/Save As/Undo/Redo/Copy/Paste (Paste ต้องแสดงแต่ disabled เมื่อ clipboard ว่าง), hotkey ขณะอยู่ input/modal, Ctrl+C/Ctrl+V/Ctrl+D/Ctrl+Enter/Delete สำหรับหน้าทำงานเฉพาะเมื่อ focus อยู่ที่ tab/context menu และไม่เรียก object hotkeys; focus input ไม่ถูกดักคีย์, เมนูย่อยใน right-click context menu เปิดทันทีเมื่อ hover โดย click ไม่ใช่เงื่อนไขหรือ toggle ปิด, keyboard focus/ArrowRight ยังเปิดเมนูได้ (`test/table-context-menu.test.js`, `test/layer-menu-hover.test.js`); คำสั่ง disabled ยังมองเห็นและกดไม่ได้ในทุกแท็บ/กลุ่ม รวมช่องและเครื่องมือ formatting ที่ unavailable (แถบจัดรูปแบบยังแสดงเมื่อไม่เลือก object), label `Line` ต้องเว้นระยะจาก Line style และช่องความหนาเส้นทั้งใน Ribbon และ object context menu (`test/formatting-capabilities.test.js`, Electron `test/formatting-line-spacing-runtime.js`), แท็บ Picture แสดงเสมอและปิดคำสั่งตาม selection; แท็บ Home, Insert, Layout, Picture, Data, View, Tools, Help เปลี่ยน panel เมื่อ mouse/pen hover, touch ที่จำลอง hover ไม่สลับแท็บ, click และ native button keyboard activation ยังคงทำงาน (DOM unit และ Electron runtime), command disabled/active (Undo/Redo ใน Ribbon และ quick access disabled เมื่อ history ของตนว่างและแยกเปิดใช้เมื่อมีรายการ), quick access Undo/Redo ไม่ค้างกรอบหลังคลิกเมาส์และยังเข้าถึงด้วย focus คีย์บอร์ด, ปุ่ม Snap to grid ไม่มีกรอบ/outline ค้างจาก active หรือ click และแสดงกรอบสีเขียวเฉพาะ hover (`test/ribbon-availability.test.js`, Electron `test/snap-grid-border-runtime.js`), ปุ่ม Print ในกลุ่ม Action ของ Home ใช้ SVG และเปิด print dialog เดิม; ปุ่มเพิ่ม/ลดขนาดฟอนต์แสดง SVG ลูกศรขึ้น/ลงและเปลี่ยนทีละ 1 pt (`test/ribbon-action-icons.test.js`, Electron `test/home-action-icons-runtime.js`), toolbar ตามชนิด object, ชื่อ object อยู่เหนือและชิดกรอบเลือก โดยคงขนาดเมื่อซูมและไม่รับ pointer event, Keyboard shortcuts ใช้ SVG แป้นพิมพ์และ About Q LABEL ใช้ SVG info-circle, ปุ่ม Insert ใน Symbol picker แสดง SVG สีขาวตัดพื้นเขียว (`test/barcode-catalog.test.js`, Electron `test/action-button-ui-runtime.js`), แสดงเวอร์ชันปัจจุบันในแถบ ribbonและตรงกับ settings/sidebar/window title, Create a New Label จาก Project Home เปิด wizard ไว้เหนือ Home; title bar สีเขียว/กรอบเขียวเข้ม พร้อม footer buttons แบ่งความกว้างตามแถวและ label อยู่ในกรอบปุ่มที่หน้าต่างกว้าง 440px (`test/project-home.test.js`, Electron `test/runtime-ui.js`), modal ที่เปิดใหม่อยู่เหนือ navbar fixed และ modal ที่เปิดก่อนหน้า (`test/modal-windows.test.js`, Electron `test/page-setup-runtime.js`), focus/keyboard navigation, dialog button SVG, white glass/blur and text contrast on white/gray/black backgrounds, zoom bar no green outline on slider focus |
| 18a Ribbon project title | ชื่อโปรเจกต์ขยายใช้พื้นที่ก่อนช่อง Search โดยเว้นระยะ, ลดความกว้างตาม viewport เมื่อ resize และข้อความยาวแสดง ellipsis (`test/ribbon-availability.test.js`; Electron `test/ribbon-title-layout-runtime.js` ที่ 1400px และ 900px) |
| 19 Settings / Persistence / Errors | settings/defaults/version รวม Auto Save preference, validation, restart/load fixture round trip, async IPC failure, write failure, missing file, ไม่มี handler เพิ่มซ้ำ, ไม่สร้าง dirty จาก hover/select/zoom หรือการเปิดหน้าธรรมดา |
| 20 Testing infrastructure | test discovery ครบ, เอกสารครบ, case ใหม่เข้ารายการ, deterministic clock/RAF, fixture isolation, exit code และ report มี failed/skip ตามจริง |

เคสเพิ่มเติมของ checklist แถว 15: Columns 1 → 2 โดย Keep current objects บนหน้าอื่นในไฟล์เดียวกัน แล้วกลับ 1 ด้วย Scale ต้องคงขนาด/ตำแหน่ง object เดิม; object ที่เพิ่มหลังเปลี่ยน layout ใช้ขนาดอ้างอิงของตัวเอง, Do Not Scale จำขนาดเดิม, metadata อยู่ครบหลัง JSON reload และหลายหน้า/ด้าน (	est/template-scaling.test.js, 	est/page-setup.test.js, Electron 	est/page-setup-runtime.js).

เคสเพิ่มเติมแถว Printer/New Label: เมื่อ renderer reload แต่ main process ยังไม่มี get-printer-resolution ให้แจ้ง restart แบบข้อความแนะนำที่ไม่ใช่ error; ใช้ได้เฉพาะ nominal DPI ที่มีอยู่ในชื่อ queue ส่วนชื่อที่ไม่มีตัวเลข DPI ต้องไม่มี fallback; หลังเปิดแอปรอบใหม่อ่าน DPI จริงจาก driver ผ่าน IPC ได้ (`test/printer-resolution.test.js`, Electron `test/printer-resolution-runtime.js`). Stock Selection ต้องมีรายชื่อ manufacturer/stock จาก catalog, เติมค่าขนาดและ layout ถูกต้อง และส่งค่าไป template โดยไม่ปัดความละเอียด (`test/stock-catalog.test.js`, `test/printer-resolution.test.js`).

## Coverage ที่ต้องเติมก่อนอ้างว่า basic ทั้งระบบครบ 100%

เคสเพิ่มเติมของ checklist แถว 18 (`test/project-home.test.js`, Electron `test/runtime-ui.js`): SVG icon ของ Cancel/Back/Next/Finish คงขนาด 16px และ label แสดงแนวนอนโดยไม่ถูกกฎขนาด SVG ของ preview ขยายเต็มปุ่ม; SVG ใน aside preview ยังคงเต็ม panel.

เคสเพิ่มเติมของ checklist แถว 11: hover ปุ่ม + ที่มุมตารางต้องคงขนาดไอคอน 24 พิกเซลและพื้นที่คลิก 32 พิกเซล ตรวจ runtime ที่ zoom 50%, 100%, 200%, 400% โดยไม่ขยายตามหน่วยกระดาษ

ตรวจไอคอน Properties ใน page context menu ผ่าน DOM ด้วย test/template-pages.test.js: ปุ่ม Properties มี SVG ขนาด 16px ใช้ราง sliders และ knob 3 จุดที่มีระยะชัดเจน; ไม่ตรวจด้วยการอ่าน source text อย่างเดียว.

ตรวจ filmstrip เพิ่มด้วย `test/template-pages.test.js` และ `electron test/template-navbar-size-runtime.js`: ความกว้างตามจำนวนหน้า, แสดง 4 หน้าโดยไม่เหลือพื้นที่ว่าง, เลื่อนเมื่อเกินความกว้าง, light glass, ซ่อน native filmstrip scrollbar และ bottom preview scrollbar/corner, SVG artwork คนละหน้า, เลข 1-based, active state, การ์ด 112×64px, split add control 114×64px (72px + 40px) และ hover ลูกศรเปิดเมนูด้านบนโดยจัดขอบขวาตรงกับปุ่ม พร้อมคงจำนวน/หน้าที่เลือก; dropdown ปิดเมื่อ pointer ออกจากเมนูมายัง split control และไม่เปิดซ้ำเมื่อ pointer ผ่านลูกศรจนออกจาก control; หลังออกจาก control แล้ว hover ลูกศรเปิดเมนูใหม่ได้; ellipsis SVG ต้องอยู่กึ่งกลางปุ่มทั้งสองแกนและ hover/focus เปิดเมนูโดยไม่เปลี่ยนหน้า; ตรวจคีย์ลัดบน context menu และผลของ Ctrl+X/F2/Alt+Enter ผ่าน DOM; ตรวจ Ctrl+D/Delete ใน Electron; ใช้ appData แยกและตรวจ screenshot `test-results/template-navbar-size.png` (ยังไม่ได้ทดสอบบน touch device จริง)

เคสเพิ่มเติมของ checklist แถว 05, 18, 19 (`test/recent-thumbnails.test.js`): คลิกขวาพื้นที่ว่าง Recently Used Objects เปิด Clear, คลิกตัว object ไม่เปิดเมนูนี้, ล้าง recentObjectEntries และ recentObjectTools พร้อม persistence โดยไม่เปลี่ยนฉลาก, Clear disabled เมื่อว่าง, Escape ปิด, บันทึกล้มเหลวคืนรายการ; ตรวจ runtime round trip ผ่าน `electron test/recent-clear-runtime.js` โดยแยก appData

เคสเพิ่มเติมของ checklist แถว 09 (`test/ruler-labels.test.js`): เฉพาะส่วนไม้บรรทัดที่วัดบนกระดาษมีพื้นสีอ่อน; นอกขอบกระดาษโปร่งใสแต่ยังแสดงขีดและเลขจำนวนเต็มทั้งแกน X/Y, ลบขีดสีเข้มที่พาดใต้เลขนอกกระดาษโดยไม่ clear ส่วนที่ทับพื้นที่กระดาษ; ไม้บรรทัดแนวตั้งยาวถึงปลายกระดาษหรือขอบ viewport แล้วแต่ว่าถึงก่อน, clip เฉพาะ navbar/viewport และแสดงเลข 0 เมื่อ origin มองเห็น; font 15px และแถบ 19.5px (เพิ่ม 50%); ค่าติดลบที่ปัดเป็นศูนย์แสดง `0.00` และ marker/ป้ายพิกัดตรงจุดกำเนิดเมื่อค่าที่แสดงเป็นศูนย์. Electron `test/ruler-appearance-runtime.js` ตรวจเลข 0, เลขนอกกระดาษและไม่มี tick มืดพาดตัวเลข, alpha pixel พื้นหลังด้านใน/นอก, แถบที่ยื่นเกิน frame และช่วง clip ทั้งหน่วย mm/in/dots ที่ devicePixelRatio 2 ด้วย appData แยก

เคสเพิ่มเติมของ checklist แถว 06, 11, 18: mixed Select All/multi-select ห้ามเปิด Table อัตโนมัติหรือเปลี่ยน primary object; table-only เปิดได้และการออกจาก Table ต้องคืนแท็บปกติล่าสุด แม้สลับตารางหลายตัว (`test/table-ribbon-selection.test.js`, `electron test/table-ribbon-switch-runtime.js`)

ณ วันที่สร้างเอกสาร ชุด tests ที่มีอยู่ยังไม่ได้พิสูจน์ว่าครบทุกข้อใน 20 แถวข้างบน โดยเฉพาะ:

- dirty snapshot, Auto Save toggle/debounce และ Save/Don't Save/Cancel รวมหน้าเลือกโปรเจ็กต์
- template pages, layer/group/clipboard และ project CRUD ครบทุกเส้นทาง
- tool search/hotkeys โดยเฉพาะ Alt+Q, zoom/pan burst และ settings round trip
- table view/edit wrap parity, no-clipping minimum ทั้ง row/column และ selection/hover geometry (live color picker สำหรับเส้นมี DOM unit regression แล้ว)
- program lifecycle, server/CLI, transport validation และครบทุก protocol ที่ระบบรองรับ
- UI white glass/contrast บนทุกพื้นหลังและกรณี error/cancel ของงานใหม่ (หัวข้อ Recently Used Objects/Data Sources มี DOM regression เรื่องพื้นขาวและ blur แล้ว)

**ต้องสร้าง executable basic tests ของช่องว่างเหล่านี้และเพิ่มใน inventory** ก่อนรายงานว่า “basic unit test ครบทั้งระบบและผ่านทั้งหมด” ไม่ให้เปลี่ยนคำสัญญาเป็นทดสอบเฉพาะส่วนที่แก้ การทำ source-regex assertion อย่างเดียวไม่ปิดช่องว่างด้านพฤติกรรม

เคสเพิ่มเติมแถว 07: จุดเหลือง HRI ลากชิดซ้าย/กลาง/ขวาและขึ้น–ลงได้ โดยตัวแท่งไม่ขยับ; cursor move และจุดเหลืองแสดงระหว่าง HRI drag แต่ซ่อนระหว่างย้าย object (`test/gesture-geometry.test.js`, `test/svg-selection-handles.test.js`). Electron `test/barcode-hri-drag-runtime.js` ตรวจ barcode128/code39/code93/ean13 ทั้ง live/commit, Undo/Redo และ ZPL alignment 16 กรณีบน temporary profile โดยไม่พิมพ์จริง.

### ผลรอบ v1.000 — 2026-10-16

- เพิ่ม HRI horizontal alignment/vertical clamp unit, move cursor และ live yellow marker DOM unit; version rollover v1.000 unit
- `npm run test:basic`: 519 passed, 0 failed, 0 skipped; legacy 3/3 และ inventory ครบ
- Electron `test/barcode-hri-drag-runtime.js`: 152 checks และ ZPL alignment 16 กรณีผ่านบน isolated profile หลัง retry หนึ่งรอบที่หมดเวลา; ซ่อนหน้าต่าง fixture เพื่อป้องกันเมาส์จริงแทรก synthetic pointer
- `npm run test:gestures`: unit 45 passed; Electron benchmark ไม่ผ่าน display-frame budget (move average 113.88 Hz, median 8.3 ms); ยังไม่ยืนยันความลื่นตาม refresh rate จอ
- ไม่ส่งพิมพ์จริง; coverage gaps ทั้งระบบยังคงอยู่ รายงาน basic: `test/basic-unit-result.json`, runtime: `test/barcode-hri-drag-result.log`, benchmark: `test/hri-gesture-run.log`

## ตรวจ Runtime เพิ่มเติมตามประเภทงาน

Basic unit suite ด้านบนต้องรันทุกครั้ง ส่วนนี้เพิ่มเมื่อเปลี่ยนงานที่ต้องพึ่ง browser rendering/IPC จริง ใช้ test profile แยก ตรวจสคริปต์ก่อนใช้ว่าไม่แตะข้อมูลจริงของผู้ใช้ หากยังไม่ isolate ให้แก้ harness ก่อนรัน

| ประเภทการแก้ | การตรวจเพิ่มเติม |
|---|---|
| Settings fixed header | `electron test/settings-header-runtime.js` ตรวจหัวข้อคงที่เมื่อ scroll, เนื้อหาด้านล่างเข้าถึงได้ และ Close ใช้ได้ใน normal/resized/maximized |
| Printer placeholder | `node --test test/printer-resolution.test.js` และ `electron test/printer-resolution-runtime.js` ตรวจว่า Select printer… disabled ทั้ง dropdown หลักและ wizard โดยเครื่องพิมพ์จริงยังเลือกได้และค่าที่เลือกไม่หาย |
| Connect label data navigation SVG | `electron test/database-navigation-runtime.js` ตรวจ Next ลูกศรสีขาว 16px บนปุ่มเขียว, Back ลูกศรซ้าย และการเปลี่ยนขั้นตอน Next → Back ด้วย temporary profile |
| Startup bitmap / recovery button | `electron test/startup-bitmap-runtime.js` ใช้ temporary profile พร้อม saved image ที่ไม่มี bitmap และ Print History ของภาพนั้น ตรวจว่า full init สำเร็จ, editor/history แสดง placeholder, artwork อื่นยังอยู่, ไม่แก้ข้อมูลเดิม และ SVG reload สีขาวมองเห็นบนปุ่มเขียว |
| กระดาษ rounded / ellipse และ grid | `electron test/design-grid-rounded-runtime.js` ตรวจ pixel ด้วย Chromium ว่าจุดมุมนอก paper ถูก clip และจุดภายในยังเห็น |
| Editor gap visibility | `electron test/page-gap-runtime.js` (isolated appData; starts hidden, draws configured physical gaps on the editor sheet, retains selection/model data, hides gaps again, confirms Page Setup arrows remain) |
| table corner controls / add row-column | `electron test/table-corner-controls-runtime.js` |
| ลาก / ขยาย / หมุน / รอบเฟรม / cache | `npm run test:gestures`; ตรวจ Snap to grid เปิด/ปิดขณะลากและ resize, scene rebuild และ rasterization ระหว่าง gesture เป็นศูนย์, pointerup/origin regression, เวลาเฟรม, incremental table เทียบ full render |
| ตาราง / cell editing / formatting / layer order | `electron test/table-properties-runtime.js`, `electron test/table-cell-formatting-runtime.js`, `electron test/table-cell-selection-runtime.js`, `electron test/table-cell-zoom-runtime.js`, `electron test/table-row-selection-controls-runtime.js` (table menu layer reorder and undo/redo) |
| toolbar / ribbon / icons / focus | `electron test/runtime-ui.js` (isolated temporary appData; Print is closed at startup, fresh Ctrl+P opens once, key repeat cannot reopen after Cancel, plus footer/measured-media/SVG checks before the existing Help icon assertion), `electron test/table-ribbon-runtime.js`, `electron test/table-ribbon-switch-runtime.js`, `electron test/action-button-ui-runtime.js` (Symbol Insert SVG is white and visible against the green primary button), `electron test/home-action-icons-runtime.js` (Home Action Print SVG invokes existing dialog; font-size up/down SVG controls adjust by one point), `electron test/ribbon-history-order-runtime.js`, `electron test/formatting-line-spacing-runtime.js` (Line hint clearance from line-style selector and thickness input) |
| ribbon commands / all tabs | `electron test/ribbon-availability-runtime.js` (all tabs visible; Home/Insert/Layout/Picture/Data/View/Tools/Help switch on mouse and pen hover, touch hover is ignored, click remains active; File dropdown opens on hover, a click while hover-open keeps it available, closes after pointer exits, click still opens it, starts below the File tab without covering its label and stays within viewport with scroll when needed; focused New has no border/outline despite later global focus rules; unavailable commands stay visible and disabled, including Picture without selection) |
| Ribbon project title | `electron test/ribbon-title-layout-runtime.js` (isolated appData; long project title fills available space to the left of centered Search, keeps an 8px gap and recomputes at 1400px and 900px) |
| เลือก / ยกเลิกเลือก Text | `electron test/runtime-ui.js` (fixture ชั่วคราว; ตรวจเลือก/ยกเลิกเลือกซ้ำโดยคง SVG เดิมและไม่เรียก full canvas redraw), `electron test/object-selection-name-runtime.js` (appData แยก; ป้ายชื่อทุกชนิด object, ชิดกรอบเลือก, multi-select, ไม่ปนใน artwork) |
| table text range formatting | `electron test/table-cell-text-range-runtime.js` |
| รูป / SVG / selection / replacement | `electron test/svg-selection-bounds-runtime.js` (SVG corners; Rectangle ลาก resize แนวนอนแล้ว stroke ใช้ width เดิมไม่คูณ canvas scale, marker มุม และ toolbar คงขนาดช่วง preview/commit; barcode มุมทั้งสี่แสดงพร้อม resize hit targets, NW และ bottom handle drag (แท่งสูงขึ้นโดย HRI offset คงเดิมและ HRI คงขนาด/ตำแหน่งสัมพันธ์ทั้ง preview/commit), HRI drag เปลี่ยน offset พร้อมคงกรอบเลือกสีเขียว, ป้ายองศาเลขเต็มเปลี่ยนตามมุมระหว่างหมุนและแสดง snap guide เดิม, live rotation เปลี่ยน path/แสดงไฮไลต์เมื่อทะลุกระดาษและซ่อนเมื่อกลับเข้าในหน้า, rotate และ move), `electron test/picture-home-runtime.js` (ปุ่มปรับมุมโค้งห่าง marker NW อย่างน้อย 4px; ปุ่มหมุนแสดงกรอบเขียวบน hover; ปุ่มความหนาเส้นแสดงวงขอบเขียว 2px เฉพาะ hover และซ่อนเมื่อออก), `test/line-controls.test.js` (DOM mouse/pen/touch hover states), `electron test/picture-ribbon-icons-runtime.js`, `electron test/remove-image-background-runtime.js`; ป้ายวัดขนาดระหว่างลากความหนาเส้นยึดจุดเริ่ม ไม่ตาม pointer และซ่อนเมื่อปล่อย (`test/gesture-measure.test.js`, Electron `test/picture-home-runtime.js`) |
| export | `electron test/image-export-runtime.js` |
| group / copy / property interaction | `electron test/canvas-group-copy-runtime.js`, `electron test/no-double-click-properties-runtime.js` |
| Auto Save settings / persistence | `electron test/auto-save-policy-runtime.js` |
| Page Setup tabs/capabilities | `electron test/page-setup-runtime.js` (isolated appData; primary/sub-tab order, disabled encoder/tray/Wizard reasons, fail-closed media mode state and explicit profile enablement, native Chromium validation accepts four-decimal inch width/height, blank artwork-free Page Setup tabs, editor preview artwork retained, two-column preview recovers from unusable saved gap, persistent horizontal gap arrow spans actual cell edges, OK commits selected columns with the last usable gap, shape preview model update, significant-size Yes/No and Scale Templates modal flows, proportional/free text metrics, mixed object and table axes scaling on every side/saved page, modal cancel/escape rollback, Cancel restores the opening snapshot) |
| Printer DPI / Stock Selection | `electron test/printer-resolution-runtime.js` (temporary appData; queries installed printer names through renderer IPC and confirms at least one selected local driver reports valid DPI; opens Stock Selection and verifies ADES AG 49908 dimensions; simulates missing main handler and verifies only an explicitly named nominal DPI is used; does not print) |
| Snap to grid hover border | `electron test/snap-grid-border-runtime.js` (isolated appData; active/focused has no border or outline, forced hover displays the green border) |
| Project Home / New Label CTA | `electron test/runtime-ui.js` (isolated appData; verifies the multi-page card changes from first to second preview after 3 seconds, and checks wizard footer icon/label bounds at 440px); fake-clock DOM unit covers footer wrapping, icon/label constraints, single-page behavior, card opening and timer cleanup |
| Template filmstrip | Selected thumbnail has no dark outer shadow while retaining its green selection border; `electron test/template-navbar-size-runtime.js` (isolated appData; compact width for four pages, light glass surface, no thumbnail or bottom preview scrollbar, SVG artwork, number, selected state and fixed thumbnail geometry; 114×64px split add control with 72px + segment, 40px caret segment, and caret hover immediately opens menu above/right-aligned without adding a page; menu closes when pointer returns from dropdown to add control, caret hover does not reopen it until pointer leaves the control; caret hover then opens it again; hover ellipsis SVG is centered inside its button; page action menu stays above its card without overlapping the ellipsis and scrolls within constrained height; visible Ctrl+D badge, Ctrl+D duplicates and Delete removes a page; captures `test-results/template-navbar-size.png`) |
| Ruler paper extent | `electron test/ruler-appearance-runtime.js` (isolated appData; pixel alpha stays opaque within measured paper and transparent outside it on both axes while off-paper integer labels remain visible with no dark tick crossing their digits; at devicePixelRatio 2, fixed vertical ruler extends to visible paper bottom or viewport edge, displays zero when origin is visible, and clips below navbar; in/inches/mm/dots) |

ใช้ Electron ผ่าน `node_modules/.bin/electron.cmd` บน Windows หรือคำสั่ง npm ของโปรเจ็กต์ ไม่ต้องติดตั้ง global Electron

Unit test ที่จำลอง 380 Hz ตรวจการจัดคิว event/RAF ได้ แต่ **ไม่พิสูจน์ 380 FPS ที่แสดงบนจอจริง** การรับรองความลื่นต้องรายงาน Hz ของจอจริง, scene, median/P95/max frame time, FPS, dropped frames และการใช้ test input; การทดสอบผ่านบนจอ 120 Hz ห้ามรายงานเป็นการวัดจอ 380 Hz

## รูปแบบผลส่งมอบทุกครั้ง

### ผลรอบ v0.974 — 2026-10-16

- ขยับปุ่มปรับมุมโค้งของรูปและกรอบออกจากมุมวัตถุ 24px; runtime วัดช่องว่างจาก marker NW ได้ประมาณ 6px
- ปุ่มหมุน/ย้ายแสดงวงขอบเขียวเมื่อ mouse หรือ pen hover และกลับสู่ปกติเมื่อ pointer ออก; touch compatibility hover ไม่มีผล
- เพิ่ม regression ใน `test/line-controls.test.js` และ Electron `test/picture-home-runtime.js`; ปรับ checklist แถว 07, inventory และ runtime matrix
- `npm run test:basic`: 490 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/picture-home-runtime.js`: ผ่าน; ช่องว่างจาก marker NW ประมาณ 6px และปุ่มหมุนมีกรอบ hover สีเขียว; appData ชั่วคราว (มี GPU state warning หลัง PASS)
- `git diff --check`: ผ่าน
### ผลรอบ v0.973 — 2026-10-16

- แท็บ Home, Insert, Layout, Picture, Data, View, Tools และ Help สลับ panel เมื่อเมาส์หรือปากกา hover; การคลิกและการเปิดใช้งานปุ่มตาม native keyboard behavior ยังคงทำงาน และ touch compatibility hover ไม่สลับแท็บ
- เพิ่ม DOM regression ใน `test/ribbon-availability.test.js` และ Electron runtime ใน `test/ribbon-availability-runtime.js` สำหรับ mouse/pen/touch และ click; อัปเดต inventory, checklist แถว 18 และ runtime matrix
- `npm run test:basic`: 489 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`; รอบแรกมี ACE child-process error ชั่วคราว แต่ isolated Access test และ suite ที่รันซ้ำผ่าน
- `npx electron test/ribbon-availability-runtime.js`: ผ่าน; ตรวจ mouse/pen hover, touch hover ที่ไม่สลับแท็บ, click, คำสั่ง disabled และ File dropdown ด้วย appData ชั่วคราว (มี Electron CSP warning ใน test harness)
- `git diff --check`: ผ่าน
### ผลรอบ v0.973 — 2026-10-16

- แท็บ Home, Insert, Layout, Picture, Data, View, Tools และ Help สลับ panel เมื่อเมาส์หรือปากกา hover; click และ native keyboard activation ของปุ่มยังทำงาน และ touch compatibility hover ไม่สลับแท็บ
- เพิ่ม DOM regression ใน `test/ribbon-availability.test.js` และ Electron runtime ใน `test/ribbon-availability-runtime.js` สำหรับ mouse/pen/touch และ click; อัปเดต inventory, checklist แถว 18 และ runtime matrix
- `npm run test:basic`: 489 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`. รอบแรกมี ACE child-process error ชั่วคราว; isolated Access test และการรัน suite ซ้ำผ่าน
- `npx electron test/ribbon-availability-runtime.js`: ผ่าน; ตรวจ mouse/pen hover, touch hover ที่ไม่สลับแท็บ, click, คำสั่ง disabled และ File dropdown; appData ชั่วคราว (มี Electron CSP warning ใน test harness)
- `git diff --check`: ผ่าน
### ผลรอบ v0.972 — 2026-10-16

- ป้ายมุมระหว่างหมุนแสดงเป็นองศาเต็มและอัปเดตทุกครั้งตามมุมปัจจุบัน โดยคงกติกา snap และ snap guide เดิม
- เพิ่ม DOM regression การปัดและอัปเดตป้ายที่ 14°, 15°, 16° และ Electron runtime สำหรับป้ายระหว่างหมุนอิสระ, snap/กลับ 0° พร้อมตรวจเส้น snap; อัปเดต checklist แถว 07 และ runtime matrix
- `npm run test:basic`: 488 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/svg-selection-bounds-runtime.js`: ผ่าน; หมุน barcode live พร้อมป้ายองศาระหว่างหมุนอิสระและ snap guide และตรวจไฮไลต์แดงเข้า/ออกขอบ; appData ชั่วคราว
- `git diff --check`: ผ่าน
### ผลรอบ v0.971 — 2026-10-16

- ระหว่าง preview หมุน barcode ให้ path และสถานะไฮไลต์แดงติดตามมุม/ตำแหน่งปัจจุบัน; แสดงเมื่อขอบวัตถุพ้นกระดาษและซ่อนอีกครั้งเมื่อกลับเข้ากระดาษ
- เพิ่ม DOM unit ใน `test/svg-selection-handles.test.js` และขยาย Electron `test/svg-selection-bounds-runtime.js` ให้ตรวจ live rotation; อัปเดต inventory, checklist แถว 07 และ runtime matrix
- `npm run test:basic`: 487 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`; log มีคำเตือน `csstree-match` สองครั้งจาก CSS parsing แต่ไม่มี test fail
- `npx electron test/svg-selection-bounds-runtime.js`: ผ่าน; หมุน barcode ออกจากขอบที่ 345° แล้วไฮไลต์เปลี่ยน path/ปรากฏ จากนั้นคืนที่ 0° แล้วซ่อน; Electron แจ้ง GPU state warning หลัง PASS, appData แยกชั่วคราว
- `git diff --check`: ผ่าน; ไม่ได้ทดสอบกับเครื่องพิมพ์จริง

### ผลรอบ v0.970 — 2026-10-16

- ขยายชื่อโปรเจกต์ใน ribbon จนถึงพื้นที่ก่อน Search, เว้นช่องไฟ 8px, ย่อและคำนวณใหม่เมื่อ resize; ชื่อยาวตัดด้วย ellipsis
- เพิ่ม DOM regression ใน `test/ribbon-availability.test.js`; เพิ่ม Electron `test/ribbon-title-layout-runtime.js` สำหรับ viewport 1400px และ 900px; อัปเดต inventory, checklist แถว 18a และ runtime matrix
- `npm run test:basic`: 486 ผ่าน, 0 ล้มเหลว, 0 ข้าม; legacy checks 3/3 ผ่าน, inventory ขาด 0; รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npx electron test/ribbon-title-layout-runtime.js`: ผ่าน; ใช้พื้นที่ 352px และ 108px ตามลำดับ โดยเว้น Search 8px; appData แยกชั่วคราว
- `git diff --check`: ผ่าน; ไม่ได้ทดสอบกับเมาส์จริงหรือเครื่องพิมพ์จริง

### ผลรอบ v0.969 — 2026-10-16

- เพิ่มปุ่ม Show gap / Hide gap ในแท็บ View; ค่าเริ่มต้นซ่อน, แสดงแถบ gap จริงตาม page layout บน editor canvas และปิดปุ่มเมื่อไม่มี gap
- เพิ่ม `test/page-gap.test.js`; Electron `test/page-gap-runtime.js` ตรวจเปิด/ปิด, ขอบเขต selection, model คงเดิม และลูกศรใน Page Setup
- อัปเดต inventory, checklist แถว 09 และ runtime matrix
- `npm run test:basic`: 485 passed, 0 failed, 0 skipped; legacy checks 3/3 passed; inventory ขาด 0. รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- Electron `test/page-gap-runtime.js`: ผ่านด้วย appData ชั่วคราว; เริ่มซ่อน, แสดง gap จริงสองแกน, selection/model คงเดิม, ปิดกลับ และลูกศรใน Page Setup ยังอยู่; Chromium บันทึก GPU state warning หลัง PASS แต่ process exit 0
- `git diff --check`: ผ่าน; มีคำเตือน line endings LF/CRLF จาก working tree
- ข้อจำกัด: runtime ใช้ event/render จำลอง ไม่ได้ทดสอบเมาส์จริงหรือพิมพ์กับเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่บันทึกไว้ยังเปิดอยู่

### ผลรอบ v0.955 — 2026-10-16

- เพิ่ม carousel ให้ preview บนการ์ดโปรเจกต์ที่มีหลาย template_pages เปลี่ยนหน้าทุก 3 วินาที; การ์ดหน้าเดียวคงเดิมและคลิกเปิดไฟล์ตามปกติ
- เพิ่ม fake-clock regression ใน `test/project-home.test.js` สำหรับการเปลี่ยนหน้า/วนกลับ, timer เฉพาะการ์ดหลายหน้า, การเปิดโปรเจกต์ และ cleanup เมื่อซ่อน Home; เพิ่ม Electron assertions ใน `test/runtime-ui.js`; อัปเดต inventory และ checklist แถว 05
- `npm run test:basic`: unit 467 passed, 0 failed, 0 skipped; legacy basic scripts 3/3 passed; inventory ขาด 0. รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- Electron `test/runtime-ui.js`: carousel assertions ผ่าน (แสดงหน้าแรกและเปลี่ยนเป็นหน้าสองหลัง 3 วินาที); 18 checks ก่อนหน้าผ่าน จากนั้น test เดิม fail ที่ assertion Help SVG (`Help actions use keyboard and information SVG icons`); checks หลังจุดนี้ยังไม่ได้รัน
- ข้อจำกัด: เวลาสลับทดสอบด้วย fake clock ใน DOM และ event timing ใน Electron; ไม่ได้ทดสอบจอจริงหรือเครื่องพิมพ์; runtime-ui มี failure ที่ Help SVG อยู่นอกขอบเขตงานนี้
### ผลรอบ v0.954 — 2026-10-16

- แก้กรณี dropdown เพิ่มหน้ายังเปิดค้างเมื่อ pointer ย้ายจากเมนูกลับมาที่ split control; ปิดเมื่อเข้า control และกัน hover ลูกศรเปิดซ้ำจน pointer ออกจาก control
- เพิ่ม regression ใน `test/template-pages.test.js` และ `test/template-navbar-size-runtime.js`; ปรับ inventory, checklist แถว 05 และ runtime coverage
- `npm run test:basic`: unit 466 passed, 0 failed, 0 skipped; legacy basic scripts 3/3 passed; inventory ขาด 0. รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- Electron `test/template-navbar-size-runtime.js`: ผ่าน; dropdown ปิดเมื่อกลับเข้า control, ไม่เปิดซ้ำที่ caret จน pointer ออก และเปิดใหม่ได้ภายหลัง
- `git diff --check`: ผ่าน; มีคำเตือน line endings LF/CRLF จากไฟล์เดิม
- ข้อจำกัด: hover จำลองใน DOM/Electron; ไม่ได้ทดสอบเมาส์จริงหรือเครื่องพิมพ์จริง; coverage gaps ที่ระบุไว้ยังเปิดอยู่

### ผลรอบ v0.953 — 2026-10-16

- Snap to grid มีผลขณะลาก/resize object ตาม Grid Step และ origin กระดาษ; ปิดแล้วไม่ใช้ Grid Step (resize คง precision เดิม 0.1 mm); alignment guide ที่จุดนอก grid ถูกให้ความสำคัญตามค่า Snap และจุดกริดยังแสดง/ซ่อนได้แยกกัน
- เพิ่ม assertions ใน `test/design-grid.test.js` และ `test/object-gesture-runtime.js`; ปรับ `test/line-controls.test.js` harness ให้มี grid state ปิด; checklist แถว 07 และ runtime matrix แถว gesture อัปเดต
- `npm run test:basic`: unit 466 passed, 0 failed, 0 skipped; legacy basic scripts 3/3 passed; inventory ขาด 0. รายงาน `test/basic-unit-result.json` และ `test/basic-unit-output.log`
- `npm run test:gestures`: 44 unit cases passed; Electron `test/object-gesture-runtime.js` ผ่าน move/resize Snap on/off, scene rebuild/rasterization ระหว่าง gesture = 0, table geometry เทียบ full render; จอจำลองรายงาน 120 Hz และ average 119.22–120.01 Hz ตามชนิด gesture
- `git diff --check`: ผ่าน; มีคำเตือน line endings LF/CRLF
- ข้อจำกัด: ตรวจ pointer ด้วย event จำลองบน Electron/จอ 120 Hz; ไม่ได้ทดสอบเมาส์จริง, จอ 380 Hz หรือเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่ระบุด้านบนยังเปิดอยู่

### ผลรอบ v0.952 — 2026-10-16

- แก้ dropdown เพิ่มหน้าให้ปิดทันทีเมื่อ pointer ออกจากเมนูไปยังปุ่ม +; ปุ่ม + หลักไม่เปิดเมนู และ hover ลูกศรยังเปิดได้
- ปรับ assertion ใน `test/template-pages.test.js` และ `test/template-navbar-size-runtime.js`; checklist แถว 05 และ runtime coverage ปรับตามพฤติกรรมใหม่
- `npm run test:basic`: unit 464 passed, 0 failed, 0 skipped; legacy basic scripts 3/3 passed; inventory ขาด 0
- Electron `test/template-navbar-size-runtime.js`: PASS; ปิดเมื่อ pointer กลับไปที่ +, เปิดใหม่เมื่อ hover ลูกศร, ขนาด/ตำแหน่งเมนูและ behavior อื่นของ filmstrip ผ่าน
- ข้อจำกัด: pointer movement ใช้ event จำลอง; ยังไม่ได้ทดสอบด้วยเมาส์จริง

### ผลรอบ v0.951 — 2026-10-16

- ปรับ submenu ใน right-click context menu ให้เปิดด้วย pointer hover โดยไม่ต้องคลิก; click trigger ไม่เปิดเมนูเดี่ยว ๆ และไม่ toggle ปิดเมนูที่ hover เปิดแล้ว; keyboard focus/ArrowRight ยังใช้เปิดได้
- Inventory และ checklist ปรับแถว 06, 18; เพิ่ม `test/layer-menu-hover.test.js` และ assertion ใน `test/table-context-menu.test.js`
- `npm run test:basic`: unit 464 passed, 0 failed, 0 skipped; legacy basic scripts 3/3 passed; inventory ขาด 0
- Electron `test/table-row-selection-controls-runtime.js`: ผ่าน; menu groups Rows/Columns/Cell/Style/Layer/Table และ Layer reorder/undo/redo ทำงาน
- `git diff --check`: ผ่าน โดยมีเพียงคำเตือน line endings LF/CRLF จากไฟล์เดิมใน working tree
- ข้อจำกัด: hover ตรวจด้วย DOM/Electron event จำลอง ไม่ได้ทดสอบ pointer จริง; coverage gaps ที่แสดงด้านบนยังเปิดอยู่

### ผลรอบ v0.949 — 2026-10-16

- Columns 1 → 2 (Keep current objects) บนหน้าอื่นในไฟล์เดียวกัน → 1 (Scale) ไม่ขยาย object เก่าซ้ำ; object ที่เพิ่มใหม่ใช้ขนาดอ้างอิงของตัวเอง
- ปรับ inventory ของ template-scaling/page-setup และเพิ่มเคส checklist แถว 15; ตรวจ JSON reload, หลายหน้า/ด้าน, Do Not Scale และการคง reference เมื่อ Keep ซ้ำ
- `node --test test/template-scaling.test.js test/page-setup.test.js`: 52 passed, 0 failed, 0 skipped
- Electron `test/page-setup-runtime.js`: PASS รวม `retainedArtworkColumnRoundTrip`; ใช้ appData ชั่วคราวและไม่ส่งงานพิมพ์
- ผล `npm run test:basic` ของเวอร์ชันนี้บันทึกอัตโนมัติที่ `test/basic-unit-result.json`, รายละเอียด `test/basic-unit-output.log`; coverage gaps ทั้งระบบด้านบนยังเปิดอยู่
- ข้อจำกัด: ไม่กู้ object ที่ยืดและบันทึกไปแล้วโดยไม่มีข้อมูลขนาดเดิม; ไม่ทดสอบเครื่องพิมพ์จริง

### ผลรอบ v0.948 — 2026-10-15

- แก้ SVG ของปุ่ม Insert ในหน้าต่าง Symbol ให้เป็นสีขาวเมื่ออยู่บนพื้นปุ่มสีเขียว จึงมองเห็นได้
- `test/barcode-catalog.test.js`: เพิ่ม DOM regression ตรวจ SVG, ขนาดไอคอนและสี contrast ของปุ่ม Insert จริงหลังโหลด ActionButtonUI
- `electron test/action-button-ui-runtime.js`: ผ่าน; `symbolInsertIcon: true`, ตรวจ SVG สีขาว 16px บนพื้นเขียวใน Electron และ dialog/table actions เดิม
- `npm run test:basic`: 459 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory ขาด 0. รายงาน `test/basic-unit-result.json`, `test/basic-unit-output.log`
- ข้อจำกัด: JSDOM/Electron จำลอง; ไม่ได้ทดสอบบนจอจริง

### ผลรอบ v0.947 — 2026-10-15

- ปรับเมนู … ของหน้าให้เปิดเหนือการ์ด ไม่ทับปุ่ม ellipsis และเลื่อนภายในเมื่อพื้นที่แนวตั้งไม่พอ; ไม่ให้ข้อจำกัดความสูงค้างไปยังเมนูเพิ่มหน้า
- เปิดเมนู File เมื่อ hover ด้วยเมาส์/ปากกา; คลิกขณะเมนูเปิดจาก hover ไม่ทำให้ปิดทันที, pointer ออกแล้วปิด และคลิกเปิดเมนูได้
- `test/template-pages.test.js`: เพิ่ม regression ตรวจเมนูอยู่เหนือหน้าและข้อจำกัดไม่รั่วไปเมนูเพิ่มหน้า
- `test/ribbon-file-hover.test.js`: เพิ่ม DOM unit ตรวจ mouse/pen vs touch และการล้าง close timer
- `electron test/template-navbar-size-runtime.js`: ผ่าน; ตรวจเมนู … ไม่ทับการ์ดและ overflow ภายในเมนู
- `electron test/ribbon-availability-runtime.js`: ผ่าน; ตรวจ hover เปิด/คลิกแล้วเมนูยังอยู่/ออกแล้วปิด/คลิกเปิดได้ พร้อมตรวจ tabs และคำสั่ง ribbon เดิม
- `npm run test:basic`: 458 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory ขาด 0. รายงาน `test/basic-unit-result.json`, `test/basic-unit-output.log`
- ข้อจำกัด: JSDOM/Electron จำลอง; ไม่ได้ทดสอบบนจอจริงหรือ touch device และยังรีโหลดหน้าต่างแอปเดิมไม่ได้ เพราะ Windows ปฏิเสธการ activate ขณะภาพหน้าจอแสดงหน้าล็อก

### ผลรอบ v0.946 — 2026-10-15

- เอา outline/border จาก focus รอบรายการ New ใน File menu ออก โดย override กฎ focus กลางที่โหลดภายหลัง
- `test/ribbon-availability.test.js`: เพิ่ม DOM regression ตรวจว่า New ไม่มี outline/border แม้มีกฎ focus ทั่วไปโหลดทีหลัง
- `electron test/ribbon-availability-runtime.js`: ผ่าน; ตรวจแท็บและคำสั่ง ribbon พร้อม computed style ของ New ไม่มี outline/border
- `npm run test:basic`: 456 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- ข้อจำกัด: ใช้ JSDOM และ Electron จำลอง; ไม่ได้ทดสอบจอจริง

### ผลรอบ v0.945 — 2026-10-15

- ไม้บรรทัดแนวตั้งยาวถึงปลายกระดาษที่มองเห็น แม้เลย frame; แสดงเลข 0 เมื่อจุดกำเนิดอยู่ในพื้นที่ที่มองเห็น และ clip ที่ viewport
- `test/ruler-labels.test.js`: 10 passed, 0 failed, 0 skipped; ครอบคลุมจุดกำเนิด/ช่วง tick และความสูงที่จำกัดตาม viewport
- `electron test/ruler-appearance-runtime.js`: ผ่าน; ตรวจเลข 0, แถบยื่นพ้น frame ถึงปลายกระดาษ, alpha ภายใน/นอกกระดาษ, หน่วย in/mm/dots ที่ devicePixelRatio 2 ด้วย appData แยก
- `npm run test:basic`: 455 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- ข้อจำกัด: ใช้ Electron runtime จำลอง; ไม่ได้ทดสอบจอจริง

### ผลรอบ v0.944 — 2026-10-15

- แสดง tick และตัวเลขจำนวนเต็มต่อเนื่องบนไม้บรรทัดทั้งแนวนอนและแนวตั้งแม้อยู่นอกกระดาษ โดยไม่ทาสีพื้นหลังในช่วงนอกกระดาษ; ไม้บรรทัดซ้ายแสดงเต็ม viewport ใต้ navbar
- `test/ruler-labels.test.js`: 9 passed, 0 failed, 0 skipped; ตรวจเลขนอกกระดาษโดยไม่มี fill พื้นหลัง
- `electron test/ruler-appearance-runtime.js`: ผ่าน; ตรวจเลขนอกกระดาษ, ความโปร่งใส/พื้นหลังตามช่วงกระดาษ และไม้บรรทัดซ้ายใต้ navbar ที่ devicePixelRatio 2 ทั้ง in/mm/dots; appData แยก
- `npm run test:basic`: 454 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- ข้อจำกัด: ไม่ได้วัดกับจอ/ฮาร์ดแวร์จริง

### ผลรอบ v0.943 — 2026-10-15

- ขยับ File dropdown ให้อยู่ถัดจากแท็บ File โดยไม่ทับคำบนแท็บ; จำกัดเมนูให้อยู่ใน viewport พร้อม scroll เมื่อพื้นที่จอไม่พอ
- `electron test/ribbon-availability-runtime.js`: ผ่าน; ตรวจแท็บครบ, dropdown อยู่ใต้ File และไม่ล้น viewport, คำสั่งที่ใช้ไม่ได้ยังมองเห็นและ disabled
- `npm run test:basic`: 453 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF ใน working tree
- ไม่ได้ทดสอบบนจอ touch จริง

### ผลรอบ v0.942 — 2026-10-15

- ปิด dropdown เมื่อ pointer ออกจากเมนู; ถ้าออกจากปุ่มลูกศรจะปิดหลัง 140ms เพื่อให้ pointer ข้ามช่องว่างเข้าเมนูได้ และยกเลิก timer เมื่อเข้าเมนู
- `test/template-pages.test.js`: 8 passed, 0 failed, 0 skipped; ตรวจออกจาก trigger เข้าเมนู, ออกจากเมนู และออกจาก trigger ไปพื้นที่อื่น
- `npx electron test/template-navbar-size-runtime.js`: ผ่าน; hover เปิดเมนู, ออกจาก trigger ปิดเมนู/ARIA, เปิดใหม่ได้; ตรวจ geometry/ellipsis/hotkeys; appData แยก ไม่พิมพ์จริง; screenshot `test-results/template-navbar-size.png`
- `npm run test:basic`: 453 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF; ยังไม่ได้ทดสอบบน touch device จริง และ coverage gaps ทั้งระบบยังเปิดอยู่

### ผลรอบ v0.941 — 2026-10-15

- เปลี่ยนไอคอน … บน thumbnail เป็น SVG สามจุดและจัดให้อยู่กึ่งกลางปุ่มทั้งแนวนอน/แนวตั้ง โดยคงขนาดและตำแหน่งปุ่ม
- `test/template-pages.test.js`: 8 passed, 0 failed, 0 skipped; ตรวจ SVG สามจุดและการจัดกลางของ hit area
- `npx electron test/template-navbar-size-runtime.js`: ผ่าน; runtime วัดกึ่งกลาง SVG เทียบกรอบปุ่มจริง; แถบ 4 หน้า 624px, ปุ่ม split ทำงาน, ไม่มี scrollbar; ใช้ appData แยกและไม่พิมพ์จริง; screenshot `test-results/template-navbar-size.png`
- `npm run test:basic`: 453 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF; ยังไม่ได้ทดสอบบน touch device จริง และ coverage gaps ทั้งระบบยังเปิดอยู่

### ผลรอบ v0.940 — 2026-10-15

- Clip ไม้บรรทัดแนวตั้งให้เริ่มและจบตรงขอบบน/ล่างของกระดาษที่มองเห็น ไม่มีขีดวัดเกินความสูงกระดาษ; ด้านนอกกระดาษยังโปร่งใส
- `test/ruler-labels.test.js`: 8 passed, 0 failed, 0 skipped; regression ครอบคลุมกระดาษเต็มช่วง, ถูก viewport ตัด และ navbar ทับ
- `npm run test:basic`: 453 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/ruler-appearance-runtime.js`: ผ่าน; devicePixelRatio 2, ตรวจ clipping เทียบ paper bounds และ alpha pixel ทั้งแกน X/Y ในหน่วย in/mm/dots; ใช้ appData แยก ไม่พิมพ์จริง; screenshot `test-results/ruler-appearance.png`
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF; coverage gaps ทั้งระบบด้านล่างยังเปิดอยู่

### ผลรอบ v0.939 — 2026-10-15

- Dropdown ของปุ่มเพิ่มหน้าเปิดเหนือปุ่มและจัดขอบขวาให้ตรงกัน โดยใช้ตำแหน่งจริงของปุ่มและกันเมนูล้นขอบบน
- `test/template-pages.test.js`: 8 passed, 0 failed, 0 skipped; regression ตรวจตำแหน่งเหนือปุ่มและ right alignment
- `npx electron test/template-navbar-size-runtime.js`: ผ่าน; 4 หน้า, แถบกว้าง 624px, dropdown อยู่เหนือปุ่มและจัดขอบขวาตรงกัน, ไม่สร้างหน้าใหม่, ไม่มี scrollbar ล่าง/แนวนอน; appData แยกและไม่พิมพ์จริง; screenshot `test-results/template-navbar-size.png`
- `npm run test:basic`: 452 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF
- ข้อจำกัด: ยังไม่ได้ทดสอบบน touch device จริง; coverage gaps ทั้งระบบด้านล่างยังเปิดอยู่

### ผลรอบ v0.938 — 2026-10-15

- ปรับ split add control เป็น 114×64px แบ่งปุ่ม + 72px และลูกศร 40px ให้ได้สัดส่วนตามภาพ โดยใช้ธีมสีอ่อน; hover ที่ลูกศรเปิดเมนูทันที หมุนลูกศรและอัปเดต `aria-expanded` โดยไม่เพิ่ม/สลับหน้า
- `test/template-pages.test.js`: 8 passed, 0 failed, 0 skipped; มี regression ขนาดกลุ่ม/แต่ละปุ่ม, hover เปิดเมนู และหน้าปัจจุบันคงเดิม
- `npm run test:basic`: 452 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/template-navbar-size-runtime.js`: ผ่าน; 4 หน้า, แถบกว้าง 624px, split control 114×64px, hover เปิดเมนูโดยไม่สร้างหน้า, ไม่มี scrollbar ล่าง/แนวนอน, Ctrl+D/Delete ทำงาน; ใช้ appData แยกและไม่พิมพ์จริง; screenshot `test-results/template-navbar-size.png`
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF; ยังไม่ได้ทดสอบบน touch device จริง; coverage gaps ทั้งระบบด้านล่างยังเปิดอยู่

### ผลรอบ v0.937 — 2026-10-15

- แก้พิกัดใกล้ศูนย์ไม่ให้แสดง `-0.00`; marker และป้ายสีแดง snap ไปยังจุดกำเนิดเดียวกับ tick 0 สีเขียว เมื่อค่าหลังปัดเป็นศูนย์
- `test/ruler-labels.test.js`: 7 passed, 0 failed, 0 skipped; ครอบคลุมค่าบวก/ลบใกล้ศูนย์และตำแหน่ง marker ที่ควรยึดศูนย์
- `npm run test:basic`: 452 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/ruler-appearance-runtime.js`: ผ่าน; ตรวจ ruler ทั้งแกนและหน่วย in/mm/dots, พื้นด้านใน/นอกกระดาษ, ใช้ appData แยกและไม่พิมพ์จริง
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF ใน working tree; coverage gaps ทั้งระบบด้านล่างยังเปิดอยู่

### ผลรอบ v0.936 — 2026-10-15

- เพิ่ม ellipsis เมื่อ hover/focus และบนหน้าที่เลือกสำหรับอุปกรณ์ touch; เปิดเมนูหน้าโดยไม่สลับหน้า เพิ่ม split add control สำหรับเพิ่มหน้าเปล่าหรือทำสำเนาจากเมนูย่อย พร้อมธีมสีอ่อน
- `test/template-pages.test.js`: DOM checks 8/8 ผ่าน รวม hover/focus, เปิดเมนูโดยคงหน้าเดิม, เพิ่มหน้าเปล่า/ทำสำเนาผ่านเมนู และรูปแบบ SVG chevron
- `npm run test:basic`: 450 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/template-navbar-size-runtime.js`: ผ่าน; 4 หน้า, แถบกว้าง 575px, ปุ่ม split add และ ellipsis, ไม่มี scrollbar ล่าง/แนวนอน, Ctrl+D/Delete ทำงาน; appData แยก ไม่ส่งงานพิมพ์; screenshot `test-results/template-navbar-size.png`
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF ใน working tree; ยังไม่ได้ทดสอบบน touch device จริง; coverage gaps ทั้งระบบด้านล่างยังเปิดอยู่

### ผลรอบ v0.935 — 2026-10-15

- เปลี่ยน filmstrip เป็นพื้น glass สีอ่อน และซ่อน scrollbar ของ thumbnail กับ bottom preview/corner ขณะอยู่หน้าออกแบบ
- `test/template-pages.test.js`: ตรวจสีพื้น, native scrollbar ของ filmstrip และ bottom preview ถูกซ่อน; คง scroll ด้วยล้อ/ลากเมื่อรายการหน้าเกินพื้นที่
- `npm run test:basic`: 448 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/template-navbar-size-runtime.js`: ผ่าน; 4 หน้าแสดงบนแถบกว้าง 542px, bottom scrollbar/corner ซ่อน, ไม่มี document horizontal overflow; Ctrl+D/Delete ทำงาน; appData แยก, ไม่ส่งงานพิมพ์; screenshot `test-results/template-navbar-size.png`
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF ใน working tree; coverage gaps ทั้งระบบด้านล่างยังเปิดอยู่

### ผลรอบ v0.934 — 2026-10-15

- ปรับความกว้าง filmstrip ให้พอดีกับจำนวนหน้า; เมื่อเกินพื้นที่จะแสดง horizontal scroll และยังใช้ปุ่มเพิ่มหน้าได้
- context menu แสดง/ทำงาน Ctrl+C, Ctrl+V, Ctrl+D, Ctrl+Enter และ Delete; รับคีย์ลัดเฉพาะ focus บน tab/menu และไม่ดักคีย์ใน input หรือเรียก object shortcut
- `test/template-pages.test.js`: ตรวจความกว้าง 1/3/20 หน้า, เงื่อนไข scroll และการทำงานคีย์ลัด 5 แบบโดยไม่เรียก object shortcut
- `npm run test:basic`: 448 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/template-navbar-size-runtime.js`: ผ่าน; 2 หน้าใช้ความกว้าง 302px, Ctrl+D เพิ่มหน้าและ Delete ลบหน้า, มีป้าย Ctrl+D; ใช้ appData แยก ไม่ส่งงานพิมพ์; screenshot: `test-results/template-navbar-size.png`
- `git diff --check`: ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF ใน working tree; coverage gaps ทั้งระบบด้านล่างยังเปิดอยู่

### ผลรอบ v0.933 — 2026-10-15

- พื้นไม้บรรทัดนอกพื้นที่กระดาษกลับมาโปร่งใส โดยยังคงพื้นบนช่วงที่วัดกระดาษสำหรับตัวเลขและขีดทั้งแกน X/Y
- `test/ruler-labels.test.js`: เพิ่มเคสช่วงทึบเฉพาะขนาดกระดาษและการ clip ที่ขอบ viewport
- `npm run test:basic`: 446 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/ruler-appearance-runtime.js`: ผ่าน; ตรวจ alpha pixel ด้านใน/นอกกระดาษสองแกน รวมหน่วย in, mm, dots; appData ชั่วคราว ไม่ส่งงานพิมพ์จริง
- `git diff --check`: ผ่าน; coverage gaps ทั้งระบบด้านล่างยังเปิดอยู่

### ผลรอบ v0.932 — 2026-10-15

- เปลี่ยนแท็บ Template เป็น filmstrip thumbnail พื้นเข้ม มีภาพ SVG ของแต่ละหน้า, เลขหน้า, active outline, เลื่อนแนวนอนและปุ่มเพิ่ม; คงการคลิกเลือก/ลากเรียง/Rename และ context menu
- `test/template-pages.test.js`: เพิ่ม coverage ของภาพแต่ละหน้า, เลข, ขนาด, accessible label และการเลือก; ชุดเดียวกันยังตรวจ reorder และ Rename
- `npm run test:basic`: 444 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/template-navbar-size-runtime.js`: ผ่าน; 2 หน้า render SVG จริง, 112×64px, bar สูง 84px, dark rail, เลขหน้าและ selected state; ใช้ appData ชั่วคราว ไม่ส่งงานพิมพ์
- ตรวจภาพ runtime ที่ `test-results/template-navbar-size.png`; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.931 — 2026-10-15

- เพิ่ม corner resize markers ที่มุมขวาบนและซ้ายล่างของ linear barcode โดยไม่เปลี่ยน resize hit targets
- `test/svg-selection-handles.test.js`: เพิ่ม DOM unit ให้ barcode แสดงเฉพาะมุม ne/sw และเก็บพฤติกรรม SVG/raster/table
- `npm run test:basic`: 443 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/svg-selection-bounds-runtime.js`: ผ่าน; SVG corners ทั้งสี่คง visibility และ Barcode แสดงมุม ne/sw; fixture ใช้ appData ชั่วคราว ไม่ส่งงานพิมพ์
- `git diff --check`: ผ่าน มีคำเตือนมาตรฐาน LF/CRLF; coverage gaps ทั้งระบบยังเปิดอยู่

### ผลรอบ v0.930 — 2026-10-15

- เพิ่ม padding ซ้าย/ขวาข้อความแท็บ Template จาก 7px เป็น 12px; DOM regression และ `electron test/template-navbar-size-runtime.js` ตรวจค่าจริง
- `npm run test:basic`: 442 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/template-navbar-size-runtime.js`: ผ่าน; 18px font, bar สูง 38px, 2 tabs, padding ซ้าย/ขวา 12px, ไม่มีข้อความล้น; ใช้ appData ชั่วคราวและไม่ส่งงานพิมพ์
- `git diff --check`: ผ่าน มีคำเตือนมาตรฐาน LF/CRLF; coverage gaps ทั้งระบบยังเปิดอยู่

### ผลรอบ v0.929 — 2026-10-15

- แก้ CSS Print dialog ให้ display:flex เฉพาะเมื่อ open; เมื่อปิดต้อง display:none และไม่มี layout box ทั้งตอน startup และหลัง Cancel/X
- เพิ่ม DOM regression ตรวจ computed display ตอนเริ่ม เปิด ปิด Cancel และปิด X; Electron runtime ตรวจพื้นที่จริงและ hit target อยู่เหนือ navbar
- `npx electron test/runtime-ui.js`: เคส Print ผ่านทั้งหมด; ภายหลังหยุดที่ Help icon assertion เดิม ไม่ส่งงานพิมพ์และใช้ appData ชั่วคราว
- รัน basic suite ทั้งหมดหลังการแก้; รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`; coverage gaps ทั้งระบบข้างบนยังเปิดอยู่

### ผลรอบ v0.928 — 2026-10-15

- แก้ Ctrl+P auto-repeat ที่เปิด Print dialog ซ้ำหลัง Cancel; เพิ่ม unit regression สำหรับ renderer และตัวกรอง Electron shortcut
- `npm run test:basic`: 441 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/runtime-ui.js`: PASS สำหรับ Print ปิดอยู่ตอน startup, Ctrl+P ครั้งแรกเปิด และ key repeat ไม่เปิดซ้ำ; ภายหลังหยุดที่ Help icon assertion เดิม
- `git diff --check` ตรวจหลังแก้; ไม่ได้ทดสอบเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.927 — 2026-10-15

- แก้ปุ่ม footer ของ New Label Wizard ไม่ให้ไอคอน/ข้อความล้นกรอบ; ปุ่มไม่หดและ wrap เมื่อหน้าต่างแคบ พร้อมปรับขอบ/ระยะและปุ่ม Finish
- `npm run test:basic`: 439 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/runtime-ui.js`: PASS สำหรับ wizard footer; script หยุดที่ Help icon assertion เดิมซึ่งไม่เกี่ยวกับ Wizard
- `git diff --check` ตรวจหลังแก้; ไม่ได้ทดสอบเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.926 — 2026-10-15

- แก้ปุ่ม X ของ Print modal ให้ปิดเสมอแม้ `savePrefs()` ล้มเหลว; Cancel ปิดโดยไม่บันทึก preference
- `npm run test:basic`: 438 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- `npx electron test/runtime-ui.js`: PASS สำหรับ Print titlebar Close และ Cancel; จากนั้น script หยุดที่ Help icon assertion เดิมที่ไม่เกี่ยวกับ Print modal
- `git diff --check` ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF ใน working tree
- ไม่ได้ทดสอบเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.925 — 2026-10-15

- แก้ root cause ที่ Project Home z-index 2000 บัง floating wizard layer 1000; ปรับ Home เป็น 999 เพื่อให้ Create a New Label เปิด wizard ด้านหน้า
- เพิ่ม `test/project-home.test.js`; `npm run test:basic`: 436 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- Electron `npx electron test/runtime-ui.js`: CTA click เปิด wizard เหนือ Home ผ่าน; script ไป fail ที่ assertion Help icon เดิมก่อนหน้าการตรวจ runtime ส่วนอื่น
- `git diff --check`: ตรวจหลังแก้ไข; ไม่ได้ทดสอบเครื่องพิมพ์จริง

### ผลรอบ v0.924 — 2026-10-15

- ยก z-index ของ floating modal ทุกครั้งที่เปิดให้พ้น navbar fixed และให้ modal ใหม่แสดงเหนือ modal ที่เปิดก่อนหน้า
- เพิ่ม DOM regression ใน `test/modal-windows.test.js` และ Electron assertion ใน `test/page-setup-runtime.js`
- `npm run test:basic`: 435 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- Electron `npx electron test/page-setup-runtime.js`: PASS ด้วย appData ชั่วคราว รวม assertion ว่า Page Setup อยู่เหนือ navbar
- `git diff --check`: ผ่าน มีคำเตือนมาตรฐาน LF/CRLF ใน working tree
- ไม่ได้พิมพ์กับเครื่องจริง; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.915 — 2026-10-15

- เพิ่ม prompt เมื่อขนาด template เปลี่ยนตั้งแต่ 10%; No รับขนาดใหม่โดยคง object, Yes เปิด Scale Templates, Cancel/Escape เก็บ draft Page Setup และ OK ปรับ artwork เพียงครั้งเดียวพร้อม undo/persist
- Scaling รองรับกฎ Text (proportional/free แยกแกน), Barcode (proportional/free), Picture, Line, shape และ table ที่เก็บเป็น image; ครอบคลุมทุกด้านและ template page พร้อมรักษา metadata/bitmap
- `node --test test/template-scaling.test.js`: 13 passed, 0 failed, 0 skipped; `node --test test/page-setup.test.js`: 29 passed, 0 failed, 0 skipped
- `npm run test:basic`: 424 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory gap 0. รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`
- Electron `npx electron test/page-setup-runtime.js`: PASS ด้วย temporary appData; ครอบคลุม No, Yes → Scale Templates → OK, modal Cancel, free-text metrics, artwork หลายชนิด, table axes, ทุกด้านและ saved pages; screenshot อยู่ใน appData ชั่วคราว `.../qlabel-page-setup-3SNG53/page-setup.png`
- `git diff --check`: ผ่าน; มีเฉพาะคำเตือนมาตรฐาน LF/CRLF ใน working tree
- ไม่ได้พิมพ์กับเครื่องจริงหรือทดสอบ BarTender UI; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.914 — 2026-10-15

- Layout preview แสดงลูกศรสองหัวคร่อม gap จริงระหว่างช่อง label สำหรับแนวนอนและแนวตั้ง โดยแสดงแม้ไม่ได้โฟกัสช่อง input
- `test/page-setup.test.js`: 23 passed, 0 failed, 0 skipped; Electron `test/page-setup-runtime.js` ผ่านหลัง retry หนึ่งครั้งที่หมดเวลา โดยใช้ appData ชั่วคราว
- `npm run test:basic`: unit 405 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory ขาด 0
- `git diff --check` ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF ใน working tree
- ไม่ได้ทดสอบเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.913 — 2026-10-15

- ขยับป้ายชื่อ object ให้ชิดเส้นกรอบเลือก โดยคงขนาดเมื่อซูมและ pointer-events none
- `test/object-selection-name.test.js`: 3 passed, 0 failed, 0 skipped; Electron `test/object-selection-name-runtime.js` ผ่านสำหรับ object ทุกชนิด, multi-select, rotation และ artwork
- `npm run test:basic`: unit 404 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory ขาด 0
- `git diff --check` ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF ใน working tree
- ไม่ได้ทดสอบเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.912 — 2026-10-15

- แก้ปุ่ม OK ใน Page Setup ให้กู้ draft gap ที่ใช้ไม่ได้กลับเป็น gap ล่าสุดที่ปลอดภัย แล้วบันทึกแถว/คอลัมน์ที่เลือก
- `test/page-setup.test.js`: 22 passed, 0 failed, 0 skipped
- Electron `test/page-setup-runtime.js` ผ่านบน appData ชั่วคราว รวมการกดยืนยันด้วย gap 100 mm และตรวจว่าบันทึกคอลัมน์ 2 พร้อม gap เดิมที่ใช้ได้
- `npm run test:basic`: unit 404 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory ขาด 0
- `git diff --check` ผ่าน; มีคำเตือนมาตรฐานเรื่อง LF/CRLF ใน working tree
- ไม่ได้ทดสอบเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.911 — 2026-10-15

- แก้สาเหตุ preview แสดง object ในแท็บ Page Setup และคอลัมน์ค้างเมื่อ gap เดิมใหญ่กว่าพื้นที่กระดาษ
- เคสใหม่ใน `test/page-setup.test.js`: Page Setup ซ่อน artwork แต่ editor preview ยังแสดง; column commit และ gap field กลับมาใช้งานได้หลังเจอ invalid saved gap
- `npm run test:basic`: unit 403 passed, 0 failed, 0 skipped; legacy scripts 3/3 passed; inventory ขาด 0
- `node --test test/page-setup.test.js`: 21 passed, 0 failed, 0 skipped
- Electron `test/page-setup-runtime.js` ผ่านบน appData ชั่วคราว: invalid gap เก่าถูกกู้คืน, preview 2 คอลัมน์, Page Setup ไม่มี object, editor preview ยังมี object; screenshot: `%TEMP%/qlabel-page-setup-nQZoc8/page-setup.png`
- `git diff --check` ผ่าน (มีเพียงคำเตือน line endings LF/CRLF)
- ไม่ได้ทดสอบเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่

### ผลรอบ v0.910 — 2026-10-15

- แก้ Layout preview ให้แสดงช่องกระดาษว่างครบตามจำนวนแถว/คอลัมน์ แม้เปิด Set Manually; artwork ยังแสดงในแท็บ Page
- `npm run test:basic`: unit 402 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0
- Electron `test/page-setup-runtime.js` ผ่านบน appData ชั่วคราว: ช่องว่าง 2×2, ไม่มี artwork ใน Layout, artwork ยังอยู่ใน Page, manual dimensions, gaps/focus, capabilities และ Cancel rollback
- `node --test test/page-setup.test.js`: 20 passed, 0 failed, 0 skipped; `git diff --check` ผ่าน (มีเพียงคำเตือน line endings LF/CRLF)
- ไม่ได้ทดสอบเครื่องพิมพ์จริง; coverage gaps ทั้งระบบที่ระบุด้านล่างยังเปิดอยู่
- รายงาน: `test/basic-unit-result.json`, `test/basic-unit-output.log`; Electron screenshot ใช้ไฟล์ชั่วคราวตาม appData ในผล runtime

### ผลรอบ v0.909 — 2026-10-15

- พฤติกรรมที่เปลี่ยน: Layout ใช้ preview กลาง; หลายคอลัมน์/แถวเปิด layout และ Gap ตามแกนทันที; ขนาด manual และ automatic gap สะท้อนใน preview; focus แสดงระยะ; invalid gap ไม่เปลี่ยน preview
- ปรับ inventory ของ page-setup.test.js และ checklist แถว 15; เพิ่ม DOM regression 3 เคส
- npm run test:basic: unit 402 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0
- Electron test/page-setup-runtime.js ผ่าน: preview กลางมองเห็น, Columns=2 เปิด Horizontal gap, 2 cells อัปเดตจริง, manual dimensions และ focus dimension; appData แยก; focus event ส่งเองใน hidden window ตามข้อจำกัด Chromium
- git diff --check ผ่าน; ไม่มีการทดสอบ printer จริงหรือยืนยัน native BarTender ครบทุก behavior; coverage gaps ทั้งระบบด้านบนยังเปิดอยู่
- อ้างอิง binary resources และขอบเขตที่พิสูจน์ได้: docs/bartender-layout-analysis.md
- รายงาน basic: test/basic-unit-result.json และ test/basic-unit-output.log


### ผลรอบ v0.905 — 2026-10-15

- `npm run test:basic`: unit 393 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0
- Electron `test/page-setup-runtime.js` ผ่านบน appData ชั่วคราว: primary tabs และ Stock sub-tabs เรียงถูกต้อง, encoder/tray/Wizard disabled พร้อมเหตุผล, Shape control เปลี่ยน model ทันที และ Cancel คืนค่าเดิม
- Page Setup DOM unit: `test/page-setup.test.js` 15 passed, 0 failed, 0 skipped
- ไม่มีการทดสอบ BarTender UI หรือเครื่องพิมพ์จริง; RFID, Magnetic Stripe และ tray/source ยังคง disabled เพราะ Q LABEL ไม่มี implementation/output path ที่รองรับ
- รายงาน basic: `test/basic-unit-result.json`, `test/basic-unit-output.log`

### ผลรอบ v0.906 — 2026-10-15

- เพิ่มการอ่าน `Choices` ของ `media.printmode` จากรายงาน `allcv` และบันทึกโหมดที่ printer ระบุว่ารองรับใน profile; โหมดที่ไม่ยืนยันยัง disabled และ legacy mode ที่ไม่มี capability จะถูกพิมพ์เป็น Tear-off โดยไม่แก้ข้อมูลเอกสารต้นฉบับ
- `npm run test:basic`: unit 397 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0
- Electron `test/page-setup-runtime.js` ผ่านบน appData ชั่วคราว: tab/sub-tab order, encoder/tray/Wizard disabled, unknown modes disabled, profile capability enablement, Shape update และ Cancel rollback
- `node --test test/page-setup.test.js test/page-setup-capabilities.test.js test/print-regressions.test.js test/printer-media-profile.test.js`: 50 passed, 0 failed, 0 skipped
- ไม่ได้เชื่อมต่อ/พิมพ์กับเครื่องจริงหรือทดสอบ BarTender UI; `allcv` ที่ไม่มี `Choices` สำหรับ `media.printmode` จะยังคงสถานะ unknown และปิดโหมด P/C/R; ช่องว่าง coverage ทั้งระบบที่ระบุด้านบนยังเปิดอยู่
- รายงาน basic: `test/basic-unit-result.json`, `test/basic-unit-output.log`

### ผลรอบ v0.904 — 2026-10-15

- `npm run test:basic`: unit 392 passed, 0 failed, 0 skipped; legacy scripts 3/3 ผ่าน; inventory ขาด 0
- Electron `formatting-line-spacing-runtime.js`: ผ่าน วัด clearance ระหว่าง Line style กับ label `Line` ได้ 11px และ label ไม่ชนช่องตัวเลข
- `table-ribbon-runtime.js`, `table-ribbon-switch-runtime.js`, `action-button-ui-runtime.js`, `ribbon-history-order-runtime.js` และ `ribbon-availability-runtime.js`: ผ่าน
- `runtime-ui.js`: fail ที่ Help icon assertion เดิม หลัง startup, version และ repeated Text select/deselect ผ่าน; เป็น coverage gap ที่ยังเปิดอยู่
- ทดสอบฮาร์ดแวร์/จอจริง: ไม่เกี่ยวกับ spacing นี้
- รายงาน basic: `test/basic-unit-result.json`, `test/basic-unit-output.log`

```text
Version:
พฤติกรรมที่แก้ / unit cases ที่เพิ่มหรือปรับ:
UNIT_TEST_BASIC.md: อ่านและปรับรายการใด / เคสเดิมใดเพียงพอ
คำสั่ง basic: npm run test:basic
unit passed / failed / skipped:
legacy basic scripts passed / failed:
inventory ที่ยังขาด:
coverage gaps ที่ยังเปิด:
runtime checks ที่รันจริงและผล:
hardware checks / ข้อจำกัด:
รายงาน: test/basic-unit-result.json และ test/basic-unit-output.log
```

ผลทดสอบเก่าไม่ใช้แทนผลหลังการแก้ครั้งล่าสุด ถ้าเกิดการแก้ไขหลัง test ผ่านแล้ว ต้องรัน basic suite ทั้งหมดอีกครั้ง






เมื่อ `init()` ล้มเหลว startup error panel ต้องอยู่เหนือ Ribbon/preview, แสดงข้อความ exception เต็มแบบตัดบรรทัดได้ และส่ง keyboard focus ไปที่ Reload application (`test/startup-error-ui.test.js`).

Data Sources core checkpoint 2026-10-17: source-model tests cover Duplicate before rendering, clipboard import without ID/name overwrite, unnamed dependency clones and shared named definitions. Resolver tests cover explicit printer-clock fallback; types/transforms/counter/session tests cover pure evaluation and cancellation. UI/adapter/output parity and hardware comparison remain in progress.

Core checkpoint 2: source-session tests invalidate prepared artwork on symbology/options/font/GS1 changes; source-resolver/source-transforms tests cover actual neighbors, standalone suppression, named conditions, whole-source suppression and exact binary truncation/concatenation. Native binary QR/Data Matrix comparison remains unfinished.

Matrix checkpoint: source-matrix encoder tests cover QR/Data Matrix00FF1D byte input and validation; source-session tests require matrix preparation for native QR. End-to-end SVG/canvas/ZPL fixture is in the pending integration work; hardware and independent decoder comparisons remain outstanding.

Session snapshot checkpoint: source-session async evaluation consumes prepared adapter snapshots at the evaluator context level and preserves input fields; late revision/cancel guards remain covered.

Offset/range core checkpoint: source-resolver and source-transforms tests cover database/named/PCT offsets, database-record detection, malformed date bounds and reversed ranges. Source-specific UI and external-dependency adapter coverage remains in the pending integration changes; native month/year/DST and data-entry timing remain unverified.

Data Sources core fraction checkpoint: explicit quarter and nearest 1/999 precision, custom denominator and invalid-zero validation (`test/source-types.test.js`). Full basic suite required; native default compatibility remains unverified.

Prepared preview core checkpoint: runtime PCT, locale, timezone, printer, explicit clock and job context invalidate snapshots; unchanged redraw reuses its snapshot (`test/source-session.test.js`).

| `test/source-wizard.test.js` | staged New Source/Cancel/Finish, duplicate-name validation, named default links, owned dialog disposal and late GS1 cancellation/revision guards / DOM unit |

Source wizard module checkpoint: creating a source mutates only on Finish; Cancel/dispose preserve draft. GS1 late results after cancel/dispose/new revision cannot overwrite data. Full desktop wiring remains an integration checkpoint, not a completed parity release.

GS1 pending compilation locks editable fields/add/remove/Finish while Cancel remains enabled; cancellation preserves data (`test/source-wizard.test.js`).

| `test/source-vbscript.test.js` | actual Windows Script Host result, Unicode, named field bridge, errors and timeout / Windows integration |
| `test/source-picture.test.js` | decoded image bytes, sizing and color conversion / encoder integration |
| `test/source-gs1.test.js` | actual GS1 FNC1/checksum/AI/date validation and HRI / encoder integration |

Adapter primitives checkpoint: VBScript bridge is a documented subset; picture codec availability and GS1 complete native compatibility remain unfinished. No physical printing is used.

Wildcard/search operations checkpoint: all five installed-help Cutter examples, CR/LF boundary rules, escaped/hex characters, consecutive stars, invalid terminal star, Delete/InsertBefore/InsertAfter and legacy regex compatibility (`test/source-transforms.test.js`). Syntax/Action/All Occurrences controls execute the configured transform (`test/source-wizard.test.js`). Native XML import/export and complete regex dialect compatibility remain open.

Named link checkpoint: New Source references the original named definition directly and exposes its type/config editor; changes propagate through all refs. Canonical12 kinds are retained, while Link is offered only when a named target exists as the installed help specifies; stale unnamed targets reject without mutation (`test/source-wizard.test.js`).

| `test/source-ledger.test.js` | durable ledger, concurrent nonoverlapping reservations, idempotency/restart, unsent rollback/unknown hold and special source identities / unit |

Ledger checkpoint: preview never consumes state, accepted/unknown values are retained and rollback for source ID __proto__ preserves the accepted range. Counter-state map uses own properties for every valid ID. Print/host integration and manual unknown-outcome recovery remain separate work.
Special characters: picker แทรก control bytes จริง (GS/NUL/CR/LF) แทน selection, Unicode scalar รวม emoji, reject surrogate/ค่าผิด, คง CRLF เมื่อแก้ข้อความต่อ, Cancel/stale revision/dispose ไม่เขียนข้อมูล และ New Source ยัง staged จน Finish (`test/source-wizard.test.js`). Control Characters/Symbols สลับกลับค่าเดิมได้. Electron fixture เปิด picker จาก Properties จริงและ parent Cancel คืนเอกสารเดิม; ไม่ส่งพิมพ์จริง. Native font/subset/recent และ private-use NUL ยังไม่ verified.

Change Data Source Type: staged wizard defers replacement until Finish, Cancel preserves the source and stale revisions reject. Kind replacement clears prior datatype/transforms per installed Data_Source_proc_changeType.htm, retaining shared definition identity; quick dropdown uses the same reset rule (`test/source-wizard.test.js`). Isolated Properties runtime covers wizard cancellation.

Change Data Source Name: staged assign/rename/remove until Finish, Cancel/duplicate error preserve draft, shared definition identity and values remain intact, stale revision/dispose prevent late writes (`test/source-wizard.test.js`). Electron fixture verifies wizard Cancel. Rewriting textual script/file/transform dependencies remains unfinished.

Named dependency rename: model and wizard/inline names atomically update named file pathSource, named offsets and suppression references, retaining calculated values/IDs and unrelated database fields. Removing an explicitly referenced name rejects without mutation (`test/source-model.test.js`, `test/source-wizard.test.js`). Script and expression dependencies remain unfinished.

Fraction DLL evidence: up-to-digit modes search candidate denominators; fixed quarter/eighth modes preserve denominators, reduced modes choose smaller candidates; measured mixed/improper, negative and near-integer output plus legacy custom denominator tests (`test/source-types.test.js`, `test/source-wizard.test.js`). Vendor SHA256 AF5E887ACE65E07537B95E75A10740A5481F85BAA667DF5C6980F8BD4234737D. Full decimal/locale/final native object comparison remains incomplete.

Source adapters checkpoint: actual external files/phrase JSON/WSH/compression/serialization/PCT and catalog byte artwork are covered in `test/source-adapters.test.js`. Shared script-reference tokenizer ignores comments and ordinary strings, preserves static named references through rename, and renamed scripts execute under real WSH (`test/source-model.test.js`, `test/source-vbscript.test.js`). File tokens also follow names; computed script names and legacy/cross-document expressions remain incomplete. Catalog encoder and category helper are included as adapter dependencies.

| `test/source-ipc.test.js` | standalone preview IPC: external serial start without consumption, file/directory picker cancellation/path and actual global settings propagation into a named VBScript source / unit integration |

Source IPC test extraction preserves the existing external-start/no-ledger assertions unchanged from the pending serialization integration. Desktop print and main/preload wiring remain separate integration work.

Prepared source snapshots preserve reserved-key source IDs such as __proto__ as own properties for values and diagnostics through JSON/IPC; per-source transform maps use the same dictionary rule (`test/source-adapters.test.js`).

| `test/object-data-sources-ui.test.js` | ordered source UI, three tabs, Properties draft/Apply/Cancel, GS1 and stale dialogs / DOM unit |
| `test/source-properties-navigation.test.js` | Properties sidebar ใช้ Data Sources แทนเมนู Data Type/Transforms ซ้ำ; fallback และค่าจากไฟล์เก่าคงอยู่ / DOM unit |
| `test/source-output-parity.test.js` | preview/SVG/canvas/ZPL source parity, HRI versus bars, binary matrices and lossless field escapes / integration |
| `test/source-serialization.test.js` | desktop preview without consumption, serial print outcomes, interval continuity and PCT/copy-count discovery / integration |
| `test/source-hosts.test.js` | HTTP/CLI async preparation, per-job file freshness, dry-run, serial reservation rollback and unknown transport / host integration |
| `test/source-library.test.js` | vendor-generated Data Builder plain XML text libraries, phrase/language lookup, preserved string data, malformed XML/DTD/duplicate validation / unit |

Data Builder PlainXml fixture was generated with installed BtDataSet/BtDataSetAdapter and replayed using native DataBuilderXmlSerializer. Independent adapter resolves greeting/Hello/ThaiU+0E01, rejects missing/nontext libraries and preserves zeros/whitespace/reserved phrase IDs (`test/source-adapters.test.js`, `test/source-library.test.js`). SQL-backed/encrypted/legacy, identity/version, native authoring and full lifecycle remain incomplete.

Library inspection/picker: actual file metadata feeds library/phrase/language choices and live value preview; Cancel defers mutation, Use resolves the chosen native file value, stale/disposed inspection is ignored, typing a file enables Browse without rebuilding the input (`test/source-library.test.js`, `test/source-ipc.test.js`, `test/source-wizard.test.js`). Isolated Electron exercises Properties/preload/inspection/native phrase picker/Thai preview/parent Cancel; main/preload/parent wiring remains separately staged integration.

Properties navigation: modern editor hides duplicate Data Type/Transforms sidebar entries, preserving legacy values and fallback. DOM checks: test/source-properties-navigation.test.js; isolated Electron: test/object-data-sources-runtime.js.

Source hosts: shared async preparation snapshots every record before transport, CLI dry-run never reserves or sends, invalid connection fails before serial reservation; disk errors rollback while uncertain transport holds numbers. Real loopback HTTP with mock print transport checks globals, copies and fresh files; test/source-hosts.test.js. No physical printing.

Desktop source IPC wiring: main registers preparation/file/directory/library/GS1 handlers and preload exposes the corresponding methods; preview and HTTP server share settings/serial store. Reuses test/source-ipc.test.js and isolated object-data-sources runtime nativeLibraryPicker/parent Cancel assertions; Properties and print runtime integration are separate pending checkpoints.

Properties integration: source session keeps all changes on draft, Apply validates/commits shared definitions and snapshots, Cancel restores document. Three tabs edit source-scoped values; async source completion refreshes draft preview. Double-click/Alt+Enter opens Properties; renderer uses SourcePreview with current settings and redraws on prepared inputs. Existing isolated runtime checks shared edits/undo/save/cancel and preview/print equality. DOM source integration19/19 checked against selectively staged parent implementation; image/font/media changes remain outside this checkpoint.

Desktop print source integration: shared async preparation, durable reservation, invalid-connection preflight, successful/unknown send outcome, preview without consuming counters, interval remainder and correct initial PCT/copies context. Selectively staged runtime passes4/4 with committed print-job/ZPL baseline, using mock transport; existing basic print regressions cover non-retry on ambiguous Windows/TCP outcomes. No real printing. Photo/media/table-overflow integration remains outside this checkpoint.

Output source integration: Character Template affects HRI while bars retain encoded data; UTF-8/control/ZPL command characters escape at field boundary without deletion/injection; pending catalog artwork is rejected. Prepared QR/DM explicit bytes 00FF1D produce matching SVG/canvas/ZPL raster geometry. Selectively staged ZPL+committed print-job passes8/8 source-output-parity cases. Encoder parity is not a physical printer/native-reference comparison.

Version1.005 integration checkpoint: rerun npm run test:basic and isolated object-data-sources runtime after version update; native/reference/hardware gaps remain documented and are not a claim of 100% parity.

Native basic Character Filter: test/source-transforms.test.js compares931 single-character cases against actual Seagull.Forms.Controls DataEntryTextBox for7 modes; separate ASCII sets preserve earlier Unicode modes. test/source-wizard.test.js checks options, evaluator and new All default. Electron test/source-character-filter-runtime.js confirms Currency preview/commit/prepared-print equality in isolated appData without printing. Fixture provenance: test/fixtures/native-character-filter.md. Input Mask/regex, warning/order and native print-time behavior remain unverified. Version1.006.

Extended date patterns: test/source-types.test.js compares280 direct native formatter cases across year/leap boundaries and checks timezone civil-date rollover; test/source-wizard.test.js edits the Date pattern while retaining raw input. Isolated Electron test/source-date-pattern-runtime.js confirms Properties preview/commit/prepared-print equality without sending. Provenance: test/fixtures/native-date-patterns.md. Native input parsing, @patterns, legacy IDs and full calendar/locale matrices remain gaps. Version1.007.

| `test/source-serial-print-dialog.test.js` | Serial quantity from object sources, Preview Next/Last/First and zero transport / DOM unit |

Serial preview: `test/source-serialization.test.js` checks ten serials with two identical copies, zero padding, preview/ZPL equality, no preview ledger and ten-value reservation. `test/source-serial-preview-runtime.js` checks actual barcode SVG changes across ten pages with isolated appData and no printing.

Multi-item source serialization: three generated pages reserve three values and the next job starts0004 (`test/source-serialization.test.js`).

| `test/source-save-icon.test.js` | Data Source Save primary background, white text/SVG and floppy geometry / DOM unit; Electron `test/source-save-icon-runtime.js` verifies real computed colors |

Serial quantity native flow: `test/source-serial-print-dialog.test.js` checks direct Serial numbers / Copies per serial number labels, hidden redundant opt-in, optimization checkbox independence, no RAW query on open, and sidebar Save & bind updates barcode_spec/source graph with stable IDs. `test/source-serialization.test.js` checks legacy sidebar source prefix/digits, identical copies, preview without ledger writes and next0011 after accepted reservation. Electron `test/serial-sidebar-flow-runtime.js` creates a barcode via the insert command then uses the sidebar dialog without presetting serialization; verifies actual rendered pages1/2/10 and reopening preparation unchanged.

Nested legacy source serialization: references such as Wrapped -> Serial1 reserve the underlying counter and the next accepted job starts0011, covered by test/source-serialization.test.js.

| `test/canvas-text-caret.test.js` | เคอร์เซอร์อิงขอบหมึกตัวอักษร ไม่หลุดตาม advance width; ต้น/กลาง/ท้ายข้อความ สเกลแนวนอน และช่องว่าง / unit |
Canvas text caret: Electron `test/canvas-text-caret-runtime.js` ตรวจเส้นเคอร์เซอร์อยู่ในกรอบเขียวขณะพิมพ์ 1 → 12, เลือกข้อความซ่อน caret, collapse แสดงอีกครั้ง, Escape คืนข้อความและล้าง overlay; ทดสอบหมุน0/45/90° และ zoom1/1.5 ใน appData แยก ไม่พิมพ์จริง.

Properties layout: `test/source-properties-navigation.test.js` ตรวจ root flex column, body min-height0 และ scroll boundary พร้อม header/footer ไม่ยุบ; Electron `test/properties-layout-runtime.js` เปิด Data Sources → Transforms ใน viewport900×650 ตรวจ main/Preview ไม่ล้น footer, footer กดได้และไม่เลื่อนตาม body ใน normal/resized/maximized/restored.

| `test/home-save-prompt.test.js` | Home ไม่รายงาน hidden editor dirty, navigation ไม่ถามหรือบันทึกเบื้องหลัง, คง dirty flags และ Editor Cancel guard / DOM unit |
Home Save prompt: Electron `test/home-save-prompt-runtime.js` สร้าง dirty draft ในโปรไฟล์แยก ตรวจ Editor navigation Cancel ยังป้องกันงานค้าง จากนั้นแสดง Home แล้ว close state/navigation/saveBeforeClose ไม่ถาม Save และปิด native BrowserWindow ได้จริง โดยไม่พิมพ์หรือแก้ไฟล์งานจริง.

Text native transform menu: test/object-data-sources-ui.test.js ตรวจ Text9รายการ/ลำดับตาม fixture, คง configured extensions แม้ disabled โดยไม่แก้ processing order และสลับ Number→Text; Electron test/source-text-transform-menu-runtime.js ตรวจ Properties จริง, prefix/suffix commit/cancel และ prepared print ตรงกันใน appData แยก ไม่ส่งพิมพ์. Native ID-to-label mapping, non-Text matrix และ full transform semantics ยังไม่ยืนยันครบ.

Native typed transform menus: test/object-data-sources-ui.test.js ตรวจรายการ/ลำดับ9ชนิดจาก native capability + BtEnu resource mapping และ configured extensions ของ non-Text; Electron test/source-text-transform-menu-runtime.js สลับครบ9ชนิดและคืน Text ก่อนตรวจ commit/cancel/prepared print. fixture test/fixtures/native-transform-menus.json บันทึก SHA ทั้ง2ไบนารี, control IDs และ display loop; special source branches และ full transform execution ยังเป็นช่องว่าง.

Native Print Job transform restriction: test/object-data-sources-ui.test.js ตรวจ Print Job Fields ของ Text/Number/Date แสดงเฉพาะ Suppression และคง legacy extensions โดยไม่แก้ draft; sourceOverrides ใน native-transform-menus.json อ้าง RTTI PrintJobFieldDs kind9 + native page filter, ไม่ใช้ capability array เพียงอย่างเดียว.

Source context menu: test/object-data-sources-ui.test.js verifies native seven-command ordering, right-click selection, Copy/Paste/Delete/reorder evaluated output, disabled boundaries, Shift+F10, keyboard navigation, Escape and disposal. Electron test/source-text-transform-menu-runtime.js checks menu placement inside the viewport and Properties modal, disabled commands and clipboard state. Full native tree styling and all dialogs remain unverified.

Source keyboard scope: Ctrl+X/C/V/Delete and Ctrl+Up/Down work while the source context menu owns focus; canvas global handlers must not intercept source editor or nested source dialogs. Plain arrows/Home/End select without reordering. Covered by test/object-data-sources-ui.test.js and actual renderer Copy in test/source-text-transform-menu-runtime.js.

Reference Data Sources dialogs: test/source-wizard.test.js verifies staged Description None/custom, stale revision/disposal, Named Source linking with shared evaluated output, Unicode currency grid and recent selection, all33 control rows and actual GS insertion. test/object-data-sources-ui.test.js checks Properties sources live in sidebar with no duplicate list. Electron test/source-text-transform-menu-runtime.js checks actual sidebar/menu routing, Description commit and Symbols Cancel. Native full standard-term catalog, full font/subset coverage, persistent recents and all wizard screens remain gaps.
Reference button rendering: test/source-wizard.test.js runs the global action decorator and asserts native symbol/Insert captions gain no unwanted SVG; Symbols precedes Control Characters, initial Unicode Space, Close leaves source unchanged. Explicit9Unicode ranges,33control bytes and session-only8recents are covered; native complete font/subset/recent persistence remain unverified.

| `test/source-editor-theme.test.js` | Modern Data Sources theme: rounded fields, Q LABEL selection, sidebar list only once, inline action placement and multiline top alignment / DOM unit |
Modern source styling: Electron test/source-text-transform-menu-runtime.js waits for stylesheet load and measures inline action alignment, textarea heading alignment and large symbol glyphs while retaining all command/evaluator assertions. Layout placement follows native reference; visual theme uses modern Q LABEL surfaces.

Transform tool dialogs: test/source-wizard.test.js opens all9Text tools and verifies staged OK/Cancel, stale revision/disposal, real Prefix/Suffix output, Unicode right-side truncation and async Test Script candidate/Cancel/input locking. test/source-transforms.test.js covers independent left/right discard/keep,0,oversize and invalid Unicode counts. Electron test/source-text-transform-menu-runtime.js executes staged VBScript through actual prepareSourceInputs IPC (SCRIPT-12345678) then cancels; Prefix/Suffix OK yields identical preview/prepare-print. test/source-character-filter-runtime.js confirms currency filter via dialog OK. Full native suppression expressions, truncation decimal stripping, length warning flags, search import/export, script editor assistant and serial calendar/data resets remain gaps.
Test Transform validation: invalid visible numeric controls block candidate evaluation (test/source-wizard.test.js); the test action must not report results from the last valid local value.
Suppression dialog defaults: accepting a newly opened, unconfigured Suppression tool keeps source data (test/source-wizard.test.js). Enabling suppression remains explicit.

Source Type SVG dropdown: test/source-wizard.test.js checks12available kind icons, real staged Clock selection, Cancel, keyboard selection/Escape and disposal. Existing native select values still drive model changes. Electron test/source-text-transform-menu-runtime.js measures rendered16px SVGs in selected value and popup options and verifies Escape closes the popup.
Type SVG picker keyboard regressions: Space/Enter selects the focused option, resize dismisses safely and selection restores focus to the replacement combobox after source-page rerender (test/source-wizard.test.js).

| `test/modal-free-resize-runtime.js` | Electron actual mouse drag: width and height independently, Properties700x560minimum, footer/navigation/source field usable; isolated appData |
Free modal resizing replaces the earlier aspect-ratio requirement at user request: test/modal-windows.test.js checks all8edges/viewport bounds, content minima, document-level drag/up when capture leaves panel and stable small-dialog minimum after expansion. Properties locks700x560px (bounded by available viewport); other tool minima follow their content. Electron test/properties-layout-runtime.js retains footer/body containment through resize/maximize/restore.

| `test/focus-appearance.test.js` | Active/focus radio,checkbox,text,select,textarea,button: no extra outline/shadow, checked states and programmatic/keyboard focus retained / DOM unit |
Focus appearance: user requests no active frames globally. Removed shared focus border-color override and added shared focus/active outline+shadow suppression. Electron test/source-text-transform-menu-runtime.js verifies actual computed zero outline/no shadow on focused source field and Name radio, unchanged normal field border and checked radio. This replaces prior focus-ring styling requirements; selected/checked behavior still works.


| `test/source-empty-sidebar.test.js` | หมวด sidebar ว่างยุบอัตโนมัติ ไม่มีแถว `<None>` คงปุ่มเพิ่ม แสดงรายการค่า 0 และคงสถานะเปิดเมื่อมีข้อมูล / DOM unit; Electron runtime `test/source-empty-sidebar-runtime.js` |

- v1.025: `test/source-empty-sidebar.test.js` และ `test/source-empty-sidebar-runtime.js` ตรวจลูกศรซ่อนเมื่อไม่มีรายการและแสดงกลับเมื่อมีข้อมูล รวมถึงค่า 0; คงไอคอนหมวดและปุ่มเพิ่ม

| `test/page-add-hover.test.js` | เลื่อนเมาส์จาก caret มาปุ่ม + ปิดเมนูและ aria-expanded ทันที ไม่เพิ่มหน้าเอง คงคำสั่งคลิก / DOM unit; Electron `test/page-add-hover-runtime.js` |
