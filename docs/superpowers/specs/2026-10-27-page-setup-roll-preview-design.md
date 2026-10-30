# Page Setup stock preview

Approved scope: user's 2026-10-27 request and “เริ่ม” after the four-point summary. Reproduce the supplied BarTender Layout preview: rounded/configured label faces, per-column adjacent roll slivers, liner edges, actual margins and gaps, live row/column updates and Page/Template Size captions.

Approach: extend the existing shared SVG PaperPreview renderer. A screenshot bitmap cannot represent live dimensions and duplicating the renderer would make tabs disagree. Roll identity comes from stock.printer_type (Roll by default), not the number of cells. Explicit Sheet/Card/Page stock has one sheet without roll continuation. Shape/radius follow the selected Shape values, including square and elliptical shapes; do not change saved printing dimensions for decoration. Existing manual Layout slot calculation remains the source of geometry.

Native resources confirm the size captions and Corner Radius control; supplied screenshots determine the artwork because static resource evidence does not establish its drawing algorithm. Maintain the Page Setup blue gradient. Wizard grey previews retain their own renderer.
