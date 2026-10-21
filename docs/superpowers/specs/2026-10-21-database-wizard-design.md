# Database Setup Wizard and nested dialogs

Date: 2026-10-21
Status: written specification for user review. Architecture direction approved by the user's continuation; this document and the implementation plan have not yet been approved.

## 1. Outcome and scope

Q LABEL must expose all 23 database choices observed in the installed BarTender build, reproduce their configuration flows and provide real data access. Matching the first screen alone does not satisfy the request. Nested dialogs must appear above their still-visible parents. This specification covers the wizard, provider boundary, connection lifecycle, associated data consumers and shared dialog lifecycle.

Success requires per-type evidence for layout, navigation, validation, prerequisites, connection, schema discovery, reading records, refresh, persistence and cancellation. An unavailable provider is an explicitly reported incomplete integration; displaying its name is not completion.

Existing user documents, open applications and unrelated working-tree changes must be preserved. Reconstruct behavior using the collected evidence and independently maintained application code. Do not make the deployed application depend on copying proprietary installed assemblies.

## 2. Evidence and limits

Investigation checkpoint: `D:/QLabel-agent-work/rea-database-20261021/REVIEW.md`. Retained REA exports: `database-investigation.json` and `native-flows/rea-database-provider-evidence.json` in that directory. Static navigation is indexed in `wizard-navigation-graph.json`; possible transitions do not prove runtime execution.

REA checkout revision: `dfe8378cf5a727e3d93d47a5986233175c6ef898`, upstream `https://github.com/morluto/rea.git`, connected provider version 6.7.0. Configuration evidence IDs: `ev_cddda1e18cf409b4f557ad6a324f0b2a47da8158af4ff922bcb98ef0e6b38937` and `ev_876c4d2ce692cb614e6849308f61f3680108371af6e48b8a1821324acbb59692`.

| Installed artifact | SHA-256 |
|---|---|
| D:/Programs/BarTend.exe | 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3 |
| D:/Programs/Seagull.Data.Configuration.dll | 58a455d3e46cbbfbcd71c0ce0a1ac6d9a87e66297d67fbacfd964bf75ab4cf56 |
| D:/Programs/Seagull.Data.Core.dll | 8b0cd26a076aa21e543236f4f401c7f7370fb1166fe8c06116b37cc247180e80 |
| D:/Programs/Seagull.Data.dll | 490ef61e672e694bed3fbd110ca8eb9cff73faf50e0a079dc06e27a62467e2e3 |

Computer Use separately confirmed the 23-entry catalog and initial ODBC and OLE DB pages. REA native UI observation is unsupported on this Windows host. Supplemental System.Reflection.Metadata decoding resolved generic page arguments without executing the assemblies. Resource extraction has no completed result and is excluded. BtSystem.DatabaseWizard.dll concerns a different subsystem and is excluded.

This documentation step reconstructs no new native behavior. It consolidates retained feature evidence. Exact downstream geometry, cloud sign-in, server connections, Data Builder format and imported configuration format require additional feature-matched evidence before their dependent implementation. The stacked-modal behavior is the user's explicit requirement; it is not claimed as proven BarTender parity.

## 3. Catalog and required flows

Preserve the following observed order and visible names. Each row requires an individual coverage record, including any unavailable integration prerequisites.

