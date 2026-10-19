# Complete Properties Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver every Properties page in the approved reference, with working editing, shared preview/print behavior, and modern Q LABEL appearance.

**Architecture:** Keep the existing Properties host and Data Sources editor. Introduce a document draft controller, shared pure object-property/layout/policy functions, and focused page renderers. Both SVG/canvas preview and print hosts consume the same evaluated object properties; GUI-only prompts remain adapters.

**Tech Stack:** CommonJS/UMD JavaScript, Electron, DOM, Node test runner, JSDOM, existing barcode encoder and source resolver.

**Spec:** `docs/superpowers/specs/2026-10-19-properties-all-pages-design.md` (approved by user on 2026-10-19).

## Global Constraints

- Preserve unknown fields and legacy documents; use stable object IDs.
- Every enabled control changes output or a documented editor/document behavior.
- Preserve free modal resizing/minimums and the noninteractive source summary fields from v1.028.
- Retain Apply/OK/Cancel; no automatic writes from rendering.
- Each delivered application batch increments displayVersion by .001 and updates matching SemVer/lockfile and Thai CHANGELOG.
- Every batch updates UNIT_TEST_BASIC and runs the entire `npm run test:basic` suite, plus relevant isolated Electron checks.
- No real printing, user-document mutation, or unrelated dirty-file staging.
- Continue with native execution in this chat, preserving the user's previously selected execution method.

## File Structure / Interfaces

- `gui/object-properties.js`: host, transactions, tree selection, page dispatch, Apply/Cancel.
- `gui/object-properties-document.js` (new UMD): `createDocumentDraft(template) -> {getDocument(), getObject(id), updateObject(id, updater), moveObject(id, layer), apply(), cancel()}`. Returns clones; edits identified by stable ID.
- `gui/object-property-values.js` (new UMD): immutable validation/defaults and print condition evaluation. `validateObjectProperties(object) -> diagnostics[]`; `shouldPrintObject(object, context) -> boolean`.
- `gui/object-properties-pages.js` (new UMD): `mountPage(host, {page, objectId, controller, template, onChange, adapters}) -> {dispose()}`; dispatch to focused controls without owning persistence.
- `gui/object-properties-modern.css` (new): tree, page groups, grids, dialog summaries, small-screen scrolling. Add one link in index.
- `gui/object-position.js` (new UMD): `positionToDisplay(object, bounds, template)`, `positionFromDisplay(display, bounds, template)`, `changePositionReference(object, nextReference, bounds, template)`; millimetres internally.
- `gui/object-layout.js` (new UMD): `layoutObject(object, textMetrics, context) -> {object, bounds, diagnostics}`; fits and borders without mutating authored object.
- `gui/object-error-policy.js` (new UMD): `evaluateObjectError(object, condition, context) -> {action, warning, log, placeholder, invalidation, requiresDecision}`; no I/O.
- `gui/preview.js`, `lib/render.js`, `lib/print-job.js`: consume shared evaluation, keeping native/raster paths consistent.
- `gui/source-resolver.js`, `gui/object-data.js`: preserve per-source HRI segmentation and apply HRI-only transforms.
- `gui/renderer.js`: locked-object gesture guard, warning badges; GUI abort-choice adapter near print preparation.
- Existing barcode adapter/catalog modules: expose supported options and native encoder behavior; unsupported options cannot appear enabled.

## Review Focus

1. Legacy object without ID or settings: opening and cancelling must not persist migrated defaults.
2. Shared named sources across two objects: switching tree nodes and cancelling must not leak edits into the live template.
3. Rotated object with nondefault anchor/origin: changing reference must preserve ink position and scale exactly.
4. Empty data/file failure/script failure during a multi-record job: a rejected or undecided job must never reach transport or consume serial reservations.
5. Missing font, Unicode, multiline HRI and tiny fit box: SVG and raster must agree on layout and diagnostics, without destroying the original text.

---

## Task 1: Evidence matrix and document draft transaction

