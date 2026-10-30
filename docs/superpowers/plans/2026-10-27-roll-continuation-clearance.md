# Roll continuation clearance

Approved by the user's “เริ่ม” after the supplied five-image comparison. The visible previous/next paper fragments must have a small clear separation from the main label block, including when the physical row gap is zero. Initial summary called these paper margins; source tracing shows the defect is the continuation seam. Keep actual cell positions, page margins, internal row/column gaps and saved printing geometry intact.

Applied Superpowers using-superpowers, brainstorming (approved screenshot scope), systematic-debugging, writing-plans, TDD and verification-before-completion. Work inline in the integrated dirty workspace, preserving unrelated edits. Read labelforge AGENTS, UNIT_TEST_BASIC, REA README/contracts and installed native reference. REA checkout upstream https://github.com/morluto/rea.git revision 9341b116efddefc2bcdd8208d27d6e4ea78cc507; connected MCP 6.7.0, catalog 207, Ghidra 12.1.4. Checked live schemas for binary_session, get_evidence_bundle, open_binary and search_strings.

Native identity: D:/Programs/BarTend.exe SHA256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3; related English resources D:/Programs/BtEnu.dll SHA256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b. Both checked unchanged. Prior retained evidence was unavailable in the connected session (summary returned zero), so queried BtEnu.dll using open_binary ghidra and search_strings regex Page Size:|Template Size:|Corner Radius|Gap.{0,12}Pitch. Evidence ev_ae30f2508b43fadbd9298a7f86a88df99e40babc54e02c48102dd23f37059bc0 confirms native Page Size 0x10341dbe, Template Size 0x10341dd6, Corner Radius 0x1035295a. This is feature naming evidence, not a recovered native drawing algorithm. Defined-string search did not recover Gap/Pitch; it does not prove absence. Native drawing constants remain unknown, reported before editing. Implementation follows the user's screenshot requirement, without claiming exact native algorithm/pixel parity.

Cause: setupRoll continuation uses gap_y_mm directly for both top and bottom neighbour seams, so zero physical row gap produces coincident outlines. Existing tests explicitly required that coincidence; the user's new request supersedes that visual expectation.

Plan:
1. Add failing regression for visible outer continuation clearance with zero physical gap, one/four labels, all setup tabs; retain exact internal gaps and document immutability.
2. Use a minimum three SVG-unit presentation clearance for neighbouring fragments; larger physical gaps stay visible. Preserve viewport fit for tall labels/large gaps.
3. Run focused tests, isolated Electron capture, full required basic suite; bump version, Thai changelog and checklist.

No physical printer or native runtime pixel equivalence is claimed.

## Additional user correction and execution

User added the inability to save 0.125 in for Corner radius. Native evidence above includes Corner Radius; numerical acceptance is established by the supplied native screenshot, not inferred from resource strings. RED tests reproduced both zero outer clearance and border step mismatch. Fixing border step exposed the synchronized range control’s own 0.01 step mismatch. Both numeric controls now use the displayed decimal resolution, and the range shares the radius resolution. Decimal step strings use toFixed to avoid V8 exponent floating-point strings (0.00009999999999999999) perturbing the range value.

Changed only the setupRoll outer seam (minimum three SVG units, larger real gaps preserved) and Shape precision. Unit regression uses exact inch page dimensions to avoid unrelated scale confirmation caused by fixture conversion. Isolated runtime creates an editable named document and explicitly saves using persistEditor(true), then reads the real file; no printer. Electron check PASS: 0.125 in retained as 3.175 mm, one/four main labels, top/bottom clearance 3 SVG units, internal row gap 0, liners inside viewport. Both PNGs visually inspected. Reviewer found no important defects in the scoped changes.

Final verification: npm run test:basic PASS, 1263/1263 unit tests across 167 files, 0 failed and 0 skipped; all three legacy stages pass; undocumented inventory 0. Timestamp 2026-10-27T03:36:41.862Z, version1.250. Retained report test-results/roll-clearance-basic-result.json; full log test-results/roll-clearance-basic.log. Isolated Electron runtime PASS and both captures visually inspected. Syntax checks and relevant git diff --check pass (line-ending notices only). REA session closed, installed artifacts and user documents preserved.
