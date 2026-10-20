# Close button spacing — v1.077

User requested more space around the red Close button in the supplied cropped Q LABEL screenshot. Bounded correction: shared control gap4→8px, extra right margin0→8px, vertical centering, header minimum44px so the30px controls fit the native-style Properties header.

Applied Superpowers using-superpowers/systematic-debugging/TDD/verification, project test policy and REA workflow. Read REA README, installed skill, retained-evidence MCP contract and live get_evidence_bundle schema. Queried matching artifact summary ev_cca9ff689f85b64e979bc6079154984648da7eeca9c710476dc946d00760a789 (BarTend.exe SHA2560414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3). This identity record is explicitly **not spacing evidence**. REA Windows UI remains unsupported; no native spacing was reconstructed. Source/custom spacing implementation remains authorized; request is grounded in user's Q LABEL image, not a BarTender parity claim. REA6.7.0, checkout upstream https://github.com/morluto/rea.git at dfe8378cf5a727e3d93d47a5986233175c6ef898 preserved.

Root cause: shared style used gap4px/marginRight0/align-self:flex-start, while the new native-style header could be27px tall. Changes are in gui/modal-windows.js and apply to the shared floating controls. Close click behavior is unchanged.

Red test observed actual4px vs expected8px before correction. Updated existing meaningful DOM and Electron geometry assertions for the new requested values. Runtime uses isolated appData and no physical printing. Full required npm run test:basic result is recorded in test/basic-unit-result.json and test/basic-unit-output.log; task logs D:/QLabel-agent-work/close-spacing-{red,unit,runtime,basic}.log. Unit/runtime passing does not prove native parity.
