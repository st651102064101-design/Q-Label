# REA investigation flow audit — 2026-10-20

## Verdict

The earlier workflow was partial, not complete native reconstruction. Recent application fixes used source and Electron tests under the user's explicit authorization, with native gaps recorded. Repeating artifact identities, empty searches, or adjacent type matches did not complete the inspect/trace→read→follow-up stages. All recent Q LABEL test results remain app-side evidence, not proof of BarTender parity.

This audit fixes usable tooling/routing and follow-up tracking. It does not claim every native feature blocker is resolved. No Q LABEL native behavior is reconstructed or changed by this tooling/documentation task, so application version stays1.073.

## Findings and fixes

| Finding | Evidence | Action/status |
|---|---|---|
| Connected REA MCP has stale environment | open_binary BarTend.exe with ghidra reports GHIDRA_INSTALL_DIR null, JAVA_HOME null, nonabsolute java.exe failure | Fresh CLI launched with current installed paths; project script scripts/rea-local.ps1 now provides this route. Current Codex MCP still needs reconnect/restart to inherit config; user's application was preserved. |
| Shell inherited JDK17 | First wrapper scoped doctor selected17.0.20.1 and reported config_drift | Launcher explicitly selects installed64-bit JDK21.0.12.1 and Ghidra12.1.4; scoped Codex/Ghidra doctor now healthy:true. Environment is restored after invocation; no global configuration overwritten. |
| Previous native provider claims were too broad | Existing Ghidra supports native DLLs despite rejecting this mixed EXE | Successfully traced BtEnu.dll with Ghidra12.1.4; two actual feature-string matches. Native analysis is usable within its supported boundary. |
| No residual unknowns in current REA ledger | list_unknowns returned total0 despite repeated report gaps | Recorded native UI unknown unk_ee7a9193ec656ca26d9b52d869bc788bc906e2a2c8f4dccb6606a1a547cd8631 with evidence links and next probes; exported durable bundle. |
| Mixed C++/CLI target not admitted | rea/src/ghidra/GhidraProvider.ts Windows P0 returns managed_target_unsupported; explicit open_binary confirms | Still unresolved for BarTend.exe; native DLL/resource or smaller managed assembly routes are required. Did not falsify target classification. |
| Managed representation bound | rea/src/dotnet/ManagedDecodeBudget.ts hardcodes64MiB; retained ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9 | Still unresolved for whole EXE member enumeration. It is not a missing-Java problem. Did not silently raise the bound or describe producer paging as a fix for a failed decode. |
| REA native UI observation does not support Windows | Prior task diagnostics and installed native/provider reference | Native interaction parity remains unverified; no new UI observation was performed. Source/runtime tests remain explicitly separate. |

## Target identity and concrete evidence

- REA upstream https://github.com/morluto/rea.git, checkout dfe8378cf5a727e3d93d47a5986233175c6ef898, pinned package6.7.0. Ghidra12.1.4, JDK21.0.12.1, Node24.19.0.
- D:/Programs/BarTend.exe SHA2560414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3, mixed CLR/native x86_64.
- D:/Programs/BtEnu.dll SHA256c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b. Installed BarTender English resource DLL; this relationship is established by the shipped file location/name and feature-matched strings, not an assertion that it implements application code.
- Connected inspect_pe_resources returned ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887:1468resources,2950examined entries, complete bounded inventory; dialog/string/icon resource kinds observed, payloads opaque.
- Fresh CLI trace: `rea trace D:/Programs/BtEnu.dll --query "Symbology and Size" --provider ghidra --format json`. Evidence ev_e7ef3f8a13fa472cbdeb86924a42c31db52c5bdc53f5fed8a941f1b65ff76b07. Matches0x1036e080 (page label) and0x10373732 (help text describing standard-size lock, Properties→Symbology and Size→X Dimension→uncheck Lock). References empty, truncated:false. This recovers actual native resource text and a documented configuration path; it does not establish resize/caret/modal code or runtime timing. Target-sourced text was treated as data only, never executed as instructions.

## Saved outputs

- D:/QLabel-agent-work/rea-flow-scoped-doctor-20261020.json — final healthy:true scoped result.
- D:/QLabel-agent-work/rea-flow-doctor-20261020.json — broad audit; unrelated missing engines do not make selected Ghidra unavailable.
- D:/QLabel-agent-work/rea-flow-native-trace-20261020.json — canonical CLI feature trace.
- D:/QLabel-agent-work/rea-flow-audit-evidence-20261020.json — MCP export,6records+1unknown,3952173bytes. Retain/import this bundle when creating a fresh REA connection; do not assume an in-memory ledger survives reconnection.

## Practical workflow now

Ask a concrete native question→check artifact scope/hash→use connected MCP where supported→if current connection has stale provider environment, invoke ./scripts/rea-local.ps1 with documented arguments→inspect exact feature evidence and limitations→record unresolved question/next probe→map only supported observations to implementation→test Q LABEL behavior separately. Previously authorized source fallback remains available but must never be labeled confirmed native parity.

No additional providers were installed, no binary or REA source checkout was patched, and the user's app/documents were left open. The initial direct dist/cli.js invocation was a no-op module entry and produced an empty file; it was corrected to the package's declared scripts/rea.mjs executable before any readiness conclusion. Launcher smoke testing also found/fixed multiple Node path resolution and inherited-JDK selection. Only the final declared-bin/scoped results are treated as passing.

Final verification: scoped launcher doctor healthy:true; caller JAVA_HOME/GHIDRA_INSTALL_DIR restored. npm run test:basic 841 passed, 0 failed, 0 skipped, all legacy stages passed, inventory complete. Report test/basic-unit-result.json (app version1.073, unchanged). git diff --check passed.
