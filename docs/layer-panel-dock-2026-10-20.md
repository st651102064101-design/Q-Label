# Layers docking — v1.055

The user reports Layers covering underlying controls. Root cause: the panel was appended to body with fixed right/top/bottom coordinates and z-index 2000, reserving no workspace width.

The panel now lives in `.main` as a nonshrinking flex sibling of the preview. Its relative positioning reserves up to 280px/35vw plus margins. The top margin/height follows the existing `--visible-navbar-height` variable so the panel remains below the Ribbon. The list scrolls within the panel; hiding it removes it from layout and restores preview width. Layer selection/reordering/lock/hide callbacks are unchanged.

Verification: the DOM regression failed before implementation because the panel parent was body, then passed after docking. Full-app isolated Electron `npx electron test/layer-panel-runtime.js` passed 1200×800 and 900×650: preview right edges 904/604, panel left 912/612, Zoom right 878/578; closing restored preview width to 1200/900. An added Ribbon-boundary assertion failed before the top-offset correction and passed afterward. No physical printing or user-document modification.

This is a user-requested layout fix, not a native BarTender reconstruction. Retained REA artifact context is recorded in `context-format-rows-2026-10-20.md` (DataSource metadata, evidence `ev_23dd65815d68604f61f15988127ae13383b7afd3217661350ec485a44d674617`, BarTend.exe SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`); that evidence does not establish native Layers docking. Native layout parity is unverified.

Full npm run test:basic: 817 passed, 0 failed/skipped/cancelled; all three legacy stages passed. Report: test/basic-unit-result.json; assertions: test/basic-unit-output.log.
