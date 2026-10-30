# Preview labels and shape cleanup — 2026-10-21

## Request and scope

Apply the user's reference to every PaperPreview surface: remove margin captions such as “Left 1.89 mm”, reduce preview text to the template size, and show rounded/elliptical label shapes in Layout. The attached screenshots are visual references, not instructions. The user selected “ทุกหน้า preview”.

## Workflows applied

- Read `labelforge/AGENTS.md`, `UNIT_TEST_BASIC.md`, the installed Superpowers `using-superpowers`, `brainstorming`, `test-driven-development`, and `verification-before-completion` skills.
- Classified as a bounded change to existing Page Setup and New Label Wizard previews. Presented the implementation shape and obtained the user's scope selection before implementation.
- Read REA upstream `rea/README.md`, installed `reverse-engineer-anything/SKILL.md`, `rea/.agents/skills/reverse-engineer-anything/references/native-and-artifacts.md`, `rea/docs/mcp-contracts.md` (Managed PE/CLI), and `labelforge/docs/rea-bartender-workflow.md`.
- REA checkout: `https://github.com/morluto/rea.git`, commit `dfe8378cf5a727e3d93d47a5986233175c6ef898`; CLI/server package `rea-agents 6.7.0`.
- Live MCP: 207 tools, tools catalog SHA-256 `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`, combined catalog SHA-256 `96d8f6e6ea1b1ba13557216624a3461c738729d53c79b4b0100d1f3a3a32441c`. `inspect_managed_members` schema accepts `path`, optional `detail`, and exact `type_names`; `inspect_analysis_view` pages retained managed member collections.

## REA artifact evidence and limitation

- Primary installed target `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`, PE x86-64, mixed CLR/native C++/CLI.
- REA `inspect_managed_members` with exact candidate page names `Seagull.Bartender.DocumentWizard.StockSelectionPage`, `Seagull.Bartender.NewDocumentWizard.StockSelectionPage`, and `Seagull.Bartender.UI.StockPreview` returned no types: Evidence `ev_843689e2c0651029ac27bb84801eb85a59f0d130b923e9cf4ce5c888f2a2a39c`. Metadata enumeration was complete, so this is a confirmed unmatched query, not evidence for any rendering behavior.
- Related installed `D:/Programs/Seagull.WizardFramework.dll`, SHA-256 `1a2cba97bf664d69b3a2a3e25bdb1ba4265b39a0c81ae6d93778e081d9fe2cc7`, was checked through retained REA member evidence `ev_05b326db1a274aee0d7c7eb9850c6ca0c867d322c267814dfa003f0a695c4dc9`; the type page `ev_628b34126f79b4a5ea656bf3e9b23036da29ee3593591b0c445447a2328a5387` contains generic wizard framework types and no stock selection or page preview implementation. This framework cannot establish the requested UI details.
- Exact unsupported native question: how the installed BarTender New Document Wizard's stock preview chooses its rounded-corner radius and which size/margin captions it displays in each page preview. The specific wizard implementation is not identified by the available managed metadata and REA's configured Windows native provider does not recover this mixed C++/CLI UI. Screenshots guide the requested Q LABEL design but do not establish native implementation. This change is implemented as user-requested Q LABEL behavior; no 100% BarTender parity claim is made.

## Implementation mapping

- `gui/modal-preview.js`: all non-workspace preview captions now show only `Template Size`; margin measurement labels are removed; verbose section/border/design notes are removed; Layout cells now use the configured rounded radius and preserve elliptical labels. Workspace preview settings are no longer repeated under the image.
- `gui/stock-preview.js` and `gui/new-label-wizard.js`: normalize the caption to `Template Size`.
- `test/page-setup.test.js` and `test/stock-preview.test.js`: assert the concise caption, absent margin labels/extra state text, configured corner radius, ellipse geometry, and consistent units.
- `UNIT_TEST_BASIC.md` records the changed coverage; release metadata is advanced to v1.136.

## Verification

- Red phase: `node --test test/page-setup.test.js` failed on the old “Page Size + Template Size” caption, confirming the new assertion exposes the old behavior.
- Green phase: `node --test test/page-setup.test.js test/stock-preview.test.js` passed: 41 tests, 0 failed, 0 skipped.
- Final `npm run test:basic` at v1.136: 977 tests passed, 0 failed, 0 skipped, all 3 legacy stages passed; 128 discovered unit files, no undocumented files. `git diff --check` reported no whitespace errors (line-ending notices only). Subsequent workspace releases preserve these preview changes.
