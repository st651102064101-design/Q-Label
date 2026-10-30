# Object Data Sources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Execution proposal: native implementation in this session, preserving the current working tree.

**Goal:** Implement and verify the complete agreed BarTender Data Sources behavior in Q LABEL, including preview and print output.

**Architecture:** A versioned document registry stores ordered source references. A shared evaluator produces typed values and diagnostics for both renderer and print preparation; main-process adapters supply external inputs. UI changes remain transactional until Properties is committed.

**Tech Stack:** Existing Electron, browser/CommonJS JavaScript, Node test runner, existing JSDOM tests, isolated Electron profiles, installed BarTender help and disposable reference documents.

**Spec:** `docs/superpowers/specs/2026-10-16-object-data-sources-design.md`

## Global Constraints

- Source model: `dataSourceSchemaVersion: 1`, document `sourceDefinitions`, ordered object `dataSourceRefs`, stable definition/object/page IDs.
- Preserve legacy files, unknown metadata, manual-save policy, undo/redo, multi-page/side data and barcode catalog rendering.
- Implement all 12 source kinds, 9 data types and 12 transform groups. Disabled options are incomplete work, never evidence of parity.
- Preview never consumes serialization state. Print snapshots inputs and rejects unresolved errors before sending output.
- Keep the user's running application and real documents open; reference experiments use disposable documents and no physical printing without explicit authorization.
- Run `npm run test:basic` after changes; update `UNIT_TEST_BASIC.md`, version and Thai changelog for application deliveries. Do not change assertions to conceal defects.
- Commit only reviewed task changes. Push normally, never force. Current push is blocked by GitHub 403 for the authenticated account; local implementation does not depend on push permission.
- All checkboxes begin incomplete. This plan is not implementation evidence or a claim of 100% compatibility.

## Current evidence and remaining work

Inspected 2026-10-16 after `git pull --ff-only` reported up to date:

| Area | Current implementation | Remaining |
|---|---|---|
| Object Properties | `gui/object-properties.js` edits one text/token value; separate text/number and simple transform fields | Ordered tree, three source tabs, source dialogs and operations, transactional shared edits |
| Evaluator | `gui/data-source-engine.js` resolves document fields with simple string transforms | Typed per-object graph, diagnostics, stable references, adapter snapshot and complete transform pipeline |
| Object rendering | `gui/object-data.js` substitutes tokens and applies whole-object prefix/suffix | Consume evaluated object values without applying transforms twice |
| External File | `gui/data-sources.js` maps category to imported table | Read configured file at the specified lifecycle point, encoding and failures |
| Script | Expression token substitution | Actual VBScript execution, events and compatible object model |
| Print | `lib/print-job.js` uses shared legacy field resolution | Object results, job snapshot, durable serial transaction, adapter errors |
| Verification | Latest recorded unit run: 527 pass; smoke alignment has four failures | Repair baseline, add reference matrix and runtime/output parity coverage |

## Review Focus

1. A saved legacy catalog barcode must not lose data or regenerate from stale `barcode_spec.text`; tested in Tasks 2 and 5.
2. Cancelling a named-source edit shared by two objects must restore both objects, including nested dialogs; tested in Tasks 3 and 4.
3. A late file/script preview response must not overwrite a newer revision or a closed dialog; tested in Task 7.
4. Failed/uncertain print transport and concurrent jobs must not silently reuse serials; tested in Task 8.
5. Mixed Unicode, binary bytes and locale-specific numbers must survive persistence and produce identical preview/print values; tested in Tasks 6 and 10.

## File ownership and interfaces

- `gui/source-model.js`: pure schema/migration/list operations; UMD export `SourceModel`.
- `gui/source-resolver.js`: pure graph evaluation; UMD export `SourceResolver`.
- `gui/source-types.js`, `gui/source-transforms.js`: pure parsing/formatting and transform rules.
- `gui/object-data-sources-ui.js`: source tree/tabs and nested editors; no direct persistence.
- `gui/source-session.js`: revision cancellation, draft/commit and preview lifecycle.
- `lib/source-adapters.js`: async file/library/global/script inputs; no renderer filesystem access.
- `lib/source-serialization.js`: durable reservation ledger and print lifecycle.
- `lib/source-vbscript.js`: isolated Windows script execution and compatibility bridge.
- `gui/source-gs1.js`: AI model, validation and encoded/HRI result.
- Existing integration points: `gui/object-properties.js`, `gui/object-data.js`, `gui/data-source-engine.js`, `gui/data-sources.js`, `gui/renderer.js`, `gui/index.html`, `gui/preload.js`, `gui/main.js`, `lib/print-job.js`, `gui/print-ipc.js`.