| # | Choice | Required flow family |
|---|---|---|
| 1 | Text File | File or embedded data, encoding, delimited/fixed-width format, fields |
| 2 | XML File | File or embedded data, schema/node selection, fields |
| 3 | BarTender Data Builder | Verified format/provider, database and table selection |
| 4 | Microsoft Excel | Workbook, sheet/table selection, field discovery |
| 5 | Excel Online | Account authorization, workbook/sheets, tables and summary |
| 6 | Microsoft Access | Driver detection, database file, authentication when required, tables/query |
| 7 | Microsoft SQL Server | Server/database/authentication, tables or query |
| 8 | Oracle | Provider-specific connection, authentication, tables or query |
| 9 | JSON | File or embedded data, master record, field selection |
| 10 | Firebird | Provider-specific connection, authentication, tables or query |
| 11 | IBM DB2 | Driver detection, connection, authentication, tables or query |
| 12 | IBM Informix | Driver detection, connection, authentication, tables or query |
| 13 | Google Sheets | Account authorization, spreadsheet, data detection, tables and summary |
| 14 | Microsoft Azure SQL | Server/database/authentication, tables or query |
| 15 | MySQL | Provider-specific connection, authentication, tables or query |
| 16 | MariaDB | Provider-specific connection, authentication, tables or query |
| 17 | PostgreSQL | Provider-specific connection, authentication, tables or query |
| 18 | QuickBooks Online | Account/company authorization, provider tables or query |
| 19 | SAP IDoc File | Verified IDoc file structure, records and fields |
| 20 | SAP HANA | Provider-specific connection, authentication, tables or query |
| 21 | OLE DB Connection | Installed provider selection or UDL file, connection properties, tables/query |
| 22 | ODBC Connection | User/system or file DSN, authentication, tables |
| 23 | Import From File | Validate native connection configuration format, then route through its provider |

Flow families specify required outcomes, not yet-verified exact page sequences. Capture and attach the remaining native controls, defaults, transitions and error behavior to each row before implementing those details. Never interpret Import From File as an arbitrary data-file import without format evidence.

## 4. Architecture and contracts

Use a single provider catalog shared by wizard rendering and capability lookup. Entries contain stable type IDs, display metadata, prerequisites, flow identifier and supported operations. Preserve existing serialized IDs through explicit aliases. Local imports remain usable while new adapters are introduced.

Use a wizard controller with explicit page IDs, a draft connection, navigation history, validation results, request generation and cancellation state. Renderers display state and dispatch actions; they do not perform database access directly. Provider-specific pages share reusable connection/table/field components only where their semantics match.

Place provider operations behind a narrow Electron IPC boundary: detect availability, begin connection, discover schema, read/query records, refresh and dispose. Each request contains a session ID and generation. Responses carry the same identity; disposed or superseded requests cannot update the draft or document. Validate payloads in the main process. Release handles on cancellation, window destruction and app shutdown.

Adapters may share a driver transport, but keep provider-specific capabilities and validation. Detect prerequisites on the actual host and expose actionable failures. Do not ship enabled controls whose handler is a placeholder. Development stages may remain incomplete; they must not be reported as the final complete feature.

Store non-secret connection configuration and stable connection/table/field IDs in documents. Hold credentials in a main-process session or OS-protected credential store; exclude tokens/passwords from saved documents, logs and renderer diagnostics. Cloud adapters use a supported authorization flow with cancellation and session expiry handling. Provider dependency and client-registration choices must be recorded in the implementation plan once their supported interfaces have been verified.

## 5. State, persistence and consumers

Changing type invalidates incompatible authentication, schema, selected fields and cached rows. It must not relabel an old dataset as a different provider. Returning Back retains compatible draft inputs. Changing an input cancels or invalidates its pending operations.

Finish validates the active draft and commits configuration, field bindings and data changes atomically as one undoable document operation. A failed commit restores all affected objects and source references. Cancel, close and Escape discard the draft without altering the saved connection or object bindings.

Refresh rereads the source through its adapter. It must not merely rerun a query against stale imported rows. Keep cached results explicitly identified and preserve them on a failed refresh with an error state. Record navigation, preview and object field resolution consume the same effective filtered/query result.

Use stable connection and field identities rather than array positions. Deletion invalidates dependent bindings explicitly and updates all subscribed consumers. It must never silently rebind a reference to the next connection or field. Legacy single-connection documents migrate without losing existing field names or data. The connection collection supports additions without overwriting the previously committed connection; native multi-connection/join details require matching evidence.

## 6. Wizard presentation and interaction

