# BarTender printer selection tools — 2026-10-21

## Workflow and evidence

- Read and applied `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, the installed REA workflow and native-artifact reference, Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`.
- REA checkout: `C:/Users/kkriangkai/projects/Bratender/rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`. Connected REA MCP used; REA managed static provider v1. Relevant operation contract and current input schema were read from `rea/docs/mcp-contracts.md` and the live `mcp__rea__inspect_managed_members` catalog.
- Shipped main artifact `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` (identity checked; it is mixed native/managed C++/CLI and not itself the feature evidence).
- Related installed assembly `D:/Programs/Seagull.PrinterSetup.dll`, SHA-256 `370f0a891dc283a5a653c965f8d01f8986f3bfaf8dcefe3ec40fe8bdba704496`, MVID `569b72c8-6e05-4b2d-86fb-ab0653e9cb57`. REA `inspect_managed_members` Evidence `ev_67a6c28b4a31358fc5405cf808b6b63d72fa92c4487282bab5454ed3ef48e7d2`, exact selected type `Seagull.PrinterSetup.PrinterSetupUtility`, no unmatched names.
- Feature-matched native findings: `ShowPrinterPropertiesDialog(string)` loads `printui.dll,PrintUIEntry /n"{0}" /p`; `ShowPrintingPreferencesDialog(string)` loads `printui.dll,PrintUIEntry /n"{0}" /e`; each invokes `System.Diagnostics.Process.Start`. This evidence directly establishes separate printer properties and printing preferences commands. It does not establish the screenshot's overall wizard layout, property dialog pixels, or every vendor driver's available tab.

## Implementation mapping

- `gui/new-label-wizard.js`: the printer control is a single-choice list with eight visible rows; right-side actions call the existing `window.zebra.printerProperties({name, preferences})` bridge. Document Properties sends `preferences: true` (`/e`), Printer Properties sends `false` (`/p`). Existing main-process code validates the installed queue before opening Windows UI.
- `test/printer-resolution.test.js`: checks visible row count, single selection, retained selected queue, and both exact bridge payloads.
- `test/printer-resolution-runtime.js`: checks actual installed printer selection, eight-row list and both buttons, alongside existing DPI/stock checks; does not invoke an external driver window or print.
- `UNIT_TEST_BASIC.md` inventory/checklist updated in the same change.

## Verification and limitations

- Focused DOM unit: `node --test test/printer-resolution.test.js` — 14 passed, 0 failed.
- `npm run test:basic` — latest full run before final release bump: 960 passed, 0 failed, 0 skipped; all three legacy basic scripts passed. Report: `test/basic-unit-result.json`; assertion log: `test/basic-unit-output.log`.
- Electron runtime: `npx electron test/printer-resolution-runtime.js` — passed installed printer DPI, eight-row list/actions, stock selection and stale-main guidance. The intentionally removed IPC handler logs the expected no-handler message; Electron also logged a GPU shutdown diagnostic after the pass result.
- Native `printui` dialogs are supplied by the selected Windows printer driver. Tabs and controls vary by installed driver; Q LABEL does not synthesize BarTender's proprietary driver tabs, so exact dialog content and pixel parity remain unverified.
