# Recent projects list view — 2026-10-29

User requested switching between grid and a row layout like the provided reference. Applied Superpowers using-superpowers, brainstorming (reference and existing grid define the scoped UI), TDD and verification-before-completion. Read project gate, unit policy, REA README, native/artifacts reference, MCP contracts and workflow; inspected live MCP schemas.

REA checkout https://github.com/morluto/rea.git revision 9341b116efddefc2bcdd8208d27d6e4ea78cc507. Connected Ghidra 12.1.4, open_binary/search_strings/close_binary on D:/Programs/BtEnu.dll SHA-256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b. D:/Programs/BarTend.exe SHA-256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3. Query `recent`, evidence ev_fd97ee78b10fd76c305168d07e2430465a1c87fe5b3a06bd11e2134d0dccc3ea, finds `Recent File` resources; it does not establish native list layout or switching behavior. The supplied screenshot is a UI reference, not REA evidence; no native BarTender parity is claimed.

gui/project-home.js adds accessible grid/list toggle to Recent projects and persists its choice via localStorage when available. List reuses existing cards and their open/context/delete actions, shows thumbnail/name/size and available last-opened date, and handles absent dates with —. This is not a file modified timestamp; the application currently exposes access timestamps. Existing all-labels grid is unchanged.

TDD: test/project-home.test.js switch test failed before controls existed, then 8/8 passed after implementation. Isolated Electron test/project-home-preview-chromium-runtime.js passed, including actual rendered row geometry, grid restoration and preview artwork. Full suite result recorded when complete.

Full basic suite run-start v1.300: FAIL, 1370/1379 passed, 9 failed, 0 skipped; log tmp/home-view-basic.log. Concurrent suites may overwrite the shared report.
