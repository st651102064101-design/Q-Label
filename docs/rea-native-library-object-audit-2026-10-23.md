# Native library object reconstruction: investigation ledger

Scope: approved docs/library-native-objects-design-2026-10-23.md and docs/superpowers/plans/2026-10-23-native-library-objects.md. Applied Superpowers using-superpowers, brainstorming, writing-plans and executing-plans. Read project AGENTS/UNIT_TEST_BASIC, REA README/contracts, installed REA skill and recovery/native documentation. No complete application import is claimed.

## Artifact-bound REA findings

- REA checkout: https://github.com/morluto/rea.git, dfe8378cf5a727e3d93d47a5986233175c6ef898, CLI 6.7.0.
- D:/Programs/Interop.BarTender.dll SHA256 a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515. Member evidence ev_0808dc2cc60122c361dcc01e2f5f891a2b19d06475664e698eb2b373ecf6bf7d establishes IBtDesignObject.GetXML(IncludeProperties,IncludeDataSources,BtUnits), geometry/style methods and native XMLScript invocation.
- D:/Programs/Seagull.BarTender.Print.dll SHA256 301ba773fe7869e8ece9b0b2629a3afd1303af1c9df36bb68a2b7ca4ec0495ef. Evidence ev_68157e73c1051d91eb5814bb7c16267f76b03f9a7121e83ed4a3d705f542e188 matches LabelFormatDocument; its XML export methods cover data values, not a complete native document model.
- D:/Programs/BarTend.exe SHA256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3. Classification evidence ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789 identifies mixed C++/CLI x86-64. Windows Ghidra P0 refuses managed/mixed targets (managed_target_unsupported). Whole member decoding hits its 64 MiB representation limit (ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9); selected RichTextData/ObjectDataFromXML/ObjectDataProperty metadata succeeds (ev_5a86e4564aefca33463df717af3f1545d36e34b0b2b204d7bd2a48f98ffbf11b), but reports only native layout placeholders, not serializer implementations.

## Controlled native runtime, separate from REA static evidence

Downloaded all 480 cloud catalog entries successfully to D:/QLabelNativeLibraryAudit-20261023. Three pairs reference identical URLs, giving 477 unique BTW files. GetXML exports succeeded for all 477. Raw XML contains 8,623 top-level nodes; this is NOT a verified native object count because some nodes are DataSources containers. Manifest and per-file hashes/XML are retained in D:/QLabelNativeLibraryAudit-20261023/native-object-audit/inventory.json and summary.json.

Accessory Box yields two Picture objects, one Text and one UPC-A object, with actual geometry, fonts and source transforms. Native per-picture PNG export works. GetFormatProperties IncludeObjectDataSources="*" additionally exposes data-sourced picture values and their object association, including the original Base64 logo. RichText GetXML and BTXML GetObject Query=All both omit its HTML/data-source body; object.Value emits HTML Data placeholders. A separate visible temporary copy was opened with Computer Use; the native properties dialog confirms the underlying HTML fragments, CSS and data sources still exist. The inspection copy was closed, and original user BarTender process 21820 was preserved.

The initial export probe incorrectly created a COM instance for every file. It was stopped; only audit-owned -Embedding processes were removed, and the audit was rerun with one shared instance and explicit Quit. No original documents were saved or closed.

## Current next investigation

Use documented REA CLI fallback in Ubuntu because the connected Windows provider cannot analyze the mixed native serializer. Existing Ghidra 12.1.4 files are preserved. Isolated Linux Node 22.14.0 and JDK 21 archives were downloaded with SHA256 verification into the task analysis-runtimes directory; no MCP configuration or global runtime was changed. This is analysis setup, not a delivered application release.

Remaining gates: complete rich/markup text source extraction, container child identity/counts, image assets, forms/database/document behavior and all font dependencies. Do not map unsupported objects to pictures or silently replace actual source behavior with sample values.

## Continued implementation and verification

`scripts/export-bartender-objects.ps1` now exports explicit wrappers for every
enumerated native collection object, preserving Index, native Name and native
Type separately from GetXML payloads. It records original BTW SHA-256 and the
Interop identity, exports individual picture PNGs, full format/source XML and
prompt XML, uses a copied source and closes only its separately created COM
instance. Native A4A and Accessory Box both report four collection objects and
produce four wrappers. The complete 477-file enhanced export is in progress in
`D:/QLabelNativeLibraryAudit-20261023/verified-export`.

`lib/btw-object-package.js` checks units, wrapper counts/indices and asset paths.
`scripts/audit-native-library.js` records asset hashes and differences between
native collection count, decoded XML object count and candidate conversion count.
RFID can have an empty XML payload: retaining a wrapper is not reconstruction.
This mismatch is explicitly blocking. Original lossless XML remains available.

Candidate adapters are in `lib/btw-native-object-converter.js` and
`lib/btw-native-source-converter.js`. Their blocking diagnostics cover unknown
styles/defaults, geometry, unsupported types and source lifecycle. They are not
connected to production import. The existing raster production import has not
been described as corrected by this tooling work.

