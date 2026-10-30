# Native source literal actions and padding — 2026-10-26

This is source-level conversion work. It does not establish complete template,
form, object rendering or physical printer compatibility.

## Gate and native contract

Read and applied the project AGENTS/UNIT_TEST_BASIC gate, installed REA skill v42,
native/artifact reference, checkout README and managed-member/retained-evidence
contract, Superpowers TDD and verification workflow. Parent owns integration,
release metadata and the final complete basic test run.

REA checkout upstream `https://github.com/morluto/rea.git`, revision
`dfe8378cf5a727e3d93d47a5986233175c6ef898`, connected REA 6.7.0.
The live MCP catalog and selected operation input schema were inspected. A fresh
server initially had no retained records; connected `inspect_managed_members`
was therefore used for exact installed types `BarTender.IBtDesignObject`,
`BarTender.IBtSubString`, `BarTender.IBtFormat`. All matched. Parent evidence
`ev_26d34de9c8af86916d2c983a1a4679aba8996638ee2afbe1f30719396c9f42d7`,
summary `ev_d6dc3638adefdd9a9623ab5b800977f397b9b5ad5e5b9b0e13d4d9bca4e1ee6f`.
The contract proves the source mutation/read methods exist. It does not prove
their formatting semantics; ordinary isolated native probes below supply those.

Verified installed SHA-256:

| Artifact | SHA-256 |
| --- | --- |
| `D:/Programs/BarTend.exe` | `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3` |
| `D:/Programs/Interop.BarTender.dll` | `a5010a466502aff374cb0313d1a5d0b6c2510b39298003747bc3fcb312286515` |

Probes use a separate owned COM application and copies of Accessory Box, original
BTW SHA-256 `94bd0f5f31b86618ece547d4297df3c60e2c9b020f62fbdb8f8d91b2d5ba026d`.
They update original ProductName source ID
`{AAE44AF8-BFA7-455E-ABF2-68FE515C1555}` through request-local trusted
UpdateDataSource, then Set/GetNamedSubStringValue. They close their owned format
and application without saving, and submit no print jobs. Original files and user
applications remain untouched.

## Literal search actions

Evidence: `D:/QLabelNativeLibraryAudit-20261023/source-followup/literal-actions-probe.ps1`,
`literal-actions-results.txt`, `literal-actions-update-0.xml` through `-8.xml`.
Nine profiles × five inputs establish:

- ActionType 3 replaces; 4 deletes. SearchType 1 and omitted SearchType perform
  literal, case-sensitive matching. EncoderType is 3 in this proven profile.
- FirstOnly true changes only the first occurrence; omitted changes all.
- Matching scans nonoverlapping occurrences. `aaaaa`, search `aa`, replace `b`
  gives `bba`. A replacement containing its search text does not recurse.
- Replacement `$&$1\` remains literal text; dollar tokens do not expand.
- Sequential actions consume prior action output: a→ab followed by ab→Y gives
  `Y Yb YY` from `a ab aa`.

Implementation: `lib/btw-native-source-converter.js` maps original indexed
Action-1…Action-N into existing literal search-replace operations. Original action
metadata remains retained. It accepts 1–1024 actions, rejects missing/duplicate/
extra indices, unknown fields, empty search strings, unsupported encoders,
unobserved search modes/action types and invalid FirstOnly booleans.
Actual catalog transforms include 80-action lookup lists; every action is kept.
Reversed XML serialization cannot reverse native action indices.

The 1024-action bound is a Q LABEL admission limit, not a native maximum claim.
Regex/wildcard profiles and native ActionType 1/7/8 remain unsupported here.

## Minimum-length padding

Evidence: `source-followup/padding-profile-probe.ps1`,
`padding-profile-results.txt`, `padding-profile-update-*.xml`.
Final successful run: eight profiles × six inputs.

- Omitted/Left pads on the left, Right pads on the right.
- Omitted character pads zero. Space, X and Thai ก remain their exact character.
- Minimum counts Unicode scalars: minimum five, `😀12` gives `00😀12` or
  `😀1200` depending side.
- PadCharacter `XY` uses its first UTF-16 unit X, giving `XXX12`.
- Longer-than-minimum values remain unchanged.

Implementation maps the original side and first BMP padding unit into the
existing length engine. Original warning behavior remains enforced by that
engine. An exploratory supplementary padding profile produced an unpaired
surrogate and failed UTF-8 logging; it is explicitly rejected instead of
substituting another character. Empty/NUL/surrogate padding and unknown alignment
remain blocked. The native parser defaulted invalid Center to left in this probe;
Q LABEL rejects that invalid enum instead of admitting it as a verified setting.

## Verification and remaining work

TDD logs: `source-followup/literal-actions-red.log` (three new failing tests),
`literal-actions-green.log` (32/32), `padding-red.log` (new padding test fails),
`padding-green.log` (34/34). No tests skipped. Commands use
`node --test test/btw-native-source-converter.test.js`.

Catalog recount script/output: `source-followup/inspect-current-profiles.cjs`,
`current-profiles.json`, `source-recount-padding.log`. The previous baseline was
12,390/13,563 independently complete sources. Literal actions raise this to
12,410; padding raises it to **12,419/13,563**, leaving **1,144** source definitions
with one or more blockers. Remaining numeric/date/time types, object
references, scripts, serialization, forms and database lifecycle are independent
blockers. Diagnostic totals overlap; supporting one transform does not make a
source or template complete if another diagnostic remains. No real template
package is admitted by this change alone.
