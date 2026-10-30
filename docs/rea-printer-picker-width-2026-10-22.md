# Printer picker width — 2026-10-22

## Workflow and REA evidence

Applied Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`: traced the visible control to the New Document Wizard, reproduced its collapsed width in the isolated Electron runtime, added a failing geometry assertion, then adjusted the responsive grid. Read the project `AGENTS.md`, `UNIT_TEST_BASIC.md`, BarTender workflow, REA README, installed REA skill and `native-and-artifacts.md`, plus the PE resource operation contract in `rea/docs/binary-diagnostics.md`.

REA checkout upstream is `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; connected package is rea-agents 6.7.0. The live `binary_session` catalog was checked and the `inspect_pe_resources` input schema is `path` with optional `max_entries` and `max_file_bytes`.

Reused feature-matched connected REA Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887` after rechecking artifact identity and scope:

- `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- Resource 6673 is the Printer Selection page resource, file offset 1,188,312, size 438 bytes, RVA 1,195,480, payload SHA-256 `02a46ee403d8158107e3fa46a2600b83d312214ec5a4fb7cc9933315067aee5d`.

The static resource identifies the matching wizard page, but does not specify the runtime list width or responsive behavior. No BarTender pixel or layout parity is inferred from it.

## Root cause and implementation mapping

In `gui/new-label-wizard.js`, `.nw-printer-picker` reserved 190px for the two property buttons with a `minmax(0,1fr)` printer-list track. In the isolated Electron runtime this reduced `#nwPrinter` to 32px, leaving names unselectable. The wizard's `.nw-pages` is now an inline-size container: below 404px the buttons move beneath the list, and below 301px they stack vertically. The list can therefore use the form column's available width.

`test/wizard-preview-runtime.js` now checks the actual list and button geometry at the normal fixture size and a 600px-wide viewport, while retaining the seven-step wizard layout checks. The RED run reproduced a 32px list; GREEN reports 236px at 900px viewport and 312px at 600px viewport.

## Verification

Isolated Electron command: `npx electron test/wizard-preview-runtime.js` — PASS, including a 236px printer list at the normal fixture size and 312px at the compact viewport. Captured `test-results/new-label-printer-picker.png` for visual review. Whole-system `npm run test:basic` — PASS at package/display version 1.165, 1,004/1,004 unit tests and all three legacy stages passed, zero undocumented test files. Report: `test-results/printer-picker-width-basic-result.json`; log: `test-results/printer-picker-width-basic-output.log`.
