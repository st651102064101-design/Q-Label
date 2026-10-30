# Printed Item Shape wizard page — 2026-10-22

## Workflow applied

- Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, `../rea/README.md`, `../rea/docs/mcp-contracts.md`, `../rea/docs/native-investigation.md`, `../rea/docs/javascript-artifact-reconstruction.md`, installed REA skill v42, and Superpowers `using-superpowers`, `brainstorming`, `systematic-debugging`, `test-driven-development`.
- REA source checkout is upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; live MCP package/server 6.7.0, client 0.163.0-alpha.11, catalog SHA-256 `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`.
- Inspected live `search_strings(pattern)` schema, then used `open_binary` + `search_strings` through REA/Ghidra 12.1.4 on the installed native artifact.

## Native artifact evidence

- `D:/Programs/BtEnu.dll`, SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- `search_strings("Printed Item Shape")`: Evidence `ev_b8706eba81c919c5bff84cdc5ee6e8450ec395813069af5a5278267efcb87e8f`, address `0x1036c03c`, observed caption.
- `search_strings("Ellipse")`: Evidence `ev_c3aa324ff740cc83f541d37d2bc9f5663b23251ebdbdcffad2942495d8ed9c89`, occurrences include native strings at `0x1036e9bc` and `0x10373b9e`.
- `search_strings("Circle")`: Evidence `ev_49d6d9e456dc14530a807258008be2048a303ef168156e9a346dce42c63a76e7`, occurrences include `0x1036ea64` and `0x10373bae`. `search_strings("Rectangle")`: Evidence `ev_ad509e529dbc2897210d88436591e09ceda46a81636bb9a05996f0ea22e56c24`.
- User screenshot is visual reference for the four choices (Rectangle, Rounded rectangle, Ellipse, Circle), preview, and page placement after Side Edges. Static strings establish the native page/shape vocabulary, but do not establish page transitions, selected defaults, precise preview rendering, persistence, or print output.

## Implementation mapping

- Added Printed Item Shape after Side Edges and before Summary, with Back/Next/Finish navigation and four radio rows/icons.
- Preview reflects selected shape immediately; new templates persist the selected geometry. Circle remains a distinct `label_shape` and uses circular preview/editor clipping, overflow/grid bounds, and ZPL circle print-border command; ellipse stays elliptical.
- Tests: `test/printer-resolution.test.js`, including page order, preview updates, and saved geometry. No claim of full BarTender runtime/print parity.

## Verification

- Initial test-first assertion failed because the page did not exist; focused regression tests passed after implementation.
- Focused `node --test test/printer-resolution.test.js` passed all 36 tests. Full `npm run test:basic` passed: 1,043 tests, 0 failures, 0 skipped; all three legacy checks passed, and 139 unit-test files were inventoried with no undocumented files.
- Remaining unknowns: native page transition/Finish state, exact shape dimensions for non-square stock, and real printer output against BarTender.

## Layout correction — v1.207

- User clarified the page after **Side Edges** must be the four-choice **Printed Item Shape** page shown in the screenshot, not the Dimensions page. Runtime sequence confirmed Dimensions is step 5, Side Edges step 6, Printed Item Shape step 7, Summary step 8.
- Reused feature-matched REA evidence after rechecking `D:/Programs/BtEnu.dll` SHA-256 (`c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`). Connected `search_strings` found `Printed Item Shape` at `0x1036c03c`, evidence `ev_bf167849a9db053547f5de7ad5480f52d1d7604e6fe1f3cd8754f131998f0f50`. This confirms the native caption only; the screenshot specifies layout.
- Mapped the screenshot to Q LABEL's existing step 7: placed SVG option glyphs before radio and label, removed Stock-only gap/die-cut additions from this page's preview, set the blue preview panel to 198×270px, and moved Template Size directly underneath. Kept Q LABEL's green controls and project colors.
- Fixed the page's body overflow so the larger preview remains visible without scrolling; revised the general preview runtime expectation to treat this intentionally larger preview separately.
- Verification: `node --test test/printer-resolution.test.js` passed 36/36; `npx electron test/wizard-printed-item-shape-runtime.js` passed and captured `test-results/new-label-printed-item-shape-preview.png`; `npx electron test/wizard-preview-runtime.js` passed all nine pages; `npm run test:basic` passed 1,045/1,045 tests, 0 failures/0 skipped, all 3 legacy checks. Report: `test/basic-unit-result.json`.
- Limitations: REA static strings do not establish native page navigation, selected default, precise dimensions, runtime rendering or printed output. Runtime checks establish Q LABEL behavior only; no pixel-perfect/native parity claim.

## Rounded preview compared with BarTender — v1.208

- Re-read project/Superpowers/REA workflows; REA upstream revision remained `dfe8378cf5a727e3d93d47a5986233175c6ef898`. Verified `D:/Programs/BarTend.exe` SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` and `D:/Programs/BtEnu.dll` SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- Checked the live `search_strings(pattern, mode?, case_sensitive?, document?)` schema, opened BtEnu.dll with connected REA MCP/Ghidra 12.1.4, and queried matching native terminology: `Rounded Rectangle` Evidence `ev_b8213b2e3f13d4fc7fe88ee742857f74493d7f0f5846a56cd2eae8349a451a8d` at `0x1031d7c2`; `Corner Radius` Evidence `ev_f7a9c48ef8f323405d1cf5ec74e5ed8af2c11b19cc386f6ba1b8b063235222f0` at `0x1035295a`. These identify native terms only; static string search does not establish a numeric radius or its scaling rule. Closed the REA target after analysis.
- Root cause in Q LABEL: preview used 16% of the short item dimension without an upper bound, so square and taller items rendered larger corners than the BarTender screenshot. Limited the maximum preview radius to 8 mm while retaining the 16% rule for smaller items. At 51×25 mm, radius remains 4 mm; at 101.6×101.6 mm, it is capped at 8 mm.
- This is a screenshot-based visual estimate, not a native numeric value confirmed by REA. The two user screenshots also have different item sizes (51×25 mm and 4×4 in), so their aspect ratios should remain different while the selected rounded shape remains recognizable.
- Tests: test-first unit assertion reproduced 16.256 mm versus expected cap; focused `node --test --test-name-pattern="Printed Item Shape follows" test/printer-resolution.test.js` passed after the fix. `npx electron test/wizard-printed-item-shape-runtime.js` passed with 15.59 viewBox px radius for 4×4 in and wrote `test-results/new-label-printed-item-shape-preview.png`; `npx electron test/wizard-preview-runtime.js` passed after its compact-preview exception was corrected for current step 6. `node --test test/printer-resolution.test.js` passed 38/38.
- `npm run test:basic` passed 1,051/1,051 tests, 0 failed/0 skipped, all three legacy checks; report `test/basic-unit-result.json` (report version 1.209; workspace advanced to v1.210 afterward). No physical printer output was tested.
