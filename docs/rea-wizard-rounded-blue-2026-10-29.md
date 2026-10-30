# Rounded wizard previews

REA checkout https://github.com/morluto/rea.git revision 9341b116efddefc2bcdd8208d27d6e4ea78cc507. Installed D:/Programs/BarTend.exe SHA-256 0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3; D:/Programs/BtEnu.dll SHA-256 c2e506295a94ce0378f86f522732f3055225ad8babdd3c99a8065302f1f88e0b.

Feature-matched retained Ghidra 12.1.4 resource evidence ev_a81222b9241d8214e363e83eb05d2f3ee2127393194e239cac8000b0da54c4d3 identifies Printed Item Shape, Side Edges and Template Size captions; ev_55aaf2bf0df36555ace94c3876faba00cc73266fd4d9678576ae1bbb925c18cc identifies Template Background and Finished. These resources do not establish native rendering or colors. The user screenshots specify the requested blue backdrop and visibly rounded labels; exact native rendering is unverified.

Implementation: new-label-wizard passes its selected shape to the shared roll preview option; modal-preview applies the blue gradient and a visual minimum corner radius to rounded wizard rolls and single sheets, without changing document geometry. Rectangular sheet previews remain grey. Verified unit test and Electron runtime across Items Per Page, Side Edges, Printed Item Shape, Template Size, Template Background and Finished.
