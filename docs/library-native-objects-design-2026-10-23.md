# Native library objects: proposed implementation

User requirement: every library template must become a Q LABEL document with independently editable original objects and all source behavior. Final use must not require BarTender. Preserve text, barcodes, pictures, symbols, lines, shapes, tables, grouping/layers, positions, dimensions, rotation, colors, fonts, data sources, formulas/scripts, serialization and forms. An original picture remains a separately editable picture object; its pixels are not evidence of text or barcode objects.

## Design

1. Export an inventory from the installed source documents using native object queries. Keep original object IDs, types, properties, assets and source expressions in an intermediate package. Record every unrecognized field. Do not infer objects from preview pixels.
2. Audit all 480 catalog entries against actual available BTW files. Produce per-template object counts and dependency lists. Missing files, fonts, linked images, databases and credentials must be explicitly reported.
3. Add Q LABEL object adapters and missing editors/renderers/printing behavior by observed original type. Preserve original picture assets as pictures. Store font identity and metrics; do not silently substitute missing fonts.
4. Implement the source/behavior mapping, including serial counters, database fields, forms and scripts, with documented coverage. External credentials and unavailable databases cannot be reconstructed from screenshots.
5. Package the converted documents and assets with Q LABEL. Normal selection, editing, save/reopen and printing use Q LABEL data and engines.
6. Validate every template: object count/type/IDs, geometry/style/source property comparison, edit each supported class, save/reopen, resolve data and render/print fixtures. A template with unsupported properties is reported as incomplete rather than represented by a flattened image.

Acceptance: every catalog entry has an audit result; none silently drops objects or properties. Completion requires all requested objects and behaviors supported, not only a few sample labels. Native automation may be used for development/export, but final runtime has no BarTender dependency. No BarTender executable or DLL is bundled into Q LABEL.

## Evidence and unknowns

REA inspected D:/Programs/Interop.BarTender.dll, SHA256 a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515. Retained member inventory evidence ev_0808dc2cc60122c361dcc01e2f5f891a2b19d06475664e698eb2b373ecf6bf7d contains 197 types and 2,422 methods. This establishes API metadata only, not complete object export coverage. Ordinary source inspection of shipped btxmlscript_base_2.0.xsd confirms GetObject/GetAllObjects with Query/Units parameters. The next investigation must establish returned properties and available template files before dependent application changes.
