# New Document Wizard right-edge gutter — 2026-10-22

## User request and implementation

The supplied Q LABEL screenshots show a visible gap between the right edge of the New Document Wizard contents and the green window border. The cause is in Q LABEL's injected CSS in `gui/new-label-wizard.js`: header, heading, body, preview aside, and footer each had right padding (8–16px in the source rules). A final scoped override sets both `margin-right` and `padding-right` to zero on these five regions. No other wizard gutters or button gaps were changed.

Regression coverage is `test/project-home.test.js` plus the actual Electron wizard runtime in `test/wizard-preview-runtime.js`; both check all five regions.

## REA workflow and evidence

- Followed `docs/rea-bartender-workflow.md`, `../rea/README.md`, and the `managed-static-analysis` / managed-members portion of `../rea/docs/mcp-contracts.md`.
- Live MCP catalog checked with `binary_session`: REA `6.7.0`, 207 tools; tool catalog SHA-256 `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`.
- Selected MCP tool and schema: `inspect_managed_members({path?: string, detail?: "complete" | "summary", type_names?: string[]})`; followed by `inspect_analysis_view({source:{kind:"retained-evidence",evidence_id}, view:{kind:"managed-members",collection:"types",offset,limit}})` to identify exact wizard types. Both operations were available and used.
- Installed feature-related artifact: `D:/Programs/Seagull.WizardFramework.dll`, SHA-256 `1a2cba97bf664d69b3a2a3e25bdb1ba4265b39a0c81ae6d93778e081d9fe2cc7`, 29,376 bytes, module MVID `1e795724-08da-4113-9cad-a82ce5374bd9`.
- `inspect_managed_members` Evidence `ev_35c2e6c3990b2686278df5057b15375874849202cd34d4e40d32fd620f1eafbe` selected the matched types `Seagull.WizardFramework.WizardBase` and `Seagull.WizardFramework.IWizardPage` (no unmatched names); complete managed metadata coverage. It supports identifying the installed wizard framework contracts, but does not establish page CSS, right padding or a measured stock wizard edge.
- `D:/Programs/BarTend.exe` was also identified during the feature audit (SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`). It is mixed CLR/native; metadata identity alone is not layout evidence. The screenshots and the Q LABEL CSS were therefore used to identify and fix this specific gutter. Native per-screen margin values remain unknown.

## Validation

- `node --test test/project-home.test.js`: 4 passed, 0 failed.
- `npx electron test/wizard-preview-runtime.js`: PASS; all five wizard regions computed to `padding-right: 0px` and `margin-right: 0px`; existing seven-step footer and responsive preview checks also passed.
- `npm run test:basic`: PASS; 997 unit tests passed, 0 failed, and all three legacy scripts passed. Report: `test/basic-unit-result.json`.
