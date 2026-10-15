# Page Setup template scaling design

## Goal

When a Page Setup change significantly changes the label template dimensions, Q LABEL should offer to scale the existing design to fit. The resulting artwork should remain visible on the editor canvas at the new label size, following the interaction shown in the supplied BarTender screenshots.

The `D:/Programs` folder contains BarTender binaries, including `BarTend.exe` and `BtEnu.dll`, rather than source code. Use the supplied screenshots and available UI strings as behavioral references; implement the feature in Q LABEL without copying binary code.

## Agreed interaction

1. Page Setup continues validating the entered paper, margins, rows, columns, and gaps before accepting them.
2. On OK, compare the opening template width/height with the dimensions computed from the new Page Setup values. A change of 10% or more in either dimension is significant.
3. For a significant change, show a Yes/No message: “The template size has changed significantly. Do you want to automatically scale your designs to fit the new template size?”
4. No accepts the new template size, leaves object geometry unchanged, persists the document, closes Page Setup, and returns to the editor.
5. Yes opens a Scale Templates modal. It shows the current and new width/height and the derived horizontal and vertical percentages. Defaults follow the reference: Text = Scale Proportionally, Barcodes = Scale Freely, Pictures = Scale Proportionally, Lines = Maintain Thickness.
6. Scale Templates OK applies the selected rules to a staged copy, updates the editor and persists once, closes both dialogs, and returns to the main editor with the scaled design visible. Cancel or Escape closes only Scale Templates, leaves the Page Setup dialog open, and does not apply scaling.
7. Changes below 10% retain the current direct OK behavior and do not show a prompt.

## Scaling behavior

Let `sx = newWidth / oldWidth` and `sy = newHeight / oldHeight`. Scale object positions from the top-left origin using `sx` and `sy` so their relative placement follows the new canvas.

- **Text — Scale Proportionally:** scale its text size and geometry uniformly by `min(sx, sy)`. Do not stretch glyphs independently in X and Y.
- **Barcodes — Scale Freely:** scale horizontal geometry and module width by `sx`, and vertical geometry, bar height, and readable-text height by `sy` where those fields exist.
- **Pictures — Scale Proportionally:** preserve aspect ratio by applying `min(sx, sy)` to width/height while scaling position on each axis.
- **Lines — Maintain Thickness:** scale both endpoints/position independently by `sx` and `sy`; keep line thickness unchanged.
- **Other scalable objects** (shapes, tables, QR/Data Matrix, and compatible vector objects) use independent X/Y geometry scaling so they occupy the same relative portion of the new template. QR/Data Matrix module geometry must remain square and use the smaller axis factor.

Apply the operation to the document's object collections, including front/back/page designs and every saved template page. Keep non-geometric metadata, bitmap contents, table cell values/styles, and data bindings intact. Do not mutate the original document until the Scale Templates OK action succeeds.

## UI and state handling

- Use the existing Page Setup dialog and project dialog styles; add a dedicated Scale Templates dialog with native-like controls and accessible labels.
- Unit values in the modal follow System Settings and display to the same precision as Page Setup.
- Page Setup Cancel continues to restore its opening snapshot. Scale Templates Cancel keeps the accepted-in-progress Page Setup values and current invalid/valid drafts, but does not scale content.
- If a staged scale operation fails validation, show the error in the modal and retain the unmodified Page Setup draft.
- Commit/persist once after the user chooses No or confirms scaling. Preserve current Auto Save and edit-history behavior; the successful scale is one undoable document change.

## Verification

- DOM unit tests cover significance threshold boundaries, prompt Yes/No, modal defaults and cancel/escape, per-category formulas, all design/page collections, metadata preservation, rollback on failure, persistence and return to editor.
- Electron runtime test uses isolated appData and a fixture with text, barcode, picture, line, table, front/back/page designs, and multiple template pages. It exercises Yes → Scale Templates → OK and verifies the editor canvas shows the scaled objects; it also checks No and modal Cancel.
- Run the whole-system `npm run test:basic` suite and the required Page Setup Electron runtime check. Do not claim the BarTender implementation is identical beyond the observable supplied behavior.

## Self-review

- “Significant” is fixed at a 10% or greater width/height change, as presented to and approved by the user.
- The confirmation No path and modal Cancel path are explicit and reversible.
- Object category defaults match the screenshot; geometry formulas preserve aspect ratio where requested and line thickness where requested.
- Scaling all saved template pages and sides avoids silently leaving hidden variants at the old geometry.
- Binary files are treated as behavior references only; no proprietary source or executable code is copied into Q LABEL.
