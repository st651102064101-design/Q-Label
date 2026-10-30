# Multiple database connections — 2026-10-28

Continuation of the approved database plan, Task 6. Applied Superpowers using-superpowers, executing-plans, TDD, systematic-debugging, requesting-code-review and verification-before-completion. Read project AGENTS/UNIT_TEST_BASIC, REA README, native/artifacts reference, workflow and MCP contracts; checked live operation schemas. Existing dirty feature branch codex/properties-all-pages retained to preserve shared work, rather than moving unrelated changes into a worktree.

REA upstream https://github.com/morluto/rea.git, checkout 9341b116efddefc2bcdd8208d27d6e4ea78cc507. Connected managed metadata MCP used; returned analysis-view projection version 1. Checkout package is 6.8.0; the projection receipt does not establish the connected underlying producer package version. Installed identities rechecked:

- D:/Programs/BarTend.exe SHA-256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.
- D:/Programs/Seagull.Data.Configuration.dll SHA-256 58a455d3e46cbbfbcd71c0ce0a1ac6d9a87e66297d67fbacfd964bf75ab4cf56.

Initial retained DTO query was unavailable in this session; imported existing special-format bundle, then selected the correct implementing type using prior feature inventory. Ran inspect_managed_members(path, type_names=[Seagull.Data.Configuration.ConnectionDialog.ViewModels.DatabaseSetupDialogViewModel], detail=summary). Matched type, no unmatched names. Parent ev_60794c8368931f2017c1e6071884e18266281233f27f3d8e7ea8db06d3506133; summary ev_31a8c59145bd377ae03c89b36d5d0f25fcb3644619d7279160234fa18e57a264. Queried fields/methods through inspect_analysis_view, evidence ev_092c1d1f865bb9e690c927fd139f413c0138125310fba0a8b9401677b459d17c and ev_118f4914c54d0fdce0e98207ec370cccc4cf3000af6da0c4082fea4ad44b1c14.

Feature observations: RecordSetNodes collection, SelectedRecordSetItem, ActiveRecordSetName, CanDeleteRecordSet, CanCreateNewRecordSet; methods CreateNewRecordSet, DeleteRecordSet, RefreshRecordSet, ReplaceRecordSet, AddRecordSetNodes and SelectConnectionPageForRecordSet. This supports separate create/select/delete/refresh operations. Static metadata does not establish exact native clicks, geometry, persistent ID representation or cross-provider joins.

Mapping and rulings:

- lib/database/connections.js owns immutable migration, commit, selection, deletion and field ownership. Q LABEL stable IDs implement the approved project requirement; native persistent-ID parity is not asserted.
- database_connections is canonical; database_connection remains a selected compatibility projection for older consumers. Legacy migration preserves existing field names and object tokens, without mutating the input.
- Add explicitly appends; replace uses selected ID. Field/table IDs survive refresh and table reorder by name. Duplicate IDs and cross-connection field names are rejected; labels retain independent names for colliding imported columns.
- Deletion leaves an unavailable field marker, never an implicit link to another connection. Referenced missing fields fail resolution; unused missing fields do not prevent surviving designs from printing. Sidebar delete/rename/category conversion update ownership.
- Selected connection drives record count. Other auto bindings pair by matching row index; fixed row bindings are supported. Print rows include all bindings before range/copy selection. An unavailable secondary row is reported. This is positional pairing, not a relational join or native join-parity claim.
- Versioned source evaluation reads current owned legacy bindings rather than stale copied rows. Preview preparation cache includes all connection rows for the current record.

Verification: observed failing migration/add/consumer/unused-deleted/versioned-stale tests before their implementations. Targeted setup/manager/connections/source/UI run: 107 passed, 0 failed/skipped. Fresh scoped reviewer identified unused deleted-field print blocking and category-conversion ownership; both addressed with regression cases. Rebuilt browser bundle. Isolated Electron real CSV test passed add without replacement, record range/copies, selected-file refresh, actual disk save/reopen and selected deletion. Runtime fixture initially clicked while native file disposal was pending, and observed Delete before its async wrapper resumed; corrected waits for actual readiness, retaining production behavior. Full suite result appended after completion.

Limitations: cloud/special-format/native XML providers still pending as recorded in coverage. No real external server, physical printing, native visual comparison or cross-provider join verification. No user application/documents closed, no drivers installed.
