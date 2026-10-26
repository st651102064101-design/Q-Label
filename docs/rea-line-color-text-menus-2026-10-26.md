# REA evidence: line, colour, Text and Picture menus — 2026-10-26 (v1.238)

## Scope
Dash, Compound, width, outline/fill colour popup, Text and Picture ribbon dropdowns. Application-side behaviour is mapped from user screenshots; REA below only confirms feature strings in the shipped resource DLL.

## Native artifacts (SHA-256 checked against earlier records)
- `D:/Programs/BtEnu.dll` c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b (x86 PE, shared library).
- `D:/Programs/BarTend.exe` 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3 (mixed CLR/native; outside the Ghidra provider's admission, not analysed here).

## REA commands
Checkout `../rea` origin https://github.com/morluto/rea.git at dfe8378cf5a727e3d93d47a5986233175c6ef898, CLI 6.7.0, Ghidra 12.1.4 via `scripts/rea-local.ps1` (the MCP route was not used; CLI fallback as documented). Command: `rea trace D:/Programs/BtEnu.dll --query "<text>" --provider ghidra --format json`. Outputs saved in `D:/QLabel-agent-work/rea-20261026/trace-*.json`.

| Query | Evidence ID | Native finding (string address) |
|---|---|---|
| Compound | ev_fca20df0eaeba71a0e5582d92696ae7d31df71e3e7006f63ae36569efea2efb5 | "Compound Style" (0x10344e20, 0x10371df4) and tooltip "Specifies the line compound style of the selected object(s)." (0x1033762a) |
| Dash | ev_55d05a3b22ec757d9a4ddbf1f4287dee12a064ee8bd487b0f061cc07ce075cfa | "Dash Style" (0x10344e0a, 0x10371dde), "Dashed Lines" (0x10347476), tooltip "Specifies the line dash style of the selected object(s)." (0x10351c64) |
| Normal Wrapped | ev_26ae962de50c678db7c49b0e4b09ed930b9da37d3b716c672a19a51c4c7c7ebf | "Normal Wrapped" (0x10372b20); description says it displays text on one or more lines using word wrap (0x1035ab54) |
| Word Processor | ev_5d9376c5a394c6272b0661d184d2552d90968b5ecd2064a970ea7f1abb489b83 | "Word Processor" menu text and a description listing bullets, numbered lists, tables, mixed fonts and RTF merge fields (0x1035abf2) |
| Insert from Scanner | ev_6823bd38b67f1c8f4ed5a0c56c1535b5859221adc5ab4733ad488edb1700673e | "Insert from Scanner or Camera..." (0x1031a22c) |
| Pantone | ev_e36daae4bdb673d072250b24abfa71a71015d1583ee927affc959ba9dda2814a | No match in BtEnu.dll; PANTONE data ships in `Seagull.PANTONE.*.dll` (not analysed, not copied: licensed data) |

## Implementation mapping
- Dash and Compound pickers carry the native control names/tooltips; Normal Wrapped inserts a word-wrapped text object, matching the native description; Scanner/Word Processor entries exist natively and are shown disabled because Q LABEL cannot perform them.
- Shape of the menus (swatch order, 34 dash patterns, 7 compounds, 0.5–24 pt list, colour hexagon layout) comes from screenshots and the existing Border tables, **not** from REA.

## Not established
Native dash/compound pattern values and their order, pt list contents, colour wheel values, menu click semantics, the third ">>" tab, pixel parity. String presence does not prove behaviour. No printer comparison.

## Update 2026-10-26
The colour popup tab was renamed PALETTES and lists CSS Named Colors (resolved by the browser). PANTONE data is intentionally not bundled or extracted (licensed content; decision: open palette).
