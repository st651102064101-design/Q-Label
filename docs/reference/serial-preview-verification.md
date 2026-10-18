# Serial quantity and Preview — 2026-10-18

## Defect and correction

The Print dialog disabled serialization whenever legacy placeholder fields were
absent. Object Data Sources can contain serialization transforms without any
such fields. Job preparation also rejected a serial quantity without a legacy
field name. The dialog now detects enabled, referenced serialization transforms
(including named/object links) and uses their existing settings for start/step.

Explicit serial quantity expands the job into serials followed by identical
copies. Source preparation receives a separate serial index; ledger reservation
counts serial values rather than physical duplicate pages. Existing jobs using
copies alone retain their earlier per-copy serialization behavior.

## Reference evidence

- The user's screenshot shows Serial numbers=10, Copies per serial number=1,
  and reference Preview page5 of10 with displayed serial0005.
- Installed `Automation.chm` extraction documents NumberSerializedLabels and
  IdenticalCopiesOfLabel separately. This is documentation evidence, not an
  executed reference-output comparison.
- Read-only CLR metadata of `D:/Programs/BarTend.exe` identifies native
  PrintData.SetSerializedCopies RVA0x250FE0, GetSerializedCopies RVA0x251370,
  and PrintCopiesDialog.SetInitialSerializedCopies RVA0x5525C0.
- Targeted Ghidra decompilation of all three completed successfully. The getter
  reads a stored quantity unless an internal flag forces1. The setter invokes
  an unresolved helper with bounds1 and999999999 and notifies a virtual callback.
  The dialog method forwards an initial quantity to its existing control.
  These small routines do not establish the whole serialization engine.
- Research pseudocode stays in ignored `.superpowers/sdd/2026-10-16-object-data-sources/decompiler/ghidra-serial-output/`.
  Original EXE SHA256:0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.

## Executable verification

- `test/source-serialization.test.js`: ten serials, two identical copies each,
  zero-padded values, prepared preview resolution and ZPL values agree; repeated
  preview does not create a ledger; an accepted mock reservation advances10.
- Multi-item reservation regression: three generated serial pages reserve three values; the next job starts0004, preventing serial reuse.
- `test/source-serial-print-dialog.test.js`: no legacy fields, quantity enabled,
  ten-page preview, Next/Last/First show0002/0010/0001, zero transport submissions.
- `npx electron test/source-serial-preview-runtime.js`: isolated appData, actual
  prepared graphic rendering changes across pages and returns to the same SVG
  on First, values0001–0010, repeated preparation retains serial values. Passed.

## Limits

No physical print or new live BarTender export comparison was performed. Database
and data-source-driven quantity options in Print Quantity Options are not added.
Q LABEL retains its 10000-page job safety limit. Multi-cell stock, all native
reset/rollover conditions and every quantity-option combination are not verified;
this change does not establish 100% BarTender parity.