Shared result contracts:

```js
// No live IO handles or buffers are persisted in the document.
// Binary values use a tagged byte array in memory and explicit encoding on disk.
// Evaluation errors are structured; UI may show diagnostics, printing must reject them.
// context: {mode, revision, recordIndex, copyIndex, jobId, totalCopies,
//           now, locale, timeZone, printerCapabilities, inputs}
// diagnostic: {code, message, definitionId, objectId, path, severity}
// evaluateDocument(document, context):
//   {objects: {[objectId]: {kind, value, text, bytes?}}, diagnostics: Diagnostic[]}
// collectInputs(document, context, {signal}): Promise<immutable input snapshot>
```

## Task 1: Reference fixtures and a usable baseline

**Files:** Create `docs/reference/data-sources-matrix.json`, `test/fixtures/data-sources/reference/`; inspect `test/smoke.js`, `lib/zpl.js`, `lib/tspl.js`, `gui/object-data.js`.

**Interfaces:** Matrix row `{id, feature, referenceVersion, helpTopic, fixture, input, expected, actual, evidence, status}`; status is `observed`, `implemented`, `verified` or `blocked`.

- [ ] Reproduce the four smoke failures with `node test/smoke.js`; trace alignment inputs through renderers and distinguish source-data errors from geometry errors. Preserve each intended assertion.
- [ ] Add regression coverage for each actual defect, implement its correction, then run the whole basic suite to a clean baseline.
- [ ] Enumerate every control and conditional control under all source/type/transform dialogs from installed help; make a matrix row for each behavior, not just each top-level menu.
- [ ] Use disposable BarTender fixtures to record defaults, type-to-transform availability, parent/nested Cancel behavior, named-source link/copy semantics, and transform ordering. Include two non-commuting transforms so order is observable.
- [ ] Record exact expected values and reference version. If a behavior cannot be measured, record the reason; do not invent it. Complete dependent implementation decisions only after evidence is available.
- [ ] Commit baseline correction and reference artifacts separately; exclude user documents, generated app distributions and credentials.

## Task 2: Ordered source model and legacy migration

**Files:** Create `gui/source-model.js`, `test/source-model.test.js`; integrate schema metadata in `gui/template-pages.js` only where existing page cloning/persistence needs it.

**Interfaces:** `migrate(document, {newId}) -> newDocument`, `addSource(document, objectId, definition, index) -> newDocument`, `moveSource(document, objectId, from, to) -> newDocument`, `removeSource(document, objectId, index) -> newDocument`, `copySource(document, definitionId, {linked, newId}) -> {document, definitionId}`. Input documents remain unchanged; `newId` is injected in tests.

- [ ] Write failing tests: literal `12345678` becomes one Embedded source; `A{{lot}}B` preserves segment order; two objects referencing `lot` share the same definition; repeated migration adds no definitions; catalog `barcode_spec.text` is preserved.
- [ ] Add tests for duplicate object/page IDs, dangling references, Unicode names, case policy from reference, unused source cleanup, move boundaries and JSON round-trip of unknown fields.
- [ ] Run `node --test test/source-model.test.js`, implement the model and verify the tests pass.
- [ ] Keep legacy whole-object transforms after concatenation, not duplicated on each migrated segment. Pin this with prefix `[` and suffix `]` producing `[A123B]`.
- [ ] Add inventory/checklist coverage, run `npm run test:basic`, review diff and commit.

## Task 3: Shared graph evaluator and transactional sessions

**Files:** Create `gui/source-resolver.js`, `gui/source-session.js`, `test/source-resolver.test.js`, `test/source-session.test.js`.

**Interfaces:** `evaluateDocument(document, context)` as above; `createSession(document) -> {draft, revision, update(mutator), evaluate(context), commit(), cancel()}`. Commit returns a new validated document; cancel never mutates the original.

- [ ] Write failing fixtures for Embedded + Named concatenation `LOT-` + `42` → `LOT-42`; duplicate references; cross-page object values; missing source; a three-node cycle with the complete diagnostic path.
- [ ] Test two objects sharing one named definition, editing both through one session, then cancel and confirm both original values remain. Commit must produce one transaction boundary.
- [ ] Test that editing the document after evaluation begins rejects the earlier revision's result, including after cancel.
- [ ] Implement memoized graph evaluation per context and draft sessions. Do not cache across record/copy/revision boundaries.
- [ ] Run targeted tests, the full basic suite, update the checklist, review and commit.

## Task 4: Properties source tree, tabs and operations

