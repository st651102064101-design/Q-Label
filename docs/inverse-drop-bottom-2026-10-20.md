# Inverse drop bottom alignment — 2026-10-20

## Request and implementation

When a newly placed Inverse object is dropped over another object, align the
Inverse object's bottom edge with the bottom edge of the object under the drop
point. Keep its horizontal position and user-drawn size. Apply this to sidebar
tool placement and Recently Used Inverse objects. For a pointer draw gesture,
reapply the alignment after sizing so the size commit does not move the bottom
edge. Subtract the document top margin because object coordinates are margin
relative.

The app currently reads `data-hit` from the canvas hit target at pointer-down or
drop. `LabelPreview.computeBoxes` supplies the target's visible bounds, and
`gui/tool-placement.js` computes the Inverse Y coordinate from the target bottom,
Inverse height, and top margin. The ordinary insertion on empty canvas and the
existing initial placement on the label remain unchanged.

## REA workflow and feature evidence

- Skills applied: `using-superpowers`, `systematic-debugging`, and
  `test-driven-development`; regression tests were written first and observed
  failing because `alignInverseToBottom` did not exist.
- REA upstream: `https://github.com/morluto/rea.git`; checkout revision
  `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Live MCP server: REA `6.7.0`, catalog digest
  `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`.
- Read `rea/docs/binary-diagnostics.md`'s Portable PE resources operation
  contract. Checked `binary_session` and the input schema for
  `inspect_pe_resources` (`path`, `max_file_bytes`, `max_entries`). The matching
  shipped resource query returned Evidence
  `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887` for
  `D:/Programs/BtEnu.dll`, SHA-256
  `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- The target executable is `D:/Programs/BarTend.exe`, SHA-256
  `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
  This hash matches existing REA managed-artifact Evidence
  `ev_f9c2b5a64d78847e202e1b1bd173593a2d69c94bb0fc723257046570f9fed610`.
- REA observation: the retained resource record is a static PE inventory. It
  does not identify an inverse drop handler or a bottom-alignment default, so it
  is not evidence for this behavior. Existing managed member analysis reports
  that the executable's metadata representation exceeds REA's 67,108,864-byte
  admission limit. The live Ghidra provider admits native PE targets only and
  rejects this mixed C++/CLI executable; `observe_native_ui` is unavailable on
  Windows. Thus the native drop behavior remains unresolved.
- Implementation mapping: this is the requested Q LABEL default, not a claim of
  confirmed BarTender parity. The implementation uses the existing hit-tested
  target and object geometry; no native behavior is inferred from resource
  names or Q LABEL test results.

## Verification

- `node --test test/tool-placement.test.js`: red observed before implementation
  (2 expected failures: missing `alignInverseToBottom`).
- `test/tool-placement.test.js` also dispatches the real extracted renderer
  pointer gesture over an SVG hit target and checks alignment after the resize
  commit.
- `npm run test:basic`: full result recorded after implementation in
  `test/basic-unit-result.json` and `test/basic-unit-output.log`.
- `electron test/inverse-rendering-runtime.js`: isolated appData runtime checks
  Inverse RGB rendering and object-bottom alignment with top margin. This does
  not execute or establish BarTender behavior. No hardware printing performed.

## Remaining unknowns

BarTender's exact drop target hit-test, stacking order, snap rounding, and
default inverse placement remain unknown until a Windows native UI/behavior
observation or feature-matched method analysis is available.
