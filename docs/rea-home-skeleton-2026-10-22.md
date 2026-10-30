# Project Home startup skeleton — 2026-10-22

## Skills and workflow

- Applied `using-superpowers`, `systematic-debugging`, and `test-driven-development`.
- Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, `../rea/README.md`, `../rea/docs/mcp-contracts.md`, `../rea/docs/native-investigation.md`, and `../rea/docs/javascript-artifact-reconstruction.md`.
- REA checkout revision: `dfe8378cf5a727e3d93d47a5986233175c6ef898`; upstream: `morluto/rea`. Live MCP server/package version: 6.7.0, REA PE resource parser v1, client 0.163.0-alpha.11; catalog tool digest `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`.
- Selected operation contract/schema inspected: `inspect_pe_resources(path, max_file_bytes?, max_entries?)`; live catalog reported available.

## REA evidence and scope

- Ran `inspect_pe_resources` on `D:/Programs/BtEnu.dll` (SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`), Evidence `ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a47464f1a4887`.
- This is evidence for BarTender wizard resources only. It does not match or establish startup/Home skeleton behavior. BarTend.exe native/UI behavior for this feature remains unknown; no BarTender parity claim is made.
- The requested behavior is implemented as a Q LABEL requirement, based on user screenshots and source root-cause inspection, not as confirmed native equivalence.

## Root cause and mapping

- `gui/index.html` had one hard-coded `.sk-project` irrespective of project data.
- `gui/renderer.js` loaded project metadata asynchronously before Home appeared, but never updated the startup skeleton.
- `gui/project-home.js` limited Recent projects to four, conflicting with the requested one-for-one count.
- Skeleton now renders a placeholder for each loaded project and the same empty message as Home when the list is empty. Recent projects now renders all visible project templates, matching that count.

## Verification and limitations

- RED: before implementation, `node --test test/project-home.test.js` failed because `renderStartupHomeSkeleton` was absent.
- GREEN: focused project-home tests passed 5/5 after implementation.
- Full `npm run test:basic` result is recorded in `test/basic-unit-result.json` and `test/basic-unit-output.log`.
- No claim about native BarTender startup design; its feature implementation remains unidentified by the applicable REA evidence.