**Files:** new `docs/superpowers/properties-reference-matrix.md`, `gui/object-properties-document.js`, `test/object-properties-document.test.js`; modify `gui/object-properties.js`.

**Interfaces:** implement the draft controller above; use existing SourceSession migration and stable IDs, preserving raw input for Cancel.

- [ ] Record all controls from the 14 reference screenshots, default/disabled states, data keys, output consumer and evidence path. For density, HIBC, GS1, compound border, fit priorities and each error condition, obtain native saved fixture/output evidence before matching semantics. No guessed native equivalence claims.
- [ ] Write failing tests: two objects A/B, edit A.comment then B.label, switch back, get A unchanged except the staged comment; cancel returns original byte-equivalent document; apply contains both edits; apply then edit/cancel retains only applied values. Include unknown object fields and old objects without IDs.
- [ ] Run `node --test test/object-properties-document.test.js`; confirm initial failure.
- [ ] Implement clone-returning draft controller and host integration with one document transaction; preserve source editor revisions and dispose active editors when changing object.
- [ ] Run tests and add save/reopen/UndoRedo integration assertions for both objects.
- [ ] Update policy inventory/version/changelog; run full basic and isolated Electron transaction check; commit only owned changes.

## Task 2: Multi-object tree, Object page and print conditions

**Files:** `gui/object-properties-pages.js`, `gui/object-properties-modern.css`, `gui/object-property-values.js`, `test/object-properties-pages.test.js`, `test/object-print-conditions.test.js`; host/index/preview/render/print-job integration.

**Interfaces:** `shouldPrintObject` context contains `{mode:'design'|'print', values, sourceResults}`. Condition object is `{mode:'always'|'never'|'source', sourceId, operator:'empty'|'not-empty'|'equals'|'not-equals', value}`. Missing referenced source yields diagnostic, never a silent match.

- [ ] Write failing tests for roots A/B, exact barcode/text page order, dotted source nesting, root rename, draft preservation across switching, and Object-only preview placement.
- [ ] Test Preprinted visible in design but absent from prepared print; Always/Never/source conditions over two records; value `0` is nonempty; missing source rejects print preparation.
- [ ] Implement roots and nested tools, Object name/Comments/Preprinted and readonly Print when summary with staged side dialog. Maintain keyboard tree traversal and selected root identity after rename.
- [ ] Integrate conditions at the shared object evaluation boundary; cover native ZPL, full-raster and print-history previews.
- [ ] Verify DOM + isolated Electron at 700x560 and expanded size, Apply/Cancel, save/reopen, full basic; increment version/changelog/checklist and commit.

## Task 3: Position, origins, layer and lock

**Files:** `gui/object-position.js`, page renderer/CSS, `gui/renderer.js`, `test/object-position.test.js`, DOM/runtime tests.

**Interfaces:** store `{anchor:'top-left'|...nine anchors, originX:'left'|'center'|'right', originY:'top'|'center'|'bottom'}` in object position metadata; authored coordinates remain mm. Bounds are measured by the existing preview geometry, including rotation.

- [ ] Test left/top -> center/center -> right/bottom -> left/top round trip preserves world ink origin within 0.001mm at rotations 0/90/37 degrees. Test mm/inch/dot display conversion at 203/300/600 DPI.
- [ ] Implement Anchor and X/Y values, readonly origin summaries, Advanced dialog options exactly from reference, Rotation, Layer and Lock object. Cancel must preserve coordinates and reference.
- [ ] Connect layer changes to real document order by stable ID; preserve selected source references after reorder. Lock guards drag/resize/rotate but permits Properties unlock.
- [ ] Test actual gesture attempts on locked object and successful movement after unlock; snapshot one undo entry for each layer/reference edit.
- [ ] Run complete verification, update docs/version and commit.

## Task 4: Border geometry and output parity

**Files:** `gui/object-layout.js`, page renderer, `gui/preview.js`, `lib/render.js`, `test/object-border.test.js`, Electron raster check.

