# Side Edges page layout — 2026-10-22

## Request and root cause

The user clarified that the requested reference is the BarTender **Side Edges** page, with the Side Edges heading, while retaining Q LABEL's green style. The preceding work had tuned Step 4, **Select the Label Layout**, because the prior response showed that page. In Q LABEL, Side Edges is Step 6. Before this fix, Step 6's preview pane measured 180px wide and reached to 1px from the dialog's right edge; Step 4 had a separate 198px pane and 16px inset.

## Workflows and REA evidence

- Read and applied `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA `README.md`, installed reverse-engineer-anything skill and relevant artifact guidance, REA MCP contract, and Superpowers `using-superpowers`, `brainstorming`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`.
- REA upstream: `https://github.com/morluto/rea.git`, checkout `C:/Users/kkriangkai/projects/Bratender/rea`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; connected server package 6.7.0, Ghidra 12.1.4.
- Checked live REA catalog and selected schemas for `inspect_pe_resources`, `search_strings`, `open_binary`, and `xrefs`; used connected MCP operations, no CLI fallback.
- `D:/Programs/BarTend.exe` SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Related installed resource DLL `D:/Programs/BtEnu.dll` SHA-256: `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- `inspect_pe_resources({path:"D:/Programs/BtEnu.dll"})` Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a47464f1a4887` observed a complete static PE resource inventory (1,468 resources / 2,950 entries); payloads other than icon groups are opaque under that operation.
- Ghidra `search_strings({pattern:"Side Edges",mode:"literal"})` Evidence `ev_566fa4c709ed816add33a0ac44df08b292cff28f6ef8b98250a286ecef0ee589` found the native title at `0x1036c0f8`. `xrefs({address:"0x1036c0f8"})` Evidence `ev_7086ea5b79441c5a510be59e86795f3b254bbf02e8845ed653cc2a6d0f984eb7` returned no references. Focused strings searches for “unused material” and “Width of Unused Area” did not find matches in Ghidra's defined string inventory. This confirms the page title only; it does not identify the page's owning control resource or establish native runtime layout.
- The supplied screenshot is the visual reference for controls and positions. It shows Yes selected and 0.05 in for Left and Right; the runtime fixture selects that state to compare the displayed layout without changing the app's initial default behavior.

## Implementation and verification

- `gui/new-label-wizard.js`: keep the page at Step 6 with the **Side Edges** heading, retain the blue gradient preview pane and green Q LABEL theme, increase the pane from 180px to 198px, preserve a 16px dialog inset and align the SVG and Template Size caption at the pane edge.
- `test/wizard-side-edges-runtime.js`: drives the real Electron wizard to Step 6 in an isolated profile, selects Yes and inches, verifies both 0.05 in fields, preview visibility, pane dimensions and caption alignment, and saves `test-results/new-label-side-edges-preview.png`. No print job is sent.
- TDD RED: before the CSS change, runtime measured Step 6 pane width 180px and a 1px right gutter; it failed the 190px minimum assertion.
- TDD GREEN: `npx electron test/wizard-side-edges-runtime.js` passes; measured pane width 198px, dialog-to-pane gutter 17px, preview right edge 735px, caption below the image, and heading Side Edges.
- `npm run test:basic` on v1.204: passed 1,041/1,041 unit tests, 0 failed, 0 skipped; all 3 legacy checks passed. Report: `test/basic-unit-result.json`.
- Broader `npx electron test/wizard-preview-runtime.js` currently fails its hard-coded page sequence: the live wizard contains an added **Printed Item Shape** page before Summary, while that runtime script still expects the former eight-page list. The focused `wizard-side-edges-runtime.js` passes; the broad script was left untouched because the additional page is outside this request.

## Limitations

The REA evidence is static and title-focused. Native control resource association, exact control dimensions, runtime interaction details, and BarTender preview coordinates remain unconfirmed. The implementation uses the user's screenshot for those visual details; it does not claim pixel-perfect native parity.
