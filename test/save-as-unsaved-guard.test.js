'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const flow = require('../gui/save-as-flow.js');

test('Save As clears unsaved state before selecting the saved copy', async () => {
  const stages = [];
  const draft = { name: 'Original', elements: [] };
  await flow.saveAs({
    getEditing: () => draft,
    readEditorIntoDraft: () => stages.push('read'),
    saveFile: async () => ({ canceled: false, path: 'C:\\\\out\\\\My Copy.qlabel' }),
    saveTemplate: async () => ({ ok: true, file: 'My_Copy.json' }),
    reloadTemplates: async () => stages.push('reload'),
    clearUnsavedBeforeSelect: () => stages.push('clear-unsaved'),
    selectTemplate: async file => { stages.push(`select:${file}`); },
    finalizeSavedCopy: saved => stages.push(`finalize:${saved.file}`),
    setEditorStatus: () => {},
    alert: () => {},
  });
  assert.deepEqual(stages, ['read', 'reload', 'clear-unsaved', 'select:My_Copy.json', 'finalize:My_Copy.json']);
});
