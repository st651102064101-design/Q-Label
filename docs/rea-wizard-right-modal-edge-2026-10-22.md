# New Document Wizard right modal edge — 2026-10-22

## Request and workflow

The user reported a white strip along the right edge of the New Document Wizard modal. Applied Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`; read `labelforge/AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, `rea/README.md`, the installed REA skill and `references/native-and-artifacts.md`. The REA checkout is upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.

## REA evidence and limits

- Installed target: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Related English resource assembly: `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- Live REA MCP server `rea-agents` 6.7.0; tool catalog digest `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`, 207 tools. Checked live schema for `inspect_pe_resources({path, max_file_bytes?, max_entries?})` and invoked it on `BtEnu.dll`.
- Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887`, provider `rea-pe-resources` v1, reports a complete static resource inventory (2,950 entries examined, 1,468 resources). It identifies Printer Selection resource 6673 (payload offset 1,188,312, 438 bytes, SHA-256 `02a46ee403d8158107e3fa46a2600b83d312214ec5a4fb7cc9933315067aee5d`) and Stock Selection 6676 (offset 1,190,144, 952 bytes, SHA-256 `a52f174b17289ed47b70cce6be81b8a38e1595eb7024c125521b5156dd294483`).
- The REA checkout does not contain an operation-specific prose contract for `inspect_pe_resources`; its active tool catalog schema was checked. The static resource inventory identifies the relevant wizard pages, but cannot establish rendered background coverage, right-edge spacing, or runtime layout. Native pixel parity therefore remains unknown.

## Diagnosis and mapping

The existing CSS already removed right padding/margins from edge panels, but did not explicitly size the dialog's direct `header` and `form` to the modal's inner width. `gui/new-label-wizard.js` now sets both to `box-sizing:border-box;width:100%`, preserving the existing zero-right-gutter rules. This makes the title bar and complete form surface explicitly cover the dialog content width. In the isolated Electron fixture, the header, form, heading, body and footer right edges align with the modal's inner border; the Printer list remains usable at both normal and compact viewport widths.

## Verification

- TDD red: the new assertion in `test/project-home.test.js` failed before the explicit full-width rule because the expected header/form coverage rule was absent. It passed after the CSS change.
- `npx electron --disable-gpu test/wizard-preview-runtime.js`: PASS on current v1.165; checks measured right-edge alignment, 604×466 modal, all seven wizard pages, footer/preview behavior, and printer list at 900px and 600px host widths. The .75-inch circle preview is 19.05×19.05 mm; its runtime assertion matches the catalog geometry. No native printer was used.
- `npm run test:basic`: PASS on current v1.165; 132 unit files, 1,004/1,004 passed, 0 failed/cancelled/skipped, 0 undocumented files; all 3 legacy stages passed. Report: `test/basic-unit-result.json`.
