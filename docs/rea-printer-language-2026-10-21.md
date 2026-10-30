# Printer language choice removal — REA evidence

Date: 2026-10-21

## Request and scope

The user asked to remove the Printer language choice shown in the supplied Q LABEL settings image, following the supplied BarTender printer selection reference. The change removes the selector from New Label Wizard and preserves the existing internal `zpl` document default. No automatic driver-language detection or print-output change is claimed.

## Workflows applied

- Read `labelforge/AGENTS.md`, `labelforge/UNIT_TEST_BASIC.md`, and `labelforge/docs/rea-bartender-workflow.md` before edits.
- Read Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`; followed RED/GREEN for the selector behavior.
- Read the installed `reverse-engineer-anything` skill, `../rea/README.md`, the managed-artifact references, and the managed member operation contract in `../rea/docs/mcp-contracts.md`.
- REA checkout upstream: `https://github.com/morluto/rea.git`; revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Live REA MCP server/package: `rea-agents` 6.7.0; server catalog 207 MCP tools. `binary_session({})` reports managed artifact and managed member analysis available, while native UI capture is unavailable on this Windows host.
- Selected REA operation: `inspect_managed_members`. Its live input schema accepts `path`, `detail: "complete" | "summary"`, and optional exact `type_names`. The tool was used on the requested application and candidate assemblies; no unsupported operation or setup change was used.

## Artifacts and REA observations

| Artifact | SHA-256 | REA result | Feature finding |
| --- | --- | --- | --- |
| `D:/Programs/BarTend.exe` | `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` | `inspect_managed_members` Evidence `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`; summary projection `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d` | Metadata representation exceeded REA's 64 MiB limit at offset 7,953,088. No members or behavior were admitted; this is a blocker, not evidence about the wizard. |
| `D:/Programs/BtSystem.UI.dll` | `cd26374bcb3f75747ae8cb699fbdad7eacc4b990191918e2692baf697ba6caaa` | `inspect_managed_artifact` summary `ev_fd870815b4c5cb7fa87569ec052856996ec015586a396161d3ee265def9bfadd`; `inspect_managed_members` `ev_ee3a7862ec716913ea25798c3ba18abea2069255d840f957c0b2a6717fc44253` | Complete .NET metadata, but its 39 types are general UI/utilities (for example `BrowseServersForm` and `UiHelper`); no New Document Wizard implementation was identified. Not used as wizard behavior evidence. |
| `D:/Programs/Seagull.WizardFramework.dll` | `1a2cba97bf664d69b3a2a3e25bdb1ba4265b39a0c81ae6d93778e081d9fe2cc7` | Managed-member summary `ev_dbe6e4015352f5d41cc68bde57b92d64cd11d05025b3888988a007e7276bd380` | Identity/count summary only; no matched wizard type or language-choice behavior established. |
| `D:/Programs/Seagull.TemplateBrowser.dll` | `7bd51bbd0c668f01c87fc904e2199b12607ad0a13a22f09efa5a697022a21f87` | Managed-member summary `ev_f992cf76f425e5d26b9b725e7fecbf0cc7085acc13b4152b140f6920b68097b1` | Identity/count summary only; no matched wizard type or language-choice behavior established. |

The supplied screenshots are visual reference material, not REA feature evidence. A Windows runtime observation of the exact BarTender New Document Wizard did not complete: activating its New button through Computer Use produced an input/refresh error, and a fresh Ctrl+N attempt left the existing document window unchanged. REA's `capture_native_ui_scenario` is unavailable on Windows; its current server reports that the native UI utilities require macOS. No runtime wizard behavior was inferred from unrelated BarTender UI observations.

## Mapping to Q LABEL

- Before the change, `gui/new-label-wizard.js` rendered a one-option `nwLanguage` dropdown and Finish copied its value into the template.
- The codebase's existing new-document default is ZPL (`blankTemplate()` and startup defaults in `gui/renderer.js`). The selector is removed, and Finish now stores that existing `zpl` default directly.
- `test/printer-resolution.test.js` asserts the control is absent and that a finished document keeps internal `language: "zpl"`.
- `test/printer-resolution-runtime.js` asserts the runtime wizard exposes no Printer language or Resolution UI. No real print was sent.

## Limits and verification

The exact BarTender wizard implementation and its language behavior remain unverified because REA could not admit the mixed C++/CLI executable and native UI capture is unsupported by the connected MCP host. The edit follows the explicit requested Q LABEL change and does not establish 100% BarTender parity. Automatic language selection for non-ZPL queues, printer-driver command interpretation, and resulting physical output remain unknown.

Verification performed:

- RED: `node --test test/printer-resolution.test.js` failed on the expected assertion because `nwLanguage` was still present.
- GREEN: `node --test test/printer-resolution.test.js` passed 14/14 tests.
- Required whole-system suite: `npm run test:basic` passed 963/963 unit tests, 0 failed, 0 skipped, plus `test/data-sources.js`, `test/print-job.js`, and `test/smoke.js`; report: `test/basic-unit-result.json`.
- Electron runtime: `node_modules/.bin/electron.cmd test/printer-resolution-runtime.js` exited 0 and passed Printer Selection, wizard language/Resolution visibility, stock selection, driver DPI and the stale-handler fixture. The expected missing-handler diagnostic and a Chromium GPU warning appeared; no print job was sent.
- `git diff --check` exited 0; Git printed line-ending normalization warnings for existing CRLF/LF-mixed workspace files.

The unit suite captured version `1.129` in its report. A separate concurrent workspace change advanced the current package/changelog to `1.130` during verification; those changes were preserved.
