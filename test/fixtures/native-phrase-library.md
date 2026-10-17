# Native phrase-library fixture

Generated on 2026-10-18 from the installed BarTender 12.1.0 Data Builder DLL,
using a new in-memory `BtDataSet`, `BtDataSetAdapter.CreateTextTable`, and
`DataSet.WriteXml(..., XmlWriteMode.WriteSchema)`. The input data was synthetic:
table `Shipping phrases`, ID `greeting`, English `Hello`, Thai U+0E01.

The installed `DataBuilderXmlSerializer.AttachStream` and `Load` methods reopened
the fixture successfully. The Thai value was checked by ordinal code point 3585,
independently of console encoding. No SQL connection, user database, document,
printer, or service configuration was used.

- DLL SHA256: `2F0DC025E802305881CED0B1168D8D4FC71CF4B128FE2BD3CCD23B0227A58BB5`
- Fixture SHA256: `BEC702F47C4993F319B061041E38327F0F41F6D8C37FFAEE7ED5314D0A338D6B`

This establishes the plain-XML text-table variant only. It does not establish
SQL-backed, encrypted, legacy, identity/version, authoring or complete native
Library Phrase behavior. Production code uses an independent parser and does not
load a vendor assembly. Decompiled vendor implementation is not included here.
