# New Document Wizard: remove Label Layout page — 2026-10-22

## Workflow and REA

- Read and applied `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA README/contracts/native artifact references, REA skill v42, and Superpowers `using-superpowers`, `brainstorming`, `systematic-debugging`, and `test-driven-development`.
- REA checkout upstream: `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`. Live REA MCP/server 6.7.0; client 0.163.0-alpha.11; tool catalog SHA-256 `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`. Checked the live input schemas for `open_binary`, `inspect_managed_artifact`, and `search_strings`.
- First tried the installed application `D:/Programs/BarTend.exe`. REA/Ghidra rejected the mixed managed/native PE for binary analysis (`managed_target_unsupported`). Managed metadata inspection succeeded: SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`, evidence `ev_f9c2b5a64d78847e202e1b1bd173593a2d69c94bb0fc723257046570f9fed610` (summary view `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`). This establishes artifact identity and managed classification only.
- The installed localization/resource DLL `D:/Programs/BtEnu.dll` has SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`. REA/Ghidra 12.1.4 `search_strings` returned no exact entries for `Select the Label Layout` (`ev_3b29ec4afa6396784889d6a109e2437c23bb2b542df5b971874c2a516eb4acbe`), `Screen Layout` (`ev_2bb648ba224c6094324b4a9ad0d429d80033beaab42adb7171f73e1bbe065432`), `Printer Layout` (`ev_47e1112362147ff890024f6c798892b704c1267d8a808bd8c7bbdf0d2387577e`), or `Rotated (180°)` (`ev_0a53b299d74799f3758609809a28f2c9cb89110eafa6df0ec051deb7b67d9621`). `Orientation` returned three unrelated/unscoped string occurrences (`ev_3d0ac4fff976f2e816e86b4b2db2278392a67ab4afcce56e3c861394a5f35fa6`) and is not treated as evidence for this page.
- REA did not provide evidence of the native page's runtime transition, defaults, or effect on saved templates. The user requested removing the existing Q LABEL page; this change removes that local UI and does not reconstruct or claim native BarTender behavior.

## Change mapping

- Removed `nwLabelLayout`, its Orientation/Rotated/Screen Layout/Printer Layout controls, their styles and event handlers.
- Reindexed the existing wizard flow so Dimensions follows Items Per Page, then Side Edges, Printed Item Shape, and Summary. Updated Next/Back/Finish states, preview selection and Summary generation. Newly created documents use normal print orientation because the removed page no longer offers the rotation control.
- Updated unit and Electron runtime coverage. `printer-resolution-runtime.js` now queries a DPI-named Zebra queue before virtual queues, which avoids a hanging AnyDesk virtual printer query in this environment; its stock assertion explicitly selects ADES AG/49908.

## Verification

- Test-first regression: the updated unit test failed before implementation because `Select the Label Layout` still appeared after Items Per Page.
- Focused unit: `node --test test/printer-resolution.test.js` passed 38/38.
- Electron runtimes passed: `test/wizard-label-layout-runtime.js`, `test/wizard-preview-runtime.js`, `test/wizard-side-edges-runtime.js`, `test/wizard-printed-item-shape-runtime.js`, and `npx electron --disable-gpu test/printer-resolution-runtime.js`.
- Full `npm run test:basic`: passed all 1,051 unit tests (0 failed, 0 skipped); `test/data-sources.js`, `test/print-job.js`, and `test/smoke.js` passed; 140 unit-test files inventoried and no undocumented files. Report: `test/basic-unit-result.json`.
- One earlier full-suite attempt reported a single `publicLibraryUrl is not a function` failure in `test/template-library.test.js`; that file passed alone and with `test/template-browser.test.js`, and the complete rerun passed without code changes to the library module.

## Remaining unknowns

- REA static strings could not establish how BarTender's native layout page changes document settings. No direct native runtime or physical print comparison was performed.
