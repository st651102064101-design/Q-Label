# Live settings — 2026-10-20 (v1.045)

## Request and scope

Remove Apply buttons. Valid changes to existing settings update actual document,
preview and persisted editor state immediately; Close retains changes and Undo
restores earlier snapshots. Creation actions (Insert, new-source/advanced wizards)
still require complete input before creating or accepting a configuration.

## REA evidence

- Read installed reverse-engineer-anything skill and project REA workflow.
- REA 6.7.0, source revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Artifact: `D:/Programs/BarTend.exe`, SHA-256
  `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
  Recomputed SHA-256 on 2026-10-20 before reusing retained evidence.
- Queried retained REA output
  `D:/QLabel-agent-work/rea-20261019/tree-source-members-evidence.json`
  using Node JSON parsing, selecting evidence_id, operation, parameters,
  normalized_result.artifact/types and limitations.
- Operation: `inspect-managed-members D:/Programs/BarTend.exe --type DataSource --json`
  (`inspect_managed_members`, type_names `[DataSource]`).
- Evidence: `ev_23dd65815d68604f61f15988127ae13383b7afd3217661350ec485a44d674617`.
  Matching type `DataSource`, token `0x02000134` in the matching PE build.
- Scope: DataSource metadata only. Mixed CLR/native bodies and unavailable native
  runtime provider prevent proving the dialog commit event sequence from this
  evidence. It does not prove native immediate update behavior.
- User screenshots show native Properties Close/Help; this is screenshot evidence,
  separate from REA. The live update policy is explicitly requested by the user;
  no claim of complete native BarTender behavior equivalence is made.

## Implementation mapping

- Properties: remove Apply/OK footer, use Close; queue valid changes per event,
  guard asynchronous encoding by revision, preserve active form DOM and source
  session, save snapshots and refresh actual editor. Reconcile direct barcode
  text edits with source definitions before resolving and encoding.
- Database: remove Apply fields/sort/filter/options/grouping controls; valid input,
  checkbox and connection actions query and bind actual fields immediately.
  Retain previous editor document on persistence errors and display query errors.
- Catalog barcode: hide Insert only while editing an existing barcode, no Apply;
  checkbox encodes immediately. Close flushes pending text input; generation guards
  prevent stale encoding writes. Merely opening the dialog creates no snapshot.
- Table: remove Apply Borders; border mode, pen, width and style change model
  immediately through the existing mutate/snapshot callback.

## Verification

Executable regression coverage is listed in UNIT_TEST_BASIC.md. Full Basic and
Electron runtime results are recorded below when complete. Tests use isolated
profiles/fixtures and do not send print transport to real hardware.

### Electron checks

- Tree/runtime: PASS, live Preprinted checkbox and comments update actual editor,
  active form node remains, Undo snapshot grows, Close retains latest values;
  tree geometry and visible sources remain stable.
- Multi-object document: PASS, comments and rename persist immediately across
  switches and Close/reopen retains the latest edits.
- Object conditions: PASS, Preprinted remains visible in design, suppressed in
  print preview and raster; conditional source visibility works.
- Position: first combined run timed out with no diagnostic output; isolated
  retry PASS, origins/anchor preserve coordinates, real mouse drag respects Lock
  and moves after unlocking. Retry log: live-position-runtime-retry.log.
- Border: PASS, 34 Dash / 7 Compound menu entries; Browser/Node bitmap comparison
  differing pixels 0 (union 13599). Native preset pixel parity remains unverified.
- Logs: D:/QLabel-agent-work/rea-20261019/live-{runtime,document-runtime,object-runtime,border-runtime}.log.
- Isolated Electron fixtures used; no real print transport sent.

### Final Basic suite

- Command: TEMP/TMP=D:/QLabel-agent-work/rea-20261019 npm run test:basic.
- 800 tests passed, 0 failed/cancelled/skipped/todo; legacy data-sources, print-job
  and smoke stages all exit 0. Report timestamp 2026-10-20T02:02:31.877Z.
- Reports: test/basic-unit-result.json and test/basic-unit-output.log.
  Console log: D:/QLabel-agent-work/rea-20261019/live-basic-final-console.log.
- Earlier full run: 799/800 with ENOTEMPTY while removing a serial test temporary
  directory on C:. No product assertion failed in that run. Full suite rerun on D:
  passed without skipping/changing any assertion.
- git diff --cached --check passed. No hardware printing or complete native
  BarTender interaction/preset equivalence claim.
