# Stock Selection empty Category option — 2026-10-22

## Scope and workflow

Remove the blank first row from the New Label wizard Category dropdown while preserving the custom default (no category selected) and normal predefined category selection. Applied Superpowers `using-superpowers`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`. Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, the REA README and managed PE/CLI contract/reference.

REA checkout upstream: `https://github.com/morluto/rea.git`; revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`. The active MCP catalog includes `mcp__rea__inspect_managed_members`; its live input schema was inspected (`path`, `detail`, `type_names`). The managed PE/CLI contract requires execution-free inspection and exact type selection with explicit coverage/unmatched names.

## Native artifact evidence and limitation

- `D:/Programs/BarTend.exe` SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` (verified before inspection).
- REA operation `inspect_managed_members({path:"D:/Programs/BarTend.exe", detail:"summary", type_names:["Seagull.BarTender.StockSelectionPage"]})`; Evidence `ev_c0bba8c3beb4619ac4279183b81cf05115604a3ec3b27a79d815c73d629bd9e6`; linked summary view `ev_06eb4eaf8c2f7572792c6e2c25740e0856040b3375adf2145229db954df1a605`.
- REA reports the requested exact type unmatched, with zero selected type rows and partial type selection coverage. Therefore it does not establish whether BarTender includes or omits an empty category item. The historical stock-selection resource evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887` establishes Category resource text but not option values/order/runtime state. User screenshot is visual reference only. Native UI observation remains unavailable on this host.

## Root cause and mapping

`gui/new-label-wizard.js` `populateStockCategories()` explicitly created an empty `<option value="">` before all manufacturer names. Because custom mode intentionally clears the select value, the browser rendered that empty item at the top when the dropdown opened. It now filters empty category names from catalog output and inserts only real category options. With no empty option, custom mode remains value-empty automatically; predefined mode still selects ADES AG (or first available category) and renders its stock list.

`test/printer-resolution.test.js` adds assertions that the category has no empty-valued options in custom and predefined modes and that custom retains actual named category options. REA only grounds the control's Category identity, not native behavior for the empty row; this requested fix is Q LABEL behavior, with no claim of native parity.

## Verification

- TDD RED: focused test run failed on both the custom and predefined empty-option assertions (21 passed, 2 failed), as expected.
- TDD GREEN: `node --test test/printer-resolution.test.js` passed 23/23.
- Whole-system `npm run test:basic` passed all 995 unit tests across 131 discovered files; 0 failed, 0 skipped, no undocumented tests. All legacy checks (`test/data-sources.js`, `test/print-job.js`, `test/smoke.js`) exited 0. Report: `test/basic-unit-result.json`; detailed output: `test/basic-unit-output.log`.
- `git diff --check` on the changed application/test/checklist/changelog/evidence files exited 0. Git emitted only existing LF/CRLF normalization notices.
