# New Label Wizard custom stock default — 2026-10-21

## Process applied

- Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA `README.md`, the installed REA skill and native/managed reference.
- Read Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`; wrote a failing DOM regression before implementation and traced form reset, stock list loading, and finish data flow.
- REA checkout origin: `https://github.com/morluto/rea.git`; revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Inspected live REA tool catalog and schemas for `open_binary`, `inspect_pe_resources`, `inspect_managed_artifact`, and `inspect_managed_members`; read the `open_binary` and PE resource contract sections in `rea/docs/mcp-contracts.md`.

## Native evidence and limitation

- Artifact: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- REA operation `inspect_pe_resources` evidence `ev_f9ed9b23f4d554224086ea504d6666da300e7d5c9da3499b907d6b7d3801d9ca` identifies the PE resource directory but does not recover wizard defaults or native event behavior.
- REA `open_binary({path:"D:/Programs/BarTend.exe",provider_id:"ghidra"})` returned `capability_unavailable`: Windows Ghidra P0 rejects this target because it is mixed C++/CLI managed PE; Hopper is unsupported on Windows, IDA and Kuna are not configured. No decompilation/runtime UI evidence was obtained.
- Specific unknown: the native BarTender control and default state of the corresponding stock/custom wizard radio could not be established. The user's explicit requested default is implemented as Q LABEL behavior; no native parity claim is made.

## Root cause and mapping

- `gui/new-label-wizard.js` marked the predefined radio checked, and opening the wizard reset the form to that mode. `populateStockCategories()` also loaded the first stock and applied its dimensions immediately, so changing only the checked radio would still have allowed predefined dimensions to overwrite custom defaults.
- `gui/new-label-stock-mode.js` sets the custom radio and corresponding panel visibility. The wizard calls it after each `form.reset()`. Stock category names are still populated, but a stock is not selected/applied unless the user switches to predefined mode. The predefined list remains selectable when requested.
- Tests: `test/new-label-stock-mode.test.js`, `test/printer-resolution.test.js`, `test/printer-resolution-runtime.js`, and the New Label assertion in `test/runtime-ui.js`.

## Verification

- RED: new DOM test failed because the default custom-mode handler did not yet exist.
- Focused unit: `node --test test/new-label-stock-mode.test.js test/printer-resolution.test.js` passed 12/12 before adding the explicit default assertion to `printer-resolution.test.js`.
- Electron: `npm exec -- electron test/printer-resolution-runtime.js` passed; custom defaults, stock selection ADES AG 49908 dimensions, and printer DPI routes were observed in isolated appData. An expected stale-main error is emitted in the fixture after removing its IPC handler; the runtime asserts the fallback behavior.
- `npm exec -- electron test/runtime-ui.js` did not reach the wizard check: its earlier startup-home assertion failed with `editing:false, homeHidden:false`. This broader runtime result is not counted as passing.
- Whole-system `npm run test:basic`: 947 passed, 0 failed, 0 skipped; all three legacy scripts passed. Report: `test/basic-unit-result.json`; details: `test/basic-unit-output.log`.
- `package.json`, `package-lock.json` root versions set to `1.0.118`; `displayVersion` `1.118`. Dated Thai changelog entry added at the top.
