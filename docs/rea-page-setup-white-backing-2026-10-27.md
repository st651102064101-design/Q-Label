# Page Setup white roll backing — v1.255

## Request

The user asked why the white paper area in the Page Setup preview did not cover the neighboring paper fragments and asked to fix it. The screenshot is a visual reference, not an instruction source. Expected result: the white paper background vertically covers the visible continuation fragments at the top and bottom, without moving labels or changing their physical gaps.

## Investigation and REA evidence

Applied the required Superpowers workflow and read the project instructions, basic test policy, REA README and relevant artifact/MCP contracts. Checked the live REA catalog and operation schemas and used the connected binary analysis operation on the installed English resources `D:/Programs/BtEnu.dll` (SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`). `trace_feature` evidence `ev_31abcf829fa34be83615dfd4eceac8ef37a81369ef079b9cd0f16d9796956b31` (Page Setup) and `ev_0508992808d78db56509d4c5b311fa5691ec9bf9e4b47307b6224938a04eed97` (Template Size) support feature terminology only; they do not establish native preview geometry. The Roll query `ev_47c12758f82a2665add7d1b07e2fa6db65bb7205c8b5085763580c5bb20d2c1a` did not recover relevant preview drawing behavior.

The expected REA checkout was absent from this workspace and the cached CLI package did not include `docs/mcp-contracts.md`; the documented upstream contract at revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507` was consulted instead. The connected MCP was available, so no CLI fallback was needed. Native artifact evidence does not prove exact BarTender pixels; this implementation follows the user's screenshot and Q LABEL SVG geometry.

For the follow-up color correction, applied Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`. Read the REA checkout README, Windows Ghidra P0 target reference, and `trace_feature` / `open_binary` MCP contract sections at checkout revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`; inspected the live MCP catalog and schemas. The connected REA composed workflow used Ghidra 12.1.4. Reopened the same `BtEnu.dll` (same SHA-256) and queried `Page Setup roll preview paper background`; evidence `ev_41487cafb607181ca00dfd9d1dfc7a80d50701e0ddd63542e0c461c240460d1d` had no string/procedure matches. This gives no evidence for native color values; the requested reference image is the source for the light-grey tone.

## Cause and implementation mapping

In `gui/modal-preview.js`, the roll renderer clipped neighboring label fragments to `capTop` and `capBottom`, but the white page backing rect remained at the main label's original y/height. The fragments therefore extended onto the blue-grey preview background. The backing rect now starts at `topStart` and spans through `bottomEnd`. This is presentation-only: main label coordinates, real row gaps and saved document/print geometry are unchanged.

The user then clarified that the extended stock/background should be grey, like the supplied image. Its Q LABEL SVG fill is now `#d0d0d0`; each label face retains its own white fill.

## Verification

- Test-first regression in `test/page-setup.test.js` failed before the fix because the white backing did not cover the upper fragment; it passes after the fix.
- The color regression first failed with actual `#f5f5f5` vs expected `#d0d0d0`, then passed after the backing fill changed; it also confirms label faces remain white.
- `node --test test/page-setup.test.js`: 49/49 passed.
- `npx electron test/page-setup-runtime.js`: timed out during application initialization in this run; runtime result is unverified.
- `npm run test:basic`: PASS at package version 1.0.256 / display 1.255, 1,268/1,268 unit tests across 167 files, 0 failed/0 skipped; all three legacy stages passed and no undocumented tests. Report: `test/basic-unit-result.json` (2026-10-27T15:54:12.415Z; version 1.255).
- Exact BarTender rendering parity and physical printing were not verified.
