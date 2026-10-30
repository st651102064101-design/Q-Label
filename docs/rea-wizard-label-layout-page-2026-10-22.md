# Label Layout page preview alignment — 2026-10-22

## Request and mapping

The user asked to make the first attached Select the Label Layout page match BarTender while retaining Q LABEL's UX style and green color theme. The attached screenshot shows Orientation (Portrait/Landscape), Rotated (180°), Screen Layout and Printer Layout choices, and a right-side preview with Template Size beneath it. The preview pane in Q LABEL touched the dialog's right edge; the Side Edges BarTender reference shows a distinct right gutter. `gui/new-label-wizard.js` now gives Select the Label Layout a 198px preview track, a 16px right inset, and aligns the SVG to the pane's right edge while keeping the size text below it. The orientation and both preview-mode choices and the existing Q LABEL theme remain.

## Workflows and REA evidence

- Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, the relevant binary diagnostics reference, REA `README.md` and MCP contracts, and installed REA and Superpowers skills. Applied `using-superpowers`, `brainstorming`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`.
- REA checkout `C:/Users/kkriangkai/projects/Bratender/rea`; upstream `https://github.com/morluto/rea.git`; revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Checked live REA catalog and input schemas for `inspect_pe_resources`, `open_binary`, `search_strings`, and `xrefs`. Used connected MCP tools; no CLI fallback. Providers: REA PE resource parser v1 and Ghidra 12.1.4.
- `D:/Programs/BarTend.exe` SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- `D:/Programs/BtEnu.dll` SHA-256: `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- `inspect_pe_resources` evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a47464f1a4887` identifies the complete 1,468-resource tree. The matching language resource inventory gives Items Per Page resource 6688 (Rows/Columns); it does not identify the Label Layout wizard page's controls or runtime pane coordinates.
- `search_strings` evidence `ev_6ac1073b4b615367bbf1af9f3d7328388baceeaae51dfe9f05bd6c347d5051cf` on `BtEnu.dll` finds “Select a page size and orientation.” at `0x1036bff4`, which supports the page's orientation purpose. `search_strings` for “Screen Layout” (`ev_2bb648ba224c6094324b4a9ad0d429d80033beaab42adb7171f73e1bbe065432`) and “Printer Layout” (`ev_47e1112362147ff890024f6c798892b704c1267d8a808bd8c7bbdf0d2387577e`) returned no Ghidra-defined strings. An `xrefs` query to the orientation text returned no references.
- Limits: the native UI layout page implementation and its preview positioning/runtime behavior remain unconfirmed. Screen/Printer labels are retained per the user-provided Q LABEL screenshot; the sizing and gutter use the user's visual reference and Q LABEL Electron measurements. This change does not claim 100% native pixel parity.

## Test-driven verification

- RED: the first Electron run measured the SVG 12px short of the pane edge and the pane flush with the modal edge.
- GREEN: `npx electron test/wizard-label-layout-runtime.js` passes. It verifies the 198px pane, 14–22px right gutter, right-edge alignment of the SVG and size text, one-line Template Size below the image, and all five layout controls. Screenshot: `test-results/new-label-layout-preview.png`.
- Full `npm run test:basic`: pending.
