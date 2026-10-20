# Data Sources tree connector fix

## Request

The user reported that a solid-looking tree connector under Data Sources continued past its intended endpoint. The requested result is for the connector to stop at the final source row while preserving dotted tree branches.

## REA evidence and scope

- Applied Superpowers `using-superpowers`, `systematic-debugging`, `brainstorming`, `test-driven-development`, and `verification-before-completion` workflows. TDD was followed: the Electron regression failed before the CSS fix and passed afterward.
- REA checkout: `../rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; the project workflow pins CLI `rea-agents@6.7.0`.
- MCP catalog/schema inspected for `open_binary` and `trace_feature`.
- Opened shipped artifact with REA MCP `open_binary(path: D:/Programs/BarTend.exe, provider_id: auto)`. SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` (matches local SHA-256 check).
- Related installed file `D:/Programs/BtEnu.dll` SHA-256: `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`. No evidence in this task establishes it implements tree painting.
- Feature query: REA MCP `trace_feature(query: "Data Sources tree connector line")`. It failed with `provider_unavailable`: Ghidra reports both `not_configured` and `managed_target_unsupported` (Windows Ghidra P0 admits native PE, not this mixed managed PE); Hopper reports `unsupported_host` on Windows; IDA is `not_configured`; Kuna is `not_configured` and does not admit PE. No native procedure, UI resource or tree behavior was recovered. No provider configuration or installation was changed.
- The prior `docs/bartender-properties-tree-2026-10-20.md` managed `DataSource` evidence is scoped to metadata/tree structure and does not establish connector geometry, so it was not used as native proof here.

## Q LABEL cause and implementation

The source-row connector's extended height used `button:not(:last-child)`. This selector treated any later element as another source row. In the Electron fixture, appending a non-source decoration caused the final branch pseudo-element to grow from 17px to 30px. Both stylesheet copies now extend the connector only for `button:not(:last-of-type)`, so a later decoration cannot lengthen the final source branch.

Changed files: `gui/object-data-sources-modern.css` and `gui/object-properties-modern.css`. The dotted style, branch x-position, list indentation, and source selection behavior are retained.

## Verification

- Before fix: `npx electron test/object-properties-tree-runtime.js` failed as expected with final source branch height changing from 17px to 30px.
- After fix: `npx electron test/object-properties-tree-runtime.js` passed. Actual tree geometry remained x=236, y=4 relative to Data Sources, width=133, height=28 before/during/after selecting pages; branch and stem remained dotted; final branch remained 17px with a trailing decoration.
- `npm run test:basic`: passed, 833 passed / 0 failed / 0 skipped; all three legacy stages passed. Report: `test/basic-unit-result.json`; assertion log: `test/basic-unit-output.log`.
- Unknown: BarTender's native line painting/geometry remains unverified because REA's selected Windows providers could not analyze the managed PE.
