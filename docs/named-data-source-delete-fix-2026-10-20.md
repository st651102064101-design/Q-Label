# Named Data Source delete fix — 2026-10-20

## Finding and implementation

The earlier audit reproduced a stale source after deleting its entry from `data_sources`: `SourceModel.reconcileInPlace` retained the legacy definition and object references, so the resolver continued showing `OLD` and the Named Data Source picker continued listing the name.

`gui/source-model.js` now treats `data_sources` as the authority for legacy definitions during reconciliation. When a legacy source has been removed, reconciliation removes its definition and named aliases, removes those IDs from all active and cached object source lists, removes matching `{{name}}` placeholders from object text, and clears corresponding `values` keys. It keeps other embedded parts in composite text. This is reached by the existing editor `touchEditor` call used after removal from either the sidebar context menu or source dialog.

## REA and native evidence

- Reused matching retained REA evidence from the audit; did not repeat identical managed metadata analysis.
- REA version: 6.7.0; operation: `inspect_managed_members`; provider: `rea-dotnet-static` v1.
- Selected native metadata types: `BarTender.Managed.ConditionalPrinting.DelegateShowNamedDataSources` and `BarTender.Managed.DataSourceItem`.
- Evidence ID: `ev_ebd1f3cd14e6a87b05f4db7cda726826a50570a9f745c3559576686a26eecf5a`.
- Evidence output: `D:/QLabel-agent-work/rea-20261020/named-data-source-evidence.json`.
- Artifact: `C:/Windows/Microsoft.NET/assembly/GAC_64/BarTender.Managed/v4.0_12.1.0.1__109ff779a1b4cbc7/BarTender.Managed.dll`, SHA-256 `f32a25aee51846c2a33fcaa20f42dd23eee38554b2c172608efb3ce0fd12f389` (hash rechecked for this task).
- App artifact identity retained from matching REA inspection: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` (hash rechecked for this task).
- Native finding: metadata exposes a delegate hook for showing named data sources. Static metadata does not establish how BarTender handles deleting a source with dependent objects. No native dialog interaction was performed. The deletion policy and exact native UI remain unknown.

The stale-value reproduction and implementation mapping above are source-code/unit-test evidence, not REA evidence. The fix chooses to remove the deleted value from dependent objects while preserving their other text segments; this application behavior is not claimed as verified BarTender parity.

## Verification

- Regression test was first run against the unfixed implementation and failed because `values.Lot` still equaled `OLD` after reconciliation.
- After the fix, `node --test test/source-model.test.js`: 16 passed, 0 failed, 0 skipped. Covers removal from multiple objects, aliases, resolver output, placeholder cleanup, remaining text and dropdown source names, pending direct text edits and page caches.
- `npx electron test/named-source-delete-runtime.js`: passed actual sidebar context Delete and dialog Delete handlers in an isolated application profile, asserting removal from sidebar and registry, cleared cached value and empty object output. Persistence/confirmation were stubbed; no user document or print transport was used. The dialog Delete handler now refreshes the sidebar and value controls immediately.
- Full required `npm run test:basic`: exit 0; 812 passed, 0 failed/cancelled/skipped, all three legacy basic scripts passed. Report: `test/basic-unit-result.json`; assertions: `test/basic-unit-output.log`.
- No print job or native BarTender UI interaction was performed.
