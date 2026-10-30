# Picture dropdown stays open while moving pointer — v1.258

## User request and workflow

The user reports that moving the mouse onto the visible Picture dropdown makes it close and requested that it remain open. Applied Superpowers `using-superpowers`, `systematic-debugging`, and `test-driven-development`. Read project AGENTS, UNIT_TEST_BASIC, REA README, the Windows Ghidra P0 reference, `docs/rea-bartender-workflow.md`, and the relevant REA MCP contracts. The live MCP catalog and selected schemas were checked.

## Native BarTender evidence and limit

Verified installed targets and hashes:

- `D:/Programs/BarTend.exe` — SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- `D:/Programs/AWEnu.dll` — SHA-256 `9193674ed5f2b63124c6b1e5b5857590642e4440d87de9d7eda59569b63537e5`.

The live REA `open_binary` operation selected AWEnu.dll in Ghidra 12.1.4. `trace_feature("Insert from File")` evidence `ev_29d5d319ae03d20aeb3d37560025fadff5a5332e2c63aa4b1d2bb199d3c2bf95` had no defined-string/procedure matches. This artifact query did not establish native hover timing or ownership. Exact native pointer transitions remain unknown; the code change implements the user's explicit behavior in Q LABEL and makes no claim of BarTender parity.

The REA checkout is upstream `https://github.com/morluto/rea.git`, revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`. The MCP was available, so CLI fallback was not used.

## Root cause and implementation

`gui/ribbon-hover-menus.js` registered both Text and Picture with the same `.line-menu.tool-menu` selector. When the pointer entered the Picture menu, `hitFor` returned the first matching registry entry (Text) before checking which trigger currently owned the shared menu. The pointer transition therefore toggled the wrong dropdown and replaced/closed the visible menu.

The hit resolver now prioritizes the button under the pointer, then the currently open menu owner, and only then any other matching menu. This preserves trigger semantics while allowing movement from the button to its dropdown.

## Verification

- RED: the new `test/ribbon-hover-menus.test.js` reproduced the bug by showing that entering Picture's shared menu called `toggle('text')`.
- GREEN: the regression passes after prioritizing the active menu owner.
- `electron --disable-gpu test/ribbon-hover-menus-runtime.js`: the test window did not initialize and the runtime produced no assertions; the isolated process was stopped. UI runtime remains unverified.
- `npm run test:basic`: PASS, 1,275/1,275 tests in 169 files, 0 failed/0 skipped/0 undocumented; all 3 legacy stages passed. Report `test/basic-unit-result.json` (2026-10-28T02:58:41.637Z, display version 1.259). Workspace advanced after this run, so the current app version may be newer than the tested report version.