**Interfaces:** `object.border={kind:'none'|'rectangle'|'ellipse', margins:{top,left,bottom,right}, corner, cornerSizeMm, sides, line:{widthMm,color,opacity,dash,compound}, fill}`. Preserve legacy barcode_border as migration input; do not rewrite legacy fields on open.

- [ ] Test None disables subordinate controls; nonnegative margins/thickness/radius; invalid values reject Apply; unknown legacy fields retained.
- [ ] Implement two-column margin/box and line/fill groups matching reference placement. Use one border geometry result for SVG/canvas/native fallback, with no authored-coordinate shift.
- [ ] Test rectangle/ellipse, asymmetric margins, side selection, rounded corner limits, transparency, dash/compound from measured reference and fill in both SVG and raster; bounds must include the visible stroke.
- [ ] Verify prepared print pixel/geometry parity and Canvas hit bounds, full basic, docs/version and commit.

## Task 5: Symbology and size / encoder options

**Files:** page renderer, barcode catalog/IPC encoder adapter, `test/object-symbology.test.js`, existing barcode tests and runtime.

**Interfaces:** expose `capabilitiesForSymbology(id)` from the existing catalog adapter; page enables only options accepted by the corresponding encoder. Preserve barcode_spec and native barcode type compatibility.

- [ ] Add tests pinned to evidence matrix: X dimension/density reciprocal conversion, height, ratio support, mandatory check digit, code-set options, GS1/HIBC and encoding flags.
- [ ] Implement Dimensions and Specific Options groups, Color and actual Print Method choices; show computed readonly fields where editing is not meaningful.
- [ ] Connect GS1 action to existing wizard/compiler. Test returned bytes, checksum, FNC1, human-readable value and physical dimensions; do not validate only control values.
- [ ] Test selecting another symbology preserves source refs and relevant options without silently retaining incompatible flags.
- [ ] Verify editor preview and prepared print output, full basic, docs/version and commit.

## Task 6: Human Readable and source segmentation

**Files:** page renderer, source resolver/object-data, shared layout, preview/render, `test/object-hri.test.js`.

**Interfaces:** `object.hri={visibility:'full'|'none'|'sources', visibleSourceIds:[], placement:'top'|'bottom', align:'left'|'center'|'right', offsetXmm, offsetYmm, transforms:[]}`; source resolver returns ordered segments keyed by source-ref occurrence, not matching text substrings.

- [ ] Test repeated identical source text with one segment hidden, shared named sources, empty segments, UTF-16 surrogate pairs; encoded bytes remain unchanged by all HRI settings.
- [ ] Implement visibility radio group and staged Select dialog, position group, symbology options, and four readonly transform summaries with side actions.
- [ ] Reuse transform editor/validator for character template, search/replace, VBScript and prefix/suffix, configured in HRI scope only; preserve Cancel and async stale-response guards.
- [ ] Test Top/Bottom, both offsets, three alignments and HRI transforms against actual SVG/canvas/prepared-print values.
- [ ] Run full basic/runtime, update docs/version and commit.

## Task 7: Font and Text Format

**Files:** shared page renderers/layout, installed-font adapter, preview/render, `test/object-font-format.test.js`.

**Interfaces:** continue using existing font_family/font_size_pt/bold/italic/text_* properties to preserve compatibility. Formatting layout consumes those properties for Text and HRI rather than duplicating new configuration.

- [ ] Test three top columns and six named Font tabs; real installed fonts plus preservation of missing document font; controlled nonempty valid point-size input.
- [ ] Implement Style inverse/color/background/script/smallcaps, underline/strike/outline/width/advanced using existing layout semantics where available, completing missing SVG/canvas behavior.
- [ ] Implement Text Format paragraph/alignment/wrapping/character and line spacing groups; ensure source transforms are applied once.
- [ ] Test Unicode/multiline, mixed font styles, outline and background bounds, sub/super baseline changes and prepared print pixel parity. Include missing-font diagnostic without document font replacement.
- [ ] Run full verification, update docs/version and commit.

