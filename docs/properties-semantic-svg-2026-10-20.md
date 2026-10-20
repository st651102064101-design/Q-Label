# Properties tree semantic SVG — 2026-10-20

Scope: user-requested recognizable SVG for Properties tree and its toolbar. Design: variable-width barcode bars; barcode plus123 for Human Readable; serif A for Font; rectangular Border; ruler for Position; framed Auto Fit; document-plus New and document/clipboard Copy/Paste. Source tree uses the actual source kind icon (document, clock, database, etc.) instead of the same barcode-document icon. Kept currentColor styling,16px dimensions, titles and existing handlers.

Applied Superpowers using-superpowers, bounded brainstorming/design in chat, TDD and verification-before-completion. Read project AGENTS/checklist, REA README/skill/native reference, MCP retained-evidence contract and mandatory BarTender workflow. Connected catalog and get_evidence_bundle schema checked; summary with exact target SHA and inspect_pe_resources returned zero matching records. This is not native feature evidence. Earlier icon analysis recovered26 resources and2 icon groups but did not identify the requested control icon mapping. Managed members remain limited by64MiB representation, Windows UI capture unsupported, C++/CLI native provider limitation remains. User authorized source changes in this situation; native icon fidelity remains unverified.

D:/Programs/BarTend.exe verified SHA256:0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3. REA origin https://github.com/morluto/rea.git, checkout dfe8378cf5a727e3d93d47a5986233175c6ef898, version6.7.0. No claim that requested artwork is recovered native artwork.

Implementation: gui/object-properties.js property icon table/root/source summary; gui/object-data-sources-ui.js source tree SVG and four toolbar shapes. Pre-existing unrelated changes in the latter file are preserved outside this commit.

Verification: new Properties regression failed before change because Border had no frame; after implementation, corrected fixture initialization to await prior close and exercised the available Font page. node --test test/object-properties-pages.test.js:16 passed. node --test test/source-tab-icons.test.js:2 passed. Electron test/properties-icons-runtime.js passed actual geometry/painted/viewBox and toolbar checks, with isolated appData and no printing.

First full basic suite found a regression: text SVG digits contributed to button.textContent and broke exact tab caption lookup. Replaced digits with vector strokes (no text node), added caption assertion and reran original catalog barcode tests without changing their expectations. Targeted tests and Electron passed.

Final npm run test:basic: 840 passed, 0 failed, 0 skipped; all three legacy stages passed, inventory complete. Report test/basic-unit-result.json v1.069. Final Electron runtime passed. git diff --check passed. Screenshot capture from hidden test window was unavailable; no visual screenshot comparison is claimed.
