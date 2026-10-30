# Editable A4A library import — 2026-10-27

## Scope

The selected A4A Label template now enters Q LABEL as four separate editable
objects: Text 1, Text 2, Data Matrix Barcode 1, and Text 3. The supported scope is
bound to the exact source `.btw` SHA-256. This evidence does not certify the other
477 library BTW files.

The native A4A data-entry form is enabled in the original format. Q LABEL keeps
the original format inventory and PromptValues, but disables the wizard option
and excludes its form at import because control layout, bindings, validation,
and event lifecycle are not implemented. The data-source values remain editable
from the label objects' original shared sources.

## Required workflow and REA evidence

- Applied Superpowers `using-superpowers`, `systematic-debugging`,
  `test-driven-development`, and `executing-plans`; regression cases were added
  before their production fixes. `requesting-code-review` and
  `verification-before-completion` are applied before delivery.
- Read the REA checkout README, the installed reverse-engineer-anything skill,
  the matching native/artifact reference, `docs/rea-bartender-workflow.md`, and
  the applicable `mcp-contracts.md` section. REA checkout upstream is
  `https://github.com/morluto/rea.git`; checkout revision
  `9341b116efddefc2bcdd8208d27d6e4ea78cc507` (docs 6.8.0), connected MCP server
  6.7.0.
- Live REA catalog/schema selected `binary_session` and its `inspect_pe_resources`
  operation when establishing the installed BarTender binary/resource context;
  API feature evidence below was queried from matching retained COM API evidence.
  The inventory operation itself does not prove template import behavior.
- `D:/Programs/BarTend.exe`, SHA-256
  `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Related installed `Interop.BarTender.dll`, SHA-256
  `a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515`.
  Matched REA evidence `ev_91c113ebf3463a919bdc2c10470997286c92d256acf4729f130082f514e4f9f9`,
  parent `ev_be8a50aa120bbfbd8dc6a675d0350236514f8b84ba39c9565019be7b09c55ac6`,
  and method evidence `ev_433ddc7f64a090c9a2106e09b9b891040ddd52052a190ec6368dd60e25ae28db`
  identify `IBtDesignObject` / `IBtFormat` and the original `GetXML`, `SetXML`,
  `GetProperty`, and `ExportToFile` API methods. These signatures explain how
  native objects/XML are obtained and edited; they do not claim full behavioral
  compatibility.

## Feature-matched native findings and implementation mapping

- Source BTW: `test/fixtures/native-a4a/A4A Label.btw`, SHA-256
  `4c4afa8060191968c5d34f06865a029c4f53c25164e14b094e368040be18b783`.
  The source object's native XML export contains exactly Text 1, Text 2,
  BarCode-DataMatrix Barcode 1, and Text 3, plus their ordered source bindings.
  The package builder retains the native XML and IDs while mapping the four
  objects to editable Q LABEL text and barcode elements.
- Native format/source inventories are retained in
  `test/fixtures/native-a4a/{format.xml,data-sources.xml}`. Native page getter
  values are retained in `page-snapshot.json`; they map to the original Letter
  page, 2 columns × 10 rows, 76.2 × 25.4 mm rounded label, margins and gaps.
- Original enabled form `PromptValues` are retained from
  `test/fixtures/native-a4a/prompt-values.xml`. The converter sets the effective
  form disabled and marks it excluded; wizard UI exposes the limitation and
  blocks programmatic re-enabling.
- Native Arial text metrics, exact font SHA and object dimensions come from the
  retained native EMF measurements. The installed Arial file is
  `C:/Windows/Fonts/arial.ttf`, SHA-256
  `b3658eadae55e682b5f69eb64c439c1ecc8f196c0bb8d4756d145d13bc86476a`.
- Original Data Matrix modules and GS1/control characters are retained in
  `test/fixtures/native-a4a/datamatrix.json`. The source-bound profile supplies
  measured 15.8242 × 15.8242 mm fixed geometry and a top-left anchor. An
  isolated native canvas/status-bar observation is recorded at
  `D:/QLabelNativeLibraryFinish-20261027/owned-ui/barcode-anchor-observation.txt`;
  it observed the original barcode's top-left coordinate and X dimension.
  Independent byte decoding checks the original and edited values. Edited
  values are encoded within the measured fixed bounds; BarTender's native
  auto-size quantization is not emulated.
- `scripts/build-a4a-native-package.js` assembles and validates the trusted
  package at `lib/assets/btw-native-packages/<source-sha>.json`. Main-process
  selection loads only that hash-matched package; Finish inserts its original
  object elements and sources. No thumbnail-based object reconstruction occurs.
  The bundled package JSON SHA-256 is
  `5c6d55ecae117479a870e2da0c4a6e3fca99fcb484ea1bfb0f24e93361b8079`.

## Verification

- RED/GREEN native PromptValues whitespace regression: multiline indentation
  initially rejected; converter now allows only whitespace-only text nodes and
  still rejects unknown structure.
- `node scripts/build-a4a-native-package.js` rebuilt the package deterministically
  (124,031 bytes; SHA-256
  `5c6d55ecae117479a870e2da0c4a6e3fca99fcb484ea1bfb0f24e93361b8079`).
- `electron test/a4a-native-import-runtime.js`: production main IPC, wizard
  selection and Finish, shared CAGE edit updating both Text 1 and Data Matrix,
  explicit save, and reopen with all four editable objects. The reopened file
  retains original Forms Enabled and both PromptValues while keeping the form
  excluded from Q LABEL behavior. Uses isolated Electron application data and
  does not use a printer.
- Final `npm run test:basic`: 1,260/1,260 tests passed across 167 files, 0 failed
  or skipped; all three legacy checks passed; no undocumented files. Report
  `test/basic-unit-result.json` (version 1.249; includes concurrent stock-guide tests).

## Limits

- Only the exact A4A source SHA has a bundled complete native-object package.
  All other library templates remain on the existing strict preview-only path
  until object/source/document behavior is verified and admitted separately.
- Native data-entry UI/layout/validation/events are excluded.
- Exact edited Data Matrix auto-size parity, physical printer output, native
  pixel parity, and unsupported font/source/script variants are not claimed.
