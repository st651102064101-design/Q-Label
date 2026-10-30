## File tab opens dropdown only v1.304 (2026-10-29)

- `test/ribbon-file-hover.test.js`: clicking File opens the dropdown while the previously selected ribbon tab/panel stays selected/visible and the empty File panel remains hidden.
- `npx electron test/ribbon-availability-runtime.js --file-only`: isolated Electron runtime checks the File dropdown opens without showing `#ribbon-file` or hiding the previously selected ribbon panel. The broader existing runtime reaches these File checks, then fails later at an unrelated Home `Line style` disabled-control assertion.
- REA PE-resource inspection identified installed BarTend.exe and hashed its bytes; the static resource inventory does not expose File-tab dispatch or interaction, so native BarTender behavior remains unverified.
- `npm run test:basic`: FAIL, 1,371/1,380 unit tests passed, 9 failed, 0 skipped; legacy stages passed; no undocumented test files. Failures are in existing barcode layout, retired Excel Online catalog expectations, Page Setup layout, and shape border/radius cases, unrelated to File tab. Report `test/basic-unit-result.json`.

## Close prompt while minimized v1.278 (2026-10-28)

- `test/unsaved-document.test.js`: verifies dirty close requests a reveal before prompting, clean close and sender restoration using doubles. Actual Windows taskbar close requires runtime verification.
- `npm run test:basic`: PASS v1.278, 1,340 tests, 0 failed/0 skipped; all three legacy stages passed. Report: `test/basic-unit-result.json`.

## Seven server DSN providers v1.277 (2026-10-28)

- `test/database-server-dsn.test.js`: Firebird, DB2, Informix, MySQL, MariaDB, PostgreSQL and SAP HANA driver matching, cross-provider rejection, schema/read/refresh/disposal, password omission, browser metadata, shared pending discovery and File DSN revalidation after a file change. Injected providers; no live server claim.
- `npm run test:basic`: PASS v1.277, 1,338/1,338 tests across 172 files, 0 failed/0 skipped/0 undocumented; all three legacy stages passed. Report `test/basic-unit-result.json` at `2026-10-28T09:04:32.323Z`.
- `test/database-server-dsn-runtime.js`: isolated Electron full-app flow for all seven choices through production IPC/registry using controlled driver responses; results recorded in `docs/rea-server-dsn-group-2026-10-28.md`.
- `electron --disable-gpu test/database-server-dsn-runtime.js`: PASS, all seven choices, 21 driver-fixture reads across setup/refresh, password-free saved document. `electron test/database-provider-runtime.js --xml` and `--json`: PASS with generated real files, changed-file refresh and disk reopen in isolated profiles.
- `test/database-manager.test.js`: Submit/Cancel/Escape/direct child close and parent close settle credential prompts even when native close events are delayed; late events are idempotent and passwords excluded from saved model.
- `test/database-file-provider.test.js`, `test/database-native-flow.test.js`, `test/database-setup.test.js`, `test/database-ipc.test.js`: retain existing SQL Server/Azure direct, Oracle and ODBC/OLE DB behavior.
- Actual seven-vendor drivers, real database authentication/schema and exact native pages remain unverified. No physical printing. Full suite result recorded in task evidence.

## Symbols ribbon dropdown before modal v1.275 (2026-10-28)

- `test/tis-symbols-ribbon-menu.test.js`: `.symbols-menu`, `TisSymbolMenu`, More Symbols entry, dropdown tile opens `openPicker`.
- `test/ribbon-hover-menus.test.js`: Table → Symbols hover opens dropdown via `TisSymbolMenu.open`, not the modal.

## Hide gap active hides canvas overlay v1.274 (2026-10-28)

- `test/page-gap.test.js`: default ribbon state is **Hide gap** pressed while gaps are hidden; first click reveals gaps as **Show gap**; gap overlay must not draw `[data-paper-margin-boundary]` (sharp corner lines vs rounded label face).
- `test/page-gap-runtime.js`, `test/new-project-runtime.js`: Hide gap restores single-label viewBox and removes `[data-paper-edge]` / gap bands.

## Ribbon Table → Symbols hover switch v1.273 (2026-10-28)

- `test/ribbon-hover-menus.test.js`: open Table menu then pointerover Symbols button closes `.table-menu` immediately and triggers Symbols open (no 250 ms close delay).
- `electron test/ribbon-hover-menus-runtime.js`: not rerun this change; prior note that Symbols was modal-only may need manual refresh after v1.273 registers Symbols in hover registry.

## Oracle ODBC DSN v1.267 (2026-10-28)

- `test/database-file-provider.test.js`: Oracle driver detection and DSN filtering, read and refresh, unavailable driver; injected provider fixture.
- `test/database-native-flow.test.js`, `test/database-setup.test.js`, `test/database-ipc.test.js`: Oracle DSN form, password exclusion, wizard and IPC with mocked provider responses.
- `npm run test:basic`: PASS, 1,296/1,296 tests across 169 files, 0 failed/0 skipped/0 undocumented, all three legacy checks passed. Report `test/basic-unit-result.json` (`2026-10-28T03:39:08.427Z`, display v1.267).
- Existing ODBC runtime test uses a local text driver; real Oracle driver/server and native Oracle page flow remain unverified. Full-suite result is recorded in `docs/rea-oracle-dsn-2026-10-28.md`.

## Empty Data Matrix preview v1.265 (2026-10-28)

- `test/qr-preview.test.js`: empty Data Matrix renders a design sample, excludes the sample in print mode and retries failed generation. `test/project-home.test.js` covers recent project thumbnails; `test/tool-placement.test.js` exercises a recent shape through the drop handler with simulated DOM geometry.
- Picture source menu actions remain unfinished. The BarTender empty-data rendering and hardware printing are not verified.

## Layer hover preview v1.266 (2026-10-28)

- `test/layer-menu-hover.test.js`: all four enabled layer commands preview on pointer entry, restore on exit or menu close, keep document unchanged until click and commit the selected command.
- `npx electron test/layer-hover-preview-runtime.js`: isolated renderer checks all four previews, no document mutation on hover, restoration and actual click commit.
- `npm run test:basic`: PASS at display version 1.266, 1,296/1,296 unit tests across 169 files, 0 failed/0 skipped and no undocumented files; all 3 legacy stages passed. Report `test/basic-unit-result.json` (2026-10-28T03:38:06.402Z); workspace advanced concurrently to v1.268.

## Selection chrome after canvas redraw v1.262 (2026-10-28)

- `test/editor-selection-render.test.js`: selection chrome created by a full redraw is removed when the user clears selection or selects another object, even when the incremental selection cache is empty.
- `electron test/selection-clear-runtime.js`: PASS with isolated appData; after a redraw, blank canvas clears selection, frame and tools; clicking another Barcode removes the old frame/tools and selects the new object. Object click and Shift marquee remain covered.
- `npm run test:basic`: PASS, 1,286/1,286 unit tests across 169 files, 0 failed/0 skipped, all 3 legacy stages passed and no undocumented files. Report `test/basic-unit-result.json` (2026-10-28T03:24:54.847Z, display version 1.264).

## SQL Server / Azure SQL wizard page v1.270 (2026-10-28)

- `test/database-native-flow.test.js`, `test/database-setup.test.js`, `test/database-file-provider.test.js`, `test/database-ipc.test.js`: BarTender-style server/database form, `Database Setup Wizard` header, direct `server`/`database` config, password exclusion; IPC and provider mocks only.
- Runtime: real ODBC server list and `sys.databases` query depend on Windows + installed SQL Server ODBC driver; not covered by unit tests.

## SQL Server and Azure SQL ODBC DSN v1.264 (2026-10-28)

- `test/database-file-provider.test.js`: injected ODBC provider checks SQL driver detection, DSN filtering, table read and refresh for both database types.
- `test/database-native-flow.test.js`, `test/database-setup.test.js`, `test/database-ipc.test.js`, `test/database-manager.test.js`: DSN configuration, password omission, password prompt on refresh, cancellation, wizard commit and IPC route; provider responses are mocked.
- `electron test/database-windows-runtime.js`: checks existing real Windows ODBC File DSN with a local text driver; it does not connect to SQL Server or Azure SQL.
- `npm run test:basic`: PASS at v1.264, 1,286/1,286 tests in 169 files, zero failed or skipped, zero undocumented, all three legacy stages passed; report `test/basic-unit-result.json` (`2026-10-28T03:25:25.335Z`).
- Native server-page behavior and real SQL Server/Azure SQL connections remain unverified. Full basic suite result is recorded in `docs/rea-sql-server-dsn-2026-10-28.md`.

## New label starts without a selected stock v1.260 (2026-10-28)

- `test/new-label-stock-mode.test.js`, `test/printer-resolution.test.js`: custom settings is the initial wizard mode, predefined catalog controls stay disabled, Finish omits `stock.name`, and predefined stock behavior requires explicit selection.
- `test/page-setup.test.js`: documents without a saved stock name do not auto-select or apply the first saved stock.
- `electron test/printer-resolution-runtime.js`: verifies empty default Stock Selection and explicit predefined selection before applying stock; runtime attempt timed out before the renderer reached its first IPC callback (see task REA record for observed Windows queue checks and limitations).
- `npm run test:basic`: PASS, 1,275/1,275 tests across 169 files; 0 failed, 0 skipped, undocumented inventory gap 0; all three legacy stages passed. Report: `test/basic-unit-result.json` (`2026-10-28T03:01:15.222Z`, display v1.261).
- Electron printer runtime timed out before its first renderer IPC callback; do not count it as passed. BarTender native default remains unknown because REA could not admit its managed metadata.

## Project Home artwork preview v1.259 (2026-10-28)

- `test/project-home.test.js`: saved project containing three empty QR objects and a picture placeholder renders all four on Recent projects; QR symbols use real generated matrices; source readiness redraws visible cards and listeners stop after Home closes.
- `npx electron test/project-home-preview-chromium-runtime.js`: PASS, isolated Chromium fixture with real SVG renderer and QR IPC shows three QR symbols and one picture placeholder.
- `npx electron test/project-home-preview-runtime.js`: timed out before the full application page loaded, including after disabling GPU for the isolated test. Full application UI verification remains outstanding; actual BarTender thumbnail internals are not established by REA.
- `npm run test:basic`: PASS at run-start version 1.259, 1,275/1,275 tests across 169 files, 0 failed or skipped, all three legacy stages passed, undocumented inventory 0. Report timestamp 2026-10-28T02:58:06.395Z; workspace advanced concurrently to v1.261.
- Final shared-workspace rerun `npm run test:basic`: PASS at v1.261, 1,276/1,276 tests across 169 files, 0 failed or skipped, three legacy stages passed and undocumented inventory 0. Report `test/basic-unit-result.json` at 2026-10-28T03:03:16.985Z.

## Shared Text/Picture dropdown hover v1.258 (2026-10-28)

- `test/ribbon-hover-menus.test.js`: when the Picture menu is active and the pointer moves onto its shared menu surface, it remains owned by Picture instead of toggling Text.
- `electron test/ribbon-hover-menus-runtime.js`: checks real menu hover continuity for Text, Picture, Barcode and Table, click/overshoot/leave timing, menu swapping and touch behavior.
- `npm run test:basic`: PASS, 1,275/1,275 tests in 169 files, 0 failed/0 skipped/0 undocumented; all 3 legacy stages passed. Report `test/basic-unit-result.json` (2026-10-28T02:58:41.637Z, display version 1.259).
- `electron test/ribbon-hover-menus-runtime.js`: attempted with `--disable-gpu`, but the Electron test window did not initialize and produced no runtime assertions; stopped only the isolated test process. UI runtime remains unverified.

## Bottom roll continuation corners v1.257 (2026-10-28)

- `test/page-setup.test.js`: bottom continuation stroke remains dark throughout both visible upper arcs for one and two columns, two corner radii, Page and Layout tabs. Existing coverage checks label geometry, zero/nonzero gaps and print output remain unchanged.
- `npm run test:basic`: PASS, 1,271/1,271 tests in 168 files, 0 failed, 0 skipped, 0 undocumented; all three legacy stages passed. Report `test/basic-unit-result.json` (2026-10-28T02:38:24Z).
- `npx electron test/page-setup-runtime.js`: PASS in isolated appData for the existing Page Setup flows; the corner-arc assertion is covered by the DOM unit regression above. Native pixel parity and physical printing remain unverified.

## QR editor preview v1.256 (2026-10-28)

- `test/qr-preview.test.js`: วัตถุ QR เปล่าสองชิ้นแสดงโมดูล QR จริงแยกกันใน editor; ไม่มีข้อความ placeholder “QR”; print mode ไม่ปล่อย QR ตัวอย่างเมื่อไม่มีข้อมูล; การเข้ารหัสล้มเหลวไม่ทิ้ง cache เสียและการวาดครั้งถัดไปลองใหม่
- `npm run test:basic`: PASS ที่ package version 1.0.257 / display 1.256; 1,270/1,270 tests ผ่านใน 168 files, fail 0, skipped 0; legacy 3 stages ผ่านและไม่มี test files ที่ตก inventory. Report `test/basic-unit-result.json` (2026-10-28T01:38:36.392Z).
- ขอบเขต: ไม่ได้ตรวจพิกเซลกับ BarTender หรือพิมพ์บนเครื่องจริง; REA ยืนยันว่าตัวติดตั้งมี QR encoder DLL/export แต่ไม่ยืนยันรูปลักษณ์ของ UI preview

## Page Setup roll backing v1.255 (2026-10-27)

- `test/page-setup.test.js`: confirms the white roll backing spans the full clipped extents of the previous and next label fragments; physical label/gap geometry is unchanged.
- Checks that the roll backing is light grey (`#d0d0d0`) while each actual label face remains white.
- Electron Page Setup runtime assertion was added, but `npx electron test/page-setup-runtime.js` timed out during app startup in this run; do not count it as passed.
- `npm run test:basic`: PASS at package version 1.0.256 / display 1.255, 1,268/1,268 across 167 files, 0 failed/0 skipped; all 3 legacy stages pass and undocumented inventory is 0. Report: `test/basic-unit-result.json`; run details in `docs/rea-page-setup-white-backing-2026-10-27.md`.

## Layout focused dimensions v1.254 (2026-10-27)

- `test/page-setup.test.js`: exactly one measurement for each of eight focused fields, two dashed reference lines, visible zero-span external arrows, focus immutability, live numeric geometry, blur/tab cleanup, and tall Sheet viewport bounds. Old always-visible gap expectation is superseded by the newly approved focused-only request.
- `electron test/layout-focus-runtime.js`: all eight actual focused fields with per-field PNG captures under `test-results/layout-focus/`, live 0.2 in = 5.08 mm gap update, unchanged document on focus, blur and tab cleanup. Isolated appData.
- `electron test/page-setup-runtime.js`: full existing Page Setup regression checks focused gap arrows and references, preserves all sizing/stock/scale/Cancel checks. PASS.
- Full required basic result is recorded after completion in docs/superpowers/plans/2026-10-27-layout-focus-guides.md. Native exact pixels and physical printing are unverified.

## Gap input precision v1.253 (2026-10-27)

- `test/page-setup.test.js`: Horizontal/Vertical gap inputs show one decimal, use step `0.1`, and preserve physical conversion (`0.1 in` = `2.54 mm`).
- `npm run test:basic`: PASS, 1,268/1,268 tests across 167 files, 0 failed/0 skipped; all 3 legacy checks passed and no test files were undocumented. Report: `test/basic-unit-result.json`.

## Page Setup hidden scrollbar gutter v1.252 (2026-10-27)

- `test/page-setup.test.js`: confirms the Page Setup main pane retains `overflow:auto` while hiding the native scrollbar gutter and Chromium scrollbar painting.
- `electron test/page-setup-runtime.js`: checks the real Chromium pane remains vertically scrollable with the scrollbar hidden.
- `npm run test:basic`: final shared-workspace rerun at version 1.253 passed 1,268/1,268 across 167 files, 0 failed/0 skipped; all 3 legacy stages passed and undocumented inventory is 0. Report `test/basic-unit-result.json` at `2026-10-27T03:49:03.690Z`. The workspace advanced to v1.254 after this run.
- `npx electron test/page-setup-runtime.js`: PASS in isolated appData; Chromium retains `overflow-y:auto` with the standard and WebKit scrollbar-hidden rules. No BarTender parity or hardware claim.

## Inch size captions v1.252 (2026-10-27)

- test/page-setup.test.js: Page Setup inch caption and renderer/project-size formatter omit zero decimals (4 × 4 in) and retain meaningful fractions (3.5 × 2.25 in).
- `npm run test:basic`: PASS, 1,264/1,264 tests, 167 files, 0 failed/0 skipped; three legacy checks passed; no undocumented tests. Report: `test/basic-unit-result.json` (version 1.251 at execution). Page Setup and renderer formatter unit regressions pass; reload the running app renderer or restart to load the changed scripts.

## Roll preview clearance and fractional Shape values v1.250 (2026-10-27)

- `test/page-setup.test.js`: one/four main labels across all eight Page Setup tabs keep visible outer continuation clearance while physical row/column gaps, template JSON and generated ZPL remain unchanged. Larger physical gaps and tall-stock fit remain covered. The old zero-clearance neighbour assertion is superseded by the user’s new visual request.
- Shape regression: radius, synchronized range control and border width accept 0.125 in, OK commits 3.175 mm, reopening retains the value. Existing four-decimal tests remain.
- `electron test/roll-clearance-runtime.js`: isolated real app validates linked controls, OK, explicit save/disk reload, one/four-label geometry and captures `test-results/roll-clearance-four.png` / `roll-clearance-single.png`. No user documents or hardware are used.
- Required final full basic result is recorded in the task plan. Native exact drawing constants remain unknown; user screenshots define the outer-clearance requirement.

## Stock antenna and magnetic stripe guides v1.249 (2026-10-27)

- `test/stock-guides.test.js`: 12 packaged source-bound assets and PNG hashes/physical aspect; nine anchors, independent origins, rotation, unsafe custom source rejection, custom deletion, magnetic side/edge/offset/thickness, print-preview flag, real page margins/gaps; physical ZPL stays byte-identical.
- `test/page-setup.test.js`: functional Stock tabs, four repeated overlays, live settings, Advanced Cancel/OK, document persistence and Page Setup Cancel rollback; invalid input reveals both tabs without losing the draft; canceled async imports cannot change the restored document. Earlier disabled image-tab expectations are superseded by the approved request; encoder output remains unsupported.
- `electron test/stock-guides-runtime.js`: isolated full app, all 12 decoded assets, four-cell overlays, original/custom import/delete, real disk roundtrip, Cancel and actual Print Preview inclusion/exclusion. Runtime PASS including all controls fitting above footer; stock-guides-rfid.png and stock-guides-magnetic.png captured and visually inspected after temporarily showing the isolated window inactive. Final basic suite result recorded below; this is not native pixel verification.
- `electron test/page-setup-runtime.js`: existing full Page Setup flow now checks enabled guide tabs and explicit encoding limitations.
- Hardware encoding/printing, automatic magnetic-side detection from printer drivers, native exact size-method behavior, EMF custom import and full pixel parity are not implemented/verified by this change. Automatic uses explicit stock detected_magnetic_side metadata when provided; otherwise it draws no stripe. Custom imports support PNG/JPEG/WebP.

## Editable A4A BarTender library import v1.248 (2026-10-27)

- `test/a4a-native-package.test.js` verifies the exact BTW SHA-bound package, four separate original text/Data Matrix objects, their original source references, live shared-source changes and explicit native form exclusion.
- `test/btw-native-forms.test.js` verifies whitespace-formatted native PromptValues XML is retained; `test/printer-resolution.test.js` verifies the unsupported native form control is visibly disabled and cannot be forced on at Finish.
- `electron test/a4a-native-import-runtime.js` exercises the production library IPC and wizard Finish with the real A4A fixture, edits CAGE shared data, confirms text and barcode inputs update, explicitly saves and reopens all four objects. Isolated app data; no printer.
- `scripts/build-a4a-native-package.js` deterministically rebuilds `lib/assets/btw-native-packages/4c4afa8060191968c5d34f06865a029c4f53c25164e14b094e368040be18b783.json` from retained native exports and snapshot evidence.
- Coverage is limited to this A4A source SHA. Other corpus templates remain preview-only until their full original object/source/document behavior is independently verified and packaged. Native data-entry form behavior, exact BarTender Data Matrix autosizing, physical print, and full pixel parity are not covered.
- `node scripts/build-a4a-native-package.js`: rebuilt the 124,031-byte exact-source package; SHA-256 `5c6d55ecae117479a870e2da0c4a6e3fca99fcb484ea1bfb0f24e93361b8079`.
- `electron test/a4a-native-import-runtime.js`: PASS, production IPC/library selection/Finish, four separate objects, shared CAGE edits Text and Data Matrix, explicit save/reopen, and original enabled-form PromptValues retained while excluded.
- Final `npm run test:basic`: 1,260/1,260 passed across 167 unit-test files, 0 failed/0 skipped; all three legacy checks passed; undocumented inventory gap 0. Latest report: `test/basic-unit-result.json` (version 1.249; includes concurrent stock-guide tests).
- Verification is a bounded A4A fixture runtime. It does not verify the remaining library corpus, native form behavior, hardware printing, or full BarTender pixel parity.

## RFID and magnetic stock guides

- `test/stock-guides.test.js` checks the twelve antenna catalogue image identities and hashes, nine position anchors and independent offsets, safe custom image add/remove, antenna visibility/rotation, magnetic stripe side/edge/offset/color/print-preview behavior, and repeated sheet preview placement without changing label artwork.
- This suite does not verify physical RF performance or printed magnetic encoding.

## Page Setup solid preview outlines v1.247 (2026-10-27)

- [x] `test/page-setup.test.js`: all eight tabs draw four solid dark face outlines for rectangle/rounded/ellipse/circle with Print borders off/on; face stroke is outside the per-cell content clip; enabled printed-border width still updates its separate preview outline; template print settings are unchanged. The former dashed-guide expectation is superseded by this approved request; Print borders off still emits no actual ZPL border.
- [x] Focused Page Setup/stock/wizard checks: 44/44 passed.
- [x] `electron test/page-setup-single-preview-runtime.js`: single-label and 2×2 roll outlines on all eight tabs, live Print borders width/off, zero/nonzero gaps, sheet/catalog regression; captures `test-results/page-setup-outlines-page.png` and `test-results/page-setup-outlines-layout.png` visually inspected.
- [x] Final `npm run test:basic`: 1,250/1,250 tests passed across 166 files; 0 failed/0 skipped; all three legacy stages passed; undocumented inventory gap 0. Report timestamp 2026-10-27T02:52:10.185Z under current shared version 1.248; retained task copy `test-results/page-setup-outlines-basic-result.json`.

## Preview canvas selection dismissal v1.245 (2026-10-27)

- [x] `test/canvas-selection-dismiss.test.js`: blank primary click clears immediately; no-selection, object/control click, modified marquee and non-primary click preserve the appropriate state.
- [x] `electron test/selection-clear-runtime.js`: actual renderer pointer events clear selected picture on blank canvas and workspace, hide selection tools, preserve object clicks and Shift marquee.
- [x] REA static analysis matched BarTender `ObjectEditorView` mouse handlers and `SelectionManager` deselect methods; the C++/CLI caller behavior is not fully reconstructed, so runtime parity is not claimed.
- [x] Final `npm run test:basic`: 1,243/1,243 tests passed across 165 files; 0 failed, 0 skipped; all three legacy checks passed; undocumented inventory gap 0. Report: `test/basic-unit-result.json` (2026-10-27T02:34:55.766Z).

## Symbol import category in English v1.244 (2026-10-27)

- [x] `test/barcode-catalog.test.js`: Symbol Subset shows “Custom”, new imports store that category, and the imported symbol remains visible when the category is selected.
- [x] Focused `node --test test/barcode-catalog.test.js test/svg-select.test.js`: 14/14 passed.
- [x] Whole-system `npm run test:basic`: 1,235/1,235 passed across 164 files, 0 failed/0 skipped; all three legacy checks passed; undocumented inventory gap 0. Report `test/basic-unit-result.json` (2026-10-27T02:25:01.572Z).
- Coverage: no native BarTender behavior is reconstructed; REA PE resource inventory leaves opaque payloads unread.

## Page Setup multi-label roll preview v1.243 (2026-10-27)

- [x] `test/page-setup.test.js`: 2×2 roll has four separate configured-shape faces and one top/bottom continuation per column; actual zero/nonzero gaps; clipped adjacent rounded/ellipse faces retain geometry; explicit Sheet removes continuation; live selected-tab updates survive consumed click events and SVG title text.
- [x] `test/stock-preview.test.js` and `test/wizard-roll-reference.test.js`: stock and separate grey wizard renderer remain covered.
- [x] `electron test/page-setup-single-preview-runtime.js`: all eight tabs, real 2×2 zero-gap/nonzero-gap changes, selected Shape, repeat roll faces, single 20-label sheet, catalogue replacement and captions. Captures: `test-results/page-setup-roll-2x2.png`, `test-results/page-setup-roll-2x2-gap.png`.
- [x] Final `npm run test:basic`: 1,235/1,235 passed across 164 files, 0 failed/0 skipped; all three legacy stages passed, undocumented inventory gap 0. Report `test/basic-unit-result.json` (2026-10-27T02:18:51.720Z). No physical print or native pixel-diff assertion.

## Page dropdown closes immediately outside arrow/menu v1.242 (2026-10-27)

- [x] `test/template-pages.test.js` checks that the menu stays open while pointer moves arrow↔menu, closes immediately on arrow→plus or menu→plus, closes immediately on arrow/menu→outside, and opens again on arrow hover. No timer-based dismissal.
- [x] `electron test/template-navbar-size-runtime.js` checks the real Electron popover is adjacent to the arrow, remains open on transfer between arrow and menu, closes immediately on hover exit to plus/outside and can reopen.
- [x] Whole-system `npm run test:basic`: 1,234/1,234 unit tests passed across 164 files, 0 failed/0 skipped; all three legacy checks passed; undocumented inventory gap 0. Report: `test/basic-unit-result.json` (2026-10-27T01:59:45.995Z). First run caught a stale position assertion and missing inventory entry; both were corrected before this clean rerun.

The complete discovered suite inventory also includes `test/native-datamatrix-layout.test.js`.

## Data Type dropdown and unsaved documents v1.241 (2026-10-26)

`test/object-data-sources-ui.test.js` checks all nine distinct type SVGs, the SVG chevron, popup promotion, and dialog cancellation being consumed only by the open popup. `electron test/data-type-picker-runtime.js` uses real Electron mouse/key events in the full app: trigger alignment, viewport bounds, hit testing every option, live Number selection, Escape focus, outside dismissal and three reopen cycles. Capture: `test-results/data-type-picker-runtime.png`.

`test/unsaved-document.test.js` covers Save/Discard/Cancel navigation, the new-document Auto Save boundary, restoring saved data on discard, removing unsaved identity and blocking manual hot reload writes. `test/printer-resolution.test.js` verifies Finish performs zero create-file calls and marks the draft unsaved, plus prompting before Wizard launch and preserving work on Cancel. The prior immediate-file-on-Finish expectation is superseded by this user requirement.

The unsaved unit tests also run the real openEditor function with deferred native barcode hydration: discard remains clean after completion and stale callbacks cannot dirty a replacement document. The validated native-package Electron fixture reproduces this after a real Save and discard. The obsolete single-raster library-import runtime remains incompatible with the existing verified-native-only import gate; this task does not weaken it.

Final verification v1.241: `npm run test:basic` passed 1,220/1,220 tests in 160 files, 0 failed/0 skipped, all 3 legacy checks passed, no undocumented files; report `test/basic-unit-result.json` (2026-10-26T08:08:53.380Z). Focused full-app dropdown pointer/keyboard, disk Save/Discard/Cancel, new-project unique Save, Auto Save settings, clean Home close, Number type and validated native-package fixture runtimes passed.

`electron test/unsaved-document-runtime.js` uses isolated real files and checks byte preservation on Don’t Save, zero files on Wizard Finish/discard, explicit first Save, Home Cancel/Save, discard followed by reload/exit. `electron test/new-project-runtime.js` explicitly saves drafts before checking unique numbered filenames/printer association. `electron test/native-package-app-runtime.js` verifies a validated native import is initially unsaved, then explicitly saves its edited objects before reopening them. `electron test/home-save-prompt-runtime.js` checks Home guards dirty work and clean Home closes without a second prompt; `electron test/auto-save-policy-runtime.js` checks manual mode and explicit Auto Save from an actually visible editor. Existing `test/save-as-end-to-end.test.js` keeps the Save As transaction coverage. No hardware prints or native runtime pixel comparison.

