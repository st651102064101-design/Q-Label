# New Label default has no selected stock — REA record

Date: 2026-10-28  
Request: verify and correct the user's report that `Custom` appears to be selected as the default stock. The desired default is no selected stock; catalog stock is applied only after an explicit user choice.

## Required workflow and REA operation

- Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, `../rea/README.md`, `../rea/docs/mcp-contracts.md`, and the installed REA skill/target references. Applied Superpowers systematic debugging and test-driven development; the regression assertions were run before implementation and failed on the previous predefined/default-stock behavior.
- REA checkout upstream: `https://github.com/morluto/rea.git`; revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`.
- Live REA MCP catalog checked. Selected operation: `mcp__rea__inspect_managed_members`, schema `{path?: string, detail?: "complete"|"summary", type_names?: string[]}`. Invoked against the feature-relevant installed executable `D:/Programs/BarTend.exe` using `detail:"summary"`; no type filter was used because the target's type inventory was not admitted and an unmatched type query would not be evidence.
- BarTender executable SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` (matches retained stock/wizard evidence identity).
- MCP Evidence: `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d`, linked parent `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`. The selected operation reports managed metadata unavailable: metadata representation exceeded the provider budget at offset 7,953,088 (metadata limit 67,108,864 bytes); no types, methods, or native wizard default were observed. This is a scoped REA feature-analysis attempt, not evidence that BarTender selects or omits a stock.
- REA MCP process/version observed in the live process catalog: `rea-agents@6.7.0`; provider projection returned by the selected operation: `rea-analysis-view` v1. No CLI fallback was needed because the matching MCP operation was available.

## Code finding and implementation mapping

- `gui/new-label-wizard.js`: the custom-stock radio now starts checked; the predefined catalog is not the active mode. Finishing without an explicitly selected predefined stock omits `stock.name` and does not fabricate `Custom`.
- `gui/new-label-stock-mode.js`: default state is custom settings with catalog controls disabled.
- `gui/workspace-modals.js`: an absent current stock name no longer synthesizes a `Custom` row, and an unmatched/no name leaves the catalog `selectedIndex` at `-1` instead of selecting the first stock. The empty state is labeled `No stock selected`.
- `gui/renderer.js`: a missing stock name stays blank in the UI/draft instead of becoming `USER`.
- `test/new-label-stock-mode.test.js`, `test/printer-resolution.test.js`, and `test/page-setup.test.js` cover the default state, Finish omission, explicit predefined selection, and Page Setup's non-selection behavior.

## Verification and limits

- Focused regression: `node --test test/new-label-stock-mode.test.js test/printer-resolution.test.js test/page-setup.test.js` — 95 passed, 0 failed, 0 skipped.
- Electron integration: `node_modules/.bin/electron.cmd test/printer-resolution-runtime.js` was attempted twice and timed out before the renderer reached the first printer IPC callback; the harness did not verify the UI in those attempts. GPU state warnings followed shutdown. It is not counted as passed.
- Whole-system `npm run test:basic`: PASS at display v1.261; 1,275/1,275 tests across 169 files, 0 failed/0 skipped, no undocumented files, and all three legacy stages passed. Report timestamp: `2026-10-28T03:01:15.222Z`; `test/basic-unit-result.json`.
- Existing documents that already persist a stock named `Custom` remain unchanged. This fix only prevents an unselected stock from being newly assigned or auto-selected.
- BarTender's native wizard default is still unknown due the REA metadata admission limit. The implementation honors the user's requested no-stock default and does not claim verified BarTender parity. No physical printer was used.
