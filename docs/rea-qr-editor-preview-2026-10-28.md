# QR object editor preview investigation — 2026-10-28

## Scope

The editor canvas showed QR objects as an outlined square containing the text `QR`.
The requested fix is to render a real QR matrix for an empty QR object in the
design canvas, keep separate objects independently positioned, and never print
the generated design sample when the object has no payload.

## Workflows and REA identity

- Read `labelforge/AGENTS.md`, `labelforge/UNIT_TEST_BASIC.md`, and
  `labelforge/docs/rea-bartender-workflow.md` before implementation.
- Read Superpowers `using-superpowers`, `systematic-debugging`, and
  `test-driven-development`; applied root-cause investigation and RED/GREEN.
- Read the REA skill and its `references/native-and-artifacts.md` target guidance.
- REA checkout: upstream `https://github.com/morluto/rea.git`, revision
  `9341b116efddefc2bcdd8208d27d6e4ea78cc507`; `docs/mcp-contracts.md` read.
- Live MCP catalog: REA `rea-agents` 6.7.0, 207 tools; tool digest
  `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`.
  Read selected input schemas for `inspect_managed_artifact`, `search_strings`,
  `xrefs`, and `analyze_function`.
- `inspect_managed_artifact` on `D:/Programs/BarTend.exe` produced Evidence
  `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`,
  SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
  It identifies the installed application as mixed CLR/native C++/CLI; static
  summary does not resolve its dependency graph or UI behavior.
- Feature-matched shipped native artifact: `D:/Programs/BarCode_QRCode.dll`,
  SHA-256 `dc0328a4e520f1a08d37a5b2ae9dcdc58c12c7957542500fa759991828903eed`,
  x86-64 PE, Ghidra 12.1.4.
- REA `search_strings` Evidence
  `ev_c86c5449b79d5f4fb002c0d71fb8643fb24c4b8c9fed6c07b3d8559bf52360b2`
  observed `GenerateQRCode`, `GetQRCell`, `QR Code Encoder Library`, and
  `QR Code Barcode Encoder` in that DLL. `xrefs` Evidence
  `ev_c7d5dedb6086fc7c63d15c887685a52bb3fae47800728ebd161f95d39b207063`
  observed a reference to the `GenerateQRCode` string at `0x18000abf4`.
  Ghidra did not identify that string-reference address as a procedure, so no
  function implementation or preview rendering semantics are claimed.

## Source finding and implementation mapping

- In Q LABEL `gui/renderer.js`, `qrValuesOf` omitted empty QR payloads, so the
  editor never requested a matrix for them. In `gui/preview.js`, the QR fallback
  emitted a square with `QR` text when the cache had no matrix. This matches the
  screenshot symptom. Independently, `ensureQR` cached `{size:0}` after a failed
  request and would not retry it.
- The editor now requests a single blank-payload QR sample only for its design
  preview; each QR element still renders in its own geometry. Empty QR elements
  in print mode render no artwork, so the sample is not printed. The cache stores
  only valid successful matrices and leaves failures retryable.
- New `test/qr-preview.test.js` first failed for both desired behaviors, then
  passed after the implementation.
- Required `npm run test:basic` passed at package `1.0.257` / display `1.256`:
  1,270/1,270 tests across 168 files, 0 failed, 0 skipped; all three legacy
  stages passed and no discovered test files were undocumented. Report:
  `test/basic-unit-result.json` (2026-10-28T01:38:36.392Z).

## Limits

The actual encoder is Q LABEL's existing `qrcode` package, not a copied or
licensed BarTender binary implementation. REA establishes that the installed
BarTender build ships a QR encoder DLL/export, but does not establish its design
canvas placeholder, exact module dimensions, quiet-zone rules, or pixel parity.
No physical printer or BarTender pixel-diff verification was performed.
