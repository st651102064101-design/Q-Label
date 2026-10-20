# Object Properties bottom bar removal — 2026-10-20

## Requested behavior

The user pointed to the bottom action strip in the Object Properties window and
asked to remove the strip entirely. Keep the existing header X as the close
control. Closing still commits the latest valid live edit.

## REA artifact inspection

- Upstream: `https://github.com/morluto/rea.git`
- Tool: REA CLI 6.7.0, package `rea-agents@6.7.0`.
- Command: `rea inspect-managed-artifact D:/Programs/BarTend.exe --format json --full-output`.
- Evidence ID: `ev_09162d3c5968fc4fd8cc4ee7e52c1ae2bc21a79266ab6a2451cd942a1500ed2b`.
- Full result: `D:/QLabel-agent-work/rea-20261020/properties-footer-native-artifact.json`.
- Native artifact: `D:/Programs/BarTend.exe`, SHA-256
  `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`, PE
  x86_64, mixed CLR/native C++/CLI.
- Observation: REA confirms the exact target artifact and its managed deployment
  metadata. This operation did not load or execute BarTender and does not provide
  dialog layout or footer behavior. No matching retained REA evidence for this
  specific footer was available, and the current shell has no configured native
  decompilation provider.

## Implementation mapping and verification

- User screenshot: visual reference for the strip to remove; it is not native
  artifact evidence.
- Source inspection: `gui/object-properties.js` created a `<footer>` with a
  duplicate Close button and separately wired that button and the header X to the
  same live-commit close handler. The footer and its layout rules are removed;
  the header X remains wired to that handler.
- Unit behavior: `test/object-properties-pages.test.js` verifies no footer, a
  working header X, and preservation of the most recent valid edit.
- Electron runtime: `test/properties-layout-runtime.js` exercises normal,
  resized, maximized, and restored layouts; it checks that the footer is absent,
  content remains inside the dialog, and the header X remains clickable.
  `test/object-properties-tree-runtime.js` also checks the no-footer state and
  close behavior with an isolated appData profile.
- Full-system verification: `npm run test:basic` passed 810 unit tests, with 0
  failures and 0 skips; all three legacy basic scripts passed. Result report:
  `test/basic-unit-result.json`.
- Focused DOM verification: 59 tests across Properties pages, Data Sources,
  Properties navigation, and SVG Properties passed.
- Electron verification: `node_modules/.bin/electron.cmd
  test/properties-layout-runtime.js` passed normal, resized, maximized, and
  restored states; `test/object-properties-tree-runtime.js` passed the tree,
  live edit, and close checks; `test/modal-free-resize-runtime.js` passed actual
  width/height drag and verified the bottom bar is absent while the header X,
  navigation, and source field remain available. These use isolated appData and
  send no print jobs.
- `git diff --check` passed.
- Unknown: exact native BarTender footer behavior is not established by the
  static REA evidence. This is a scoped UX change requested by the user, not a
  claim of native footer parity.
