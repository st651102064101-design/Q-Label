# Barcode tools and inline HRI editing — v1.057

## Approved scope

User approved the bounded design in chat: click barcode digits for a caret at the rendered text, update bars live for valid values, keep leading zeros, show invalid-data feedback without replacing the last valid barcode, and audit the tools in the supplied barcode context menu. This covers that menu, not every tool in the whole application.

## Changes

- Clicking within a visible, unlocked barcode HRI rectangle opens a native text input. It remains mounted during SVG updates. Enter/outside blur commits, Escape restores the document captured before editing; one Undo snapshot is taken for the edit session.
- Native linear symbologies validate allowed characters/length/check digit before updating. Invalid drafts show an accessible alert beside the input and keep the last valid object value. Values remain strings.
- Single directly editable named embedded/input/legacy constant/entry sources keep their binding and propagate to other users. Combined or calculated sources report that editing belongs in Data Sources instead of silently flattening the source graph.
- Encoded barcode_spec objects use actual IPC encoding, with stale-response guards, refreshed full and bars-only bitmaps, and blur waiting for the latest encode.
- HRI SVG styling now applies bold/italic/underline/wrap even when no font_family is stored. Existing toolbar capability checks already remove unsupported Auto Fit/line-style/thickness from barcode context tools.

## Verification

Unit regressions initially failed for absent inline editing helper and missing HRI font-weight. `test/barcode-inline.test.js` now passes both actual model/shared-source and SVG-style cases.

Isolated full Electron application runs (no physical printing):

- `npx electron test/barcode-inline-runtime.js`: clicked digits → focused collapsed caret; valid input changes artwork without replacing the editor; leading zeros preserved; invalid Unicode leaves the last valid Code128; commit and Escape pass.
- `npx electron test/barcode-inline-async-runtime.js`: actual barcode IPC calls; rapid edits followed immediately by blur commit the newest value and update bars bitmap/HRI.
- `npx electron test/barcode-tools-runtime.js`: 18 actions checked, with model/actual rendered assertions for B/I/U, font, size, left/center/right alignment, physical width, bar height, HRI gap, vertical alignment, inverse on/off, text/background colors, wrap and Clear All Formatting. Unsupported controls are absent from context. Wrap produces multiple actual rendered HRI text lines for long values; an exhaustive native printer/font matrix is not covered.

These tests exposed invalid fixture selections (`Courier New` is absent from the current font catalog, and color labels are dynamic); the fixtures now use Cambria and the rendered labels. This was a fixture correction, not removal of a product assertion. Async blur assertions await completion rather than treating a pending encode as committed.

## REA

REA skill and mandatory workflow read. CLI 6.7.0 command:

`node D:/QLabel-agent-work/npm-cache/_npx/a1722018f28f9df2/node_modules/rea-agents/scripts/rea.mjs inspect-managed-members C:/Windows/Microsoft.NET/assembly/GAC_64/BarTender.Managed/v4.0_12.1.0.1__109ff779a1b4cbc7/BarTender.Managed.dll --type BarTender.Managed.DataTypes.TextTypePage --format json`

Output: `D:/QLabel-agent-work/rea-20261020/barcode-text-page-evidence.json`, evidence `ev_4fc15c563e963bf6388d036a22cf491f2bc8f291638ea08fa438368493a045aa`, SHA-256 `f32a25aee51846c2a33fcaa20f42dd23eee38554b2c172608efb3ce0fd12f389`. The selected type was **unmatched**; this does not establish native HRI editing or formatting. Existing matching native artifact identity is documented in `rea-bartender-workflow.md`. No native BarTender click/edit behavior was observed. Implementation follows the user's approved interaction, and native parity remains unknown.

Full npm run test:basic: 820 passed, 0 failed/skipped/cancelled; all three legacy stages passed. Report: test/basic-unit-result.json; assertions: test/basic-unit-output.log.
