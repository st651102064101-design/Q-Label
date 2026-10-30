# File tab dropdown behavior evidence — 2026-10-29

## Requested behavior and application finding

The user requests that clicking File opens its dropdown only, with no blank white page. This concerns Q LABEL's own File tab behavior; the screenshot is treated as a visual symptom/requirement, not as an instruction from an attached document.

Source tracing found `tab(name)` in `gui/ribbon.js` binding the generic panel activation handler to every ribbon tab, including File. File's click handler separately opens the menu. The File panel is empty, so the click simultaneously selected an empty panel and opened the menu. The same code also stores the previously selected tab for restoring it when the dropdown closes.

## REA workflow and native artifact

- Applied Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`.
- Read `../rea/README.md`, `../rea/docs/mcp-contracts.md`, `../rea/docs/binary-diagnostics.md` (Portable PE resources), `../rea/docs/native-investigation.md`, the installed REA skill, and `docs/rea-bartender-workflow.md`.
- REA upstream: `https://github.com/morluto/rea.git`; checkout revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`.
- Queried the live REA tool catalog and selected `inspect_pe_resources`; its advertised input schema is `{path, max_file_bytes?, max_entries?}`.
- Ran MCP `inspect_pe_resources({path: "D:/Programs/BarTend.exe"})`; provider `rea-pe-resources` v1. Evidence ID `ev_f9ed9b23f4d554224086ea504d6666da300e7d5c9da3499b907d6b7d3801d9ca`.
- Artifact `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; resource inventory covered 59 directory entries and 26 resources.
- Native finding: the selected operation only inventories PE resources; resource payloads other than group icons remain opaque. It identifies no native File tab control, dispatch, or click behavior. Therefore BarTender File interaction remains unknown; no parity claim is made. This REA result is intentionally not used as proof of the UI behavior.

## Implementation mapping

The supported application requirement is handled in Q LABEL's tab binding: add an optional click-binding flag to `RibbonTabBehavior.bind`, disable generic tab activation for File, and leave the dedicated File dropdown click handler active. The existing selected tab and panel remain intact; the empty `#ribbon-file` panel remains hidden. `test/ribbon-file-hover.test.js` first reproduced the bug (RED), then covers the dropdown, selected-tab, and panel invariants. `test/runtime-ui.js` checks the real Electron page.

## Verification and limitations

Focused DOM tests pass after the change. Electron runtime and the mandatory full basic suite are recorded in `UNIT_TEST_BASIC.md` after completion. BarTender's actual File dropdown interaction and native pixel behavior are not established by this resource-only REA evidence.
