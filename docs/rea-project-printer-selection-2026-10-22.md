# Project printer selection — 2026-10-22

## REA workflow and feature evidence

- Applied the project's REA + Superpowers gate, including `using-superpowers`, `brainstorming` (bounded design approved by the user), `systematic-debugging`, and `test-driven-development`. Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, the REA README, the installed REA skill and managed artifact reference, and the managed member operation contract.
- REA checkout: `C:/Users/kkriangkai/projects/Bratender/rea`; upstream `https://github.com/morluto/rea.git`; revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; CLI package `rea-agents 6.7.0`. Connected MCP was available, so no CLI fallback was used. The live catalog and `inspect_managed_members` input schema were checked; provider `rea-dotnet-static` v1 supplied feature analysis.
- Installed application `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`. Retained managed summary Evidence `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789` confirms the same artifact identity and static-only limits; it does not recover the project printer behavior from this mixed-mode application.
- Related installed SDK assembly `D:/Programs/Seagull.BarTender.Print.dll`, SHA-256 `301ba773fe7869e8ece9b0b2629a3afd1303af1c9df36bb68a2b7ca4ec0495ef`, MVID `1874caa6-c829-474a-beb7-3d7bf1a732b7`. REA Evidence `ev_d962ae234170f3d1f23c73e7b577e513f9f1bc1fb99c0d0bf26826452c47e790` inspected exact types `LabelFormat`, `LabelFormatDocument`, `PageSetup`, and `Printer` (no unmatched types). `LabelFormatDocument` exposes Save/SaveAs in this scoped result; it did not establish how the BarTender UI chooses or persists a printer per project. The inspected document class fields also did not expose a printer selection field. This is a scoped static finding, not proof that the wider application never stores one.
- Native behavior still unknown: whether BarTender remembers printer choice per file, globally, or through another project/document layer. The user approved per-project memory as Q LABEL behavior; no BarTender parity claim is made.

## Q LABEL implementation and verification

- Root cause: renderer startup persisted a single `settings.printer`. `selectTemplate()` did not restore a printer associated with the selected project.
- Added `settings.projectPrinters`, keyed by template file. Opening a project restores its installed printer; if absent or unavailable, Q LABEL uses the app's saved printer, then the first installed printer. Changing the main printer selector records both the global fallback and active project's preference. New Label inherits the active selection and records the chosen printer against the created template.
- Feature mapping: `gui/project-printer-selection.js`, `gui/renderer.js`, and `gui/new-label-wizard.js`; unit behavior in `test/project-printer-selection.test.js` and `test/printer-resolution.test.js`; isolated Electron round trip in `test/new-project-runtime.js`.
- Focused units: `node --test test/project-printer-selection.test.js test/printer-resolution.test.js` — 26 passed, 0 failed.
- Electron: `npx electron test/new-project-runtime.js` — 25 checks passed. Uses a temporary appData profile and fixture printers; no physical print or user document.
- Basic Suite command and results are recorded after the full run. Remaining unknown: BarTender's own persistence scope and behavior are not established by the static SDK evidence above.
