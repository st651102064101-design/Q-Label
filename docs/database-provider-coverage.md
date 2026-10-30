# Database provider coverage — 2026-10-22

Native catalog evidence: D:/QLabel-agent-work/rea-database-20261021/REVIEW.md and exported REA bundles. Hashes rechecked 2026-10-21; bundle reimported into connected REA and view ev_9882357df9c7de478fa1b23517513a769587276a1c8fd525c64dd09fd7062a34 confirms the selected wizard types. Wizard list icons: REA-managed resource keys in `Seagull.Data.Configuration.dll` (see `docs/rea-database-icons-2026-10-21.md`), shipped as `gui/assets/database-types/*.png`. No full parity claim.

| Type | UI | Adapter | Real integration |
|---|---|---|---|
| Text File | Native picker + staged import | Main-process file provider | PASS: CSV native pick and real source refresh in Electron |
| XML File | Native picker + staged import | Main-process file provider | PASS: generated XML with repeated records through Electron picker, changed-file refresh, explicit save/reopen; picker response controlled |
| BarTender Data Builder | Native file picker + staged import | XML DataSet schema 11.2.R0 reader | PASS: native Data Builder fixture through Electron import and real file refresh; legacy SQL files unsupported |
| Microsoft Excel | Native picker + staged import | Main-process file provider | PASS: XLSX reorder/removal fixtures; native workbook parity unverified |
| Excel Online | Removed from source picker on 2026-10-22 at user request | OAuth/Graph reader retired; legacy `online` connections reject refresh with a clear unsupported-provider error | Unit checked; saved label row snapshots are retained; no live Microsoft connection |
| Microsoft Access | Catalog integrated | Existing ACE IPC | Not run in this change |
| Microsoft SQL Server | ODBC DSN form, enabled when SQL Server ODBC driver is detected | Windows ODBC DSN adapter; prompts for password on refresh when needed | Mocked wizard/IPC/provider checks; real SQL Server integration not run |
| Oracle | ODBC DSN form, enabled when Oracle ODBC driver is detected | Windows ODBC DSN adapter; prompts for password on refresh when needed | Mocked wizard/IPC/provider checks; no Oracle driver or real Oracle database available for integration |
| JSON | Native picker + staged import | Main-process file provider | PASS: generated JSON records through Electron picker, changed-file refresh, explicit save/reopen; picker response controlled |
| Firebird | DSN / File DSN form when matching 64-bit driver is installed | Shared Windows ODBC; validates DSN driver before read/refresh | Controlled driver responses in unit/Electron checks; vendor driver/server unavailable |
| IBM DB2 | DSN / File DSN form when matching 64-bit driver is installed | Shared Windows ODBC; validates DSN driver before read/refresh | Controlled driver responses in unit/Electron checks; vendor driver/server unavailable |
| IBM Informix | DSN / File DSN form when matching 64-bit driver is installed | Shared Windows ODBC; validates DSN driver before read/refresh | Controlled driver responses in unit/Electron checks; vendor driver/server unavailable |
| Google Sheets | Catalog integrated | Not implemented | Not run in this change |
| Microsoft Azure SQL | ODBC DSN form, enabled when SQL Server ODBC driver is detected | Windows ODBC DSN adapter; prompts for password on refresh when needed | Mocked wizard/IPC/provider checks; real Azure SQL integration not run |
| MySQL | DSN / File DSN form when matching 64-bit driver is installed | Shared Windows ODBC; validates DSN driver before read/refresh | Controlled driver responses in unit/Electron checks; vendor driver/server unavailable |
| MariaDB | DSN / File DSN form when matching 64-bit driver is installed | Shared Windows ODBC; validates DSN driver before read/refresh | Controlled driver responses in unit/Electron checks; vendor driver/server unavailable |
| PostgreSQL | DSN / File DSN form when matching 64-bit driver is installed | Shared Windows ODBC; validates DSN driver before read/refresh | Controlled driver responses in unit/Electron checks; vendor driver/server unavailable |
| QuickBooks Online | Catalog integrated | Not implemented | Not run in this change |
| SAP IDoc File | Catalog integrated | Not implemented | Not run in this change |
| SAP HANA | DSN / File DSN form when matching 64-bit driver is installed | Shared Windows ODBC; validates DSN driver before read/refresh | Controlled driver responses in unit/Electron checks; vendor driver/server unavailable |
| OLE DB Connection | Installed provider / UDL form | System.Data.OleDb | PASS: generated Access database and UDL reads; other providers unverified |
| ODBC Connection | User/system DSN and File DSN form | System.Data.Odbc | PASS: local Text Driver + File DSN, including Electron import/refresh |
| Import From File | Q LABEL JSON snapshot picker and staged field selection | Validated table snapshots; original settings/joins/filters not restored; native BarTender XML unsupported | PASS isolated Electron import/changed-file refresh/save/reopen |

Catalog descriptions are application copy, not verified verbatim native resource strings. Downstream pages and unavailable adapters remain outstanding. Stacked modal behavior implements the user request, not proven native parity.
