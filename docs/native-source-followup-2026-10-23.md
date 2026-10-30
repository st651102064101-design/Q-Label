# Native source conversion follow-up, 2026-10-23

Scope: `lib/btw-native-source-converter.js` and its executable tests. This is a bounded source conversion improvement, not complete native template compatibility.

## Gate and analysis

Read `AGENTS.md`, `UNIT_TEST_BASIC.md`, `docs/rea-bartender-workflow.md`, REA README, `docs/mcp-contracts.md`, managed-code analysis documentation, installed REA skill v42 and its native/artifact reference. Read Superpowers using-superpowers (its subagent exception applies), test-driven development and verification-before-completion; applied red/green and checked actual scoped command results before reporting. Parent owns release metadata, checklist and the complete basic suite.

REA checkout: `../rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`. Live REA MCP reports package/server 6.7.0, static managed provider `rea-dotnet-static` v1, tools catalog SHA-256 `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`. Inspected live `inspect_managed_members` input schema (`path`, exact `type_names`, `detail`) and used connected MCP, not CLI fallback.

Operation: `inspect_managed_members` on `D:/Programs/Interop.BarTender.dll`, selected `BarTender.IBtDesignObject`, `BarTender.IBtSubString`, `BarTender.IBtFormat`, summary detail. Complete retained evidence: `ev_26d34de9c8af86916d2c983a1a4679aba8996638ee2afbe1f30719396c9f42d7`; summary `ev_d6dc3638adefdd9a9623ab5b800977f397b9b5ad5e5b9b0e13d4d9bca4e1ee6f`. All three types matched. Export: `D:/QLabelNativeLibraryAudit-20261023/source-followup/rea-evidence.json`. Metadata proves the relevant COM methods/properties exist, not their data semantics. The runtime observations below are separate supplementary evidence.

Installed artifact identities, checked with SHA-256:

| Artifact | SHA-256 |
| --- | --- |
| `D:/Programs/BarTend.exe` | `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` |
| `D:/Programs/Interop.BarTender.dll` | `a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515` |

The Interop assembly is the installed application's typed COM contract. The owned C# probes instantiate that application's own COM server and open copied input files only. No user process is attached, no originals saved, and no print jobs submitted. The owned COM instance is closed with `btDoNotSaveChanges`.

## Controlled native observations

Scripts and outputs: `D:/QLabelNativeLibraryAudit-20261023/source-followup/named-probe.ps1`, `named-results.txt`, and `named-*.png`. The script uses Windows PowerShell 5 Add-Type with the installed Interop assembly; `SetNamedSubStringValue`, `GetNamedSubStringValue`, `IBtDesignObject.Value`, and isolated object PNG export establish data effects. Unicode input is encoded as C# escapes so shell encoding does not alter it. Read the UTF-8 result file directly if the terminal displays mojibake.

| Copied native template and SHA-256 | Source and observed behavior | Converter mapping |
| --- | --- | --- |
| Consumer Meat Packing, `fc9157c74c60b3f77c4296a0d1dfd4fcd87271687232fef74925d27a5ccb4158` | `LotNum`: `NumericOnly`, ValidationWarning true, maximum 20/Warn true. `aB12-x9` → `129`; `abc` → empty; `éßก12` → `12`; 25 digits → first 20. Both text and barcode object values/export agree. | Existing `filter` mode `digits`, removeInvalid true; existing `length` with truncate true. Enabled warning lifecycle remains a blocking diagnostic. |
| Data Matrix Rack Label, `d391e1506bc4a8895cd8ee91330432cc9ae741bba4a9ca9f17df8551d4a686b8` | `Rack`: maximum 3/Warn true, minimum 3 with default attributes. `12` → `012`; empty → `000`; `aB12-x9` → `aB1`; `😀12` stays `😀12`; `éßก12` → `éßก`. | Existing `length`, minimum 3, maximum 3, pad `0`, padSide `left`, truncate true. Observed supplementary character count agrees with existing codepoint engine. |
| Accessory Box, `94bd0f5f31b86618ece547d4297df3c60e2c9b020f62fbdb8f8d91b2d5ba026d` | `UPC`: NumericOnly, maximum 13/Warn true, minimum 10/Warn true. `12` → `0000000012`; empty → ten zeroes; 25 digits → first 13. | Same padding/truncation data effect even when minimum Warn is enabled. Warning lifecycle still blocks complete conversion. |
| AIAG-B15 SCACTIL 7, `2622fe75ac3b6a147a30f90335afe4bc71232eeb3bc200f46bbe794943eff173` | `CarrierSCAC`: MaskType omitted, UppercaseOnly true, max 4. `abc` → `ABC`; `aB12-x9` → `AB12`; `éßก12` → `Éßก1`. Native preserves sharp s; JS full Unicode uppercase expands it. | Unrestricted uppercase remains blocking with `unsupported-native-uppercase`. NumericOnly plus uppercase is safe because the filter leaves digits. No replacement case engine was added. |

Native XML snapshots correspond to audit inventory objects 100, 104, 10 and 2 respectively. Original source IDs, names and transform nodes remain in native metadata. Dormant InputMask, OriginalEdit, CustomCharacters, PlaceHolder and RegularExpression settings are not applied for NumericOnly or omitted MaskType.