**Files:** Create `gui/object-data-sources-ui.js`, `test/object-data-sources-ui.test.js`, `test/object-data-sources-runtime.js`; modify `gui/object-properties.js`, `gui/index.html`.

**Interfaces:** `mount(container, {session, objectId, onChange, onDiagnostic}) -> {dispose()}`. It edits only the supplied session. Parent Apply/OK owns commit and persistence.

- [ ] Write DOM tests for source selection and Data Source/Data Type/Transforms tabs; Name, Description, Type and Embedded Data bind to the selected definition, not the object as a whole.
- [ ] Add New/Delete/Cut/Copy/Paste/Move Up/Down tests, including bounds, empty clipboard, linked/independent copies and text-input shortcut isolation.
- [ ] Add tests for name/type wizard cancellation, special characters, multiline data, live preview, parent/nested cancellation and shared definition commit as one undo entry.
- [ ] Implement UI using existing modal/icon styles. Connect both double-click and context Properties paths; ensure barcode catalog objects use the same source controls as native barcodes.
- [ ] Run isolated Electron test with two objects: concatenate sources, reorder, commit, undo/redo, save/reopen, then cancel a second edit. Assert actual object values and rendered preview, not merely visible controls.
- [ ] Run full suite, update checklist and delivery version/changelog, review and commit.

## Task 5: Preview, export and print consume the same result

**Files:** Modify `gui/data-source-engine.js`, `gui/object-data.js`, `gui/renderer.js`, `gui/object-properties.js`, `lib/print-job.js`; add `test/source-output-parity.test.js` and extend `test/data-sources.js`, `test/print-job.js`.

**Interfaces:** Keep legacy `DataSourceEngine.resolve(template, input, context)` working; expose a separate versioned evaluator path. `ObjectData.resolve` reads evaluated object values by stable ID when supplied and retains its old contract for legacy callers.

- [ ] Write failing tests comparing identical frozen context in Properties, renderer data, export and print preparation for text, Code128, QR, Data Matrix and catalog barcode.
- [ ] Assert no duplicate prefixes, no stale encoded catalog bitmap, no serial increments on preview, and print rejection for structured errors before any transport invocation.
- [ ] Implement integration through the shared evaluator; re-encode catalog barcode from resolved data, preserving authored source config.
- [ ] Exercise CLI/server/export callers as well as Electron IPC so the old synchronous path cannot bypass the new evaluation checks.
- [ ] Run full suite and Electron parity fixture, update checklist/version/changelog, review and commit.

## Task 6: Nine types and twelve transform groups

**Files:** Create `gui/source-types.js`, `gui/source-transforms.js`, `test/source-types.test.js`, `test/source-transforms.test.js`; extend source UI and resolver.

**Interfaces:** `parseAndFormat(value, typeConfig, context) -> typedResult`; `applyTransforms(value, configs, context) -> typedResult`. Rule order and allowed type/transform pairs come from Task 1 evidence.

- [ ] Turn every observed reference type/transform case into a failing golden fixture, including dependent options and invalid inputs.
- [ ] Implement Text/Date/Time/Number/Currency/Percentage/Fraction/Binary/Picture with reference locale/rounding/pattern rules. Test UTF-16 versus character counting using emoji and combining characters, invalid dates and byte round-trips.
- [ ] Implement Suppression, Character Filter, Compression, Offset, Range Checking, Truncation, Number of Characters, Character Template, Search and Replace, VB Script, Serialization, Prefix/Suffix in verified order. VBScript and serial steps delegate to Tasks 8 and 9; do not substitute strings as implementations.
- [ ] Search/Replace tests exercise ordered actions, empty match, regex/literal behavior where supported, Import/Export, and cancellation. Compression tests compare decoded bytes, not just output length.
- [ ] Test each conditional UI state against the type/transform capability matrix. All intended controls must have actual behavior before this task is accepted.
- [ ] Run full suite, runtime fixtures and golden comparisons; record mismatches, correct them, update checklist/version/changelog and commit verified increments.

## Task 7: External and contextual source adapters

**Files:** Create `lib/source-adapters.js`, `test/source-adapters.test.js`; modify `gui/preload.js`, `gui/main.js`, `gui/print-ipc.js`, `lib/print-job.js`, `gui/data-sources.js` and source UI.

**Interfaces:** `collectInputs(document, context, {signal}) -> Promise<snapshot>`; `snapshot` contains serializable resolved inputs with revision and provenance. File/library access runs only in the main process or Node host.

