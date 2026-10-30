# Picture placeholder stroke — 2026-10-28

User reference: the picture placeholder has a thin outline during a resize gesture and a heavy outline while selected at rest. Requested Q LABEL behavior is the thin stroke in both states.

Read project AGENTS, UNIT_TEST_BASIC, BarTender workflow, REA README, native/artifact reference and MCP contract, and Superpowers using-superpowers, systematic-debugging, test-driven-development and verification-before-completion. REA checkout `https://github.com/morluto/rea.git`, revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`. Inspected live MCP catalog and schemas and queried the installed artifact using MCP `open_binary` and `search_strings`.

Artifact identities: `D:/Programs/BarTend.exe` SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; `D:/Programs/BtEnu.dll` SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`. Ghidra 12.1.4 / REA 6.7.0 query `Picture`, evidence `ev_e9fef34a7f62acb4d62515a387e0bd282d3cc0f1278d7213456042809031ddd3`, identifies picture object resources such as `Select Picture`, but does not recover native canvas placeholder strokes. Static resource text does not establish native line thickness or drag rendering. The target behavior here follows the user's Q LABEL screenshots; native pixel parity is not claimed. Closed the REA session.

Source diagnosis: Q LABEL's picture placeholder uses a size-relative SVG stroke; the live resize helper applies non-scaling-stroke to visible shapes only during drag, causing the resting stroke to expand with the canvas scale. `gui/preview.js` now sets the same non-scaling vector effect on the placeholder's frame, circle and mountain shapes. Existing geometry and stroke width are otherwise unchanged, so resize snapshots restore the same attributes.

`node --test test/bitmap-recovery.test.js test/svg-selection-handles.test.js`: 21 passed, 0 failed; the new test initially failed because the vector effect was absent. `electron test/picture-placeholder-stroke-runtime.js`: isolated Chromium fixture PASS; all three shapes have 1.21 px computed stroke and non-scaling vector effect before, during and after a resize transform. This fixture does not exercise the full running application or compare native BarTender pixels.

Full-app `electron test/picture-home-runtime.js` exited 1: Electron reported 'Script failed to execute' without exposing its underlying renderer exception, followed by a GPU command-buffer error. It is not counted as passed and does not establish the original screenshot behavior.

Full basic suite: npm run test:basic PASS, display v1.264, 1286/1286 tests across 169 files, 0 failed or skipped, all 3 legacy stages passed, 0 undocumented files. Report snapshot: test-results/picture-placeholder-stroke-basic-result.json (2026-10-28T03:24:54.847Z).
