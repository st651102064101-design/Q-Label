# Object Values tree and barcode HRI inline editing

Date: 2026-10-20

Scope: object-value rows in the Insert sidebar and inline editing of barcode human-readable text (HRI).

## Required process applied

- Read the project `AGENTS.md`, `UNIT_TEST_BASIC.md`, and `docs/rea-bartender-workflow.md` before changes.
- Applied Superpowers systematic debugging and TDD: added a regression first, confirmed the existing Electron runtime failed because the HRI hover cursor was unset and the Object Values click was intercepted, then changed the renderer and added isolated unit/runtime coverage.
- Used the approved design: per-type SVGs, object-value click selects its canvas object, category headers only expand/collapse, retain drag-to-bind; barcode HRI edits in place with transparent background, stable baseline, I-beam hover, and glyph-height caret.

## REA target and evidence

- REA checkout: `C:/Users/kkriangkai/projects/Bratender/rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; installed CLI version 6.7.0.
- Primary shipped target: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Managed support artifact used for targeted metadata inspection: `C:/Windows/Microsoft.NET/assembly/GAC_64/BarTender.Managed/v4.0_12.1.0.1__109ff779a1b4cbc7/BarTender.Managed.dll`, SHA-256 `f32a25aee51846c2a33fcaa20f42dd23eee38554b2c172608efb3ce0fd12f389`. It is the BarTender.Managed support assembly for the installed build; it resides in the GAC, outside `D:/Programs`.
- Related installed assemblies inspected: `D:/Programs/Seagull.Editors.Metadata.dll` SHA-256 `5b86d86f05e7c66de4ff63dd3d864c3a3932a2476de06efea8c359f7f548b111`; `D:/Programs/Seagull.Editors.RichText.dll` SHA-256 `d66b4bb0cbfcf18336b9b8b16a91c2be9b28163bb1840fe29827d85c2128d5d9`; `D:/Programs/Seagull.Svg.dll` SHA-256 `92f68e8c5409e6a7d5b76ba65038a000dff3af2471a1c8f3a7ceeb4ca41cf15e`.
- REA selected-type metadata evidence `ev_bb7fc2b38650c876e551577e9e9a686e7499a6eafc63fab504d571ba0ff615e9` matched `BarTender.Managed.ConditionalPrinting.SingleConditionControl.DataSourceItem` (display name, field name, field type) and `BarTender.Managed.RichTextSimpleEditor` (text-changed/lost-focus handlers). These are not the Data Sources tree or barcode HRI UI, so they were not treated as direct behavior evidence.
- REA PE resource inventory for `BarTend.exe`: `ev_f9ed9b23f4d554224086ea504d6666da300e7d5c9da3499b907d6b7d3801d9ca`. It enumerated bounded PE resources, but opaque resources do not identify the required UI interactions.
- Managed metadata inspection of `BarTend.exe` was blocked by its representation size (over the tool's 64 MiB budget): `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d`, related to `ev_fc5b…`.
- REA follow-up `trace_feature` searches for “Human Readable Text” and “Object Values” returned `provider_unavailable`: Ghidra was not configured, Hopper/IDA were unavailable, and the Windows native provider did not work. Native UI capture is unsupported on this host; BarTender was not running. This left native click, hover, caret, and layout behavior unobserved.

## Native observations, inferences, and unknowns

- The user-provided screenshots show Object Values with object labels and a richer native data-source hierarchy, and demonstrate the desired immediate object selection. Screenshots are request references, not REA evidence.
- The metadata findings above are adjacent to data sources/text editing, but do not prove this tree or inline HRI interaction. No native parity claim is made.
- Unknown: exact native BarTender tree expansion/default icon paths, whether HRI is entered through a native overlay or another editor, and its pixel-level baseline/caret measurements.

## Implementation mapping and verification

- `gui/object-value-tree.js`: uses type-specific inline SVG paths, keeps the existing object label, maintains selected state, and forwards an object-row click to the canvas selection callback.
- `gui/renderer.js`: decorates the actual Data Sources Object Values rows and binds selection. Excludes those rows from the capture-phase Insert-placement click handler; drag events still carry the existing `object.<index>` field payload. Canvas selection refreshes the sidebar selected state. The fallback list also includes all text-bearing objects.
- `gui/renderer.js` barcode editor: anchors the transparent input to the rendered SVG alphabetic baseline, hides the original glyph without covering the paper, measures the click caret by glyph advances, paints a custom caret from actual glyph metrics, and changes the hover cursor only over the HRI text.
- `gui/index.html`: loads the tree helper before the renderer and styles its compact SVG/selected row.
- Regression evidence: `node --test test/object-value-tree.test.js` passed 3/3; `npx electron test/hri-object-values-runtime.js` passed against real sidebar rows, SVG types, click-to-select, category expansion, HRI cursor/background/baseline/caret and live barcode updates in isolated appData. `npm run test:basic` passed 823/823 unit tests and all three legacy source/print/smoke stages; no print jobs were sent.

Native parity is not verified. The implementation follows the approved Q LABEL behavior and screenshot requirements while retaining the native evidence gaps above.