Match the installed reference at a recorded DPI and viewport: window title, Select Database Type heading, explanatory text, scrolling icon/name/description rows, selected state and Back/Next/Finish/Cancel footer. Use actual measured reference geometry for visual acceptance, not an assumed universal pixel size.

Selection supports pointer and keyboard input with one selected choice. Next and Finish reflect validation and active work. Double-click follows the confirmed native selection/navigation behavior. Busy operations prevent duplicate submission and allow cancellation. Errors retain entered values and focus the relevant field when possible.

No provider is omitted from the catalog. Missing drivers, unavailable authorization or unsupported formats display specific prerequisite/error information. Final completeness still requires the corresponding real adapter and evidence; an error panel alone does not fulfill that type.

## 7. Nested modal lifecycle

Maintain an ordered dialog stack with explicit parent and opener references. Opening a child leaves its ancestors visible and places the child above them. While a child is open, ancestors and the editor cannot receive pointer or keyboard mutations. Tab remains in the active dialog and Escape affects only the top eligible dialog.

Closing the child restores the parent's previous state and focus to its opener, or to a suitable surviving control if the opener disappeared. Closing/removing a parent disposes its descendants and pending async requests. Maximize, restore, drag and resize must preserve stacking order. Reopening a dialog creates no duplicate stack entries.

Audit dialogs that close the parent before opening a child, plus Settings/Help and custom backdrops. Apply the shared lifecycle consistently. Guard global editor keyboard shortcuts so typing, Delete, undo or paste inside a child cannot mutate canvas objects.

## 8. Implementation boundaries

- `lib/database-import.js`: existing file adapters and catalog compatibility.
- `gui/database-setup.js`: wizard view/controller integration and staged flow.
- `gui/database-manager.js`: connection collection, refresh and shared effective results.
- Main/preload IPC modules: adapter sessions, schema/data access and cancellation.
- `gui/modal-windows.js` and dialog CSS: stacking, focus and cleanup.
- `gui/renderer.js`, `gui/page-setup.js` and manager callers: shortcut guards and parent-preserving opening.
- Relevant database/modal tests and `UNIT_TEST_BASIC.md`: behavior assertions, runtime cases and coverage inventory.

Separate provider adapters, state transitions and UI views into focused modules as required. Avoid unrelated refactoring and preserve existing in-progress changes.

## 9. Verification and completion criteria

For each catalog type record native evidence, adapter implementation, prerequisite detection, valid connection, invalid input, cancellation, schema/record results, refresh, reopen and field binding. Use controlled fixtures and authorized test servers/accounts. Distinguish mock unit coverage from real provider integration. An absent server/account/driver is unavailable coverage, never a passing result.

Unit cases include catalog order/unique IDs, capability routing, Back/Next validation, atomic Finish/Cancel, stale async responses, type-switch invalidation, real refresh dispatch, migration and stable bindings. Modal cases include three levels, visible ancestors, focus containment/restoration, one-level Escape, removed ancestors, maximization and editor shortcut isolation.

Isolated Electron checks assert actual rendered geometry, keyboard interaction, enabled states and consumer updates. Native comparison records viewport/DPI and discrepancies. Run `npm run test:basic` in full after implementation as required by project policy, plus the relevant isolated runtime and provider integration checks. Record command results and report paths without replacing existing evidence with unrun claims.

Release only with an updated display/package version, Thai changelog and accurate limitations. Full parity remains incomplete until all 23 coverage records and required native comparisons pass. This specification introduces no application change and claims no new test results.

## 10. Review checkpoint

Self-review: all catalog entries are listed; missing evidence is separated from confirmed behavior; state ownership, cancellation and persistence are explicit; UI and connection coverage are independently required; modal behavior follows the user's request.

Next step after user approval of this written specification: use Superpowers writing-plans to create a reviewable implementation plan, including evidence acquisition for unresolved native details and provider prerequisites. Implementation begins after that plan's required review and execution-method selection.
