# Template Manager layout

User approved screenshot 2 on 2026-10-22 after the Superpowers brainstorming design. This is a bounded revision of the existing browser. Applied using-superpowers, brainstorming and test-driven-development (filter/pager tests failed before implementation). REA skill, native/artifact reference, checkout README, managed-code-analysis and MCP result/identity contracts were read.

## Native findings and identity

REA upstream https://github.com/morluto/rea.git; checkout `dfe8378cf5a727e3d93d47a5986233175c6ef898`. Live MCP REA 6.7.0, 207 tools; catalog digest `af39310c9591bb981893ec0d2188b1bcf6e9cc8ba3ac513d5bbefc8ddcb85639`. Inspected live schema for `inspect_managed_members({path?, detail?:complete|summary, type_names?:string[]})` and invoked the connected operation with `D:/Programs/Seagull.TemplateBrowser.dll`, complete detail.

Artifact SHA-256 `7bd51bbd0c668f01c87fc904e2199b12607ad0a13a22f09efa5a697022a21f87`, MVID `150e39b1-102c-43ae-a2b9-627b4da776b7`. Evidence `ev_ed5e9b2789e9d24fe4a93b8eae97f95fe8a5979d96d4ea1ab1ae39f03e3f186a`, provider rea-dotnet-static v1. Starting artifact `D:/Programs/BarTend.exe` SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.

Matched native types TemplateBrowserForm/TemplateBrowserManager and methods TemplateBrowserForm_LoadAsync, WebView_WebMessageReceived, InitializeComponent. User strings establish the hosted URL `https://templatebrowser.bartendercloud.com/bttemplatebrowser/`, title Template Browser, host messages Ready/Close and Escape closing only outside an active filter panel. The DLL hosts the Cloud interface, rather than defining its cards as native WinForms controls.

Separately, ordinary HTTP read of that hosted URL returned main.4714091d.js and main.ad3b8553.css. The latter defines title color #068fbe, thumbnail containment and filter panel classes. This is web-source observation, not a native runtime trace. HTTP HEAD on the catalog's S3 thumbnail returned 403; equivalent public bartender-images-cdn URL returned 200.

## Implementation mapping

- gui/template-browser.css: 80px teal band; left Add Filter; right 225px search and filter toggle; white grid with 320px-wide/400px-tall cards and 176px image area. Rows overflow rather than shrink. Responsive column count, bounded grid scrolling and fixed footer.
- gui/template-browser.js: selectable industry filter panel with Apply/Cancel/Clear, removable chips, search/page reset, ellipsis and final page, category badges, known S3 preview URLs mapped to the working public CDN. Cloud catalog preferred; installed local entries are fallback. Sort by displayed name, as in the supplied reference.
- Existing template selection callback is retained. No BTW document-conversion changes.
- scripts/import-bartender-templates.js now keys Cloud rows by ID instead of display name and disambiguates repeated service keys rather than dropping rows. Regeneration obtained 480 of 480 Cloud records and 228 installed local templates, yielding 679 combined rows; the browser shows the 480 Cloud rows by default. Prior name merging dropped distinct Cloud records and mislabeled repeated local rows as cloud+local.

## Verification and limits

test/template-browser.test.js covers filtering, chip removal, paging/search reset, template selection, image URL correction and the existing dialog scrollbar regression. test/template-browser-runtime.js loads actual application inline CSS and modal stack, measures 400px cards/176px image areas/80px header at 1560, 1000 and 600px, checks grid overflow without horizontal clipping, and decodes real Cloud thumbnails. Captures are test-results/template-manager-{1560,1000,600}.png.

Icons are Q LABEL SVGs matching category meaning and color, not extracted proprietary artwork. Filter interaction is Q LABEL's explicit Apply model; complete native filter controls and runtime click parity were not observed. Screenshot sizing plus hosted CSS informs layout, not a claim of 100% native implementation parity. Network thumbnails still require internet. Whole basic suite results are recorded in test/basic-unit-result.json.

Final verification on integrated v1.204: `npm run test:basic` passed 1,042/1,042 unit tests, zero failures/skips; all three legacy stages passed and no test files were undocumented. Electron runtime passed all three viewport sizes and asserted exactly 480 Cloud templates. The first full-suite attempt encountered in-progress changes to Printed Item Shape in the shared wizard; its current 35 unit cases passed before the successful full rerun. This feature is recorded in CHANGELOG v1.203; v1.204 includes the concurrent Side Edges change.
