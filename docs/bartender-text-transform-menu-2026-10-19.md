# Text Transforms evidence — 2026-10-19

## Delivered scope v1.014

Text displays Suppression, Character Filter, Truncation, Number of Characters, Search and Replace, VB Script, Serialization, Character Template, Prefix and Suffix, in that order.
Configured compression, offset and range rows remain editable, including disabled configurations. Rendering never changes stored transform order. Other data types retain existing controls pending evidence.

## Provenance

- Original D:/Programs/BarTend.exe SHA256: 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.
- REA source dfe8378cf5a727e3d93d47a5986233175c6ef898; published CLI6.7.0. File is mixed CLR/native, not pure IL.
- Read-only Ghidra scoped recovery of DataSource.GetTransformDialogsArray at RVA0x0d8100 returns nine entries for native Text/default format0: [0,1,2,3,12,8,10,11,13]. RTTI/vtable getter evidence maps Date1, Time2, Number3, Currency4, Percentage5, Fraction6, Binary7, Picture8.
- Display labels/order are independently taken from the user supplied Text Transforms screenshot. Native array IDs are NOT asserted to map to labels in position order.
- TextTransformsPage.DataIn recovery reports an unresolved switch jump table. A completed decompile is not proof of complete behavior recovery. Raw vendor pseudocode remains outside production code.

## Checks

Three DOM regressions cover display order, preservation of configured extensions and source type switching. Before the change the two new menu assertions failed; after the change the focused UI/wizard suite passed47/47.
Isolated Electron fixture test/source-text-transform-menu-runtime.js checks actual Properties, Number→Text, prefix/suffix commit, Cancel and prepared-print equality. No transport or physical printing is performed.
Full basic results are recorded in test/basic-unit-result.json after running npm run test:basic.

## Remaining work

This is incremental menu compatibility, not100% Data Sources equivalence. Native ID-to-label mapping, other type capability matrices, complete transform semantics, VBScript events, input mask/regex warnings, processing order and actual printer comparison remain to be established.
