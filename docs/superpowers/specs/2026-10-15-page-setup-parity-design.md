# Page Setup parity design for Q LABEL

Date: 2026-10-15
Status: Approved by the user for implementation on 2026-10-15.

## Goal

Make Q LABEL's existing Page Setup dialog behave like the corresponding BarTender Page Setup workflow for capabilities Q LABEL actually supports. Use BarTender's installed UI resources as behavioral reference only. Do not open BarTender or copy proprietary implementation code. Keep RFID and magnetic-stripe encoding unavailable until supported by the selected printer and Q LABEL's actual print pipeline.

## Findings from static inspection

- Q LABEL already has one Page Setup dialog and persists page, layout, shape, media, print-order, design-scope, template, and background properties in the current document model.
- The present tab order is assembled across `gui/page-setup.js`, `gui/page-design-options.js`, and `gui/workspace-modals.js`; it differs from the screenshot. Shape and Templates are appended later.
- Current page controls include paper dimensions, orientation/effects, front/back designs, back rotation, page template, manual/automatic template sizing, and the layout preview.
- Current layout controls include rows, columns, margins, template dimensions, and horizontal/vertical gaps. Shape supports rectangle, rounded rectangle, ellipse, border printing/width, and rounded-corner radius. Media controls include tear offset and print mode. Printing order supports row/column traversal and starting corner. Templates include the saved label template selector and save-as-new action. Background has image and print/opacity handling.
- `page-setup.test.js` currently asserts that a removed `setupWizard` control is absent. This is a regression constraint to revisit explicitly if the approved design retains a Wizard entry.
- Q LABEL's UI explicitly says RFID and magnetic stripe encoding are unsupported. BarTender's native dialog resources confirm those are device-dependent areas, but do not provide recoverable source for its native Page Setup implementation.

## Information architecture

Keep the existing Page Setup dialog and its current model. Arrange the primary tabs in this order:

1. Stock
2. Page
3. Layout
4. Shape
5. Media Handling
6. Printing Order
7. Templates
8. Background

The Stock tab contains its stock-category/list/save/delete workflow and the device-dependent RFID Antenna and Magnetic Stripe sub-tabs. Those sub-tabs remain visible and expose a clear disabled state with a short explanation when the selected printer/profile has no supported capability. They must not accept or persist pretend encoder settings.

Keep the existing dialog footer actions (Help, Cancel, OK). The Wizard entry should route only to an existing Q LABEL setup flow; if no compatible flow exists in the current application context, render it disabled with an explanation rather than inventing a second setup workflow.

## Functional behavior

### Stock

- Preserve stock category selection, predefined stock selection, and user-defined stock save/delete behavior.
- Keep the selected stock consistent with paper and template dimensions shown in Page and Layout.
- Show RFID Antenna and Magnetic Stripe as disabled when the active device/profile cannot perform those operations. Explain that support depends on both a compatible printer and a Q LABEL encoder implementation.

### Page

- Preserve physical page width/height, orientation, mirror/negative effects, separate front/back designs, optional 180-degree back rotation, and page-template enable/scope.
- Expose printer-specific paper tray/source only when an existing Q LABEL printer profile and output protocol can apply it. Otherwise display it disabled and explain why.
- Keep page and template size summaries in sync with current unit settings and preview.

### Layout

- Preserve row/column count, page margins, template dimensions, horizontal/vertical gap, manual/automatic modes, and live layout preview.
- Validate that the chosen layout fits the physical page and report invalid dimensions through the existing field validation path.

### Shape

- Preserve rectangle, rounded rectangle, and ellipse; print-border toggle; border width; and rounded-corner radius.
- Preserve live preview and the existing shared model so canvas, export, and supported printer output stay consistent.
- Do not surface BarTender-only shape options unless Q LABEL can persist, preview, export, and print the option consistently.

### Media Handling

- Preserve tear-off/peel-off/cutter/rewind modes and tear offset where the selected printer profile/protocol supports them.
- Keep unsupported hardware-dependent choices visible but disabled with a concise reason. Do not emit a command for a disabled choice.

### Printing Order

- Preserve row-wise/column-wise traversal and starting corner for multi-label layouts.
- Keep single-label layouts valid and avoid implying that print-time continuation or printer-side sequence controls exist unless the Q LABEL print pipeline implements them.

### Templates and Background

- Preserve the current saved-label template selection/copy behavior and page-template editing scope.
- Preserve background selection, print inclusion, opacity, preview, and persistence.
- Keep unsupported job/group cover templates disabled unless the existing project model and workflow can represent them end-to-end.

## State, persistence, and accessibility

- All active controls read from and update the existing document model; avoid duplicate sources of truth.
- Changing values continues to update the preview immediately and persists according to the existing Auto Save and dialog OK/Cancel semantics.
- Cancel restores the snapshot captured when Page Setup opened; OK validates, commits, and persists.
- Keep tab keyboard semantics, labels, focus order, and disabled states accessible. Every disabled device-specific control has a textual reason (not tooltip-only).

## Out of scope

- Implementing RFID or magnetic-stripe encoding, printer firmware integration, or claiming support based only on BarTender resources.
- Replacing the Page Setup data model or copying BarTender native code/assets.
- Recreating BarTender's Wizard or printer-specific dialogs where Q LABEL has no equivalent workflow.
- Adding protocol commands that are not supported by the corresponding Q LABEL printer profile.

## Verification expectations for a later implementation plan

- Add behavior-level tests for tab order and visible/disabled capability states, model/preview synchronization, supported versus unsupported printer options, validation, persistence, and Cancel rollback.
- Update `test/page-setup.test.js` and `UNIT_TEST_BASIC.md` inventory/checklist for any changed behavior.
- Follow `labelforge/AGENTS.md` version/changelog policy and run the required full `npm run test:basic` suite after each implementation change.
- Run the relevant isolated Electron Page Setup runtime checks if the final control flow changes DOM rendering or IPC integration; do not treat unit tests as hardware verification.

## Source limitations

The installed BarTender application exposes native/mixed-mode resources for this dialog, not recoverable original source for the native Page Setup implementation. This design is based on inspected resource strings/dialog layouts and the current Q LABEL model and tests. It describes an equivalent workflow within Q LABEL's capabilities, not a byte-for-byte reconstruction.
