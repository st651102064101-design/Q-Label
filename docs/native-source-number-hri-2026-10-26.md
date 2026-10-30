# Native decimal and HRI source continuation — 2026-10-26

This continues the approved native library plan. No complete library conversion
or physical printer result is claimed. Source-level counts do not establish
object, form or template completeness.

## Gate, identity and analysis route

Applied project AGENTS/UNIT_TEST_BASIC, REA v42 native/artifact workflow and
Superpowers TDD, systematic debugging and verification. Checkout revision and
installed hashes remain those in native-source-literal-padding-2026-10-26.md.
Connected MCP exact IBtSubString/IBtDesignObject/IBtFormat analysis was used
earlier. During this continuation the live MCP catalog no longer exposes any
REA operation, so the documented CLI fallback is used. The checkout script
cannot run because its compiled runtime is missing; no reinstall/build/config
change was performed. The already-installed cached rea-agents6.7.0 CLI works.

Command: cached scripts/rea.mjs inspect-managed-members
D:/Programs/Interop.BarTender.dll --type BarTender.IBtSubString
--type BarTender.IBtDesignObject --json. Output:
D:/QLabelNativeLibraryAudit-20261023/source-followup/rea-native-source-root-members.json.
Evidence ev_f642b15e9e2c7ea6c9bef953c6eddfae30f601ec5806dae54e8f3719cdf1e17c;
both exact types match, same Interop SHA-256. It establishes source mutation and
object export APIs, not their formatting semantics. Controlled native probes
below are separate runtime observations on owned copied documents.

## Native decimal sources

Native probes number-profiles-probe.ps1 and number-boundary-probe.ps1 under
D:/QLabelNativeLibraryAudit-20261023/source-followup preserve original profile
XML and measure31 profiles ×23 inputs plus87 boundary cases. No physical jobs
are sent. Four nonzero/dynamic-offset profiles are excluded from the supported
formatting assertions. Native invalid numeric inputs give blank values and
successful native print previews, rather than a Q LABEL numeric exception.

gui/source-types.js now uses a bounded96-bit decimal coefficient, native locale
first and input-locale fallback, exact decimal rounding and original sign,
currency, whitespace, grouping, leading-zero and precision behavior. The mapped
cultures are en-US/nl-NL/fr-FR. Original system/custom cultures require explicit
conversion-time effective-locale evidence; they are not guessed from this host.
Original values and native XML remain unchanged. Nonzero/dynamic offsets,
unknown precision or locale profiles remain blocking diagnostics.

Object conversion initially discarded nativeNumberCultures supplied by its
caller. A RED test caught the missing locale, then the converter was changed
to pass the proof through both ordinary and dormant HRI source conversion.
Focused native/source/barcode integration passed91/91 at that checkpoint.

## Original hidden human-readable source parts

Controlled copy of AIAG Shipping Label, Barcode2, has original prefixQ with
HrVisible=false and shared QUANTITY900. Native EMF text records show900;
changing the quantity to256 gives256. The encoded source still includesQ.
Original XML and native EMF SHA identities are retained in
source-followup/hri-root-20261026/. hri-visibility-root-probe.ps1 closes only its
own COM application and never saves the original BTW.

Important limitation: changing HrVisible through object SetXML is ignored.
UpdateDataSource removes the false attribute for true, but the isolated EMF
still emits900. Therefore explicit true/update behavior is NOT admitted as
verified. The converter supports only the original observed false flag;
explicit true or malformed flags remain blocking. Ordinary text and named
getters keepQ900/Q; only the corresponding barcode caption part is hidden.
JSON roundtrip and changed quantities are tested. Printed bars remain identical
when hiding the prefix, while printed HRI changes fromQ900 to900.

After the decimal and original false-HRI mappings, the reproducible477-file
source recount reports12,593/13,563 independently complete source definitions,
leaving970 with at least one blocker. These are not complete template counts.

## Further native observations and limitations

Original date/time probes in source-followup/date-root-20261026/ show the native
named-value setter parses11/6/2023 as11June even where the exported date node
declares InputCulture1033/InputPattern M/d/yyyy. Time-only date inputs use the
current native civil date. This disproves treating those exported strings as a
complete input-parsing specification. No guessed date adapter was admitted.

Actual enabled forms exist in Accessory/A4A. PromptValues inventories and
controlled SetPrompt source bindings are retained, but complete form layout and
event/validation transport remain unavailable. Direct PrintPreview.Show did not
produce the expected temporary BTX archive. Repeated Computer Use inputs on an
owned copied document were rejected as user-input-stale; mismatched occluded
captures were not used. Every owned probe closes without saving originals.

Whole basic run before the HRI additions passed1194/1194, legacy3/3, gaps0.
Production Electron fixture also passed editing text/barcode/original Logo,
actual Replace picture, exact geometry and save/reopen. It is fixtureOnly:true;
no real complete library package is admitted. A fresh whole basic run after HRI
and the corresponding checklist update is required before delivery.
