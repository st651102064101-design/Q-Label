# New Label Stock Selection layout — REA record

Date: 2026-10-21

## Request and implementation scope

The user requested removal of the roll/sheet choice because it is absent from the supplied BarTender reference, and a Stock Selection layout matching the supplied reference structure while retaining Q LABEL's modern styling. The reference shows two stock-mode radios, Category, a visible Stock name list, a right-side preview, and a template-size caption.

This implements the requested Q LABEL behavior. It does not claim pixel-perfect or 100% BarTender parity.

## Workflows applied

- Read and applied Superpowers `using-superpowers`, `brainstorming`, `test-driven-development`, and `verification-before-completion`. The user approved the proposed bounded design with “ทำต่อให้เสร็จเลย”.
- Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, and `docs/rea-bartender-workflow.md` before editing.
- Read the REA checkout README, installed `reverse-engineer-anything` skill, its `native-and-artifacts.md` reference and relevant managed PE/CLI section, plus the managed operation contract section in `../rea/docs/mcp-contracts.md`.
- REA upstream: `https://github.com/morluto/rea.git`; checkout revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Active REA package/server: `rea-agents` 6.7.0; MCP catalog 207 tools, digest `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639e`.
- The live `inspect_managed_members` schema accepts `path`, `detail: complete|summary`, and exact `type_names`; the selected schema was read from the live tool catalog. `binary_session({})` reports managed static analysis available and native UI observation unsupported on Windows.

## REA evidence and limits

| Artifact | SHA-256 | Evidence | Finding for this feature |
| --- | --- | --- | --- |
| `D:/Programs/BarTend.exe` | `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` | `inspect_managed_members` parent `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`; summary `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d` | Managed metadata representation exceeded REA's 64 MiB budget at offset 7,953,088. No managed members were admitted, so the required wizard implementation is unknown. |
| `D:/Programs/Seagull.WizardFramework.dll` | `1a2cba97bf664d69b3a2a3e25bdb1ba4265b39a0c81ae6d93778e081d9fe2cc7` | `inspect_managed_members` `ev_05b326db1a274aee0d7c7eb9850c6ca0c867d322c267814dfa003f0a695c4dc9`; summary `ev_dbe6e4015352f5d41cc68bde57b92d64cd11d05025b3888988a007e7276bd380` | Complete metadata identifies a generic wizard framework (`WizardBase`, `IWizardPage`, etc.), but no stock-specific controls, labels, or behavior. Not feature evidence. |
| `D:/Programs/Seagull.TemplateBrowser.dll` | `7bd51bbd0c668f01c87fc904e2199b12607ad0a13a22f09efa5a697022a21f87` | `inspect_managed_members` `ev_ed5e9b2789e9d24fe4a93b8eae97f95fe8a5979d96d4ea1ab1ae39f03e3f186a` | Types concern template browsing/fetching; no New Document stock-selection implementation. |
| `D:/Programs/Seagull.PrinterSetup.dll` | `370f0a891dc283a5a653c965f8d01f8986f3bfaf8dcefe3ec40fe8bdba704496` | `inspect_managed_members` `ev_bc89f9c09484320f7139dce0b0133839b78d5d485850f304fa5ae99983df82c2` | Printer queue/settings utilities only; not the wizard stock step. |
| `D:/Programs/Seagull.PrinterSetup.PrinterSettingsConfiguration.dll` | `f5987c89e6c184927b0da33d7f640dacd76d9e1e7c5be86b0d362c72351fadcc` | `inspect_managed_members` `ev_46566d631ece3d43e5dfe7029665174338705ef20cdae761742394d33b3bb1cd` | Printer settings and configuration resources; not stock selection. |
| `D:/Programs/Seagull.Forms.dll` | `0e3207914b2b31d517bea4db5b558fa0ea906a98f42b74180efb36706b437f56` | `inspect_managed_members` `ev_56ae425dc63a36e1aaac640723a45512ab4c70028c059b73ae68c691a4b56eea` | Data-entry forms/controls; no stock selection implementation. |

Candidate DLLs are installed beside `BarTend.exe`, but REA did not establish that any candidate implements this wizard page. Their evidence is recorded as ruled-out candidates, not native feature findings. The screenshots were supplied by the user and used only as visual references. Native UI observation is unavailable through the live REA host on Windows. Exact native selection behavior, sizing, keyboard semantics, and preview behavior therefore remain unknown.

## Implementation mapping

- `gui/new-label-wizard.js`: removed all visible roll/sheet radio controls and listeners. Custom settings retain the existing roll-style derived page dimensions. For a predefined stock, its `printer_type` remains an internal catalog fact; a sheet stock continues to use its catalog page size without asking the user to choose a paper mode.
- `gui/new-label-wizard.js`: grouped the two stock-mode radios; added reference-style explanatory text, Category and full-width 8-row Stock name list, retained the right-side live preview, and labeled the dimensions `Template size`. Existing green/white Q LABEL styling remains.
- `test/printer-resolution.test.js`: asserts the removed controls stay absent in both modes, the selection-page structure, catalog propagation, and predefined sheet page geometry.
- `test/printer-resolution-runtime.js`: asserts absence of roll/sheet controls and labels, and checks the Stock Selection heading, explanatory text, 8-row catalog list, preview, and size caption in Electron with temporary appData. No print is sent.
- `UNIT_TEST_BASIC.md`: updated test inventory, behavior checklist and runtime requirements.

## Verification

- TDD RED: the revised focused test initially failed on the still-present roll/sheet wrapper and the absent stock-selection help copy, as expected.
- TDD GREEN: `node --test test/printer-resolution.test.js` passed 16/16 tests, including predefined sheet-stock page dimensions.
- Electron runtime: `node_modules/.bin/electron.cmd test/printer-resolution-runtime.js` exited 0; it verified installed printer DPI, removal of roll/sheet and language choices, Stock Selection category/list/preview/template-size data, catalog dimensions, and stale IPC fallback. Expected missing-handler diagnostic and Chromium GPU warning were logged; no print job was sent.
- Whole-system `npm run test:basic` passed all 965 unit tests across 127 discovered files, with 0 failed and 0 skipped. All three legacy checks (`test/data-sources.js`, `test/print-job.js`, `test/smoke.js`) exited 0 and no test files were undocumented. Report: `test/basic-unit-result.json`; detailed output: `test/basic-unit-output.log`.
- `git diff --check` exited 0. Git printed line-ending normalization notices for existing LF/CRLF-mixed workspace files.

## Remaining unknowns

The installed BarTender wizard implementation could not be recovered through REA, and native UI capture is unsupported by the current Windows host. The exact native stock-step behavior and visual measurements remain unknown. This is a Q LABEL implementation guided by the user's explicit request and supplied visual reference; it must not be described as 100% BarTender parity.
