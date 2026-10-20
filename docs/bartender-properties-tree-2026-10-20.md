# Properties tree and object names

The user requests stable dotted branches before/during/after Data Sources,
visible sources under every object, and shared sequential object names.
The latest explicit naming instruction is object 1, object 2 across all types.

## Reference evidence

Read REA skill and native/artifacts routing reference. Reused REA 6.7.0
`inspect-managed-members D:/Programs/BarTend.exe --type DataSource --json`:
`ev_23dd65815d68604f61f15988127ae13383b7afd3217661350ec485a44d674617`.
Saved result: `D:/QLabel-agent-work/rea-20261019/tree-source-members-evidence.json`.
On 2026-10-20 the artifact SHA-256 was rechecked and still matches
`0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
The selected DataSource type exists; metadata does not prove native painting or
click behavior. Native tree structure is supported by the user's supplied
BarTender screenshot, separately from static REA evidence.

## Cause and implementation

Only Data Sources previously wrapped the tree in a scroll container. Its active
source rows had different indentation from inactive summaries. A later-loaded
theme added another 6px nav padding. All pages now share the scroll structure;
active/inactive source rows share geometry and dotted branch styles; the nav
padding stays fixed. Sources under other objects remain visible.

Known legacy automatic names matching object/text/barcode/picture plus a number
are compacted into one object sequence on editor refresh. Other names are kept.
This is a naming migration heuristic; deliberately customized names matching an
old automatic pattern are indistinguishable and will also be normalized.
Stable object IDs and source definitions are not changed by name normalization.

## Verification

New regressions failed before implementation. Focused Properties/naming tests
pass. Electron full-app runtime initially timed out loading the renderer; the
next attempt loaded and exposed the 6px shift. After the padding fix the real
app measured source row x=236, relative y=4, width=133, height=28 before/during/
after selection, with dotted horizontal/vertical connectors in all states.
It also verified matching canvas/tree names and object selection dispatch.
These are fixture measurements, not universal pixel parity with native BarTender.
Full Basic Suite result is reported in test/basic-unit-result.json after the run.
2026-10-20 v1.044: `npm run test:basic` passed 794/794, fail 0, skip 0;
all three legacy stages passed. `test/page-gap-runtime.js` also passed in the full
app after the prior storage blocker was resolved. Report and assertion log:
`test/basic-unit-result.json`, `test/basic-unit-output.log`.
