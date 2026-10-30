# Native library objects implementation plan

Goal: self-contained editable library templates with complete objects and source behavior.
Spec: docs/library-native-objects-design-2026-10-23.md (approved by user).
Architecture: native export into a lossless intermediate package, audited conversion to Q LABEL objects and behavior, bundled assets without native runtime dependency.

- [x] Establish native export coverage using Interop.BarTender IBtDesignObject.GetXML and BTXML object queries. A4A and Accessory Box each enumerate four objects; AIAG B-10 Supplier Master enumerates 28. Record unsupported/empty native payloads as coverage gaps, not reconstructed objects.
- [x] Implement scripts/export-bartender-objects.ps1 for read-only per-file export with artifact identities, errors, counts and dependency inventory. All 480 cloud entries downloaded; three duplicate URL pairs account for 477 unique source files. Enhanced native export records each native collection object separately.
- [ ] Add lib/btw-object-package.js to preserve native object XML, assets and sources with strict validation. Tests must reject truncated/unsupported conversion instead of silently dropping objects.
- [ ] Add lib/btw-object-converter.js adapters by observed type and extend existing object editors/renderers/print encoders for missing properties. Test geometry, text/font, colors, barcodes, pictures, shapes, tables, groups and symbols against native fixture values.
- [ ] Add source, serialization, script and form adapters using original exported semantics. Record external database/font/asset dependencies. No inferred expressions or synthetic barcode values.
- [ ] Integrate verified packages into gui/main.js and gui/new-label-wizard.js; replace flattened imports only when full conversion succeeds. Verify all catalog templates and save/reopen/edit/print fixtures; run complete basic tests and runtime checks, update checklist, release version and Thai changelog.

Execution uses Superpowers executing-plans inline. Application implementation depends on successful native extraction. Native metadata evidence ev_0808dc2cc60122c361dcc01e2f5f891a2b19d06475664e698eb2b373ecf6bf7d confirms IBtDesignObject.GetXML(bool,bool,BtUnits), GetProperty(string), style and geometry accessors. API metadata does not establish export completeness.

Ruling: independent object/source/font audit work was delegated under the
dispatching-parallel-agents skill; integration and native extraction remain in
the parent session. Candidate modules explicitly block unverified conversions.
No production switch or release is justified while any native object/source is
missing. The package reader, format inventory and corpus audit are implemented;
they do not satisfy the remaining complete-conversion requirements.
