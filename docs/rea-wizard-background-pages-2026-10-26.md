# New Document Wizard — Template Background Color / Picture / Design Guide Image pages (v1.238)

## Requested behaviour
User screenshots show three extra wizard pages after Template Background, one per ticked feature (Color, Picture, Design Guide Image). Page layout, option names and defaults come from those screenshots.

## REA (CLI 6.7.0 via `scripts/rea-local.ps1`, checkout dfe8378… at the time; `trace D:/Programs/BtEnu.dll --provider ghidra --format json`)
BtEnu.dll SHA-256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b. Outputs: `D:/QLabel-agent-work/rea-20261026/wiz-*.json`.
| Query | Evidence ID | Native finding |
|---|---|---|
| Template Background Color | ev_6c609d85bb6d5b18a… | page title string at 0x1035262a |
| Template Background Picture | ev_afaf1216a97eec786… | page title string at 0x1035265e |
| Design Guide Image | ev_ae8f7856ad9c9dd4e… | title at 0x10352696 and subtitle "Select a design guide image to display in the background." at 0x10352774 |
| Linked Picture | ev_d7f52b7cfab515607… | source option string at 0x10352df6 |
| Hide design guide image, Overhang template | ev_5945de7c…, ev_87961199… | no literal match (labels likely differ in case/accelerator markup); not established |

## Implementation mapping
- Ticking a checkbox no longer opens a native chooser; it adds a sub-page. Order Color, Picture, Design Guide; unticked features are skipped; Back retraces them.
- Color page: colour popup (None, standard/palette), Options (Preprinted, Print when, Overhang) shown disabled.
- Picture page: Source No Picture / Embedded Picture / Linked Picture (disabled); Browse for embedded; Size method and Rotation limited to Stretch / 0°; processing buttons disabled.
- Design Guide page: File… works, Scanner or Camera… and Color disabled; Hide and Remove act on the saved `design_guide_image` / `design_guide_hidden`.
- The design guide is drawn at 50% under the objects in the editor only (`data-design-guide` image when `editorPlaceholders`), never in prints.

## Not established / not done
Size method choices other than Stretch, rotation, Linked Picture, Preprinted, Print when, Overhang, Image Processing, Error Handling, scanner, guide colour, native pixel layout and Finish-page wording for the new pages. No printer comparison.
