# Page Setup template scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Offer a BarTender-like confirmation and Scale Templates dialog when Page Setup changes the template size by at least 10%, then scale supported artwork according to the selected category rules.

**Architecture:** Add a pure scaling module that transforms a cloned document and knows how to visit the active design plus all stored template pages and design sides. Extend Page Setup's existing OK flow with a confirmation and a dedicated modal; calculate dimensions before accepting, preserve Page Setup drafts when the scale modal is cancelled, then apply and persist one undoable change only after confirmation.

**Tech Stack:** Electron renderer JavaScript, existing HTML dialog and DOM patterns, Node `node:test` + JSDOM, isolated Electron runtime fixture.

**Spec:** [../specs/2026-10-15-page-template-scaling-design.md](../specs/2026-10-15-page-template-scaling-design.md)

## Global Constraints

- Significant means width or height changes by **10% or more** relative to the opening template size.
- Prompt No accepts the new dimensions without changing object geometry; modal Cancel/Escape returns to Page Setup without scaling; modal OK scales, persists once, and returns to the editor.
- Default rules: Text = Scale Proportionally; Barcodes = Scale Freely; Pictures = Scale Proportionally; Lines = Maintain Thickness.
- Apply to all document designs, front/back/page designs, and every saved template page; preserve non-geometric values and bitmap data.
- Each delivered application change increments `displayVersion` by one and keeps package SemVer files consistent; add a dated Thai changelog entry.
- Every changed behavior gets executable unit coverage and matching inventory/checklist entries in `UNIT_TEST_BASIC.md`; run full `npm run test:basic` after the change.
- Run the isolated Page Setup Electron runtime check; do not use live user data or a real printer.

## Review Focus

- Exactly 10% width/height changes prompt; 9.999% does not. Pin in Task 2's Page Setup unit tests.
- Non-finite/zero starting dimensions and invalid new dimensions never produce NaN/Infinity geometry or partially mutate the document. Pin in Task 1.
- Mixed font runs and text box/auto-fit fields scale consistently with proportional text. Pin in Task 1.
- A modal cancel after Page Setup values have been edited retains those values but leaves all artwork unchanged. Pin in Task 2.
- A malformed nested page/design collection cannot partially update other pages/sides. Pin in Task 1 rollback tests.

---

### Task 1: Pure, atomic template scaling

**Files:**
- Create: `gui/template-scaling.js`
- Create: `test/template-scaling.test.js`
- Modify: `UNIT_TEST_BASIC.md` (test inventory and behavior checklist)

**Interfaces:**
- Produces `window.TemplateScaling` and CommonJS `TemplateScaling` with:
  - `isSignificant(oldSize, newSize) -> boolean`
  - `scaleDocument(document, oldSize, newSize, rules) -> { ok: true, document } | { ok: false, error }`
  - `DEFAULT_RULES` as immutable category defaults.
- `oldSize` and `newSize` are `{ width_mm: number, height_mm: number }`.
- Rules use exact values `proportional`, `free`, and `maintain-thickness` keyed by `text`, `barcode`, `picture`, and `line`; non-listed scalable objects use free geometry scaling.

- [x] **Step 1: Write failing unit cases** named `significanceThresholdIsInclusive`, `textScalesGeometryAndAllFontRunsProportionally`, `barcodeScalesWidthAndHeightFieldsIndependently`, `picturePreservesAspectRatio`, `lineScalesEndpointsAndPreservesThickness`, `otherShapesAndTablesScaleFreely`, `qrModulesStaySquare`, `scalesEveryDesignSideAndSavedTemplatePage`, `preservesMetadataTableStylesBindingsAndBitmapBytes`, and `invalidNestedInputReturnsOriginalUnchanged`. Assert exact numeric values for a 2× width / 0.5× height fixture, include font_size_pt, range font_size_pt, text box dimensions, module_width, bar_height_mm, HRI height, line endpoints, and image width/height.
- [x] **Step 2: Run** `node --test test/template-scaling.test.js`; expected: FAIL because the module/API does not exist. (RED verified: module absent.)
- [x] **Step 3: Implement** the pure UMD module and load it before `page-setup.js` in `gui/index.html`. Clone first, validate all dimensions and collection shapes before returning a result, and never mutate the input. Visit top-level `elements`, each `designs[front|back|page].elements`, and each `template_pages[].design` with its nested `elements` and `designs`. Scale `x_mm`/line endpoint positions by sx/sy; scale ordinary geometry by sx/sy; use min(sx,sy) for proportional text fields/font runs and picture width/height; barcode `module_width`/width by sx and bar/HRI heights by sy; keep line `thickness_mm` unchanged; keep QR/Data Matrix module size square via min(sx,sy). Preserve all unlisted fields.
- [x] **Step 4: Run** `node --test test/template-scaling.test.js`; expected: all cases PASS and input fixtures remain deep-equal to their originals. (10/10 passed.)
- [x] **Step 5: Add** `test/template-scaling.test.js` to the inventory and add checklist cases for threshold, category geometry, all stored designs/pages, preservation, and failure rollback.
- [x] **Step 6: Run** `npm run test:basic`; expected: full basic unit inventory and all three legacy scripts pass with no inventory gaps after this task's change. (415 unit passed; legacy 3/3; inventory gap 0.)

