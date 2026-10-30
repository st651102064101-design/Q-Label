# New Label single-printer double-click — 2026-10-22

## Workflow and REA evidence

- Read and applied `labelforge/AGENTS.md`, `labelforge/UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, the installed REA skill and native-artifact reference, plus Superpowers `using-superpowers`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`.
- REA checkout: `../rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; connected MCP REA tools were available, so no CLI fallback was used. Queried the live catalog and the selected `inspect_pe_resources` input schema. The operation contract was checked in `rea/docs/mcp-contracts.md`; PE resource details are in `rea/docs/binary-diagnostics.md`.
- Feature artifact: installed `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` (identity matches retained BarTender evidence in the printer-selection report).
- Related installed resource assembly: `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- REA MCP operation `inspect_pe_resources({path:"D:/Programs/BtEnu.dll"})`; Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887`; provider `rea-pe-resources` v1. It observed a complete PE resource inventory (2,950 entries examined, 1,468 resources). Resource payloads other than icon groups are opaque and the operation does not execute or observe UI controls.
- Native interaction result: unknown. The selected static resource operation cannot establish whether BarTender advances its printer-selection wizard on a single-item double-click. No native runtime interaction was observed. The implemented behavior is therefore the user's explicit Q LABEL requirement; this is not asserted as confirmed BarTender parity.

## Implementation mapping

- `gui/new-label-wizard.js`: listen for double-click on Printer Selection and call the existing Next handler only while on step 0 and exactly one enabled, nonempty printer option is available and selected. Existing DPI checks and navigation validation remain authoritative.
- `test/printer-resolution.test.js`: prove the one-printer double-click advances, while a single click or multiple-printer double-click does not.
- `test/wizard-preview-runtime.js`: exercise one-choice double-click in isolated Electron and verify Back returns to Printer Selection before continuing the existing wizard visual checks.
- `UNIT_TEST_BASIC.md`: document the interaction, behavior cases and runtime coverage.

## Verification

- TDD red: before the handler, the new single-choice unit test failed because the heading remained `Select the Printer`.
- TDD green: `node --test test/printer-resolution.test.js` passed 25/25 after implementation.
- `npx electron --disable-gpu test/wizard-preview-runtime.js`: passed, including the single-choice advance/Back flow, seven-step footer and preview checks.
- `npm run test:basic`: passed on the shared workspace at display version 1.159; 131 test files, 1,002/1,002 unit tests, 0 failed, 0 skipped, no undocumented tests, all three legacy stages passed. Report: `test/basic-unit-result.json`; full output: `test/basic-unit-output.log`.
- `npx electron --disable-gpu test/wizard-preview-runtime.js`: passed at the current shared version 1.160, including the single-choice double-click advance and Back flow, seven-step layout and footer checks, preview checks, and compact viewport.
- The shared workspace concurrently advanced to 1.159 and then 1.160 for separate New Document Wizard changes during this task. The Basic Suite report records the 1.159 source snapshot; the focused Electron runtime was repeated on current v1.160. The single-printer feature is recorded in v1.158.
