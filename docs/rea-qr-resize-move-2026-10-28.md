# QR resize and move investigation — 2026-10-28

## Scope and native evidence

The user reports that the QR artwork and selection frame diverge after resizing, and that moving the object restores a smaller size. The requested behavior is that the size and selection remain aligned through resize and move.

Read the project AGENTS, basic test checklist, BarTender workflow, REA README, MCP contracts, REA native/artifact skill, and Superpowers using-superpowers, systematic-debugging, TDD and verification-before-completion. REA checkout upstream is `https://github.com/morluto/rea.git`, revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`.

`D:/Programs/BarTend.exe` SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`. `D:/Programs/BarCode_QRCode.dll` SHA-256: `dc0328a4e520f1a08d37a5b2ae9dcdc58c12c7957542500fa759991828903eed`. Live MCP tool catalog and `open_binary` / `search_strings` input schemas inspected. REA 6.7.0 with Ghidra 12.1.4 searched the installed QR DLL for `GenerateQRCode`: evidence `ev_fd242eb81833514e568c6ea9cfc6cab6ba6b4822661e00c85bb1c7cbe1667e61`, address `0x18000ac19`. This identifies an encoder feature but does not recover BarTender's resize or move implementation. The installed mixed native/CLR application's interaction semantics remain unverified; the implementation follows the user's stated behavior, not a claim of native parity. The REA session was closed without modifying artifacts.

## Q LABEL analysis and verification

In `gui/renderer.js`, unshifted QR edge drags produced a nonsquare proposed box, but `applyElementBox` chose the shorter dimension for `width_mm`. Expanding an edge therefore left the saved size unchanged. QR gestures now pass the square aspect ratio to `boxFromAnchor`, so the preview and the width recorded in the model share the same geometry.

`node --test test/qr-preview.test.js`: 3 passed; the new east-edge test first failed with width 20 instead of 30, then passed after the change. It also checks shared live transform and retained width after a move.

`electron test/qr-resize-move-runtime.js`: isolated Chromium fixture PASS for empty QR and catalog QR bitmap objects with southeast, northwest and east handles, checking actual QR artwork bounds against the selection rectangle during the gesture, after pointerup, and after moving. The fixture runs the production gesture and QR renderer with mocked surrounding editor controls. An earlier attempt to start the complete application in isolated appData timed out during startup; it is not counted as a full-app pass. Physical print output, all QR variants, and native BarTender pointer behavior were not verified.

Full basic suite: `npm run test:basic` PASS at display v1.261, 1,275/1,275 tests across 169 files, 0 failed and 0 skipped, 3/3 legacy stages passed, 0 undocumented files. Report timestamp 2026-10-28T03:01:15.222Z; snapshot `test-results/qr-resize-basic-result.json` and log `test-results/qr-resize-basic-output.log`.
