# Windows printer enumeration — 2026-10-22

## Request and scope

Show all printers discovered by Windows in the Q LABEL New Document Wizard, following the attached BarTender printer-selection screenshot. Windows queue enumeration is shared by settings and print selection as well.

## Workflows applied

Read and applied the installed `using-superpowers`, `systematic-debugging`, `test-driven-development`, and `reverse-engineer-anything` workflows, plus `labelforge/AGENTS.md`, `labelforge/UNIT_TEST_BASIC.md`, and `labelforge/docs/rea-bartender-workflow.md`. Read the REA checkout `README.md`, `docs/mcp-contracts.md`, `docs/managed-code-analysis.md`, and the native/artifact reference. REA checkout upstream: `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`, version 6.7.0. The active catalog exposed `inspect_pe_resources` and `inspect_managed_members`; the selected input schemas were checked before calls.

## Feature-matched REA evidence

- `inspect_pe_resources` on `D:/Programs/BtEnu.dll`; SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`; Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887`. The complete static PE resource inventory identifies the Printer Selection wizard page resource. Resource bytes do not reveal runtime enumeration code.
- `inspect_managed_members` on `D:/Programs/Seagull.BarTender.Print.dll`; SHA-256 `301ba773fe7869e8ece9b0b2629a3afd1303af1c9df36bb68a2b7ca4ec0495ef`; Evidence `ev_fe2f4b2c4f568397ea3fd6cba99961b9f66a24080fb95c9ad3d81e1ada97998b`. Exact selected type `Seagull.BarTender.Print.Printer` matched; its metadata exposes printer name/model/port properties, not Windows queue discovery. The candidate collection type was not established as the native queue enumeration implementation.
- `D:/Programs/BarTend.exe`; SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`. It is mixed C++/CLI, and REA managed metadata is constrained by a 64 MiB representation limit. Native list-population logic was not recovered. The attached screenshot supports what the user wants the visible list to contain but is not implementation evidence.

## Source finding and implementation mapping

`gui/main.js` already runs Windows `Get-Printer | Select-Object -ExpandProperty Name`, but filtered its output to names matching `/zebra/i`. The filter was the reason common queues and virtual printers disappeared. `lib/windows-printers.js` now trims names and removes empty lines without narrowing by make, so every discovered queue flows into the existing IPC and the Printer selectors. No print language or raw print transport behavior was changed.

## Verification and limitations

`test/windows-printer-enumeration.test.js` covers AnyDesk, HP Universal, Microsoft Print to PDF, OneNote, PDF, ZDesigner, and Zebra names, plus trimming and empty lines. `npm run test:basic` passed 1008/1008 Node tests, all 3 legacy checks, with zero undocumented test files; see `test/basic-unit-result.json` and `test/basic-unit-output.log`. This verifies the parsing/filter path, not enumeration against a separate Windows machine, native BarTender behavior, driver configuration dialogs, or successful printing to every queue. No full native parity claim is made.

## Alphabetical ordering follow-up — v1.172

Read the current workspace instructions and the Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development` skills; read the REA reverse-engineering skill and its relevant artifact/managed-analysis references. The REA MCP catalog was inspected with `binary_session`; `inspect_pe_resources` and `inspect_managed_members` input schemas were checked. Rechecked installed artifact hashes: `BtEnu.dll` `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`; `Seagull.BarTender.Print.dll` `301ba773fe7869e8ece9b0b2629a3afd1303af1c9df36bb68a2b7ca4ec0495ef`; `BarTend.exe` `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.

The same REA feature records remain scope-matched to Printer Selection: `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a47464f1a4887` identifies the static page resource in `BtEnu.dll`; `ev_fe2f4b2c4f568397ea3fd6cba99961b9f66a24080fb95c9ad3d81e1ada97998b` inspects exact type `Seagull.BarTender.Print.Printer` and its properties/events. Neither exposes the wizard's comparator. `BarTend.exe` is mixed C++/CLI and still exceeds REA's 64 MiB member-representation limit. User screenshot order is the visible reference, not REA implementation evidence.

TDD: added the shuffled Windows queue regression first and observed it fail with the original source order; then implemented case-insensitive natural alphanumeric sorting in `lib/windows-printers.js`. Expected rows are AnyDesk, HP, Microsoft, OneNote, ZDesigner, Zebra ZT411, Zebra ZT610. The BarTender-only `Default (currently …)` display entry is not emitted because the Windows API supplies installed queue names and the requested change is their order. Final verification: `npm run test:basic` on current v1.174 passed 1,010/1,010 unit tests, 0 failed, 0 skipped; all 3 legacy checks passed; zero undocumented test files. Report: `test/basic-unit-result.json`; full output: `test/basic-unit-output.log`.
