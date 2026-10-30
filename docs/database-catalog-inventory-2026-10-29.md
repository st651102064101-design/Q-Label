# Database catalog inventory — 2026-10-29

Scope: step 1 inventory only. Native reference: D:/QLabel-agent-work/rea-database-20261021/REVIEW.md, 23 choices observed by scrolling BarTender's installed wizard. REA evidence ev_9882357df9c7de478fa1b23517513a769587276a1c8fd525c64dd09fd7062a34; Seagull.Data.Configuration.dll SHA-256 58a455d3e46cbbfbcd71c0ce0a1ac6d9a87e66297d67fbacfd964bf75ab4cf56 and BarTend.exe SHA-256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3 rechecked. Native ordering is an observation, not confirmation of full workflow parity. Q LABEL status from lib/database/catalog.js, lib/database-import.js, lib/database/provider-registry.js, gui/database-provider-types.js and docs/database-provider-coverage.md; current machine drivers from Get-OdbcDriver -Platform 64-bit on 2026-10-29. No connections or printing performed in this inventory.

| BarTender choice | Q LABEL status |
|---|---|
| Text File | File importer available; real CSV fixture previously checked. |
| XML File | File importer available; generated XML fixture previously checked. |
| BarTender Data Builder | XML schema 11.2.R0 available; legacy SQL-backed files unsupported. |
| Microsoft Excel | XLS/XLSX importer available; workbook parity not established. |
| Excel Online | Removed by prior explicit user request; retired. |
| Microsoft Access | Windows Access provider path; installed Access ODBC driver observed; real connection needs verification. |
| Microsoft SQL Server | Windows ODBC adapter; compatible driver observed; server authentication/read unverified. |
| Oracle | ODBC adapter; compatible 64-bit driver not observed. |
| JSON | File importer available; generated fixture previously checked. |
| Firebird | ODBC adapter; compatible 64-bit driver not observed. |
| IBM DB2 | ODBC adapter; compatible 64-bit driver not observed. |
| IBM Informix | ODBC adapter; compatible 64-bit driver not observed. |
| Google Sheets | Catalog entry only; cloud adapter unavailable. |
| Microsoft Azure SQL | Windows ODBC adapter; SQL Server driver observed; cloud connection unverified. |
| MySQL | ODBC adapter; compatible 64-bit driver not observed. |
| MariaDB | ODBC adapter; compatible 64-bit driver not observed. |
| PostgreSQL | ODBC adapter; compatible 64-bit driver not observed. |
| QuickBooks Online | Catalog entry only; cloud adapter unavailable. |
| SAP IDoc File | Catalog entry only; adapter unavailable. |
| SAP HANA | ODBC adapter; compatible 64-bit driver not observed. |
| OLE DB Connection | Provider/UDL adapter; availability depends on installed provider. |
| ODBC Connection | Adapter; SQL Server, Access, Excel and Text ODBC drivers observed. |
| Import From File | Q LABEL snapshot supported; BarTender XML and original connection settings unsupported. |

Driver enumeration does not prove a database server is reachable or that credentials, schema and real reads succeed. Q LABEL's 22 visible catalog entries correspond to the 23 observed choices after Excel Online retirement. Detailed wizard screens and per-feature parity are outside this inventory.
