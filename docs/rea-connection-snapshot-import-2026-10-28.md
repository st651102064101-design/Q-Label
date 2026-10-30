# Connection snapshot import — 2026-10-28

Continuation of the approved database wizard plan. Applied Superpowers using-superpowers, executing-plans, TDD (observed failing snapshot test before implementation) and verification-before-completion. REA README, operation contracts and native/artifacts reference consulted.

REA checkout: https://github.com/morluto/rea.git at 9341b116efddefc2bcdd8208d27d6e4ea78cc507 (checkout package now 6.8.0; retained producer evidence is 6.7.0). Live MCP catalog and inspect_analysis_view input schema checked. Connected operation queried retained ImportExportXML members, parent ev_ddcc3fdf1c4f41f935e8874aa4f95f665267e2f588003260b4cf3e8965e35c31, view digest 2233688b936967daf98e472d400c228abc051dbfb9f0c1010a3ae27dcaac4327.

Installed D:/Programs/Seagull.Data.Configuration.dll SHA-256 rechecked: 58a455d3e46cbbfbcd71c0ce0a1ac6d9a87e66297d67fbacfd964bf75ab4cf56. The retained selected type is Seagull.Data.Configuration.Utility.ImportExportXML, with ImportFromFile/ExportToFile/ValidateXML. Native import validates and deserializes DatabaseSetup XML. Earlier matching evidence and limitations are recorded in the database investigation bundles referenced by docs/database-provider-coverage.md.

Native XML import is unresolved: no native accepted/exported fixture establishing record selection, aliases, filters and joins. This change deliberately does not reconstruct those unsupported semantics. Q LABEL's existing Database Manager exports its own ZebraBarConnection version 1 JSON envelope. The newly enabled wizard choice imports its table snapshots only, explicitly described in the catalog and XML rejection message. This is Q LABEL functionality, not verified native parity.

Mapping: catalog enables the JSON picker; database-import validates envelope/version/table names/column schema and normalizes rows; provider-registry enables file read/refresh. The existing staged wizard field selection, commit and rollback remain in use. No original credentials, native configuration, joins or filters are restored from the envelope.

Verification: snapshot test observed RED before production changes. Targeted database setup/file-provider/catalog run: 50 passed, 0 failed/skipped. Rebuilt browser bundle. Electron test/database-provider-runtime.js --import passed with generated real JSON file through production picker IPC, field commit, changed-file refresh, explicit save and disk reopen in an isolated profile. The initial runtime attempt exposed a stale browser bundle; rebuilding resolved it. Whole-system basic suite result recorded below after completion. Real cloud/vendor database authentication remains outside this fixture verification.

Review: fresh-context reviewer found that valid snapshots may contain empty tables. Added a failing mixed populated/empty table test, then preserved empty table schemas. Targeted setup tests now 45/45 passing. No other important findings in scoped review.

Final npm run test:basic: PASS, version 1.279, 1342/1342 tests across 172 files, 0 failed, 0 skipped; all legacy stages passed; undocumented files 0. Report test/basic-unit-result.json at 2026-10-28T09:25:20.974Z.
