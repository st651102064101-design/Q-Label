# Page Setup solid preview edges — v1.247

The user approved the screenshot comparison with “เริ่ม”: all Page Setup tabs should have the same clearly visible dark label edges as the BarTender Layout reference, including when Print borders is off.

## Workflow and artifact evidence

Read project AGENTS and UNIT_TEST_BASIC, installed REA skill/native-artifacts reference, REA README and MCP contracts, and Superpowers using-superpowers, brainstorming (approved specific scope), systematic-debugging, writing-plans, executing-plans, TDD and verification-before-completion. The short approved spec and execution checklist are in `docs/superpowers/specs/2026-10-27-page-setup-outlines-design.md` and `docs/superpowers/plans/2026-10-27-page-setup-outlines.md`.

REA checkout origin is `https://github.com/morluto/rea.git`, revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`. Live MCP catalog and selected input schemas (`binary_session`, `open_binary`, `search_strings`, `close_binary`) were checked. Connected server: rea-agents 6.7.0; native provider: Ghidra 12.1.4. No CLI fallback or provider installation was needed; the native session was closed.

- Primary installed `D:/Programs/BarTend.exe`, verified SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Related English UI resource `D:/Programs/BtEnu.dll`, verified SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- Connected REA `open_binary` on BtEnu.dll followed by `search_strings` regex `Print.{0,12}border|Corner Radius|Border Width|Label Outline`, case-insensitive: Evidence `ev_ed73db104f247bf9c3abfbdc97eeaf2ebfe656d54de84a72b228afe4dabcb5ca`. It matches Corner Radius at `0x1035295a`. The other phrases were not recovered from the provider's defined-string inventory; that is not evidence they are absent.
- Matching prior feature evidence in `docs/rea-page-setup-roll-preview-2026-10-27.md` uses the same DLL hash and confirms Page/Template Size captions and Corner Radius, not the native drawing algorithm.

The exact native outline drawing is not established by these resources. This limitation was reported before implementation. The approved user screenshot defines the requested visual appearance; Q LABEL tests and captures are verification of our implementation, not native runtime evidence or a pixel-parity claim.

## Cause and implementation

Layout already drew configured faces with a solid `#222` stroke of 0.8 viewBox units. Other Page Setup tabs called the general shape-guide renderer, which intentionally uses a pale dashed guide when `print_border` is false. `gui/modal-preview.js` now reuses Layout's face markup for every Page Setup tab, outside the per-cell content clip so the outline retains its thickness. It omits the redundant pale guide and retains the actual printed outline inside the clip when Print borders is enabled, including live Border width feedback. Printing Order numbers, media annotations and actual label geometry still use their existing paths. General Wizard/workspace and saved print-border properties are unchanged.

## Verification

- RED: the new all-tabs test failed because Stock's preview face had no stroke instead of `#222`.
- GREEN: Page Setup, StockPreview and Wizard reference suites passed 44/44. Coverage includes eight tabs, four shapes and both Print borders states, no template mutation, and no printed ZPL border when Print borders is off.
- Focused review identified the need to retain the enabled printed border's width feedback. Two new assertions reproduced that omission before it was corrected; the Shape test now checks its scaled preview width and that disabling it removes only the printed outline.
- Electron runtime passed the actual tab-switching/preview flow. The Page and Layout PNG captures show solid rounded cell edges; single-label, 2×2 zero/nonzero gap, sheet and catalog checks also pass.
- The runtime also toggles Print borders, changes its width and disables it again. One earlier run lost expected Layout cells while other workspace edits were occurring; the isolated fixture now refuses development hot reload during its scenario, and the final runtime passes. This fixture guard does not change the running user app or product behavior.
- Final `npm run test:basic`: 1,250/1,250 passed across 166 files; 0 failed/0 skipped; all three legacy stages passed; no undocumented test files. Report timestamp 2026-10-27T02:52:10.185Z, current shared version 1.248. Retained copy: `test-results/page-setup-outlines-basic-result.json`. Final focused review found no issues. No physical printer check or native runtime pixel comparison.

Existing concurrent A4A import work was preserved. This preview fix was incremented as v1.247; the concurrent work subsequently updated the shared package to v1.248, which includes this fix and was used for final whole-suite verification.
