# Fit barcode width and modal controls — 2026-10-20

## Workflow applied

- Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`: traced the Auto Fit handler and dimensions consumed by preview, added failing DOM regression cases, then implemented the smallest supported size-field updates and reran the focused tests.
- REA upstream: `https://github.com/morluto/rea.git`, checkout `dfe8378cf5a727e3d93d47a5986233175c6ef898`, package/CLI release `6.7.0`. MCP was available, so no CLI fallback was used. The live tool catalog and input schemas were checked for `inspect_managed_artifact` and `inspect_managed_members`.
- Read `README.md`, `docs/mcp-contracts.md`, `references/native-and-artifacts.md`, and `docs/rea-bartender-workflow.md` before implementation.

## REA artifact observations and limitation

- Artifact: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`, 21,010,848 bytes, x86-64 mixed C++/CLI PE; MVID `ca045b3f-f077-4eb2-959f-78487b4d60d1`.
- `mcp__rea__inspect_managed_artifact(path, detail: summary)` returned Evidence `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789` (retained source `ev_f9c2b5a64d78847e202e1b1bd173593a2d69c94bb0fc723257046570f9fed610`). It confirms PE/CLI identity and no embedded managed resources, but explicitly does not load, decompile, resolve dependencies, or execute target code.
- `mcp__rea__inspect_managed_members(path, detail: summary)` returned Evidence `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d`. Managed-member analysis was unavailable because metadata representation exceeded the 67,108,864-byte budget at offset 7,953,088. It returned zero inspectable members, which is not evidence that the feature is absent.
- Consequently REA could not identify a BarTender Auto Fit method/control or establish its precise algorithm. No BarTender parity claim is made; this change follows the Q LABEL source behavior and user-provided expected behavior. The application control-spacing change is also source/UI behavior, not a recovered native fact.

## Source diagnosis and mapping

- In `gui/object-properties.js`, the former catch-all barcode branch always wrote `module_width`. Catalog barcodes are `image` objects whose rendered bounds use `width_mm`; QR bounds use `width_mm`; Data Matrix bounds use `magnification`; only linear barcode bounds use `module_width`. Therefore the button could update an unused property and leave visible size unchanged. QR/Data Matrix also lacked the Auto Fit page.
- The handler now writes the dimension consumed by each supported renderer. Catalog barcode preview/commit re-encodes and updates height from bitmap aspect ratio when `auto_fit_width` is enabled. Linear and Data Matrix dimensions use a one-module measurement and floor to a size that does not exceed Maximum width. The measurement now uses the same source candidate/data as the active draft; the Electron probe showed measuring old data could choose 2 dots (30.78 mm) for a 22 mm maximum when the current content's one-dot width was 15.39 mm. QR uses the selected width directly. Every path requests a fresh preview.
- In `gui/modal-windows.js`, floating dialog SVG controls were packed with a 2px CSS gap. The requested visual spacing is now 8px; control count, size, order, and lifecycle are unchanged.

## Verification

- `node --test test/object-properties-pages.test.js`: 15 passed, 0 failed. New assertions click the actual Auto Fit button for a catalog barcode, QR, and Data Matrix; check the persisted dimensions, barcode image aspect ratio, and rendered preview width.
- `node --test test/modal-windows.test.js` before CSS change: 10 passed, 1 failed as expected (`2px !== 8px`). After CSS change it is included in mandatory `npm run test:basic`.
- `electron test/fit-barcode-width-runtime.js`: passed in an isolated appData profile; actual linear barcode fits 15.39 mm under a 22 mm maximum, and actual catalog barcode is 42 mm with image aspect ratio preserved and an SVG preview present. No print transport is used.
- `electron test/modal-free-resize-runtime.js`: passed; floating Properties still resizes, maximizes/restores and keeps navigation/close usable.
- `npm run test:basic`: 836 unit assertions passed, 0 failed, 0 skipped; three legacy stages (`data-sources.js`, `print-job.js`, `smoke.js`) passed; `undocumentedFiles` is empty. `git diff --check` passed.
- No physical printer output or live BarTender comparison was performed.

## Remaining unknowns

- BarTender's exact internal fit policy, rounding bounds, and catalog/2D-specific width rules remain unverified due the managed metadata limit and unavailable native decompilation evidence.
- The source test confirms Q LABEL model and preview updates in its isolated DOM fixture; it does not claim printer hardware measurement or exact pixel comparison against BarTender.
