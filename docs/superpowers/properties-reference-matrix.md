# Properties reference / implementation matrix

Reference: user 14 screenshots, 2026-10-19. Approved spec/plan in docs/superpowers. Native defaults and output semantics beyond visible screenshots require saved native fixtures; not inferred from control presence.

| Area | Reference controls | Current evidence / next proof |
|---|---|---|
| Tree | Barcode + Text roots, child tools, deeper sources, dotted connectors | Task 1 document and DOM tests; isolated Electron multi-object test |
| Object | Name, Comments, Preprinted, Print when, preview | Comments/name transaction implemented; conditions require Task 2 output tests |
| Symbology | Dimensions, specific options, encoding, color/method | Existing encoder flags need measured per-symbology support matrix in Task 5 |
| HRI | Full/None/per-source, placement/offsets, four transforms | Task 6 segmentation and encoded-byte invariance |
| Font | Three columns, six tabs | Existing partial implementation; Task 7 shared Text/HRI parity |
| Text Format | Paragraph/spacing | No dedicated reference screenshot; use approved spec, record native measurement for ambiguous semantics |
| Auto Fit | Dimensions/alignment, four adjustments, linked group | Task 8 deterministic solver and native priority measurement |
| Border | None/Rectangle/Ellipse, margins, corner/sides, line/fill | Task 4 SVG/raster parity; native compound style measurements pending |
| Position | Anchor, origin summaries, rotation, layer, lock | Task 3 world-position round trip and gesture guard |
| Error Handling | Five conditions, policy per condition | Screenshot visible defaults recorded in spec; Task 9 native fixtures and no-transport tests |
| Data Sources | Existing tools retained | Existing unit/runtime suite plus cross-object shared-source regression |
