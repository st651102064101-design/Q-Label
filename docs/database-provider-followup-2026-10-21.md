# Database provider follow-up

Date: 2026-10-21. Part of the approved database-wizard plan; implementation continues inline under Superpowers executing-plans and test-driven-development.

## Implemented application behavior

- Main-process owner-bound provider sessions validate request identity, cancel superseded generations, dispose resources after their window is destroyed and suppress late results. Provider errors omit untrusted driver diagnostics and secrets.
- Native selection grants access to the selected file for the owning renderer. New open requests cannot use an unselected path or another renderer's session. A saved document reopened in a fresh application process requires file selection again before this new API can refresh it.
- Text/XML/JSON/Excel use existing file parsers through the main-process registry. Access uses the existing Windows reader. Access availability currently indicates the Windows bridge; driver presence and successful connection remain separately tested by the Access integration suite.
- The wizard consumes records from the native file picker and releases its temporary session. Native file options can reopen the same authorized source. Manager Refresh rereads the source, then applies the existing local query engine. Ordinary field/query edits use the current snapshot.
- Stable worksheet IDs use names. Reordering sheets does not change the selection. A removed selected sheet, failed source read or invalid query cannot replace the prior committed rows.
- Narrow Properties content places source captions above inputs, preserving the existing 700×560 dialog minimum and a field wider than 300px. Close spacing uses the user's requested 6px right inset; the obsolete 20px runtime expectation was updated without changing the 8px control gaps.

## REA feature evidence

The installed artifact hashes for BarTend.exe and Seagull.Data.Configuration.dll were rechecked and match the approved specification. Existing exported evidence had expired in the current server session, so `import_evidence_bundle` loaded the retained bundle before `inspect_analysis_view` was used.

- Wizard lifecycle method page: `ev_f59ac8a38c977ae5275393bc58e171b2b9bb04a5186d594e198123596c83384a`; includes ShowDialog, OnActivate, OnDeactivate and PrepareNewRecordSetOfType. Method presence does not prove runtime cancellation behavior. Our session policy follows the approved specification.
- ODBC ConfigureConnectionTaskBody, token `0x06000748`: `ev_fb65aee1223cc1cfdb6984d16578e61ce43970fc9e3c746c4990b37449a08e13`. Retained page index confirms CurrentDataSource/FileDataSource/FileName and DSN=/FileDSN= literals, ConfigureConnectionTaskBody → DbSchemaEngine.ListTables. Earlier native UI observations confirmed user/system DSN and file DSN selection.
- DataBuilderDatabase: `ev_aec35b7d567712cf1652eb5ee2870ce24814f7bd2a980c2b7ff3784a4451ae62`, from Seagull.Data.Core.dll. Its declared capabilities are separate from serializer format evidence.
- Seagull.Data.DataBuilder.dll SHA-256 `2f0dc025e802305881ced0b1168d8d4fc71cf4b128fe2bd3ccd23b0227a58bb5`, MVID `61e51107-9bb5-4d9c-adf4-c616e8333aa3`. Complete member parent `ev_1a02390590a660852a8b37908c3b13bf09c044132c2f498cd7e02c6a78bf5eab` identifies XML and SQL XML serializers. Selected serializer evidence `ev_4663cd689140e42bba0d8aeb23ffc96725ccbf26fc1b691c5c40b6de4b3f8f2f` includes DataSet.ReadXml/WriteXml, IsDataBuilderXmlFile and IsLegacySqlServerFile. The file extension is .btdb. Exact schema/version compatibility requires a native saved fixture before enabling a parser.

Provider: REA MCP 6.7.0; checkout revision remains `dfe8378cf5a727e3d93d47a5986233175c6ef898`. Follow-up bundle: `D:/QLabel-agent-work/rea-database-20261021/database-followup-20261021.json` (18 records). No target assemblies were loaded by the REA static analyses.

## Separate Windows runtime observation

`D:/QLabel-agent-work/rea-database-20261021/windows-provider-probe/probe.ps1` used System.Data.Odbc with a temporary File DSN and installed Microsoft Access Text Driver. It enumerated records.csv and read id values 001/002 and names Tea/Coffee, using OdbcCommandBuilder.QuoteIdentifier. `result.json` records the result. This is an external controlled runtime observation, not REA evidence or proof of remote database connectivity.

Read-only Get-OdbcDsn/Get-OdbcDriver discovery found 64-bit Access/Excel DSNs and SQL Server/SQL Native Client/ODBC Driver 17/Access/Excel/Text drivers on this host. Other server drivers, cloud authorization and complete native page geometry remain unverified.

## Verification record

New focused session/file/IPC tests pass, including actual CSV and XLSX fixtures. `test/database-provider-runtime.js` passed native picker → saved label binding → modified-file refresh using the real Electron preload and main process in isolated appData. `modal-free-resize-runtime.js` and `modal-controls-spacing-runtime.js` passed after the responsive layout and current spacing expectation were applied. Full-suite results belong to the current report and ledger; prior report timestamps must not be treated as this change's result.

The 23-entry catalog is complete; connection adapters and downstream native flows for the remaining types are not complete. This checkpoint does not establish full BarTender parity.

## Windows adapters implemented after the first checkpoint

ODBC and OLE DB now use the installed 64-bit Windows providers through System.Data. Driver configuration is sent to the helper over stdin, never process arguments. Only quoted SELECT reads are generated; rows are bounded at 10,000 per table and 64 tables. Driver exception text is not returned to the renderer. Native schema/table details still require provider-by-provider validation.

