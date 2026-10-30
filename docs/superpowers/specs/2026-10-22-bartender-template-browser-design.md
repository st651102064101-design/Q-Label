# BarTender Template Browser parity — design

Date: 2026-10-22  
Status: approved by user (cloud-first, local fallback)

## Goal

Reproduce BarTender **Starting Point** and **Template Browser** (Template Manager) in Q LABEL New Document Wizard: same UX flow, catalog content, search/filter/pagination where feasible, and template selection before continuing the wizard.

## REA / artifact evidence

| Artifact | SHA-256 | Finding |
| --- | --- | --- |
| `D:/Programs/Seagull.TemplateBrowser.dll` | `7bd51bbd0c668f01c87fc904e2199b12607ad0a13a22f09efa5a697022a21f87` | WinForms shell hosting **WebView2**; references `Microsoft.Web.WebView2.*`. Embedded URL string: `https://templatebrowser.bartendercloud.com/bttemplatebrowser/?Selected` (Evidence `ev_bdfc28e83b1c07f2…`, `ev_5daa5829fbc048cb…`). |
| Local install | — | `C:\ProgramData\Seagull\PrintStation\wwwroot\Templates` and installer cache: **228** `.btw` files (16 top-level industries). User screenshot shows **480** templates → additional rows come from **BarTender Cloud subscription**, not the offline folder alone. |
| Q LABEL | — | No `.btw` import pipeline (CHANGELOG v1.x). Library selection cannot yet open native `.btw` as a full Q LABEL document without a converter. |

## User-approved data strategy

1. **Primary:** load BarTender Cloud Template Browser (same origin as native WebView2) so subscribed users see the full catalog (~480).
2. **Fallback:** offline catalog built from installed `.btw` under ProgramData (228), with card UI matching the screenshot (name, description heuristic, size from filename, industry tag).

## UX mapping

### Starting Point (wizard step 0)

- Radio: **Blank template** | **Select template from library** (enabled, no “Coming Soon”).
- Subscription notice: `Template library requires active maintenance or subscription.` / `Active until 01/02/2027`.
- **Select…** opens Template Browser.
- When library mode is selected: **Next**, **Finish** disabled until a template is chosen (BarTender screenshot); **Cancel** always enabled.
- Blank mode: **Next** enabled (unchanged).

### Template Browser window

- Title: **Template Browser**; header band **Template Manager** / **Manage your templates** (teal).
- Toolbar: Add Filter, search, grid of cards, pagination 50 per page, status `1 - 50, of N templates found`.
- **Cloud mode:** Electron `BrowserWindow` → `https://templatebrowser.bartendercloud.com/bttemplatebrowser/` (partition `persist:bartender-template-browser` for Seagull login cookies).
- **Local mode:** renderer dialog fed by `gui/template-library-catalog.js` generated via `npm run import:bartender-templates`.

### Wizard continuation after pick

- Store `{ id, name, source: 'cloud'|'local', path? }` on the wizard session.
- **Phase 1:** selection unlocks Next; summary shows template name; Finish still runs blank/custom wizard unless `.btw` conversion exists.
- **Phase 2 (future):** map cloud/local template to Q LABEL JSON or invoke BarTender automation to export.

## Limitations (explicit)

- Cloud catalog requires user Seagull subscription / login in the embedded browser; Q LABEL cannot fabricate 480 entries without cloud or a captured API + credentials.
- Pixel-perfect card thumbnails require preview assets from Seagull or rendered `.btw` previews (not in offline folder as PNG).
- Full “open template in editor” parity blocked until `.btw` import or cloud download format is defined.

## Verification

- Unit: starting-point enablement, library gating on Next/Finish, local catalog import script.
- Electron: cloud window opens URL; local browser shows ≥228 cards when cloud blocked.
- `npm run test:basic` after each delivery step.
