# Expand New Document Wizard content when preview is hidden — 2026-10-22

## Scope and required workflow

The user screenshot shows the Q LABEL `Starting Point` help copy wrapping narrowly as if a preview column were present, even though its preview is hidden. This change removes the empty grid track for every step whose preview is hidden and allows the Starting Point help copy to wrap naturally. This Starting Point step is Q LABEL-specific; it is not presented as BarTender-native behavior.

Read and applied `AGENTS.md`, `UNIT_TEST_BASIC.md`, Superpowers `using-superpowers`, `systematic-debugging`, `test-driven-development`, `verification-before-completion`, REA checkout `README.md`, installed reverse-engineer-anything skill, `docs/binary-diagnostics.md`, `docs/mcp-contracts.md`, and `docs/rea-bartender-workflow.md`. REA checkout upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`, MCP server 6.7.0.

## REA feature evidence and limits

Verified installed artifact identity and matching retained scope before reuse: `D:/Programs/BarTend.exe` SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; related wizard resource assembly `D:/Programs/BtEnu.dll` SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.

Inspected the live MCP catalog and `inspect_pe_resources` input schema (`path`, optional `max_entries`, optional `max_file_bytes`); invoked `inspect_pe_resources({path:"D:/Programs/BtEnu.dll"})` on the current matching artifact. Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887`, complete 2,950-entry/1,468-resource static inventory. The matching retained decoder record in `docs/rea-wizard-fit-preview-2026-10-22.md` maps resource 6676 to Stock Selection controls including Preview Area. This establishes the native page has preview-related controls. It cannot establish which runtime steps show the pane or whether hiding it expands the form. Starting Point is a Q LABEL-added step; its full-width layout follows the user's explicit direction, not a native parity claim.

## Root cause and mapping

`gui/new-label-wizard.js` always gave `.nw-body` a second 180px grid track. On Starting Point the `<aside>` preview was hidden but its grid track remained. Before the change, isolated Electron measured `.nw-pages` at 236px against 586px available inside the body. The help paragraph also contained a forced `<br>`.

`render()` now records `data-preview=hidden|visible` on `.nw-body` with the pane state. A matching CSS rule changes hidden-preview pages to one full-width track, overriding old step-specific two-column rules. Removed the forced break from the Starting Point help text. This also makes other pages with no preview reclaim the unused track; Stock Selection with a predefined visible preview keeps its two-column layout.

## Verification

- Red: the Starting Point unit assertion failed because the preview layout state was absent. Electron runtime confirmed the original width defect (236px form versus 586px available).
- Green: isolated `node --test --test-name-pattern='Starting Point hides its preview pane' test/printer-resolution.test.js` passed. Electron `./node_modules/.bin/electron.cmd test/wizard-preview-runtime.js` passed across all eight pages and compact viewport; hidden-preview pages now assert full inner width, and visible predefined-stock preview remains tested.
- Full `npm run test:basic` completed at `2026-10-22T03:25:41.692Z` on v1.168: 1,008/1,008 tests passed, zero skipped/cancelled, all three legacy stages passed, and no undocumented test files. The shared workspace later advanced to v1.170 during concurrent changes; the Starting Point layout and runtime assertions passed in this run.
