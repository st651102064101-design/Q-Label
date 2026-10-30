# Database Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Implement all 23 database choices with real provider flows and correctly stacked nested dialogs.

**Architecture:** Separate the shared dialog lifecycle from the database subsystem. Use a shared provider catalog, staged wizard state and main-process provider sessions; retain existing file parsers. Provider-specific reconstruction remains gated by feature-matched evidence.

**Tech Stack:** CommonJS JavaScript, Electron 31, Node >=18, browser DOM, node:test, JSDOM; existing ExcelJS/SheetJS/XML parsers. New driver or OAuth dependencies require supported-interface research before selection.

**Spec:** `docs/superpowers/specs/2026-10-21-database-wizard-design.md`

## Global Constraints

- Preserve all 23 choices in the exact order specified in the spec.
- Preserve user documents, open applications and unrelated working-tree changes.
- No copied proprietary assemblies as application dependencies.
- Keep secrets out of documents, renderer diagnostics and logs.
- Missing integration prerequisites are unavailable coverage, never passing results.
- Run the full `npm run test:basic` after each implementation task; update `UNIT_TEST_BASIC.md` with changed behavior. Targeted tests supplement this suite.
- Increment display/package versions and add a dated Thai changelog for delivered application changes; planning documents do not change application versions.

## Review Focus

1. Parent removed during child async work: no orphan dialog or late document mutation (Task 1/4).
2. Duplicate Escape/global Delete handlers: only the active dialog handles input (Task 1).
3. Changing provider while schema discovery is pending: discard old results and incompatible fields (Task 3/4).
4. Refresh fails after a successful import: retain explicitly stale cached data and report failure (Task 6).
5. Legacy connection references collide with new IDs: preserve bindings without index-based rebinding (Task 6).

## Execution structure

Two independently reviewable workstreams: Task 1 delivers stacked dialogs; Tasks 2–7 deliver database reconstruction. Execute inline in this chat if the user selects Native. A dependency discovery that changes the spec requires an amended design, not invented behavior. Do not describe Tasks 2–4 alone as full database support.

### Task 1: Shared nested-dialog lifecycle

**Files:** Modify `gui/modal-windows.js`, dialog styles referenced by that module, `gui/renderer.js`, `gui/page-setup.js`, `gui/database-manager.js`; extend `test/modal-windows.test.js`; create `test/modal-stack-runtime.js`.

**Interfaces:** Introduce an internal `createDialogStack({document})` with `open(dialog,{parent,opener})`, `close(dialog)`, `remove(dialog)`, `top()` and `blocksEditorInput(event)`. Integrate existing callers without changing their public show/close semantics. Explicit parent IDs are preferred for async openers; fallback is the current top dialog at invocation time.

- [ ] Inspect current uncommitted modal changes and preserve them; read complete relevant test policy and modal/native evidence.
- [ ] Add failing cases asserting `parent.open === true`, parent remains rendered, child is top, ancestors cannot receive focus, Escape closes only child, and opener receives focus again.
- [ ] Add cases for three levels, parent removal during pending work, maximize/restore ordering, duplicate opening, and Delete/paste/undo not reaching editor handlers.
- [ ] Run `node --test test/modal-windows.test.js`; confirm failures correspond to missing stack behavior.
- [ ] Implement the stack and cleanup; replace peer suspension with visible ancestor blocking. Preserve the editor interaction policy of root dialogs; block it while a modal child is active.
- [ ] Update callers that currently close the parent and guard global editor handlers.
- [ ] Run the targeted test, `npx electron test/modal-stack-runtime.js`, existing modal runtime checks and full basic suite. Runtime asserts actual visibility/focus and document immutability.
- [ ] Update checklist, release metadata and Thai changelog; review diff and commit only task-owned changes.

### Task 2: Complete catalog and evidence ledger

**Files:** Create `lib/database/catalog.js`, `docs/database-provider-coverage.md`, `test/database-catalog.test.js`; modify `lib/database-import.js` and `gui/database-setup.js`.

**Interfaces:** `getDatabaseTypes()` returns ordered immutable entries `{id,name,description,icon,flowId}`; `getDatabaseType(id)` resolves current IDs and explicit legacy aliases. Capability availability is a separate runtime result, not a hard-coded supported flag.

