# Page Setup hidden scrollbar gutter — v1.252

## Request and applied workflow

The user asks to remove the visually absent scrollbar gutter on the right edge of
the Page Setup modal content pane. Applied `using-superpowers`,
`systematic-debugging`, `test-driven-development`, its `writing-good-tests.md`
reference, and `verification-before-completion`; read the project AGENTS,
UNIT_TEST_BASIC, REA README, the MCP contracts, Windows Ghidra and managed-code
references, and the BarTender REA workflow. The root cause was the content pane's
`overflow:auto` reserving a native scrollbar track. The fix keeps overflow
scrolling enabled and hides the track through both `scrollbar-width:none` and
Chromium's `::-webkit-scrollbar` rule.

## REA evidence

- REA checkout upstream: `https://github.com/morluto/rea.git`; revision
  `9341b116efddefc2bcdd8208d27d6e4ea78cc507` (6.8.0 documentation checkout).
- Live MCP catalog was queried. `binary_session` reported managed metadata and
  Ghidra 12.1.4 available. Selected schemas were read for `open_binary`,
  `inspect_managed_artifact`, `trace_feature`, and `close_binary`; MCP was used,
  so no CLI fallback was needed.
- Primary installed artifact identity was checked with
  `inspect_managed_artifact` on `D:/Programs/BarTend.exe`: SHA-256
  `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`,
  mixed C++/CLI/native PE. Identity Evidence:
  `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`.
- Related localized resources: `D:/Programs/BtEnu.dll`, SHA-256
  `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
  Opened through REA `open_binary` using Ghidra 12.1.4. `trace_feature` query
  `Page Setup` returned Evidence `ev_31abcf829fa34be83615dfd4eceac8ef37a81369ef079b9cd0f16d9796956b31`
  with localized feature strings including Page Setup dialog, Page Setup Wizard,
  and the page-size placement description. Query `scroll bar` returned Evidence
  `ev_d687ea3f1ea3a42fbf5cc17ceca2ac758f6b22e91d89241480a095257def6c9b8`;
  it did not establish the modal's scrollbar painting or gutter behavior.
- Therefore native evidence scopes this dialog/resource identity only. It does
  not establish BarTender's scrollbar UX. The exact requested behavior is based
  on the user's screenshot and is implemented as a Q LABEL visual change; no
  BarTender parity is claimed.

## Implementation and verification

- `gui/modal-preview.js`: hide only the Page Setup main pane's scrollbar gutter
  while retaining `overflow:auto` so tall tab content remains scrollable.
- `test/page-setup.test.js`: CSS regression was observed failing before the fix,
  then passing after the change; the focused file passed 46/46.
- `test/page-setup-runtime.js`: checks in Chromium that computed vertical
  overflow remains `auto` while both standard and Chromium scrollbar-hiding
  rules are present.
- `node --test test/page-setup.test.js`: 46/46 passed after the expected RED
  failure for the new assertion.
- `npx electron test/page-setup-runtime.js`: PASS with isolated appData. Real
  Chromium confirms `overflow-y:auto` remains while scrollbar drawing is hidden;
  screenshot at `%TEMP%/qlabel-page-setup-vlhCpL/page-setup.png`.
- `npm run test:basic`: final shared-workspace rerun at version 1.253 passed
  1,268/1,268 across 167 files, 0 failed/0 skipped; all 3 legacy checks passed;
  undocumented test inventory 0. Report `test/basic-unit-result.json` at
  `2026-10-27T03:49:03.690Z`. The workspace advanced to v1.254 after this run.
- `git diff --check` passed on task files (only Git LF/CRLF notices). Physical
  printing is not applicable.
