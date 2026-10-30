# Restore wizard previews — 2026-10-22

## Request and cause

The user explicitly asks to restore the missing preview in Stock Selection and Items Per Page. Q LABEL `render()` applied `hidden=true` on steps 1/2 and CSS forced a single-column layout plus `display:none` on their asides. These conditions were introduced for a previous full-width form layout. The latest request supersedes those visibility assertions. Screenshots are reference data, not instructions.

## Required workflows

Read project AGENTS and UNIT_TEST_BASIC; apply Superpowers using-superpowers, systematic-debugging, TDD and verification-before-completion. This is a bounded restoration with explicit desired behavior. Read REA README, installed skill, native-and-artifacts reference, MCP tool-result contract, and project BarTender workflow. REA upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`, live package 6.7.0. Checked live MCP catalog and `inspect_pe_resources` input schema (`path`, optional bounded `max_entries`/`max_file_bytes`); used defaults.

## Feature-matched evidence

- Starting installed target `D:/Programs/BarTend.exe`, current SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; unchanged from the previous resource survey.
- Implementing language resource DLL `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`. REA `inspect_pe_resources` Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887` establishes the complete 1,468-resource tree, original ranges and hashes.
- Dialog resource 6676: file offset 1190144, length 952, RVA 1197312, SHA-256 `a52f174b17289ed47b70cce6be81b8a38e1595eb7024c125521b5156dd294483`. External read-only UTF-16 decoding of the REA-identified payload finds the Stock Selection help text, custom/predefined radios, Category, Stock name, and `Preview Area *** Do Not Translate ***`. This matches the requested stock page feature.
- Dialog resource 6688: offset 1197648, length 880, RVA 1204816, SHA-256 `a1ab3873fd63de869ba9c743332166d618ce45dbc2af1e81974ad78035a86d7e`. External UTF-16 decoding matches Items Per Page, Single/Multiple and Rows/Columns; it does not establish a preview control or native runtime visibility. Adding its preview is the user's Q LABEL requirement, not a native parity claim.

The REA resource records establish shipped static controls. Conditional visibility and native runtime drawing remain unobserved; no native runtime behavior is inferred from Q LABEL tests.

## Implementation and verification

- `gui/new-label-wizard.js`: remove the two-page hide rule in CSS and render; use responsive form/220px preview columns, stacking in narrow viewports. Retain stock artwork and the shared label-count renderer, passing the selected stock's shape/corner radius into shared previews so circles/rounded labels persist on Items Per Page.
- `test/printer-resolution.test.js`: update obsolete hidden assertions to visible, assert 6 preview labels for 2×3 and 1 after switching to Single. Red phase failed the original hidden condition; green phase passes all 23 cases.
- `test/wizard-preview-runtime.js`: actual module/CSS integration passes custom/predefined visibility, circle stock selection, single/multiple cell counts, side-by-side geometry at 900px and available preview at 600px. Actual screenshots inspected: `test-results/new-label-stock-preview.png` and `new-label-items-preview.png`. Isolated profile; no user document or printer output.
- Version v1.146, Thai changelog and basic checklist updated. Final whole-suite output is recorded in `test/basic-unit-result.json` and `test/basic-unit-output.log` after completion.

The circle-on-Items regression initially failed because the shared preview template lacked label_shape; passing the existing catalog shape fixes the renderer without changing saved stock geometry. Both the 23-test wizard unit batch and isolated Electron runtime pass after this correction.

Full-suite fixture maintenance: concurrent shortcut work made the production preload register an IPC listener. The Save As fixture supplied invoke/sendSync only, causing `ipcRenderer.on is not a function` in its 40 cases. It now uses a real Node EventEmitter for on/removeListener; all Save As assertions are preserved and its 40 tests pass. No application Save As behavior was changed.

The source-dialog shortcut fixture likewise now supplies the existing onNewShortcut bridge dependency. Its batch with page-gap and inventory policy passes all 50 tests. Newly added `test/new-document-shortcut.test.js` is documented in the basic inventory. The earlier in-flight full runs observed concurrent files before these dependency/inventory updates and are superseded by the final run.

The isolated `wizard-preview-runtime.js` passes actual rendering checks. The separate Windows-driver integration `printer-resolution-runtime.js` timed out after 20 seconds waiting for driver IPC and is not claimed passed; no printer output was sent. Its obsolete hidden-preview expectations were updated to the requested visible state.

Final `npm run test:basic` on current v1.149 passed 995 tests, 0 failed/cancelled/skipped, all three legacy stages passed and no undocumented test files. Report `test/basic-unit-result.json`, detail log `test/basic-unit-output.log`. The preview restoration release entry is v1.146 and remains included with subsequent concurrent releases. Isolated preview runtime passed custom/predefined visibility, actual circle on Items Per Page, 2×3 and single geometry, plus compact visibility. Scoped whitespace check passed (line-ending notices only).
