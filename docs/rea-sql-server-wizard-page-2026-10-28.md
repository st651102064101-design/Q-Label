# REA evidence — SQL Server Database Setup wizard page

Date: 2026-10-28

## Scope

User reference: BarTender **Database Setup Wizard → Microsoft SQL Server Database** (server, authentication mode, credential storage, database name). Prior Q LABEL step used ODBC DSN picker on **Connect label data → File & table**.

## Skills / workflow

- Superpowers: `using-superpowers`
- REA gate: `docs/rea-bartender-workflow.md`, prior database icon evidence `docs/rea-database-icons-2026-10-21.md`
- Native artifact (identity): `D:/Programs/BarTend.exe` SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`, `Seagull.Data.Configuration.dll`

## Mapping

| BarTender (reference screenshot) | Q LABEL v1.270 |
|---|---|
| Database Setup Wizard title on connection pages | `Database Setup Wizard` header on SQL Server / Azure SQL step 2 |
| Server combo | Server field + datalist from `SqlDataSourceEnumerator` when available |
| Windows vs SQL authentication | Radio group; disables user/password when Windows |
| Store vs prompt credentials | Radio group; `promptCredentials` / `storeCredentials` in `providerOptions` |
| Database combo | Database field + datalist filled via `database-list-databases` IPC |
| Connect and read tables | ODBC direct string in `scripts/windows-database.ps1` when `config.server` set |

## Verification

- `test/database-native-flow.test.js`, `test/database-setup.test.js`, `test/database-file-provider.test.js`, `test/database-ipc.test.js` (mocked providers)
- Real SQL Server/Azure connectivity not run in CI; requires installed ODBC driver and reachable server.

## Unknowns

- Exact BarTender control order/access keys and Finish button enablement on partial server entry not REA-decompiled this task; matched user screenshots and field labels.
