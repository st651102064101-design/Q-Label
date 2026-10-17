# Object Data Sources verification checkpoint

2026-10-18. Work in progress against the approved object-data-sources plan.
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
- The isolated Electron source runtime checks two objects, ordered sources, a shared
  named link, one-entry Properties undo, Undo/Redo, actual Save/Reopen in an isolated
  profile, cancellation and equality of preview and prepared print values.
- A disposable native Text Properties dropdown was observed with all nine type
  labels in BarTender 12.1.0, including Binary and Picture. This corrects the earlier
  seven-type assumption from help. Native selection did not persist through the
  automation attempts, so this is list-visibility evidence only.
- JSON phrase files validate own phrase/language entries and reject files over
  16 MB. This is the Q LABEL JSON adapter, not Data Builder compatibility.
- Character insertion replaces the current selection with actual control characters
  or validated Unicode scalars, preserves CR/LF during subsequent edits, and rejects
  stale-source writes. The isolated Properties runtime inserts GS and verifies parent
  cancellation. Font subsets, recent symbols and native private-use NUL conventions
  remain unverified.
- Change Type has a staged wizard with Cancel/Finish and revision guards. Replacing
  the source kind clears prior type options and transforms as the installed
  `Data_Source_proc_changeType.htm` specifies; shared source identity is retained.
  The existing quick dropdown uses the same reset rule.
- Name assignment, rename and removal have a staged wizard with duplicate-name,
  cancellation and revision checks. Shared object references retain their IDs.
  Explicit named file paths, offsets and suppression references follow renamed names
  atomically; removing a name still used by these dependencies is rejected. Script
  and token-expression name dependencies remain incomplete.
- Explicit fraction precision modes implement the help's nearest-quarter and
  nearest-1/999 rules. Native defaults and the remaining precision options have
  not been measured.

These checks establish the listed Q LABEL behaviors. They do not establish complete
BarTender compatibility. An implementation test is not a reference comparison.

## Outstanding requirements before claiming 100%

| Area | Work still required |
|---|---|
| Reference replay | Record disposable reference fixtures and compare every control, default, validation result and transform order. COM XML probes which did not modify a source are not golden evidence. |
| Source management | Staged New Source creation, Cancel/Finish, named links, control/Unicode insertion and nested GS1 cancellation/revision guards are covered. Full native wizard replay, symbol-font/subset/recent UI, private-use NUL conventions and complete named-source conflict behavior remain. |
| Clipboard | External library dependencies and script/name references across documents; full side/page/save/reopen runtime fixtures. Current collisions are imported under a unique suffixed name. |
| Date/Time | Time-only input, full parsing/locale/calendar/pattern matrix and offset boundary semantics. |
| Numeric types | Native precision/rounding, fraction approximation and dependent controls. |
| Binary/Picture | Object-level byte concatenation and binary catalog input now have regression coverage. A 00FF1D fixture covers native QR/Data Matrix explicit-byte encoding and matching canvas/ZPL raster bytes; complete symbology/reference comparisons remain; embedded/BLOB/object picture inputs and unavailable desktop codecs remain. |
| Transforms | Native allowed-type matrix and order; complete filter masks/regex/warnings, conditional expression editor and cascaded suppression reference comparisons, range validation and search/replace import/export. Basic neighbor suppression is covered against the help's stated rules. |
| Library Phrase | Proprietary Data Builder library integration, languages, identity/version conflicts and lifecycle. Document-local/JSON phrases are implemented separately. |
| Table Data Field | Actual data-bound table-cell contexts and native row lifecycle. A generic row lookup alone is insufficient. |
| Printer Clock | Real clock query or printer-side evaluation, supported font constraints, warnings and script restrictions. Explicit Windows/omit/abort fallback is covered without hardware. |
| Serialization | Complete reset/event/data-change/quantity settings, export policy, state portability and user recovery from unknown outcomes. |
| VBScript | Complete measured BarTender events/object model, dynamic named dependencies, setters and precise source locations. Current bridge is a subset. |
| GS1 | Full source-preserving wizard behavior, allowed symbologies and independent decoding/reference comparison for all supported AI combinations. |
| Hosts | CLI dry-run and server preparation now use async source inputs; temp-file freshness and mock transport serial outcomes are covered. Full HTTP/watch/export reference replay and settings/state portability still require verification. |
| Hardware | Actual printer output, device font glyph coverage and clock behavior. Physical printing requires user authorization. |

## Verification records

The current basic suite report is `test/basic-unit-result.json`; detailed assertions
are in `test/basic-unit-output.log`. Check its timestamp and code state before
using it. Intermediate runs are retained in the ignored plan execution workspace.
Runtime command: `npx electron test/object-data-sources-runtime.js`.

Overall parity remains **incomplete** until these requirements have both an
implementation and valid comparison evidence. No count of green implementation
tests is used as a substitute for that evidence.
