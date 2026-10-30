# Properties tree single/all views — v1.074 — 2026-10-20

## Request and bounded design

User supplied native screenshots and requested selected-only vs full object list. Add two SVG toggle buttons above the scrolling Properties tree: Show selected object / Show all objects. Start with existing all-objects view; filter by active Properties object in single mode; retain selected page/source tab/edits and keep the mode during the app session, including reopening Properties for another object. Bottom source toolbar stays independent of the scroll area. This does not add bulk property editing of multiple objects.

Applied Superpowers using-superpowers, brainstorming (bounded design stated in chat based on supplied intent), TDD (new toggle test failed before code, passed after), verification-before-completion. Read project AGENTS/basic checklist, REA README/skill/native reference, MCP contracts and required BarTender workflow.

## Native investigation and exact limits

Checked live open_binary/trace_feature schemas/catalog. The connected MCP provider has the previously verified stale environment, and Windows Ghidra rejects the mixed C++/CLI main executable. Used documented fresh CLI ./scripts/rea-local.ps1 with installed Ghidra12.1.4, JDK21 and pinned REA6.7.0. REA checkout https://github.com/morluto/rea.git revision dfe8378cf5a727e3d93d47a5986233175c6ef898 preserved.

Checked artifact hashes:
- D:/Programs/BarTend.exe:0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.
- Installed English UI resource DLL D:/Programs/BtEnu.dll:c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b.

Feature-directed native Ghidra traces:
- All Objects, ev_35bf51d8c0732baf44c6727de7d9286c4c8f3d86a532adff192cde420996a283. Exact resource label at0x10371e18; other hits are canvas zoom/select commands and are not used as proof of this toolbar.
- Selected Object, ev_375dcd6c8f87f51e107cf6ab1c2873722cd78091e9d98feca1325df85801c8f1. Exact Selected Object at0x1036df3e and Multiple Selected Objects at0x1036df5e. Other hits describe unrelated canvas commands and are excluded from behavioral inference.
- Both traces have empty references, truncated:false. This recovers native terminology but does not identify toolbar command IDs, exact click policy or persistence. Supplied screenshots are separate visual references. Implementation follows requested Q LABEL behavior under the user's existing source-fallback authorization; complete native parity remains unknown.

Canonical CLI outputs:
D:/QLabel-agent-work/rea-properties-tree-modes-20261020.json
D:/QLabel-agent-work/rea-properties-tree-single-20261020.json

## Mapping and verification

gui/object-properties.js now filters tree roots by treeViewMode/current index and renders a fixed top toolbar with decorative SVG, accessible names, tooltips and aria-pressed state. Mode lives in the Properties controller closure; existing source-editor state and draft continue through normal render/dispose paths.

node --test test/object-properties-pages.test.js:17passed, including absence of other-object controls in single view, edit retention and reopen mode. Electron test/properties-tree-view-runtime.js passed actual mixed text/barcode/picture roots, source text persistence, Transforms tab retention, canvas selection, reopening for another object and toolbar placement at normal and900x650 windows. Runtime fixture was corrected to provide valid unique object labels (otherwise existing name validation correctly blocked commit). Uses isolated appData and no printing.

Final npm run test:basic: 842 passed, 0 failed, 0 skipped; all legacy stages passed; inventory complete. Report test/basic-unit-result.json v1.074. Existing Electron object-properties-tree-runtime passed connector geometry, selection and live edits. git diff --check passed.
