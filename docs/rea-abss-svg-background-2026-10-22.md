# Restore ABSS SVG background — 2026-10-22

## Request and scope

The user asked to restore the green background to the ABSS logo SVG. The screenshot is the title icon in the New Document Wizard. This is Q LABEL branding; the SVG is not a BarTender supplied logo.

## Required workflows and REA evidence

Read and applied `AGENTS.md`, `UNIT_TEST_BASIC.md`, the installed Superpowers `using-superpowers`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion` skills, the REA checkout `README.md`, installed reverse-engineer-anything skill, native/artifact reference, MCP contracts, and `docs/rea-bartender-workflow.md`.

REA checkout upstream: `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; connected server reported 6.7.0. Inspected the live tool catalog and selected `inspect_pe_resources` schema (`path`, optional `max_entries`, optional `max_file_bytes`). Called `inspect_pe_resources({path:"D:/Programs/BarTend.exe"})`.

- Evidence: `ev_f9ed9b23f4d554224086ea504d6666da300e7d5c9da3499b907d6b7d3801d9ca`
- Artifact: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; 21,010,848 bytes.
- REA observed complete static resource inventory (59 entries, 26 resources), including two icon groups with 16×16, 32×32, 128×128 and PNG-sized 32-bit icon entries.
- Limit: the inventory does not decode all icon payloads or establish what image/title icon the wizard actually loads, nor logo background pixels. It therefore does not establish native BarTender wizard-logo styling. The requested green backdrop is implemented from the user's Q LABEL reference; no visual-parity claim is made.

The separately inspected `D:/Programs/BtEnu.dll` SHA-256 was `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`; it was not used as evidence for this logo behavior.

## Root cause and implementation

`gui/assets/branding/abss-mark.svg` contained only an embedded PNG image, with transparent outer pixels and no SVG background shape. `.nw-brand-icon` in `gui/new-label-wizard.js` had a transparent CSS background. The SVG had no `<rect>` background. Added a `#16a34a` rectangle covering the SVG viewBox before the embedded logo image, leaving the surrounding title layout and zero CSS padding intact.

## Verification

- TDD red: new `test/abss-branding.test.js` failed because the SVG had no green rectangle.
- Unit green: `node --test test/abss-branding.test.js` passed 1/1.
- Isolated UI: `./node_modules/.bin/electron.cmd test/wizard-branding-runtime.js` passed all seven steps at 900px and 600px; actual SVG canvas corner pixel is `[22,163,74,255]`.
- Visually inspected `test-results/wizard-branding-900.png`; the icon now sits on the green title bar as requested.
- Whole-system `npm run test:basic` results are recorded in `test/basic-unit-result.json` and `test/basic-unit-output.log` after completion.

Final full-suite result: `test/basic-unit-result.json` timestamp `2026-10-22T02:56:40.766Z`, displayed version 1.16 (JSON numeric rendering of 1.160), 1,003/1,003 unit tests passed, zero skipped/cancelled, no undocumented test files, and all three legacy stages passed. Scoped `git diff --check` passed with line-ending notices only.

## User correction: white background — v1.161

The user clarified that the SVG background must be white. The green rectangle added in v1.160 blended with the green Wizard title bar, so it did not produce the requested visible white plate. Updated the existing unit test and canvas pixel expectation first; the unit test failed against the green asset, then the SVG rectangle was changed to `#fff`, behind the embedded image. Current user instruction supersedes the earlier color interpretation.

Rechecked `D:/Programs/BarTend.exe` SHA-256 (`0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`) and repeated connected `inspect_pe_resources` with the live schema. REA returned the same Evidence `ev_f9ed9b23f4d554224086ea504d6666da300e7d5c9da3499b907d6b7d3801d9ca`: two 32-bit icon groups, but the static inventory does not decode wizard logo background pixels. This remains custom Q LABEL styling from the user's explicit correction; BarTender white logo background is not claimed as established native behavior.

White version verification: `node --test test/abss-branding.test.js` passed 1/1; isolated `electron test/wizard-branding-runtime.js` passed all seven steps at 900px and 600px, with rendered SVG corner `[255,255,255,255]`; visually inspected the 900px capture. An intermediate v1.164 full run found a concurrent Stock Selection preview assertion failure; the concurrent preview correction passed its targeted suite 26/26. Final `npm run test:basic` completed at `2026-10-22T03:12:30.737Z` on workspace v1.165: 1,004/1,004 passed, zero skipped/cancelled, all three legacy stages passed, no undocumented test files. This color correction is recorded in changelog v1.161.