## Page dropdown reopen positioning v1.240 (2026-10-26)

- [x] `test/template-pages.test.js` measures the shown top layer on three repeated add/context menu cycles; asserts above alignment and nonzero height.
- [x] `electron test/template-navbar-size-runtime.js` verifies actual popover size, three reopen cycles, both visible commands, context menu height and existing page keyboard actions.
- [x] Fresh `npm run test:basic`: 1,209 passed, 0 failed, 0 skipped; all three legacy stages passed; undocumented inventory gap 0. Report: `test/basic-unit-result.json`. Native pixel parity and hardware printing are outside this UI regression.

## Template Background compact options v1.236 (2026-10-23)

`test/printer-resolution.test.js` checks enabled Color/Picture/Design Guide controls stay visually hidden like the reference; checking opens the native chooser, selected option text reopens it, and the option remains enabled. Electron `test/wizard-preview-runtime.js` captures the all-selected state, checks hidden chooser controls and verifies the Design Guide explanation height.

## Wizard radius, library artwork and project thumbnails v1.235 (2026-10-23)

`test/printer-resolution.test.js` checks the subtle wizard radius, paper orientation/mirror/negative printer illustration and faithful one-image library import. `test/btw-preview.test.js` checks recovery of legacy empty BTW artwork; `test/project-home.test.js` checks visible grey thumbnail stage around blank labels. Electron `test/library-import-app-runtime.js`, `test/wizard-library-artwork-runtime.js` and `test/wizard-preview-runtime.js` check save/reopen artwork and nine-page layout. The BTW raster keeps appearance and print bitmap; it is one image rather than editable native BarTender objects. Native pixel comparison and physical printing remain unverified.

## Template Background compact options v1.234 (2026-10-23)

`test/printer-resolution.test.js` checks the default hidden color, picture and guide inputs, the restored Design Guide Image explanation, and that enabling Color reveals its control. `electron test/wizard-preview-runtime.js` continues checking the full wizard layout and no overflow. Native pixel comparison and hardware printing remain unverified.

## Wizard Template Background and Finished v1.233 (2026-10-23)

`test/printer-resolution.test.js` checks the nine-step order, disabled and enabled background controls, one-sheet previews without continuation on Template Background and Finished, selected printer and size, plus retained creation behavior. `electron test/wizard-preview-runtime.js` checks all nine steps, fixed footer controls and no overflow. Physical printer output and native pixel comparison remain outside this test.

## Shared grey wizard roll preview v1.232 (2026-10-23)

`test/wizard-roll-reference.test.js` checks the shared 198×270 coordinate frame, 154×154 square at (22,58), solid #bfbfbf workspace, four shape types, clipped previous/next labels, removal of rollers/Gap/die-cut guides, aspect ratios and 2×3 layout count; v1.307 Side Edges liner scales cross-section (label + left/right unused) into the 198×270 frame so larger Left/Right values shrink the label like BarTender; `[data-liner]` bands mark unused sides. `test/printer-resolution.test.js` checks shape changes, stock selection, navigation and the new flat workspace requirement (supersedes older radial-gradient expectations below).

`electron test/wizard-roll-reference-runtime.js` captures Items Per Page, Side Edges, Printed Item Shape, Template Size at 4×4in, asserts equal normalized SVG markup and 198×270 panes. Captures `test-results/wizard-roll-items-per-page.png`, `test-results/wizard-roll-side-edges.png`, `test-results/wizard-roll-printed-item-shape.png`, `test-results/wizard-roll-template-size.png`. `electron test/wizard-preview-runtime.js` checks the complete flow and multiple item count. No physical output or native runtime pixel-diff claim.

## Floating menu above modal v1.230 (2026-10-22)

`test/template-pages.test.js`: page menu เปิดทับ `#newLabelWizard[open]` และใช้ `FloatingMenuTopLayer`.

## Wizard BarTender soft roll preview v1.229 (2026-10-22)

`test/printer-resolution.test.js`: `data-paper-style=bartender`, `[data-paper-sliver]`, radial `#nwSideEdgesPreviewBg` บน Template Size; asset อ้างอิง `gui/assets/branding/bartender-wizard-*-reference.png`.

## Wizard roll preview fit viewBox v1.228 (2026-10-22)

`test/printer-resolution.test.js`: roller x/width ตรง `[data-preview-cell]`; viewBox ไม่ใช่ `0 0 250 340` หลัง wizard tune.

## Wizard roll preview BarTender rollers v1.227 (2026-10-22)

`test/printer-resolution.test.js`: `[data-paper-roller]`, `[data-paper-rails]`, `[data-paper-stack-outline]` บน preview rounded.

## New Document Wizard — Items Per Page preview inset v1.226 (2026-10-22)

`test/printer-resolution.test.js`: หน้า Items Per Page — `.nw-body` มี padding-right ≥10px; preview SVG ไม่ถูก translate ชิดขอบ modal.

## New Document Wizard — Template Size presets v1.225 (2026-10-22)

`test/printer-resolution.test.js`: dropdown มี User Defined / 2×4 / 4×4 / 4×6; default **4x4**; preset 2×4 ตั้ง Width/Height; แก้มือ → user.

## New Document Wizard — Template Size 4 in + 0.1 step v1.224 (2026-10-22)

`test/printer-resolution.test.js`: Width/Height เริ่มต้น `4`, `step=0.1`, `min=0.1`.

## New Document Wizard — Template Size unit suffix v1.223 (2026-10-22)

`test/printer-resolution.test.js`: ไม่มี `.nw-template-unit` ซ้ำ; Width/Height มี `.unit-suffix` ใน `.unit-number` อย่างละหนึ่ง

## New Document Wizard — preview caption outside gradient pane v1.222 (2026-10-22)

`test/printer-resolution.test.js`: Side Edges/Template Size — caption ใต้ SVG, aside พื้นโปร่ง, แผ่น stock ใน SVG `fill=none`; preview 198×270 px.

## New Document Wizard — rounded paper continuation + 4×4 in default v1.221 (2026-10-22)

`test/printer-resolution.test.js`: custom stock default Width/Height **4 in**; Printed Item Shape/Template Size preview มี `[data-paper-continuation]` outline `rx>0` สำหรับ rounded; corner radius 8 mm บน 4×4 in และ 4 mm เมื่อลดเป็น 51×25 mm.

## New Document Wizard — gray gradient preview v1.218 (2026-10-22)

Side Edges / Printed Item Shape / Summary preview pane และ `StockPreview` ใช้พื้นหลังเทาไล่ระดับแทนฟ้า; ไม่มี assertion สีใน unit tests — ตรวจด้วย reload wizard หรือ `electron test/wizard-side-edges-runtime.js`.

## New Document Wizard — printer property button inset v1.220 (2026-10-22)

`test/printer-resolution.test.js` และ `electron test/wizard-preview-runtime.js` วัดว่า `.nw-printer-actions` เว้นขอบขวาของ form อย่างน้อย ~10px

## New Document Wizard — Template Size after Printed Item Shape v1.219 (2026-10-22)

`test/printer-resolution.test.js` ตรวจ flow 8 ขั้น: … → Side Edges → Printed Item Shape → **Template Size** (User Defined Size, Orientation, Effects) → Summary; Finish ปิดบน Side Edges และ Template Size. `electron test/wizard-preview-runtime.js` และ runtime tests อื่นอัปเดตลำดับหน้า; preview pane ใช้พื้นหลังเทาไล่ระดับ (v1.218).

## Library artwork and Starting Point fit — v1.210 (2026-10-22)

`test/btw-preview.test.js` checks native PNG carrier extraction, cropping the grey surround, retaining ink, rejecting missing/damaged/wrong-aspect previews, and recovering legacy empty library templates while preserving existing/user-cleared content. `test/template-library.test.js` checks the public CDN URL used for BTW downloads. `test/printer-resolution.test.js` checks Finish retains library artwork, unavailable artwork blocks a blank import, and the preview uses the selected artwork.

`electron test/wizard-preview-runtime.js` asserts the Starting Point body does not scroll and both Enable data entry form and both size lines fit. `electron test/wizard-library-artwork-runtime.js` verifies real installed A4A text/Data Matrix/UID regions render with ink. `electron test/library-import-app-runtime.js` runs the actual main/preload/renderer in isolated appData with printer responses stubbed: downloads the Cloud BTW through the public CDN, creates/saves/reopens artwork, and recovers an old empty local library project. Source fixture: installed `C:/ProgramData/Seagull/PrintStation/wwwroot/Templates/Military/MIL-STD-130/A4A Label.btw`; Cloud test requires internet. No print jobs are sent. Library import v1.213: `test/btw-library-import.test.js` decomposes installed **A4A Label** preview into separate text/Data Matrix elements; `test/printer-resolution.test.js` and Electron library runtime verify Finish opens multiple editable objects when decomposition succeeds (fallback single picture when preview is too simple). Full native `.btw` object deserialization is not available; clustering uses embedded preview ink only. The running application needs a main-process restart for the new importer/recovery IPC code.

## New Document Wizard — remove Label Layout page v1.209 (2026-10-22)

`test/printer-resolution.test.js` ตรวจว่าหน้า Select the Label Layout และ Orientation/Rotated/Screen/Printer Layout controls ไม่มีอยู่, ลำดับต่อจาก Items Per Page ไป **Template Size** (User Defined Size, หมายเหตุ, Orientation/Effects) โดยตรง, Back กลับ Items Per Page, และ flow ต่อถึง Side Edges, Printed Item Shape, Summary/Finish โดยจำนวน/ขนาด item ยังบันทึกได้. `electron test/wizard-label-layout-runtime.js` ตรวจ flow และการไม่มี page/controls ใน renderer; `electron test/wizard-preview-runtime.js` ตรวจ flow ครบ 8 หน้าและ body ไม่ scroll. REA string inventory ของ BtEnu.dll ไม่พบข้อความชื่อหน้า, Screen Layout, Printer Layout หรือ Rotated; ไม่มี native runtime parity claim.

Verification: `npm run test:basic` ผ่าน 1,051/1,051 tests, 0 failed/0 skipped; legacy checks 3/3 ผ่าน; inventory gap 0. รายงาน `test/basic-unit-result.json`.

Template Manager + New Document Starting Point v1.216: `test/template-browser.test.js` ครอบคลุม Add a filter modal, 3 tabs, BarTender CDN filter tab/option icons (`FilterIcons`, `TechnologyIcons`, `IndustryIcons`) พร้อม snapshot JSON ใน `gui/assets/template-browser/filters/`, industry/standard/shape tile filters, removable chips, Escape, no-results, pagination, CDN thumbnail URL, dialog overflow และ green palette/logo source. `test/template-browser-runtime.js` วัด grid/card และ filter modal ที่ 1560/1000/600px พร้อม capture `test-results/template-manager-filter-dialog.png`. `test/printer-resolution.test.js` ตรวจ selected-library preview HTML, thumbnail, dimensions, selected document name และ Next enabled; `electron test/wizard-preview-runtime.js` ตรวจหน้า Starting Point ใน runtime.

Printed Item Shape v1.205: `test/printer-resolution.test.js` ตรวจหน้าใหม่นี้อยู่ถัดจาก Side Edges, ปุ่ม Back/Next/Finish, ตัวเลือกรูปทรงทั้งสี่, preview เปลี่ยนตามตัวเลือก, Summary และ shape ที่บันทึกใน template; Circle แยกจาก Ellipse ใน SVG preview, editor outline/background, overflow/grid guide และ ZPL print border. REA strings evidence ยืนยัน caption `Printed Item Shape`/`Ellipse` ใน BtEnu.dll เท่านั้น; runtime parity/output native ยังเป็นช่องว่าง.

Printed Item Shape layout v1.207: `test/printer-resolution.test.js` ยืนยันไม่มี Stock gap/die-cut annotations; `electron test/wizard-printed-item-shape-runtime.js` ตรวจ icon → radio → ชื่อ, Rounded rectangle default, preview 198×270px ชิดขวา, Template Size อยู่ใต้ preview และไม่มีหน้ามิติแทรกหลัง Side Edges; `electron test/wizard-preview-runtime.js` ตรวจ body ไม่ scroll และ flow ทั้ง 9 หน้า. ภาพ: `test-results/new-label-printed-item-shape-preview.png`. Verification: `npm run test:basic` ผ่าน 1,045/1,045 tests, 0 failed/0 skipped และ legacy checks 3/3 ผ่าน; report `test/basic-unit-result.json`. REA `search_strings` evidence `ev_bf167849a9db053547f5de7ad5480f52d1d7604e6fe1f3cd8754f131998f0f50` ระบุ caption ใน BtEnu.dll hash `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`; ยังไม่ยืนยัน native runtime/pixel parity/print output.

Printed Item Shape corner-radius correction v1.208: `test/printer-resolution.test.js` ยืนยัน Rounded rectangle ยังคงรัศมี 4 mm บนฉลาก 51×25 mm และจำกัดที่ 8 mm บนฉลาก 101.6×101.6 mm; `electron test/wizard-printed-item-shape-runtime.js` วัด radius ใน SVG สำหรับฉลาก 4×4 in ให้อยู่ไม่เกิน 16 viewBox px และบันทึกภาพใหม่. `electron test/wizard-preview-runtime.js` ยืนยัน preview ใหญ่ยังไม่ทำให้ body scroll และ flow ปัจจุบันครบ 8 หน้า. REA strings `ev_b8213b2e3f13d4fc7fe88ee742857f74493d7f0f5846a56cd2eae8349a451a8d` (`Rounded Rectangle`) และ `ev_f7a9c48ef8f323405d1cf5ec74e5ed8af2c11b19cc386f6ba1b8b063235222f0` (`Corner Radius`) ระบุศัพท์ native เท่านั้น; รัศมี 8 mm มาจากการเทียบสัดส่วน screenshot ไม่ใช่ค่าที่ REA ยืนยัน. Full `npm run test:basic` ผ่าน 1,051/1,051 tests, 0 failed/0 skipped และ legacy checks 3/3 ผ่าน; report `test/basic-unit-result.json` แสดงเวอร์ชัน 1.209 ก่อน workspace อัปเดตเป็น 1.210.

## Side Edges page preview gutter — v1.204 (2026-10-22)

`electron test/wizard-preview-runtime.js` ตรวจหน้าขั้น 6 ว่าหัวข้อเป็น **Side Edges**, pane preview มองเห็นได้ กว้างอย่างน้อย 190px และเว้นขอบ dialog 14–22px; SVG ชิดขอบ pane และ `Template Size` อยู่บรรทัดเดียวใต้ภาพ พร้อมตรวจป้าย Left/Right. ภาพ runtime: `test-results/new-label-side-edges-preview.png`.

REA `search_strings` บน `D:/Programs/BtEnu.dll` พบ native page title “Side Edges” (Evidence `ev_566fa4c709ed816add33a0ac44df08b292cff28f6ef8b98250a286ecef0ee589`); `xrefs` ที่ address `0x1036c0f8` ไม่พบ reference. จึงยืนยันชื่อหน้าได้ แต่ยังไม่ยืนยันพิกัดหรือ behavior ขณะทำงาน; ใช้ภาพผู้ใช้และ runtime ของ Q LABEL เป็นเกณฑ์วัด layout.

Verification: `npx electron test/wizard-side-edges-runtime.js` ผ่านและสร้างภาพหน้า Step 6; `test/printer-resolution.test.js` ผ่าน 36/36; `npm run test:basic` ผ่าน 1,043/1,043 unit tests, 0 failed/0 skipped และ legacy checks ทั้ง 3 ผ่านบน v1.205. Report: `test/basic-unit-result.json`. `wizard-preview-runtime.js` ยังตรวจรายการ 8 หน้าเดิม ขณะที่ source ปัจจุบันเพิ่มหน้า **Printed Item Shape** ก่อน Summary; dedicated Side Edges runtime check ผ่าน.

## Template Manager reference layout — v1.203 (2026-10-22)

Test inventory: `test/template-browser.test.js`; runtime coverage: `test/template-browser-runtime.js`.

`test/bartender-cloud-templates.test.js` also verifies merging the local catalog preserves distinct Cloud IDs with identical display names. The importer must retain all 480 Cloud records; local matching must never collapse two Cloud templates or relabel one local duplicate as a Cloud entry.

`test/template-browser.test.js` covers three category tabs, instant category/shape/standard filtering and chip removal, Escape, pager last-page access, scroll/search reset, one selection callback, public thumbnail URL correction, green brand colors and dialog overflow. `test/template-browser-runtime.js` measures actual cards (400px), thumbnails (176px), header (80px), grid overflow and no horizontal clipping at 1560/1000/600px, decodes public Cloud images, and checks the centered filter modal. Native filter parity remains unverified; see docs/rea-template-manager-layout-2026-10-22.md.

## Select the Label Layout preview pane — v1.200 (2026-10-22)

`electron test/wizard-label-layout-runtime.js` เปิด New Document Wizard จริงและวัดหน้า Select the Label Layout: preview pane กว้างอย่างน้อย 190px, เว้นขอบขวา 14–22px, SVG กับ Template Size ชิดขอบเดียวกัน และ Template Size อยู่ใต้ภาพในบรรทัดเดียว; ตรวจ Portrait, Landscape, Rotated, Screen Layout และ Printer Layout ยังอยู่ครบ. ภาพ runtime: `test-results/new-label-layout-preview.png`.

REA `inspect_pe_resources` ตรวจ BtEnu.dll และ `search_strings` ของ Ghidra พบข้อความ “Select a page size and orientation.” แต่ไม่พบ Screen Layout/Printer Layout ใน inventory; native preview positioning/behavior ยังไม่ยืนยัน จึงใช้ภาพผู้ใช้และวัด Q LABEL runtime โดยไม่อ้าง native pixel parity.

Verification: `npx electron test/wizard-label-layout-runtime.js` ผ่าน; `npx electron test/wizard-preview-runtime.js` ผ่านครบ 8 หน้า; `npm run test:basic` ผ่าน 1,034/1,034 unit tests, 0 failed/0 skipped และ legacy checks ทั้ง 3 ผ่าน. Report: `test/basic-unit-result.json`.

## Wizard layout + side edges scope — v1.197 (2026-10-22)

BarTender-style UI/preview/footer rules apply only to wizard steps **Select the Label Layout** (step 4) and **Side Edges** (step 6): PaperPreview + grey pane, Screen/Printer toggles, side-edge fields; Finish disabled on those steps only. Other wizard steps keep prior Q LABEL footer and Stock preview behavior. `test/printer-resolution.test.js` asserts the two-page Finish/Next states.

## Wizard Label Layout, Side Edges, footer — v1.195 (2026-10-22)

`test/printer-resolution.test.js` checks Screen/Printer layout preview toggle, BarTender-style Side Edges (access keys, Finish disabled before Summary, Next/Cancel enabled). REA `inspect_pe_resources` on `D:/Programs/BtEnu.dll` (SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`, Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a47464f1a4887`) identifies native wizard pages; static resources do not prove runtime footer rules — mapping uses user BarTender screenshots.

## Wizard printer list sync and property buttons — v1.194 (2026-10-22)

`test/printer-resolution.test.js` asserts the wizard re-syncs `#nwPrinter` from `#printerSelect` and `zebra.listPrinters()` when the toolbar snapshot is stale (one queue only), and enables Document Properties / Printer Properties when a queue is selected. No new REA run: behavior fix for Q LABEL startup race; BarTender Printer Selection page resource evidence from v1.170 still applies to list content, not this refresh timing.

## Items Per Page preview and Columns fit — v1.174 (2026-10-22)

`electron test/wizard-preview-runtime.js` วัดว่า SVG preview และ Template Size ชิดแนวขวาเดียวกัน, Template Size อยู่ด้านล่างและไม่ตัดเป็นหลายบรรทัด, และคำว่า Columns อยู่ครบในขอบ form. REA `inspect_pe_resources` ของ `D:/Programs/BtEnu.dll` พบ resource 6688 สำหรับ Items Per Page และ controls Single/Multiple, Rows, Columns; static resource ไม่ได้ยืนยันพิกัด preview จึงยึดภาพที่ผู้ใช้แนบและวัด Q LABEL runtime โดยไม่อ้าง native pixel parity.

Verification: `npx electron test/wizard-preview-runtime.js` passed; `npm run test:basic` on v1.174 passed 1,010/1,010 unit tests and all 3 legacy checks. Report: `test/basic-unit-result.json`; output: `test/basic-unit-output.log`.

## Windows printer list includes all discovered queues — v1.170 (2026-10-22)

