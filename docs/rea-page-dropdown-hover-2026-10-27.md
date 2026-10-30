# Page dropdown hover dismissal — v1.242

User behavior: keep the page add menu open while the pointer moves between its arrow trigger and menu; close it immediately when the pointer leaves that combined region, including moving to the adjacent plus button.

## Workflow and native evidence

Applied Superpowers `using-superpowers`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`; read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA checkout `README.md`, and the relevant `inspect_managed_members` section of `../rea/docs/mcp-contracts.md`. REA checkout upstream: `https://github.com/morluto/rea.git`; revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.

Used the connected REA MCP catalog and `inspect_managed_members` schema for exact type `Seagull.Wpf.Controls.SplitButton` in related installed artifact `D:/Programs/Seagull.Wpf.Controls.dll` (SHA-256 `e42fb3c6183cf9bc4b794bf25aa40a4d3c009a2c8cd7d35a810dad0afa9b98bc`; MVID `f1d78d6f-ed30-450e-8ae3-8f6b83db5270`). Parent feature evidence: `ev_9c73c10c0bbf5cc5cccae9a6bbaff57f3bcb729770ffa20f78a43751b468fd83`, provider `rea-dotnet-static` v1, exact type matched. `EnsureContextMenuIsValid` sets a distinct placement target/placement and hooks Opened/Closed; `OnDropdown` changes the open state. This static evidence confirms split-button/menu separation, but not BarTender's pointer hover dismissal timing or exact page navigator implementation. Related installed application is `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.

## Implementation mapping

In `gui/template-pages.js`, the page add dropdown is a top-layer menu. The arrow and menu form the hover-active region: `relatedTarget` preserves the open state only during pointer transfer between those two nodes. The plus button and all outside targets dismiss synchronously. The menu is positioned flush to the split control so pointer movement does not cross a visual gap. Click toggle, outside pointerdown, Escape, resize, wheel and menu commands retain their existing dismissal paths.

## Verification and limits

RED/GREEN: all 13 `test/template-pages.test.js` tests pass. Electron runtime `npm exec -- electron test/template-navbar-size-runtime.js` passed, verifying actual popover adjacency, arrow/menu handoff, immediate close on plus/outside, and reopen. The first whole-system run found one stale position assertion and the inventory check reported existing `test/native-datamatrix-layout.test.js` missing from the markdown inventory; both were corrected before the clean rerun. Final `npm run test:basic` passed 1,234/1,234 tests across 164 files, 0 failed/0 skipped, all three legacy checks passed and inventory gap 0; report `test/basic-unit-result.json` (2026-10-27T01:59:45.995Z). Electron DOM event checks validate adjacency and visibility state; they do not measure physical pointer timing or native BarTender pixel parity. No hardware printing is involved.
