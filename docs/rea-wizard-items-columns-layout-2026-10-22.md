# Items Per Page preview and Columns layout — 2026-10-22

## Workflow and REA evidence

Applied Superpowers `using-superpowers`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`. Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA `README.md`, the `inspect_pe_resources` section of `../rea/docs/mcp-contracts.md`, and the installed REA and Superpowers skills. REA checkout: `C:/Users/kkriangkai/projects/Bratender/rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`. Live REA MCP catalog contained `inspect_pe_resources`; its `path`, `max_file_bytes`, and `max_entries` input schema was checked. Provider: REA PE resource parser v1 (MCP server 6.7.0).

- `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- Connected REA operation `inspect_pe_resources`, evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a47464f1a4887`. Matching Items Per Page resource 6688 (language 1033), file offset 1,197,648, length 880, payload SHA-256 `a1ab3873fd63de869ba9c743332166d618ce45dbc2af1e81974ad78035a86d7e`. Its static controls include Single/Multiple, Rows, and Columns.
- Static resource inspection does not establish preview position, label clipping, or runtime pane geometry. Layout mapping is therefore based on the user's screenshots and measured Q LABEL Electron runtime; no native pixel-parity claim is made.

## Root cause and implementation

The Items Per Page body inherited the generic preview layout while its item-count fieldset used fixed label tracks of 52px. The label track was too narrow for “Columns”, and the preview's 168px SVG and size text were not aligned with the 180px preview pane's right edge. `gui/new-label-wizard.js` now gives this page an explicit form/preview grid, shifts the capped preview and size label to share the pane's right edge, keeps the size on one line, and gives Rows/Columns labels 64px tracks.

## Verification

- RED: Electron runtime assertion initially found the preview 12px short of the pane's right edge; after aligning the SVG and Template Size, the regression passed.
- `npx electron test/wizard-preview-runtime.js`: PASS. The runtime checks that the Columns label fits in the form, the preview's right edge reaches the pane edge, and the one-line Template Size sits immediately below it. Screenshot: `test-results/new-label-items-preview.png`.
- `npm run test:basic` on v1.174: PASS, 1,010 unit tests passed, 0 failed, 0 skipped; `test/data-sources.js`, `test/print-job.js`, and `test/smoke.js` passed. Report: `test/basic-unit-result.json`; full output: `test/basic-unit-output.log`.
