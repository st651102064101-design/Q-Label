# Side Edges investigation — 2026-10-21

## Scope

The supplied BarTender screenshots show the Side Edges wizard page with Yes/No choices, disabled zero-valued Left/Right fields under No, editable unused-area widths under Yes, and a media preview. The requested Q LABEL change adds this page after Dimensions and retains the current Q LABEL visual style.

## Skills and workflow

- Applied Superpowers `using-superpowers`, `brainstorming`, `systematic-debugging`, and `test-driven-development`.
- Read `labelforge/AGENTS.md`, `UNIT_TEST_BASIC.md`, and `docs/rea-bartender-workflow.md` before edits.
- REA checkout: `../rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Active session REA MCP catalog and selected input schemas were checked. No CLI fallback was needed; connected REA MCP was available.

## REA and artifact evidence

1. `mcp__rea__inspect_managed_artifact` on `D:/Programs/BarTend.exe` (summary view) retained parent evidence `ev_f9c2b5a64d78847e202e1b1bd173593a2d69c94bb0fc723257046570f9fed610`; summary `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`. SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`. It identifies a complete 2,434-type mixed C++/CLI metadata inventory, but the operation does not decompile or execute the target.
2. `mcp__rea__inspect_managed_artifact` on `D:/Programs/BtEnu.dll` returned parent evidence `ev_ef47cd224cfc9d193b6643bf09c7869be11b14fd250463035b80c0383e7da962`; summary `ev_28a9bd9164b99d8b9a8de2b513b463727b4bd9ab838d4c6e5224ecffbae1a56e`. SHA-256: `c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b`. It has no CLI data directory, so managed member analysis is unavailable.
3. Connected REA MCP opened `BtEnu.dll` with Ghidra 12.1.4 (`mcp__rea__open_binary`); target identity matched the hash above. `mcp__rea__search_strings` searched literal, case-insensitive `unused material` (evidence `ev_3fb16e7f7fdf12f34c45cf04c96eac7bc446830071ebef3bebcd5c5ade498b39`) and `unused area` (evidence `ev_0efc5354c01a5798d4632601e1dd76325e514fcfdd90ce07982e527461ae0512`). Both returned no Ghidra-defined string matches. The binary session was closed with `mcp__rea__close_binary`.

## Findings, mapping, and limits

- The screenshots directly show the two selection states and labels; these are user-supplied reference observations, not REA evidence.
- REA confirms BarTend.exe's mixed managed/native classification and artifact identity only. The selected analysis did not recover Side Edges controls, handlers, value conversion, preview behavior, or saved output. BtEnu.dll string searches also found no feature-matched wording.
- Q LABEL maps Left/Right values to the existing `stock.liner_left_mm` and `stock.liner_right_mm` fields. They remain distinct from `page.left_mm` and `page.right_mm`; the existing Stock preview displays the edge widths. Selecting No disables the fields and saves zero values. Selecting Yes initializes both widths to 1.27 mm (0.05 in), matching the enabled screenshot.
- Implementation: `gui/new-label-wizard.js`. Behavior coverage: `test/printer-resolution.test.js`; checklist and inventory entry: `UNIT_TEST_BASIC.md`.
- Unknown: BarTender runtime transitions and exact persistence/printing effects remain unverified. This change implements the screenshot-matched Q LABEL behavior; it does not establish 100% BarTender parity or remove other wizard controls not shown in the supplied references.
- Verification is recorded in the task completion response. No native printer output is part of the unit test.
