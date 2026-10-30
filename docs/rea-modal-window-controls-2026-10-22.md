# Modal window close and minimize evidence — 2026-10-22

## Scope

Fix Q LABEL's modal window controls so a maximized modal's close/minimize actions do not close or minimize the root Electron BrowserWindow. This is a requested Q LABEL interaction fix. It does not reconstruct a BarTender modal behavior or claim pixel/behavior parity.

## REA gate and artifact identity

- Installed artifact: `D:/Programs/BarTend.exe`
- SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`
- REA MCP server: `rea-agents/server` 6.7.0; tool catalog digest `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`; REA checkout revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Connected MCP operation used: `inspect_managed_members`, input schema `path` + `detail` (summary). Evidence ID: `ev_1ba63fc17847b24803c541c27b573926e0c9b415e3ef476f08a2d201dbcc2a4d`.
- Limitation: BarTend.exe's managed metadata exceeds the REA parser's 67,108,864-byte resource budget, so member-level evidence was unavailable. The Windows native UI capture path was also unavailable in the current REA host. Artifact identity is recorded, but is not treated as feature-matched evidence.
- No unrelated native evidence was used to infer this app-specific behavior.

## Implementation mapping

- `gui/modal-windows.js`: modal stack exposes top-close routing; minimize hides only that entry; dock restoration is allowed through nested-modal event trapping and activates the restored entry.
- `gui/renderer.js`: the existing main-window close request handler routes the title-bar X request to the active modal first; app close/save behavior runs only when no modal is active.
- `gui/preload.js` and `gui/main.js`: modal-active state is sent to Electron main, which disables root-window minimization while a modal is active. Minimizing a modal leaves the root window visible and unminimized.
- `test/modal-stack.test.js`: regression coverage for minimize, restore, nested stack and close-top.
- `test/modal-controls-spacing-runtime.js`: real Electron regression coverage for maximized controls, modal minimize, dock restore, root window minimizable state and native title-bar close.

## Verification

The focused Node tests and Electron runtime pass. The Electron test confirms native title-bar close closes the active modal while the root BrowserWindow remains alive, and modal minimize does not minimize that root window.
