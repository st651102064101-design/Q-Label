# Page Setup bottom roll corners — v1.257

The requested change keeps the two upper corner arcs of the lower continuation
label visible in the Page Setup preview. The supplied screenshot shows the
missing arcs; it does not establish BarTender's internal drawing algorithm.

The project REA workflow and basic unit policy were read. Superpowers
`using-superpowers`, `systematic-debugging` and `test-driven-development` were
applied: tracing the SVG found that the bottom outline gradient faded from fully
opaque at the top to transparent at the bottom of the fragment, including over
the rounded corner arcs. The new regression failed before the implementation.

REA checkout upstream `https://github.com/morluto/rea.git`, revision
`9341b116efddefc2bcdd8208d27d6e4ea78cc507`; README, MCP contracts and native
artifact reference read. Live connected REA 6.7.0 catalog and `open_binary` /
`trace_feature` schemas inspected; Ghidra 12.1.4 was used. The installed
`D:/Programs/BarTend.exe` SHA-256 is
`0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
The matching Page Setup resource `D:/Programs/BtEnu.dll` SHA-256 is
`c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
REA `trace_feature` for `Page Setup` produced
`ev_31abcf829fa34be83615dfd4eceac8ef37a81369ef079b9cd0f16d9796956b31`,
matching Page Setup resource text. Prior same-artifact roll preview evidence
`ev_41487cafb607181ca00dfd9d1dfc7a80d50701e0ddd63542e0c461c240460d1d`
did not recover the drawing implementation. Thus exact native line opacity and
pixel geometry remain unknown; the implementation follows the user screenshot.

`gui/modal-preview.js` now keeps the bottom fragment stroke opaque through the
visible rounded arc, then fades it toward the edge of the clipped fragment. This
only affects the Page Setup SVG: it does not alter saved dimensions, actual row
gaps, or generated printer geometry. `test/page-setup.test.js` exercises one and
two columns, two radii, and Page / Layout tabs. The focused regression passed.
`npm run test:basic` passed 1,271/1,271 tests across 168 files with zero failed,
skipped or undocumented files; three legacy stages passed. Report:
`test/basic-unit-result.json` (2026-10-28T02:38:24Z). The existing
`npx electron test/page-setup-runtime.js` passed in isolated appData; its checks
cover general Page Setup flows, while the new arc assertion is a DOM unit check.
No pixel comparison with BarTender or physical print was performed.
