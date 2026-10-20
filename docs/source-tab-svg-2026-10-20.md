# Source tab SVG — 2026-10-20

User request: add SVG to Data Source / Data Type / Transforms. Bounded visual change: 16px database, type and transform icons, currentColor stroke, 6px label spacing, original text and click handlers retained. Applied Superpowers using-superpowers, brainstorming (bounded design reflected in chat), TDD (missing icon failure before implementation) and verification-before-completion.

Read AGENTS, UNIT_TEST_BASIC, REA skill/native artifact reference, REA README, MCP retained Evidence contract, and mandatory BarTender workflow. Live MCP catalog/schema get_evidence_bundle checked. Connected MCP summary query: operation inspect_pe_resources and exact installed target SHA256 returned zero matching records, not feature evidence. Existing icon investigation could not establish native icon placement from resources; managed members exceed 64MiB budget and Windows UI observation is unsupported. User previously authorized source implementation under these limitations. This is a requested Q LABEL visual addition, not verified native parity.

Installed artifact D:/Programs/BarTend.exe SHA256 verified: 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3. REA checkout https://github.com/morluto/rea.git at dfe8378cf5a727e3d93d47a5986233175c6ef898, 6.7.0. Mapping: gui/object-data-sources-ui.js tab construction uses existing database SVG and distinct type/transform paths; names and handlers retained.

Verification: node --test test/source-tab-icons.test.js failed before fix (Data Source has SVG), passed after. Electron test/source-tab-icons-runtime.js passed actual 16x16 geometry, painted stroke and navigation for all three tabs, isolated appData, no printing. Full basic suite result recorded after completion below.

Full suite npm run test:basic: 838 passed, 0 failed, 0 skipped; all legacy stages passed, undocumentedFiles empty. Report test/basic-unit-result.json v1.068. git diff --check passed.
