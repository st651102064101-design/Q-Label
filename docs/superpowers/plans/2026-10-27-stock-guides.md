# Stock RFID antenna and magnetic stripe guides

User approved the screenshot workflow with “เริ่ม”. Scope: functional stock image controls, persisted document settings, original antenna artwork, repeated per-label preview, anchor/origin/rotation and magnetic display/position. These are stock guides, not encoder data objects. Actual encoding remains unsupported; no hardware commands are inferred from UI screenshots. Work in the current dirty checkout to preserve the user's active integration and existing uncommitted dependencies; no checkout/reset/stash.

REA: installed skills using-superpowers, brainstorming (approved screenshot specification), writing-plans, executing-plans, TDD, verification-before-completion. Read AGENTS, UNIT_TEST_BASIC, REA README, MCP contracts/native reference. Connected REA 6.7.0, checkout 9341b116efddefc2bcdd8208d27d6e4ea78cc507, upstream https://github.com/morluto/rea.git. Ghidra12.1.4. Catalog207; actual schemas checked for open_binary, search_strings, inspect_pe_resources, read_bytes, close_binary.

Artifacts: D:/Programs/BarTend.exe SHA256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3; D:/Programs/BtEnu.dll SHA256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b.

Feature evidence ev_d75770d6157eb157232607c66f4579ece26ad498bac9127f29125ba987f849b9: RFID Antenna0x1033b0f2, Generic Transponder0x1033b56a, Fit to Template0x1033b592, Background Magnetic Stripe0x1032d464, Advanced Position Options0x1036febc, separate encoder warnings. ev_1fee9c01573f71af9f85454c32cee61c2c5cb3471ca0b776e69b0ba44477af5b confirms Front/Back Side. PE resources ev_f9ed9b23f4d554224086ea504d6666da300e7d5c9da3499b907d6b7d3801d9ca identifies EXE RT_RCDATA10 at offset19670336 size3416 (EMF header); source bytes must be hash checked when exported. ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887 inventories English resources. Related installed artwork discovered at C:/ProgramData/Seagull/BarTender/Stocks/RFID/Antennas/*.ss.emf. External Windows GDI decodes original EMF to PNG; retain original SHA, frame sizes, output SHA manifest. This extraction is ordinary filesystem/GDI evidence, not REA decompilation.

Limitations: strings/resources establish names and artwork identity, not complete native event/position algorithm or automatic stripe driver defaults. Screenshot specifies visible controls. Q LABEL stores mm, computes anchors/origins conventionally and labels these as its implementation. Exact native manual-size method list, hardware defaults and native pixel parity remain unverified. No actual encoding implementation is claimed.

1. Export source-bound antenna assets (generic plus11 installed files) and manifest; test source hashes and dimensions.
2. TDD shared stock guide model: defaults, all nine anchors, independent origins, size/rotation, safe image sources and magnetic side/position/context.
3. Replace disabled Stock tabs with accessible panels, image import/delete, advanced dialog and live document updates. Keep existing snapshot Cancel/OK.
4. Render guides per label inside existing shape clip, including Layout/catalog paths, and honor magnetic print-preview flag in the real print preview.
5. Behavior tests and isolated Electron UI/save-reopen checks; update version/changelog/checklist; complete npm run test:basic; fresh review.

## Execution and review

Completed asset extraction and shipped 12 source-bound PNGs with per-file SHA/frame manifests. Implemented gui/stock-guides.js (pure placement/rendering/context model), gui/stock-guides-ui.js (functional nested tabs, validation, file import, original asset selector, Advanced dialog, snapshot lifecycle), gui/modal-preview.js per-cell overlays and gui/print-dialog.js preview-only stripe overlay. Actual ZPL and PDF ink paths do not include stock guides. Main/nested invalid-control activation in page-setup.js keeps bad drafts visible for correction. Async imports are bound to document identity plus dialog session and discarded after cancel/document replacement.

Observed TDD failures before implementation: missing model; missing printPreview method; zero per-cell overlays; validation selected hidden subtab; deferred file import mutated canceled document; RFID controls extended below footer. Red/green fixes and isolated Electron checks passed. The fresh reviewer reproduced the last two correctness defects, then verified their fixes with no remaining important findings.

The existing broad Page Setup runtime had obsolete expectations that scaling closes the parent dialog, conflicting with current source and pre-existing unit tests which retain it. Updated those runtime assertions to retain parent and verify child opens; no scaling product code changed. Also prevented hidden-window throttling/hot reload in the fixture.

Captures initially failed with no display surface and image.decode stalled in a hidden Chromium fixture. Image onload/onerror handles actual import without relying on presentation. Subsequent showInactive captures produced stock-guides-rfid.png and stock-guides-magnetic.png, visually inspected; compact spacing fits all RFID controls above the footer and avoids duplicated unit suffixes. This is Q LABEL screenshot evidence, not a native pixel comparison.

Verification: stock-guides-runtime.js PASS (12 actual decoded assets, four cells, original/custom image import/delete, position, disk create/load, Cancel, Print Preview on/off); page-setup-runtime.js PASS (all eight tabs, stock subpanels, capability/geometry/scaling regressions). Final whole-system basic result will be appended after its run.

Final `npm run test:basic`: 1260/1260 passed across 167 files, 0 failed/0 skipped; all three legacy stages passed; undocumented inventory gap 0. Version 1.249, timestamp 2026-10-27T03:18:34.756Z. Retained report `test-results/stock-guides-basic-result.json`. No physical RFID/magnetic encoding or native pixel comparison claimed.
