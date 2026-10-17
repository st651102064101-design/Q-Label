# Print Preview parity — staged design

Date: 2026-10-18
Status: design approved conversationally; written specification awaiting review.

## Outcome

Implement BarTender-like Print Preview in Q LABEL, using installed binaries,
installed documentation, and reproducible reference output as evidence. The
reference is the user's Print Preview screenshot, not the Data Sources dialog.
Do not claim full source recovery or 100% parity before verifying every supported
behavior. Do not copy the reference application's license-expiration banner.

## Existing implementation and evidence

- `gui/print-dialog.js` currently creates `printPreviewDialog`, prepares a job
  through `zebra.preparePrintJob`, and renders an SVG for the selected page.
- It already supports first/previous/next/last, page input, relative zoom, fit,
  and return to the Print dialog. Preserve prepared source values and ordering.
- `D:/Programs/BarTend.exe` metadata identifies native
  `PrintPreviewView.ExportImages` at RVA 0x27C210 and
  `PrintPreviewView.SetBackgroundColor` at RVA 0x27E670. These are identified
  entry points, not yet proof of their complete behavior.
- Installed Automation help documents `Format.ExportPrintPreviewToImage` and
  range export. Options include DPI, margins, border, color, and per-page names.
  Exporting is a reference measurement route; it does not prove toolbar behavior.

## Architecture

Keep Print settings and job preparation in the existing dialog. Extract preview
interaction and viewport state into a dedicated browser/CommonJS-compatible
module, with pure geometry/navigation functions independently testable in Node.
Keep SVG artwork rendering in the shared LabelPreview implementation. A preview
must never send a print job or reserve/consume serialization numbers.

Store current page, zoom mode/percentage, selected interaction tool, viewport
scroll position, and page-grid choice separately from the document. Closing
Preview must not edit the document. Print returns to the existing Print settings;
the user still explicitly confirms printing there.

## Stages

### 1. Navigation and viewport foundation

Create a toolbar with visible SVG icons and accessible names: Print, Close,
first/previous/next/last, page input/count, zoom in/out, fit page, actual size,
and pan. Provide a scrollable blue workspace, centered white page with shadow,
and a fixed status area showing the actual selected printer, physical page/item
dimensions, page count and zoom. Use Q LABEL's existing application styling.

Clamp page input to valid finite integer bounds; disable unavailable navigation.
Preserve page dimensions and aspect ratio at every zoom. Compute fit from the
viewport's content box without compounding its previous rendered dimensions.
Pan changes scroll only. Clean up listeners/observers on disposal. Surface
preparation/rendering errors inside the preview flow without losing Print settings.

### 2. Region zoom and multiple-page view

Add rectangle zoom, fit width, explicit percentage selection, and page-grid
choices. Determine supported grid sizes, zoom bounds/steps, page advance semantics,
and pointer behavior from actual reference observations before assigning parity.
Keep active page visible; handle the final incomplete grid and resize correctly.

### 3. Output and print-layout parity

Build disposable reference documents and export page images with explicit DPI,
margins and border settings. Compare page/label sizes, rows/columns, gaps,
orientation, mirror/negative, offsets, copies, record order, serialization preview,
multiple templates and front/back behavior against Q LABEL prepared output.
Record unsupported behavior explicitly instead of substituting guessed defaults.

## Reference analysis rules

Use ILSpy for managed methods and targeted Ghidra analysis for native methods.
Retain vendor pseudocode and binaries in ignored local research storage; record
method identifiers, binary hashes and independently described findings in reports.
Distinguish screenshot observations, documented contracts, static analysis,
reference execution, and Q LABEL tests. Do not alter the user's open documents,
close their application, or physically print to gather evidence.

## Verification and delivery

Each implemented stage adds meaningful behavioral unit/DOM tests and updates
`UNIT_TEST_BASIC.md`. Run the complete `npm run test:basic` suite and an isolated
Electron preview runtime check. Assert dimensions, navigation/zoom state, SVG
visibility, close/reopen behavior, and zero print transport calls. Do not treat
unit tests as proof of visual or printer parity.

For each delivered application stage, increment displayVersion/SemVer consistently,
add a dated Thai changelog entry, selectively commit only that stage, and attempt
push. Report the existing GitHub 403 if still present; preserve unrelated changes.

## Acceptance tracking

Use a matrix with one row per behavior and columns for reference evidence,
implementation, automated checks, runtime checks and limitations. A stage can be
delivered with explicit remaining stages; overall 100% parity cannot be declared
while any requested behavior is unverified or missing.
