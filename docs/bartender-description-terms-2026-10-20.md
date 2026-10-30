# Description standard terms — v1.046 / 2026-10-20

## Request and design

Restore the existing Description → Use standard term list to the installed
BarTender catalog, preserving captions, alphabetical ordering, repeated captions,
None/custom/standard modes, and OK/Cancel. Existing Properties live commit applies
accepted description metadata immediately. Description does not replace source
values or alter printed data. This is a bounded correction within the previously
approved Properties scope; no new wizard or dependency is added to the app.

## Artifact identity and REA

REA CLI 6.7.0, source revision dfe8378cf5a727e3d93d47a5986233175c6ef898.
All artifact hashes below were recomputed on 2026-10-20.

| Artifact | SHA-256 |
|---|---|
| D:/Programs/BarTend.exe | 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3 |
| D:/Programs/BtEnu.dll | c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b |
| C:/Windows/Microsoft.NET/assembly/GAC_64/BarTender.Managed/v4.0_12.1.0.1__109ff779a1b4cbc7/BarTender.Managed.dll | f32a25aee51846c2a33fcaa20f42dd23eee38554b2c172608efb3ce0fd12f389 |

The original managed assembly was located from the installed application's loaded
BarTender.Managed native-image module and the corresponding GAC_64 directory.
Module inventory was read-only shell inspection, separate from REA.

Commands used the existing installed CLI at
D:/QLabel-agent-work/npm-cache/_npx/a1722018f28f9df2/node_modules/rea-agents/scripts/rea.mjs:

- inspect-pe-resources D:/Programs/BtEnu.dll --json
  - ev_0f2ace1a3fe946142aacdbd75414f5255a491f981130b0f37fb3254653be40dd
  - description-resources-evidence.json, portable PE resource parser; resource
    payload ranges/hashes support independently decoding RT_STRING blocks.
- inspect-managed-members <GAC BarTender.Managed.dll> --type BarTender.Managed.Forms.DataSourceDescriptionForm --json
  - ev_ebeb8e3928c75c744ca9dd12125e035a21554c5fcb3213950e76acca4ebdf8ef
  - description-managed-form-evidence.json, complete selected-type coverage.
  - InitListBoxDescriptionStringList token 0x060013f5 orders the dictionary by
    display value and binds it to the list box; OK writes selected resource ID.
- inspect-managed-members <GAC BarTender.Managed.dll> --type '<>c' --json
  - ev_3a3acf1b7f88a5712bc1e793e581f2fbe99475be01d15ea0356cca2171f4a62b
  - description-filter-evidence.json: lambda 0x060018e4 reads Value (sort key),
    0x060018e5 reads Key, and 0x060018e6 reads Value.
- Inspecting DataSourceDescriptionForm in BarTend.exe matched no declaring type:
  it is an external type reference. Whole-module/executable member inspection
  reached REA's 64 MiB metadata representation budget and returned unavailable,
  not a complete analysis. The successful GAC form analysis supplies that scope.

Saved evidence files reside in D:/QLabel-agent-work/rea-20261019/.

## Supplemental static reconstruction (not REA tool output)

- Decoded English RT_STRING payloads using their authenticated REA resource
  ranges; every selected resource ID resolves in BtEnu.dll.
- Used REA's shipped readManagedPeLayout/readManagedMetadataLayout library for
  scoped metadata offsets; no target code was loaded or executed.
- The mixed native/CIL dialog bridge loads ResourceIdMap.GetResourceIdMap,
  method 0x060031b8 (RVA 0x29bc20). Its native initializer at RVA 0x29bc50
  iterates 16-byte entries: UTF-16 resource-symbol pointer plus numeric ID,
  ending at null pointer / -1. Table starts at RVA 0x11b6f50.
- A task-local Capstone decoder (installed only under the D: analysis directory)
  disassembled this initializer. This is supplemental static analysis, not a
  configured REA native provider and not an application dependency.
- description-disasm.py, description-resource-map.json and description-strings.json
  preserve the extraction chain. The table has 416 unique resource IDs.
- CIL near file offset 6595370 loads each localized string, ignores empty values,
  and matches #US token 0x700005b7: ^[a-zA-Z_$].* before adding descriptions.
  Applying this exact admission rule to English resources leaves 396 entries.
- Sorted captions using .NET Framework en-US StringComparer, matching the
  installed English list's observed prefix. Kept all 396 resource identities:
  391 distinct captions, with five repeated captions from separate native IDs.
- Q LABEL stores accepted description text, not the native resource ID. Repeated
  captions therefore have the same stored description while remaining listed.

## Native UI corroboration (Computer Use, separate from REA)

Read the existing Description form's accessible visible rows, including the first
13 supplied in the screenshot and subsequent Amount/Area, Baby/Batch and
Certification/Component entries. These agree with the extracted sorted catalog.
This is not a runtime enumeration of all 396 rows. Stopped controlling the window
when user activity was reported; no native Description OK, save or print action
was invoked. The application's document was not used as a test fixture.

## Implementation and executable checks

- Replaced the 13-caption partial array in gui/object-data-sources-ui.js with the
  frozen 396-caption catalog. Preserved unrelated pre-existing edits in that file.
- test/fixtures/bartender-description-terms.json records every native resource ID,
  symbolic key and caption, plus the English resource artifact hash.
- TDD: the new DOM test first failed 13 !== 396, then passed exact list/order,
  repeated captions, Year acceptance/reopen, Cancel, and unchanged source output.
- Focused command: node --test test/source-wizard.test.js test/object-data-sources-ui.test.js
  passed 81/81. Logs: description-red.log and description-focused.log in D: task dir.
- Electron: node_modules/.bin/electron.cmd test/source-description-runtime.js
  passed with an isolated profile: exact 396 rendered options, actual keyboard
  End selects Year, accepted metadata commits to the real editor immediately,
  Close/reopen restores the selection, Cancel retains Year and source stays SOURCE.
  Log: D:/QLabel-agent-work/rea-20261019/description-runtime.log.
- No real printer transport was sent. Complete native row-by-row runtime order,
  non-English catalogs and packaged EXE deployment are not claimed verified.

### Final verification

- TEMP/TMP=D:/QLabel-agent-work/rea-20261019 npm run test:basic: PASS.
- 801/801 tests passed; 0 failed/cancelled/skipped/todo.
- Legacy data-sources, print-job and smoke stages all exit 0; inventory complete.
- Report timestamp 2026-10-20T02:22:50.508Z; test/basic-unit-result.json and
  test/basic-unit-output.log, console description-basic-console.log in D: task dir.
- git diff --check and git diff --cached --check passed.
