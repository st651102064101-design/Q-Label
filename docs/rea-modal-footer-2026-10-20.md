# Modal footer placement — REA evidence and implementation record

Date: 2026-10-20
Request: keep action buttons at the bottom of every modal while the modal is resized.
Native parity status: **not verified**; no exact BarTender behavior is inferred.

## Applied evidence workflow

- Read the project `AGENTS.md`, `UNIT_TEST_BASIC.md`, BarTender REA workflow,
  REA skill and current REA MCP contracts before implementation.
- REA checkout: `https://github.com/morluto/rea.git`, revision
  `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Inspected the installed reference `D:/Programs/BarTend.exe` through REA.
  SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Artifact summary Evidence: `ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789`.
  It identifies a 64-bit mixed CLR/native PE, reports complete metadata and
  states that static inspection does not execute the target.
- Feature inspection Evidence: `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d`
  (producer `ev_fc5bff98265a645e0728908efdee186ced5f88f65f9fdcf142f4e944530e74e9`).
  Managed member inspection could not admit CLI metadata: the representation
  exceeded 67,108,864 bytes. REA native UI capture is unsupported on this host.
  Thus footer placement, resize behavior and specific native dialog types remain
  unknown. App screenshots and source styles were not treated as REA evidence.

## Implementation mapping

- `gui/modal-windows.js` detects dialogs with an action footer, marks their
  footer layout, makes the modal a column flex container and assigns its last
  content section as the internal scroller. A direct footer or a footer inside
  a form stays at the lower edge during resize.
- `test/modal-windows.test.js` covers direct-dialog, nested-form and custom-role
  dialogs, and confirms that dialogs without footers keep their original layout.
- `UNIT_TEST_BASIC.md` records the added regression coverage.

## Verification limits

- `node --test test/modal-windows.test.js`: 8 tests passed.
- `npm run test:basic`: 828 passed, 0 failed, 0 skipped; all three legacy
  scripts passed. The result is recorded in `test/basic-unit-result.json`.
- Native BarTender comparison remains unknown because the installed artifact's
  managed metadata exceeded REA's representation limit and native UI capture is
  unavailable on this Windows host.
