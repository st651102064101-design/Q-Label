# Recent projects default list — 2026-10-29

The user explicitly chose list as the default; an explicitly saved grid preference remains effective. Applied Superpowers using-superpowers, TDD and verification-before-completion; read project AGENTS, unit policy, REA README, native/artifacts reference, operation contract and workflow, and inspected connected tool schemas.

REA checkout https://github.com/morluto/rea.git revision 9341b116efddefc2bcdd8208d27d6e4ea78cc507. Rechecked D:/Programs/BarTend.exe SHA-256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3 and BtEnu.dll SHA-256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b. Connected Ghidra 12.1.4 search_strings `Recent File`, ev_96ce8a768bcf766826571c6ff0b48c7ac11430185b4012f426549a70087ccb98, identifies recent-file resources but does not establish native default view. This change follows the user request without claiming native default parity.

gui/project-home.js selects list when no supported preference is stored or storage is unavailable; stored grid remains grid. RED observed on previous default-grid implementation. `node --test test/project-home.test.js` passed 8/8; isolated Electron `test/project-home-preview-chromium-runtime.js` passed default list, row geometry, grid switch and preview. Full suite result follows.

Full basic suite run-start v1.301: FAIL, 1371/1380 passed, 9 failed, 0 skipped; log tmp/home-default-basic.log.