The earlier `probe.ps1` / `results.txt` attempted source changes through `SetXML` on an A4A copy. Readback showed the original sources and original `MFR 1U2R7` every time. This is explicitly unsuccessful source mutation evidence; it establishes no transform semantics and was not used for mapping.

## Implementation and verification

The converter calls the existing source transform engines through mapped configurations; it does not substitute cached sample values for live source bindings. Original XML now retains repeated transform ordering (A/B/A) instead of grouping repeated tags as A/A/B. Unordered parsed input with repeated mixed transform kinds is rejected because the original order cannot be recovered.

The scoped command `node --test test/btw-native-source-converter.test.js` passed 20 tests, 0 failed, 0 skipped after red/green cycles. Tests cover actual resolver output, Unicode length, numeric filter order, default/minimum warning padding, preservation of alternating transform order, strict native text carrier decoding, script event metadata, native XML indentation and rejection of unsupported modes/settings. Parent runs `npm run test:basic` after integrating all concurrent changes; the scoped run does not claim whole-system coverage.

## Remaining gaps

Enabled native warning UI and print/form lifecycle remain blocking (`unsupported-native-warning-lifecycle`), including maximum Warn and character filter ValidationWarning. Data effects alone do not prove these interactions. Unobserved mask modes, right-to-left filtering, custom padding/alignment and unknown fields remain blocking.

Inventory of 477 audit XML files found 122 NumberDataType, 342 DateDataType, 24 TimeDataType, 27 PercentageDataType, 21 CurrencyDataType, 65 SerializationTransform, 48 DateDataSource and 9 TimeDataSource nodes. These counts identify remaining work; they are not semantic parity evidence. Their native formatting/calendar/culture/clock and counter reset/rollover/selected-source lifecycle require additional controlled probes. They remain unsupported rather than guessed into the existing type/counter engines. Enabled scripts remain unsupported because event selection, source dependencies and OnProcessData/OnPostSerialize ordering have not been observed sufficiently. Dormant scripts retain original code without executing it.

## Full source export follow-up

Parent obtained `D:/QLabelNativeLibraryAudit-20261023/rich-all-sources-trusted.xml` through the native internal `GetDataSources Type="All" Query="All"` command with request-local `Trusted="true"`. This source slice consumes that returned data, without changing installed schemas or application security settings. It contains 185 original IDs: 174 EmbeddedDataSource and 11 ScriptDataSource. Every wrapper DataSource@Name matches its native child's ShareName (zero mismatches); source names are retained from the original child, not inferred. Reader `lib/btw-native-data-sources.js` uses `@` attribute prefixes, whereas this converter uses `@_`; the comparison reparses each exported source.xml with the converter's parser options before constructing ordered records.

The new representation exposed an important carrier bug: `EN_LOAD_INGREDIENTS` ID `{B1D2C905-0AB5-4DCF-ACC2-BFEE50314B0D}` has multiline `<Value Encoding="Base64">`. The converter now decodes Base64 bytes as UTF-8 with strict validation and retains the exact original encoded node. Unknown encodings, malformed padding/alphabet and invalid UTF-8 block conversion; Base64 is never presented as literal user data. Script event carriers receive the same decoding into `config.decodedEvents`, alongside untouched `config.nativeEvents`. Dormant transform script event metadata is available as `native.decodedTransformEvents`. Decoding does not activate scripts or remove lifecycle diagnostics.

Feature-matched native proof is in `source-followup/carrier-probe.ps1`, `carrier-response.xml`, `carrier-observed.txt`. In an owned copy of the same Australia template, SetNamedSubStringValue changed EN_LOAD_INGREDIENTS to `éก😀` followed by U+0001 and CRLF. Native GetDataSource returned `w6nguIHwn5iAAQ0K` with Encoding=Base64; GetNamedSubStringValue returned exactly that Unicode/control text. This establishes UTF-8 carrier interpretation, including supplementary characters and controls. The original template was neither saved nor changed.

The same isolated probe sets `{Milk} and {milk} {{x}}`; native output in `replacement-observed.txt` is `<b>Milk</b> and <b>milk</b> <b><b>x</b></b>`. The existing literal search engine therefore maps the exact observed two-action ingredient profile (ActionType=3, SearchType=1, EncoderType=3; opening brace to `<b>`, closing brace to `</b>`, all occurrences). Other numeric action/syntax profiles remain blocking rather than inferred from this one. Description labels and the original actions remain in native metadata.

Pretty-printed source XML previously acquired structural whitespace `#text` fields that falsely blocked otherwise supported sources. Structural field validation now ignores whitespace-only indentation, while preserving whitespace inside Value and rejecting unexpected nonwhitespace structural text.

On the 185-source Australia export, standalone source conversion reports 142 complete source definitions and 43 with blocking diagnostics. This is source-level coverage only, not object ownership, appearance, template or print compatibility. Remaining diagnostic instances: script lifecycle 11; unsupported suppression 21; NumberDataType fields 7; unsupported filter mode 2; warning lifecycle 6; enabled transform script lifecycle 1. Four ingredient SearchReplaceTransform diagnostics were resolved by the observed exact profile, but those sources still have unsupported suppression conditions. Detailed source IDs and paths are recorded in `source-followup/rich-source-conversion-gaps.json` (refresh after adapter changes if reusing).
