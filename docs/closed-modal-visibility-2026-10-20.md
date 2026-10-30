# Closed modal visibility — 2026-10-20

## Workflow and native evidence boundary

Applied Superpowers using-superpowers, systematic-debugging (trace CSS cascade, reproduce before fixing), test-driven-development (red/green), verification-before-completion. Read project instructions, whole-system checklist, REA README, MCP retained-evidence contract, native-and-artifacts reference and BarTender workflow.

REA checkout origin https://github.com/morluto/rea.git, revision dfe8378cf5a727e3d93d47a5986233175c6ef898, package 6.7.0. Verified installed D:/Programs/BarTend.exe SHA256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.

Checked connected MCP catalog and get_evidence_bundle input schema. Queried summary with operation=open_binary and exact target hash: 4 retained records total, zero matching records. This is evidence discovery, not feature evidence. Reused the matching footer investigation limitations in rea-modal-footer-2026-10-20.md: member Evidence ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d failed the 67,108,864-byte metadata representation limit; native Windows UI capture unsupported. The user explicitly authorized source fixes when native analysis cannot resolve modal behavior. Native modal parity remains unverified; no unmatched query is treated as feature evidence.

## Root cause and implementation

The global .modal-footer-pinned rule forced display:flex!important onto every registered dialog, overriding Chromium's closed-dialog display:none. These closed dialogs exposed their fields/footers together, consistent with the supplied screenshot. The new regression failed with flex !== none before the fix.

Added dialog:not([open]) { display:none!important } to the shared modal stylesheet. This preserves open footer flex layout and suspended dialog behavior, while making closed native dialogs invisible. Updated the old footer-layout fixture to be explicitly open, so it tests visible footer layout rather than accidentally depending on the bug.

## Verification

- node --test test/modal-windows.test.js: 12 passed, zero failed/skipped.
- electron test/modal-closed-visibility-runtime.js: direct and nested-form fixtures both hidden; actual Chromium open/close has a visible box only while open. Uses isolated temporary appData, no printer transport.
- npm run test:basic: 837 passed, 0 failed, 0 skipped; all three legacy stages passed; undocumentedFiles empty. Report test/basic-unit-result.json (v1.067).
- electron test/modal-free-resize-runtime.js: passed actual Properties resize and usable-content assertions.
- git diff --check: passed.

These source and Electron results are Q LABEL verification, not recovered BarTender observations.
