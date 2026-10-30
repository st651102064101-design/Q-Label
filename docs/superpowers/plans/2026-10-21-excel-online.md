# Excel Online implementation plan

Status: superseded and retired by the user's request on 2026-10-22. Preserved as a historical record; do not execute the unchecked tasks below.

Continues approved database-wizard specification and Native execution. No new scope approval needed.

Goal: Microsoft browser sign-in, OneDrive workbook/folder selection, sheet review and actual read-only import/refresh. No credentials in label files.
Architecture: main-process owner-bound OAuth session using PKCE and loopback callback; Microsoft Graph Files.Read downloads workbook snapshots; existing Excel parser and provider sessions handle schema/read/refresh. Public config contains only item ID/name. Tokens stay in memory; restart requires sign-in again. Client ID must belong to Q LABEL, configured by operator; never reuse BarTender credentials.

- [ ] RED tests: OAuth state/PKCE/cancel; Graph paging/origin checks, workbook import, refresh failure.
- [ ] Implement isolated OAuth and Excel Online services; expose owner-bound IPC.
- [ ] RED DOM tests: browser sign-in, folder/workbook selection, sheet selection and cancel/stale responses; wire wizard and manager refresh.
- [ ] Full basic suite and isolated Electron runtime with controlled Graph responses. Real Microsoft account integration requires Q LABEL client ID and user sign-in; record unrun separately.

REA: Configuration.dll SHA 58a455d3e46cbbfbcd71c0ce0a1ac6d9a87e66297d67fbacfd964bf75ab4cf56, MVID 5f1983f6-d3c1-4407-9617-924b16acb001. Connected inspect_managed_members exact ExcelOnlineConnectionPageViewModel, SheetsSelectionViewModel, TableSelectionPageViewModel, OAuthConnectionPanelViewModel, parent ev_d088fde217fa4891595a535d55a5b019a41febe91bfb06091e7ebaf68d994979; unmatched empty. Native includes OAuth, cancellation, sheet/table/range/header choice. Current implementation will not claim complete native range/table geometry parity. REA upstream morluto/rea revision dfe8378cf5a727e3d93d47a5986233175c6ef898, MCP 6.7.0. Applied using-superpowers, existing approved brainstorming/spec, writing-plans, executing-plans and TDD. Existing shared dirty workspace ruling remains.

Microsoft primary API contracts: https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow and https://learn.microsoft.com/en-us/graph/api/driveitem-get-content?view=graph-rest-1.0 . Desktop PKCE, public client ID, delegated Files.Read. Download avoids workbook APIs requiring write permissions; parsing a workbook snapshot is an implementation choice, not native provider parity.
