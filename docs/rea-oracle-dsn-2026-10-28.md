# Oracle ODBC DSN — partial implementation

Date: 2026-10-28. User requested continuation of database provider implementation. This enables Oracle through the existing Windows ODBC DSN transport where an Oracle ODBC driver is installed.

## REA evidence and scope

- Applied REA and Superpowers using-superpowers and test-driven-development. Read project `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA README, native-artifact skill reference and `mcp-contracts.md`. REA checkout upstream `https://github.com/morluto/rea.git`, revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`; connected package `rea-agents` 6.7.0.
- Inspected live MCP catalog/schema and imported `D:/QLabel-agent-work/rea-database-20261021/native-flows/rea-database-provider-evidence.json` with `import_evidence_bundle`. Used `inspect_analysis_view` on `ev_645f49f94034d4cedeb8d06660de433982e7bddbbf16cacead5dc5da2e326b01`, managed-members fields page, view `ev_27fc561c30e8d6f4ed4a4c1ad41a430222cbf438c1247b5b34cb7d86c1a0b948`. Matching retained evidence identifies Oracle as a `Seagull.Data.Core.ConnectionType`; it does not establish Oracle's native configuration flow or driver requirements.
- Verified hashes: `D:/Programs/BarTend.exe` `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; `D:/Programs/Seagull.Data.Core.dll` `8b0cd26a076aa21e543236f4f401c7f7370fb1166fe8c06116b37cc247180e80`; `D:/Programs/Seagull.Data.dll` `490ef61e672e694bed3fbd110ca8eb9cff73faf50e0a079dc06e27a62467e2e3`. They match the retained provider investigation in `D:/QLabel-agent-work/rea-database-20261021/REVIEW.md`.
- The host's 64-bit ODBC driver enumeration contains no Oracle driver; no controlled Oracle database was available. An installed Oracle managed DLL in the BarTender directory is not an application dependency. Native wizard parity and Oracle driver/server integration remain unknown.

## Mapping and verification

- `lib/database/provider-registry.js` detects Oracle-named ODBC drivers and DSNs and routes Oracle to the existing ODBC adapter. `gui/database-native-flow.js`, `gui/database-setup.js` and `gui/database-ipc.js` provide the Oracle DSN flow and File DSN selection. The existing manager prompts for a password again on refresh, rather than serializing it.
- RED: new Oracle provider and form assertions failed before implementation because Oracle was unavailable and displayed the OLE DB form.
- `node --test test/database-file-provider.test.js test/database-native-flow.test.js test/database-ipc.test.js test/database-setup.test.js test/database-manager.test.js`: 90 passed, 0 failed, 0 skipped; Oracle responses are mocked. Existing shared ODBC runtime was previously verified against a local text driver, not Oracle.
- `npm run test:basic`: PASS, 1,296/1,296 tests across 169 files, 0 failed or skipped, no undocumented files, all three legacy checks passed. Report `test/basic-unit-result.json` at `2026-10-28T03:39:08.427Z`, display v1.267.
- Oracle-specific tables/schema, authentication, refresh and actual driver compatibility require an Oracle test server and driver; no full native parity is claimed. Other requested providers remain incomplete.
