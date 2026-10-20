# Layers Hide/Show — v1.056

User asks to verify Hide and fix it if broken. Reproduced in an isolated full Electron application: clicking Hide set `enabled=false` and changed the Layers button to Show, but artwork remained visible.

Cause: `drawEditorCanvas` passed all element indices as the explicit enabled list to `LabelPreview.renderPreviewSVG`, overriding the element's enabled flag. It also built editor overlays for every element. The canvas now supplies only enabled indices and filters interaction boxes with the same flag. The Layers toggle/model semantics and print renderer are unchanged.

Verification: `test/editor-visibility.test.js` checks actual renderer helper behavior for mixed text/barcode/image/box enabled states and stable original indices. Full-app `npx electron test/layer-hide-runtime.js` failed before the fix with `Hidden artwork still visible`, then passed actual Hide/Show button clicks for text and barcode128, model changes, absent hidden artwork/hit/selection overlays and restored artwork. Uses isolated appData, no print transport.

This is a Q LABEL consistency repair. Existing REA artifact context is documented in `layer-panel-dock-2026-10-20.md`; retained DataSource metadata does not establish native Hide semantics. No BarTender behavior parity claim or native runtime test is made.

Full npm run test:basic: 818 passed, 0 failed/skipped/cancelled; all three legacy stages passed. Report: test/basic-unit-result.json; assertions: test/basic-unit-output.log.
