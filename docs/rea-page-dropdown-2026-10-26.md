# Page dropdown reopen positioning — v1.240

User request: show the complete page dropdown above the split add control, including repeated opens. This fixes Q LABEL's own browser popover lifecycle; exact BarTender page-tab placement is not established.

Applied Superpowers using-superpowers, systematic-debugging, test-driven-development and verification-before-completion; read project AGENTS, UNIT_TEST_BASIC, REA README, managed-member/view MCP contracts and installed REA native/artifact guidance. REA checkout is https://github.com/morluto/rea.git at dfe8378cf5a727e3d93d47a5986233175c6ef898; connected MCP operations were available and used (no CLI fallback).

## Feature-matched installed evidence

Installed `D:/Programs/BarTend.exe` previously identified SHA-256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3. Related shipped split-button control: `D:/Programs/Seagull.Wpf.Controls.dll`, SHA-256 e42fb3c6183cf9bc4b794bf25aa40a4d3c009a2c8cd7d35a810dad0afa9b98bc, MVID f1d78d6f-ed30-450e-8ae3-8f6b83db5270. REA inspected file-backed metadata/CIL without executing target code.

`inspect_managed_members` summary ev_e87c22f447c79cf781d12fdb026fc656c7accae9494bccfc1a6e27307c79ebe9 links full parent ev_634df0c96d699c5ede10c433798254f4ea118c2a219dabfb533758d48ae72650. Types view ev_36dea4dad5ee46ad583da8f0fdb629b05c2f8cb4b1574e985fe8304fa1f6f2f8 identifies exact `Seagull.Wpf.Controls.SplitButton`.

Exact-type `inspect_managed_members` ev_9c73c10c0bbf5cc5cccae9a6bbaff57f3bcb729770ffa20f78a43751b468fd83 (provider rea-dotnet-static version 1) has no unmatched types, complete selected metadata and literals. `EnsureContextMenuIsValid` token 0x0600018d calls ContextMenu.set_PlacementTarget and set_Placement, and hooks Opened/Closed. `OnPlacementChanged` 0x06000189 forwards the new placement. `OnDropdown` 0x0600018e validates the menu then changes IsOpen. Thus menu anchor, placement and visibility are distinct state. This does not prove the native page navigator uses this specific control or opens above; above placement is the explicit user requirement.

## Q LABEL cause and change

`gui/template-pages.js` measured the menu while its manual popover was closed, then promoted it. Chromium gives closed popovers a zero-size rectangle even after clearing `hidden`. The add menu aligned a zero-width box at the control's right edge and subtracted zero height. The context menu also persisted a zero max-height, collapsing its items into a strip. Both paths now promote first, measure actual dimensions, then position synchronously before focusing an item. Existing hover, keyboard, outside-close and top-layer behavior is preserved.

## Verification

- RED: new unit regression failed with left 414px versus expected 174px. Pre-change Electron runtime failed: page action menu overlaps its page trigger.
- GREEN: all 13 template-pages unit tests passed. Actual Electron runtime passed three repeated add-menu opens with full height/width, both commands inside bounds, above/right alignment, subsequent context-menu height, duplicate/delete hotkeys.
- Electron capturePage did not include the top-layer popup pixels in the retained crop despite open=true and a nonzero browser rectangle; that crop is not visual verification. Runtime assertions validate browser geometry and unclipped command rectangles.
- Whole-system command: `npm run test:basic`; log `D:/QLabelNativeLibraryAudit-20261023/basic-dropdown-v1240-20261026.log`. Final totals recorded in `test/basic-unit-result.json` after completion.

No native pixel-parity, physical printer or complete native-template-library claim is made by these tests.

Final whole-system result: 1,209/1,209 unit tests passed, 0 failures/skips; all three legacy stages passed; undocumented inventory gap 0. Browser command hit testing also passed for both dropdown items on every reopen.