## Task 8: Deterministic Auto Fit and linked adjustments

**Files:** `gui/object-layout.js`, page renderer, preview/render, `test/object-auto-fit.test.js`.

**Interfaces:** `object.fit={enabled,widthMm,heightMm,horizontal,vertical,adjustments:{pointSize,scaleWidth,characterSpacing,lineSpacing},linkGroup}`; each adjustment has `{enabled,min,max,preferred}`. Layout returns derived values and overflow diagnostic, never mutates authored text/font.

- [ ] Test width/height constraints, min/max validation, checkbox disabled dependencies, exact repeated-render equality, preferred setting and smallest feasible box.
- [ ] Implement deterministic bounded fitting in native-evidence order, with measurement functions injected for pure tests. Resolve linked-group shared adjustments from the common feasible range; emit overflow when no common solution exists.
- [ ] Implement reference groups/controls and linked group picker; preview changing one member updates the whole draft group without altering unrelated objects.
- [ ] Test Unicode long text, multiline, zero/negative dimensions, printer DPI, linked groups with contradictory bounds, and source data changing between records.
- [ ] Verify SVG/raster/prepared print agreement, full basic, docs/version and commit.

## Task 9: Error Handling policies and host decisions

**Files:** `gui/object-error-policy.js`, page renderer, source/encode/layout diagnostics, preview, renderer print adapter, lib print preparation; `test/object-error-policy.test.js`, `test/object-error-hosts.test.js`.

**Interfaces:** condition names `content-does-not-fit`, `data-empty`, `data-invalid`, `file-not-found`, `script-error`. Policy actions follow the approved spec and measured forced/default states. `requiresDecision` produces structured host error code `OBJECT_ERROR_DECISION_REQUIRED` outside GUI.

- [ ] Test exact per-condition defaults/forced controls from native fixtures; selecting each left-list condition restores its independent settings.
- [ ] Implement conditional action panel and placeholder/style dependencies; validate placeholder with the destination source type/encoder before allowing a recovery job.
- [ ] Integrate diagnostics after resolve/encode/layout. Warn/log/suppress/clip/placeholder/invalidate as configured; never silently swallow unexpected exceptions.
- [ ] Add GUI decision adapter before transport and serial reservation commit. Test user abort/continue with mocked interaction; CLI/server return structured errors without waiting for a UI.
- [ ] Test multi-record abort has zero transport calls and no consumed serial reservation; timeout/cancel releases pending work. Test warning-only successful print and observable logs.
- [ ] Run full unit/integration/runtime, update docs/version and commit.

## Task 10: Full reference review and regression delivery

**Files:** reference matrix, `test/properties-reference-runtime.js`, snapshots/logs under `.superpowers/sdd/2026-10-19-properties-all-pages/`, relevant regression tests.

- [ ] Capture every barcode and Text page, nested dialogs, two-object tree and disabled states at minimum and enlarged sizes in isolated Electron.
- [ ] Assert controls remain within panels and footer stays reachable; check font/encoding/fit/error controls have corresponding data/output assertions in the matrix.
- [ ] Run Save/Reopen, Undo/Redo, Apply/Cancel, shared named source editing, asynchronous dialog cancellation, barcode type change, layer reorder, document reload and all original Data Sources runtime checks.
- [ ] Run `npm run test:basic` again on the final tree with no failed/skipped checks; inspect current-version JSON report and relevant Electron output.
- [ ] Conduct a fresh whole-branch review using the review step required by executing-plans; address findings and rerun affected runtime plus the whole basic suite.
- [ ] Commit delivery evidence; attempt push and report the actual remote result. If HTTP403 remains, retain local commits and state that remote delivery is blocked by repository permissions.
- [ ] Only claim completed parity for controls with verified matrix rows; explicitly list any remaining native-evidence or renderer gap.
