# Text caret resize and scroll investigation — 2026-10-20

## Scope

Q LABEL's canvas text editor should restore the insertion caret after resizing the
selected text object and keep the editing overlay aligned with its glyph while
the canvas scrolls. This is source behavior requested for Q LABEL; no claim of
BarTender parity is made.

## REA workflow and native evidence

- Applied the installed Superpowers workflows `using-superpowers`,
  `systematic-debugging`, `test-driven-development`, and
  `verification-before-completion`.
- REA checkout: upstream `https://github.com/morluto/rea.git`, revision
  `dfe8378cf5a727e3d93d47a5986233175c6ef898`; REA MCP package/server 6.7.0.
  Live catalog digest: `96d8f6e6ea1b1ba13557216624a3461c738729d53c79b4b0100d1f3a3a32441c`.
- Read the REA README, the managed-artifact contract, and selected MCP schemas.
  Invoked `inspect_managed_artifact` on `D:/Programs/BarTend.exe` through REA.
- Artifact SHA-256:
  `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
  REA Evidence: source `ev_f9c2b5a64d78847e202e1b1bd173593a2d69c94bb0fc723257046570f9fed610`,
  summary view `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`.
- REA classifies this artifact as `mixed-clr-native` / `cpp-cli-mixed`, x86-64.
  The identity and metadata evidence does not establish caret or scrolling
  behavior. The live REA catalog reports native UI scenario capture as
  unsupported on this Windows host (the operation requires macOS). The project
  workflow also records that Windows Ghidra does not admit this mixed target.
  Therefore no feature-matched native runtime evidence was available; the exact
  unsupported question is how BarTender's caret and glyph overlay behave during
  resize and viewport scrolling.

## Source root cause and mapping

- `focusTextProperty` represented the live editor as a fixed-position overlay,
  but clamped its screen `left` and `top` to zero. When the SVG glyph scrolled
  above or left of the viewport, the overlay stopped following its actual
  coordinates.
- The document-level outside-pointer handler blurred and removed the editor as
  soon as a resize handle was pressed. The resize completion path redrew the
  canvas but did not reopen text editing or preserve the collapsed caret index.
- Q LABEL now positions text and barcode editor overlays at the un-clamped screen
  coordinates. A collapsed caret is captured only for a resize handle belonging
  to that text or barcode object and is restored after the gesture redraw. Range
  selection and other objects do not trigger restoration.

## Verification

- `node --test test/canvas-text-caret.test.js`: confirmed the new caret-capture
  test failed before implementation; after implementation, 4 passed, 0 failed.
- Electron `test/canvas-text-caret-runtime.js`: 8 rotation/zoom caret cases
  passed, including a real resize gesture restoring the same collapsed caret and
  a scroll-to-bottom case where the glyph moves above the viewport while the
  editor remains at the glyph's transformed coordinates.
- Electron `test/barcode-inline-runtime.js`: barcode resize restored caret index
  3, scroll-to-bottom kept the live number editor aligned to its HRI glyph, and
  Escape restored the pre-edit barcode value.
- `node --check gui/renderer.js` and `git diff --check`: passed.
- `npm run test:basic`: 857 passed, 0 failed, 0 skipped; legacy checks 3/3 passed;
  inventory gaps 0. Reports: `test/basic-unit-result.json` and
  `test/basic-unit-output.log`.

## Limitations

REA metadata and Q LABEL runtime tests are not BarTender feature evidence. The
native behavior remains unknown, and BarTender-equivalent behavior is not
claimed.
