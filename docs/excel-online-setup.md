# Excel Online — retired 2026-10-22

The user requested removal because Q LABEL will not use Excel Online. This document is now an archive and no longer contains setup instructions.

Removed from the application: source catalog row and icon, wizard sign-in/workbook flow, preload bridge, `database-online` IPC handler, OAuth/Graph reader modules, and the unused `@azure/msal-node` package.

Existing documents keep their saved table rows and bound fields. A legacy `database_connection.type: "online"` can still display those cached rows, but a request to reconnect or refresh is rejected with `PROVIDER_UNAVAILABLE` and the message “Excel Online is no longer supported. Choose another data source.” No automatic migration to another data source occurs.

## Historical evidence

The removed implementation was previously exercised only with controlled OAuth/Graph responses and generated XLSX fixtures. It never completed a real Microsoft account sign-in because Q LABEL had no registered Microsoft app. The user chose not to use this feature.

This does not claim BarTender-equivalent OAuth behavior. The native implementation is documented in the original dated implementation records and the 2026-10-22 retirement evidence at `docs/rea/excel-online-retirement-2026-10-22.md`.