- [ ] Write failing tests covering all 12 kinds: Embedded, Clock, Database Field, Library Phrase, Global Data Field, Object Value, Print Job Field, External File, VBScript, Printer Code Template Field, Table Data Field, Named Data Source.
- [ ] For External File use temp files: change content after preview and before print, UTF-8/UTF-16/BOM/binary, missing/unreadable path, path from named source, cancellation and late responses. Assert print rereads and snapshots the intended bytes.
- [ ] For database/table sources test null/default, missing connection/column, row selection and record bounds; for clocks pin timestamp/timezone and printer capability; for libraries/globals pin identity, revision and conflict behavior.
- [ ] Implement adapters and async print preparation without changing the transport until every required input resolves. PCT export must preserve placeholder semantics and reject unsupported runtime use.
- [ ] Wire source-specific editors and validate every configuration before committing. Any proprietary integration still unsupported remains an explicit unfinished matrix row.
- [ ] Run full suite and isolated Electron/Node integration tests, update checklist/version/changelog, review and commit.

## Task 8: Durable serialization lifecycle

**Files:** Create `lib/source-serialization.js`, `test/source-serialization.test.js`; modify print preparation/transport completion paths and serialization UI.

**Interfaces:** `reserve(documentId, jobId, configs, context) -> reservation`; `markAccepted(jobId)`, `markFailed(jobId, {definitelyNotSent})`, `markUnknown(jobId)`; all operations serialized against a durable ledger with atomic writes.

- [ ] Record reference copy/record/job/reset/rollover/character-set behavior before defining golden fixtures; include cancel before send and failures after send.
- [ ] Write tests for increment/decrement, padding, rollover, reset, concurrent jobs, process restart, failed persistence and idempotent job retry. A preview/cancel must leave ledger bytes unchanged.
- [ ] Implement reservation and outcome handling. Unknown transport outcome requires visible recovery and must never silently reuse reserved values.
- [ ] Test print/export policies separately and identify whether success means spool/transport acceptance or printer acknowledgement.
- [ ] Run full suite and fault-injected integration tests, update checklist/version/changelog, review and commit.

## Task 9: VBScript and GS1 compatibility

**Files:** Create `lib/source-vbscript.js`, `gui/source-gs1.js`, `test/source-vbscript.test.js`, `test/source-gs1.test.js`; extend source editors and adapters.

**Interfaces:** `executeScript({code, event, bindings}, {signal, timeoutMs}) -> Promise<{value, diagnostics}>`; `compileGs1(aiEntries, symbology) -> {bytes, hri, diagnostics}`.

- [ ] Probe the installed Windows VBScript runtime using isolated temporary scripts. Record language version and BarTender event/object-model calls used by the reference fixtures; choose the host only after this probe.
- [ ] Test literal result, named source access, supported events, syntax/runtime error location, cancellation, timeout and process cleanup. Implement the measured bridge; document any unsupported member as a failing compatibility requirement.
- [ ] Build the GS1 wizard from verified AI definitions; test fixed/variable fields, check digits, separators/FNC1, invalid sequences and allowed symbologies.
- [ ] Assert encoded bytes using an independent decoder or reference result. Parentheses in HRI alone do not satisfy the barcode assertion.
- [ ] Run full suite and reference fixtures, update checklist/version/changelog, review and commit.

## Task 10: Complete comparison and delivery

**Files:** Update comparison matrix and test fixtures; create `docs/reference/data-sources-verification.md`; update `UNIT_TEST_BASIC.md`, `CHANGELOG.md`, package version files.

- [ ] Replay every matrix row against the recorded BarTender version and current Q LABEL; include nested dialogs, keyboard actions, validation, save/reopen and multi-page/side documents.
- [ ] Verify identical contexts produce identical values in Properties/editor/export/preview/print; compare encoded bytes/raster for binary, pictures and barcode data.
- [ ] Run `npm run test:basic`, isolated Electron source runtime, adapter/script/serial integration and `git diff --check`. Correct failures and repeat the full basic suite after the last code edit.
- [ ] Separate physical-printer cases from payload/spool tests. If hardware or licensed integration is unavailable, report the precise outstanding rows; do not mark the overall goal complete.
- [ ] Review the full change, fix findings, bump the next available version, commit and push. If authentication is still denied, preserve commits and report the exact push error.
- [ ] Claim complete parity only when every agreed matrix row is verified and no capability is a stub, disabled workaround, blocked integration or untested assumption.

## Approval and execution status

The user requested completion through full parity, not a reduced feature set. The spec has been carried into this plan without removing difficult features. The remaining process gate from Superpowers is review of this written plan and execution method selection. Recommended method: native execution in this session because the evaluator, UI and print contracts are tightly coupled. No production Data Sources code has been changed by this plan.
