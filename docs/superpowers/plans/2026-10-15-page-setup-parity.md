# Page Setup parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Work inline in the current task; do not delegate.

**Goal:** Complete Q LABEL Page Setup behavior for the capabilities its existing document model, printer profiles, and print pipeline can actually apply, while clearly disabling unsupported device features.

**Architecture:** Extend the current Page Setup dialog and document model rather than replacing them. Make the tab structure and device capability state explicit, then wire only settings with an existing end-to-end path from UI through preview/persistence to supported output. Add behavior tests and keep all capability decisions centralized so a disabled option cannot accidentally emit print commands.

**Tech Stack:** Electron renderer, vanilla JavaScript/DOM, Node.js `node:test`, JSDOM fixtures, existing printer profiles and print protocol modules.

**Spec:** `docs/superpowers/specs/2026-10-15-page-setup-parity-design.md`

## Execution notes — 2026-10-15

- User approved implementation and authorized work inside `Bratender\labelforge`; the enclosing Git root is `C:\Users\kkriangkai` and this app is untracked there, so work stayed within the explicitly approved project directory.
- Implemented the BarTender primary tab order, Stock sub-tabs, disabled RFID/Magnetic Stripe/Wizard/tray controls with visible reasons, and DOM/Electron behavior checks. Existing supported Page Setup model controls remain shared with the existing preview/persistence flow.
- Static inspection found no printer-capability selection wired into the Page Setup dialog and no Q LABEL RFID, magnetic-stripe, or tray/source output path. Those controls remain disabled; no pretend encoding/source values are persisted.
- `npm run test:basic` result for v0.905: 393/393 unit tests, 3/3 legacy scripts, inventory complete. Isolated Electron Page Setup runtime passed. No hardware or BarTender UI checks were run.

## Global Constraints

- Follow `AGENTS.md` version policy: increment displayed `displayVersion` by one step, keep valid npm SemVer and lockfile aligned, and add a dated Thai changelog entry.
- Read `AGENTS.md` and `UNIT_TEST_BASIC.md` before every code change; update behavior checklist and inventory in the same change.
- Run all basic tests with `npm run test:basic` after each change; report failures, skips, coverage gaps, and runtime checks accurately.
- Keep the user's running Q LABEL app open and reload that same window for renderer changes; use isolated fixtures/appData for runtime checks.
- Do not open BarTender. Do not implement or imply RFID/magnetic-stripe encoding without a verified Q LABEL printer/output implementation.
- Do not add protocol commands for hardware features without confirmed profile/protocol support.

## Review Focus

1. **No printer selected / unknown printer profile:** device-specific controls remain visible, disabled, and explain why; changing document data does not create unsupported options.
2. **Known printer profile with incomplete capabilities:** only positively verified support enables a control; unknown remains disabled (fail closed).
3. **Switching stock, unit, orientation, or device while Page Setup is open:** labels, dimensions, preview, and enabled states stay synchronized with the active model.
4. **Unsupported print mode or tray value already present in an older document:** preserve the serialized value safely but disable editing and emit no unsupported command until user selects a supported option.
5. **Cancel, validation failure, and persistence failure:** Cancel restores the opening snapshot; invalid values do not commit; async failure is surfaced and does not silently claim save success.

---

## File map

- `gui/page-setup.js`: primary tab registry, dialog shell, Page/Layout/Media/Printing Order sections and dialog event wiring.
- `gui/page-design-options.js`: Page section's front/back/page-template controls and design-scope behavior.
- `gui/workspace-modals.js`: Shape/Templates sections, Stock-adjacent UI assembly, saved-template behavior, and existing capability copy.
- `gui/modal-preview.js`: Page Setup preview rendering for section-specific previews.
- `gui/renderer.js`: existing page/layout model read/write and validation.
- `gui/index.html`: existing shared inputs moved into Page Setup; only change if a control must be added to the existing markup.
- `gui/page-setup-capabilities.js` (create only if current code has no clear single source for capability checks): pure capability resolver over selected connection/profile/protocol, with unknown features disabled.
- `test/page-setup.test.js`: behavior tests for dialog, controls, model, preview, persistence, and rollback.
- `UNIT_TEST_BASIC.md`: add/update Page Setup cases in the relevant checklist and keep file inventory correct.
- `package.json`, `package-lock.json`, version display source, `CHANGELOG.md`: version and release note policy.

## Task 1: Pin the capability contract with behavior tests

**Files:**
- Modify: `test/page-setup.test.js`
- Read: `gui/main.js`, `gui/print-job.js`, `lib/printer-media-profile.js`, supported protocol writers, and current connection/profile selectors before deciding capability inputs.

