# Excel Online retirement — REA evidence and implementation record

Date: 2026-10-22. User request: remove Excel Online because Q LABEL will not use it. This intentionally removes a Q LABEL feature; it is not a claim of parity or a request to reproduce the native provider.

## REA gate and artifact scope

- Applied Superpowers `using-superpowers`, `systematic-debugging`, `test-driven-development`, and `verification-before-completion`. The RED tests first failed on the visible 23rd catalog entry, an available `online` provider, a legacy session accepted by the registry, a registered `database-online` endpoint, and the preload bridge. The refresh-path test also first failed with `SESSION_NOT_FOUND`; adding the retired-type IPC guard changed it to the expected `PROVIDER_UNAVAILABLE`.
- REA checkout: `../rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`.
- Connected REA MCP: `rea-agents` 6.7.0. `binary_session` reported 207 tools and catalog digest `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`. Selected `inspect_managed_members` schema accepts an absolute `path`, `detail`, and exact `type_names`; this operation was available.
- Read the matching managed-member summary and retained-view guidance in `../rea/docs/managed-code-analysis.md`, and the retained Evidence / `inspect_analysis_view` contract section in `../rea/docs/mcp-contracts.md`. The latter has no Excel-specific native behavior contract; live `inspect_managed_members` schema and exact managed artifact query supplied the selected operation details.
- `D:/Programs/BarTend.exe` SHA-256: `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.
- Related installed `D:/Programs/Seagull.Data.Configuration.dll` SHA-256: `58a455d3e46cbbfbcd71c0ce0a1ac6d9a87e66297d67fbacfd964bf75ab4cf56`; MVID `5f1983f6-d3c1-4407-9617-924b16acb001`. Prior evidence records this assembly as part of the same installed BarTender build.

The first attempt to open prior evidence `ev_d088fde217fa4891595a535d55a5b019a41febe91bfb06091e7ebaf68d994979` failed because it was not retained in the live REA session (`evidence_integrity_mismatch`). I then ran the matching MCP operation against the verified DLL and exact types:

- `Seagull.Data.Configuration.Wizard.ViewModels.ExcelOnlineConnectionPageViewModel`
- `Seagull.Data.Configuration.Wizard.ViewModels.ExcelOnlineSheetsSelectionViewModel`
- `Seagull.Data.Configuration.Wizard.ViewModels.ExcelOnlineTableSelectionPageViewModel`
- `Seagull.Data.Configuration.Wizard.Components.ViewModels.OAuthConnectionPanelViewModel`

Fresh summary Evidence: `ev_62a1426648865aba12c773d9d41aadcc1e254ab39bd3cd05bc78c915db676dda`. It reports selection coverage complete and no unmatched type names. Its parent managed-members Evidence: `ev_d088fde217fa4891595a535d55a5b019a41febe91bfb06091e7ebaf68d994979`. The selected method page Evidence `ev_15db2aa820e01fda925d55d860903af9f2b71c2baf97bd8d60c6a79988c26d42` begins in the Excel Online connection view model. Findings are static managed metadata and file-backed CIL anchors only: they establish that native Excel Online connection, worksheet/table selection, and OAuth-related view-model components exist in this installed build. They do not establish live sign-in or exact UI behavior.

## Change mapping

- Removed `online` from `lib/database/catalog.js`, so the source picker and browser import bundle now expose 22 types.
- Removed the Excel Online image and map entry, native-style wizard pages/styles, renderer preload method, `database-online` IPC handler, provider adapter, OAuth module, Graph reader, obsolete tests, and unused `@azure/msal-node` dependency.
- Added a retired-type message at the provider boundary. Registry detection, provider sessions, IPC open, and IPC refresh reject old `type: "online"` configurations as `PROVIDER_UNAVAILABLE` with “Excel Online is no longer supported. Choose another data source.” No legacy connection is silently remapped.
- Existing document rows and fields stay intact as cached snapshots. This preserves label data while preventing a network reconnect through the retired provider.

## Verification and limitations

- All five retirement unit tests passed, including the legacy refresh-path guard. The final full `npm run test:basic` run passed 979/979 unit tests with zero failures and zero skips; `test/data-sources.js`, `test/print-job.js`, and `test/smoke.js` also passed. The full log is `D:/QLabel-agent-work/excel-online-retire-20261022/basic-final-rerun.log`.
- Q LABEL never completed Microsoft sign-in with a real personal account. This task removes the integration and does not test network authentication, real OneDrive workbooks, or native runtime UI.
- REA's managed inspection is static and never executes the native assembly. The user's removal request intentionally diverges from the installed BarTender catalog.
