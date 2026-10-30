# Native UPC and picture continuation — 2026-10-26

User scope remains every library template with independently editable original
objects and complete source behavior. This continuation does not certify the
whole library or promote unresolved candidates into verified packages.

## Gate and evidence

Read/applied project AGENTS, UNIT_TEST_BASIC, Superpowers using-superpowers,
executing-plans and TDD; read REA README, MCP tool-result contracts, installed
REA v42 and target workflow. Live inspect_managed_members schema checked and
connected operation used on Interop.BarTender.dll with exact IBtDesignObject
and IBtFormat selection; both match. Retained summary
`ev_91c113ebf3463a919bdc2c10470997286c92d256acf4729f130082f514e4f9f9`,
parent `ev_be8a50aa120bbfbd8dc6a675d0350236514f8b84ba39c9565019be7b09c55ac6`.
REA checkout origin https://github.com/morluto/rea.git, revision
dfe8378cf5a727e3d93d47a5986233175c6ef898; CLI/server6.7.0. Metadata establishes
GetXML/SetXML/export interfaces; the ordinary controlled runtime probes below
establish their observed behavior separately.

Matching installed identities:

* D:/Programs/BarTend.exe SHA256
  0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.
* D:/Programs/Interop.BarTender.dll SHA256
  a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515.

## Original picture source

Actual Accessory Box source SHA256
94bd0f5f31b86618ece547d4297df3c60e2c9b020f62fbdb8f8d91b2d5ba026d.
Picture3 original shared Logo ID {A46BF1E5-E0FF-41A6-8E2A-AF500AA76E61},
63656 Base64 characters, 47742 PNG bytes,255x255 original pixels. Full original
GetDataSources and GetFormatProperties snapshots bind it by native shared name.
lib/native-source-picture decodes current data at preview/print preparation;
original definition remains text. Invalid encoding/PNG/size/source refs fail,
never retain stale artwork. Color bytes/alpha are preserved; thermal monochrome
composites against white. Only explicit Base64 PNG is implemented here.

Replace picture now updates original embedded definition.config.value and keeps
native ID/name/shared refs. Different source kinds reject this operation instead
of severing a live database or calculated binding. Renderer file-input and
property-dialog replacement route through the model helper. No original BTW is
saved or modified.

## Controlled native UPC observations

Probe directory D:/QLabelNativeLibraryAudit-20261023/text-barcode-followup.
barcode-native-final-probe.ps1 opens fresh copied Accessory documents in its own
COM app, preserves all original object XML when changing target width and exports
screen/page pictures. Original document and user process are untouched; owned
app/document close without saving. Object Width accessor returns unsupported;
GetXML Width can change from45.72 to53.7718 after export, so it cannot alone
identify bars versus total HRI bounds.

barcode-size-table-probe.ps1 independently changes637 target widths1..160mm in
0.25mm steps, always from original XML. Every native Index matched:

    index = max(0, floor((target_mm /25.4 *300 -160) /95))
    nominal_x_mils =5 +index *10/3
    bar_width_mm =(95 *index +160) /300 *25.4

The derived bar width also matches the returned native density (12digits per
inch) to its native display precision. This is the observed UPC-A/UniGDI profile
with min5mil/max500mil; it is not inferred as a universal barcode sizing rule.
Original target48.26mm selects index4 and bar width45.72mm. All637 input/output
rows are copied into test/fixtures/native-upca-size-table.csv. Other bounds,
outputs and target ranges remain unsupported instead of using this fallback.

source-followup/upc-length-probe.ps1 and upc-length-object-probe.ps1 use native
ExportPrintPreviewToImage (no physical printing).10digits and11digits are valid;
12valid check digits are accepted;13digits and incorrect12digit checks yield
warning3752 and btFailure.10digit encoding zero-pads to11data digits, confirmed
against all95 modules in the actual native object PNG. Native minimum character
warnings/corrections remain the source adapter's separate responsibility.

lib/btw-native-upca implements this bounded profile; barcode-catalog uses it only
when the explicit native_upca marker is supplied. Source text stays original,
while encoded HRI exposes padded/generated digits. Ordinary encodings unchanged.
Native HRI original font bytes and SHA are checked before BWIP registration;
each UPC digit retains its standard segment position. Native dormant HRI sources
remain preserved in the registry, not substituted as an active caption.
Center anchor and full native HRI outside/guard bounds remain unverified for
complete package admission; the candidate is still not marked complete.

## Verification and runtime findings

TDD: new source picture tests failed4/4 before implementation, then passed;
replacement model test failed missing helper then passed. Native HRI mapping
test failed missing spec then24converter/font tests passed. UPC sizing tests
first failed missing module, then all637cases passed plus input/profile guards.

Actual production IPC/Finish/file-input/save/reopen fixture test initially hung:
hidden Chromium windows do not advance Image.decode reliably. Displaying the
isolated inactive test window resolves it; no original user window is closed.
Test captured immutable original Logo before changing the fixture, fixing an
aliasing mistake in expected data rather than loosening assertions.

The real runtime test then exposed native coordinate precision loss: row input
16.59mm rewrote unchanged original16.5862mm. Renderer readElementRow now retains
the original native value if the displayed field is unchanged; edits still apply.
test/native-geometry-precision.test.js red/green checks mm and inch fields.

`npx electron test/native-package-app-runtime.js` completed PASS: productionMain,
Finish,4separate objects, original native Logo, actual renderer picture replacement,
text/barcode edits, exact replaced pixels, precise geometry, save/reopen. Fixture
layout is synthetic (`fixtureOnly:true`), so this is not actual full Accessory
conversion parity. Runtime log native-replace-picture-runtime-precision.log.

Most recent whole basic run before these final changes failed only the mandatory
test inventory check (missing native-document test entry); the entry is added.
A new complete run is required before any release or complete/passing claim.
No library-wide completion, physical printing or100% native pixel parity claimed.

## Source-to-artwork integration continuation

Rechecked installed EXE/Interop SHA-256 against the recorded identities and used
the connected feature-matched REA `inspect_managed_members` operation for exact
IBtDesignObject/IBtFormat after checking its live schema. Evidence IDs remain
the same content identities above. Static API evidence remains distinct from
the controlled UPC runtime observations.

The new source-adapter RED test first found no physical artwork coordinates.
Prepared native UPC artwork now uses its full physical raster dimensions and
the encoder's bar-origin offset. A second RED check exposed absolute prepared
coordinates overwriting page placement. The adapter now supplies a relative
`artwork_offset_mm`, applied by ObjectData to the current authored/page origin.
An executable print preparation test verifies all four 2x2 page cell origins
in generated ZPL, unchanged stored geometry, regeneration after data edits,
generated/padded HRI and invalid check-digit rejection. No print job is sent.

Focused source adapter/output/picture tests pass28/28. Full basic and actual
production Electron fixture reruns remain required after concurrent native
barcode, source and forms work is integrated. The runtime fixture also retains
an explicitly disabled form inventory through create/save/reopen; this does
not establish actual enabled native form behavior.

The production Electron fixture rerun completed PASS, including retained disabled
native_forms metadata, four separate objects, original Logo pixels, actual
Replace picture input, data changes and save/reopen. Log:
`D:/QLabelNativeLibraryAudit-20261023/native-picture-forms-runtime-20261026.log`.
The full basic run completed1161/1162 with one failure: the actual Access/ACE
fixture creation process exceeded its20second deadline with empty stderr.
Legacy checks3/3passed and inventory gaps0. This run is explicitly FAIL; a
separate reproduction is underway before the required full rerun.
