# Shared wizard roll preview — v1.232

## Request and implementation

Rebuild the roll illustration on Items Per Page, Side Edges, Printed Item Shape and Template Size from the supplied BarTender screenshot, with a uniform grey workspace. All four now call `PaperPreview.renderReferenceRoll` in `gui/modal-preview.js` through `gui/new-label-wizard.js`. Summary uses the same renderer. The logical pane is 198×270; a square label occupies 154×154 at (22,58). Adjacent labels are clipped slivers fading into the grey workspace. Rollers, green gap guides and capsule-shaped ends are removed. Shape, aspect ratio and multiple-item counts remain data-driven. Template Size controls were compacted to fit without body scrolling.

## REA provenance and feature evidence

- Checkout: `../rea`, upstream https://github.com/morluto/rea.git, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`. Read README and MCP contracts; inspected live operation catalog and selected input schemas.
- Installed artifacts: `D:/Programs/BarTend.exe`, SHA256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; `D:/Programs/BtEnu.dll`, SHA256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- An initial query against a stale target returned target_unavailable. Opened BtEnu.dll using connected `open_binary` with provider ghidra, then `search_strings` with regex `Printed Item Shape|Side Edges|Template Size`. No CLI fallback needed. Provider version 12.1.4.
- Evidence `ev_a81222b9241d8214e363e83eb05d2f3ee2127393194e239cac8000b0da54c4d3`: Printed Item Shape at `0x1036c03c`, Side Edges at `0x1036c0f8`, Template Size at `0x1036c19c`, Template Size caption at `0x10341dd6`.
- These feature-matched resources identify the wizard pages and caption; they do not establish the drawing algorithm. Geometry and appearance are reconstructed from the user's native reference screenshot. Items Per Page coverage comes from the user's additional screenshot and shared implementation, not these resource strings. Native session closed after analysis.

## Verification and limitations

- Focused unit suite: 40/40 passed (printer-resolution plus new wizard-roll-reference tests).
- `npx electron test/wizard-roll-reference-runtime.js`: PASS; four 4×4in panes are 198×270 and normalized SVG geometry is identical. Captures in `test-results/wizard-roll-*.png`.
- `npx electron test/wizard-preview-runtime.js`: PASS; all eight wizard pages, shape/stock selection, six-item layout, compact viewport, footer sizes and body fit checked.
- Full `npm run test:basic`: PASS, 1,052/1,052 unit tests and all three legacy stages passed; no undocumented test files. Results in `test/basic-unit-result.json` and `test/basic-unit-output.log`. Initial run had one transient Windows EPERM renaming an isolated serialization ledger; that file passed 8/8 on immediate rerun, then the complete suite passed without code changes.
- No physical printing or native runtime pixel comparison performed. This is screenshot-based reconstruction, not a claim of proven 100% native pixel parity. Workspace grey is intentionally different from native blue.
