# Template filter modal, green branding, and Starting Point preview

## Scope and process

This continues the user's active UI revision. Applied Superpowers `using-superpowers`, `systematic-debugging`, `brainstorming`, TDD and verification workflow; read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, the REA checkout README and MCP contracts. The supplied BarTender screenshots are the direct layout reference for the three filter categories and the library-selected Starting Point; green Q LABEL branding is the user's product requirement and is not inferred to be BarTender styling.

## REA identity and feature evidence

- REA checkout: `C:/Users/kkriangkai/projects/Bratender/rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; live connected REA MCP 6.7.0.
- Reused the exact feature-matched Template Browser analysis in `docs/rea-template-manager-layout-2026-10-22.md` after confirming the artifact path/hash and evidence scope. That analysis used live MCP `inspect_managed_members` (schema: optional `path`, `detail` `complete|summary`, `type_names`) on `D:/Programs/Seagull.TemplateBrowser.dll`, SHA-256 `7bd51bbd0c668f01c87fc904e2199b12607ad0a13a22f09efa5a697022a21f87`, MVID `150e39b1-102c-43ae-a2b9-627b4da776b7`; evidence `ev_ed5e9b2789e9d24fe4a93b8eae97f95fe8a5979d96d4ea1ab1ae39f03e3f186a`. Matched `TemplateBrowserForm`, `TemplateBrowserManager`, load/message methods and Cloud WebView host strings. `D:/Programs/BarTend.exe` SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; related `D:/Programs/BtEnu.dll` SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- This turn checked the live catalog and selected `inspect_managed_members` schema, then queried the exact fully-qualified matched types (`Seagull.TemplateBrowser.TemplateBrowserForm`, `Seagull.TemplateBrowser.TemplateBrowserManager`) on the same DLL. Current matching Evidence: `ev_c2b6a6d7b2acf4b3b146ebc48ca25fce2e3fb7b609f99a7d2e5d7a3237f0e17f`, complete selected-type coverage with no unmatched names; observed `TemplateBrowserForm_LoadAsync`, `WebView_WebMessageReceived`, `InitializeComponent`, WebView host strings, and `Template Browser` title. Static CIL and literal analysis does not replay the dialog.
- Also reused the same-feature static `search_strings` evidence `ev_4a433ad213447ac6626dc3918309983b71d1f391bf0401b3a118206d812d0ed6` on BtEnu.dll. It provides Starting Point and size-label strings (`Starting Point`, `Select the starting point for the new document.`, `Page Size:`, `Template Size:`); it does not establish the selected-template thumbnail arrangement or runtime behavior. Earlier wizard resource evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a47464f1a4887` is static PE resource inventory only.
- Feature mapping: REA confirms the template manager's hosted Cloud browser and public UI strings. The three-category filter arrangement, icons, and immediate tile semantics follow the user's screenshots and Q LABEL's implementation; native filter click parity and pixel parity remain unverified. The Starting Point page thumbnail/details follow the supplied BarTender image and static labels; native runtime equivalence remains unverified. Green palette and logo colors are Q LABEL custom branding.

## Implementation mapping

- `gui/template-browser.js` and `gui/template-browser.css`: centered Add a filter dialog; Standards and Technology, Industries, Shapes and Orientation tabs; green-selected icon tiles, immediate filters, and removable chips. Filters combine with OR among values within a category and AND across categories.
- `build/icon.svg`, `build/icon.png`, and `build/icon.ico`: regenerated Q LABEL green app icons for project home, window and Windows packaging.
- `gui/new-label-wizard.js`: selected Starting Point library document now shows its image preview and page/template dimensions in the right preview area.
- Tests/checklists: `test/template-browser.test.js`, `test/template-browser-runtime.js`, `test/printer-resolution.test.js`, `test/wizard-preview-runtime.js`, `UNIT_TEST_BASIC.md`.

## Verification

- RED observed on new modal/category and brand tests before implementation; GREEN: `node --test test/template-browser.test.js test/printer-resolution.test.js` — 42 passed at that point; after adding cross-category filtering and icon-payload assertions, `node --test test/template-browser.test.js` — 7 passed.
- `npx electron test/template-browser-runtime.js` — PASS at 1560/1000/600px; dialog renders 560×520 in the 600px viewport, 3 tabs and 19 industry tiles. Capture: `test-results/template-manager-filter-dialog.png`.
- `npx electron test/wizard-preview-runtime.js` — PASS; 9-page wizard runtime and all-step layout capture.
- Whole-system `npm run test:basic` — PASS, 1,045/1,045 unit tests, 0 failed/0 skipped; all three legacy checks passed and no test files were undocumented. Report: `test/basic-unit-result.json`.

## Limits

REA did not observe native filter selection or the Starting Point selected-template preview at runtime. The uploaded screenshots are user-provided product references. This evidence therefore supports the WebView host mapping and known strings only, not an assertion that the new modal's behavior or layout is identical to BarTender. No printer hardware output was part of this UI task.