- [ ] Add a catalog test with the exact 23-name array from spec section 3; assert count 23, unique IDs, stable order and legacy aliases `text/xml/builder/excel/online/access/json`.
- [ ] Run `node --test test/database-catalog.test.js` and confirm the new module is absent.
- [ ] Implement catalog and integrate existing import dispatch without enabling nonexistent adapter operations.
- [ ] Create a coverage row per provider with artifact/evidence references, native page observations, adapter status, prerequisite status and integration result; initial unverified cells explicitly say unverified.
- [ ] For each downstream page not yet observed, use matching REA methods/resources plus native UI and record defaults, transitions, validation and control geometry. Verify artifact hashes before reusing retained evidence.
- [ ] Specifically resolve Data Builder format, imported configuration schema, OAuth supported interfaces, driver architecture and packaging requirements before dependent provider implementation. Record exact blockers if evidence cannot answer them.
- [ ] Run catalog/import tests, rebuild with `npm run build:database`, full basic suite, update checklist and commit owned files.

### Task 3: Staged wizard controller

**Files:** Create `gui/database-wizard-state.js`, `test/database-wizard-state.test.js`; modify `gui/database-setup.js`, `test/database-setup.test.js`.

**Interfaces:** `createWizard({catalog,providers,initialConnection,onCommit})` exposes `getState()`, `selectType(id)`, `setInput(key,value)`, `next()`, `back()`, `finish()`, `cancel()`, `dispose()`. State includes `sessionId`, `generation`, `pageId`, `history`, `draft`, `pending`, `errors`. Provider facade signatures are defined in Task 4.

- [ ] Add failing tests: selecting another provider clears incompatible fields; resolving request generation 1 after generation 2 leaves generation 2 state unchanged; cancel invokes no commit; failed Finish leaves initial connection unchanged.
- [ ] Assert Back preserves compatible input, repeated Next starts one request, and disposal makes future responses inert.
- [ ] Run `node --test test/database-wizard-state.test.js` and confirm behavior failures.
- [ ] Implement pure transitions plus explicit async effects; record history by page ID. Do not infer native page paths from a generic three-step flow.
- [ ] Integrate the selector and provider page rendering with icons, descriptions, keyboard selection, measured layout and truthful button states.
- [ ] Run targeted tests and full basic suite; update checklist and commit.

### Task 4: Provider IPC and lifecycle

**Files:** Create `lib/database/provider-registry.js`, `lib/database/provider-sessions.js`, `gui/database-ipc.js`, `test/database-provider-sessions.test.js`; modify `gui/main.js`, `gui/preload.js`.

**Interfaces:** `detect(typeId)` returns `{available,reason,capabilities}`. `open({sessionId,generation,typeId,config})`, `schema({sessionId,generation})`, `read({sessionId,generation,selection,query})`, `refresh({sessionId,generation})`, `dispose({sessionId})` return envelopes `{sessionId,generation,ok,data,error}`. Errors contain sanitized `{code,message,field}`. Main-process sessions own adapters and credentials.

- [ ] Add tests for unknown types, invalid request shape, foreign renderer session access, cancelled requests, duplicate disposal and sanitized driver errors.
- [ ] Assert late results after disposal cannot be delivered; closing the owner window disposes every owned handle once.
- [ ] Run `node --test test/database-provider-sessions.test.js` to establish failures.
- [ ] Implement validation, owner binding, session cleanup and main/preload bridge; wrap existing file/Access adapters first. Keep renderer file access through the existing approved file-selection IPC path.
- [ ] Verify fake adapters and actual controlled file imports separately; run full basic suite, update checklist and commit.

### Task 5: Individual provider flows and real adapters

**Files:** Create per-provider modules under `lib/database/providers/`, flow definitions under `gui/database-flows/`, per-provider `test/database-provider-<id>.test.js` and integration fixtures. Extend the Task 2 ledger.

**Interfaces:** Each adapter implements the Task 4 operations with provider-specific configuration; each flow consumes Task 3 state and the same provider facade. Configuration fields and dependencies must be fixed in a provider-specific plan from Task 2 evidence before that provider's code is written.

This is an explicit evidence dependency, not a claim that the unknown formats and service APIs are already implementable. Expand each row into an executable provider-specific plan when its evidence is available. No provider may be silently omitted or replaced with a successful mock.

