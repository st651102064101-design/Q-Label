# Native basic character acceptance fixture

Generated 2026-10-18 from the installed BarTender 12.1.0 `Seagull.Forms.Controls.dll`.
SHA256: `DCBFE259131EC500DDFB56EA264681BC4BF375B107070025FB45D61BBB1CC0BB`.

A new disposable, unshown `Seagull.Forms.Controls.DataEntryTextBox` was constructed
in Windows PowerShell/.NET Framework. For each of seven `SetSimpleMaskType` values,
its private `IsValidText(string)` method was invoked on each complete input string.
The control was disposed in `finally`; no reference document or printer was used.
Inputs: U+0000–U+007F, U+00A2, U+00E9, U+0E01, U+0661 and U+1F600 (133 per mode).
`native-character-filter.json` stores observations only, not vendor code or DLLs.

This establishes single-character acceptance in the vendor data-entry control.
It does not establish native print-time removal, warning behavior, transform order,
input-mask grammar or regular-expression compatibility. Q LABEL retains its
existing Unicode letter/alphanumeric modes for old documents; the added ASCII
modes are distinct. The native filter configuration form initializes selection to
All; enabling a new Q LABEL Character Filter follows that selection.
