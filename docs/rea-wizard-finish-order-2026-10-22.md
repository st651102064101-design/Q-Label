# Wizard Finish button order — 2026-10-22

The user explicitly requested Back → Next → Cancel → Finish. This is a custom
Q LABEL button order; no native behavior is being reconstructed or claimed.

Applied Superpowers using-superpowers and verification-before-completion, and
the REA artifact workflow. Read the project gate, basic checklist, REA README,
native-artifact reference and MCP contract; checked the live managed-members
schema. REA checkout dfe8378cf5a727e3d93d47a5986233175c6ef898,
upstream https://github.com/morluto/rea.git.

Rechecked D:/Programs/BarTend.exe SHA-256:
0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3.
The matching wizard investigation is recorded in
rea-wizard-layout-2026-10-21.md. Its managed-members evidence
ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d
could not admit the executable metadata within its 64 MiB budget. Native button
order remains unknown and is not the basis for this user-directed change.

Changed the footer DOM order in gui/new-label-wizard.js; retained button IDs,
submit/cancel handlers, styling and icons. Updated existing unit/runtime order
assertions and UNIT_TEST_BASIC.md. Version 1.144.

Verification: focused unit tests passed 22/22; Electron runtime passed with
--disable-gpu and temporary appData, including footer order. No printing.
Full basic suite results are in test/basic-unit-result.json.
