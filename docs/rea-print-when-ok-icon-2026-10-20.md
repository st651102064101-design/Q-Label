# Print When OK SVG visibility — 2026-10-20

## Scope

Fix the invisible check SVG on the `Print When` dialog's OK button while preserving the existing commit behavior. This is a Q LABEL dialog rendering bug; no native BarTender parity claim is made.

## Workflow and REA evidence

- Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA `../rea/README.md`, `../rea/docs/mcp-contracts.md`, the installed reverse-engineering skill and its native/provider references.
- Read Superpowers `using-superpowers`, `systematic-debugging`, `brainstorming`, and `test-driven-development`. Reproduced the UI in JSDOM before changing production code, confirmed the incorrect white stroke, then made one small fix and reran DOM and Electron checks.
- REA upstream: `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; installed CLI version: `rea-agents 6.7.0`.
- Inspected the active REA MCP catalog and selected `mcp__rea__trace_feature` schema. Queried `Print When`; REA returned `provider_unavailable` for `search_strings`, with selected provider `auto` and no artifact feature evidence.
- Installed artifacts: `D:/Programs/BarTend.exe` SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; `D:/Programs/BtEnu.dll` SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`. These match the previously audited build. REA provider diagnostics: Ghidra unset and this mixed managed/native PE is unsupported by the configured Windows route; Hopper unsupported on Windows; IDA/Kuna not configured, and Kuna does not admit PE. No native icon details were recovered.

## Root cause and mapping

- `gui/object-properties-pages.js` created OK as `type="submit"`. The global action-button styling sets submit-button SVG strokes to white for green primary buttons.
- In this dialog the existing `ok.onclick` already dispatches a cancelable `submit` event to the form. The button uses the white-button visual treatment, so submit-specific white icon styling made the check disappear against the light background.
- Changed OK to `type="button"` and kept the same explicit form-submit dispatch. This selects the shared green check icon stroke while preserving validation, state update, and dialog close behavior.
- `test/object-properties-pages.test.js` now loads the shared button enhancer and asserts the OK icon is present, not white-on-white, and still commits `Never`. It failed before the change with actual computed stroke `rgb(255, 255, 255)`.
- Electron `test/object-properties-object-runtime.js` checks the rendered SVG stroke before clicking OK, then verifies condition/preview/print behavior remains correct.

## Verification and limitations

- `node --test test/object-properties-pages.test.js`: 13 passed, 0 failed.
- `npx electron test/object-properties-object-runtime.js`: PASS; icon stroke `rgb(22, 163, 74)`, `Print When` condition commits, hidden object stays out of print output, no printer transport is sent.
- The first full Basic run reached 831/832; the sole failure was Windows `ENOTEMPTY` while removing a temporary directory in `test/source-serialization.test.js`. Added bounded `fs.rm` retries only to those test teardowns; the focused serialization file then passed 8/8.
- Final `npm run test:basic`: 832 passed, 0 failed/cancelled/skipped; the 3 legacy stages passed. Report: `test/basic-unit-result.json`.
- Native BarTender icon color and button semantics remain unknown because the REA provider cannot analyze this installed PE on the current Windows setup. The change fixes the demonstrated Q LABEL contrast bug only.
