# Properties tree connector correction — v1.075

## Request and scope

User annotated the extra outer trunk in red for removal and missing connecting segments in green for addition. Interpret colors as editing marks, not requested permanent red/green UI dots. Match the user's diagram with existing neutral dotted lines. No data, selection, naming or source editing behavior changes.

## Required REA + Superpowers gate

Read/applied using-superpowers, systematic-debugging, test-driven-development and verification-before-completion: reproduce with failing DOM/runtime assertions, identify CSS/DOM cause, minimal correction, rerun assertions. Read project AGENTS/UNIT_TEST_BASIC, REA README/native-and-artifacts skill reference, mcp-contracts retained-evidence/tool-results sections, and mandatory workflow.

REA upstream https://github.com/morluto/rea.git, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`, CLI6.7.0. Live catalog/schema checked for get_evidence_bundle/inspect_pe_resources. Connected MCP `get_evidence_bundle(detail:summary, filters:{evidence_id:ev_d20379e876bccad4e4b48bf8227c1ae72eb6cffb4aa146a181a474a64f1a4887})` confirms the retained BtEnu.dll resource record. An initial complete+filters request was rejected (filters require summary), then corrected. Checked current hashes:

- `D:/Programs/BarTend.exe`: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`
- `D:/Programs/BtEnu.dll`: `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`

Ordinary read-only examination of retained resource ranges found several SysTreeView32 dialogs, but none established the Properties tree connector geometry. Those unrelated dialogs are **not** feature evidence. Previous real native Text Properties observation is recorded in rea-alternatives-2026-10-20.md; it establishes the tree structure, not these exact pixel lengths. REA Windows UI remains unsupported and mixed admission is unchanged. This exact geometry remains a native evidence gap; reported before implementation. Proceeded under user's authorization to implement source/custom UI when native evidence is unresolved, using the supplied annotation as the specification. Do not claim100% BarTender parity or resolve the broad native unknown.

## Root cause and mapping

- Every property row had a full-height left border, including the final row. Add a per-object final-property marker and draw only its upper half, preserving the other rows' continuous trunk.
- Horizontal branches stopped short of their icons. Extend page connector9→13px and source connector10→13px.
- Source stem was4px left of parent icon center and7px below the parent icon bottom. Move source stem left offset-10→-6px and top-4→-11px; preserve row/host placement.
- Lazily loaded object-data-sources-modern.css redefined the same source pseudo-elements with old offsets. Update both stylesheets to preserve geometry after visiting Data Sources.

Changed application files: gui/object-properties.js, gui/object-properties-modern.css, gui/object-data-sources-modern.css. Version/package-lock updated to1.0.75/display1.075, Thai changelog added.

## Verification

- Red DOM test: final property marker absent (17pass/1fail). Red Electron geometry reproduced missing final stem, wrong center227 vs231, wrong top374 vs367, branch end237 vs icon244.
- Green DOM:18pass/0fail. Green Electron actual geometry before/during/after Data Sources: last-row stem14px for28px row, outer border transparent, source stemX231 equals parent center231, stemTop367 equals parent icon bottom367, branchEnd244 equals source iconLeft244. Source row layout unchanged (x236, gap4, width133, height28).
- Runtime fixture uses separate appData and no physical printing. Logs: `D:/QLabel-agent-work/tree-connectors-red-unit.log`, `tree-connectors-red-runtime.log`, `tree-connectors-green-unit.log`, `tree-connectors-green-runtime.log`.
- Full required suite: `npm run test:basic`; current output/report at test/basic-unit-output.log and test/basic-unit-result.json. Native pixel equivalence, hardware and full printing behavior are outside this visual correction.
