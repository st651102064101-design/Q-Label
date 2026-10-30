# Page Setup roll preview — v1.243

## Request and workflow

The user supplied Page Setup images and approved the four-point summary with “เริ่ม”: show the roll stock, rounded/configured labels, neighbouring paper, margins/gaps, live layout changes and Page/Template Size captions like the supplied BarTender screenshot. Applied installed Superpowers using-superpowers, brainstorming (specific approved visual scope), writing-plans, executing-plans, systematic-debugging, test-driven-development, requesting-code-review and verification-before-completion. Read project AGENTS, UNIT_TEST_BASIC, REA README, native-and-artifacts reference and MCP contracts; inspected the active catalog and open_binary/search_strings/close_binary schemas. User workspace contains pre-existing changes, preserved in place.

## REA native feature evidence

- Checkout upstream `https://github.com/morluto/rea.git`, current revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`.
- Installed primary application `D:/Programs/BarTend.exe`, checked SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Related installed English resource DLL `D:/Programs/BtEnu.dll`, checked SHA-256 `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`.
- Connected MCP `open_binary` with provider ghidra, then `search_strings` regex `Gap / Pitch|Template Size:|Page Size:|Horizontal:|Vertical:`: evidence `ev_4dbf20748fe7fb7cea203a69d364e885d9072debe08605813b8ac5af901c3b1a`, Ghidra 12.1.4, Page Size at `0x10341dbe`, Template Size at `0x10341dd6`.
- Follow-up regex `Gap.{0,12}Pitch|corner radius|&Horizontal|&Vertical`: evidence `ev_1f7d74311163a9590cdd63880515de41c91cf63d9b0eab017205a57f9592b6d6`, Corner Radius at `0x1035295a`. Unrelated Tile Horizontally/Vertically matches are excluded from feature conclusions. Gap/Pitch text was not recovered in these bounded defined-string searches; absence from that inventory is not proof it is absent from the application.
- Native resources confirm feature naming and captions, not the drawing algorithm, exact radius defaults, media inference or runtime pixels. This unsupported question was reported before implementation; SVG geometry follows the user's approved screenshot and actual Q LABEL settings. No CLI fallback was needed.

## Cause and implementation mapping

`gui/modal-preview.js` previously equated a single cell with a roll, so a 2×2 roll got a rectangular sheet border/shadow and no roll continuation. It now derives roll identity from stock.printer_type (default Roll), keeps explicit Sheet/Card/Page as sheets, and draws neighbouring row fragments for every roll column. Fragments are clipped full configured faces, preserving radius/ellipse geometry. The base has no square sheet border; faded liner sides and stock backing frame separate label outlines. Physical margins/gaps use the same committed geometry as the live cells, including zero. Roll catalog stock uses this shared renderer instead of the separate wizard stock illustration; explicit sheet catalog previews keep their existing path. Page Setup retains the blue gradient; grey wizard behavior is separate.

Preview tab selection now uses stable tab IDs rather than text content and observes aria-selected changes, so consumed clicks and added SVG title text cannot leave the wrong rendering mode. The runtime fixture also required waiting for asynchronous close/cancel completion before replacing its isolated document; its initially stale closed-dialog image was a fixture race, not native evidence.

## Verification

RED: new 2×2 regression failed with zero previous-row fragments instead of two; separate tab-consumption and clipped-face checks also failed before their changes. An independent review found that a large physical vertical gap could put continuation outside the viewport; a red/green 25×100mm, two-row, 20mm-gap case now verifies fit, and the reviewer confirmed the denominator fix. GREEN: final focused Page Setup/stock/wizard suite passed 43/43. The first full suite exposed an old mirror assertion selecting a new neighbour clipping group; its selector now targets the main label group and retains all rotate/mirror/negative assertions. Final full suite result recorded after execution. Electron runtime passed all eight tabs, four-cell roll with zero/nonzero gaps, explicit twenty-label sheet, stock replacement, and captions after the final scale change; both PNG captures were visually inspected. Native pixel comparison and physical printing are unverified.

Final `npm run test:basic`: 1,235/1,235 unit tests passed across 164 files, 0 failed/0 skipped, all three legacy stages passed, no undocumented test files. Report `test/basic-unit-result.json` timestamp 2026-10-27T02:18:51.720Z, version 1.243. Relevant-file `git diff --check` passed (line-ending notices only). REA native session closed; installed artifacts and user applications were preserved.
