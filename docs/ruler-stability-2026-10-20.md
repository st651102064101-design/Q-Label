# Ruler coordinate stability — v1.047 / 2026-10-20

## Request and cause (Superpowers systematic debugging)

User reported drifting ruler numbers/ticks. Reproduced in an isolated Electron
profile before implementation: a 17px horizontal pan changed common visible
negative captions from [-15,-11,-7,-3] to [-16,-12,-8,-4]. The paper scale was
unchanged. Log: D:/QLabel-agent-work/rea-20261019/ruler-stability-red.log.

Both renderer loops selected the first visible integer label and then used a
64px distance from the preceding visible label. Changing the viewport clipping
boundary changed this starting value, so the visible labels acquired a new phase.
Ticks themselves already used the paper origin; labels did not consistently use
that origin. Stationary screen placement is not the intended coordinate model:
the zero remains aligned with the paper edge while pan/scroll changes its screen
position. A given coordinate must keep its value and paper-relative position.

## Design and implementation

- Derive a fixed label interval from pixels per measurement unit alone, using
  1/2/5 decimal intervals, at least 64px and at least one unit (retains existing
  integer-coordinate labeling behavior).
- Select positive/negative/zero labels by multiples of that interval from zero.
  Clipping decides visibility, never which numeric phase is used.
- Share the interval and membership helpers between X and Y drawing loops.
- Preserve the existing paper coordinate transform, minor ticks, ruler styling,
  unit conversion and document model.

## REA workflow and scope

Read installed reverse-engineer-anything skill and docs/rea-bartender-workflow.md.
Used existing REA CLI 6.7.0 evidence from source revision
 dfe8378cf5a727e3d93d47a5986233175c6ef898.

Queried retained inspect_pe_resources output for D:/Programs/BtEnu.dll:
- Evidence ev_0f2ace1a3fe946142aacdbd75414f5255a491f981130b0f37fb3254653be40dd.
- D:/QLabel-agent-work/rea-20261019/description-resources-evidence.json.
- Recomputed SHA-256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b
  before reuse; matches retained artifact identity.
- Queried decoded authenticated RT_STRING records for ruler-specific text:
  resource 1214 / ID16609: Snap to Object or Ruler;
  resource 1250 / ID32901: ruler snapping help.
- Native BarTend.exe artifact identity remains
  0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.

These resource facts identify the native ruler/coordinate context. They do not
establish BarTender's tick-selection algorithm, dynamic behavior or exact pixels.
No native-provider claim is made: native tick-generation evidence is unavailable.
The fix follows the user's expected stable coordinates and the reproduced Q LABEL
fault, not an unverified claim of full native BarTender equivalence. No native
application UI or user document was changed for this task.

## Executable verification

- test/ruler-labels.test.js: scale-based intervals across .3–600px per unit,
  negative/zero/positive membership, floating point tolerance and overlapping
  viewport ranges after pan. Focused command passed 12/12.
- test/ruler-stability-runtime.js: real Electron canvas trace for X/Y, pans
  (17,13), (35,29), (-21,-17); coordinates in common visible ranges retain values,
  every label position equals paper origin plus coordinate times scale, stationary
  redraws do not drift and the document remains unchanged.
- Runtime fixture accounts for actual toolbar/viewport clipping, rather than
  incorrectly treating the area behind the toolbar as visible ruler space.
- test/ruler-appearance-runtime.js: existing appearance assertions retained.
  Off-paper label fixture now pans far enough for two whole fixed intervals;
  its former 180px shift did not guarantee an anchored major label in view.
  This preserves the assertion instead of introducing a viewport-relative label.
- Electron appearance passed all existing checks for 19.5px strip / 15px type,
  inches/mm/dots, zero alignment, background/transparent off-paper regions and
  extension to visible paper bottom (72 pixel/font samples).
- Logs: D:/QLabel-agent-work/rea-20261019/ruler-stability-focused.log,
  ruler-stability-runtime.log and ruler-appearance-after-stability.log.
- All runtime fixtures use isolated appData; no real printer transport is used.
  Packaged executable deployment and native ruler parity across all zoom levels
  remain unverified.

### Final Basic verification

- Command: TEMP/TMP=D:/QLabel-agent-work/rea-20261019 npm run test:basic.
- 802/802 passed, 0 failed/cancelled/skipped/todo; legacy data-sources,
  print-job and smoke stages all exit 0; complete inventory.
- Report timestamp 2026-10-20T02:31:34.590Z. Reports: test/basic-unit-result.json
  and test/basic-unit-output.log; D: console ruler-stability-basic-console.log.
- git diff --check and git diff --cached --check passed.
