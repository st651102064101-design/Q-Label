# Preview selection dismissal — 2026-10-27

## Scope

Clear Q LABEL's selected objects as soon as the user presses the primary mouse button on empty preview/workspace, so selection frames and floating tools disappear together. A click on an object or its controls and additive Shift/Ctrl/Meta marquee selection must continue to work.

## Applied workflow

- Read `labelforge/AGENTS.md`, `labelforge/UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, the REA README/contracts, the installed REA skill, and Superpowers `using-superpowers`, `brainstorming`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`.
- Connected REA MCP was available. The live catalog contained 207 tools; input schemas were checked for `binary_session`, `inspect_managed_artifact`, `inspect_managed_members`, `open_binary`, and `search_strings`.
- REA checkout: `https://github.com/morluto/rea.git`, revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`. Connected REA server/package: `rea-agents` 6.7.0. Ghidra provider: 12.1.4. The native session was closed after analysis.

## Installed BarTender artifacts and evidence

- Primary executable: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`. REA `inspect_managed_artifact` Evidence `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789` observes a mixed C++/CLI x86-64 PE and the same digest.
- REA `inspect_managed_members` Evidence `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d3` links to parent `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`, but reports `metadata.representation` unavailable at the 67,108,864-byte limit. It does not provide the managed mouse handler body.
- Related resource assembly: `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`. REA `open_binary` + `search_strings` Evidence `ev_981a27fd1ea5ad6013384e9e94d2cfcf2ff40b39b4330b8cf752738089dc6b41` finds “Select all objects in the design area / Select All” at `0x10336660`. This identifies the design-area selection feature, but does not itself prove blank-click semantics.
- The documented external metadata reader, `scripts/rea-alternatives/read-metadata.ps1`, matched `ObjectEditorView.OnLButtonDown` (`0x0600117b`, IL) and native `SelectionManager.DeselectAllObjects` (`0x06003397`, RVA 2,861,488), `DeselectObject`, and `SelectObjects`. Its records are at `D:/QLabel-agent-work/selection-cancel-20261027/selection-methods.json` and `object-editor-metadata.json`; identity is locked to the executable digest above. The body of `OnLButtonDown` remains unreadable through the admitted REA route.
- The documented external Ghidra section fallback mapped the exact `DeselectAllObjects` native RVA into the original `.text` bytes (`mapping.json`, SHA-256 `b7eb4cea2481dbfde750a011b41384364c35fba79857cdb2bb3c46d5b658f31b`) and decompiled its native body (`native-method.json`). The fallback covers only that method and section; imports/globals/managed callers remain unresolved. It does not establish which mouse branch invokes deselection.

## Implementation mapping

- `gui/canvas-selection-dismiss.js` classifies empty preview pointer-downs and leaves object/handle/control clicks and modifier-based marquee gestures alone.
- `gui/renderer.js` invokes the classifier in the preview frame's capture phase, then immediately clears the primary selection through the existing `selectElement(-1)` path. This also updates tool visibility and selection chrome before pointer-up arrives.
- The Q LABEL behavior is based on the user-requested interaction and the application's current selection model. The native artifact evidence is feature matched but partial; no claim is made that the BarTender native handler is fully reproduced.

## Verification

- TDD: the new unit file first failed because `gui/canvas-selection-dismiss.js` did not exist; it passed after the implementation.
- `node --test test/canvas-selection-dismiss.test.js`: 5/5 passed.
- `npx electron test/selection-clear-runtime.js`: passed with real Electron pointer events. Blank clicks clear selection immediately and hide selection tools; object clicks retain selection; Shift marquee retains the prior selection.
- `npm run test:basic`: 1,243/1,243 tests passed across 165 files; 0 failed/0 skipped; all three legacy stages passed and undocumented inventory gap 0. Report: `test/basic-unit-result.json` (2026-10-27T02:34:55.766Z).

## Remaining unknowns

- BarTender's C++/CLI `ObjectEditorView.OnLButtonDown` call behavior and exact hit-test boundaries were not reconstructed; the admitted managed-member route hit its representation limit and the native-only fallback cannot read the managed caller.
- No physical printer or native BarTender runtime interaction was needed for this selection-only Q LABEL fix.
