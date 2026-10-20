# Picture color behavior audit

## User request

The user says pictures should display in color. The attached Q LABEL screenshot shows version `v1.031` and a picture rendered in grayscale. The intended behavior is to preserve an imported picture's original colors in the design canvas and design preview while retaining the monochrome bitmap used by the Zebra print path.

## REA workflow and evidence

- Applied Superpowers `using-superpowers`, `systematic-debugging`, `brainstorming`, and `verification-before-completion`. The existing focused regression was run to establish current behavior; no code was changed because the current source already implements the requested behavior.
- REA checkout: `../rea`, upstream `https://github.com/morluto/rea.git`, revision `dfe8378cf5a727e3d93d47a5986233175c6ef898`; project-pinned CLI is `rea-agents@6.7.0`. The active REA MCP catalog and schemas for `open_binary` and `trace_feature` were inspected.
- REA MCP `open_binary(path: D:/Programs/BarTend.exe, provider_id: auto)` opened the shipped artifact as x86_64 PE. SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`, matching the local hash.
- REA MCP feature query `trace_feature(query: "Picture color preview")` failed with `provider_unavailable`. Ghidra is unconfigured and rejects this managed PE target; Hopper is unsupported on Windows; IDA and Kuna are unconfigured; Kuna also does not support PE. No native picture method/resource was recovered. No configuration or provider was installed or changed.
- `D:/Programs` contains candidate image libraries including `Leadtools.dll`, `Leadtools.Codecs.dll`, and `Leadtools.ImageProcessing.Color.dll`; this investigation could not prove which are loaded for BarTender picture import or display. These candidates are not treated as feature evidence.
- REA does not verify native color behavior for this task. The installed app's own screenshot is also not REA evidence.

## Current Q LABEL implementation

This capability already exists in the current source, added in commit `613dcfa7` (Picture colors v1.041):

- `gui/renderer.js` captures the imported image into a PNG `color_image_data` field while separately building `bitmap_hex` for monochrome print output.
- `gui/picture-color.js` serializes that PNG with the picture and emits it as an SVG image in design mode.
- `gui/preview.js` uses the embedded color PNG for design previews and the monochrome bitmap for print mode.
- `test/picture-color.test.js` covers import color data persistence, design preview, background preview, print preview and Zebra output.

The current `package.json` reports v1.065, later than the screenshot's v1.031. A project created with the older import path may contain only one-bit `bitmap_hex`; that data has discarded the original colors, so the original image file must be reimported to recover them. The current software cannot infer lost colors from the monochrome bitmap.

## Verification

- `node --test test/picture-color.test.js`: 5 passed, 0 failed, 0 skipped.
- `npm run test:basic`: 833 passed, 0 failed, 0 skipped; all three legacy stages passed. Report: `test/basic-unit-result.json`; assertion log: `test/basic-unit-output.log`.
- These tests verify current source behavior. They do not prove BarTender parity or actual printer color output; Zebra's bitmap path is intentionally monochrome.
- No application source change was required for this request, so the app version was not bumped and no app-change commit was created.
