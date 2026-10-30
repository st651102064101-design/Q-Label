# Stock catalog and Stock Selection preview — 2026-10-21

## Request and workflow

Match every category and stock name from the installed BarTender build and restore the right-hand preview shown in the supplied Stock Selection references. Applied Superpowers using-superpowers, systematic-debugging, test-driven-development and verification-before-completion: trace selection/data/preview/Finish, reproduce missing shape and wrong order with failing assertions, fix the underlying mapping, verify actual Electron rendering. The existing wizard flow is retained; this is a correction to its catalog/selection/preview behavior.

Read application AGENTS, UNIT_TEST_BASIC, REA workflow, checkout README and MCP contracts (tool result/resource operation contracts), installed REA skill and native/artifact reference. REA checkout origin https://github.com/morluto/rea.git, revision dfe8378cf5a727e3d93d47a5986233175c6ef898. Live MCP binary_session reports rea-agents 6.7.0 and inspect_pe_resources available; checked its exact path/max_entries/max_file_bytes schema before calling it. No target execution or changes to installed artifacts.

## Installed identities and matched evidence

- D:/Programs/BarTend.exe SHA256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.
- D:/Programs/BtEnu.dll SHA256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b.
- D:/Programs/mfg.stk SHA256 20f82371999919980c4bf1d1803d3841b27115848a0fb069047400cc6b5eae0f; installed alongside the executable, stock format v4 with explicit manufacturer/type, shape, thousandths-of-inch dimensions, margins, rows/columns and gap settings.

Connected MCP `inspect_pe_resources({path:"D:/Programs/BtEnu.dll"})` returned complete resource inventory Evidence **ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887**. Feature-matched dialog 6676, language1033, resource index694, offset1190144 length952, payload SHA256 a52f174b17289ed47b70cce6be81b8a38e1595eb7024c125521b5156dd294483. External UTF16 payload decoding at that exact REA range observes: stock explanation, Specify custom settings, Use a predefined stock, Category, Stock name and Preview Area. Save Stock dialog2080 at1139720/420 confirms category/name terminology. Compact resource record: stock-selection-resource-evidence-2026-10-21.json. REA establishes resource identity/ranges; decoded strings and mfg.stk parsing are separately labeled external file analysis, not decompiled native behavior.

## Findings and implementation

- Both old and installed catalogs contain54 categories/7350 records. Old data omitted Shape/Corners/Hole/manual-gap metadata. Importer now preserves every row, including two duplicate names. ADES AG45404 has two different dimensions, so selecting by name alone was ambiguous; wizard selection now uses the actual selected row.
- Source dimensions are .001in increments. Example ADES AG040312fo is3149×1574mil, or79.9846×39.9796mm; Advanced Labeling .75" Circle is750×750mil, or19.05×19.05mm, Shape1. Catalog source names remain exact, including literal inch quotes.
- Automatic spacing fills remaining page extent. Circle2up has1875mil page width, two750mil labels,62+63mil margins, leaving250mil gap. Explicit manual gaps remain explicit.
- Old browser locale numeric collation put01.000x... before1" Circle, contradicting supplied native list. Token comparison now matches the visible .75" Circle variants,1" Circle variants,01.000x... sequence. Other native locale/printer-dependent ordering remains unobserved.
- `scripts/import-bartender-stocks.js` reproducibly generates catalog data from the installed source. `scripts/audit-bartender-stocks.js` compares every packaged record with every parsed source record, retaining duplicates. Audit result54/7350, missing0, extra0, changed0.
- `gui/stock-preview.js` renders the selected stock with correct physical proportions, rows/columns/spacing, circle/ellipse outlines, CD holes, blue shaded roll illustration and template-size caption. It avoids the generic Layout preview's automatic width expansion and unrelated margin/debug annotations. Rounded rectangle sketch and roll shading are reconstructed from supplied native screenshots; exact default corner radius is not inferred as a physical measurement.
- `gui/new-label-wizard.js` uses dedicated preview on predefined Stock Selection, preserves explicit label geometry on Finish (`manual_template:true`), saves ellipse/shape metadata, and keeps page millimetres and integer counts independent of selected input units. Numeric dimension validity permits repeating fractional inch gaps; count validation still requires integers.
- `gui/index.html` loads the dedicated preview before the wizard. Other concurrent wizard steps (Items Per Page/Side Edges) are preserved.

## Verification and limitations

Focused tests: stock-catalog, stock-preview, printer-resolution. RED: missing circle metadata/preview; later CD-hole assertion also failed before its fix. GREEN includes exact source circle dimensions, reference name order, CD holes, inch conversion before/after stock selection, counts and page dimensions on Finish.

Isolated Electron runtime `test/stock-preview-runtime.js` uses real wizard/catalog/preview modules, checks54 named categories/7350 stocks, visible197px preview, equal circle radii and both ADES45404 heights101.981/24.9936mm. Captured D:/QLabel-agent-work/stocks-20261021/stock-circle.png and visually inspected the actual rendered screenshot. No user's document or printer is used.

Whole basic suite result is recorded after execution. Full source catalog equality does not establish all-stock pixel parity, printer filtering, RFID artwork, default native corner behavior or physical printing. Source0 rectangle sketch rounding is illustrative; source raw flags are retained for future native verification. CD hole is represented in this selection preview and retained in stock metadata; downstream artwork clipping around a physical hole is not implemented by this change.
