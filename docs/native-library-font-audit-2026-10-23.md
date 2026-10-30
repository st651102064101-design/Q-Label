# Native library font and symbol audit

Scope: all 477 unique native template XML exports, covering 480 cloud catalog
entries. This is conversion research; assets have not been bundled into Q LABEL.

## Findings

The audit found 46 exact font names and 6,453 Font nodes: 5,685 text, 533 barcode
text and 235 human-readable font definitions. Fourteen exact names (207 font
occurrences) have no exact installed font match: TEC Outline Font 1B, Zebra
Triumvirate, TSC Sans Serif, Brother Sans Serif, Caveat, Helvetica, Gill Sans Nova
Light, Seagull: Certification Mark v1., Autobag CG Triumvirate, Dom Casual, SATO
Helvetica, Printronix CG Triumvirate, CG TRIUMV., and Intermec Font c0.

Some are printer resident fonts. Substituting Arial based on their name would
not establish the original metrics or appearance. The truncated certification
font name is only a candidate match to the shipped v1.0 font.

Seagull symbol fonts require actual cmap handling. Some shipped fonts map a
stored byte to U+F000 plus that byte (Windows platform 3, encoding 0); others use
direct low code points. Rendering stored `d` as Latin text can therefore be
wrong. Individual glyph indices are retained in the staged symbol manifest.

## Reproducible evidence

Audit outputs are retained under
`D:/QLabelNativeLibraryAudit-20261023/font-assets/`:

- `font-object-inventory.json`: native names, occurrences, values and source objects.
- `available-font-files.json`: scanned file identities and name tables.
- `asset-manifest.json`: 143 source records, deduplicated copied font files,
  original SHA-256 and staged paths.
- `symbol-glyph-map.json`: actual font cmap and glyph index mapping.
- `audit-fonts.cjs`, `copy-and-map.cjs`, `summarize.cjs`: audit tooling.

REA Interop member evidence
`ev_003921134e41252433483702b1634a1ffe141684f682c9b060e3bb43856012fc`
matches `BarTender.IBtDesignObject` in `D:/Programs/Interop.BarTender.dll`, SHA-256
`a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515`.
It establishes the native font/style accessors and GetXML interface. Name/cmap
inspection and runtime XML counts are separate ordinary artifact observations,
not decompiled rendering semantics or pixel parity evidence.

## Outstanding work

Resolve original missing fonts and printer font metrics, confirm the truncated
font identity, implement exact symbol glyph selection and test screen/export/
print behavior. Staged files are audit copies; no font redistribution decision
or complete appearance claim is made by this report.