- [ ] Add failing behavior tests asserting the primary tab order is exactly Stock, Page, Layout, Shape, Media Handling, Printing Order, Templates, Background.
- [ ] Add failing behavior tests asserting RFID Antenna and Magnetic Stripe are visible but disabled for no printer, unknown profile, and current Q LABEL profiles; assert a textual reason is available and no encoder value is persisted.
- [ ] Add failing tests for every device-specific Page/Media control found during source inspection: positively supported values enable, unknown/unsupported values remain disabled, and disabled values produce no protocol command.
- [ ] Add failing tests for current Page Setup model/preview synchronization, unit/stock/orientation changes while open, and Cancel rollback, including separate sides and Page template.
- [ ] Add a failing test confirming a pre-existing unsupported device-specific value is preserved in document data but cannot activate an unsupported output command.
- [ ] Add a failing behavior test for persistence failure so the dialog reports the failure and does not falsely indicate a successful save.
- [ ] Run `node --test test/page-setup.test.js` and confirm each new assertion fails for the missing behavior (existing unrelated tests may pass).

**Acceptance:** Tests describe only capabilities verified in current Q LABEL code. No support is inferred from BarTender UI resources alone.

## Task 2: Centralize and apply capability states

**Files:**
- Create or modify: `gui/page-setup-capabilities.js` (choose after Task 1 inspection)
- Modify: `gui/page-setup.js`, `gui/workspace-modals.js`, and only affected output writer(s)
- Test: `test/page-setup.test.js`

- [ ] Define one pure resolver for the selected printer connection and known profile/protocol. Its return value names each capability explicitly and distinguishes `supported`, `unsupported`, and `unknown` with a user-facing reason.
- [ ] Default unknown hardware/protocol capabilities to disabled. Mark RFID and Magnetic Stripe unsupported until Q LABEL implements the complete editing, persistence, and output path.
- [ ] Apply resolver output to `disabled`, accessible labels/reason text, and event handlers; disabled controls must not update document data.
- [ ] For any legacy serialized setting that is unsupported, preserve it without activating an unsupported command; do not silently rewrite the document.
- [ ] Run `node --test test/page-setup.test.js`; all Task 1 behavior tests pass.
- [ ] Run `npm run test:basic` after the capability behavior change; inspect the generated result/log and correct any regressions before continuing.

**Acceptance:** The capability resolver has no DOM or printer I/O dependencies, and tests prove both enable and fail-closed paths.

## Task 3: Align Page Setup structure and finish supported controls

**Files:**
- Modify: `gui/page-setup.js`, `gui/page-design-options.js`, `gui/workspace-modals.js`, `gui/modal-preview.js` as needed
- Test: `test/page-setup.test.js`

- [ ] Reorder the primary tab registry to the exact sequence in the spec without duplicating existing controls or model state.
- [ ] Add Stock's nested Predefined Stocks, RFID Antenna, and Magnetic Stripe tabs; keep unsupported encoder tabs visible and disabled, and retain current stock selection/save/delete behavior.
- [ ] Expose Page controls already represented in the model (paper size, orientation/effects, separate sides, back rotation, page template/scope). Expose printer tray/source only if Task 1 proves an existing model and output path; otherwise show the control disabled with a reason.
- [ ] Preserve Layout rows/columns, margins, template sizing, gaps/manual modes, live preview, and validation. Ensure page/template size summary updates for selected units.
- [ ] Preserve Shape rectangle/rounded/ellipse, border print/width, and radius; keep canvas, preview, export, and supported print behavior consistent.
- [ ] Preserve supported Media Handling and Printing Order controls. Disable only options not verified for the active profile/protocol, retaining legacy serialized data safely.
- [ ] Keep Templates and Background controls functional and ensure Wizard routes only to an existing Q LABEL workflow; otherwise disabled with a clear explanation.
- [ ] Add tests for keyboard-accessible tab selection/disabled state, correct control ownership, active preview updates, and no duplicate controls.
- [ ] Run `node --test test/page-setup.test.js` and verify all page-setup behavior tests pass.
- [ ] Run `npm run test:basic` after the dialog structure/behavior change; inspect the generated result/log and correct any regressions before continuing.

**Acceptance:** All features named in the spec map to existing Q LABEL model/output behavior; controls without such a path are visibly disabled.

## Task 4: Close test policy and deliver the app change

**Files:**
- Modify: `test/page-setup.test.js`, `UNIT_TEST_BASIC.md`, `package.json`, `package-lock.json`, version display source, `CHANGELOG.md`

- [ ] Update Page Setup checklist and test inventory with the new assertions in the same change.
- [ ] Increment displayed version exactly one step and keep `package.json`/`package-lock.json` SemVer versions aligned; add a dated Thai changelog entry describing scope and limitations.
- [ ] Run `npm run test:basic` from `labelforge` after the final checklist/version/changelog change; inspect both `test/basic-unit-result.json` and `test/basic-unit-output.log`.
- [ ] Run `git diff --check`.
- [ ] Run a new or existing isolated Electron Page Setup runtime check for tab layout, disabled states, preview changes, and Cancel/OK persistence. Create an isolated runtime script only if no suitable Page Setup runtime harness exists; use a disposable appData directory and do not touch user documents.
- [ ] Reload the existing Q LABEL window and manually confirm Page Setup tabs, supported/disabled states, live preview, and dialog close behavior.
- [ ] Report exact unit/runtime results, skips, open coverage gaps, version, and report paths. Do not claim hardware/encoder behavior is verified by unit tests.

**Acceptance:** `npm run test:basic` passes with inventory complete, runtime results are reported accurately, and unsupported encoder controls remain nonfunctional/disabled.