ODBC enumerates actual user/system DSNs and accepts File DSN selection. OLE DB enumerates provider ProgIDs from SOURCES_NAME (SOURCES_PARSENAME is a CLSID) and supports UDL files. The corresponding wizard options are enabled after successful discovery. Passwords are excluded from saved providerOptions; a password-protected source may require credentials again when refreshing or reopening.

Actual Windows integration passed for Text Driver/File DSN, ACE Access and UDL files. The isolated Electron Windows runtime passed discovery → File DSN selection → record binding → changed-file refresh. This does not validate Oracle, SQL Server, cloud services or every OLE DB provider.

Failed wizard Finish restores the complete document, including renamed object tokens, source keys and values; the active undo/redo references are restored. Manager Source type is read-only and directs changes through the wizard.

## Data Builder XML implementation and native saved fixture

REA retained serializer evidence `ev_4663cd689140e42bba0d8aeb23ffc96725ccbf26fc1b691c5c40b6de4b3f8f2f` was queried through connected MCP on continuation. View `ev_be34aa3ae32de9bf35b4433e6d0f1111b5afdd728dbe6d95d542b498bb5b266c` confirms the exact selected DataBuilderXmlSerializer, DataBuilderSqlXmlSerializer, DataBuilderDatabaseFile and BtDataSetFormatSerializer types without unmatched names. Installed Seagull.Data.DataBuilder.dll SHA-256 still matches `2f0dc025e802305881ced0b1168d8d4fc71cf4b128fe2bd3ccd23b0227a58bb5`; MVID `61e51107-9bb5-4d9c-adf4-c616e8333aa3`. Static CIL anchors identify DataSet ReadXml/WriteXml; this does not execute or prove the native UI.

Separate Computer Use observation created a new controlled database in installed DataBuilder.exe using Create Data Table, Add Field/Text, enter 001 Tea and Save Database. Native fixture `D:/QLabel-agent-work/rea-database-20261021/native-fixture.btdb` SHA-256 `e7a5d3aaf0420e4e966203d096bcd1c8a9dc0bfbeffab7fc7b4d8e7375d96ab8` is copied to `test/fixtures/databuilder/native-text.btdb`. The UTF-8 XML has BtDataSet namespace, inline XSD and SchemaVersion 11.2.R0. System _BARTENDER_ metadata is excluded from user tables, XML-encoded names are decoded once, and column order/defaults come from the schema. DTD/entities, nested values, unsupported schemas and legacy SQL files are rejected. No grid metadata or stored original path is executed.

Implementation mapping: `lib/database/databuilder.js` → file importer → main-process provider registry → native wizard picker and manager refresh. Manager local upload also accepts .btdb as an embedded snapshot, clears the old linked path/provider options and suppresses responses from a closed/reopened dialog. New regression cases were observed failing before implementation, then all 33 manager cases passed.

Electron `test/database-provider-runtime.js --builder` PASS: native picker → committed document model → changed-file refresh, using a copy of the native saved fixture. No disk save/reopen claim, legacy SQL support or all-version Data Builder parity. The full-suite result is recorded separately after completion.

## Additional persistence runtime and next format findings

The CSV and Data Builder Electron runtimes now also explicitly save the label using persistEditor(true), reload it through loadTemplateRaw, and reopen it with openEditor. Bound fields, source references and refreshed rows survive the disk round trip. Both PASS. This supersedes the earlier model-only limitation for these two controlled cases; a fresh application process still requires reselecting a source before provider refresh.

Connected REA inspection of SAPIDocConnectionPageViewModel produced parent ev_d189b3016cdda0c364bf61dbd4346c26fe749927ef90c2d1eb738ec85315d447 and call-edge view ev_799a91d8685c5c1f675bbd2177199d43c534053b383fcf93cb6b7f60f9957bc7. Its validation requires a selected IDoc type and an existing parser file. Configure Types launches AdminConsole.exe /startpage=Databases/IDocDefinitionsSetup and watches the definition XML. The separate Seagull.Data.SAPIDocConfiguration.dll SHA-256 1e525d1b18f4c3c960abd3be75a061faf476686e8683bd4e336ae8e54cf7fc42 has parent ev_4721b8f60bf35ac2a0b409d0740a0319562558dcab348f1a19bb59562412f36f and string view ev_22e244e9f2eee1f66a62a9be8aea306f09143c7d8c619826662406fd0668d6f9, including SAPIDocConfiguration.xml and release values 40A–46C. No native configured parser fixture has yet been obtained; generic XML import is not an IDoc implementation.

ImportExportXML parent ev_ddcc3fdf1c4f41f935e8874aa4f95f665267e2f588003260b4cf3e8965e35c31, call view ev_75f9ed36df4af2d61a92bdb0af1d7274448656294afcdafc8efd3b562afb0527 and strings ev_ffbc7f7080904084a75381ce1841f218485fb94076a227d16d5ac6e93d8474e8 identify an XML DatabaseSetup configuration, not record XML: DatabaseConnections, RecordSets, aliases, filter variables, joins and provider parameters. The embedded XSD is labeled BT 11.3. A native exported configuration and provider-specific conversion are required before enabling this option.

Exported retained REA bundle: D:/QLabel-agent-work/rea-database-20261021/database-special-format-followup-20261021.json, 29 records, 65,080,574 bytes. Static analysis does not prove runtime page geometry or successful external services.
