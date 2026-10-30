# New Document Wizard title bar — 2026-10-22

## Reference and implementation

The user-provided BarTender screenshot shows a compact title bar with a close control and no minimize control. Q LABEL's New Document Wizard now sets `data-hide-minimize="true"`; shared modal chrome omits only that wizard's minimize button. Its header is constrained to 32px. The shared maximize behavior remains governed by the wizard's existing fixed-size setting. Other windows retain their minimize control.

## REA evidence

- REA checkout: `D:/Programs/rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- The REA README, `rea/docs/mcp-contracts.md`, managed-code-analysis documentation and the relevant native/artifact reference were read. Live catalog: v6.7.0, 207 tools, digest `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639c`.
- Connected MCP `inspect_managed_members` schema used: `{path?, detail?: "complete"|"summary", type_names?: string[]}`. Selected types: `Seagull.WizardFramework.WizardBase` and `Seagull.WizardFramework.IWizardPage` in `D:/Programs/Seagull.WizardFramework.dll`.
- Evidence ID `ev_2a915be25f615b98bb476d07fe10dd2f3e2bf026e3d480d5120f51215e602a00`; DLL SHA-256 `1a2cba97bf664d69b3a2a3e25bdb1ba4265b39a0c81ae6d93778e081d9fe2cc7`; MVID `1e795724-08da-4113-9cad-a82ce5374bd9`.
- The matched members describe wizard-page navigation (`MoveNext`, `MovePrevious`, `Cancel`, `Finish` and page movement properties). They provide no title-bar, minimize-glyph or chrome sizing evidence. The installed `D:/Programs/BarTend.exe` SHA-256 is `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`; no feature-matched runtime evidence for the requested title bar was available from it. Thus 32px is based on the supplied screenshot and is not a verified native pixel measurement.

## Verification

- `test/modal-windows.test.js`: wizard exposes only Close; normal modal controls remain covered.
- `test/wizard-preview-runtime.js`: Electron measured the title header at 32px, verified Close is present and Minimize/Maximize absent, and traversed all eight wizard pages.
- `npm run test:basic`: 1,008 unit tests passed, 0 failed, followed by successful `data-sources.js`, `print-job.js` and `smoke.js` stages. See `test/basic-unit-result.json`.
