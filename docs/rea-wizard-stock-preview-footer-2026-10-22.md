# New Label wizard Stock Selection preview and footer — 2026-10-22

## Scope and workflows

Hide the Stock Selection preview to match the supplied BarTender wizard reference, keep the user-requested Items Per Page preview, and use semantic SVGs with compact matching dimensions for Back, Next, Cancel and Finish on every wizard page. Applied Superpowers `using-superpowers`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`. Re-read project `AGENTS.md`, `UNIT_TEST_BASIC.md`, and `docs/rea-bartender-workflow.md`; read REA README, installed reverse-engineer-anything skill/reference and PE resource contract.

REA upstream: `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; active server `rea-agents` 6.7.0. Checked the live `inspect_pe_resources` tool and schema (`path`, optional bounded `max_entries`/`max_file_bytes`); used the connected MCP operation with the defaults. The PE resource inventory contract preserves type/name/language, payload ranges and hashes; non-icon payloads are opaque and Windows resource loading is not observed.

## Shipped artifact evidence

- Starting artifact `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` (verified for this task). The previously retained managed-members analysis `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9` could not admit the full metadata within its 64 MiB representation budget and did not recover wizard page code.
- Related installed language/resource DLL `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b` (verified for this task; installed in the BarTend deployment directory).
- Connected `inspect_pe_resources` returned complete inventory Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887` (1,468 resources / 2,950 entries). Resource type 5, ID 6676, language 1033 is the Stock Selection dialog payload at file offset 1,190,144, length 952, RVA 1,197,312, SHA-256 `a52f174b17289ed47b70cce6be81b8a38e1595eb7024c125521b5156dd294483`. This matches the retained feature-matched record in `docs/rea-wizard-preview-restored-2026-10-22.md`.
- The resource contents are opaque under this operation. Previous read-only decoding of that exact REA-identified range found `Preview Area *** Do Not Translate ***`, confirming the native dialog's preview-area label/resource string but not whether it is visible at runtime. The supplied BarTender screenshots show the Stock Selection preview area absent; they are user-provided visual references, not REA evidence. Exact native runtime visibility remains unobserved.
- REA could not recover the native dynamically hosted wizard's footer controls or pixel dimensions. The native screenshots show a compact standard button row; exact native measurements and icon use are unknown. The implementation uses compact, equal 86×30px Q LABEL footer buttons with SVG action icons as a modern adaptation of that reference, not a claim of pixel-identical BarTender sizes.

## Root cause and implementation mapping

`gui/new-label-wizard.js` previously set the preview `aside.hidden` to false on every step and kept a two-column grid on Stock Selection. `render()` now hides that aside on step 1, while Items Per Page continues to render its existing live preview. The custom and predefined stock controls remain unchanged.

The same file now gives Back, Next, Cancel and Finish action-specific inline SVG paths (decorative and screen-reader-hidden), sets one compact 86×30px size and 14×14px icon across all steps, and retains the existing green primary Finish treatment and Cancel-before-Finish order. At narrow widths the footer can wrap without clipping controls.

`test/printer-resolution.test.js` verifies hidden Stock Selection preview in both stock modes, preserved Items Per Page preview and all four accessible SVG icons. `test/wizard-preview-runtime.js` uses isolated Electron appData/offscreen rendering to check the actual preview state and measure every footer button/icon on each of the seven pages. `test/printer-resolution-runtime.js` also expects Stock Selection hidden and Items Per Page preview present.

## Verification

- TDD RED: `node --test test/printer-resolution.test.js` failed on the two expected regressions: stock preview remained shown and footer buttons had no SVGs.
- Focused GREEN: `node --test test/printer-resolution.test.js` passed 23/23.
- Electron runtime: `node_modules/.bin/electron.cmd test/wizard-preview-runtime.js` passed in an isolated offscreen window. It verifies hidden preview for custom/predefined Stock Selection, retained circular and 2×3 previews on Items Per Page, compact viewport rendering, and 86×30px footer buttons with 14×14px SVGs at all seven headings. No printer output was sent.
- Windows-driver runtime: `node_modules/.bin/electron.cmd --disable-gpu test/printer-resolution-runtime.js` passed; the installed Zebra ZT411 reported 608 DPI, Stock Selection stayed preview-free, Items Per Page retained its preview, and the seven-step flow completed with the existing footer order. The fixture intentionally removes the main DPI handler to verify stale-process recovery, which logs the expected missing-handler diagnostic; no print was sent.
- Whole-system `npm run test:basic` was rerun on the current v1.153 workspace and passed 997/997 unit tests across 131 discovered files, 0 failed/cancelled/skipped, no undocumented tests, and all three legacy checks exited 0. `test/basic-unit-result.json` reports `passedAllStages: true`; details: `test/basic-unit-output.log`. The change itself is recorded as v1.152; a subsequent workspace update added the v1.153 wizard edge spacing entry.
- `git diff --check` on the application, tests, checklist, changelog, version and evidence files exited 0; Git emitted only its existing LF/CRLF normalization notices.