### Task 2: Page Setup confirmation and Scale Templates dialog

**Files:**
- Modify: `gui/page-setup.js` (OK flow, accessible prompt/modal, close/cancel state handling)
- Modify: `gui/index.html` (Scale Templates dialog markup if modal markup is kept in the page)
- Modify: `test/page-setup.test.js` (JSDOM interactions and assertions)

**Interfaces:**
- Consumes `window.TemplateScaling.isSignificant`, `DEFAULT_RULES`, and `scaleDocument` from Task 1.
- Uses current Page Setup's `readPageSetup()`, `persistEditor()`, `pushSnapshot()`, and `refreshEditorUI()` lifecycle.
- Scale modal presents current/new width and height in System Settings units, calculated X/Y percentages, and four selects with accessible labels. Its OK button is the only point that replaces the active editor document with the scaled clone.

- [x] **Step 1: Write failing Page Setup tests** named `smallTemplateSizeChangeCommitsWithoutPrompt`, `significantSizeChangeYesOpensScaleModalWithDefaultsAndPercentages`, `significantSizeChangeNoCommitsWithoutChangingArtwork`, `scaleModalCancelAndEscapeKeepPageSetupDraftOpen`, `scaleModalOkScalesPersistsOnceAndCreatesOneUndoSnapshot`, and `scaleValidationFailureKeepsDocumentUnchangedAndShowsError`. Assert dialog open states, dimensions, artwork coordinates, dialog values, persistence count, snapshot count, and rendered editor artwork.
- [x] **Step 2: Run** `node --test test/page-setup.test.js`; expected: new interaction cases FAIL. (RED verified.)
- [x] **Step 3: Implement** the interaction after existing validation and dimension calculation. Keep the opening size from `setupOriginal`; let No commit the existing Page Setup draft; for Yes stage the scaled copy and defer commit until modal OK. Do not close Page Setup on modal cancel/escape. Update editor UI/canvas and persist only on No acceptance or successful scale OK.
- [x] **Step 4: Run** `node --test test/page-setup.test.js`; expected: all old and new Page Setup cases PASS. (29/29 passed.)
- [x] **Step 5: Update** Page Setup checklist cases for prompt thresholds, Yes/No, cancel/escape, failure rollback, and one-time persistence/history. Update the same checklist entry to cite both Page Setup and template-scaling unit files.
- [x] **Step 6: Run** `npm run test:basic`; expected: complete suite passes with zero inventory gaps after this task's change. Also run the existing isolated `electron test/page-setup-runtime.js`; expected: existing Page Setup behavior remains intact. (421 unit passed; legacy 3/3; inventory gap 0; runtime extended in Task 3.)

### Task 3: Electron end-to-end behavior and release bookkeeping

**Files:**
- Modify: `test/page-setup-runtime.js` (isolated fixture scenarios and canvas assertions)
- Modify: `UNIT_TEST_BASIC.md` (runtime-check row and dated result section)
- Modify: `package.json` (`version` / `displayVersion`)
- Modify: `package-lock.json` (root package version)
- Modify: `CHANGELOG.md` (dated Thai entry at top)

- [x] **Step 1: Extend** the isolated Page Setup runtime fixture with text, barcode, picture, line, table, front/back/page designs, and multiple saved template pages. Assert Yes → Scale Templates → OK changes dimensions and expected geometry, closes both dialogs, and renders artwork on the editor canvas; also assert No and modal Cancel behavior. (No and Cancel are runtime assertions; mixed-object Yes/OK covers sides and saved pages.)
- [x] **Step 2: Run** `electron test/page-setup-runtime.js` using its temporary appData profile; expected: PASS and no writes to the user's normal application data. (PASS, temporary appData.)
- [x] **Step 3: Bump** `displayVersion` from `0.914` to `0.915`, set SemVer to `0.0.915` in `package.json` and the root package entry in `package-lock.json`, and add a dated Thai changelog entry describing the prompt, scaling modal, object rules, and verification limits.
- [x] **Step 4: Run** `npm run test:basic`; expected: every discovered unit test and all three legacy basic scripts pass, with inventory gap count 0. If any fail, fix its cause and rerun the full command.
- [x] **Step 5: Run** `git diff --check`; expected: no whitespace errors. Record exact pass/fail/skip counts, runtime result, report paths, and unchanged whole-system coverage gaps in the new result entry in `UNIT_TEST_BASIC.md`.
- [x] **Step 6: Run** `npm run test:basic` again after release bookkeeping and the final checklist/report edits; expected: all unit tests and all three legacy scripts pass, inventory gap count 0.

## Execution notes

- Read `labelforge/AGENTS.md` and `labelforge/UNIT_TEST_BASIC.md` before implementation, then reread `UNIT_TEST_BASIC.md` before every subsequent change as required.
- Preserve unrelated user changes in the existing working tree. Do not stage or revert unrelated files.
- The deliverable must report the actual unit, legacy, inventory, runtime, and hardware-check results. Do not claim BarTender source equivalence: only the supplied observable flow is the reference.
