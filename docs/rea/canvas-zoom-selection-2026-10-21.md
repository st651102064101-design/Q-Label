# Smooth zoom for selected canvas objects — 2026-10-21

## Process

- Read project `AGENTS.md`, `UNIT_TEST_BASIC.md`, and `docs/rea-bartender-workflow.md`.
- Read installed Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`; traced the zoom path and wrote the failing anchor regression before implementation.
- Read REA `README.md`, reverse-engineer-anything skill, native/managed artifact reference, and the `inspect_managed_artifact`, `inspect_managed_members`, and `inspect_analysis_view` MCP schemas.
- REA checkout origin: `https://github.com/morluto/rea.git`; revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.

## Artifact evidence and native limitation

- Installed target: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; REA retained identity evidence `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`. It is mixed C++/CLI x64.
- Candidate UI assembly: `D:/Programs/BtSystem.UI.dll`, SHA-256 `cd26374bcb3f75747ae8cb699fbdad7eacc4b990191918e2692baf697ba6caaa`.
- REA `inspect_managed_artifact` evidence `ev_fd870815b4c5cb7fa87569ec052856996ec015586a396161d3ee265def9bfadd`; `inspect_managed_members` evidence `ev_6e234be78ed12fac6a09b7e80f3f52d95ce8f21e649837c11e7f0e5d4a582c41`; type page `ev_edce1124dadcd16f2ae892683246a5be27b8bead87a443e831c99f63dcf73b53` enumerates 39 types. The UI assembly contains server/database/message UI types, with no canvas/selection/zoom type match. Its 302 method inventory does not identify the native canvas implementation.
- Native behavior unknown: the available REA evidence does not identify the BarTender control, method, or runtime motion of selection handles and toolbar during zoom. No native parity claim is made.

## Root cause and implementation mapping

- Q LABEL `setPreviewZoom` animates `previewZoom` with `requestAnimationFrame`. Each frame calls `applyPreviewZoom`, which previously read `getBoundingClientRect()` for the paper and frame, then wrote canvas dimensions and transform. These layout reads forced synchronous layout on every animation frame and could interrupt the selected object's attached SVG chrome.
- `gui/preview-navigation.js` now captures the zoom anchor ratios once when a zoom input arrives, and maps them to the next frame's canvas size and margin. `applyPreviewZoom` no longer reads layout geometry during the animation loop.
- Inventory case: `test/preview-navigation.test.js` checks anchor ratios and resulting offset from captured geometry.

## Verification

- RED: `node --test test/preview-navigation.test.js` failed because `captureZoomAnchor` was not present.
- GREEN: `node --test test/preview-navigation.test.js` passed 3/3.
- Whole-system `npm run test:basic`: 937 passed, 0 failed, 0 skipped; legacy `test/data-sources.js`, `test/print-job.js`, and `test/smoke.js` all passed. Report: `test/basic-unit-result.json`; detailed assertions: `test/basic-unit-output.log`.
- No Electron animation timing or frame pacing test was run; visual smoothness still needs runtime confirmation. No BarTender native interaction evidence is available.
- App version incremented to v1.114 (`package.json` and both package-lock root values `1.0.114`; `displayVersion` `1.114`).
