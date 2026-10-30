# New Label wizard layout — REA record

Date: 2026-10-21

## Request and approved design

The user requested that every step of Q LABEL's New Label wizard follow the
layout and order in the supplied BarTender screenshots, while retaining Q LABEL's
button design. The user approved adjusting the appearance and order of every
wizard step and approved this sequence and layout:

1. Printer Selection
2. Stock Selection
3. Items Per Page
4. Label Layout
5. Label Dimensions
6. Side Edges
7. Summary

Stock Selection and Items Per Page use the native-style full-width form area.
Custom settings are selected by default, with Category and Stock name visible
but disabled. Items Per Page defaults to Single; selecting Multiple enables
Rows and Columns. The footer order is Back, Next, Finish, Cancel, with Q LABEL's
existing modern button styling.

This is a best-effort reconstruction informed by user screenshots. It does not
claim 100% or pixel-perfect BarTender parity.

## Workflows applied

- Read and applied the project `AGENTS.md`, `UNIT_TEST_BASIC.md`, and
  `docs/rea-bartender-workflow.md` requirements before implementation.
- Applied Superpowers `using-superpowers`, `brainstorming`,
  `systematic-debugging`, `test-driven-development`, and
  `verification-before-completion`; the user approved the design before code
  changes.
- Read the REA checkout README, installed reverse-engineer-anything skill and
  target references, plus the relevant `inspect_managed_members` section of
  `../rea/docs/mcp-contracts.md`.
- REA upstream: `https://github.com/morluto/rea.git`; checkout revision
  `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Checked the live REA tool catalog and the selected operation schema.
  `inspect_managed_members` accepts `path`, `detail: complete|summary`, and
  exact `type_names`; Windows native UI observation is unsupported by the
  connected provider.

## REA evidence and limits

| Artifact | SHA-256 | REA evidence | Finding for this feature |
| --- | --- | --- | --- |
| `D:/Programs/BarTend.exe` | `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` | `inspect_managed_members` parent `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`; summary `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d` | The managed metadata representation exceeded REA's 64 MiB budget at offset 7,953,088. No wizard members were admitted, leaving the installed implementation unknown. |
| `D:/Programs/Seagull.WizardFramework.dll` | `1a2cba97bf664d69b3a2a3e25bdb1ba4265b39a0c81ae6d93778e081d9fe2cc7` | `inspect_managed_members` `ev_05b326db1a274aee0d7c7eb9850c6ca0c867d322c267814dfa003f0a695c4dc9`; summary `ev_dbe6e4015352f5d41cc68bde57b92d64cd11d05025b3888988a007e7276bd380` | Generic `WizardBase` / `IWizardPage` framework contracts only. No stock-specific page controls or behavior; not feature evidence. |
| `D:/Programs/Seagull.TemplateBrowser.dll` | `7bd51bbd0c668f01c87fc904e2199b12607ad0a13a22f09efa5a697022a21f87` | `inspect_managed_members` `ev_ed5e9b2789e9d24fe4a93b8eae97f95fe8a5979d96d4ea1ab1ae39f03e3f186a` | Template browsing/fetching only; no New Document wizard implementation. |

Other installed printer setup/forms candidates were also inspected in the
preceding stock-selection investigation and did not expose the target wizard
step. Candidate proximity to BarTend.exe does not prove a relationship to the
wizard. Supplied screenshots are visual references, not REA evidence.

## Implementation mapping

- `gui/new-label-wizard.js`: add Items Per Page between Stock Selection and
  Label Layout; default to Single and enable validated Rows/Columns for Multiple.
- `gui/new-label-wizard.js`: keep Category and Stock name visible but disabled
  in custom mode; enable and populate them for predefined stock. Hide the
  preview pane on Stock Selection and Items Per Page. Preserve the user-approved
  footer order and existing Q LABEL button styles.
- `test/printer-resolution.test.js`: cover page order, default and enabled
  states, full-width pages, footer order, stock application and saved geometry.
- `test/printer-resolution-runtime.js`: cover real Electron rendering, page
  sequence, controls and catalog dimensions with temporary appData. No print
  job is sent.
- `UNIT_TEST_BASIC.md`: update unit-test inventory, whole-system behavior
  checklist and required runtime checks.

## Verification

- Focused unit tests: `node --test test/printer-resolution.test.js
  test/new-label-stock-mode.test.js` passed 20/20 after implementation.
- Electron runtime `electron --disable-gpu test/printer-resolution-runtime.js`
  passed. With temporary appData it verified installed driver DPI, printer
  actions, hidden preview on Stock Selection and Items Per Page, ADES AG 49908
  dimensions, the full seven-step sequence and footer order, then stale IPC
  guidance. No print job was sent. The GPU switch was scoped to the test
  process; existing Electron processes were left running.
- Whole-system `npm run test:basic`: passed 979/979 unit tests, 0 failed and
  0 skipped; all three legacy checks (`test/data-sources.js`, `test/print-job.js`,
  and `test/smoke.js`) exited 0. Report: `test/basic-unit-result.json`.
- Focused suite `node --test test/printer-resolution.test.js
  test/new-label-stock-mode.test.js`: passed 22/22.
- `git diff --check`: exited 0; Git emitted existing LF/CRLF normalization
  notices.

Wizard changes were recorded in changelog version `1.137`. The current workspace
has since advanced to version `1.143` (`package.json` SemVer `1.0.143`) with
other dated changes.

## Remaining unknowns

REA could not recover the wizard implementation from the installed BarTender
artifact, and native UI observation is unsupported by the connected Windows
host. Native keyboard behavior, exact dimensions, page-specific enablement,
and pixel-level parity remain unverified. The implementation follows the
screenshots and approved design and must not be represented as confirmed 100%
BarTender parity.
