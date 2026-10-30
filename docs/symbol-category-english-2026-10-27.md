# Symbol category English label — 2026-10-27

## Request and implementation

The screenshots show the user-imported symbol subset displayed as “กำหนดเอง”.
The source of both its dropdown option and imported-symbol category metadata is
`gui/tis-symbols.js` (`customCategory`). It is now `Custom`. On load, existing
user symbols are assigned the current category name, so persisted Thai category
metadata continues to appear under the English label without a settings rewrite.

Regression coverage: `test/barcode-catalog.test.js` asserts the option label and
value, newly imported category value, and visibility after selecting it.

## REA workflow and scope

- Applied Superpowers `using-superpowers`, `systematic-debugging`, and
  `test-driven-development`; wrote and ran the failing category-label test before
  changing production code, then confirmed the focused tests passed.
- Read `../rea/README.md`, `../rea/docs/mcp-contracts.md` PE resource contract
  (`docs/binary-diagnostics.md#portable-pe-resources`), the installed
  reverse-engineer-anything skill and native/artifacts reference, and
  `docs/rea-bartender-workflow.md`.
- REA checkout: `https://github.com/morluto/rea.git`, revision
  `9341b116efddefc2bcdd8208d27d6e4ea78cc507` (6.8.0 docs); live connected
  MCP package/server version 6.7.0. The MCP contract has no operation-specific
  PE-resource section; the focused operation contract is
  `docs/binary-diagnostics.md#portable-pe-resources`. Connected REA MCP
  server reported its current catalog through `binary_session`; selected
  `inspect_pe_resources` from the live catalog. Its call schema accepts
  `path` and optional bounds (`max_file_bytes`, `max_entries`); invocation
  parameters and the provider were retained in each returned Evidence.
- Inspected the installed BarTender executable and its English resource DLL:
  - `D:/Programs/BarTend.exe`, SHA-256
    `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`,
    Evidence `ev_f9ed9b23f4d554224086ea504d6666da300e7d5c9da3499b907d6b7d3801d9ca`.
  - `D:/Programs/BtEnu.dll`, SHA-256
    `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`,
    Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887`.
- REA observations: the static PE resource inventory found 34 directory records
  in BarTend.exe and 1,483 in BtEnu.dll. The provider leaves payloads opaque
  except icon groups, so it did not establish the native text for this category.
  These results identify inspected artifacts and the bounded resource inventory;
  they are not feature behavior evidence. This is a Q LABEL localization change;
  no BarTender behavior is being reconstructed or claimed equivalent.

## Verification

- RED: `node --test test/barcode-catalog.test.js` failed because the Custom
  category option did not exist.
- GREEN focused: `node --test test/barcode-catalog.test.js test/svg-select.test.js`
  passed 14/14.
- Whole-system `npm run test:basic`: 1,235/1,235 passed across 164 files,
  0 failed/0 skipped; all three legacy checks passed; no undocumented test
  files. Report: `test/basic-unit-result.json` (2026-10-27T02:25:01.572Z).

## Remaining scope

This changes the shown user-imported category to English. Other product
localization is outside this request. Native menu wording, layout, and symbol
selection behavior were not inspected or inferred from opaque resource payloads.