- [ ] File group: Text, XML, JSON, Excel; extend existing parsing for the confirmed file/embedded, detection, record and field selection flows.
- [ ] Windows group: Access, OLE DB, ODBC; implement actual driver/provider/DSN discovery, login, schema and reads. Include unavailable-driver and architecture mismatch cases.
- [ ] Server group: SQL Server, Oracle, Firebird, DB2, Informix, Azure SQL, MySQL, MariaDB, PostgreSQL, HANA; create one configuration/adapter/test record per provider even where transport is shared.
- [ ] Cloud group: Google Sheets and QuickBooks Online; implement verified sign-in, selection, cancellation, expired sessions and actual data reads with protected credential handling. Excel Online was explicitly retired by the user on 2026-10-22 and is excluded.
- [ ] Special-format group: Data Builder, SAP IDoc and Import From File; implement only the verified formats and report unsupported format variants explicitly.
- [ ] For each provider, first add exact valid/invalid fixture assertions and confirm failing tests; implement; run provider tests and full basic suite; record real integration separately; commit its owned files.
- [ ] For every unavailable real integration, retain an explicit gap. The full task remains incomplete until the requested coverage is obtained.

### Task 6: Connection collection and live consumers

**Files:** Create `lib/database/connections.js`, `test/database-connections.test.js`; modify `gui/database-manager.js`, existing connection persistence/source-resolution call sites discovered by `rg`, `test/database-manager.test.js`, `test/database-navigation-runtime.js`.

**Interfaces:** `migrateConnections(document)` returns a collection with stable IDs and a legacy binding map; `commitConnection(document,draft)` returns an atomic change plus undo data; `effectiveRows(connection)` supplies one result to navigator, preview and field resolution.

- [ ] Add tests for legacy single-connection migration, ID collision, second connection addition without replacement, delete without index rebinding and complete rollback after failed commit.
- [ ] Assert refresh invokes the source adapter, failed refresh preserves marked-stale rows, and navigator/preview resolve the same filtered row.
- [ ] Run `node --test test/database-connections.test.js test/database-manager.test.js` and confirm missing behavior.
- [ ] Implement transactional updates and subscriptions; clear stale source references immediately on deletion and late response cancellation.
- [ ] Run targeted tests, navigation runtime and full basic suite; update checklist and commit.

### Task 7: Native comparison, packaging and release

**Files:** Extend runtime tests and coverage ledger; update `UNIT_TEST_BASIC.md`, `CHANGELOG.md`, `package.json`, `package-lock.json`; adjust packaging only for verified new runtime dependencies.

- [ ] Capture each implemented page at the recorded native DPI/viewport and compare layout, selection, defaults, disabled states and keyboard behavior; record and fix discrepancies.
- [ ] Exercise saved-document reopen, nested error/sign-in dialogs, cancel during connection, refresh failure and multiple connection consumers in isolated Electron profiles.
- [ ] Run `npm run build:database`, `npm run test:basic`, relevant Electron checks and each available real-provider integration. Record pass/fail/unavailable individually.
- [ ] Verify packaged dependencies in an isolated application run without altering the user's application or printing.
- [ ] Review all 23 ledger rows against the spec. Report incomplete integrations explicitly; do not label the release full parity with any missing row.
- [ ] Review the complete change, fix findings, update release metadata and commit task-owned changes only.

## Self-review and handoff

Spec sections 1–3 map to Tasks 2/5/7; architecture to Tasks 3/4; lifecycle to Task 6; presentation to Tasks 2/3/7; modal lifecycle to Task 1. Review-focus cases are assigned above. Task 5 is intentionally a staged planning boundary because required native details and supported provider interfaces are unresolved; execution must produce those concrete provider plans rather than guess them.

Recommended method: Native, implementing in this chat sequentially so evidence, shared interfaces and the dirty workspace stay under one owner. The alternative is subagent-driven task implementation/review. User review of this plan and execution-method selection are required by Superpowers before implementation.

### Continuation ledger — 2026-10-28, v1.279

- Implemented a useful subset of Import From File: Q LABEL version 1 JSON table snapshots through the staged wizard and production file provider, including refresh and save/reopen.
- Ruling: expose Q LABEL snapshot functionality with explicit scope while native DatabaseSetup XML semantics remain unresolved. Do not claim native configuration import or restore filters/joins/settings silently.
- RED/GREEN envelope validation and mixed populated/empty-table regressions; fresh reviewer issue fixed. Electron real file integration passed twice after bundle rebuild.
- Still outstanding: Google Sheets, QuickBooks Online, SAP IDoc parser/type definition, native DatabaseSetup XML, vendor-specific native page parity and actual external-server integration. Excel Online remains retired per the recorded explicit user amendment; no restoration in this task.
