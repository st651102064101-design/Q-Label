# Transform Configure SVG task evidence — 2026-10-20

## Scope

Replace the repeated `Configure…` text labels in the Transforms list with a compact SVG control icon. Keep each transform's configuration action discoverable and make sure it still opens that transform's existing editor. This is a Q LABEL UI change; this record does not claim exact BarTender icon parity.

## Required workflow applied

- Read the project `AGENTS.md`, `UNIT_TEST_BASIC.md`, and `docs/rea-bartender-workflow.md`.
- Read Superpowers `using-superpowers`, `systematic-debugging`, `brainstorming`, and `test-driven-development`; applied the existing approved direction (SVG configure affordance, tooltip/accessible name, retain the handler) and test-first implementation.
- Read REA `../rea/README.md`, `../rea/docs/mcp-contracts.md`, the installed reverse-engineering skill and its artifact/provider references. REA checkout upstream is `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; pinned CLI reports `rea-agents 6.7.0`.
- Inspected the active MCP catalog and `trace_feature` schema, then queried the matching UI string `Configure` through `mcp__rea__trace_feature`.

## Installed artifacts and REA evidence

- `D:/Programs/BarTend.exe` SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- `D:/Programs/BtEnu.dll` SHA-256: `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- These hashes match `docs/bartender-text-transform-menu-2026-10-19.md`. That scoped REA recovery establishes the native Text transform menu/capability list and its order. It does not establish how BarTender renders an individual Configure button or which icon it uses.
- Current `trace_feature("Configure")` did not produce artifact findings: error `provider_unavailable`, operation `search_strings`, requested provider `auto`. Ghidra is not configured (`GHIDRA_INSTALL_DIR` unset; Java probe reports `ERR_REA_WINDOWS_NATIVE`; the target is mixed managed/native PE and is rejected by this Ghidra path). Hopper is unsupported on Windows; IDA and Kuna are not configured, and Kuna does not admit PE targets. No new native icon evidence is claimed.

## Implementation mapping

- Native reference establishes the Transform list entries and order only. The exact icon is an application-side design choice informed by the user's screenshot: a slider-controls SVG replaces the repeated text label.
- `gui/object-data-sources-ui.js`, `renderTransforms`: each row now renders a 16×16 inline sliders SVG in a compact button. The button retains its existing `openTransform(kind, name)` handler and provides `title` and `aria-label` as `Configure <transform>`; the icon is hidden from assistive technology to avoid duplicate naming.
- `test/object-data-sources-ui.test.js`: a DOM regression checks icon markup, empty visible text, accessible label and tooltip, and that activating the button opens the matching transform editor.
- `UNIT_TEST_BASIC.md` records the regression under the existing UI test inventory.

## Verification

- Test-first check: the new focused assertion failed before the implementation because rows had no Configure SVG.
- `node --test test/object-data-sources-ui.test.js`: 40 passed, 0 failed.
- `npm run test:basic`: 832 unit tests passed, 0 failed; all 3 legacy checks passed. Report: `test/basic-unit-result.json`.
- Attempted Electron `test/source-text-transform-menu-runtime.js`; it stops before transform assertions on a pre-existing `getComputedStyle(null)` selector mismatch in the legacy runtime fixture. That runtime script is not reported as passing and is not part of the Basic Suite. This task's button activation is covered by the focused DOM test.

## Remaining unknowns

- Native Configure button dimensions, SVG/icon identity, hover treatment, and keyboard/focus behavior have not been confirmed from BarTender because the applicable native REA provider is unavailable.
- The implemented icon is not claimed to match BarTender's artwork. Native parity can be revisited when a compatible analysis provider is available.
