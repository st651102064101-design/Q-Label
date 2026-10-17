# Print Preview Stage One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Execution is inline in this chat.

**Goal:** Deliver a usable Print Preview toolbar, stable page geometry, page navigation, zoom and pan without sending a print job.

**Architecture:** Keep preparation and SVG rendering in the existing print flow. Add a small viewport module with pure navigation/geometry functions and a disposable DOM controller. Preview state is transient and never saved to the document.

**Tech Stack:** JavaScript, Electron, SVG, Node test runner, JSDOM.

**Spec:** `docs/superpowers/specs/2026-10-18-print-preview-parity-design.md`

## Global Constraints

- No real printing or changes to the user's reference documents.
- No vendor binaries or recovered implementation bodies in production code.
- Run the complete `npm run test:basic` after changes; update `UNIT_TEST_BASIC.md`.
- Preserve prepared source values, page order and serialization numbers.
- Increment displayVersion/SemVer consistently and add a dated Thai changelog entry for delivery.
- Selectively commit the stage and attempt push; preserve unrelated dirty files.
- This plan covers stage one only. Region zoom, page grids and full reference-output parity remain stages two and three.

## Review Focus

- Empty/invalid page input must select a valid page rather than produce undefined data (task 1).
- A tiny or temporarily hidden viewport must not produce negative SVG dimensions (task 1).
- Long printer/document names must not displace viewport controls (task 2).
- Closing during asynchronous rendering must not repaint a reopened preview with stale output (task 2).
- Repeated opens and pan cancellation must not accumulate listeners or leave dragging active (task 2).

## File Responsibilities

- Create `gui/print-preview-viewport.js`: pure sizing/navigation plus DOM interaction lifecycle.
- Modify `gui/print-dialog.js`: toolbar/status markup, prepared-page integration and rendering lifecycle.
- Modify `gui/index.html`: load the viewport module before print-dialog.
- Create `test/print-preview-viewport.test.js`: behavioral geometry/navigation and DOM tests.
- Create `test/print-preview-runtime.js`: isolated Electron assertions, no transport calls.
- Update `UNIT_TEST_BASIC.md`, `CHANGELOG.md`, `package.json`, `package-lock.json` for delivery.

### Task 1: Stable viewport state

**Interfaces:** Export `clampPage(value,count)` returning a zero-based integer; `pageSize({widthMm,heightMm,viewportWidth,viewportHeight,mode,zoom})` returning `{width,height,scale}` in CSS pixels. Fit uses a 24px inset on each side; actual size uses 96 CSS px/inch. Explicit zoom has provisional Q LABEL bounds 0.1–8, not asserted BarTender parity.

- [ ] Write tests: clampPage('3',5) equals 2; invalid/negative input selects 0; page 999 with count 5 selects 4; count 0 selects 0.
- [ ] Write sizing tests: A4 actual-size width equals 210/25.4*96; fit in 800×600 keeps 210/297 ratio and fits inside 752×552; zero viewport yields finite positive dimensions; repeated fit calls are identical.
- [ ] Run `node --test test/print-preview-viewport.test.js` and confirm missing implementation fails.
- [ ] Implement the browser/CommonJS module; reject invalid physical sizes with a clear error. Add tests for zero/NaN paper sizes.
- [ ] Run focused tests, update checklist/inventory, then run `npm run test:basic` before any application commit.

### Task 2: Integrate toolbar, pan and status

**Interfaces:** Export `attach({viewport,onResize})` returning `{setTool(tool),dispose()}`. Tools are `select` and `pan`. Pan uses primary-button pointer capture and scroll deltas; pointerup, pointercancel and lost capture end the gesture. The print flow owns page index/zoom and invokes task 1 geometry.

- [ ] Add failing DOM tests for first/last disabled states, valid page selection, zoom actions and Fit reset, actual-size mode, visible SVG icons and accessible button names.
- [ ] Add tests for pan scroll deltas, cancellation, disposal and repeated attachment without duplicate effects.
- [ ] Add tests for a long printer name, unchanged document data, zero print calls, close/reopen and stale asynchronous render rejection.
- [ ] Run focused tests and confirm failures identify missing behavior.
- [ ] Replace preview toolbar markup while preserving existing IDs where practical. Keep Print returning to settings. Use flex layout with a scrolling workspace and fixed status footer; scope styles to Preview.
- [ ] Load the new module before print-dialog. Bind rendering to prepared pages, generation tokens and a ResizeObserver; disconnect observers and pan state when closed. Render status using actual connection/page/item dimensions and current percentage.
- [ ] Run focused tests and the complete `npm run test:basic`; fix causes and rerun all if anything fails.

### Task 3: Runtime verification and delivery

**Interfaces:** Runtime script starts a disposable Electron profile with a prepared two-page fixture and mock print transport; exits nonzero on failed assertions.

- [ ] Create runtime assertions for open, page change, fit/actual size, pan, close/reopen and zero print calls. Save a screenshot in ignored test output for visual inspection.
- [ ] Run `npx electron test/print-preview-runtime.js`; inspect screenshot and confirm no physical print occurred.
- [ ] Record a stage-one parity matrix in `docs/reference/print-preview-verification.md`, separating screenshot/documentation/static analysis from executed reference checks. Do not label unmeasured zoom bounds or pan behavior as native parity.
- [ ] Increment to the next unused application version, update Thai changelog and checklist, then rerun `npm run test:basic` and runtime against final files.
- [ ] Inspect selected diff with `git diff --cached --check`; commit only stage files/selected hunks. Attempt push and report actual outcome.

## Self-review

Stage-one spec requirements map to tasks 1–3. Review-focus cases have explicit tests. Later stages are explicitly deferred, not silently considered complete. No native toolbar behavior has yet been measured; runtime/reference results must remain separate.
