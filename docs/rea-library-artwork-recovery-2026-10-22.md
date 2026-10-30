# Library artwork recovery and Starting Point fit — v1.210

## User-visible failures and causes

The selected library preview used hardcoded MFR/SER text and a checkerboard placeholder instead of the selected document's artwork. Finish always assigned `elements: []`, recording only library metadata, so the resulting editor label was empty. Generic modal footer styling forced the Starting Point content to overflow; its 74px heading and loose text spacing left insufficient height for the 270px pane plus size labels. The BTW asset URL in the catalog also returned HTTP 403.

## Required workflow and native evidence

Applied Superpowers using-superpowers, systematic-debugging, bounded screenshot-driven design, TDD, and verification-before-completion. Read project AGENTS/UNIT_TEST_BASIC, REA skill/native-artifact reference, BarTender workflow, REA README and MCP tool-result/identity contracts. REA upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`, connected REA 6.7.0.

Checked live MCP catalog and `inspect_managed_members` input schema (`path?`, `detail?: complete|summary`, exact `type_names?`). Queried `D:/Programs/Seagull.BarTender.Print.dll` for `Seagull.BarTender.Print.LabelFormatDocument`: matched selected type, complete static selected-type coverage. Evidence `ev_68157e73c1051d91eb5814bb7c16267f76b03f9a7121e83ed4a3d705f542e188`, provider rea-dotnet-static v1. Matched methods include ExportImageToFile, ExportPrintPreviewToFile, ExportPrintPreviewRangeToFile, ExportDataSourceValuesToXML and ImportDataSourceValuesFromXML. This establishes the native document's raster-export surface, not editable design-object conversion or observed runtime export.

Artifact identities:

- `D:/Programs/BarTend.exe`: SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- `D:/Programs/Seagull.BarTender.Print.dll`: SHA-256 `301ba773fe7869e8ece9b0b2629a3afd1303af1c9df36bb68a2b7ca4ec0495ef`.
- Installed template `C:/ProgramData/Seagull/PrintStation/wwwroot/Templates/Military/MIL-STD-130/A4A Label.btw`: SHA-256 `4c4afa8060191968c5d34f06865a029c4f53c25164e14b094e368040be18b783`. This is the installed BarTender/PrintStation template catalog companion to the selected BarTender build, outside D:/Programs; no installed artifact is modified.

Separately from REA, ordinary format-aware file inspection found the native PNG carrier in that BTW at byte offset 958, ending at 18091. Its native 1073px square preview contains the real MFR 1U2R7, SER MH80312, Data Matrix and UID artwork. Cropping the connected grey surround yields a 1073×359 label, consistent with the 3×1in metadata. These pixels are preserved, not re-created from the screenshot or decoded into design objects.

Ordinary HTTP HEAD checks returned 403 for the catalog S3 gateway `/Production/A4A+Label.btw` and 200 for the same asset path on `bartender-images-cdn.bartendercloud.com`. Actual application runtime subsequently downloaded that CDN asset successfully.

The user's images define the Starting Point layout. Retained same-feature BtEnu.dll string evidence `ev_4a433ad213447ac6626dc3918309983b71d1f391bf0401b3a118206d812d0ed6` identifies Starting Point/Page Size/Template Size labels; it does not measure native pixels. Neither static SDK inspection nor our runtime test establishes full BarTender runtime parity.

## Implementation mapping

- `lib/btw-preview.js`: bounded PNG extraction and CRC decode, dimension/aspect checks, connected surround removal, exact PNG plus monochrome bitmap artwork, and recovery of older empty library projects. Existing content and projects marked as already imported remain intact.
- `lib/bartender-library-files.js`: normalize the known S3 gateway URL to its public CDN while retaining path/encoding.
- `gui/main.js`: prepare native artwork through IPC and repair legacy empty library documents on load.
- `gui/new-label-wizard.js`: remove the fake preview, use imported artwork for preview and created picture, block failed/unavailable imports, mark imported documents, fit selected-template fields and size labels without scrolling. The green product theme remains the user's requested branding.
- Version/checklist/changelog: v1.210. Main-process changes require reopening Q LABEL; the user's running application was preserved.

## Verification and limits

RED: Finish created 0 elements, Starting Point measured scrollHeight 317 > clientHeight 310, the new artwork extraction/recovery tests and CDN normalization tests failed before implementation. GREEN: focused unit tests passed; whole suite is recorded in `test/basic-unit-result.json` after its final run.

- `electron test/wizard-preview-runtime.js`: current eight-step wizard PASS; Starting Point controls and both size labels fit without body scrolling. Image `test-results/new-label-starting-point-preview.png`.
- `electron test/wizard-library-artwork-runtime.js`: native installed artwork retained ink in both text regions, Data Matrix and UID; 76.2×25.4mm after Finish.
- `electron test/library-import-app-runtime.js`: actual main/preload/renderer PASS in an isolated profile with printer responses stubbed; real Cloud download, create/save/reopen, image DOM nodes present, and legacy empty project recovered. Rendering output `test-results/library-a4a-editor-artwork.png`.

Earlier actual-app harness attempts timed out waiting for requestAnimationFrame in a hidden native window; replacing the test's wait with a bounded timer allowed the same real IPC flow to complete. The final app test validates DOM/raster content and persistence; it does not claim a visible native-window screenshot comparison.

Import is one artwork picture at the native embedded preview's resolution. It preserves appearance, rather than exposing individual text/Data Matrix objects for editing. Unsupported or damaged previews fail explicitly; this does not decode arbitrary BTW serialization. No printer jobs or hardware-output measurements were performed.
