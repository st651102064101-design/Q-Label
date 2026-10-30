# Page Setup roll preview implementation plan

**Goal:** Page Setup displays multi-label roll geometry like the approved reference.

**Architecture:** Extend gui/modal-preview.js. Use actual slot bounds and physical gaps to build a per-column continuation, with media identity independent of rows/columns. Keep existing Shape, Layout and sheet rendering behavior.

**Tech Stack:** Electron renderer, SVG, node:test/jsdom.

**Spec:** ../specs/2026-10-27-page-setup-roll-preview-design.md

- [x] Record matched REA artifacts/resources and screenshot-based limits.
- [x] Add failing geometry tests for 2x2 roll, zero/nonzero gaps, shape and explicit sheet.
- [x] Extend existing renderer; retain one preview and actual captions.
- [x] Verify focused units and Electron live Layout changes/captures.
- [x] Release v1.243, update checklist/changelog and run npm run test:basic.

Review focus: no artificial gap at zero; radius uses each cell size; per-column top/bottom slivers; explicit sheets never get roll slivers; live margins/gaps and captions use the same geometry. Execute inline in the shared user workspace and preserve pre-existing edits.

Review: independent reviewer found continuation clipping for a 25×100mm roll with 20mm vertical gap. Added a failing fit regression, included both physical gaps in the viewport scale denominator, then verified it passes; reviewer confirmed the fix. Runtime fixture awaits its asynchronous dialog close before opening another fixture. The first full suite exposed an old mirror assertion selecting a new neighbour clipping group; its selector now targets the main label group and retains the same effect assertions. Final basic suite rerunning after all changes.

Final verification: focused 43/43, Electron runtime passed, full basic 1,235/1,235 across 164 files plus all three legacy stages, 0 failed/0 skipped; report timestamp 2026-10-27T02:18:51.720Z. Review complete; no remaining findings for the reported fit defect.
