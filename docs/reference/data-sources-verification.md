# Object Data Sources verification checkpoint

2026-10-17. Work in progress against the approved object-data-sources plan.
Reference installation: BarTender 12.1.0, `D:/Programs/BarTend.exe`.
Reference help: `D:/Programs/Help/BarTender.chm`.

## Evidence obtained

- Source registry, ordered references, migration, cycle diagnostics and transactional
  edits have executable unit coverage. Duplicate and clipboard tests cover object
  identity before rendering and independent unnamed source definitions.
- File preparation reads actual temporary files. VBScript tests execute Windows
  Script Host, including Unicode, named source access, runtime errors and timeout.
- Serialization tests exercise durable reservations, concurrent jobs, preview
  without consumption, uncertain transport results, character sets and the help's
  cross-job interval example. No physical print is involved.
- Character Template tests use the installed help's examples. SVG and ZPL tests
  separate HRI from encoded bars. Catalog tests exercise real bitmap generation.
- The isolated Electron source runtime checks two sources, Properties cancellation,
  and equality of preview and prepared print values.

These checks establish the listed Q LABEL behaviors. They do not establish complete
BarTender compatibility. An implementation test is not a reference comparison.

## Outstanding requirements before claiming 100%

| Area | Work still required |
|---|---|
| Reference replay | Record disposable reference fixtures and compare every control, default, validation result and transform order. COM XML probes which did not modify a source are not golden evidence. |
| Source management | Full native source/name/type wizards, special characters, named-source conflict choices and nested dialog cancellation. |
| Clipboard | External library dependencies and script/name references across documents; full side/page/save/reopen runtime fixtures. Current collisions are imported under a unique suffixed name. |
| Date/Time | Time-only input, full parsing/locale/calendar/pattern matrix and offset boundary semantics. |
| Numeric types | Native precision/rounding, fraction approximation and dependent controls. |
| Binary/Picture | Exact object-level byte propagation and encoding in each symbology; embedded/BLOB/object picture inputs and unavailable desktop codecs. |
| Transforms | Native allowed-type matrix and order; complete filter masks/regex/warnings, suppression neighbors, range validation and search/replace import/export. |
| Library Phrase | Proprietary Data Builder library integration, languages, identity/version conflicts and lifecycle. Document-local/JSON phrases are implemented separately. |
| Table Data Field | Actual data-bound table-cell contexts and native row lifecycle. A generic row lookup alone is insufficient. |
| Printer Clock | Real clock query or printer-side evaluation, supported font constraints, warnings and script restrictions. Explicit Windows/omit/abort fallback is covered without hardware. |
| Serialization | Complete reset/event/data-change/quantity settings, export policy, state portability and user recovery from unknown outcomes. |
| VBScript | Complete measured BarTender events/object model, dynamic named dependencies, setters and precise source locations. Current bridge is a subset. |
| GS1 | Full source-preserving wizard behavior, allowed symbologies and independent decoding/reference comparison for all supported AI combinations. |
| Hosts | Async source preparation across CLI/server/export entry points, not only desktop print preparation. |
| Hardware | Actual printer output, device font glyph coverage and clock behavior. Physical printing requires user authorization. |

## Verification records

The current basic suite report is `test/basic-unit-result.json`; detailed assertions
are in `test/basic-unit-output.log`. Check its timestamp and code state before
using it. Intermediate runs are retained in the ignored plan execution workspace.
Runtime command: `npx electron test/object-data-sources-runtime.js`.

Overall parity remains **incomplete** until these requirements have both an
implementation and valid comparison evidence. No count of green implementation
tests is used as a substitute for that evidence.
