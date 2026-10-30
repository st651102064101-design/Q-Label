# Properties single-object default — 2026-10-22

User request: every new project starts with the first Properties tree button (Show selected object), rather than retaining Show all objects. Images describe the Properties tree toggle, not Items Per Page.

Read/applied project AGENTS, UNIT_TEST_BASIC, Superpowers using-superpowers/systematic-debugging/TDD/verification, REA installed skill, checkout README, native-and-artifacts reference, MCP contracts and project BarTender workflow. Existing code initialized `treeViewMode='all'` and new-project reset only reset grid. The fix initializes single and calls `resetObjectPropertiesView` from the existing successful-new-project reset hook.

REA checkout upstream https://github.com/morluto/rea.git, revision dfe8378cf5a727e3d93d47a5986233175c6ef898, connected package 6.7.0. Inspected live catalog and `inspect_pe_resources` schema (absolute path, default bounded budgets); called it for `D:/Programs/BtEnu.dll`. Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887`, artifact SHA-256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b. Starting EXE `D:/Programs/BarTend.exe` current SHA-256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.

Feature search of the REA-identified string resources for Show single/selected/all objects returned broad matches in blocks 14 and 303. Full external UTF-16 decoding showed these concern object grouping and multiple-object deletion, not this tree toolbar. They are rejected as unrelated evidence. Exact unsupported question: native Properties tree initial mode and mode persistence on new project. Static resource evidence does not establish these runtime values; no native parity is claimed. Implementation is the user's explicit Q LABEL default.

Mapping: `gui/object-properties.js` initializes single and exposes reset; `gui/renderer.js` calls reset in resetNewProjectView, already called only after successful createTemplate. Cancel/failure does not reset. `test/object-properties-pages.test.js` asserts default and reset, with multi-object cases explicitly selecting All. `test/new-project-runtime.js` exercises two successful creations after selecting All, and checks actual pressed state and one root after each.

Red: 2 targeted tests failed with old all default/missing reset. Green: all 26 Properties unit tests passed. Isolated Electron new-project runtime passed 39 checks, two created files, original fixture bytes unchanged; no printing. Full basic results recorded after completion in test/basic-unit-result.json and test/basic-unit-output.log.

Basic suite rerun completed at 2026-10-22T02:17:43.283Z (workspace v1.152): 997/997 unit tests passed, zero skipped/cancelled, all three legacy stages passed. The preceding 995/996 result caught an unrelated concurrent wizard footer expectation; the updated footer test passed independently and in this full rerun. Scoped git diff --check passed.
