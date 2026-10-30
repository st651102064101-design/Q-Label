# Typed object names — v1.071 — 2026-10-20

Latest user requirement explicitly supersedes v1.064 global object sequence: text1, barcode1, etc. count independently. Root cause: object-names.js hardcoded object prefix and normalizeDefaults actively converted typed defaults into global names on each refresh. Shared assign/assignMany/compact/normalize now derive kind. All barcode families and catalog images share barcode counter; text, pictures, SVG, table, shapes and symbols have their own kind. Legacy objectN migrates. Custom descriptive names and duplicate validation remain. New document seed is text1. Added persistent AGENTS policy overriding old history, without staging pre-existing unrelated policy/source changes.

Applied Superpowers using-superpowers, systematic-debugging, TDD (7 failures against old behavior before fix), verification-before-completion. Read project AGENTS/basic checklist, REA README/skill/native-artifact reference, retained Evidence contract and BarTender workflow. Checked live get_evidence_bundle schema/catalog and queried exact artifact SHA+inspect_managed_members: retained ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9 (REA managed static provider version1). It records the64MiB metadata representation limit; it cannot establish native naming algorithms. This is not naming feature evidence. User authorized source behavior changes under these limits. This implements the explicit requested naming policy, not claimed native parity.

D:/Programs/BarTend.exe SHA256 checked:0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3. REA checkout https://github.com/morluto/rea.git dfe8378cf5a727e3d93d47a5986233175c6ef898, package6.7.0.

Tests cover typed imports, refresh and JSON round trips5times, duplicate generated names, linear/QR/DataMatrix/catalog codes, shape/table/symbol classification, copy/paste, delete/reuse and duplicate-name alert. Numbered names matching their type are treated as generated conventions; descriptive custom labels are preserved.

Electron test/typed-object-names-runtime.js passed actual refresh, duplicate barcode3, delete/compact,5reload-data cycles, tree and canvas captions. test/object-properties-tree-runtime.js passed existing tree/selection/live-edit assertions with latest typed expectation. Both isolate appData and do not print.

Final npm run test:basic: 840 passed, 0 failed, 0 skipped. All legacy stages passed; inventory complete. Report test/basic-unit-result.json v1.071. git diff --check passed. Unit naming tests9passed.
