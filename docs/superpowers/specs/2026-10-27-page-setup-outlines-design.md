# Page Setup preview outlines

Approved scope: the user approved the explanation with “เริ่ม”. All eight Page Setup tabs must show the same clear solid dark label edges as the supplied BarTender Layout screenshot, including when Print borders is unchecked. Preserve the configured shape, radius, dimensions, margins, gaps and tab-specific annotations. These are preview edges; saved print-border settings and printer output retain their existing meaning.

Use the existing Layout face geometry and stroke (#222, 0.8 viewBox units) for the other Page Setup tabs. Draw the face outside its content clip so its stroke is not cut in half. When Print borders is enabled, retain the actual printed outline inside the content clip so Border width continues to update its preview. Keep the separate Wizard/workspace render paths intact. Verify all tabs, four shapes and both Print borders states, then inspect a real Electron capture and run the required whole basic suite.
