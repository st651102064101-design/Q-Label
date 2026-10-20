# Paper edge spacing on the editor preview

Request: Show top/bottom/left/right paper spacing for a single-column layout.
Native appearance reference: user-supplied screenshot with four 1.78 mm edge labels.

## REA evidence

Read the installed reverse-engineer-anything skill and native/artifacts reference.
REA 6.7.0 command: `inspect-managed-members D:/Programs/BarTend.exe --type LayoutPage --json`.
Evidence ID: `ev_f75f7e2d596be3edba392c90aab846a1b8e7b2980edec04bc0702b85cb2c0a7a`.
Saved result: `D:/QLabel-agent-work/rea-20261019/layout-members-evidence.json`.
Artifact SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
The selected type is LayoutPage in the mixed CLR/native x86_64 PE. This is static
metadata evidence, not observed painting or execution of native method bodies.
The earlier `bartender-layout-analysis.md` separately records ordinary resource
inspection for Margins Top/Bottom/Left/Right; it is not relabeled as REA evidence.

## Cause and mapping

PageGap.hasGap previously accepted spacing only between multiple rows/columns.
Positive paper margins now also enable Show gap for a one-column/one-row sheet.
The existing toggle displays shaded margins, millimeter captions and an inner
boundary, with the existing sheet viewBox respecting the leading paper offsets.
Gap bands between multiple labels still use their existing positions.
The overlay ignores pointer events and never changes template/print data.

## Verification and boundaries

The new single-column DOM tests failed before the fix and passed afterward.
`test/page-gap-margins-runtime.js` passes in an isolated Electron/Chromium fixture
using the production PageGap and LabelPreview modules: actual button, all four
labels at 1.78 mm, visible band geometry, sheet viewBox and unchanged model.
Screenshot: `D:/QLabel-agent-work/rea-20261019/qlabel-paper-margins-runtime.png`.
The full-app `test/page-gap-runtime.js` did not finish loading the renderer at
30 seconds or at a diagnostic 90-second limit; it is not counted as passing.
Complete Basic Suite results are reported separately.
`npm run test:basic` on v1.043 timed out its all-unit stage after 900379 ms;
all three legacy stages passed. This is a failed whole-suite run, not full coverage
or a pass. Report and assertion log are at
`D:/QLabel-agent-work/rea-20261019/basic-unit-result.json` and
`D:/QLabel-agent-work/rea-20261019/basic-unit-output.log`.
Git could not write loose objects because C: had no free space; staging/commit
remain incomplete. The push attempt was rejected with HTTP 403. No unrelated
build artifacts were moved while awaiting the user's storage preference.
Native pixel parity, native margin-label typography and physical printer output
remain unverified. The feature preserves the existing initially-hidden toggle.

Follow-up 2026-10-20, v1.044: C: storage is available again. The full-app
`test/page-gap-runtime.js` passes (gap bands, selection bounds, unchanged document,
hide/restore and Page Setup arrows). `npm run test:basic` passes 794/794 with
fail 0/skip 0 and all three legacy stages passing. Current report/log are
`test/basic-unit-result.json` and `test/basic-unit-output.log`; the earlier D:
report remains historical evidence of the timeout.
