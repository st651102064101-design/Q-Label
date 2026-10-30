# Unsaved close while minimized — 2026-10-28

Applied Superpowers systematic debugging and TDD; read the project REA gate, basic checklist, REA skill, README and MCP contracts. REA connected Ghidra 12.1.4, BtEnu.dll SHA-256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b, search_strings `Save changes to document`: evidence ev_d27ecb08fa46ddb22a48f0a1d27f10ba98fc8b0934df889a325f1b97b2b9228c. BarTend.exe identity SHA-256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3 (previous verified analysis). This resource establishes the save question, not native minimized-window mechanics; the implementation follows the user's explicit requested behavior without claiming native implementation parity.

Q LABEL close handler previously sent the close request to the renderer while minimized, where the HTML dialog remained hidden. For a dirty document the renderer now asks the main process to restore/show/focus the sender before displaying the existing Save/Don’t Save/Cancel prompt; clean close does not restore. Focused node tests passed 9/9. Runtime script was attempted but Electron exited with no PASS output; actual minimized taskbar flow remains unverified.

Full verification: `npm run test:basic` PASS v1.278, 1,340 tests, 0 failed, 0 skipped; all three legacy stages passed. Report: `test/basic-unit-result.json`.
