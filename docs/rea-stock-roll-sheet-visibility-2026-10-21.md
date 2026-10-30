# Custom/predefined stock paper-mode visibility — REA record

Date: 2026-10-21

## Request

The user requested that “Print on a roll of labels” and “Print on a sheet of paper” be hidden for “Specify custom settings” and appear only when “Use a predefined stock” is selected. This records the requested Q LABEL behavior; it does not claim native BarTender parity.

## Workflow and native evidence

- Per the user's instruction for this prompt, no Superpowers or other skills were invoked.
- Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, `../rea/README.md`, `../rea/docs/mcp-contracts.md`, the installed REA skill, and its `native-and-artifacts.md` and `runtime-observation.md` references.
- REA checkout upstream: `https://github.com/morluto/rea.git`; revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; connected package 6.7.0.
- Checked the live MCP catalog and `inspect_managed_members` schema (`path`, `detail`, optional exact `type_names`); invoked `inspect_managed_members({path:"D:/Programs/BarTend.exe",detail:"summary"})`.
- BarTender artifact: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`. REA returned summary Evidence `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d`, parent `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`; it reports managed member inspection unavailable because the CLI metadata could not be admitted. No native wizard behavior was established. The Windows native UI capture limitation is recorded in `docs/rea-printer-language-2026-10-21.md`; the supplied screenshots are reference images, not REA evidence.

## Implementation mapping

- `gui/new-label-wizard.js`: move roll/sheet radios into `#nwPaperMode`, hidden by default; reveal it only when predefined stock is selected. Keep the roll default and keep custom sheet-size controls under custom settings.
- `test/printer-resolution.test.js`: assert initial custom-mode visibility, toggling to predefined mode, retaining the roll default, and hiding choices again on return to custom.
- `test/printer-resolution-runtime.js`: assert actual Electron DOM visibility in custom and predefined modes.
- `UNIT_TEST_BASIC.md`: update printer wizard coverage. No physical print is used.

## Verification and limits

- RED: new DOM assertions failed because the paper-mode wrapper did not yet exist.
- GREEN: `node --test test/printer-resolution.test.js` passed 15/15.
- `npm run test:basic` passed 964/964 unit tests, 0 failed, 0 skipped, plus `test/data-sources.js`, `test/print-job.js`, and `test/smoke.js`. Report: `test/basic-unit-result.json`.
- `node_modules/.bin/electron.cmd test/printer-resolution-runtime.js` exited 0 and verified that custom mode hides the roll/sheet radios while predefined mode reveals them with roll selected; it also verified stock selection and DPI flow in isolated temporary appData. No print job was sent. Expected missing-handler diagnostic and Chromium GPU warning appeared.
- `git diff --check` exited 0; Git printed line-ending normalization notices for existing LF/CRLF mixed files.
- Native BarTender wizard structure/behavior remains unknown because managed inspection was blocked and native UI observation is unavailable. No 100% parity claim is made.
