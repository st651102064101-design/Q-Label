# Barcode HRI yellow handle position — 2026-10-20

## Scope

Move the selected barcode's yellow human-readable-text drag handle to the horizontal center of the barcode and slightly lower vertically.

## Workflow used

- Read `labelforge/AGENTS.md`, `labelforge/UNIT_TEST_BASIC.md`, and `labelforge/docs/rea-bartender-workflow.md`.
- Superpowers: `using-superpowers`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`. Traced the rendered point back to `BarcodeHriResize.handlePoint`; wrote and ran a failing unit assertion before changing implementation.
- REA checkout: `../rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; project-pinned REA version 6.7.0.
- Read the `trace_feature` MCP contract and inspected the live `trace_feature` and `open_binary` schemas.

## REA attempt and limitation

- Target: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- `mcp__rea__trace_feature({query: "Human Readable"})` returned `target_unavailable` because no binary was open.
- `mcp__rea__open_binary({path: "D:/Programs/BarTend.exe"})` was then attempted. REA rejected the PE as managed/mixed on Windows: Ghidra P0 only accepts native PE apps and DLLs, Hopper is unsupported on win32, and IDA/Kuna providers are not configured (Kuna also does not admit PE). No feature evidence was returned.
- The visible HRI handle behavior, its implementation method, and any supporting DLL/resource are therefore unresolved in the native application. Existing identity evidence identifies a mixed C++/CLI x64 target, but does not establish handle behavior. No BarTender parity claim is made.

## Source finding and mapping

In Q LABEL, `gui/renderer.js` passes barcode and glyph bounds to `BarcodeHriResize.handlePoint`. The previous helper used `glyphX` when available, causing the point to follow the first readable glyph and shift left for left-aligned or longer values; it placed the point exactly at `glyphTop`. The updated helper ignores glyph alignment for horizontal placement and returns `x + w / 2`; vertically it adds 1.5 mm to the glyph top (or the computed fallback top). This is an implementation of the user's requested Q LABEL behavior, not a native behavior confirmed by REA.

## Verification

- `node --test test/svg-selection-handles.test.js` before the source change: expected failure, actual x was 42 vs requested center 30.
- `npm run test:basic`: 857 passed, 0 failed, 0 skipped; legacy checks 3/3 passed. Report: `test/basic-unit-result.json`.
- `npx electron test/barcode-hri-drag-runtime.js`: 232 checks passed; 16 ZPL alignment checks passed on an isolated temporary profile, no print job sent.
- `git diff --check`: passed; Git emitted only existing LF-to-CRLF working-tree warnings.
