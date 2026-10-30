# Native geometry follow-up — 2026-10-23

## Scope and workflow

This follow-up advances candidate conversion of native editable objects. It does
not certify the library, font metrics, barcode encoding, or print equivalence.
Read/applied `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`,
installed REA skill and its native/artifact reference, REA README, managed-code
analysis reference and MCP contract sections for Evidence and selected views.
Superpowers using-superpowers was read (its subagent exemption applies); TDD
and verification-before-completion were applied to this scoped implementation.

REA checkout origin: `https://github.com/morluto/rea.git`, revision
`dfe8378cf5a727e3d93d47a5986233175c6ef898`. The live tool catalog exposes no
REA MCP operation in this worker. Therefore the documented CLI fallback was
used, without configuration changes or provider installation. Cached CLI:
`D:/QLabelNativeLibraryAudit-20261023/rea-cli-cache/_npx/a1722018f28f9df2/node_modules/rea-agents/scripts/rea.mjs`,
version 6.7.0. Both selected command schemas were inspected using `--schema`.
The member command takes a positional path and repeatable exact `--type` values.

## Artifact and REA evidence

* `D:/Programs/Interop.BarTender.dll`, SHA-256
  `a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515`.
* `D:/Programs/BarTend.exe`, SHA-256
  `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
  The COM ApplicationClass CLSID's registered LocalServer32 is
  `"D:\Programs\BarTend.exe"`; the runtime therefore uses this installed build.
* `inspect-managed-artifact D:/Programs/Interop.BarTender.dll --format json`:
  `ev_08a3c97db39352c193bb4e3b794c794cff606196b1a3b6716ce564c70e88165b`.
  This establishes identity only, not feature behavior.
* `inspect-managed-members D:/Programs/Interop.BarTender.dll --type BarTender.IBtDesignObject --type BarTender.IBtFormat --format json`:
  `ev_acf432d788022bbbff095537c57c1b15c61a585e344e5e27522ae46c6ecaac77`.
  Both requested types matched, with no unmatched type names. The exact members
  `get_X`, `get_Y`, `get_Width`, `get_Height`, `get_RotationAngle` return `r8`;
  `GetXML` returns string with bool/bool/BtUnits arguments, `SetXML` accepts a
  string, and Format exposes get/set MeasurementUnits. These establish the
  precise native automation operations used by the runtime probes. The
  `rea-dotnet-static` provider version is 1. Metadata does not execute methods
  or establish anchor behavior by itself.

Complete REA outputs and ordinary runtime evidence are retained separately in
`D:/QLabelNativeLibraryAudit-20261023/geometry-followup/`:
`interop-rea.json`, `interop-members-rea.json`, `probe.ps1`, `getters.txt`,
`probe-anchors.ps1`, `anchors.txt`, `probe-ellipse-anchors.ps1`,
`ellipse-anchors.txt`, `probe-picture-anchors.ps1`, `picture-anchors.txt`, and
the individual exported `*-anchor-*.png`/`anchor-*.png` files.
`evidence-hashes.json` records local evidence hashes. These ordinary C# COM and
System.Drawing probes are corroborating runtime observations, not REA output.

## Native observations and implementation mapping

Each probe creates its own ApplicationClass, opens only copied sources, closes
its own document without saving and quits only its own application. Originals
are never saved or printed; no UI, shared REA native target or user instance is
attached. Getter samples cover copied A4A Label, Accessory Box and AIAG B-10
Supplier Master. Original source identities remain in the verified-export
inventory; A4A's SHA-256 is
`4c4afa8060191968c5d34f06865a029c4f53c25164e14b094e368040be18b783`.

Setting `Format.MeasurementUnits=btUnitsMillimeters` makes native X/Y match
the millimeter XML positions. Original samples use inches. For Accessory Box
Picture 3, getters and XML agree on X=19.177, Y=10.7442,
Width=16.5862 and Height=16.5862 mm. X/Y represent the selected reference point.

Controlled native Box, Ellipse and Picture experiments remove other objects
only in the copied document, set width/height/position through SetXML, export
the native label and measure the image's ink bounds. Native quantization turns
requested 10×6 mm at (40,30) into XML 9.9822×5.9944 at
(39.9796,29.9974). All three object types establish the same anchor transform
with omitted rotation: subtract width times the horizontal fraction and height
times the vertical fraction. Top/Center/Bottom correspond to 0/0.5/1 vertically;
Left/Center/Right correspond to 0/0.5/1 horizontally. Omitting ReferencePoint
returns the same native PNG bounds as TopLeft. For the picture, all nine
observed pixel boxes are:

| Reference | Native image ink bounds x0,y0,x1,y1 |
| --- | --- |
| TopLeft / omitted | 151,113,188,135 |
| TopCenter | 132,113,169,135 |
| TopRight | 113,113,150,135 |
| CenterLeft | 151,102,188,124 |
| Center | 132,102,169,124 |
| CenterRight | 113,102,150,124 |
| BottomLeft | 151,91,188,113 |
| BottomCenter | 132,91,169,113 |
| BottomRight | 113,91,150,113 |

The converter now maps these nine anchors and the omitted TopLeft default for
Box/Ellipse/Picture only, with explicit finite bounds and no Rotation or
Rotation.Angle field. The real Picture 3 fixture therefore maps to top-left
(2.5908,2.4511). Original XML, reference point, dimensions, source properties
and object records remain retained. Rotated, unknown-reference, text and
barcode anchors remain blocked. No preview pixels become label objects.

### Text bounds limitation discovered by getters

A4A Text 1 reports native Width=0, Height=0 while its XML reports
Width=46.9900 mm and no Height. That XML width is not proof of rendered text
width. Paragraph Height is also unsafe as a rendered bound: AIAG Text 11's
getter gives 17.2974 mm while XML ParagraphHeight is 4.8768 mm; Text 13's getter
gives 15.748 mm while XML ParagraphHeight is 13.4366 mm. The probe intentionally
does not reinterpret these mismatches as a verified cache correction or
derive heights from font point size. The converter now emits the specific
blocking `NATIVE_TEXT_BOUNDS_UNVERIFIED` diagnostic. Existing candidate text
fields remain available for investigation; `complete` remains false.

The broad getter probe records `Operation not supported for this object type`
for some non-text objects when a requested getter is unavailable. Its row
exceptions are not treated as successful measurements. Unknown style defaults,
text shaping/font availability, exact barcode bounds/options and rotation
remain unsupported. No existing diagnostic was removed without matched native
behavior supporting the replacement.

## Verification

TDD: after adding the real Picture 3 position assertions, the three new tests
and changed fixture produced 4 expected failures / 8 passes. The new anchor
mapping and text bound diagnostic produced 12 passes / 0 failures / 0 skips.
An additional unknown `__proto__` reference test then failed before the map's
own-property guard was added; the final focused run again passed 12/12.
Command: `node --test test/btw-native-object-converter.test.js`.

The parent integration owns the full `npm run test:basic` run, release metadata
and UNIT_TEST_BASIC checklist update. This worker did not run or claim that
whole-system check, and no physical printing or native-versus-Q LABEL pixel
comparison was performed.

## Production package integration follow-up — 2026-10-24

The loader `lib/btw-native-package.js` admits only a trusted bundled JSON package
named by the exact source BTW SHA-256 in `lib/assets/btw-native-packages/`.
It requires schema version 1, explicit complete conversion and verification,
nonempty evidence references, no error diagnostics, matching object count,
stable source schema and object IDs, resolvable main/HRI/object source references,
finite geometry, original native XML/properties, label/page dimensions, shape
and font inventory. Picture assets must be inline image data or a complete
monochrome bitmap; barcodes must retain a supported editable specification and
source references. Font inventory is preserved; the package producer remains
responsible for proving availability and rendering. No font substitution is
introduced. Flags and counts do not independently prove conversion correctness.

The connected REA catalog became available during this follow-up. Its selected
`inspect_managed_members` schema was inspected, then the exact Interop types
IBtDesignObject and IBtFormat were queried through MCP with detail summary.
Evidence `ev_91c113ebf3463a919bdc2c10470997286c92d256acf4729f130082f514e4f9f9`
links parent `ev_be8a50aa120bbfbd8dc6a675d0350236514f8b84ba39c9565019be7b09c55ac6`;
both types matched and the artifact SHA remained the same. Integration itself
is package plumbing, not an additional claim of reconstructed native behavior.

The main IPC checks the source bytes before admitting editable objects. The
wizard preserves original elements, registry, page, fonts, dimensions, shape
and design/page containers on Finish. Unverified selections show their preview
with an explicit pending label and fail Finish, rather than saving one flattened
label image or guessed editable regions. No actual library package was certified
by this integration work.

The real main/preload/wizard/create/save/reopen runtime test initially exposed
two concrete persistence hazards. `SourceModel.reconcileInPlace` replaces source
references when raw text differs from a missing/stale `sourceTextSnapshot`;
the loader now rejects that invalid contract. Active design caches also remained
stale after moving an element and saving; native-origin main save/create handlers
now validate and synchronize those caches before writing. The runtime fixture
explicitly supplies canonical page settings, edits text and barcode values using
the real editor value helper, moves one separate object, calls `saveEditor`, then
checks reopened values, IDs, original properties, independent positions and the
front design cache. It is a synthetic contract fixture, not A4A/Accessory object
reconstruction evidence.

Observed checks: `node --test test/btw-native-package.test.js` 5/5 passed;
`node --test test/printer-resolution.test.js` 40/40 passed;
`npx electron test/native-package-app-runtime.js` passed (three independent
fixture objects, actual main process, Finish, edited text/barcode, save/reopen);
`npx electron test/wizard-library-artwork-runtime.js` passed (A4A preview remains
selectable, unverified Finish creates no project and reports its limitation).
The Electron app test logged a GPU command-buffer message after its PASS result;
the exit code was zero. Parent integration owns the complete basic suite and
checklist. Other legacy runtime tests may still expect the former raster import
and need an explicit updated expectation before a whole-runtime-suite claim.

The offline assembler `lib/btw-native-package-builder.js` now connects the
original native envelope parser to the actual converter and strict package
validator. Incomplete converter output, missing wrapper coverage and native
export failures return candidate diagnostics with `package:null`. Document
metadata cannot override elements, source registry, object count or conversion
completeness. Explicit document settings and verification evidence are required
for admission. `node --test test/btw-native-package-builder.test.js` passed 3/3
after three observed expected failures. This builder has not certified the
Accessory Box candidate: its native data-sourced Base64 picture, HRI and sizing
options still require complete runtime mappings. Static original picture pixels
alone cannot satisfy the dynamic image source lifecycle.
