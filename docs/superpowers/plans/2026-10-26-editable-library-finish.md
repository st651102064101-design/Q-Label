# Editable selected library templates — execution ledger

Approved scope: the user requests Finish to open the selected native template with separately editable original text, barcodes, pictures and other objects. Continue the approved native library design, never derive objects from a thumbnail.

Workflow: REA feature evidence plus Superpowers systematic debugging, TDD and executing-plans. Independent read-only A4A/corpus audits use dispatching-parallel-agents. Work stays on the existing `codex/properties-all-pages` development checkout because the native/source implementation is present as prior uncommitted work; a detached clean checkout would omit required adapters. Preserve unrelated changes. No commit or publish requested.

- [x] Locate the real A4A source, original object/source exports and retained native font measurements; verify installed artifact identities and live REA matched API schema/results.
- [x] Prove and implement A4A native DataMatrix geometry/encoding and dormant HRI handling using isolated source copies and independent module comparison; retain the fixed-bounds autosizing limitation.
- [x] Convert A4A document settings and preserve the original enabled form plus PromptValues as metadata, while explicitly excluding unsupported native form behavior and disabling its wizard option.
- [x] Assemble the SHA-bound A4A package and connect production selection → Finish → four independent objects → source edit → Save/reopen. Keep strict diagnostics for unsupported source content.
- [ ] Audit the remaining corpus and implement further object mappings from matched native evidence; current verified package admission remains A4A only.
- [x] Add meaningful regressions and real production Electron import/edit/save/reopen coverage. Full basic suite and A4A-only independent review passed; remaining-corpus audit is still open. Version v1.248 (v1.247 was concurrently added for Page Setup outlines).

## Findings

A4A SHA256 `4c4afa8060191968c5d34f06865a029c4f53c25164e14b094e368040be18b783`: Text 1, Text 2, DataMatrix Barcode 1, Text 3. Native text metrics and an exact-source-bound DataMatrix fixed-bounds profile now produce four editable objects. Original page is 76.2×25.4mm on Letter, 2×10, rounded corners, and native Forms enabled. PromptValues and original form metadata are retained; form execution/UI remains excluded.

REA Interop.BarTender.dll SHA256 `a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515`, version6.7.0, matched IBtDesignObject/IBtFormat summary `ev_91c113ebf3463a919bdc2c10470997286c92d256acf4729f130082f514e4f9f9`, parent `ev_be8a50aa120bbfbd8dc6a675d0350236514f8b84ba39c9565019be7b09c55ac6`, method page `ev_433ddc7f64a090c9a2106e09b9b891040ddd52052a190ec6368dd60e25ae28db` establishes GetXML, SetXML, GetProperty and ExportToFile signatures. Metadata is distinct from runtime encoding/layout evidence. BarTend.exe SHA256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; REA checkout https://github.com/morluto/rea.git, revision `9341b116efddefc2bcdd8208d27d6e4ea78cc507`. Live schemas and mcp-contracts Tool Results/retention were read; no provider installation/fallback.

Current corpus: 477 distinct BTW files, 480 catalog entries, 8,630 original objects. One SHA-bound verified editable package is bundled for A4A; remaining templates are not admitted as editable. Source behavior audit previously passed 12,593/13,563 definitions; 970 remain. Fresh read-only audits will replace stale aggregate conversion results.
