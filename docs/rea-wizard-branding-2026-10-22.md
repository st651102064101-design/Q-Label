# New Document Wizard header artwork — 2026-10-22

## Title alignment follow-up — v1.145

The user requested left-aligned title text/icon and removal of the icon background. Applied Superpowers using-superpowers, systematic-debugging, TDD and verification-before-completion within this authorized CSS adjustment. Re-read the project gate/checklist, REA README/contracts, installed REA native-artifact reference and BarTender workflow. Artifact hashes below were rechecked. The previous resource Evidence was absent from the live retained catalog, so connected MCP `inspect_pe_resources({path:"D:/Programs/BtEnu.dll"})` was rerun after checking its live input schema. Provider `rea-pe-resources` v1 returned the same Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887` and bitmap 2225 payload coordinates/hash. This resource establishes banner identity, not native title alignment; the current alignment is the user's custom Q LABEL requirement.

Source investigation found centered flex alignment and a white CSS background with 2px padding on `.nw-brand-icon`. The embedded PNG already has transparent corners. `gui/new-label-wizard.js` now gives the header 4px left padding, aligns `.nw-window-title` left, and removes the icon's white plate/padding/radius. The SVG asset is preserved. The runtime test first failed at 207.56px left offset/white background, then passed at both viewport widths with shared modal controls loaded. Captured images were visually inspected. Whole-suite results are reported in `test/basic-unit-result.json` and the task response.

The user requested the illustrated header on every initial template setup step, using the supplied Zebra and ABSS logos. The header uses the reference composition and custom Q LABEL branding.

## Workflow and tool identity

Read/applied project AGENTS + UNIT_TEST_BASIC, Superpowers using-superpowers, brainstorming (bounded existing UI), test-driven-development and verification-before-completion. The user's `continue` authorizes continuing the requested header change. Read the REA README, installed skill, native-and-artifacts reference, MCP resource contract, and project BarTender workflow.

REA upstream `https://github.com/morluto/rea.git`, checkout `dfe8378cf5a727e3d93d47a5986233175c6ef898`; active MCP `rea-agents 6.7.0`, 207 tools. Catalog tools digest `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`. Checked live `inspect_pe_resources` schema: absolute `path`, optional `max_entries` and `max_file_bytes`; used default budgets. No provider installation or target mutation.

## Feature-matched shipped evidence

| Artifact | SHA-256 | REA Evidence |
|---|---|---|
| `D:/Programs/BarTend.exe` | `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` | `ev_f9ed9b23f4d554224086ea504d6666da300e7d5c9da3499b907d6b7d3801d9ca` |
| `D:/Programs/BtEnu.dll` | `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b` | `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887` |

`inspect_pe_resources` reports complete resource coverage: EXE 26 resources/59 entries, language DLL 1,468 resources/2,950 entries. EXE has no header bitmaps; BtEnu.dll contains the wizard banner family (2180, 2208, 2209, 2210, 2225, 4781).

Matched feature: RT_BITMAP (type 2), name 2225, language 1033, resource index 225, RVA 3195768, source file offset 3188600, payload 27704 bytes, SHA-256 `02398837480537ef5e527e8811b808261cce35c45f91b79291b9eb94ae22aea6`. Reading its DIB header gives 444×60, 8-bit indexed. REA establishes the resource coordinates/hash; the DIB rendering and visual comparison below are separately labeled external analysis.

External read-only analysis: original resource bytes were wrapped with a BMP header and decoded through System.Drawing to `D:/QLabel-agent-work/rea-wizard-header-20261022/header-2225.png`. Visual inspection matches the user reference: white left fade, teal numeric/barcode background, overlapping barcode labels/card/disc on the right. Other family members were decoded to the same directory to distinguish the exact composition. No installed files were changed.

## Implementation mapping

- `gui/assets/branding/new-document-banner.svg`: 444×60 SVG reference composition, vector barcode/card/disc/printer drawing, original supplied Zebra logo embedded as PNG data. It does not reuse the native bitmap in product assets.
- `gui/assets/branding/abss-mark.svg`: preserves the original supplied ABSS logo as embedded PNG data. Source SHA-256 `894b2ba56c2515d77675231894e6e4f11f712c6aa68bbcf55b1a24c238ce144e`; Zebra source SHA-256 `a3236f3caf975cad35287645ecd420a2cc4668feeb7ce8b01af8849398bab3e7`.
- `gui/new-label-wizard.js`: ABSS icon in the title, one shared decorative banner behind the step title/description, compact layout scales the whole composition. Retains Q LABEL controls and footer.
- `test/printer-resolution.test.js`: header and accessible identity persist across all seven steps. Red phase failed because the banner did not exist; green phase passed after integration.
- `test/wizard-branding-runtime.js`: actual local asset decode and header geometry in isolated Electron at 900/600px; both captures inspected visually.

## Limits and verification

Native resource evidence establishes the banner artwork, not native runtime positioning under all display scaling settings. The custom Zebra printer drawing/branding is requested Q LABEL artwork. Logos remain embedded original raster images inside SVG containers; the surrounding composition is vector.

Targeted header unit passed (1/1). Electron runtime passed all 7 steps and both viewport sizes, screenshots in `test-results/wizard-branding-900.png` and `wizard-branding-600.png`. No printer output or user document was changed.

The initial full suite exposed an existing table test instrumentation problem: `editCell` deliberately bakes once on entry to hide the original text under the editor, but the typing test counted that opening bake as per-character work. It then failed before blur and kept a JSDOM editor timer alive. The test now compares counter deltas after opening and closes fixtures unconditionally in `afterEach`; all original no-per-character/one-commit assertions remain. Its normal 10-test run passes and exits without force-exit. Final fresh basic suite result is recorded in `test/basic-unit-result.json`.

Concurrent project-printer work also added a dependency to the real `selectTemplate` function used by the Save As fixture. `test/save-as-end-to-end.test.js` now installs the production ProjectPrinterSelection module and actual applyProjectPrinter renderer function, rather than leaving an undefined function or stubbing its behavior. The printer, Save As, table and wizard regression batch passes 76/76 with no skipped tests. Inventory for the newly added project-printer test is present in UNIT_TEST_BASIC.

Final fresh verification on v1.143: `npm run test:basic` passed all 979 tests (0 failed/cancelled/skipped), all three legacy stages passed, 130 unit files discovered and 0 undocumented files. Report: `test/basic-unit-result.json`; full assertion log: `test/basic-unit-output.log`. Scoped `git diff --check` passed with line-ending notices only. Package and lock versions agree at 1.0.143; this task's changelog entry remains v1.141, followed by the concurrent v1.142/v1.143 changes.