`test/windows-printer-enumeration.test.js` checks BarTender-style order (AnyDesk, Default (currently …), HP, Microsoft Print to PDF, OneNote, PDF, ZDesigner, Zebra ZT411, Zebra ZT610), Default-row resolution, case-insensitive natural sorting, and that saved printers repopulate in sorted order instead of being prepended. Add `test/windows-printer-enumeration.test.js` to the discovered `test/*.test.js` inventory; all files run through `npm run test:basic`. BarTender reference is the user screenshot. REA `inspect_pe_resources` on `D:/Programs/BtEnu.dll` identifies the static Printer Selection page (Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a47464f1a4887`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`); `inspect_managed_members` on `D:/Programs/Seagull.BarTender.Print.dll` (Evidence `ev_fe2f4b2c4f568397ea3fd6cba99961b9f66a24080fb95c9ad3d81e1ada97998b`, SHA-256 `301ba773fe7869e8ece9b0b2629a3afd1303af1c9df36bb68a2b7ca4ec0495ef`) finds `Seagull.BarTender.Print.Printer` but does not establish queue enumeration. BarTend.exe hash `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; its mixed C++/CLI metadata exceeds REA's 64 MiB limit, so native enumeration remains unknown. Implementation mapping: Windows `Get-Printer` names now pass through without the Zebra-only filter. This is Q LABEL behavior based on the user's screenshot; no native parity claim.

## Printer list follows BarTender's visible alphabetical order — v1.172 (2026-10-22)

`test/windows-printer-enumeration.test.js` supplies the unsorted seven queues from the user's Q LABEL screenshot and asserts AnyDesk, HP, Microsoft, OneNote, ZDesigner, Zebra ZT411, Zebra ZT610 order. The comparator ignores case and sorts numeric model fragments naturally. REA static resources identify the BarTender Printer Selection page but do not expose its runtime comparator; BarTend.exe mixed C++/CLI metadata is over the REA 64 MiB limit. The user screenshots provide the visible order; no native algorithm or full implementation parity is claimed.

Verification record for the ordering change: `npm run test:basic` on current v1.174 passed 1,010/1,010 unit tests, 0 failed, 0 skipped; all 3 legacy checks passed, and 0 test files were undocumented. Report: `test/basic-unit-result.json`; output: `test/basic-unit-output.log`.
# UNIT TEST BASIC — Q LABEL ทั้งระบบ

## Template Manager removes the outer scrollbar — v1.202 (2026-10-22)

`test/template-browser.test.js` checks the open Template Manager dialog explicitly suppresses outer overflow while `.tb-grid` retains its own scroll area. Existing pagination checks verify moving pages resets only the grid scroll position.

## Next button arrow follows its text — v1.173 (2026-10-22)

`test/printer-resolution.test.js` asserts the Next button's text node precedes its arrow icon. `electron test/wizard-preview-runtime.js` repeats that DOM order on all eight Wizard steps while preserving button dimensions, icon dimensions and navigation. REA's complete static PE resource inventory does not expose runtime button ordering, so the attached screenshot is the visual specification for this change.

Integrated verification on v1.174: `npm run test:basic` — 1,010 passed, 0 failed, 0 skipped; all 3 legacy checks passed and there were no undocumented test files. Report: `test/basic-unit-result.json`.

## Wizard expands form when preview is hidden — v1.168 (2026-10-22)

`test/printer-resolution.test.js` checks Starting Point keeps preview hidden, exposes its hidden-preview layout state, and lets the help text wrap naturally. `electron test/wizard-preview-runtime.js` measures form width against the body's full inner width on every step with the preview hidden; existing preview-on stock and later-page geometry, compact viewport, and navigation checks remain active.

REA's static `BtEnu.dll` resource 6676 confirms the Stock Selection page has Preview Area controls, but does not establish runtime width behavior; Starting Point is Q LABEL's added page and receives no native parity claim.

## Starting Point before Printer Selection — v1.171 (2026-10-22)

`test/printer-resolution.test.js` verifies the wizard opens on Starting Point, Blank template is selected by default, template-library radio is enabled, Select is disabled until library mode, library mode blocks Next until a template is picked, and Next advances to Printer Selection. `electron test/wizard-preview-runtime.js` verifies the visible page content, hidden preview, fixed wizard sizing, all eight footer steps, and navigation between Starting Point, Printer Selection and Stock Selection. The screenshot is the visual reference; static REA inventory found no Starting Point resource, so no native pixel-parity claim is made.

Verification record: `npm run test:basic` completed on v1.171 with 1,008/1,008 unit tests passing, 0 failed, 0 skipped; all 3 legacy checks passed, with no undocumented test files. Report: `test/basic-unit-result.json`; full output: `test/basic-unit-output.log`. The preceding run completed on v1.169 while an existing v1.170 release change was concurrently present, so this run was repeated after aligning to v1.171.

## New Document Wizard title bar — v1.166 (2026-10-22)

`test/modal-windows.test.js` ยืนยัน Wizard แสดงเฉพาะปุ่ม Close และ modal ปกติยังมี controls ตามเดิม; `test/wizard-preview-runtime.js` วัด header จริง 32px ตรวจปุ่ม Close/การไม่มี Minimize และทดสอบทั้ง 8 หน้า รวม preview, printer list, ปุ่ม footer และ navigation. เอกสาร BarTender อ้างอิงเป็นภาพที่ผู้ใช้แนบ; REA พบเฉพาะ contract ของ WizardBase/IWizardPage ไม่พบหลักฐาน runtime ของแถบหัว.

## Stock Selection restores predefined paper preview — v1.165 (2026-10-22)

`test/printer-resolution.test.js` verifies Stock Selection hides preview in custom mode and restores the pane after choosing predefined stock; `electron test/wizard-preview-runtime.js` checks the SVG renders within the fixed compact pane and shows the chosen stock label geometry and dimensions. Static REA resource evidence identifies the native Stock Selection controls but cannot confirm runtime preview composition; no pixel-parity claim is made.

## New Document Wizard ขอบขวา Modal — v1.164 (2026-10-22)

`test/project-home.test.js` ตรวจว่า header และ form ถูกกำหนดให้เต็มความกว้างด้านในของ modal พร้อมคง padding/margin ขวาของส่วนแนวขอบเป็นศูนย์; `test/wizard-preview-runtime.js` วัดขอบจริงของ header, form, heading, body และ footer เทียบกับกรอบ modal พร้อมคงการตรวจ printer list ที่ viewport ปกติและแคบ. REA ระบุ resource หน้า Wizard ได้ แต่ static resource ไม่ยืนยันสีหรือช่องว่างระหว่าง render; Electron fixture เป็นการตรวจ Q LABEL ไม่ใช่หลักฐาน pixel parity ของ BarTender.

## New Document Wizard printer list remains selectable — v1.163 (2026-10-22)

`electron test/wizard-preview-runtime.js` checks the real wizard layout in an isolated Electron fixture: the Printer list is at least 200px wide at normal and compact viewport sizes, and its property buttons move below the list when the available form column is narrow. It also retains all existing wizard page, size, preview and footer checks. REA resource 6673 identifies the installed BarTender Printer Selection page; static resource data does not establish runtime layout behavior.

## New Document Wizard fits the fixed frame — v1.162 (2026-10-22)

The modal-windows unit test verifies New Document Wizard has no maximize control or edge-resize behavior while other dialogs keep their resizer. Electron wizard-preview runtime checks all seven pages fit without body scrolling, the paper SVG preview stays within 168×220px, and the 604×466px frame stays fixed (576×466px in the 600px-wide fixture). REA resource IDs 6676/6688 identify Stock Selection and Items Per Page controls, but static resources do not establish native preview scaling; compact dimensions follow the user BarTender screenshot reference.


## พื้นหลัง SVG โลโก้ ABSS สีขาว — v1.161 (2026-10-22)

`test/abss-branding.test.js` ตรวจแผ่นพื้นหลังสีขาวใน SVG และลำดับที่อยู่หลังแผ่นแต่ก่อนภาพโลโก้; `electron test/wizard-branding-runtime.js` ตรวจ pixel จริงที่มุม canvas เป็น `[255,255,255,255]` ทั้ง viewport 900px และ 600px พร้อมคง regression เดิมครบ.

## พื้นหลังโลโก้ ABSS ใน Wizard — v1.160 (2026-10-22)

v1.160 ตรวจแผ่นพื้นหลังสีเขียวอยู่หลังภาพโลโก้และ pixel จริงเป็นสีเขียว; คำขอแก้ไขล่าสุด v1.161 เปลี่ยนเป็นสีขาวและ supersede ค่านี้. REA icon inventory ไม่ยืนยันสีพื้นหลังของโลโก้ใน Wizard จึงไม่อ้าง native parity.

REA ตรวจ resource/icon group ของ `D:/Programs/BarTend.exe`; static icon inventory ไม่ยืนยันพื้นหลังของ logo ใน wizard จึงเป็นการคืนงาน branding Q LABEL ตามภาพผู้ใช้ ไม่อ้าง native parity.

## New Document Wizard fixed modal size — v1.159 (2026-10-22)

`test/wizard-preview-runtime.js` วัดขนาดกรอบจริงทุก 7 ขั้นที่ viewport ปกติและยืนยันขนาดคงเดิม; viewport แคบต้องจำกัดตามพื้นที่หน้าต่าง (576×466 ใน fixture 600px) พร้อมยืนยัน preview, footer, และทางผ่าน Back/Next เดิมยังทำงาน.

REA ตรวจ BtEnu.dll resource 6673 ที่ตรงกับหน้า Printer แต่ resource แบบ static ไม่ยืนยันขนาดหน้าต่างตอนแสดงจริง; 604×466 px เป็นค่าที่วัดจากภาพ BarTender ที่ผู้ใช้แนบ ไม่อ้างว่าเป็น native pixel measurement.

## Printer Selection double-click — v1.158 (2026-10-22)

`test/printer-resolution.test.js` verifies a double-click advances to Stock Selection when exactly one enabled printer choice exists, a single click only selects, and a double-click with multiple choices does not advance. Electron `test/wizard-preview-runtime.js` repeats the single-printer flow in an isolated fixture and verifies Back returns to Printer Selection. This is the requested Q LABEL interaction; REA resource evidence does not establish native BarTender double-click behavior, so no parity claim is made.

## New Document Wizard right edge — v1.153 (2026-10-22)

`test/project-home.test.js` checks computed right margin and padding are zero for the wizard header, heading, body, preview panel and footer. Electron `test/wizard-preview-runtime.js` repeats the check in the actual isolated wizard runtime; existing seven-step preview/button and compact viewport assertions remain active. User screenshot shows the gutter; Q LABEL fixes its CSS. REA inspected installed `Seagull.WizardFramework.dll` wizard base/page contracts, but static managed metadata does not establish the stock wizard's per-screen spacing values, so native margin parity is not claimed.

## Properties selected-object default — v1.151 (2026-10-22)

`test/object-properties-pages.test.js` requires initial selected-only mode, switching to all without losing edits, and reset back to one selected root after an all-mode session. Multi-object behavior tests explicitly select All. `electron test/new-project-runtime.js` selects All before each of two successful project creations, then asserts Single is pressed and only one object root appears afterward (39 runtime checks total). Native default/persistence is not established; this is the user's Q LABEL requirement.

## Category scrollbar — v1.150 (2026-10-22)

`test/category-scrollbar-runtime.js` uses isolated Electron and the real stock catalog/wizard: opens Category, checks overflow-y:scroll and a normal-width scrollbar, scrolls to the final category, commits with a mouse click and verifies its stock list; keyboard Space opens and Escape preserves the original selection. Existing `test/printer-resolution.test.js` covers category selection and custom/predefined enablement. The popup closes on blur, dialog close and resize. Native BarTender scrollbar painting remains unverified.

## New-project grid and outer paper gap — v1.148 (2026-10-22)

| Test | Coverage |
|---|---|
| `test/page-gap.test.js` | Valid 1×1 zero-margin paper enables Show gap with four zero-distance edge guides; backing side widths and unused trailing paper are included without changing document data; existing positive margins/inter-label bands remain covered. |
| `test/page-gap-tabs.test.js` | Show gap renders top and bottom tabs (`data-paper-tab`) for a single-row roll; hidden gap renders nothing. Q LABEL behavior: no native BarTender evidence obtained for this feature (REA BtEnu.dll query returned no matches; BarTend.exe blocked by REA P0 admission). |
| `test/design-grid.test.js` | Hidden grid has no artwork; Snap remains independent of visibility. |
| `test/table-menu-icons.test.js` | Insert Table menu commands each get their own SVG matching the label instead of the generic plus icon. |
| `test/table-axis-edge-remap.test.js` | Adding a table row or column moves explicit border overrides past the inserted axis so the new cell boundaries are not lost. |

Checklist: new projects always start with Show grid off even after enabling it in the previous project; checkbox, ribbon and saved setting agree. `test/new-project-runtime.js` uses isolated appData with initial gridShow=true, creates two projects, enables grid between creations, checks the actual Show gap button displays all four edges on each 1×1 project, verifies Show/Hide round trip and unchanged print layout. Existing `test/page-gap-margins-runtime.js` covers nonzero margins in Chromium. Native pixel/runtime parity remains unverified.

## Ctrl+N reliability — v1.147 (2026-10-22)

| Test | Coverage |
|---|---|
| `test/new-document-shortcut.test.js` | Actual renderer handlers receive Ctrl/Cmd+N from inputs, table-like textareas, selects, contenteditable text and menu buttons even when the target stops propagation; physical KeyN with Thai layout; Home; repeat suppression; nonmatching modifiers; active modal guard; preload subscription and native key matching. |

Electron `test/new-document-shortcut-runtime.js` uses isolated appData and a fixture document. It drives actual `webContents.sendInputEvent` through main/preload/renderer with focus in canvas text, a table cell and a property input; checks one New dispatch per press, Cancel/reopen, held key, Thai DOM fallback, active Properties modal and Project Home. It asserts inline text/cell edits survive New/Cancel and the original file is unchanged. No printing. The native before-input hook and preload API need a new app process; the capture fallback also supports a renderer refreshed in an existing process.

## Wizard preview restored — v1.146 (2026-10-22)

Inventory for concurrently added shortcut coverage: `test/new-document-shortcut.test.js` checks New Document keyboard shortcut matching and its renderer/preload path.

The source-dialog keyboard fixture in `test/object-data-sources-ui.test.js` supplies the onNewShortcut registration bridge used by the extracted renderer shortcut block. Its existing assertions still require dialog-local commands to receive their keys without canvas actions.

Save As fixture `test/save-as-end-to-end.test.js` models preload IPC listener registration/removal with EventEmitter, preserving the existing shortcut/save assertions when production adds IPC shortcut listeners.

`test/printer-resolution.test.js` requires Printer Selection and Stock Selection preview to remain hidden in their respective steps while Items Per Page keeps its live single/multiple label-count preview; Category options are nonempty and custom mode keeps its selection empty. It also verifies all four footer actions have accessible SVG icons and the Back/Next/Cancel/Finish order. Electron `test/wizard-preview-runtime.js` measures matching 86×30px footer buttons with 14px SVG icons on every wizard page and checks Printer Selection and Stock Selection have no preview while Items Per Page retains it. Captures: `test-results/new-label-items-preview.png`. Items Per Page preview is a user-requested Q LABEL feature; resource evidence confirms only the native Stock Selection Preview Area label, not native runtime visibility.

## New Document Wizard branding — v1.141 (2026-10-22)

v1.161 checklist: title icon/text start 4px from the header's left edge; the ABSS SVG has a white background behind the logo and zero CSS padding. `test/wizard-branding-runtime.js` loads shared modal chrome and checks the SVG's rendered white corner pixel plus actual geometry at 900px and 600px, retaining the seven-step branding checks.

| Test | Coverage |
|---|---|
| `test/printer-resolution.test.js` | ABSS title identity and the same decorative Zebra SVG banner remain present through all seven wizard steps; accessible heading text is preserved |

`electron test/wizard-branding-runtime.js` loads the actual local SVG assets in an isolated profile, decodes both images, advances all seven steps, checks heading/art spacing at 900px and 600px, and captures `test-results/wizard-branding-900.png` / `wizard-branding-600.png`. Native resource 2225 establishes the reference banner composition; Zebra/ABSS rebranding is custom Q LABEL artwork, not a pixel parity claim.

Suite fixture correction: `test/table-content-fit.test.js` measures per-character rendering relative to the completed editor-opening render, and always closes JSDOM fixtures in `afterEach` so a failed assertion cannot leave the cell editor timer running. No per-character assertion is skipped or relaxed.

`test/save-as-end-to-end.test.js` loads the actual ProjectPrinterSelection module and renderer helper alongside real selectTemplate, so Save As continues through the project-printer restoration introduced in v1.143.

## BarTender Side Edges wizard — v1.133 (2026-10-21)

| Test file | Coverage |
|---|---|
| `test/printer-resolution.test.js` | Side Edges Yes/No, Left/Right disabled when No, mm/in conversion, Stock preview values, and Finish persistence to `stock.liner_left_mm` / `liner_right_mm` without changing page margins. |

Checklist: Side Edges is a separate wizard step after Template Size; wizard **defaults to inches**; **Yes** is the initial state with Left/Right **0.05 in**; No stores zero widths; Yes enables and stores independent Left/Right widths; preview shows backing edges; changing units preserves millimeter values. REA evidence does not establish BarTender runtime or implementation behavior, so this coverage verifies Q LABEL only.

## Printer remembered per project — 2026-10-22

| Test file | Coverage |
|---|---|
| `test/project-printer-selection.test.js` | Project printer preferences stay independent; opening each project restores its installed printer; unavailable project printer falls back to the saved application printer, then the first installed printer. |
| `test/printer-resolution.test.js` | New Label Finish records its selected printer against the created project. |

Checklist: switching projects restores that file's saved printer; selecting a printer updates both the app fallback and active project's preference; an unavailable preference does not block startup; New Label Wizard inherits the active project's selection and the created project remembers it. Electron `test/new-project-runtime.js` uses isolated appData and two fixture printers to verify new-project persistence and switching without printing. REA static API evidence did not establish BarTender's own per-project printer persistence, so this behavior is implemented and verified as a Q LABEL project preference.

## Stock catalog and Stock Selection preview — 2026-10-21

| Test | Coverage |
|---|---|
| `test/stock-catalog.test.js` | 54 categories/7,350 records, literal quotes, circle metadata, automatic inter-item spacing, reference name order and explicit dimensions |
| `test/template-library.test.js` | BarTender industry tag mapping, merged cloud/local catalog (`cloud_count` 480), cloud template browser IPC hook, new-document banner ZT410 SVG |
| `test/bartender-cloud-templates.test.js` | Cloud GraphQL size parsing, layout thousandths, normalizeCloudNode thumbnail/BTW URLs |
| `test/btw-preview.test.js` | Extract embedded BTW preview artwork, crop grey surround, retain printed ink and reject missing/damaged/wrong-aspect images |
| `test/btw-metadata.test.js` | `.btw` TemplateSize metadata (A4A Label when installed) |
| `test/stock-apply.test.js` | applyCatalogStockToTemplate ตั้ง page/stock จาก catalog และ round-trip สำหรับ preview ม้วน |
| `test/stock-catalog-ui.test.js` | หมวดสต็อกเริ่มต้นตามเครื่องพิมพ์ (Zebra → Standard Card Sizes, OneNote/PDF/AnyDesk → AOne), ชื่อ CR-50, มุมโค้งการ์ด CR50 |
| `test/stock-preview.test.js` | Actual SVG circle proportions, multi-column spacing, sheet rows/columns, CD holes, consistent Template Size caption and native-style roll illustration |
| `test/printer-resolution.test.js` | Stock Selection เริ่มด้วย custom settings โดยไม่มี stock เลือก; default category/list ถูกปิดและ Finish ไม่สร้าง stock.name; predefined Category อัปเดตเมื่อเปลี่ยนเครื่องพิมพ์ (OneNote → AOne, Zebra → Standard Card Sizes); รายการ stock ต้องเลือกเองและไม่เลือกแถวแรกแทนเอกสาร; Items Per Page preview redraws single/multiple label counts, circle Finish shape, inch conversion before/after stock selection, printer→stock→items-per-page→layout→dimensions→side-edges→summary order, predefined category/list, Category has no blank option, Single item default and enabled integer counts for Multiple, accessible footer SVGs/order, saved page geometry |

`node scripts/audit-bartender-stocks.js D:/Programs/mfg.stk` compares every packaged record against the installed source, including duplicate names and geometry. `electron test/stock-preview-runtime.js` uses isolated appData and the actual stock illustration module, checks preview geometry and both differently sized ADES AG 45404 rows, and captures a PNG; this component check does not place the illustration on Stock Selection. `electron test/wizard-preview-runtime.js` verifies preview visibility and compact footer controls across every wizard page. No physical printing. Native resource evidence confirms Stock Selection controls; exact native footer pixels, all-stock artwork parity, default corner rounding and printer-specific filtering remain unverified.

## Application branding (Q LABEL vs Electron) — 2026-10-21

| Test | Coverage |
|---|---|
| `test/app-branding.test.js` | ชื่อหน้าต่าง Q Label (เวอร์ชัน), AppUserModelId, กัน page-title เปลี่ยนเป็น Electron |

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
Runner ใช้ timeout 900 วินาทีสำหรับ unit suite ทั้งหมดเพื่อรองรับ inventory ที่ขยายตัวโดยไม่ฆ่า process หลัง 300 วินาที (`test/basic-test-policy.test.js` ตรวจค่านี้)

## Inventory: executable tests ที่ต้องรันทุกครั้ง

Symbology Q LABEL theme v1.078 supersedes the v1.076 Windows visual target: `test/symbology-page.test.js` checks rounded Q LABEL controls/subdialogs and SVG actions in addition to all encoder/transaction tests. `electron test/symbology-page-runtime.js` now asserts original820px host/185px navigation and the same real barcode edits. `electron test/symbology-visual-runtime.js` captures the actual controller/styles offscreen. No encoder, source or print behavior changes in this styling batch.

Modal close spacing v1.077: `test/modal-windows.test.js` ตรวจ gap8px/right margin8px; `electron test/modal-controls-spacing-runtime.js` ตรวจระยะจริง8pxทั้งสองช่องและขอบขวา20pxใน Properties ปกติ/maximize/restore พร้อมปิดหน้าต่างได้จริง. เป็นข้อกำหนดจากภาพผู้ใช้ ไม่ใช่ native BarTender pixel parity.

| `test/symbology-page.test.js` | Code128 X/density conversion, read without mutation, staged X/Print Method OK/Cancel, actual bitmap Code B/C, HIBC/GS1 validation, encoding limits, fit width/module range and real printer/host/hybrid ZPL paths |

Symbology v1.076: `electron test/symbology-page-runtime.js` uses isolated appData, 107 catalog options, native-style 976px dialog/two columns, forced Code128 controls, actual document bitmap/dimensions/Print Method changes and asserts geometry. `electron test/symbology-visual-runtime.js` renders the actual controller/styles in an isolated offscreen fixture and requires a nonblank image. No hardware printing. Native driver quantization, exact density display, complete GS1 wizard UX, and other symbologies' specific panels still require native comparison; do not claim 100% parity from this suite.

Properties tree connectors v1.075: `test/object-properties-pages.test.js` ตรวจแถวสุดท้ายของวัตถุแต่ละชุด รวม picture ที่ไม่มี Data Sources; `electron test/object-properties-tree-runtime.js` ตรวจเส้นหลักจบกึ่งกลางแถว, เส้นลูกเริ่มใต้ไอคอน Data Sources/ตรงศูนย์ไอคอน และเส้นแนวนอนถึงไอคอนข้อมูลจริง ก่อน/ระหว่าง/หลังเลือก Data Sources พร้อมทดสอบ source แถวสุดท้ายไม่ยืดเมื่อมี decoration. เป็น DOM unit + isolated Electron geometry ไม่ใช่หลักฐาน pixel parity ของ native.

| `test/rea-alternatives.test.js` | tooling: อ่าน metadata จริงแบบจำกัดรายการ, token/hash, unmatched, truncation และป้องกันเขียนทับ evidence directory / Node + PowerShell 7 |

REA fallback tooling (2026-10-20): integration กับ `D:/Programs/BarTend.exe` ตรวจแยกจาก unit tests: metadata 2,434 types/17,648 methods, native RVA → Ghidra decompile และ Windows UI ผ่าน Computer Use. Unit tests ไม่ยืนยัน BarTender parity หรือถอด managed/native ทุก method; ต้องมี PowerShell 7 พร้อม System.Reflection.Metadata. ดู `docs/rea-alternatives-2026-10-20.md` สำหรับคำสั่งและหลักฐานจริง.

| `test/barcode-inline.test.js` | HRI bold/italic/underline/wrap ที่ไม่เลือก font, ศูนย์นำหน้า, shared named source ไม่หลุด binding / DOM+model unit |
| `test/object-value-tree.test.js` | SVG แยกชนิด object, ป้ายชื่อ, drag-to-bind, click selection และเชื่อม renderer โดยไม่เริ่ม Insert placement / DOM+renderer unit |

Object Values และ HRI inline v1.058: `test/object-value-tree.test.js` ตรวจ icon/click wiring; `electron test/hri-object-values-runtime.js` ตรวจแถว Object Values แสดง SVG ตามชนิดและชื่อ object จริง, คลิกเลือกบน canvas, หัวหมวดไม่เปลี่ยน selection, HRI transparent/baseline/caret/hover และ live barcode update. `electron test/barcode-inline-runtime.js` ตรวจ caret/live bars/invalid/commit/Escape; `test/barcode-inline-async-runtime.js` ตรวจ latest-wins/blur/bitmap; `test/barcode-tools-runtime.js` audit 18 actions และ capability. ทุก runtime ใช้ isolated appData ไม่มี print transport.

| `test/editor-visibility.test.js` | canvas visibility กรอง enabled=false โดยคง index วัตถุ, Show/empty list / unit |

Layers Hide v1.056: `test/layer-hide-runtime.js` กด Hide/Showจริงจาก panel ใน isolated Electron appData ทั้ง text/barcode128 ตรวจ model, artwork และ hit/selection overlay หลังซ่อนและแสดงกลับ. ไม่มีการพิมพ์จริง.

| `test/layer-panel-layout.test.js` | Layers อยู่ใน flow ของ workspace, เปิด/ปิดคืนพื้นที่และใช้ relative positioning / DOM unit |

Layers dock v1.055: `test/layer-panel-runtime.js` ตรวจ Electronจริง 1200×800/900×650, panel ไม่ทับ preview/Zoom, อยู่ใต้ Ribbonและใน viewport, ปิดแล้ว preview ขยายกลับ. ใช้ isolated appData ไม่มีการพิมพ์.

Context SVG v1.054: `test/context-home-tools.test.js` ตรวจ actual command SVG ที่ต่างกัน ไม่มีตัวอักษรแทนไอคอน และ Copy เรียก handler เดิมหนึ่งครั้ง. `test/context-icons-runtime.js` เปิดเมนูจริงจาก module ใน isolated Electron/Chromium fixture ตรวจ SVG ขนาด18px/stroke และ Copy ทำงาน; full-app event dispatch fixture เปิดเมนูไม่สำเร็จ จึงไม่อ้างว่า runtime นี้ครอบคลุม event integration ทั้งแอป. v1.281: `test/object-context-color-icons.test.js` — context menu ใช้ `RibbonColorIcons.iconForLabel` (หลายสี) แทน stroke เทาเมื่อมี mapping. v1.285: `test/object-context-export.test.js` — ไม่แสดง Export Image บนหน้าว่าง; export ต้องผ่าน `selectionSupportsExportImage` / `isReplaceablePicture`.

Context formatting v1.053: `test/context-home-tools.test.js` ตรวจ3แถวของข้อความ, ตำแหน่งกลุ่มและ input/change ส่งถึง Ribbon เดิม; รูปทรงคง layout เฉพาะเดิม. `test/context-format-rows-runtime.js` ตรวจ geometry3แถวใน Electronจริงและ Bold ทำงานด้วย fixture/profile แยก.

Historical v1.064 (SUPERSEDED by v1.071 typed naming): previously restored a single generated sequence: new objects of every type receive `object 1..N`, deletion compacts the sequence and the lowest freed name is reused; custom names remain supported and duplicate names are rejected with the existing modern alert. Legacy default text/barcode/picture names migrate to the shared sequence while custom names are preserved. `test/object-names.test.js` covers migration, shared allocation, copy, deletion/reuse and duplicate validation; Electron `test/object-properties-tree-runtime.js` checks actual tree/canvas names after refresh and selection.

Data Type SVG v1.051: `test/number-type-ui.test.js` ตรวจ SVGครบ9ตัวเลือก/ค่าที่เลือก, Enter เปลี่ยนชนิดทันทีและ Escape คืน focus. `test/number-type-runtime.js` ตรวจ SVGจริงใน Electron, เมนูไม่ล้น viewport, คลิกและ Number/preview/reopen เดิม.

Named Data Source delete v1.050: `test/source-model.test.js` ลบ legacy definition ที่หายจาก `data_sources`, aliases และ references ที่ใช้ร่วมกัน, ล้าง `values`/placeholder เพื่อไม่คืนค่าค้าง, คงส่วนข้อความและแหล่งข้อมูลอื่นรวมข้อความที่เพิ่งแก้, sync cache หลายหน้า, resolver ส่งค่าว่างหลังลบ และชื่อไม่เหลือให้ dropdown เลือก. Electron `test/named-source-delete-runtime.js` ตรวจ actual sidebar context Delete และ dialog Delete ด้วย isolated appData; ยืนยัน sidebar/registry/value/object text ไม่มีค่าค้างโดยไม่ส่งพิมพ์จริง. REA ยังไม่ยืนยัน native delete-with-dependents policy.

| `test/number-format.test.js` | Number เทียบ native fixtures 1,308 กรณี: 6 Locale, 3 Precision, 5 negative patterns, grouping/leading zero/native digits, exact decimal rounding และ 0–30 decimals/invalid inputs |
| `test/number-type-ui.test.js` | Locale catalog 262 รายการ, live Sample ก่อน transforms, disabled Maximum, invalid precision ไม่เปลี่ยน model, คง input/focus, special notation, commit/reopen ไม่มี Apply |

Number v1.048: Electron `test/number-type-runtime.js` ตรวจจริง live Sample/วัตถุ, focus, ความกว้างไม่ล้น, Close/reopen และ prepared preview/native ZPL ด้วย profile แยก; ไม่มี transport หรือพิมพ์จริง. Fixtures: `test/fixtures/bartender-number-format.json`, `test/fixtures/bartender-number-edges.json`. Special notation คง implementation เดิม ไม่อ้าง native parity ครบทุก mode.


Ruler stability v1.047: `test/ruler-labels.test.js` ตรวจ cadence ยึดศูนย์ที่หลายสเกล, จำนวนลบ/ศูนย์/บวก, floating-point และช่วง visible ที่ทับกันหลัง pan ไม่เปลี่ยนเลขอ้างอิง. Electron `test/ruler-stability-runtime.js` ตรวจ trace ตัวเลขทั้งแกน X/Y เมื่อ pan หลายทิศทาง, ตำแหน่งตรง origin/scale และ redraw ขณะอยู่นิ่งไม่เปลี่ยนสเกลหรือเอกสาร. `test/ruler-appearance-runtime.js` ตรวจหน้าตา/ขอบเขต/หน่วยเดิมเพิ่มเติม; เป็น fixture แยก ไม่ส่งพิมพ์จริง.


Description catalog v1.046: `test/source-wizard.test.js` ตรวจครบ396รายการเทียบ fixture ที่สกัดจาก native, ลำดับ A–Year, ชื่อซ้ำตามต้นฉบับ, เลือก/บันทึก/เปิดใหม่/Cancel และค่าข้อมูลพิมพ์ไม่เปลี่ยน. Fixture: test/fixtures/bartender-description-terms.json. Electron `test/source-description-runtime.js` ตรวจรายการจริงในแอป, keyboard End, live metadata/Close/reopen และ Cancel ด้วย profile แยก; ไม่มีการส่งพิมพ์จริง.


Live settings v1.045: `test/object-properties-pages.test.js`, `test/object-data-sources-ui.test.js`, `test/svg-properties.test.js` ตรวจ checkbox/source/font/bitmap เปลี่ยนเอกสารทันที ไม่มี Apply, Close เก็บค่า, ชื่อซ้ำถูกปฏิเสธ และช่องกรอกไม่ถูกสร้างใหม่. `test/database-manager.test.js` ตรวจ SQL อัปเดต bound fields ทันที, invalid SQL และ rollback เมื่อบันทึกล้มเหลว. `test/barcode-catalog.test.js` ตรวจเปิดหน้าไม่บันทึก, checkbox encode ทันที และปิดก่อน debounce ไม่สูญค่า. `test/table-design.test.js` ตรวจ border dropdown/color อัปเดต model โดยไม่มี Apply Borders. `test/object-properties-tree-runtime.js` ตรวจ live checkbox/input/Close และ Undo snapshot ใน Electron จริงด้วย profile แยก (ไม่พิมพ์จริง). ข้อความ draft/Apply/Cancel ในรายการเวอร์ชันเก่าด้านล่างเป็นประวัติ; v1.045 ใช้ live/Close สำหรับหน้าหลัก ส่วน wizard ยังมี OK/Cancel.


Properties tree v1.044: `test/object-properties-pages.test.js` ตรวจ scroll wrapper
และระยะเยื้องก่อน/ระหว่าง/หลัง Data Sources; `test/object-names.test.js` ตรวจ
legacy typed defaults เป็น object ลำดับรวม และชื่อเฉพาะไม่เปลี่ยน.
`test/object-properties-tree-runtime.js` วัด geometry/pseudo-element เส้นประในแอป
Electron จริงทั้ง3สถานะ รวมชื่อ tree/canvas, source ไม่ซ่อน และคลิกเลือกวัตถุจริง.

Paper margins v1.043: `test/page-gap.test.js` ตรวจ 1 column / 1 row เปิด Show gap
ได้เมื่อมี margins, แสดงป้าย mm ครบ4ด้าน, ไม่สร้าง inter-label gap, ไม่แก้ model,
และไม่วาดค่าศูนย์/ติดลบ/invalid. `test/page-gap-margins-runtime.js` ตรวจปุ่มและ SVG
จากโมดูลจริงใน Chromium fixture รวม sheet viewBox, ระยะ1.78mm ทั้ง4ด้าน และ model ไม่เปลี่ยน.
การรัน full-app `test/page-gap-runtime.js` รอบv1.043หมดเวลาระหว่างโหลด renderer;
รอบv1.044วันที่2026-10-20ผ่านทั้ง gap bands, selection, model และ Page Setup arrows.

REA workflow audit (2026-10-19) changes agent instructions/documentation only;
it adds no application behavior or unit inventory entry. REA CLI target identity
verification is recorded in `docs/rea-bartender-workflow.md` and is distinct from
application unit/runtime coverage.

รายการนี้เป็นรายการไฟล์จริง ไม่ใช่หลักฐานว่า coverage ทุกเคสใน checklist ครบแล้ว เมื่อเพิ่มไฟล์ใหม่ต้องเพิ่มแถวที่นี่ คำสั่ง `test:basic` ตรวจจับไฟล์ unit ที่ยังไม่ได้ลงรายการ

| ไฟล์ | จุดตรวจหลัก / ประเภท |
|---|---|
| `test/basic-test-policy.test.js` | การค้นหาไฟล์ unit ทั้งหมดและการตรวจ inventory / unit |
| `test/source-model.test.js` | ordered refs, migration แบบไม่แก้ต้นฉบับ, stable IDs หลายหน้า/ด้าน, round trip, clone/link, แก้ข้อความโดยตรง และ reconciliation หลังลบ legacy named source/alias/reference/value โดยไม่คง output เก่า / unit |
| `test/source-resolver.test.js` | typed per-object graph, concatenation, cycles, context sources, diagnostics และข้อมูลภายนอกที่ยังไม่พร้อม / unit |
| `test/source-session.test.js` | draft/commit/cancel, shared named definitions และทิ้ง async response ที่ล้าสมัย / unit |
| `test/source-types.test.js` | Unicode/control bytes, numeric formats, locale, dates/timezones และ binary validation / unit |
| `test/source-transforms.test.js` | character-template ตามตัวอย่างคู่มือ, HRI แยก encoded data, replace/filter/range/length/truncation/prefix/suffix / unit |
| `test/source-output-parity.test.js` | shared evaluator ให้ค่า preview และ print ตรงกัน, transforms ครั้งเดียว, print ปฏิเสธ unresolved data / unit integration |
| `test/object-data-sources-ui.test.js` | source tree/toolbar/สามแท็บ, reorder/copy/paste, keyboard scope, Properties Apply/Cancel และ preview draft; ปุ่ม Configure เป็น SVG แยกจากข้อความซ้ำ มี accessible name/tooltip และยังเปิด transform editor ชนิดเดิม / DOM unit |
| `test/source-wizard.test.js` | standalone source wizard: staged/cancel/finish, duplicate names, default named link และ dispose / DOM unit |
| `test/source-hosts.test.js` | server/CLI ใช้ async source preparation, อ่านไฟล์ใหม่ต่อ job, dry-run ไม่ส่งพิมพ์, serial pre-send rollback และ unknown outcome / host integration |
| `test/source-adapters.test.js` | อ่านไฟล์ใหม่ตอนพิมพ์, file error, VBScript, binary compression, catalog artwork ราย record / Node integration |
| `test/source-ipc.test.js` | preview preparation อ่าน serial start จากไฟล์โดยไม่กินเลข และ file/directory picker cancel/selected path / IPC unit integration |
| `test/source-library.test.js` | vendor-generated Data Builder plain XML, language/ID/table selection, preserved string values และ invalid/duplicate/entity validation / unit |
| `test/source-vbscript.test.js` | Windows Script Host จริง, Unicode, named source bridge, syntax error และ timeout / Windows integration |
| `test/source-ledger.test.js` | durable atomic ledger, concurrent reservations, idempotency/restart, unsent rollback/unknown hold และ reserved-key source IDs / unit |
| `test/source-serialization.test.js` | durable reservation, concurrency, preview ไม่กินเลข, failed/unknown outcomes, print runtime ผ่าน mock transport และ retry cleanup ของ temp directory บน Windows / unit integration |
| `test/source-counter.test.js` | เลขจำนวนเต็มขนาดใหญ่และศูนย์นำหน้า, automatic/alphabetic/alphanumeric/hex/custom sequence และการข้ามตัวอักษรสับสน / unit |
| `test/source-matrix.test.js` | QR/Data Matrix matrix จาก byte จริง, ไม่แปลง byte เป็น UTF-8 และ reject byte ผิดช่วง / encoder integration |
| `test/source-gs1.test.js` | AI validation, checksum, dates, actual FNC1 separators และ HRI / encoder integration |
| `test/source-picture.test.js` | decode/resize/color/dither และ encoded image bytes ที่อ่านกลับได้ / unit |
| `test/picture-color.test.js` | preserve ภาพสีจาก canvas/JSON, SVG preview แสดงสี, print preview และ Zebra output ใช้ bitmap ขาวดำเดิม รวม background / DOM+unit integration |
| `test/recent-thumbnails.test.js` | identity ของภาพสีแยกกันได้เมื่อ bitmap ขาวดำสำหรับพิมพ์เหมือนกัน / DOM unit |
| `test/access-database.test.js` | อ่าน Access, ไฟล์ผิดชนิด/ไม่มีไฟล์ / unit และ Windows ACE integration |
| `test/auto-save-policy.test.js` | debounce, ปิด Auto Save แล้วไม่มีการบันทึกเบื้องหลัง, ตั้งค่า checkbox ที่ System Settings, บันทึก preference และจัดการ persistence error / unit และ DOM unit |
| `test/barcode-catalog.test.js` | ประเภท barcode, encode, หมวด, custom SVG, readable text, Symbol picker imported-symbol category labels in English as Custom and persists/displays imported symbols; Insert button SVG contrast; preview image loading/errors / unit |
| `test/context-home-tools.test.js` | คำสั่ง Home ใน object context menu, ซ่อน Print ที่ไม่ต้องการใน dropdown โดยคงคำสั่งอื่น, forwarding event, enabled/disabled / DOM unit |
| `test/data-sources-ui.test.js` | dialog และ context menu ของ data source / unit |
| `test/database-manager.test.js` | SQLite, field type, filter/sort, alias, prompt, query validation / unit |
| `test/database-origin-marker.test.js` | field token และ source marker / unit |
| `test/database-setup.test.js` | import, ชื่อ field, setup และการ bind; Next/Back มี SVG ลูกศรขวา/ซ้ายและคงไอคอนหลังเปลี่ยนขั้นตอน / unit + DOM |
| `test/design-grid.test.js` | ระยะ grid, สัดส่วน, visible/snap, snap delta/pointer coordinates with page-origin phase and pass-through when disabled; grid clip ตามขอบ rounded/ellipse paper รวมตำแหน่งและรัศมีมุมจาก renderer / unit + DOM |
| `test/preview-snap.test.js` | Preview Settings แสดงตำแหน่งพิกัดที่ snap ตามระยะ grid และกลับเป็นพิกัดเดิมเมื่อปิด Snap; โหลด module ใน browser |
| `test/preview-navigation.test.js` | middle-button pan state ปิดกั้น wheel pan/zoom ตลอดช่วงกดค้าง, ปล่อย pointer ที่ไม่ตรงกันไม่ยกเลิก gesture, wheel กลับทำงานหลัง pointer จบ และ zoom anchor map จาก geometry ที่วัดไว้โดยไม่ต้องอ่าน layout ต่อเฟรม / unit + browser module |
| `test/qr-preview.test.js` | QR matrix ใน editor, print/cache behavior และลากขอบ QR เป็นจัตุรัสพร้อมรักษาขนาดเมื่อย้าย / unit + DOM |
| `test/new-label-stock-mode.test.js` | New Label Wizard เริ่มที่ Use a predefined stock และเปิด Category/Stock list / DOM unit |
| `test/databuilder-import.test.js` | อ่าน Data Builder XML fixture จาก BarTender, schema ตารางว่าง/เซลล์ขาด, ชื่อ encoded, nil cells และ reject version/DTD/legacy/reserved names / unit |
| `test/bitmap-recovery.test.js` | Placeholder frame/circle/path ใช้เส้น non-scaling คงความหนาขณะเลือกและลาก; Bitmap validator ใช้กฎเดียวกับ decoder; editor preview ใช้ placeholder แทน image/background ที่ bitmap เสียโดยคงไฟล์งานเดิมและ artwork อื่น; Print History thumbnail ที่ image ไม่มี bitmap ไม่ขัดขวาง startup; ส่วน non-editor render ยังคงปฏิเสธ bitmap เสีย / unit + DOM; Electron full startup และ recovery button ตรวจใน `test/startup-bitmap-runtime.js` |
| `test/project-home.test.js` | ปุ่ม Create a New Label เปิด wizard และ wizard อยู่เหนือ Project Home; title bar สีเขียวและกรอบเขียวเข้ม; ปุ่ม footer แบ่งความกว้างตามแถว, wrap ก่อนข้อความล้น, ไอคอนขนาดกะทัดรัด 16px และ label อยู่แนวนอนในปุ่ม โดย SVG preview ยังเต็ม panel; การ์ดโปรเจกต์หลายหน้าเปลี่ยน preview ทุก 3 วินาที, การ์ดหน้าเดียวคงภาพเดิม, wrap กลับหน้าแรก, คลิกเปิดไฟล์ตามปกติและล้าง timer เมื่อ Home ซ่อน / DOM unit; Electron ตรวจที่ 440px ใน `test/runtime-ui.js` |
| `test/edit-history.test.js` | clone undo แชร์ bitmap_hex, gesture clone แชร์ database rows/elements ที่ไม่แก้, fingerprint แทน JSON.stringify, revive/serialize / unit |
| `test/editor-selection-render.test.js` | สลับเลือก/ยกเลิกเลือกใช้ selection overlay เดิม, ล้างกรอบเดิมหลัง canvas redraw แม้ cache ว่างเมื่อคลิกพื้นที่ว่างหรือเลือก object อื่น, fallback เมื่อ overlay ใช้ไม่ได้ / unit |
| `test/canvas-selection-dismiss.test.js` | blank primary pointerdown ล้าง selection ทันที; click object/control, Shift/Ctrl/Meta marquee, no-selection และ non-primary ไม่ล้างผิด / unit |
| `test/formatting-hotkeys.test.js` | Ctrl+B/I/U ขณะเลือกหลายตารางพร้อมกันใช้กับทุก cell, toggle ปิดเมื่อทั้งหมดเปิด และไม่เปลี่ยน cell ข้างเคียงเมื่อเลือก cell เดียว / DOM unit |
| `test/font-family-catalog.test.js` | enumerate Windows system font families, normalize/sort/deduplicate, fallback, and render every installed family in the formatting picker using its own face / unit + DOM |
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
| `test/modal-windows.test.js` | Settings title stays outside its separate content scroll area; footer ของ Modal ที่ resizable อยู่ชิดล่างด้วย body ที่เลื่อนภายในได้ทั้ง footer ตรงและ footer ภายใน form; modal resize อิสระแยกแกน/ขนาดขั้นต่ำตามเนื้อหา และ New Label Wizard ที่กำหนด data-fixed-size ไม่มีปุ่ม maximize/edge-resize; เมื่อเปิด dialog ใหม่ให้ซ่อนตัวก่อนหน้าและคืนกลับเมื่อปิด, เปิดซ้ำเลื่อนขึ้นหน้าและปิดตัวที่พักไว้ไม่รบกวนหน้าปัจจุบัน / DOM unit |
| `test/object-distance-guides.test.js` | ขอบ object, ระยะใกล้สุด, หมุน และ guide / unit |
| `test/object-names.test.js` | ชื่อ object 1..n ใช้ลำดับร่วมกันทุกชนิด, แปลงชื่อ default แบบเก่า, คงชื่อ custom, นับใหม่หลังลบ, reuse เลขต่ำสุด, paste ได้เลขถัดไป, ห้ามชื่อซ้ำ/ว่าง และ modern alert พร้อม SVG error/checkmark ในปุ่ม OK / unit + DOM unit |
| `test/object-selection-name.test.js` | ชื่อ object เหนือมุมซ้ายบนและชิดกรอบเลือก, ชื่อกำหนดเอง/ชื่อว่าง, escape markup, ชื่อยาว, zoom และ rotation / DOM unit |
| `test/page-gap.test.js` | gap overlay ซ่อนตั้งต้น, วาดแถบตามระยะ/rows/columns ที่ตั้งใน Page Setup โดยไม่รับ pointer, toggle สลับ Show/Hide พร้อม ARIA/disabled เมื่อไม่มี gap และไม่แก้ข้อมูล layout / DOM unit; Electron ตรวจ canvas, selection, model invariance และลูกศร Page Setup |
| `test/page-setup.test.js` | includes no-stock documents leaving saved stock list unselected (`selectedIndex=-1`) and not applying its first entry; bottom continuation rounded corner visibility for both upper arcs, one/two columns and multiple radii; Page Setup tab order, Stock encoder tabs visible/disabled with explanations, paper/units/margins/layout/apply and dialog rollback, inch width/height accepts four displayed decimals, inch width/height step follows displayed precision and accepts four decimals such as 2.0079/0.9843; inch corner radius accepts and stores four decimal places; every Page Setup tab hides object artwork, editor preview retains artwork, Layout divides blank paper into selected rows/columns in manual mode, rounded and ellipse label shapes match the Layout preview, all modal preview pages show only Template Size and hide margin dimension labels, always draws physical gap arrows between label cells on both axes, unusable saved gap does not block column selection and restores editable gap field, OK recovers an unusable gap draft and saves selected columns with the last usable gap, automatic template recovers saved manual_gap=false and keeps applicable gap editable, manual gap toggle precedes inputs, Page Setup closes before confirmation and Scale Templates; scaling OK leaves both dialogs closed; Cancel/Escape restores Page Setup draft, app-styled accessible confirmation with current/new sizes, explicit Scale/Keep choices, Escape restores draft without saving, complete scaling option lists, editor paper bounds/canvas stay at opening size through Page Setup and Scale Templates draft/Cancel, then shrink to one template only after acceptance, significant-size threshold prompt, Yes/No paths, modal current/new sizes and percentages/default rules, modal Cancel/Escape retains Page Setup draft, OK scales artwork with one undo snapshot and one persistence, validation error rollback / DOM + unit |
| `test/page-setup-capabilities.test.js` | Media modes resolve supported/unsupported/unknown from selected printer profile evidence / unit |
| `test/photo-registration.test.js` | registration รูป, อัตราส่วนและพิกัด / unit |
| `test/print-regressions.test.js` | print routing, validation, duplicate submit, graphic/page origin, measured-media fitting preserves multi-column page geometry and repeats artwork into every column, Print dialog uses semantic printer/preview/cancel SVGs and one Cancel action, titlebar X closes even after preference persistence failure, Cancel closes without saving, closed Print has display:none at startup/after Cancel/X, held Ctrl+P does not reopen after Cancel and Electron shortcut rejects auto-repeat, footer stays at the dialog bottom while settings content scrolls / unit + DOM |
| `test/printer-media-profile.test.js` | media profile และค่ากระดาษ, แยก print-mode choices จาก `media.printmode` ใน `allcv` มาเป็น capability ของ profile / unit และ loopback integration |
| `test/stock-catalog.test.js` | รายชื่อผู้ผลิตและ stock จาก `mfg.stk`, การแปลง mil เป็น mm และค่าขนาด/ขอบ/gap แบบสี่ตำแหน่ง / unit |
| `test/startup-error-ui.test.js` | startup failure แสดง exception เหนือ Ribbon แบบไม่ถูก clip, อ่านได้ด้วย screen reader, โฟกัสปุ่ม Reload พร้อม SVG reload สีขาวขนาด 16px และแทนที่ error เก่า / DOM unit |
| test/startup-error-ui.test.js | startup failure แสดง exception เหนือ Ribbon แบบไม่ถูก clip, อ่านได้ด้วย screen reader, โฟกัสปุ่ม Reload และแทนที่ error เก่า / DOM unit |
| `test/printer-resolution.test.js` | เปลี่ยนเครื่องพิมพ์แล้ว Next ไม่กระพริบ disabled ระหว่างอ่าน DPI; เอา placeholder `Select printer…` ออกจาก main/wizard; เลือกเครื่องที่บันทึกไว้ถ้ายังติดตั้ง หรือเลือกเครื่องแรกที่พบและบันทึกอัตโนมัติ; New Label แสดง printer list 8 แถว ไม่มีตัวเลือก Printer language และคงค่า ZPL ภายในเอกสารใหม่; ปุ่ม Document Properties/Printer Properties ส่งชื่อเครื่องกับโหมด preferences/property ไป native bridge; bridge ส่งชื่อเครื่องพิมพ์ผ่าน IPC และ stale main process ใช้ nominal DPI ที่ระบุในชื่อ printer queue พร้อม notice ให้ restart โดยไม่แสดง error; ชื่อที่ไม่มี DPI ไม่สร้างค่าขึ้นเอง; ตรวจ DPI แนวนอน/แนวตั้งจาก Windows printer driver, ปฏิเสธค่าที่หาย/ไม่ตรง/ผิดช่วง, wizard ไม่แสดงแถว Resolution, บล็อกเมื่อไม่มี DPI, ป้องกัน response เก่าทับเครื่องพิมพ์ใหม่และบันทึก DPI ใน template; เปิด wizard เริ่มที่ printer แล้วเรียง Stock Selection, Items Per Page, Label Layout, Dimensions, Side Edges, Summary; default เป็น custom โดยปิด category/list และไม่เลือก stock; Finish ไม่เขียน stock.name เมื่อยังไม่เลือก; predefined ต้องเลือกจาก stock list ด้วยตนเองและใช้ stock ที่เลือกเท่านั้น; Page Setup ไม่ auto-select stock แถวแรกเมื่อไม่มีชื่อ stock; ซ่อน preview ใน Stock Selection และคง preview ใน Items Per Page, Single เป็นค่าเริ่มต้นและ Multiple เปิด Rows/Columns, footer Back/Next/Cancel/Finish มี SVG ขนาด 14px และปุ่มขนาด 86×30px เท่ากันทุกหน้า; ไม่มีตัวเลือก roll/sheet ในทุกโหมด; เลือก predefined ADES AG 49908 เพื่อใช้ขนาดละเอียดสี่ตำแหน่งได้ / unit และ DOM unit |
| `test/recent-thumbnails.test.js` | recent thumbnail และสัดส่วนภาพ, รวม table identity ให้เหลือรายการเดียวแม้จำนวน/ขนาด rows และ columns ต่างกัน, ล้าง duplicate เก่าจาก settings และเก็บ table ล่าสุด / unit และ DOM unit |
| `test/ribbon-help-icons.test.js` | ปุ่ม Keyboard shortcuts ใช้ SVG รูปแป้นพิมพ์และ About Q LABEL ใช้ SVG info-circle แทนไอคอนเอกสารทั่วไป / DOM unit |
| `test/ribbon-hover-menus.test.js` | pointer เข้าพื้นที่ dropdown ที่ Text/Picture ใช้ร่วมกันแล้วคงเจ้าของเมนู Picture ที่เปิดอยู่; hover จาก Table ไป Symbols เปิด `.symbols-menu` / DOM unit |
| `test/tis-symbols-ribbon-menu.test.js` | Symbols ribbon dropdown แยกจาก modal; More Symbols และ tile เปิด `openPicker` / source regression |
| `test/ribbon-availability.test.js` | ปุ่ม/ช่อง/กลุ่มและ text formatting ที่ disabled ยังคงมองเห็น, แท็บ Picture ยังอยู่ใน ribbon, รายการ New ใน File menu ไม่มี outline/border แม้กฎ focus กลางโหลดทีหลัง, ชื่อโปรเจกต์ใช้พื้นที่ก่อน Search และคำนวณใหม่เมื่อ resize; Snap to grid แสดง border เฉพาะ hover ไม่ค้างเมื่อ active/click; แท็บ Home, Insert, Layout, Picture, Data, View, Tools, Help เปิดเมื่อ mouse/pen hover, ไม่สลับเมื่อ touch ส่ง hover compatibility event, ยังคง click และ native button keyboard activation / DOM unit |
| `test/ribbon-action-icons.test.js` | SVG up/down ที่แตกต่างกันสำหรับการเพิ่ม/ลดขนาดฟอนต์, SVG เครื่องพิมพ์พร้อม viewBox และ aria-hidden / DOM unit |
| `test/ribbon-file-hover.test.js` | File dropdown เปิดจากคลิกโดยคงแท็บและแผงเดิม ไม่แสดงแผง File ว่าง; เมนูเปิดเมื่อ pointer เมาส์/ปากกา hover, ไม่เปิดจาก touch hover ที่สังเคราะห์ และยกเลิก close timer ที่ค้าง / DOM unit; `test/ribbon-availability-runtime.js` ตรวจพฤติกรรม File นี้ใน Electron |
| `test/sidebar-glass.test.js` | หัวข้อ Recently Used Objects และ Data Sources ใช้พื้นขาวโปร่งแบบ glass/backdrop blur, ตัวเลื่อน zoom ไม่มีกรอบ focus สีเขียวค้าง / DOM unit |
| `test/preview-paper-shadow.test.js` | กระดาษ preview ไม่มี box-shadow/drop-shadow ตกใต้ฉลาก (พื้น workspace แบบเรียบ) / DOM unit |
| `test/ruler-visibility.test.js` | ปุ่ม ribbon แสดง/ซ่อนไม้บรรทัด (ไม่มี auto-hide); แมป `rulerMode`/`rulerVisible` ใน settings |
| `test/ruler-labels.test.js` | ตัวเลข ruler ทั้งสองแนวเป็นสีเขียว 15px บนแถบ 19.5px; เลขนอกกระดาษยังแสดงบนพื้นโปร่งใส โดยลบ tick มืดที่อยู่ใต้ตัวเลขและไม่ลบพื้นส่วนที่ทับช่วงกระดาษ; พื้นช่วงวัดกระดาษไม่ clearRect จนเกิดช่องสีเข้ม, พื้นนอกขอบกระดาษโปร่งใส, clip กับ viewport, แถบแนวตั้งยาวถึงปลายกระดาษที่มองเห็นแม้เลย frame และแสดงเลข 0 เมื่อ origin อยู่ในพื้นที่ที่มองเห็น, จุด 0 แกนตั้งตรงกับขอบกระดาษเมื่อ frame มี border และ scroll, ค่าติดลบที่ปัดเป็นศูนย์ไม่แสดง `-0.00` และตัวชี้/ป้ายพิกัด snap เข้าจุด 0 เมื่อค่าที่แสดงเป็นศูนย์ / canvas unit |
| `test/label-document.test.js` | นามสกุล `.qlabel`, ตัวกรอง Save As dialog และ normalize path / unit |
| `test/save-as-end-to-end.test.js` | Save As (`.qlabel` default), cancel/error, serialization, IPC, ไฟล์ temporary และโหลดประวัติแก้ไขกลับ / integration ผ่าน mock |
| `test/save-as-unsaved-guard.test.js` | Save As เคลียร์ unsaved ก่อน select copy — ไม่เรียก prepareEditorNavigation / unit |
| `test/windows-qlabel-association.test.js` | ไอคอน `.qlabel` และการลงทะเบียน association บน Windows / unit |
| `test/svg-properties.test.js` | SVG properties และการคงข้อมูล / DOM unit |
| `test/svg-selection-handles.test.js` | ทุก object ที่ใช้กรอบ resize ร่วมกัน (text, shapes, raster/SVG, barcode, QR และ table) แสดง marker และ hit target มุมทั้งสี่; ระหว่าง resize จุดมุม, hit target, toolbar และเครื่องมือคงขนาดหน้าจอพร้อมยึดตำแหน่งกับ object; เส้นขอบ artwork ไม่พองจนปิดพื้นที่ canvas เมื่อซูมสูง โดยคง stroke width เดิมที่ไม่คูณ canvas scale ระหว่าง preview และคืน SVG attributes หลังจบ; selected barcode แสดงจุดลาก HRI บนกลางหัวตัวเลขที่อ่านได้ทั้งชิดซ้าย/กลาง/ขวา และ hit target มีรัศมีคงที่ 4px ทุก zoom เพื่อไม่ทับ handle ล่าง; ระหว่างลาก HRI กรอบเขียวชิดตัวเลขไม่เว้นช่องว่างจากกล่อง HRI (`huggingSelection`); HRI drag ปรับ offset และไม่เปลี่ยนความสูงแท่ง, ส่วน handle สีขาวล่าง resize ความสูงแท่งและคง HRI offset โดย HRI คงขนาดทั้งแกน X/Y และตำแหน่งตามปลายแท่งทั้งช่วงลาก/หลังปล่อย (`gui/barcode-hri-resize.js` preserveSize); วาด controls ใหม่ระหว่างลาก HRI แล้วยังคงกรอบเลือกสีเขียว; ไฮไลต์ overflow เปลี่ยน path/สถานะเมื่อหมุนออกนอกกระดาษ และซ่อนอีกครั้งเมื่อกลับเข้ากระดาษ; ป้ายองศาหมุนแสดงเลขเต็มและอัปเดตทุก 1° / DOM unit |
| `test/table-design.test.js` | cell style, whole-table style targets and multi-cell scoped updates, borders, row/column resize, autofit, keep and reindex cell styles/rich-text ranges on row/column move, duplicate and delete / unit |
| `test/table-ribbon-selection.test.js` | mixed selection คงแท็บเดิม/primary object, table-only selection เปิด Table, สลับตารางแล้วยังจำแท็บปกติเดิม, empty/text-only ไม่เปิด Table / DOM unit |
| `test/table-content-fit.test.js` | applyTableOuterSize คงขนาดลากวางและ ensureContentFits ไม่ขยายเมื่อปิด auto, contentMin ลดตามข้อความปัจจุบัน, จำลอง double-click เปิด cell editor แล้วลบข้อความหลายบรรทัดผ่าน input event ตรวจว่าทั้งแถวและตารางยุบ, พิมพ์หลายตัวแล้ว model เปลี่ยนทันทีโดยไม่ bake/วาด canvas ต่ออักษรและ commit bake/วาดครั้งเดียวตอน blur, กรอบเขียว cell editor มุมเหลี่ยม, ความสูงกรอบ editor ใช้ vertical SVG scale แยกจาก horizontal scale และไม่เกินขอบแถว, กรอบ active cell ขยายตามขนาด row/column ใหม่เมื่อ repaint, คลิกนอกตารางปิด cell editor และล้าง active cell outline โดยคลิก toolbar ยังคง selection, หดแถว Word line ถึงพื้นข้อความ, contentExtent / DOM unit |
| `test/table-corner-controls.test.js` | SVG + ที่มุมขวาบน/ซ้ายล่าง, hover icon คงขนาด 24px และ hit target 32px ทุก zoom, click/keyboard action, เพิ่มแถว/คอลัมน์ว่างโดยคงข้อมูลเดิม, ปฏิเสธตารางผิดรูปและ limit 100 / DOM unit |
| `test/table-context-menu.test.js` | จัดคำสั่งตารางเป็นกลุ่ม Rows/Columns/Cell/Style/Layer/Table, submenu เปิดด้วย hover/focus โดย click ไม่เปิดหรือ toggle ปิด, ส่ง action layer z-order ทั้ง 4 แบบ, ส่ง action เดิม และซ่อนคำสั่งลบแกนที่ไม่เกี่ยว / DOM unit |
| `test/table-divider-gesture.test.js` | ลากเส้นแถว/คอลัมน์แบบ live ไม่ bake/draw ทุกเฟรม, เรียก repaint กรอบ active cell หลัง live geometry update, commit หลัง pointerup ครั้งเดียว / unit |
| `test/stroke-width-control.test.js` | hover เครื่องมือความหนาเส้นแสดงวงขอบเขียวรอบปุ่มรัศมี 17px หนา 2px และเส้นไกด์ตามขอบวัตถุ, ซ่อนเมื่อออกจาก hover, ไม่มีเส้นเฉียงโยงจากขอบไปไอคอน และล้างสถานะเมื่อกลับมาที่ canvas / DOM unit |
| `test/text-measure.test.js` | font cache, invalidate, Thai/emoji grapheme / unit |
| `test/template-pages.test.js` | Selected thumbnail keeps its green border without dark outer shadow rings; filmstrip แสดง SVG thumbnail ของ artwork ทุกหน้า, เลขหน้า, ขนาดการ์ดและปุ่มเพิ่ม, split add control 114×64px (72px + 40px), hover ที่ลูกศรเปิดเมนูทันทีและเมนูอยู่เหนือปุ่ม/จัดขอบขวาตรง พร้อม ARIA expanded, เมนูปิดทันทีเมื่อ pointer จาก dropdown เข้า split control และไม่เปิดซ้ำเมื่อผ่านลูกศรจน pointer ออกจาก control; ปุ่ม + หลักไม่เปิดเมนูและ hover ลูกศรเปิดได้หลัง pointer ออกจาก control, ย้ายจากลูกศรเข้าเมนูแล้วคงเปิด, เพิ่มหน้าเปล่า/ทำสำเนาเมื่อเลือก, พื้น light glass, ellipsis SVG แสดงเมื่อ hover/focusและไอคอนอยู่กึ่งกลางปุ่ม, hover ที่ ellipsis เปิด page action menu ทันทีโดยไม่ต้องคลิกและไม่เปลี่ยนหน้า, เมนู … ยึดกับการ์ดหน้า เปิดเหนือปุ่มและจำกัดความสูง/เลื่อนภายในเมื่อพื้นที่เหนือไม่พอ โดยไม่ทับปุ่มหรือสืบทอดข้อจำกัดไปยังเมนูเพิ่มหน้า, ไม่สร้าง native scrollbar ของ thumbnail/bottom preview, ความกว้างตามจำนวนหน้าและเลื่อนด้วยล้อ/drag เมื่อเกินพื้นที่, accessible name, เลือกหน้า, ลาก reorder ซ้าย/ขวาพร้อมคงหน้า active และ content, undo/dirty/persistence ครั้งเดียวต่อ reorder, เมนูแสดงและทำงาน Ctrl+X/Ctrl+C/Ctrl+V/Ctrl+D/Ctrl+Enter/Delete/F2/Alt+Enter เมื่อ focus อยู่ที่แท็บหรือเมนูหน้า; Cut disabled เมื่อเหลือหน้าเดียวและย้ายหน้าลง clipboard เมื่อยังมีหน้าอื่น, F2 แก้ชื่อ และ Alt+Enter เปิด Page Setup > Templatesโดยไม่เรียก object hotkeys, Properties ใช้ SVG sliders ที่แสดงรางและปุ่มปรับ 3 จุดแยกกัน; Rename inline ผ่าน Enter/blur และ Escape cancel / DOM unit |
| `test/template-scaling.test.js` | Do Not Scale preserves geometry, Scale Thickness adjusts line stroke, template size threshold (10% inclusive), proportional/free text with independent horizontal/vertical metrics, text/barcode/picture/line/shape/table/QR geometry formulas, barcode proportional/free choices, picture-backed table row/column sizing, all design sides and template pages, metadata preservation, atomic failure / unit |
| `test/text-range-format.test.js` | รูปแบบข้อความเป็นช่วง UTF-16, bold/italic/underline/strike/font/size/color/background/inverse, toggle/clear เฉพาะ selection, normalize และเลื่อน offset หลังแก้ข้อความ / unit |
| `test/tool-placement.test.js` | วาง object, point/drag, preview/commit เส้นทแยงตรงกับ pointer และชนิด tool / DOM unit |
| `test/transform-history.test.js` | transform history และ reset เดี่ยว/กลุ่ม / unit |
| `test/barcode-hri-drag-runtime.js` | Electron runtime: HRI left/center/right, vertical drag, cursor, live marker, Undo/Redo และ ZPL alignment; isolated appData |
| `test/app-branding.test.js` | ชื่อหน้าต่าง Q LABEL, Windows AppUserModelId, กัน page-title เป็น Electron / Node unit |
| `test/version-display.test.js` | รองรับ rollover v1.000; แสดงเลขเวอร์ชันเดียวกันใน ribbon, settings, sidebar และ window title; normalize prefix/empty และคงเวอร์ชันตัวเลข 0.990 เป็น v0.990 / DOM unit |
| `test/data-sources.js` | serial/date/time, expression, circular reference, print values / basic assertions |
| `test/print-job.js` | copies, records, offset, cache, export และ TCP loopback / basic integration assertions |
| `test/smoke.js` | core render/encoder และคำสั่งเครื่องพิมพ์ / basic assertions |

## Checklist พื้นฐานที่ต้องครอบคลุมทั้งระบบ

แต่ละแถวต้องมี assertion สำหรับกรณีปกติ กรณีว่าง/ขอบเขต กรณีผิดพลาด และความคงอยู่ของข้อมูลที่เกี่ยวข้อง อย่าตีความชื่อไฟล์ test ว่าครอบคลุมทุกข้อโดยอัตโนมัติ

Coverage inventory v1.066: `test/object-properties-pages.test.js` เพิ่มการยืนยันว่า Fit barcode width เปลี่ยนขนาดจริงของ catalog barcode, linear barcode, QR และ Data Matrix พร้อมคงสัดส่วนภาพและอัปเดต preview; Electron `test/fit-barcode-width-runtime.js` กดปุ่มกับ preview จริง; `test/modal-windows.test.js` เพิ่มการอ่าน computed gap ของปุ่ม SVG ทั้งสามตัวในหน้าต่างลอย

| ส่วนระบบ | เคส basic บังคับ |
|---|---|
| 01 เริ่มโปรแกรม / หน้าเลือกโปรเจ็กต์ | ไม่มีโปรเจ็กต์, โหลด recent, ไฟล์หาย/JSON เสีย, เลือกโปรเจ็กต์, fallback settings, malformed image/background bitmap แสดง placeholder ใน editor โดยไม่ขัดขวาง workspace และคงข้อมูลต้นฉบับให้แทนที่/ลบได้ แต่ print/export ยังคงปฏิเสธ bitmap ที่เสีย (`test/bitmap-recovery.test.js`), หน้าเลือกโปรเจ็กต์ไม่มีคำเตือน unsaved เมื่อไม่มีการแก้ไข |
| 02 New / Open / Import / Close | สร้าง blank/default label, open/import สำเร็จ, cancel ไม่เปลี่ยนงาน, ไฟล์ผิดชนิด, เปลี่ยน/ปิด label โดยรักษาการตัดสินใจ save/discard/cancel |
| 03 Save / Auto Save / Save As | save/load round trip, System Settings toggle ที่ persist mode และ debounce ด้วย fake timer, Auto Save ปิดโดย default จนผู้ใช้ opt in, ปิด Auto Save แล้ว edit ไม่เขียนไฟล์เบื้องหลัง, เปิด Auto Save ขณะ dirty บันทึกตาม policy, manual Ctrl+S/Save, success/error, บันทึกสำเร็จล้าง dirty, ไม่มีการแก้ไม่ dirty, undo กลับข้อมูลที่บันทึกแล้วไม่ dirty, Save As ไม่ทับต้นฉบับ และ dialog ใช้ `.qlabel` เป็นค่าเริ่มต้น |
| 04 Unsaved prompt / Exit / Reload | clean ไม่ถาม, manual mode เมื่อเปลี่ยน/สร้าง label ที่มี dirty edits ให้ถาม Save/Don't Save/Cancel, Save สำเร็จก่อนนำทาง, Don't Save ทิ้งเฉพาะเมื่อเลือก, Cancel อยู่หน้าเดิม, autosave off ไม่แอบบันทึก, reload เก็บงานตาม policy, prompt ไม่ซ้อน |
| 05 Templates / Recent / Pages | การ์ดโปรเจกต์ carousel preview ตาม template_pages ทุก 3 วินาทีเมื่อมีหลายหน้า, หน้าเดียวคงเดิม, คลิกเปิดโปรเจกต์ได้และล้าง timer เมื่อซ่อน Home; CRUD, rename/duplicate/pin/remove, template pages เพิ่ม/เลือก/เปลี่ยนชื่อผ่านเมนู Rename ที่เปิด inline input บนหน้าและ Enter ยืนยัน/Escape ยกเลิก/blur ยืนยัน/ชื่อว่างไม่ถูกบันทึก/ลบ/ลาก reorder ซ้าย/ขวาโดยรักษาหน้า active และข้อมูลหน้า, filmstrip มี SVG thumbnail แยกตาม artwork ของแต่ละหน้า, เลขหน้า, selected state, accessible name, ขนาดคงที่, พื้น light glass, ellipsis แสดงเมื่อ hover/focus และเปิดเมนูโดยไม่เปลี่ยนหน้า, เมนู … อยู่เหนือการ์ด/ไม่ทับปุ่มและเลื่อนภายในเมื่อพื้นที่ไม่พอ, ลูกศรข้าง + เปิดเมนูเพิ่มหน้าเปล่าหรือทำสำเนาเมื่อเลือก โดยทั้งสองรายการมี SVG artwork ที่วาดได้ (`test/template-pages.test.js`, Electron `test/template-navbar-size-runtime.js`), ความกว้างพอดีกับจำนวนหน้าและปุ่มเพิ่ม, เลื่อนด้วยล้อ/drag เมื่อเกินพื้นที่โดยไม่แสดง native scrollbar, ซ่อน bottom scrollbar ของ preview ขณะออกแบบ, active index ไม่เกินจำนวนหน้า, ข้อมูลหน้าไม่ปน, thumbnail ไม่บีบ/ตัดภาพ, คีย์ลัดหน้าใน context menu แสดงและทำงาน, Recently Used Objects มี table ได้รายการเดียวแม้จำนวน/ขนาดแถวและคอลัมน์ต่างกัน และ migration ยุบรายการ table ซ้ำเก่าพร้อมบันทึกกลับ settings; เปิดโปรเจกต์แล้วคืน printer ประจำไฟล์ (`test/project-printer-selection.test.js`, `test/new-project-runtime.js`) |
| 06 การเลือก / Layers / Groups / Clipboard | click/select/multi-select/marquee, ป้ายชื่อทุกชนิด object เหนือมุมซ้ายบนเมื่อเลือก รวม multi-select, ชื่อกำหนดเอง/ชื่อว่าง/ชื่อยาว/markup ต้องปลอดภัย, ขนาดตาม zoom และตาม rotation, ไม่ปนใน artwork, select/deselect Text ซ้ำโดยไม่ full redraw เมื่อมี overlay พร้อมและยกเลิกเลือกจากพื้นที่ว่าง, multi-select สร้างกรอบรวมได้, fallback เมื่อ overlay หาย, เมนูย่อย Layer ใน object context menu เปิดด้วย hover และ ArrowRight โดยไม่ต้องคลิก, ออกจาก pointer แล้วปิด; object context dropdown ไม่มีคำสั่ง Print แต่ยังแสดง Home actions ที่ใช้กับวัตถุได้ (`test/context-home-tools.test.js`); group/ungroup, lock/unlock, z-order (front/forward/backward/back, preserve multi-selection order, update selection indices, undo/redo), drag reorder, hidden object, copy/cut/paste/duplicate, ID ใหม่ไม่ชน, cancel ไม่เปลี่ยน model; ชื่อ object อัตโนมัติใช้เลขร่วมทุกชนิด เริ่ม object 1, delete แล้วนับใหม่และ reuse เลขต่ำสุด, ห้ามชื่อซ้ำ/ว่าง, Properties Apply เปิด modern alert แทน native dialog (`test/object-names.test.js`, `test/object-properties-pages.test.js`, Electron `test/object-properties-tree-runtime.js`) |
| 07 Move / Resize / Rotate / History | พิกัดและขนาดแต่ละ anchor, min/max, aspect ratio, rotated pivot, หลาย object, Shift/Alt, origin return, pointerup flush, cancel, undo/redo/reset, outline style เป็นส่วนหนึ่งของ history fingerprint; ย้อนกลับ/ทำซ้ำได้ (`test/formatting-capabilities.test.js`, `test/edit-history.test.js`), object ที่ไม่ถูกแก้คงข้อมูลเดิม, ปุ่ม Undo/Redo ทั้ง Ribbon และ quick access disabled เมื่อ history ของตนว่างและเปิดใช้งานแยกกันเมื่อมีรายการตรง stack, Snap to grid เปิดแล้วลาก/resize เข้าระยะ Grid Step ที่อิง origin กระดาษ; ปิดแล้วลากอิสระและ resize คง precision เดิมโดยไม่เข้าระยะ Grid Step; จุด grid อยู่เฉพาะในขอบ rounded/ellipse paper, alignment guides ยังคงเมื่อเส้นจัดแนวอยู่บนจุด grid, ลากย้ายเส้นทแยงหลังวางต้องรักษามุมและ endpoints ทั้งระหว่าง preview และหลัง commit, object ที่ใช้กรอบ resize ร่วมกันทุกชนิดแสดงและลาก marker มุม NW/NE/SW/SE ได้ รวม table; ระหว่าง resize จุดมุม, hit target, toolbar และเครื่องมือไม่ถูกยืดและยังยึดกับตำแหน่ง object; ความหนาเส้นขอบ artwork คงเดิมทั้ง preview/commit และไม่คูณด้วย zoom จนบังพื้นที่ canvas (`test/svg-selection-handles.test.js`, Electron `test/svg-selection-bounds-runtime.js`) (`test/svg-selection-handles.test.js`, Electron `test/svg-selection-bounds-runtime.js`); เส้นใช้ endpoint controls ของตน, barcode HRI handle แสดงจุดเหลืองเมื่อเลือกและพื้นที่ลากคงรัศมี 4px ไม่ทับ handle resize ล่างหรือปุ่มหมุน/ย้ายที่ zoom ต่างกัน; ลาก handle สีขาวล่างเพิ่มความสูง barcode โดยคง HRI offset และคงขนาดตัวเลข/ตำแหน่งสัมพันธ์กับปลายแท่งทั้งช่วง preview กับหลัง commit (`gui/barcode-hri-resize.js`, Electron `test/svg-selection-bounds-runtime.js`), ส่วนลากจุดเหลืองเปลี่ยนเฉพาะ HRI offset; วาด controls ใหม่ระหว่างลากจุด HRI แล้วยังกรอบเลือกสีเขียว `.sel` อยู่ครบโดยตำแหน่งกรอบตาม object, ป้ายองศาระหว่างหมุนเป็นเลขเต็มอัปเดตตามมุมจริงทุก 1° โดยคง snap และ snap guide (DOM unit ตรวจ 14°, 15°, 16°; Electron ตรวจป้ายทั้งหมุนอิสระและ snap ขณะลาก), ไฮไลต์แดงตามตำแหน่งและสถานะ overflow ระหว่าง preview การหมุนและซ่อนเมื่อกลับเข้ากระดาษ (unit `test/svg-selection-handles.test.js`, Electron `test/svg-selection-bounds-runtime.js`), ปุ่มปรับมุมโค้งอยู่ห่างจุด NW ของ object อย่างน้อย 4px; ปุ่มหมุน/ย้ายมีกรอบเขียวเมื่อ mouse/pen hover และล้างสถานะเมื่อ pointer leave (`test/line-controls.test.js`, Electron `test/picture-home-runtime.js`), จับ undo ตอนลาก/ย่อ-ขยายไม่ JSON.stringify bitmap/rows บนเฟรม gesture (gesture clone แชร์ database rows และ element ที่ไม่ถูกแก้, เลื่อน record revision ไปหลัง pointerup, เทียบ revision ด้วย fingerprint); ป้ายวัดความหนาเส้น/ขนาดช่องตารางอัปเดตตัวเลขแต่ตรึงตำแหน่งไว้ที่จุดเริ่มลาก แล้วซ่อนเมื่อจบ gesture (`test/gesture-measure.test.js`, Electron `test/picture-home-runtime.js`) |
| 08 Pointer / Refresh-rate / Zoom / Pan | รับตำแหน่งล่าสุดหนึ่งครั้งต่อเฟรม, coalesced event, ลากแท็บ template ซ้าย/ขวาเพื่อ reorder, 60/120/144/240/380 Hz ด้วย fake RAF, ไม่มี fixed FPS cap, zoom anchor, min/max zoom, fit page, wheel burst, pan clamp, middle-button drag ขณะ wheel ไม่เริ่ม pan/zoom ซ้อนและไม่เปลี่ยนขนาด/สัดส่วนกระดาษ preview, ปล่อย/ยกเลิก pointer แล้ว wheel ใช้ได้ตามเดิม และไม่สะสม handler (`test/preview-navigation.test.js`, Electron `test/runtime-ui.js`) |
| 09 Grid / Ruler / Units / Guides | mm/in/dots round trip ตาม DPI, tick spacing ตาม zoom, ตัวเลขไม้บรรทัดเป็นจำนวนเต็ม สีเขียวและแสดงต่อทั้งใน/นอกกระดาษโดยพื้นที่นอกกระดาษยังโปร่งใส, minor ticks ไม่มีเลขทศนิยม, ไม้บรรทัดซ้ายยาวถึงปลายกระดาษหรือ viewport ใต้ navbar แล้วแต่ว่าถึงก่อนและแสดง 0 เมื่อ origin มองเห็น, pointer marker ตรงพิกัด, พิกัดที่ปัดเป็นศูนย์ไม่แสดงเครื่องหมายลบและ marker/ป้ายจัดตรงกับ tick 0, toggle Show/Hide gap ใน View เริ่มซ่อนและแสดงเฉพาะแถบ gap ตาม page layout เมื่อเปิดโดยไม่แก้ค่า template/print; ปุ่ม disabled เมื่อไม่มี gap, gap arrows ใน Page Setup ไม่เปลี่ยน (`test/page-gap.test.js`, Electron `test/page-gap-runtime.js`), snap/guide เดี่ยว/กลุ่ม/หมุน, ไม่เรียก layout เต็มใน hot path |
| 10 Text / Formatting | ไทย/อังกฤษ/emoji/newline/empty, font size/family, installed Windows font families appear in natural order and each option previews in its own family (`test/font-family-catalog.test.js`, Electron `test/font-family-catalog-runtime.js`); fallback works if font enumeration is unavailable; bold/italic/underline/strike เปิดและปิดจริง, active state ตาม selection, mixed styles, live text color ไม่ต้องปิด picker, alignment, wrap, line spacing, ไม่มี glyph ขาด; ช่วงข้อความที่เลือกใน table cell รับ Ctrl+B/I/U และ toolbar font/size/color/background/inverse/clear โดยอักษรข้างเคียงไม่เปลี่ยน; เมื่อเลือกหลาย table object แล้วกด Ctrl+B/I/U ต้องเปลี่ยนทุก cell ในทุก table ที่เลือก, กดซ้ำปิดรูปแบบครบ และเมื่อเลือก cell เดียวต้องไม่เปลี่ยน cell ข้างเคียง |
| 11 Tables ทั้งหมด | เพิ่ม/ลบ/duplicate row-column, ย้าย row/column แล้ว cellStyles กับ cellTextStyles ต้องเคลื่อนตาม cell; duplicate คัดลอก format และ delete ต้อง reindex format ของ cell ที่เหลือ, เพิ่มคอลัมน์ที่มุมขวาบนและแถวที่มุมซ้ายล่างเมื่อคลิกปุ่ม SVG +, ปุ่ม + ซ่อนจน hover/focus และมุมเหล่านั้นไม่มีจุด resize กลม, hover ปุ่มปรับความหนาแสดงวงขอบเขียวรอบตัวปุ่มและเส้นสีเขียวตามขอบตารางและไม่มีเส้นเฉียงเชื่อมไอคอน, เมนูคลิกขวาจัดกลุ่มคำสั่งแถว/คอลัมน์/เซลล์/รูปแบบ/ตารางและเปิด submenu ด้วย hover/focus พร้อมเรียก action เดิม, fixed/auto/min/max, ตัวเลข/ข้อความยาว/ข้อความไทย, column แคบแล้ว wrap และ row โต, shrink ถึงขนาดที่พอดีโดยไม่ตัด (contentMin คำนวณจากข้อความปัจจุบัน, double-click เปิด cell editor แล้วลบ/ย่อข้อความผ่าน input event ต้องลดความสูงแถวและตาราง, พิมพ์ข้อความต่อเนื่องแล้ว input/model อัปเดตทันทีโดยไม่ bake หรือวาด canvas ทุกตัวอักษร และ bake/วาดครั้งเดียวเมื่อจบการแก้, กรอบ cell editor มุมเหลี่ยมไม่โค้ง, ความสูงกรอบ editor ตาม vertical SVG scale และไม่เกินเส้นขอบแถว, คลิกนอกตารางต้องปิด editor และล้างกรอบ active cell แต่คลิก toolbar คง selection, หดด้วยเส้น Word ได้), กรอบ active cell ต้องตามขนาด row/column ระหว่าง resize สดและหลัง commit, เลือก object ตารางแล้วการจัดฟอนต์/ขนาด/สี/พื้นเซลล์/แนวจัดวาง/ตัวหนา/เอียง/ขีดเส้นใต้/ขีดทับต้องมีผลทุก cell; เมื่อเลือกบาง cell ต้องเปลี่ยนเฉพาะช่องที่เลือก, หน้าดู/หน้าแก้ตัดบรรทัดตรงกัน, selection/hover ตรงขอบจริง, cell format/border/fill, undo/redo, table ไม่ถูก rasterize ทุกเฟรม, ลากเส้นแถว/คอลัมน์ใช้ updateTableSVG สดโดยไม่ bake/drawEditorCanvas ทุก RAF (bake ครั้งเดียวตอนปล่อยเมาส์), ลากสีเส้นรวม input หลายครั้งเป็น SVG preview ต่อเฟรมและไม่มี full render/persist |
| 12 Images / SVG / Shapes / Lines / Symbols | import/replace, invalid bitmap/SVG, transparency/background removal, natural aspect, SVG bounds, แสดงจุดจับลากที่มุมทั้งสี่ของ SVG และคงจุดจับเดิมสำหรับ raster/table, bitmap sizing, shape preset, ellipse/box stroke, line endpoint crossing/rotation/thickness และ SVG body ตรงกับจุดจับเมื่อวาดทแยง, ปุ่มลูกศรปรับความหนาเส้นทีละ 1 จุดพิมพ์ตามหน่วยและไม่กระโดดไป minimum, floating toolbar ของเส้น/รูป/ข้อความไม่มีปุ่ม More และ actions ที่เหลือยังทำงาน, symbol catalog และ persistence |
| 13 Data Sources | constant/embedded/entry/global/object/expression/table/job/date/time/serial, leading zeros, empty/missing, recursive/circular references, overrides, data type และ mapping, เปลี่ยน record ไม่แก้ข้อมูลต้นฉบับ; ต้นไม้ Properties แสดงชื่อแหล่งข้อมูลใต้ทุกวัตถุด้วยไอคอนเอกสาร ไม่ใช่เครื่องหมายบวก (`test/object-properties-pages.test.js`) |
| 14 Database ทั้งหมด | CSV/JSON/Excel/XML/SQLite/Access ที่รองรับจริง, header/alias ชนกัน, ไม่มี row, column หาย, Unicode, SQL read-only, parameter missing, joins/filter/sort/limit, reload/reconnect/cancel/failure, record navigator และ field binding |
| 15 Page / Label / Stock / Printer Settings | Page Setup tabs in BarTender order, Stock sub-tabs and unsupported RFID/Magnetic Stripe tabs visible/disabled with explanations, disabled Wizard and tray/source reasons, printer media modes enabled only when the selected profile's `media.printmode` choices from `allcv` confirm support (otherwise unknown/unsupported stays disabled), preserved legacy mode cannot emit an unsupported command, New Label Wizard hides Resolution from printer and summary steps and reads/stores DPI automatically from the selected Windows printer driver's matching horizontal/vertical resolution; missing/invalid driver DPI is explained and blocks Next/Finish, stale main-process IPC uses neutral restart guidance and may use only nominal DPI explicitly present in the selected queue name, changing printer ignores stale responses (`test/printer-resolution.test.js`); New Label sequence is Printer → Stock Selection → Items Per Page → Label Layout → Dimensions → Side Edges → Summary, default custom shows but disables Category/Stock name, predefined mode enables the 8-row stock catalog, Single item is default and Multiple enables validated rows/columns, Stock Selection and Items Per Page hide the preview pane, footer order Back/Next/Cancel/Finish; Electron runtime checks the sequence and selected ADES AG 49908 geometry using temporary appData (`test/printer-resolution.test.js`, `electron test/printer-resolution-runtime.js`); predefined stock category/name and dimensions, paper size, margin, gap, rows, columns and orientation are applied from the full `mfg.stk` catalog without precision loss (`test/stock-catalog.test.js`, `test/printer-resolution.test.js`); no printing; width/height/DPI, inch/mm conversion and readable preview precision (mm 2 places/in 3 places), corner radius accepts the precision displayed by the selected unit (including 0.0472 in), margins/gap/rows/columns (multi-column/row auto-enables layout; invalid saved gap cannot prevent column state/controls from updating; clicking OK with an invalid gap restores the last usable gap and saves selected rows/columns; gap controls follow axis and manual/automatic state; Layout preview continuously shows two-headed gap arrows spanning physical cell edges on both axes; every Page Setup preview shows blank paper without user objects; editor preview retains artwork; Layout divides into blank cells in manual template mode; focus arrows and shared preview), orientation/rotation/separate sides, paper shape, printer profile, calibration/offset, page/template/print outer edges and origins align; template scaling threshold, proportional/free text metrics by axis, proportional text and picture geometry, free/proportional barcode choices, free shape/table geometry including picture-backed table axes, constant line thickness, square QR/Data Matrix modules, every design side and saved template page, metadata/table/bitmap preservation, and atomic rollback (`test/template-scaling.test.js`); 10% inclusive threshold prompt, size/percentage display, defaults, No keeps artwork geometry, modal Cancel/Escape keeps Page Setup open, OK commits one scaled change and one undo snapshot, validation failure rollback (`test/page-setup.test.js`); isolated mixed-artwork Yes/No/Cancel and saved-side/page runtime (`electron test/page-setup-runtime.js`) |
| 16 Print / Protocol / Server / CLI | measured-media graphic fitting preserves multi-column paper geometry and emits artwork for every label; Print dialog shows semantic Test Print/Print/Preview/Cancel SVG icons and has one footer Cancel control; titlebar Close closes despite preference-save rejection, Cancel closes, held Ctrl+P does not reopen after Cancel, and app startup keeps Print closed with no visible layout box; Cancel/titlebar X remove the dialog from the screen (`test/print-regressions.test.js`, Electron `test/runtime-ui.js`); action footer stays flush with the modal bottom while settings scroll internally; render ของ ZPL/TSPL/EPL/CPCL/EZPL ที่รองรับ, barcode/QR/check digit, copies/serial/data records, quantity invalid, clipping/layout origin, mock transport printer/IP/USB, error/timeout, ไม่ส่งซ้ำหลัง ambiguous failure, CLI parse/validation และ server request validation |
| 17 Preview / Export / History | preview ตรง model, กระดาษ preview ไม่มีเงา offset ใต้ฉลาก (`test/preview-paper-shadow.test.js`), line outline Solid/Dot/Dash/Erase ตรงกันระหว่าง SVG และ raster, Erase คง fill และไม่ส่ง outline ไป ZPL, undo/redo เก็บ outline style (`test/formatting-capabilities.test.js`); วัตถุ Inverse เติมพื้นดำและกลับ RGB ของ artwork ที่อยู่ด้านบนเฉพาะส่วนตัดกัน โดยคง artwork ปกติด้านนอก (`test/inverse-rendering.test.js`, พิกเซล Electron `test/inverse-rendering-runtime.js`); vector/raster มีขนาดตรงกัน, export PNG/SVG/รูปแบบอื่นที่รองรับ, DPI/alpha/crop/selection, malformed input, cancellation, print/edit history round trip และจำกัดจำนวนรายการ; Undo/Redo disabled/enabled สอดคล้องกับ stack ทั้ง Ribbon และ quick access |
| 18 Search / Hotkeys / Ribbon / UI | Alt+Q focus search, Ctrl+S/Save As/Undo/Redo/Copy/Paste (Paste ต้องแสดงแต่ disabled เมื่อ clipboard ว่าง), hotkey ขณะอยู่ input/modal, Ctrl+C/Ctrl+V/Ctrl+D/Ctrl+Enter/Delete สำหรับหน้าทำงานเฉพาะเมื่อ focus อยู่ที่ tab/context menu และไม่เรียก object hotkeys; focus input ไม่ถูกดักคีย์, เมนูย่อยใน right-click context menu เปิดทันทีเมื่อ hover โดย click ไม่ใช่เงื่อนไขหรือ toggle ปิด, keyboard focus/ArrowRight ยังเปิดเมนูได้ (`test/table-context-menu.test.js`, `test/layer-menu-hover.test.js`); คำสั่ง disabled ยังมองเห็นและกดไม่ได้ในทุกแท็บ/กลุ่ม รวมช่องและเครื่องมือ formatting ที่ unavailable (แถบจัดรูปแบบยังแสดงเมื่อไม่เลือก object), label `Line` ต้องเว้นระยะจาก Line style และช่องความหนาเส้นทั้งใน Ribbon และ object context menu (`test/formatting-capabilities.test.js`, Electron `test/formatting-line-spacing-runtime.js`), แท็บ Picture แสดงเสมอและปิดคำสั่งตาม selection; แท็บ Home, Insert, Layout, Picture, Data, View, Tools, Help เปลี่ยน panel เมื่อ mouse/pen hover, touch ที่จำลอง hover ไม่สลับแท็บ, click และ native button keyboard activation ยังคงทำงาน (DOM unit และ Electron runtime), command disabled/active (Undo/Redo ใน Ribbon และ quick access disabled เมื่อ history ของตนว่างและแยกเปิดใช้เมื่อมีรายการ), quick access Undo/Redo ไม่ค้างกรอบหลังคลิกเมาส์และยังเข้าถึงด้วย focus คีย์บอร์ด, ปุ่ม Snap to grid ไม่มีกรอบ/outline ค้างจาก active หรือ click และแสดงกรอบสีเขียวเฉพาะ hover (`test/ribbon-availability.test.js`, Electron `test/snap-grid-border-runtime.js`), ปุ่ม Print ในกลุ่ม Action ของ Home ใช้ SVG และเปิด print dialog เดิม; ปุ่มเพิ่ม/ลดขนาดฟอนต์แสดง SVG ลูกศรขึ้น/ลงและเปลี่ยนทีละ 1 pt (`test/ribbon-action-icons.test.js`, Electron `test/home-action-icons-runtime.js`), toolbar ตามชนิด object, ชื่อ object อยู่เหนือและชิดกรอบเลือก โดยคงขนาดเมื่อซูมและไม่รับ pointer event, Keyboard shortcuts ใช้ SVG แป้นพิมพ์และ About Q LABEL ใช้ SVG info-circle, ปุ่ม Insert ใน Symbol picker แสดง SVG สีขาวตัดพื้นเขียว (`test/barcode-catalog.test.js`, Electron `test/action-button-ui-runtime.js`), แสดงเวอร์ชันปัจจุบันในแถบ ribbonและตรงกับ settings/sidebar/window title, Create a New Label จาก Project Home เปิด wizard ไว้เหนือ Home; title bar สีเขียว/กรอบเขียวเข้ม พร้อม footer buttons แบ่งความกว้างตามแถวและ label อยู่ในกรอบปุ่มที่หน้าต่างกว้าง 440px (`test/project-home.test.js`, Electron `test/runtime-ui.js`), modal ใหม่แทนที่การแสดงผลของหน้าก่อนหน้าและคืนหน้าก่อนเมื่อปิด; nested-dialog flow เก็บ draft ได้โดยไม่มีเนื้อหาซ้อน (`test/modal-windows.test.js`, Electron `test/page-setup-runtime.js`), barcode preview แสดงภาพที่โหลดสำเร็จหรือข้อความสถานะเมื่อ preview ใช้ไม่ได้ (`test/barcode-catalog.test.js`, Electron `test/barcode-tools-runtime.js`), focus/keyboard navigation, dialog button SVG, Print When OK icon contrast on white (`test/object-properties-pages.test.js`, Electron `test/object-properties-object-runtime.js`), white glass/blur and text contrast on white/gray/black backgrounds, zoom bar no green outline on slider focus |
| 18a Ribbon project title | ชื่อโปรเจกต์ขยายใช้พื้นที่ก่อนช่อง Search โดยเว้นระยะ, ลดความกว้างตาม viewport เมื่อ resize และข้อความยาวแสดง ellipsis (`test/ribbon-availability.test.js`; Electron `test/ribbon-title-layout-runtime.js` ที่ 1400px และ 900px) |
| 19 Settings / Persistence / Errors | settings/defaults/version รวม Auto Save preference, validation, restart/load fixture round trip, async IPC failure, write failure, missing file, ไม่มี handler เพิ่มซ้ำ, ไม่สร้าง dirty จาก hover/select/zoom หรือการเปิดหน้าธรรมดา |
| 20 Testing infrastructure | test discovery ครบ, เอกสารครบ, case ใหม่เข้ารายการ, deterministic clock/RAF, fixture isolation, exit code และ report มี failed/skip ตามจริง |
| 21 Object Properties / Auto Fit | Fit barcode width ต้องใช้ฟิลด์ขนาดจริงของ catalog barcode (`width_mm`), QR (`width_mm`), Data Matrix (`magnification`) และ linear barcode (`module_width`); ขนาดไม่เกิน Maximum width, preview อัปเดต และ barcode catalog คงอัตราส่วนภาพ (`test/object-properties-pages.test.js`, Electron `test/fit-barcode-width-runtime.js`) |
| 22 Floating dialog controls | dialog สร้างปุ่ม minimize/maximize/close SVG ครบสามปุ่มและเว้นระยะ 8px ตาม UX ที่กำหนด โดยไม่เปลี่ยนการซ้อน/คืน dialog (`test/modal-windows.test.js`) |

เคสเพิ่มเติมของ checklist แถว 15: Columns 1 → 2 โดย Keep current objects บนหน้าอื่นในไฟล์เดียวกัน แล้วกลับ 1 ด้วย Scale ต้องคงขนาด/ตำแหน่ง object เดิม; object ที่เพิ่มหลังเปลี่ยน layout ใช้ขนาดอ้างอิงของตัวเอง, Do Not Scale จำขนาดเดิม, metadata อยู่ครบหลัง JSON reload และหลายหน้า/ด้าน (test/template-scaling.test.js, test/page-setup.test.js, Electron test/page-setup-runtime.js).

เคสเพิ่มเติมแถว Printer/New Label: เมื่อ renderer reload แต่ main process ยังไม่มี get-printer-resolution ให้แจ้ง restart แบบข้อความแนะนำที่ไม่ใช่ error; ใช้ได้เฉพาะ nominal DPI ที่มีอยู่ในชื่อ queue ส่วนชื่อที่ไม่มีตัวเลข DPI ต้องไม่มี fallback; หลังเปิดแอปรอบใหม่อ่าน DPI จริงจาก driver ผ่าน IPC ได้ (`test/printer-resolution.test.js`, Electron `test/printer-resolution-runtime.js`). หน้า Printer เมื่อมีตัวเลือกที่เปิดใช้ได้เพียงรายการเดียวต้องดับเบิลคลิกแล้วไป Stock Selection; คลิกครั้งเดียวไม่ข้าม และถ้ามีหลายตัวเลือกดับเบิลคลิกไม่ข้าม (`test/printer-resolution.test.js`, Electron `test/wizard-preview-runtime.js`). Stock Selection ต้องมีรายชื่อ manufacturer/stock จาก catalog, เติมค่าขนาดและ layout ถูกต้อง และส่งค่าไป template โดยไม่ปัดความละเอียด (`test/stock-catalog.test.js`, `test/printer-resolution.test.js`); wizard ไม่มีตัวเลือกม้วน/แผ่นทั้งโหมด custom และ predefined และหน้า Stock Selection แสดงคำอธิบาย, radio สองตัว, Category, stock name list, preview และ Template size label (`test/printer-resolution.test.js`, Electron `test/printer-resolution-runtime.js`). ภาพ BarTender เป็น reference; REA ยังระบุ implementation/runtime ของ native stock wizard ไม่ได้ จึงไม่ถือเป็น pixel-perfect parity.


เพิ่มเติมแถว 13 (งานตาม spec Object Data Sources): ต้องตรวจ migration/ref identity หลายหน้าและหลายด้าน, shared source cancel, late async response, typed transforms ก่อน concatenation, Unicode/bytes และ preview/print equality ตาม tests `source-*` และ `object-data-sources-ui.test.js` ด้านบน การมี tests เหล่านี้ยังไม่ใช่หลักฐานเทียบ BarTender ครบทุก control; reference matrix, VBScript, serialization lifecycle, external-file integration และ hardware ยังต้องตรวจต่อก่อนรับรองครบ 100%.

เคสเพิ่มเติมแถว 13 วันที่ 2026-10-17: Duplicate และ Copy/Paste object/หน้า ต้องสร้าง identity ใหม่ก่อน render, clone unnamed dependencies และคง Named Source ที่ใช้ร่วมในเอกสารเดียวกัน; วางข้ามโปรเจกต์ต้องนำ definition ไปด้วยและไม่ทับ ID/ชื่อเดิม (`source-model.test.js`, `template-pages.test.js`). Serialization preview ใช้ค่าเริ่มจากไฟล์จริงโดยไม่จองเลข, ช่อง Start ว่างกลับไปใช้ source data, ตัวเลือก method/interval ใช้งานจริง (`source-serialization.test.js`, `source-counter.test.js`, `object-data-sources-ui.test.js`). Character Filter ลบอักขระที่ไม่อนุญาตเป็นค่าเริ่มต้น; Character Template เปลี่ยน HRI ใน SVG/ZPL/catalog artwork โดยคง encoded bars เดิม (`source-transforms.test.js`, `source-output-parity.test.js`, `source-adapters.test.js`).

เคส adapter/output เพิ่มเติม: VBScript ต้องรายงาน runtime error description และ Unicode จริง, printer-clock fallback ต้องทำตาม Windows/omit/abort ที่เลือกโดยไม่มีการส่งพิมพ์จริง, ข้อมูลที่มี `^`, `~`, backslash และ Unicode ต้องไม่ถูกลบหรือกลายเป็นคำสั่ง ZPL (`source-vbscript.test.js`, `source-resolver.test.js`, `object-data-sources-ui.test.js`, `source-output-parity.test.js`). ยังไม่รับรอง printer clock hardware, printer glyph coverage, VBScript object model ทุกส่วน หรือการวางข้ามเอกสารที่มี external library/script dependencies ทุกแบบ.

เพิ่มเติม: cache ของ prepared preview ต้องเปลี่ยนตาม symbology/options/font/GS1 และข้อมูลแถวปัจจุบันโดยไม่ stringify ตารางทั้งชุด (`source-session.test.js`). Suppression ต้องดู source ข้างเคียงจริง, source เดี่ยวไม่ถูก suppress เพราะไม่มีเพื่อนบ้าน, ไม่เหลือ prefix/suffix/HRI และ condition ใช้ Named Source ที่เลือก (`source-resolver.test.js`, `source-transforms.test.js`). Binary truncation/concatenation ต้องรักษา byte และ catalog encoder ต้องได้ byte เดิมโดยไม่ผ่าน UTF-8 (`source-resolver.test.js`, `source-adapters.test.js`); native QR/Data Matrix binary preview/print ยังต้องตรวจแยก.

Native binary matrix checkpoint: fixture `00 FF 1D` ต้องสร้าง QR/Data Matrix จาก byte เดิม, SVG ใช้ matrix ที่เตรียมแล้ว และทุกพิกเซลของ canvas เท่ากับ graphic ใน ZPL (`source-matrix.test.js`, `source-output-parity.test.js`); prepared preview ต้องร้องขอ matrix แม้ source เป็น embedded (`source-session.test.js`). ยังไม่ใช่ physical print หรือ independent barcode-decoder/BarTender comparison.

External File ตามคู่มือ: literal/database-field/named-source filename, Default Path สำหรับชื่อไฟล์ไม่มี directory, error เมื่อ field ไม่มี, เลือก directory/ยกเลิกผ่าน IPC และ UI แสดงเฉพาะ control ของ mode ที่เลือก; record detector ต้องตาม file/database binding (`source-adapters.test.js`, `object-data-sources-ui.test.js`). File snapshot ยังคงอ่านใหม่ตอนเตรียมพิมพ์; ไม่แสดง checkbox reread ที่ไม่มีพฤติกรรม.

Async source controls: ผล file/folder/library picker ที่มาช้าหลังเลือก source อื่นหรือ revision เปลี่ยนต้องไม่แก้ source ใหม่; session async evaluator ต้องใช้ prepared snapshot และคง input fields เดิม (`object-data-sources-ui.test.js`, `source-session.test.js`).

Offset/Range: ขอบเขตวันที่ผิดหรือ minimum > maximum ต้องแจ้ง error; Offset เลือก constant/database/named/PCT ได้, เตรียม named external dependency ก่อนคำนวณ, record detector ตาม database offset และ UI ไม่แสดง units ของวันที่ให้ numeric data (`source-transforms.test.js`, `source-resolver.test.js`, `source-adapters.test.js`, `object-data-sources-ui.test.js`). เดือน/ปีและ DST edge cases, offset หลัง data entry และ range sources/คำเตือนครบแบบ native ยังต้องตรวจต่อ.

Fraction precision: `quarters` ปัดใกล้สุดที่ 1/4 และ `up-to-3` ปัดใกล้สุดที่ 1/999 ตาม HIDD_DATASOURCEPAGE.htm; คง custom denominator ของข้อมูลเดิม, reject denominator 0, UI เปลี่ยนผลประเมินจริง (`source-types.test.js`, `object-data-sources-ui.test.js`). แก้ข้อสมมติเดิมที่จำกัด Text เหลือ 7 types: dropdown ของ BarTender 12.1.0 ที่สำรวจในเอกสารทดสอบแยกแสดง 9 รายการ รวม Binary/Picture จึงทดสอบรายการทั้ง 9 แบบตรงชื่อ; การยืนยันพฤติกรรมตอนเลือกแต่ละชนิดใน native ยังต้องทำต่อ.

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
| Fit barcode width | `electron test/fit-barcode-width-runtime.js` ใช้ appData แยก กด Fit barcode width สำหรับ linear barcode และ catalog barcode, ตรวจขนาดไม่เกิน Maximum width, preview SVG, ความกว้าง catalog และสัดส่วนภาพ; ไม่มีการส่งพิมพ์จริง |
| Printer selection / New Label stock default | `node --test test/printer-resolution.test.js test/page-setup.test.js` ตรวจรายการเครื่องพิมพ์, driver DPI, stock custom/no-selection default, Finish ไม่สร้าง stock.name, รายการ stock ไม่ auto-select แถวแรก และการเลือก predefined แบบชัดเจน; Electron `test/printer-resolution-runtime.js` ตรวจ stock list ว่างและ disabled ใน custom mode ก่อนเลือก stock เองใน predefined mode โดยไม่สั่งพิมพ์; existing checks cover single-choice double-click advance กับ Back |
| Connect label data navigation SVG | `electron test/database-navigation-runtime.js` ตรวจ Next ลูกศรสีขาว 16px บนปุ่มเขียว, Back ลูกศรซ้าย และการเปลี่ยนขั้นตอน Next → Back ด้วย temporary profile |
| Startup bitmap / recovery button | `electron test/startup-bitmap-runtime.js` ใช้ temporary profile พร้อม saved image ที่ไม่มี bitmap และ Print History ของภาพนั้น ตรวจว่า full init สำเร็จ, editor/history แสดง placeholder, artwork อื่นยังอยู่, ไม่แก้ข้อมูลเดิม และ SVG reload สีขาวมองเห็นบนปุ่มเขียว |
| กระดาษ rounded / ellipse และ grid | `electron test/design-grid-rounded-runtime.js` ตรวจ pixel ด้วย Chromium ว่าจุดมุมนอก paper ถูก clip และจุดภายในยังเห็น |
| Fit page centring | `electron test/fit-page-centered-runtime.js` (isolated appData; after Fit page the paper centre matches the preview frame centre within 2 px) |
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
| Page Setup tabs/capabilities | `electron test/page-setup-runtime.js` (isolated appData; primary/sub-tab order, disabled encoder/tray/Wizard reasons, fail-closed media mode state and explicit profile enablement, native Chromium validation accepts four-decimal inch width/height, blank artwork-free Page Setup tabs, editor preview artwork retained, hidden scroll gutter with vertical overflow retained, two-column preview recovers from unusable saved gap, persistent horizontal gap arrow spans actual cell edges, OK commits selected columns with the last usable gap, shape preview model update, significant-size Yes/No and Scale Templates modal flows, proportional/free text metrics, mixed object and table axes scaling on every side/saved page, modal cancel/escape rollback, Cancel restores the opening snapshot) |
| Printer DPI / Stock Selection / Items Per Page / wizard sequence | `electron --disable-gpu test/printer-resolution-runtime.js` (temporary appData; queries installed printer names through renderer IPC and prioritizes a named Zebra printer with DPI to avoid blocking virtual queues; confirms a selected local driver reports valid DPI; verifies Printer Selection controls, Starting Point blank default, and no Label Layout page; verifies roll/sheet controls and labels are absent in every mode, no Resolution or Printer language choice appears, and custom mode starts with visible disabled Category/Stock controls; opens Stock Selection and verifies an 8-row stock list, selects ADES AG/49908 and confirms dimensions; verifies Items Per Page defaults to Single with counts disabled and preview retained; sequence skips Layout and reaches Dimensions, Side Edges, Printed Item Shape, Summary with Back/Next/Cancel/Finish footer order; simulates missing main handler and verifies only an explicitly named nominal DPI is used; does not print) |
| New Label wizard preview and footer visuals | `electron test/wizard-preview-runtime.js` (isolated appData/offscreen; Starting Point precedes Printer Selection, blank template is default, library choice is enabled with Select disabled until library mode, preview is hidden, Next/Back navigation works; Next text precedes arrow on wizard steps; one available printer double-click advances and Back returns; Stock Selection hides preview in custom mode and restores visible selected-stock preview in predefined mode; Items Per Page preserves label counts and circle preview; the eight-page flow skips Label Layout; Printed Item Shape follows Side Edges and fits without body scrolling; Back/Next/Cancel/Finish SVGs render at 14px and buttons measure 86×30px consistently; compact viewport retains Items Per Page preview); `electron test/wizard-label-layout-runtime.js` confirms Next reaches Dimensions with no Layout/Orientation controls and Back returns to Items Per Page; `electron test/wizard-side-edges-runtime.js` separately verifies Side Edges heading, yes state, 0.05 in left/right widths, 198px preview pane, 14–22px right gutter and aligned one-line Template Size, then saves `test-results/new-label-side-edges-preview.png`; `electron test/wizard-printed-item-shape-runtime.js` checks shape-option order, selected Rounded rectangle, 198×270px pane, aligned Template Size underneath, no Stock annotations, rounded radius <=16 SVG px at 4×4 in, and saves `test-results/new-label-printed-item-shape-preview.png` |
| Snap to grid hover border | `electron test/snap-grid-border-runtime.js` (isolated appData; active/focused has no border or outline, forced hover displays the green border) |
| Project Home / New Label CTA / project printer persistence | `electron test/runtime-ui.js` (isolated appData; verifies the multi-page card changes from first to second preview after 3 seconds, and checks wizard footer icon/label bounds at 440px); `electron test/new-project-runtime.js` creates two projects with fixture printers, checks active printer changes persist per file and reopening restores each choice; fake-clock DOM unit covers footer wrapping, icon/label constraints, single-page behavior, card opening and timer cleanup |
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

Data Sources: New Data Source wizard เลือกชนิด 12 แบบ ตั้งค่าก่อน Finish; Cancel ต้องไม่แก้ draft, Finish เพิ่มครั้งเดียว และชื่อซ้ำต้องคง dialog พร้อม error โดยไม่แก้รายการ (`test/object-data-sources-ui.test.js`).

Prepared preview cache: เปลี่ยน PCT fields, locale, timezone, printer, explicit clock หรือ job ID ต้องเตรียม snapshot ใหม่; redraw ที่ context เท่าเดิมไม่อ่านไฟล์ซ้ำ (`test/source-session.test.js`).

Source hosts: server/watch/CLI schema1 ใช้ shared async preparation, GUI server ส่ง settings/serial store เดียวกัน; CLI dry-run ไม่ส่ง transport หรือ reserve เลข; invalid connection และ pre-send disk error ต้องไม่กินเลข ขณะที่ transport error ต้องไม่ใช้เลขซ้ำ (`test/source-hosts.test.js`).

New Source wizard: Named Source ต้องเลือกลิงก์ definition ที่กำลังเลือกอยู่ได้และ Finish ใช้ค่า default ที่แสดงจริง; ปิด Properties/editor ต้องเอา wizard ที่ยังไม่ Finish ออก โดยไม่แก้ draft (`test/object-data-sources-ui.test.js`).

Desktop serialized print: connection ว่าง/ผิดต้อง fail ก่อนจองเลข ไม่ส่ง transport และไม่รายงาน unknown outcome; งานปกติยังเพิ่มเลข และ transport error ยังคง unknown (`test/source-serialization.test.js`).

Nested source dialogs: Cancel GS1 ระหว่างรอ async result ต้องไม่เปลี่ยน source; result จาก revision เก่าต้องไม่ทับข้อมูลใหม่; dispose ต้องปิด GS1/Named Paste/New Source และป้องกัน stale handlers (`test/source-wizard.test.js`).

GS1 preparation: ระหว่างรอ async compile ให้ล็อก AI/value/symbology/add/remove/Finish และให้ Cancel ใช้ได้ เพื่อไม่ให้ผลเก่าไม่ตรงกับค่าที่ผู้ใช้แก้ระหว่างรอ (`test/source-wizard.test.js`).

Library Phrase JSON file: ชื่อ phrase/language ที่ไม่มีจริงห้ามได้ค่าจาก prototype; key ที่เป็น own property เช่น __proto__ ต้องอ่านได้; ไฟล์เกิน16MB ต้องแจ้งข้อผิดพลาดก่อน parse (`test/source-adapters.test.js`).

Runtime Data Sources: `npx electron test/object-data-sources-runtime.js` ใช้สอง object, ลิงก์ Named Source ร่วม, source reorder, Properties หนึ่ง undo entry, Undo/Redo, manual Save/Reopen ใน appData แยก, คง IDs/ค่า/refs, Cancel shared edit และ preview/print equality; ไม่ส่งพิมพ์จริง.

Search/Replace: wildcard ตามตัวอย่าง SearchReplace.htm ทั้ง5แบบ, ?/* ไม่ข้าม CR/LF, ^/$/escape/hex/adjacent stars, invalid trailing *, ไม่จับกลาง CRLF, delete กิน line ending แต่ replace/insert คงไว้; UI Syntax/Action/All Occurrences ตรงกับ evaluator และอ่าน legacy regex boolean ได้ (`test/source-transforms.test.js`, `test/source-wizard.test.js`).

Named Source link: New wizard ใช้ definition ID ต้นฉบับ ไม่สร้าง wrapper; แสดง editor/type เดิมและแก้ผ่าน reference ใดก็อัปเดตทุกตัว; ไม่มี Name/Description ใหม่ขณะลิงก์, option Link มีเมื่อมี named definition, target ที่เลิกเป็น named ต้อง reject โดยไม่แก้ draft (`test/source-wizard.test.js`, `test/object-data-sources-ui.test.js`). Runtime แก้ shared value จาก object ที่ลิงก์แล้ว Undo/Redo ต้องคืนทั้งสอง object.

Serialization initial discovery ต้องใช้ context เดียวกับ compile: PCT runtime value0099 ให้0099/0100 และ job copies3 ให้3/4/5 โดย preview ไม่สร้าง ledger (`test/source-serialization.test.js`).

HTTP source integration ใช้ loopback HTTP จริงและ mock print transport: global settings ต้องถึง evaluator, database-derived file names และ copies ให้countถูก, jobใหม่อ่านไฟล์ใหม่ และ recordที่ผิดในชุดต้องทำให้ไม่มีส่วนใดถูกส่ง (`test/source-hosts.test.js`).

Serialization rollback: source ID ที่เป็น own key พิเศษ เช่น __proto__ ต้องคืนค่าล่าสุดที่ยังไม่ส่ง โดยไม่ย้อนข้ามเลขที่ accepted ไปแล้ว (`test/source-ledger.test.js`). แยก2 pure ledger cases จาก source-serialization.test.js มาไฟล์นี้โดยคง assertion ทั้งหมด.

Special characters: picker แทรก control bytes จริง (GS/NUL/CR/LF) แทน selection, Unicode scalar รวม emoji, reject surrogate/ค่าผิด, คง CRLF เมื่อแก้ข้อความต่อ, Cancel/stale revision/dispose ไม่เขียนข้อมูล และ New Source ยัง staged จน Finish (`test/source-wizard.test.js`). Electron `test/object-data-sources-runtime.js` เปิด picker จาก Properties จริง แทรก GS และ parent Cancel คืนเอกสารเดิม; ไม่ส่งพิมพ์จริง. ยังไม่ครอบคลุม native font/subset/recent-character UI และ private-use NUL compatibility.
Character picker mode: สลับ Symbols กลับ Control Characters โดยไม่เปลี่ยนค่า GS เดิมต้องแทรก GS แทน Unicode ล่าสุด (`test/source-wizard.test.js`).

Change Data Source Type: wizard เลือกชนิด/ตั้งค่าบน staged replacement จน Finish; Cancel ไม่แก้ source เดิม, Finish คง shared definition identity แต่ล้าง Data Type/Transforms เดิมตาม Data_Source_proc_changeType.htm, stale revision และ dispose ไม่เขียนข้อมูลเก่า. Dropdown ทางลัดใช้กฎ reset เดียวกัน (`test/source-wizard.test.js`). Electron fixture ตรวจเปิด/Cancel wizard จาก Properties จริง.

Change Data Source Name: staged assign/rename/remove name จน Finish, Cancel และ duplicate-name error ไม่แก้ draft, shared refs/ค่าคงเดิม, stale revision และ dispose ป้องกัน late write (`test/source-wizard.test.js`). Electron ตรวจเปิดและ Cancel จาก Properties จริง. การ rewrite script/filename/transform ที่อ้างชื่อเป็นข้อความยังเป็น coverage gap.

Named dependency rename: model และทั้ง wizard/inline Name เปลี่ยน named file pathSource, named offset และ suppression.source ตามชื่อใหม่แบบ atomic; ไม่แก้ database field ที่บังเอิญชื่อเดียวกัน, ID/ค่าที่คำนวณคงเดิม และห้ามลบชื่อที่ยังถูก dependencies เหล่านี้ใช้อยู่ (`test/source-model.test.js`, `test/source-wizard.test.js`). Script และ token-expression dependencies ยังไม่ครอบคลุม.

Fraction native DLL evidence: explicit up-to-digit precision ค้นหาตัวส่วน, fixed quarter/eighth ไม่ลดเศษส่วน, reduced modes ลดตามตัวส่วนที่เลือก; รักษา custom denominator เดิม, mixed/improper และ negative/near-integer ตามผล formatter ที่วัดจริง (`test/source-types.test.js`, `test/source-wizard.test.js`). อ้างอิง Seagull.Data.Formatting.dll SHA256 AF5E887ACE65E07537B95E75A10740A5481F85BAA667DF5C6980F8BD4234737D; ไม่ถือเป็นการเทียบทุก locale/decimal edge หรือ final print.

Rename static script dependencies: rewrite literal NamedSubString/NamedSubStrings/GetNamedSubStringValue/SetNamedSubStringValue calls โดยไม่แก้ comment/ข้อความธรรมดา และเปลี่ยน file {{name}} tokens; reject remove-name ที่ยังถูกใช้ (`test/source-model.test.js`). Windows Script Host จริงต้องรัน script หลัง rename ได้ค่าเดิม (`test/source-vbscript.test.js`). Dynamic/computed names และ cross-document rewriting ยังไม่ครบ.
Script preparation ใช้ตัวอ่าน named references เดียวกับ rename: ไม่ preload ชื่อที่อยู่ใน apostrophe/Rem comment หรือ quoted text และยัง execute ผลจริงได้ (`test/source-adapters.test.js`).

Prepared source snapshots: source ID __proto__ ต้องเป็น own JSON property ทั้ง runtime value และ error diagnostic, ไม่หายระหว่างส่ง IPC/JSON และยัง resolve ค่า007ได้ (`test/source-adapters.test.js`). Snapshot dictionaries และ per-source transform maps ต้องรับ valid reserved keys ได้.

Data Builder Plain XML: อ่าน fixture ที่สร้างจาก BtDataSet/BtDataSetAdapter ของ DLL จริง, เลือก text library และ phrase/language ได้, คง whitespace/เลข0นำหน้า/entities/Unicode; reject XMLผิด, DTD/entity declarations, duplicate IDs และ libraryที่ไม่ใช่ข้อความ (`test/source-library.test.js`, `test/source-adapters.test.js`). SQL-backed/encrypted/legacy formats, library version identity และ native authoring ยังไม่รองรับ.

Library picker: inspect IPC อ่าน metadata จากไฟล์จริงและรายงาน missing file, modal เลือก library/phrase/language พร้อม preview ที่เปลี่ยนทันที, Cancel ไม่แก้ draft และ Use Phrase resolve ค่าจริงจาก native fixtureได้; late inspection หลัง dispose ไม่เปิด modal, พิมพ์ filename เปิดปุ่ม Browse โดยไม่สร้าง input ใหม่ (`test/source-library.test.js`, `test/source-ipc.test.js`, `test/source-wizard.test.js`). Electron source runtime ตรวจเส้นทาง Properties → preload → inspect IPC → native library picker → Thai preview → parent Cancel.

Properties navigation: source editor พร้อมใช้งานต้องไม่มี Data Type/Transforms ซ้ำใน sidebar; สามแท็บใน Data Sources ยังแก้ค่า preview และ Apply/Cancel ได้จริง (test/object-data-sources-ui.test.js). ชื่อแหล่งข้อมูลใต้ทุกวัตถุในต้นไม้ต้องมีไอคอนเอกสารและข้อความ ไม่แสดงเป็นเครื่องหมายบวก (`test/object-properties-pages.test.js`).

| `test/source-properties-navigation.test.js` | Properties sidebar ซ่อน Data Type/Transforms ซ้ำเมื่อมี editor ใหม่, fallback เดิมและค่าจากไฟล์เก่าคงอยู่; layout ไม่มี footer และกันส่วนเนื้อหาไว้ในพื้นที่ scroll / DOM unit |

Version1.005: Data Sources integration checkpoint; mandatory full suite and isolated source runtime rerun after version update. Native/reference/hardware gaps remain documented; no claim of 100% equivalence.

Native basic Character Filter: test/source-transforms.test.js เทียบ931กรณีกับ DLL DataEntryTextBox จริง7โหมด, คง Unicode modes เดิม, defaultAll และ UI evaluator ตรวจใน test/source-wizard.test.js; Electron test/source-character-filter-runtime.js ใช้โปรไฟล์แยก ตรวจ Currency preview/commit/prepare-print ได้ค่าเดียวกัน ไม่ส่งพิมพ์. Input Mask/regex/native print warnings/order ยังเป็นช่องว่าง.

Extended date patterns: test/source-types.test.js compares280 actual DLL formatter cases and timezone civil-date rollover; test/source-wizard.test.js checks Date pattern editing without changing input. Electron test/source-date-pattern-runtime.js checks Properties preview and prepared print equality using isolated appData, without printing. Fixture provenance test/fixtures/native-date-patterns.md. Input parsing/@patterns/full calendars remain gaps.

Serial preview quantity: test/source-serialization.test.js ตรวจ10 serial ×2 copies, ค่าและ ZPL/preview ตรงกัน, Preview ไม่สร้าง ledger และ reserve จริงเพิ่ม10ครั้ง; test/print-regressions.test.js ตรวจช่อง serial ใช้งานได้โดยไม่มี legacy field และ Next/Last/First เปลี่ยนค่าจริง; Electron test/source-serial-preview-runtime.js ใช้ appData แยกตรวจภาพ barcode เปลี่ยนตามหน้าโดยไม่พิมพ์จริง.
| `test/source-serial-print-dialog.test.js` | Print serial quantity จาก object sources, Preview Next/Last/First และไม่ส่ง transport / DOM unit |
Multi-item serial regression: three generated pages must reserve three values and the next job starts0004 (test/source-serialization.test.js).
| `test/source-save-icon.test.js` | Data Source Save primary background, white text/SVG and floppy icon geometry / DOM unit; Electron `test/source-save-icon-runtime.js` verifies real computed colors |

Serial quantity native flow: `test/source-serial-print-dialog.test.js` checks direct Serial numbers / Copies per serial number labels, hidden redundant opt-in, optimization checkbox independence, no RAW query on open, and sidebar Save & bind updates barcode_spec/source graph with stable IDs. `test/source-serialization.test.js` checks legacy sidebar source prefix/digits, identical copies, preview without ledger writes and next0011 after accepted reservation. Electron `test/serial-sidebar-flow-runtime.js` creates a barcode via the insert command then uses the sidebar dialog without presetting serialization; verifies actual rendered pages1/2/10 and reopening preparation unchanged.

Nested legacy source serialization: references such as Wrapped -> Serial1 reserve the underlying counter and the next accepted job starts0011, covered by test/source-serialization.test.js.

| `test/canvas-text-caret.test.js` | เคอร์เซอร์อิงขอบหมึกตัวอักษร ไม่หลุดตาม advance width; ต้น/กลาง/ท้ายข้อความ สเกลแนวนอน และช่องว่าง / unit |
Canvas text caret: Electron `test/canvas-text-caret-runtime.js` ตรวจเส้นเคอร์เซอร์อยู่ในกรอบเขียวขณะพิมพ์ 1 → 12, เลือกข้อความซ่อน caret, collapse แสดงอีกครั้ง, Escape คืนข้อความและล้าง overlay; ทดสอบหมุน0/45/90° และ zoom1/1.5 ใน appData แยก ไม่พิมพ์จริง.

Canvas text selection dismissal: `test/canvas-text-selection-dismiss.test.js` ตรวจ Escape และคลิกนอก object ยกเลิก inline text edit, blur คืนข้อความเดิมและซ่อน caret; คลิก handle resize ยังคงไม่ cancel และมี route แยกสำหรับคืน caret. Unit harness ไม่ยืนยัน native Electron focus/pointer ordering; runtime UI coverage ยังอ้างอิง `test/canvas-text-caret-runtime.js`.

| `test/windows-database.test.js` | Windows ODBC provider discovery และอ่าน File DSN CSV จริงเพื่อคง leading zeros / Windows integration; skip บน platform อื่น |
| `test/database-native-flow.test.js` | File DSN ต้อง Browse ก่อนผ่าน validation, ไม่เผย credential และ OLE DB ต้องมี provider/data source; integrated security ปิดช่อง credential / DOM unit |

Properties layout v1.049: `test/source-properties-navigation.test.js` ตรวจ root flex column, body min-height0 และ scroll boundary, header ไม่ยุบและไม่มี footer; Electron `test/properties-layout-runtime.js` เปิด Data Sources → Transforms ใน viewport900×650 ตรวจ main/Preview ไม่ล้น dialog, header ไม่เลื่อนตาม body และแถบล่างไม่มีใน normal/resized/maximized/restored. `test/modal-free-resize-runtime.js` ตรวจ resize จริงและความพร้อมใช้งานของ navigation, source field และ header close โดยไม่มี footer.

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

| `test/modal-free-resize-runtime.js` | Electron actual mouse drag: width and height independently, Properties700x560minimum, no bottom bar, navigation/source field/header close usable; isolated appData |
Free modal resizing replaces the earlier aspect-ratio requirement at user request: test/modal-windows.test.js checks all8edges/viewport bounds, content minima, document-level drag/up when capture leaves panel and stable small-dialog minimum after expansion. Properties locks700x560px (bounded by available viewport); other tool minima follow their content. Electron test/properties-layout-runtime.js checks header/body containment and verifies there is no footer through resize/maximize/restore.

| `test/focus-appearance.test.js` | Active/focus radio,checkbox,text,select,textarea,button: no extra outline/shadow, checked states and programmatic/keyboard focus retained / DOM unit |
Focus appearance: user requests no active frames globally. Removed shared focus border-color override and added shared focus/active outline+shadow suppression. Electron test/source-text-transform-menu-runtime.js verifies actual computed zero outline/no shadow on focused source field and Name radio, unchanged normal field border and checked radio. This replaces prior focus-ring styling requirements; selected/checked behavior still works.


| `test/source-empty-sidebar.test.js` | ไม่มีปุ่ม New field แยกใน insert sidebar; หมวด sidebar ว่างยุบอัตโนมัติ ไม่มีแถว `<None>` คงปุ่มเพิ่มในกลุ่ม แสดงรายการค่า 0 และคงสถานะเปิดเมื่อมีข้อมูล / DOM unit; Electron runtime `test/source-empty-sidebar-runtime.js` |

- v1.025: `test/source-empty-sidebar.test.js` และ `test/source-empty-sidebar-runtime.js` ตรวจลูกศรซ่อนเมื่อไม่มีรายการและแสดงกลับเมื่อมีข้อมูล รวมถึงค่า 0; คงไอคอนหมวดและปุ่มเพิ่ม

| `test/page-add-hover.test.js` | เลื่อนเมาส์จาก caret มาปุ่ม + ปิดเมนูและ aria-expanded ทันที ไม่เพิ่มหน้าเอง คงคำสั่งคลิก / DOM unit; Electron `test/page-add-hover-runtime.js` |

- v1.027: `test/source-editor-theme.test.js` ตรวจ SVG toolbar ทั้ง 8 ปุ่มใช้ปลายเส้น/มุมมน, GS1 เป็น barcode และ Cut มีด้ามกรรไกรคู่; คงลำดับและคำสั่งเดิม

- v1.028: `test/source-wizard.test.js` ตรวจ Name/Description/Type disabled ไม่รับ focus ไม่เปิด dropdown ตรงช่อง แต่เปิด wizard ผ่านปุ่มข้างได้; Embedded Data ยังแก้ได้; keyboard Type picker ทดสอบใน wizard แบบ staged. `test/source-editor-theme.test.js` ตรวจเส้นเชื่อมลำดับย่อย. Electron `test/source-text-transform-menu-runtime.js` ตรวจ side Type wizard

| `test/object-properties-document.test.js` | document draft หลายวัตถุ, stable IDs/shared sources, snapshot clone, layer order, Apply/Cancel และ unknown fields / unit |
| `test/object-properties-pages.test.js` | ต้นไม้หลายวัตถุ สลับแก้ comments/name, คลิกวัตถุแล้วย้าย selected ทั้งต้นไม้และแคนวาส, ไม่มีแถบปุ่มด้านล่างและปุ่ม X บนหัวหน้าต่างปิดได้พร้อมเก็บค่าล่าสุด, แถบคำสั่ง Data Sources อยู่ขอบล่างไม่ทับวัตถุถัดไป เส้นประของหน้ารายการยังอยู่หลังเปิด Data Sources และชื่อ Data Source ของทุกวัตถุยังแสดงด้วยไอคอนเอกสารไม่ใช่เครื่องหมายบวกเมื่อเลือกหน้าอื่น, Print When OK แสดง SVG สีที่มองเห็นบนปุ่มพื้นขาวพร้อมบันทึกค่าเดิม, Apply ทั้งเอกสาร, Cancel หลัง Apply และปฏิเสธชื่อซ้ำด้วย modern alert / DOM integration; Electron `test/object-properties-tree-runtime.js` ตรวจว่า connector ของ source สุดท้ายไม่ยาวเมื่อมีองค์ประกอบอื่นตามหลัง |

| `test/object-print-conditions.test.js` | Preprinted/Always/Never/named source ต่อ record, ค่า0, missing source/operator error, native ZPL และ prepared preview suppression / unit integration |
Object page v1.030: `test/object-properties-pages.test.js` ตรวจ summary disabled, side dialog OK/Cancel และ Preprinted draft/Apply; Electron `test/object-properties-object-runtime.js` ตรวจ actual SVG/raster/native/prepared print parity โดยไม่ส่ง transport
Print When OK icon v1.063: `test/object-properties-pages.test.js` ตรวจ OK ใช้ submit handler เดิมและ SVG ไม่เป็นสีขาวบนปุ่มพื้นขาว; Electron `test/object-properties-object-runtime.js` ตรวจไอคอนก่อนบันทึกเงื่อนไข
Object Properties footer v1.049: `test/object-properties-pages.test.js` ตรวจว่าไม่มี footer และ header X ปิดพร้อมคงค่าที่แก้; Electron `test/properties-layout-runtime.js` ตรวจการย่อ/ขยาย/maximize/restore, ไม่มีแถบล่าง, content อยู่ในกรอบ และ header X ยังคลิกได้; `test/object-properties-tree-runtime.js` ตรวจ source tree และการปิดจริงบน isolated appData. ไม่มีการส่งพิมพ์จริง.
Historical v1.064 (SUPERSEDED by v1.071 typed naming): previously superseded v1.052: `test/object-names.test.js` checks legacy migration, shared global sequence for text/barcode/picture, compact/reuse after delete, duplicate/empty validation and modern alert; `test/object-properties-pages.test.js` checks duplicate Apply is not saved; Electron `test/object-properties-tree-runtime.js` verifies the rendered sequence and that the final Data Source connector stops at its row even when a non-source decoration follows.

Data Source tree connector v1.065: Electron `test/object-properties-tree-runtime.js` reproduces a non-source element after the final source button and asserts the final connector height stays fixed; it also verifies dotted connector styles and stable tree geometry while switching pages.
Naming history: v1.044 global; v1.052 typed; v1.064 global; LATEST v1.071 restores typed names and forbids normalization to object N.

| `test/object-position.test.js` | origin/anchor round trip ที่0/90/37องศา ไม่ย้ายพิกัด authored, signed coordinates และ invalid references/NaN / unit |
Position v1.031: `test/object-properties-pages.test.js` ตรวจ origin dialog OK/Cancel, anchor, Layer และ Lock draft/Apply; Electron `test/object-properties-position-runtime.js` ตรวจหน่วย/ตำแหน่งและ gesture lock/unlock

| `test/object-border.test.js` | margins/ink bounds,5corner effects,Ellipse,Sides,7compound paths,invalid inputs,ค่า defaultจากnativeและlegacy compatibility / unit |
| `test/object-raster.test.js` | shared canvasฝั่งNode สร้าง bitmapจริงและZPLgraphic,ช่องว่างCompound,ไม่เปลี่ยนเอกสารและrejectbitmapใหญ่เกิน / integration |
Border v1.032: `test/object-properties-pages.test.js` ตรวจ disabled groups และ Corner Options OK/Cancel; `test/object-position.test.js` ตรวจ frameoffset/rotationcenterของกรอบasymmetric; Electron `test/object-properties-border-runtime.js` ตรวจเมนูSVG34/7, bounds/พิกัด และ pixel parity Browser/Node (ไม่มี transport). ตัวเลขdash/compoundเทียบnativeครบทุกpresetและpackagedEXEยังไม่ยืนยัน
Picture colors v1.041: `test/picture-color.test.js` ตรวจ PNG สีในเอกสาร, design/background preview และ bitmap ขาวดำใน print/Zebra; `test/recent-thumbnails.test.js` ตรวจภาพสีต้นฉบับต่างกันไม่ถูกรวมใน Recent Pictures เมื่อ bitmap พิมพ์เหมือนกัน. ยังไม่ได้ตรวจเครื่องพิมพ์จริง.

Modal visibility v1.067: `test/modal-windows.test.js` verifies closed pinned-footer dialogs stay hidden before opening and after closing. Electron `test/modal-closed-visibility-runtime.js` checks direct and nested-form dialog fixtures have no rendered box when closed, including after show/close.

| `test/source-tab-icons.test.js` | v1.068: SVG แตกต่างกันสามแท็บ ขนาด16px ชื่อตรงเดิม คลิกเปลี่ยนหน้าจริง / DOM unit |
| `test/ribbon-color-icons.test.js` | v1.238: ribbon colour SVG set uses shared palette, no currentColor/active content, covers every command / unit |
| `test/object-context-color-icons.test.js` | v1.281: object context menu resolves Cut/Copy/Paste/Delete/Properties/Export/Zoom/Remove background to shared ribbon colour SVGs via `iconForLabel` |
| `test/object-context-export.test.js` | v1.285: label actions omit Export Image on empty canvas; export items gated by `selectionSupportsExportImage` / unit |
| `test/stock-predefined-panel.test.js` | v1.327: Stock ทั้ง 3 แท็บเปิดได้ แยก panel ไม่ซ้ำ input; Predefined = Category/list/Save/Delete; RFID/Magnetic ตาม BarTender / unit |
| `test/printer-resolution.test.js` (updated) | v1.238: Template Background ticks no longer open native choosers / unit |
| `test/svg-select.test.js` | v1.238: SVG badge icons are escaped/stable, Unicode block glyph map and fallback / unit |
| `test/export-pdf.test.js` | v1.238: PDF page HTML (PNG copies, SVG pages), size/page-count validation, active-content rejection, Chromium page options / unit |

Properties icons v1.069: `test/object-properties-pages.test.js` checks recognizable border frame, variable-width barcode bars, human-readable digits and distinct Font icon while pages remain usable.

Properties SVG v1.069: `test/source-tab-icons.test.js` verifies source tree icons follow source kind and keep captions; Electron `test/properties-icons-runtime.js` checks seven actual Properties icons at16x16, painted paths inside viewBox, human-readable123 and eight toolbar SVGs with isolated appData.

Modal controls v1.070 supersedes earlier8px gap: `test/modal-windows.test.js` checks4px gap and zero negative right margin; Electron `test/modal-controls-spacing-runtime.js` checks actual inter-button gaps,12px right inset and working maximize/restore.
Modal window controls v1.155: `test/modal-stack.test.js` checks minimizing/restoring only the active nested modal, dock click handling outside the modal stack and closeTop routing. `npx electron test/modal-controls-spacing-runtime.js` verifies maximize/restore, modal minimize leaves the main BrowserWindow unminimized, dock restore reactivates the modal, BrowserWindow X closes only the active modal, and the root window remains alive. This records Electron/Q LABEL behavior; it does not claim BarTender UI parity.


Naming v1.071 SUPERSEDES v1.064: generated names count independently per type (text1, barcode1, picture1, line1, etc.). No global object prefix. `test/object-names.test.js` covers legacy migration, repeated refresh/JSON reopen, six barcode types/catalog image, copy/paste, delete/compact, custom labels and duplicate rejection. Electron `test/object-properties-tree-runtime.js` expects typed names.

Typed naming v1.071 Electron: `test/typed-object-names-runtime.js` checks actual mixed text/barcode migration, duplicate, delete/recount,5data reloads, tree/canvas agreement.

| `test/barcode-live-resize.test.js` | v1.072: live selected-barcode rendering uses updated model, removes stale transform and retains rotation/content / DOM unit |
| `test/barcode-dropdown-resize-guard.test.js` | v1.237: Barcode ribbon button opens dropdown, resize caret state declared, EAN-13 editor raster run lengths, live-resize vector frames / source-guard unit |
| `test/line-color-menus.test.js` | v1.238: dash presets/line-width pt/colour wheel/Text and Picture menu capability tables / unit |
| `test/zpl-dash.test.js` | v1.238: ZPL prints dash patterns as separated ^GB bars for horizontal/vertical lines and all four sides of a box; solid/erase unchanged / unit |
| `test/line-compound.test.js` | v1.238: compound line profiles/stripes, ZPL double lines, concentric box/ellipse output, unchanged single / unit |
Barcode resize v1.072: Electron `test/barcode-live-resize-runtime.js` compares artwork/HRI bounds before pointerup and after release for four linear types plus catalog barcode, at0/31degrees. Isolated appData, no printing.

Caret blink v1.073: Electron `test/caret-blink-runtime.js` and `test/caret-blink-runtime.js --barcode` sample actual animation opacity at0/250/499/500/750/999/1000/1250/1500ms for Text and Barcode; expects fully visible first half, fully hidden second half, range-selection hiding and animation cancellation on close. Existing `test/canvas-text-caret.test.js` covers geometry; runtime is integration, not a mock animation unit test.

REA flow audit2026-10-20 (tooling only, no app behavior change): ./scripts/rea-local.ps1 doctor --provider ghidra --client codex --format json validates actual existing Ghidra/JDK/Codex route; native BtEnu.dll trace confirms supported analysis. These are external-tool integration checks, not unit or native UI parity tests.

Properties tree views v1.074: `test/object-properties-pages.test.js` verifies SVG selected-only/all toggles, active object filtering, edit retention, switching objects and remembering mode across reopen. Electron `test/properties-tree-view-runtime.js` checks mixed text/barcode/picture roots and fixed top/bottom toolbars at normal and small window sizes.

## Database provider sessions — 2026-10-21

| Test | Behavior |
|---|---|
| `test/database-provider-sessions.test.js` | Owner isolation, invalid input, disposal exactly once, destroyed window, late open cleanup, superseded generation and secret-free errors |
| `test/database-file-provider.test.js` | Real file reread, retained cache after failed refresh, generation changes, stable worksheet identity across reorder/removal |
| `test/database-ipc.test.js` | Native selection grant, real file records/refresh, cancellation, unapproved path and foreign owner refusal |

`test/database-manager.test.js` เพิ่ม real-source refresh dispatch, failed refresh cache และ late response after reopen. `test/database-setup.test.js` เพิ่ม native picker consumption/release และ late pick cancellation. Runtime `npx electron test/database-provider-runtime.js` ใช้ isolated appData และไฟล์ CSV จริง ตรวจ preload/IPC → import → document binding → file refresh. ไม่ได้ทดสอบ remote/cloud databases.

Responsive source form: `npx electron test/modal-free-resize-runtime.js` คง sidebar และ input >300px ที่ dialog 700×560; caption ย้ายขึ้นบนเมื่อ main <=460px. `test/modal-controls-spacing-runtime.js` ใช้ขอบขวา6pxตามคำขอให้ปุ่มปิดชิดขวา (แทน20pxเดิม), ช่องว่างระหว่างปุ่ม8pxคงเดิม.

## Inventory reconciliation — 2026-10-21

| Test | Behavior |
|---|---|
| `test/database-catalog.test.js` | Exact active ordering, Google Sheets exclusion, immutable metadata and legacy IDs; integration with importer |
| `test/installer-build.test.js` | Installer build behavior and configuration |
| `test/modal-stack.test.js` | Visible ancestors, focus restoration/containment, one-level Escape, removed parents, custom overlay stacking, minimize/restore dock and close-top routing |
| `test/database-type-icons.test.js` | Existing database icon catalog and assets |
| `test/barcode-corner-radius.test.js` | Existing barcode corner radius behavior |
| `test/editor-barcode-performance.test.js` | Existing editor barcode performance regressions |

## Windows database providers — 2026-10-21

| Test | Behavior |
|---|---|
| `test/windows-database.test.js` | Installed 64-bit ODBC driver/DSN enumeration, real File DSN CSV rows with leading zeros, cancellation/invalid input, installed OLE DB enumeration, generated Access database and UDL connection reads. Windows integration, requires installed Text/ACE drivers; no remote server used. |
| `test/database-native-flow.test.js` | DSN/file mode validation, installed provider selection, UDL path routing, Windows authentication and password exclusion from persisted config. |

`test/database-setup.test.js` adds native ODBC selection/connection, Back preserving inputs, password exclusion and complete document rollback after failed Finish. `test/database-manager.test.js` prevents cached rows being relabelled through Source type. `test/database-windows-runtime.js` exercises actual ODBC File DSN selection, driver reads, model binding and modified-file refresh via Electron/preload/main using isolated appData. OLE DB/ODBC UI geometry has not been proved pixel-identical; password persistence and remote/server/cloud integration are not covered.

## Data Builder and local source replacement — 2026-10-21

| Test | Coverage |
|---|---|
| `test/databuilder-import.test.js` | Native saved .btdb XML fixture, schema-defined empty tables/defaults, encoded names, nil values, metadata exclusion and unsupported-format rejection. |
| `test/database-manager.test.js` | Local Data Builder replacement clears prior source path/provider options; late upload cannot mutate a closed/reopened manager. |

Electron runtime: `npx electron test/database-provider-runtime.js --builder` uses isolated appData and a copy of the native fixture, selects it through the main-process picker, commits rows to the document model and refreshes after a controlled file change. It also explicitly saves the label through the application and reloads it from disk, asserting bound fields and rows survive. A fresh application restart and legacy SQL .btdb remain unverified.

## Excel Online retirement — 2026-10-22

| Test | Coverage |
|---|---|
| `test/database-online-retired.test.js` | Excel Online absent from catalog/icons and preload, no sign-in IPC handler, registry/session/open/refresh rejection for old `online` configurations with a clear message. |
| `test/database-setup.test.js` | Source picker renders 22 choices and never offers the retired Excel Online entry. |
| `test/database-catalog.test.js` | Remaining source catalog preserves its expected order and count after retirement. |

The former OAuth/Graph unit and controlled Electron runtime tests were removed with the unused feature. Existing saved row snapshots remain part of the label document; attempting to reconnect or refresh an old `type: "online"` connection must return `PROVIDER_UNAVAILABLE`. No Microsoft sign-in is run by this retirement check.
## Modal window controls verification — 2026-10-22

- `npm run test:basic`: 1001 passed, 0 failed, 0 skipped; 3/3 legacy checks passed; inventory gap 0. Report: `test/basic-unit-result.json` and `test/basic-unit-output.log`.
- `node --test test/modal-stack.test.js test/modal-windows.test.js`: 17 passed, 0 failed.
- `npx electron test/modal-controls-spacing-runtime.js`: passed maximize/restore, modal-only minimize, dock restore, root-window minimize guard and native title-bar close routing.
## Printer Selection preview — v1.157 (2026-10-22)

`npm run test:basic`: 1002 passed, 0 failed, 0 skipped; all 3 legacy checks passed; no undocumented tests. Report: `test/basic-unit-result.json` and `test/basic-unit-output.log`.

`test/printer-resolution.test.js` asserts Printer Selection hides its preview pane and Items Per Page keeps its live preview. `test/wizard-preview-runtime.js` checks initial Printer Selection hidden state and computed `display:none`, custom Stock Selection hidden state, then switches to predefined stock and verifies the live preview pane, SVG and selected geometry are visible. Existing Items Per Page, seven-step footer and compact viewport checks remain. REA static resource inventory alone cannot establish runtime composition of the wizard; no native parity claim is made.



Project Home startup skeleton v1.201: `test/project-home.test.js` ตรวจ skeleton เมื่อรายการโปรเจกต์เป็น 0 รายการต้องไม่มีการ์ดและแสดง empty state เดียวกับ Home; เมื่อมี 10 รายการต้องแสดง placeholder ครบ 10 ใบ. หน้า Recent projects แสดงรายการทั้งหมดเพื่อให้จำนวนตรงกับ skeleton และโปรเจกต์จริง. ยังไม่มี BarTender native startup skeleton evidence จึงไม่อ้าง parity ด้านนี้.

## Printed Item Shape layout after Side Edges — v1.207 (2026-10-22)

`test/printer-resolution.test.js` ยืนยัน preview รูปทรงไม่มี gap/die-cut annotations ของ Stock. `electron test/wizard-printed-item-shape-runtime.js` เดินจาก Side Edges ไป Printed Item Shape ในโปรไฟล์แยก, ตรวจรายการ icon → radio → ชื่อ, Rounded rectangle เป็นค่าเริ่มต้น, pane ขนาด 198×270px ชิดขวาตาม gutter, Template Size ใต้ภาพ และไม่มีหน้าหรือ annotations ของ Dimensions/Stock; ภาพ: `test-results/new-label-printed-item-shape-preview.png`.

Verification: focused unit test และ Electron runtime ผ่าน; full `npm run test:basic` บน v1.207 ต้องรันหลังการแก้ไขนี้.

## Template Manager + New Document Starting Point v1.206
# Native library conversion tooling — 2026-10-23 (not integrated)

`test/btw-native-object-converter.test.js` checks retained native object ordering,
line endpoints, individual picture requirements, original properties and blocking
diagnostics for unsupported objects and unverified geometry/style semantics.
`test/btw-native-source-converter.test.js` checks original source IDs, ordering,
embedded values and supported transforms, and rejects unresolved references,
unsupported scripts/lifecycle and serialization rather than using sample data.
`test/btw-object-package.test.js` checks native collection counts against explicit
object wrappers, retained source containers, duplicate indices, unsafe XML and
unverified units. `scripts/export-bartender-objects.ps1` is conversion-time native
tooling; controlled runtime export uses copied inputs and a separate COM instance.
These tests do not establish all-template parity. Rich Text bodies, all container
children, exact fonts/metrics and source behavior remain incomplete. Production
library import has not yet switched to these candidate adapters.

`test/btw-native-format-inventory.test.js` checks ordered native Rich Text HTML
fragments, preserved numeric strings and shared names, database/form metadata,
repeated shared-source native indices versus concatenation position, conflicting
identities and native errors. Format values remain evaluated snapshots; this is
not full source/transform or markup rendering parity.


## Native full source definitions and geometry follow-up — 2026-10-23 (not integrated)

`test/btw-native-data-sources.test.js` checks the read-only internal GetDataSources request,
original source IDs/kinds, HTML and encoded scripts, native error rejection, conflicting
identities, and exact source ownership through shared names or controlled native markers.
Cached text equality is never used to assign owners. Source lists that change structure
are rejected, unresolved owners remain diagnostics, and behaviorComplete stays false.
`test/btw-object-package.test.js` additionally checks quoted true/false attributes and
full source definition audit assets with hashes. `test/btw-native-object-converter.test.js`
checks all nine proven unrotated Box/Ellipse/Picture anchors, omitted TopLeft default,
rotation/unknown anchor rejection, quoted boolean retention, and unverified text bounds.
`test/btw-native-source-converter.test.js` adds native numeric filtering, maximum length,
zero padding and ordered repeated transforms while keeping warning lifecycle unsupported.
Controlled native fixture currently resolves all 60 Rich Text source positions in one
Australia nutrition template. This does not establish every template, script event,
font, database, container or rendering behavior. No production import switch yet.

`test/btw-native-data-sources.test.js` also verifies assembly of each object's original
source definitions in native concatenation order, including repeated shared sources.
Missing/duplicate ownership, missing definitions and native index mismatches reject
assembly; cached snapshot values are never substituted. This is conversion tooling,
not evidence that the production library importer has switched.

Native object/source connection follow-up: `test/btw-native-object-converter.test.js`
checks automatic source conversion from each original ordered DataSources container,
shared document source definitions, source refs without sample-text substitution, and
blocking diagnostics for unknown source kinds. This remains candidate conversion;
production import is unchanged and complete rendering parity is not established.

`test/btw-object-package.test.js` verifies corpus records expose connected candidate
elements and original source definitions, preserve leading-zero source values and
per-element references, and retain complete=false while other diagnostics remain.

## Verified native package integration — work in progress 2026-10-24

`test/btw-native-package.test.js` checks exact BTW SHA-256 binding, complete native
verification evidence, native object identities/counts, source registry/reference
integrity, finite geometry and page bounds, independent clones, active page/design
preservation, and rejection of incomplete or flattened candidates. This package
admission test does not establish that any real library template is converted.
`test/native-package-app-runtime.js` exercises production IPC, Finish, edit,
save/reopen using an explicitly injected contract fixture; it is not native
Accessory Box parity evidence. Run via Electron after implementation stabilizes.
Source transformation tests additionally cover native validation reporting and
Unicode source filtering; proof and exact run counts are recorded after completion.

`test/native-text-layout.test.js` checks the explicit native measured font baseline
and line height in SVG/selection, reference anchors, and anchor preservation when
text content changes. Native PNG comparisons use actual Arial metrics and record
remaining1–2pixel horizontal ink differences; these tests do not certify every
font or exact BarTender raster output. The native converter additionally rejects
font/size/identity mismatches in supplied per-object measurement evidence.

## Native data-sourced pictures — 2026-10-26

`test/native-source-picture.test.js` covers original Base64 PNG source decoding,
shared Logo value changes, prepared preview cache invalidation, preserved color/alpha,
monochrome raster generation, invalid data blocking output and stale picture removal.
The original source stays text with its native ID; a rendered picture is prepared
from current source values. Only explicitly supported Base64 PNG is accepted; other
image source formats are not silently treated as complete. Actual Accessory Logo
native ID {A46BF1E5-E0FF-41A6-8E2A-AF500AA76E61} decodes255×255/47742PNGbytes.
`test/btw-native-package-builder.test.js` checks offline assembly calls the real
converter, retains missing mappings as diagnostics/no package, preserves native
count and original object identity, and rejects metadata overrides of completeness.

## Native UPC HRI conversion — 2026-10-26

`test/native-barcode-font.test.js` checks original font bytes/SHA and individual
UPC digit segments, outside digits and rejection of invalid font identity/size.
`test/btw-native-object-converter.test.js` checks the verified font is retained
inside barcode_spec, original inactive HRI source definitions remain in the
registry, and the caption does not become a generic centered text substitute.
Unknown barcode dimensions/options still block package admission; font support
alone does not certify complete UPC/native print equivalence.
`test/native-source-picture.test.js` also covers shared embedded picture replacement
without changing native source IDs/names, atomic errors for non-embedded sources,
unsupported encoding, size limits, and strict rejection of missing source refs.

`test/btw-native-document.test.js` checks explicit native page getter snapshots
against format XML, original dimensions/margins/rows/columns/orientation/effects,
exact font identity inventory and strict rejection of unproven rounded radii.
These checks validate offline conversion and do not certify physical print output.

## Native geometry precision and UPC source profile — 2026-10-26

`test/btw-native-source-converter.test.js` additionally checks native literal
replace/delete profiles, omitted literal syntax, case sensitivity, FirstOnly,
literal dollar/backslash replacements, sequential indexed actions including all
80 lookup entries, malformed/unknown action rejection, left/right minimum
padding, exact spaces/BMP characters, first native UTF-16 padding unit and
rejection of invalid/unimplemented padding profiles. Controlled native evidence
and RED/GREEN run paths are in `docs/native-source-literal-padding-2026-10-26.md`.
These are source conversion tests; full template/form/physical print parity is
not claimed.

`test/native-geometry-precision.test.js` executes actual renderer readElementRow
and unit conversions: unchanged native mm/in fields preserve original precision;
actual user edits still apply and ordinary element conversion remains unchanged.
`test/native-upca.test.js` compares all637 independent native UniGDI target widths,
source length/check-digit behavior and rejection outside the verified profile.
The CSV fixture comes from a separate copied-document native probe; original UPC
10digits are zero-padded for encoding,11digits generate their check digit, valid
12digits are retained and invalid supplied checks/13digits are rejected.
These tests do not certify all barcode families or native HRI pixel geometry.
`test/native-package-app-runtime.js` now tests the real Replace picture file-input
handler, keeps original Logo source identity/name, checks exact changed pixels and
unrounded geometry after save/reopen. It shows an inactive isolated test window
because hidden Chromium Image.decode does not advance consistently; no user
window is closed or reloaded by the test. Still fixtureOnly:true for layout.

## Original native data entry form inventory — 2026-10-26

`test/btw-native-forms.test.js` checks the real Accessory Box PromptValues control
names and values, empty values, original XML retention and strict rejection of
unknown/duplicate/malformed controls. Enabled native forms remain incomplete:
the inventory does not prove control layout, binding, validation or event order.
`test/btw-native-package.test.js` rejects enabled forms even if a candidate sets
verification/behavior flags; `test/btw-native-package-builder.test.js` preserves
explicit disabled native form metadata. The wizard carries that metadata through
Finish. Native controlled SetPrompt probes independently prove Accessory control
1 updates ProductName and control 2 updates UPC; no physical job is sent.

`test/source-adapters.test.js` additionally verifies native UPC prepared artwork
uses the reported full raster dimensions and subtracts the outside-HRI offset
from the original bar anchor without mutating saved native geometry. Source
edits regenerate bars and encoded check digits; invalid supplied checks block
output. This is adapter integration coverage, not a physical printer result.
The same test checks generated ZPL positions for all four cells of a 2x2 paper
layout, ensuring prepared artwork cannot replace each cell's page origin.

`test/native-barcode-font.test.js` also checks the observed native UPC outside
HRI font scale (75% of the selected point size) and five-point guard descent
across independent target widths and 8/12/16pt cases. Native full HRI anchor
and baseline parity still require separate verification; these tests do not
certify a complete native template.

## v1.238 runtime checks (Electron, not part of `npm run test:basic`)

- `electron test/line-menus-runtime.js` — dash menu (35 entries), width menu (18 pt presets), erase/solid, SVG gets stroke-dasharray, compound menu (7 entries) draws a second stroke.
- `electron test/color-picker-runtime.js` — outline/fill popup, None (fill none / outline erase), recent colours, Palettes tab lists CSS named colors and filters by search.
- `electron test/tool-menus-runtime.js` — Text and Picture dropdowns open without inserting, Normal Wrapped inserts a wrapped text object, unsupported entries are disabled.
- Known gaps: ZPL dashes cover horizontal/vertical lines and boxes only (diagonal lines and ellipses print solid); diagonal-line compound printing, PANTONE data, Gradient/Pattern/Texture, Transformed Text, Word Processor, markup text, scanner/external/binary pictures are not implemented.

## Native numeric and HRI source integration — 2026-10-26

`test/source-types.test.js` checks 31 measured native decimal profiles (excluding
nonzero/dynamic offsets), 713 input/output rows and 87 boundary/culture cases.
The native 96-bit decimal parser retains precision, original locale fallback,
currency/sign/whitespace handling, invalid-input blank output and decimal limits.
`test/btw-native-source-converter.test.js` checks locale evidence is mandatory
for original system/custom cultures; unknown offsets and profiles stay blocked.
`test/btw-native-object-converter.test.js` checks explicit effective-locale proof
reaches nested source conversion rather than being discarded.

`test/source-adapters.test.js` checks native UPC selection bounds include the full
prepared raster, matching its SVG position and height with the real catalog
dimension helpers loaded. Source edits and print cell positions remain checked.

`test/btw-native-source-converter.test.js` also checks original HrVisible=false
hides only the corresponding barcode caption part, while encoded data, ordinary
text, shared names and changed quantities remain intact after JSON roundtrip.
Explicit true/invalid visibility flags remain unverified and block conversion.
`test/source-output-parity.test.js` verifies the generated printed bars remain
identical when the caption prefix is hidden and the printed caption excludes it.
Native probes and limitations are recorded in the continuation evidence document;
no complete template library or physical printer parity is claimed.
- `electron test/ribbon-color-icons-runtime.js` — every ribbon command on every tab has a multi-colour SVG (Help icons keep their glyph markup) and keeps data-icon.
- `electron test/wizard-background-pages-runtime.js` — ticking Color, Picture and Design Guide Image adds their pages in order, Back retraces, unsupported controls are disabled, colour popup and guide file/remove work.
- `electron test/svg-select-runtime.js` — the Symbol dialog Unicode-block dropdown shows an SVG before every entry and selecting one re-renders the cards.
- `electron test/pdf-export-runtime.js` — the PDF writer returns a real PDF: page count per copy / per SVG page, MediaBox equals the label size, temporary HTML removed, active content rejected.
- `electron test/pdf-export-dialog-runtime.js` — File > Export PDF… opens the export dialog in PDF mode and passes an exact-size PNG to the main process (save dialog not exercised).
- `electron test/print-pdf-runtime.js` — Print dialog > Save as PDF… with the real print-job preparation (no printer needed, save dialog patched): 3 copies give 3 pages at the label size. Not verified: visual fidelity versus a printed label, fonts missing on other machines, the native Save dialog.
- `electron test/template-page-rename-runtime.js` — renaming a template page with real key events: typing reaches the input, Enter commits, Escape cancels, blur commits, Home moves the caret. It failed before the focus/re-render fix.
- `electron test/file-menu-export-group-runtime.js` — File menu shows one expandable Export entry holding Export template…, Export image… and Export PDF… in a flyout to the right of the menu, not clipped by the scrolling menu; hover, click and arrow keys open and close it; Export PDF… opens the dialog in PDF mode.
- `electron test/page-setup-single-preview-runtime.js` — every Page Setup tab shows exactly one preview on the blue-grey backdrop: BarTender soft slivers for a roll, one sheet (20 labels for 2 x 10) for sheet stock, and a catalog stock replaces rather than joins the preview with Page Size and Template Size captions. Stock-type guides are kept in the DOM but hidden. Pixel parity with BarTender is not verified.
- `electron test/ribbon-hover-menus-runtime.js` — Text, Picture, Barcode and Table dropdowns open in the same tick as the mouse reaches the button, stay open over their menu, survive a click and a brief overshoot, close after 250 ms, swap when the mouse moves to another button, ignore touch; Symbols opens via hover switch from other Insert controls (v1.273); Shapes remain click-driven.

### Stock guides final verification v1.249

Final `npm run test:basic`: 1260/1260 passed across 167 files, 0 failed/0 skipped; all three legacy stages passed; undocumented inventory gap 0. Version 1.249, timestamp 2026-10-27T03:18:34.756Z. Retained report `test-results/stock-guides-basic-result.json`. No physical RFID/magnetic encoding or native pixel comparison claimed.

Final verification: npm run test:basic PASS, 1263/1263 unit tests across 167 files, 0 failed and 0 skipped; all three legacy stages pass; undocumented inventory 0. Timestamp 2026-10-27T03:36:41.862Z, version1.250. Retained report test-results/roll-clearance-basic-result.json; full log test-results/roll-clearance-basic.log. Isolated Electron runtime PASS and both captures visually inspected. Syntax checks and relevant git diff --check pass (line-ending notices only). REA session closed, installed artifacts and user documents preserved.

Final verification: npm run test:basic PASS 1268/1268 unit tests across 167 files, 0 failed, 0 skipped; all three legacy stages pass; undocumented inventory 0. Version1.254 at 2026-10-27T03:50:58.588Z. Retained report test-results/layout-focus-basic-result.json and log test-results/layout-focus-basic.log. Isolated Electron all-eight focus/capture runtime and full Page Setup runtime passed; eight corrected captures visually inspected. Syntax and relevant git diff --check pass (line-ending notices only). No native exact-pixel or physical printing claim.
## QR resize and move v1.261 (2026-10-28)

- `test/qr-preview.test.js`: simulate an east-edge QR resize and subsequent move; assert the square's saved width changes, the artwork and selection share a live transform, and moving retains the width.
- `test/qr-resize-move-runtime.js`: isolated Electron browser fixture with empty QR and catalog QR bitmap objects, three resize handles, selection alignment during/after resize, and retained size after moving; the fixture uses mocked surrounding editor controls. Full application runtime startup timed out. Runtime result recorded in the task evidence; physical printing and native BarTender drag semantics remain unverified.

Full basic v1.261: 1,275/1,275 tests passed across 169 files, 0 failed/0 skipped, all 3 legacy stages passed, inventory gap 0. Report: `test-results/qr-resize-basic-result.json`.


## Picture placeholder stroke v1.263 (2026-10-28)

- `test/bitmap-recovery.test.js`: placeholder frame, circle and mountain each retain non-scaling strokes at multiple sizes.
- `electron test/picture-placeholder-stroke-runtime.js`: isolated Chromium fixture verifies equal computed stroke width and vector effect before, during and after resize; full-app interaction and native pixel parity are unverified.

Picture placeholder stroke: npm run test:basic PASS v1.264, 1286 passed, 0 failed, 0 skipped, 3/3 legacy checks, 0 undocumented; report test-results/picture-placeholder-stroke-basic-result.json.


## Save shortcut and toast v1.268 (2026-10-28)

- `test/save-as-end-to-end.test.js`: Ctrl+S uses physical KeyS for Thai input in editable fields and is not swallowed; status element stays outside hidden editor content. Existing Save As behavior remains covered.
- `electron test/save-shortcut-toast-runtime.js`: isolated Chromium with production CSS, keyboard handlers and toast checks Thai KeyS from a text input and visible success feedback; mocked save, not disk persistence.
- Full basic v1.268: 1296 passed, 0 failed/skipped, 169 files, 3/3 legacy, no undocumented files; report test-results/save-shortcut-basic-result.json. Electron unsaved-document-runtime.js passed actual disk save/reload.

## Connection snapshot import 1.279 (2026-10-28)

- `test/database-setup.test.js`: imported snapshots follow the same field/print pipeline; invalid envelope/version and duplicate columns rejected. Existing test-file inventory unchanged.
- `test/database-provider-runtime.js --import`: PASS isolated Electron picker → field commit → modified JSON refresh → explicit disk save/reopen. Imports table snapshots only; original filters/joins/native connection settings are not restored.
- Snapshot validation also rejects unknown row columns, reserved fields, duplicate table names and native XML explicitly; preserves empty tables with declared columns alongside populated tables.

Final npm run test:basic: PASS, version 1.279, 1342/1342 tests across 172 files, 0 failed, 0 skipped; all legacy stages passed; undocumented files 0. Report test/basic-unit-result.json at 2026-10-28T09:25:20.974Z.

## Multiple database connections v1.280 — 2026-10-28

- `test/database-connections.test.js`: pure legacy migration, stable IDs, add/update/select/delete, cross-owner collision rejection, empty-field unbind, row range/copies, explicit missing-source errors, unused deleted fields, field rename/category detachment, live versioned legacy rows.
- `test/database-manager.test.js`: chooser persists selected ID and deletes only selected source.
- `test/database-setup.test.js`: Add preserves earlier data and object tokens; Cancel leaves document unchanged; replacement rollback retained.
- `test/database-connections-runtime.js`: isolated real CSV production picker/IPC, two connections, range/copies, selected refresh, explicit disk save/reopen, selected delete. Active connection determines record count; other auto-row bindings use matching indexes. Cross-provider joins not implemented.
- `test/source-output-parity.test.js`, `test/data-sources-ui.test.js`: existing source and print cases retained. No real external vendor server or physical printing claim.

## Compact template strip and click ribbon v1.289 (2026-10-29)

- `test/template-pages.test.js`: 80% thumbnail, outer bar and split-button dimensions; width grows with pages and scrolls only on overflow; add, hover-menu and selection interactions retained.
- `test/ribbon-availability.test.js`: Home and Insert ignore pointer entry and activate by click; other tab policy retained.
- `test/ribbon-hover-menus.test.js`: Symbols does not open on hover, closes competing menus on click and its click handler can toggle it. Text/Picture shared hover retained.
- `test/template-navbar-size-runtime.js`: PASS isolated Electron real layout and interactions, measured bar 67.1875 px.
- `test/ribbon-hover-menus-runtime.js`: PASS isolated Electron tab and Symbols click behavior plus retained hover menus.
- Symbols keyboard activation also closes an open competing menu without suppressing the Symbols click.

Final `npm run test:basic` at v1.289: FAIL, 1357/1366 unit tests passed, 9 failed, 0 skipped across 179 files; 0 undocumented; all three legacy stages passed. Report test/basic-unit-result.json, 2026-10-29T01:55:52.054Z. Failures: one existing barcode picker grid assertion, six Page Setup layout/shape cases, and two stale catalog-count assertions after Google Sheets removal. All three task-specific unit test files and both task-specific Electron runtimes passed.

## Barcode bottom corner radius v1.290 (2026-10-29)

- `test/barcode-corner-radius.test.js`: linear and catalog barcode bar-height clipping, HRI preservation, no-text, zero radius and canvas clip geometry.
- `test/barcode-corner-radius-runtime.js`: PASS isolated Electron SVG-to-print-raster pixel check at 600 dpi; both bottom and both top corner pixels change, HRI pixel count is unchanged. No physical printer or scanner verification.
- `test/barcode-inline.test.js`, `test/print-regressions.test.js`: existing HRI and print coverage retained.

Final `npm run test:basic` v1.290: FAIL, 1361/1370 tests, 9 failed, 0 skipped, 179 files, 0 undocumented; legacy stages pass, pass, pass. Report test/basic-unit-result.json, 2026-10-29T02:05:03.409Z.

## PDF empty text placeholder v1.291 (2026-10-29)

- `test/image-export.test.js`: editor PDF includes Text for empty literal and source-backed text, retains actual values and does not mutate the document. Existing file inventory unchanged; physical printing and native BarTender parity not established.

- Verification: `node --test test/image-export.test.js` 24 passed; `npx electron --disable-gpu test/pdf-export-dialog-runtime.js` passed existing dialog fixture (not placeholder pixels). `npm run test:basic` v1.291: 1362/1371 passed, 9 failed, 0 skipped; all three legacy stages passed. Report `test/basic-unit-result.json`. Nine failures were also recorded at v1.290.

## Click-driven ribbon menus v1.292 (2026-10-29)

- `test/ribbon-file-hover.test.js`, `test/ribbon-hover-menus.test.js`, `test/ribbon-availability.test.js`: File and Insert menus ignore pointer entry, click activation and competing menu closure, Home and Insert tabs. Existing inventory unchanged.
- Electron `test/ribbon-hover-menus-runtime.js` and `test/file-menu-export-group-runtime.js`: click/hover behavior and keyboard navigation in isolated windows. Native BarTender event handling remains unknown.

## Barcode hover bounds and SVG button v1.293 (2026-10-29)

- `test/svg-selection-handles.test.js`: unselected linear/catalog barcode uses measured HRI ink bottom; hover fitting does not alter background; transparent-image ink shortcut does not hide HRI.
- `test/ribbon-availability.test.js`: standalone SVG Insert tool absent, Picture and other drawing tools retained.
- `test/barcode-hover-bounds-runtime.js`: PASS isolated Electron: hover and selection rectangles match HRI ink bottom, SVG ribbon button absent and Picture present.
- `test/barcode-corner-radius.test.js`, `test/tool-placement.test.js`, `test/ribbon-color-icons.test.js`: existing corner, tool placement and icon behavior retained.

- Full basic v1.292: 1363/1372 passed, 9 failed, 0 skipped; all three legacy stages passed. Report `test/basic-unit-result.json`. Electron `ribbon-availability-runtime.js` failed at disabled Line style visibility after File checks; no full runtime pass claimed.

## Ribbon dropdown close on other button hover v1.294 (2026-10-29)

- `test/ribbon-hover-menus.test.js`: other ribbon command closes immediately on mouse hover, own trigger and menu remain open, hover never opens another dropdown.
- `test/ribbon-hover-menus-runtime.js`: PASS Electron Text, Picture, Barcode, Table close in the same pointer event over Rectangle; click and Symbols behavior retained.
- `test/ribbon-availability.test.js`, `test/tis-symbols-ribbon-menu.test.js`: click tab and Symbols coverage retained.

## Recent object alignment v1.295 (2026-10-29)

- `test/recent-thumbnails.test.js`: fixed-width left-aligned grid and existing thumbnail behavior; no inventory change. `test/recent-alignment-runtime.js`: isolated Electron measurement for one and multiple items. Native BarTender layout remains unverified.

- Full basic v1.295: 1365/1374 passed, 9 failed, 0 skipped; three legacy stages passed. Report `test/basic-unit-result.json`. Nine failures were previously recorded.

`npm run test:basic` v1.295: FAIL, 1365/1374 tests, 9 failed, 0 skipped, 179 files, 0 undocumented; legacy stages pass, pass, pass. Report test/basic-unit-result.json, 2026-10-29T02:35:55.530Z.

## Click-selected ribbon tabs v1.296 (2026-10-29)

- `test/ribbon-availability.test.js`: all tabs ignore hover and activate on click; selected styling retained without hover highlight. Inventory unchanged. Electron `test/ribbon-hover-menus-runtime.js` exercises Layout click and selected state. Native event handling remains unknown.

## Rounded paper highlight boundary v1.297 (2026-10-29)

- `test/svg-selection-handles.test.js`: rounded overflow mask uses the same circular corner geometry as paper, all four corners.
- `test/rounded-highlight-runtime.js`: PASS isolated Electron rendered pixels, zero uncovered grey pixels between red highlight and white rounded paper.
- `test/page-gap.test.js`, `test/design-grid.test.js`: existing paper gap and grid tests retained.

## Transparent sidebar grip v1.298 (2026-10-29)

- `test/sidebar-glass.test.js` checks transparent resize grip, absent border and keyboard resizing; existing inventory unchanged. Native appearance remains unknown.

Full basic suite run-start v1.297: FAIL, 1368/1377 passed, 9 failed, 0 skipped; full log tmp/highlight-basic.log. Results can be overwritten by concurrent suites; see log for this run.

- Full basic v1.298: 1368/1377 passed, 9 failed, 0 skipped; three legacy stages passed. Report `test/basic-unit-result.json`. Electron visual verification not run.

## Paper gap icon v1.299 (2026-10-29)

- `test/ribbon-color-icons.test.js` checks two vertically stacked labels and a marker in the gap; `test/page-gap.test.js` checks Show/Hide toggle behavior. Existing inventory unchanged. Native icon and physical printing remain unverified.

## Recent projects grid/list v1.300 (2026-10-29)

- `test/project-home.test.js`: grid/list switch, selected accessibility state, view preference, date, refresh and open.
- `test/project-home-preview-chromium-runtime.js`: PASS isolated Electron rendered grid/list geometry and retained preview. Dates use available last-opened timestamps, unknown dates shown as —.

- Full basic run-start v1.299: 1370/1379 passed, 9 failed, 0 skipped; three legacy stages passed; report `test/basic-unit-result.json`. Electron `test/page-gap-runtime.js` failed on Page Setup gap measurement arrow comparison; not counted as passed. Workspace advanced to v1.300 during the run.

Full basic suite run-start v1.300: FAIL, 1370/1379 passed, 9 failed, 0 skipped; log tmp/home-view-basic.log. Concurrent suites may overwrite the shared report.

## Recent projects default list v1.301 (2026-10-29)

- `test/project-home.test.js`: list default without saved preference, explicit grid retained on refresh.
- `test/project-home-preview-chromium-runtime.js`: PASS isolated Electron default list layout and grid switching.

Full basic suite run-start v1.301: FAIL, 1371/1380 passed, 9 failed, 0 skipped; log tmp/home-default-basic.log.

## Inline text commit v1.303 (2026-10-29)

- `test/canvas-text-selection-dismiss.test.js` checks outside-click commit, Escape cancel and text-resize caret behavior; `test/canvas-text-commit-runtime.js` checks Enter, outside pointer, Escape and evaluated source values in isolated Electron app data. Existing unit inventory unchanged. Disk persistence is not covered by this fixture; autosave remains governed by user settings.

## Side Edges preview color v1.308 (2026-10-29)

- `test/wizard-roll-reference.test.js`: equal 1.05-inch sides are symmetric and proportional to 2-inch and 4-inch labels, grey liner and gap, blue preview background. Existing inventory unchanged. `test/wizard-side-edges-runtime.js` covers wizard navigation and layout; native internal rendering remains unknown.

- Full basic v1.308: 1371/1381 passed, 10 failed, 0 skipped; three legacy stages passed. Report `test/basic-unit-result.json`. One more failure than v1.299; identity not retained in summary. Electron Side Edges fixture passed with 2x4, 1.05in per side and grey backing.

## Side Edges template width v1.309 (2026-10-29)

- `test/printer-resolution.test.js`: adjusts width from fixed media width, rejects invalid excessive edges, converts units, toggles Yes/No, persists rounded label and shares adjustment across columns. `test/wizard-side-edges-runtime.js`: 4 x 4 in becomes 2 x 4 with 1.05 in sides, symmetric grey liner and rounded preview in isolated Electron. Existing test inventory unchanged. Native formula and physical printing remain unknown.

- v1.309 verification: 47/47 targeted unit checks passed; isolated Electron Side Edges fixture passed. Full `npm run test:basic`: 1374/1383 passed, 9 failed, 0 skipped; three legacy checks passed. Report `test/basic-unit-result.json` and log `test-results/side-edges-template-basic-final.log`. Nine unrelated failures predate this change; native formula and physical printing unverified.

## Compact Page Setup v1.310 (2026-10-29)

- `test/page-setup.test.js`: verifies compact 600x466 dimensions, side-by-side settings and preview, and retained hidden scroll gutter. `test/page-setup-size-runtime.js`: isolated full Electron app checks actual bounds, all eight tabs, scrolling, footer, preview and maximize/restore. Existing unit inventory unchanged. Native Page Setup dimensions and physical printing remain unverified.

- Full basic v1.310: 1375/1384 passed, 9 failed, 0 skipped; three legacy stages passed; report `test/basic-unit-result.json`, log `test-results/page-setup-compact-basic.log`. Isolated compact-size Electron runtime passed; broader `test/page-setup-runtime.js` failed on existing column layout/gap recovery. Nine failures match v1.309.

## Rounded wizard previews v1.311 (2026-10-29)

- `test/wizard-roll-reference.test.js` verifies blue rounded roll and sheet previews and the rectangular fallback; `test/wizard-roll-reference-runtime.js` checks all six wizard pages in Electron. Preview styling does not change the saved label radius.

## Side Edges validation v1.312 (2026-10-29)

- `test/printer-resolution.test.js`: invalid side-edge input reports immediately, disables Next, blocks submission and permits navigation after correction. `test/wizard-side-edges-runtime.js`: isolated Electron input, message, disabled navigation, hidden invalid preview and correction.

## Wizard preview gaps v1.313 (2026-10-29)

- `test/wizard-roll-reference.test.js`: wizard roll and background previews show grey backing and neighbouring labels, while background colors and clipped images are retained. `test/wizard-roll-reference-runtime.js`: six wizard pages show backing and upper/lower continuation in isolated Electron.

## Wizard finished preview v1.314 (2026-10-29)

- `test/wizard-roll-reference.test.js`: all four shapes use blue wizard backdrops; finished preview excludes liner and continuation. `test/wizard-roll-reference-runtime.js`: checks Finished preview without gap, centered caption, and right gutter, while earlier pages retain backing and gap.

## Page Setup 30% larger v1.315 (2026-10-29)

- `test/page-setup.test.js`: desktop dimensions and preview columns. `test/page-setup-size-runtime.js`: 780 × 606 dialog, eight tabs, scroll, footer, maximize/restore and small viewport in Electron.

## Ellipse default and stock backdrop v1.316 (2026-10-29)

- `test/printer-resolution.test.js`: selecting ellipse from the default custom 4 × 4 in sets 4.1 × 4 in, switching back restores the default, and an independently edited size is preserved. `test/stock-preview.test.js`: stock background gradient is blue. `test/wizard-roll-reference-runtime.js`: isolated Electron checks ellipse dimensions and stock gradient.
