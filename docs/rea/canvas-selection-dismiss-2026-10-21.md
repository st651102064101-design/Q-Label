# Canvas selection dismissal — 2026-10-21

## Process applied

- Read project `AGENTS.md`, `UNIT_TEST_BASIC.md`, and `docs/rea-bartender-workflow.md`.
- Read installed Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development` skills. Followed root-cause tracing and wrote the behavioral regression test before renderer edits.
- Read REA `README.md`, installed reverse-engineer-anything skill and native/managed artifact reference. Checkout origin: `https://github.com/morluto/rea.git`; revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Read managed artifact/member contract sections from `rea/docs/mcp-contracts.md`; inspected live REA catalog and schemas for `inspect_managed_artifact` and `inspect_managed_members`.

## REA and artifact evidence

- MCP operation: `inspect_managed_artifact({path:"D:/Programs/BarTend.exe",detail:"summary"})`; evidence `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`, MVID `ca045b3f-f077-4eb2-959f-78487b4d60d1`. Result identifies x64 mixed C++/CLI with complete metadata.
- Feature probe: `inspect_managed_members({path:"D:/Programs/BarTend.exe",detail:"summary",type_names:["BarTender"]})`; evidence `ev_38d0bf3319aab3c46a91e9d8d81fd43010bbae59b9eb88ea88ae65e2d61fb23c`. This returned assembly-wide member-ref inventory and reported selected declaring type coverage; the supplied `BarTender` name did not establish the editor control/event implementation. No matching Escape/selection handler evidence was recovered.
- Related installed artifacts identified in `D:/Programs/`: `BtSystem.UI.dll`, `BtSystem.Client.dll`, and `BtEnu.dll` are candidate UI/resource assemblies. No feature-matched member analysis of these assemblies was available in this turn. REA MCP static managed tools cannot execute UI. The native interaction remains unknown; no BarTender parity claim is made.
- Blocker/limitation: the selected native control and its Escape/outside-click behavior remain unsupported by the available feature evidence. `BarTend.exe` is mixed native/managed, and identity/member inventories alone do not establish UI behavior.

## Root cause and mapping

- Q LABEL inline text editing creates `#canvasTextEditor` and stops keydown propagation. Escape cancels the editor, but the selected canvas object was not cleared on the editor's cancellation route, so its selection chrome remained.
- Mapped change: the inline editor Escape branch now clears editor selection after blur cleanup. This retains existing cancel semantics (restore original value) and lets outside-click blur finish editing normally.

## Verification

- `node --test test/canvas-text-selection-dismiss.test.js`: 2 passed, 0 failed.
- `npm run test:basic`: 935 unit tests passed; 0 failed, 0 skipped; `test/data-sources.js`, `test/print-job.js`, and `test/smoke.js` passed. Detailed output: `test/basic-unit-output.log`; summary: `test/basic-unit-result.json`.
- Not run: Electron `test/canvas-text-caret-runtime.js`; this task changed focus/selection behavior but that existing runtime only asserts caret geometry and cancel text restoration. Native Electron focus ordering is therefore not verified here.
- Release metadata: package remains at v1.113 because `package.json`, `package-lock.json`, and `CHANGELOG.md` contain pre-existing uncommitted changes; this task did not alter those files.
