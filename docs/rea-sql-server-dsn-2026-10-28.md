# SQL Server / Azure SQL DSN — partial implementation

Date: 2026-10-28. The user asked to begin enabling the previously listed unavailable database sources. This change begins with SQL Server and Azure SQL, using the existing Windows ODBC DSN transport. It does not complete the other requested providers or claim native BarTender flow parity.

## Evidence and workflow

- Read project `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, `../rea/README.md`, `../rea/docs/mcp-contracts.md`, REA native/artifact instructions and Superpowers using-superpowers, executing-plans, test-driven-development and verification-before-completion. The existing plan is `docs/superpowers/plans/2026-10-21-database-wizard.md`; this task is a staged partial implementation.
- REA checkout `https://github.com/morluto/rea.git` revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`; connected `rea-agents` version 6.7.0. Live MCP catalog/schema checked for `import_evidence_bundle` and `inspect_analysis_view`; imported `D:/QLabel-agent-work/rea-database-20261021/database-investigation.json`, and inspected retained wizard evidence `ev_cddda1e18cf409b4f557ad6a324f0b2a47da8158af4ff922bcb98ef0e6b38937` (view `ev_709423cc5415bf9a34b909f860375134eae7e86e1fbbdc2caacfa2eb604369f5`). This matches `DbConnectionTypePageViewModel` and `DbConnectionWizardViewModel`, with no unmatched type names. The retained provider analysis in `native-flows/provider-findings.json` identifies the native `SqlServer` connection enum. Native server authentication and downstream page behavior were not observed; generic ODBC is an application implementation choice, not established native parity.
- Verified installed artifact SHA-256 values against `D:/QLabel-agent-work/rea-database-20261021/REVIEW.md`: `BarTend.exe` `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`, `Seagull.Data.Configuration.dll` `58a455d3e46cbbfbcd71c0ce0a1ac6d9a87e66297d67fbacfd964bf75ab4cf56`, `Seagull.Data.Core.dll` `8b0cd26a076aa21e543236f4f401c7f7370fb1166fe8c06116b37cc247180e80`, `Seagull.Data.dll` `490ef61e672e694bed3fbd110ca8eb9cff73faf50e0a079dc06e27a62467e2e3`.
- The host has SQL Server ODBC drivers; no controlled SQL Server or Azure SQL endpoint/account was supplied. The installed Windows driver list is environmental observation, not REA evidence.

## Mapping and limits

- `lib/database/provider-registry.js`: detects SQL Server drivers, filters user/system DSNs, and routes both types through existing ODBC schema/read/refresh.
- `gui/database-native-flow.js`, `gui/database-setup.js`, `gui/database-ipc.js`: expose a SQL-specific DSN choice, support File DSN and pass configuration to the provider. Password is kept out of the saved document.
- Existing ODBC reader enumerates and reads tables, with limits of 64 tables and 10,000 rows. It does not provide a native SQL Server wizard or server/database configuration. `gui/database-manager.js` asks again for a password on refresh when one was used at setup; cancellation preserves existing data, and credentials are not serialized.
- Server connection and actual SQL/Azure authentication, cloud services, the remaining server types, SAP IDoc, imported connection formats and Excel Online are not implemented or verified by this step. No physical printer used.

## Verification

- RED: the two new SQL DSN unit cases failed before implementation: SQL types were unavailable and their form was incorrectly OLE DB.
- Targeted `node --test test/database-file-provider.test.js test/database-native-flow.test.js test/database-ipc.test.js test/database-setup.test.js test/database-manager.test.js`: 88 passed, 0 failed, 0 skipped. New SQL-specific provider/IPC/UI responses use mocks.
- `node_modules/.bin/electron.cmd test/database-windows-runtime.js`: PASS for the existing ODBC File DSN using a real local text driver, through wizard/record refresh. This is shared transport evidence only, not SQL Server/Azure SQL integration. A GPU shutdown warning appeared.
- `npm run test:basic`: PASS at display v1.264; 1,286 tests across 169 files, 0 failed/0 skipped, no undocumented files, and all three legacy stages passed. Report `test/basic-unit-result.json`, timestamp `2026-10-28T03:25:25.335Z`.