Linux CLI fallback uses isolated Node 22.19.0, REA 6.7.0, JDK 21.0.13+9 and the
existing Ghidra 12.1.4. The first full-image import timed out at 330000 ms before
any function result (`richtext-datain.json`). A 4G retry did not retain a result;
a 1G retry with a 1200000 ms startup limit is being inspected. A separate 4096-byte
read-only native slice starts at RichTextPage.DataIn RVA 0x5a2f40, file offset
5907264, mapped at 0x1405a2f40. The slice identity and original EXE hash are in
`richtext-datain-native.bin.json`; documented Linux raw x86_64 analysis is used
because Windows P0 does not admit this target. Raw gcc analysis conventions are
not proof of the original Windows ABI; external callees and data are outside the
slice. These attempts are not completed serializer evidence.

Focused native adapter/package tests were observed passing; the first complete
basic run passed 1072/1073 unit tests and all three legacy stages, failing the
new-test markdown inventory check because it was captured before the inventory
update. The checklist has been updated and a complete rerun started. The latest
`test/basic-unit-result.json` must be checked before any passing claim.

## Enhanced corpus result

Enhanced export completed for all 477 unique files with 8,630 native collection
objects. Food Price Card initially failed when exporting its empty Picture 5;
the exporter now records the per-object error while retaining every wrapper and
XML payload, and the failed file was retried successfully. Collection totals:
5,685 Text, 768 Barcode, 249 Picture, 1,361 Line, 414 Box, 14 GridLayout,
14 RichText, 15 Table, 10 RFID, 7 Error, 19 Ellipse, 73 Shape and 1 MagneticStripe.
`conversion-audit.json` and `conversion-summary.json` explicitly say complete=false.
Seventeen native collection objects have no corresponding decoded visual-object
XML (10 RFID and 7 unnamed btObjectError entries). RFID GetXML does preserve
DataSources, but omits the RFID object definition/encoding settings; the seven
Error entries return blank XML. Six format responses are malformed
XML; native unknown-object tags include `< ObjectName="">`. Originals are retained,
not normalized into invented object types.

GetFormatProperties does recover ordered RichText HTML/CSS fragments and source
snapshots even when object GetXML omits them. `lib/btw-native-format-inventory.js`
preserves these values plus database/forms/named identities. Native shared
sources repeat their original Index (Bosch DUNS repeats Index 1 at concatenation
position 6); the adapter preserves original index separately from position and
checks conflicts. Snapshots do not supply all transforms or source event bindings.

Linux raw-slice analysis succeeded as evidence
`ev_59b1ec172026723282596c29e061c6f88a240d7b17507f98a8bd81b9fd8fca2a`.
Its 229-byte body at 0x1405a2f40 populates RichTextPage state and invokes dialog
subcomponents; it is UI DataIn, not a BTW file deserializer. It therefore cannot
justify reconstructing the missing file content or behavior. The full mixed-PE
1G import also timed out at 1200000 ms, retaining a typed provider_timeout result
in `richtext-datain-1g.json`. No complete serializer evidence was obtained.

All export-owned BarTender instances have exited; only the original user process
21820 remains. No source document was saved or printed. Production remains v1.236;
the candidate conversion cannot be enabled as full native import under the
approved no-loss/no-guesses requirement. Remaining implementation gates include
the 17 missing object definitions, malformed native responses, rich-source lifecycle,
container models and verified font/geometry/style/print behavior.

Additional controlled BTXML probes: GetObject Query=All for Track & Trace's
SGTIN-96 returns the native DataSources under an explicit btObjectRFID response;
GetAllObjects also retains object wrapper type/identity. The equivalent RichText
query still returns only the 237-byte style/geometry element, with no source IDs
or transforms. Probe outputs are rfid-btxml-single.xml, rfid-btxml-all.xml,
rich-btxml-single.xml and rich-btxml-all.xml in the task audit directory. Enhanced
export now additionally retains objects-btxml.xml; a 28-template supplementary
export targets RichText/RFID/unknown-type files without repeating the full corpus.

REA selected member evidence
`ev_da07a2aaad2fe094de913c0bd82ff19add342ada86b185831f38e16a5dcdf6c8`
matches IBtSubString in the same Interop hash: Name, Value, Type, SerializeBy,
SerializeEvery, Rollover/Limit/ResetValue accessors. It does not expose a complete
source XML exporter or rich source lifecycle. close_binary confirms no connected
native target is open; there was no native session to snapshot after metadata-only
queries.

The 1080-test full run found one EPERM during source serialization ledger rename
(1079 passed); all three legacy stages passed. An isolated rerun of all eight
serialization tests passed. This filesystem failure is not attributed to a
specific cause without evidence, and unrelated ledger implementation is unchanged.
A further complete run was started; see the final basic-unit-result.json.

Supplement completed for all 28 selected templates. GetAllObjects still yields
empty Name/btObjectError wrappers for the six affected files (one response wrapper
for Large Sale Placard versus two entries in its collection). Controlled getter
inspection of both Large Sale Placard Error entries also returns unsupported or
unexpected-error results for value, geometry, rotation, print state and every
style accessor; results are retained in unknown-object-properties.xml. It is not
yet established whether these represent missing live objects, unsupported native
objects or collection bookkeeping. They cannot be silently discarded or assigned
an invented object type under the approved completeness requirement.

Final verification for this tooling state: `npm run test:basic` completed at
2026-10-23T15:20:32.340Z with 1080/1080 unit tests passing, zero failures/skips,
all three legacy stages passing and no undocumented test files. Report:
`test/basic-unit-result.json`. This does not verify native import UI, all-template
editability, native rendering parity or physical printing; those remain blocked
by the incomplete conversion gates above. No application release was delivered.
