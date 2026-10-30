(function (root, factory) {
  const flow = factory();
  if (typeof module === 'object' && module.exports) module.exports = flow;
  if (root) root.LabelSaveAsFlow = flow;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let pendingSave = null;
  function saveAs(dependencies) {
    if (pendingSave) return pendingSave;
    pendingSave = runSaveAs(dependencies).finally(() => { pendingSave = null; });
    return pendingSave;
  }

  async function runSaveAs({ getEditing, readEditorIntoDraft, saveFile, saveTemplate, reloadTemplates, selectTemplate, setEditorStatus, alert, clearUnsavedBeforeSelect, finalizeSavedCopy }) {
    if (!getEditing()) return;
    readEditorIntoDraft();
    const draft = structuredClone(getEditing());
    const result = await saveFile({
      documentKind: 'label',
      defaultName: (draft.name || 'label') + '-copy.qlabel',
      content: JSON.stringify(draft, null, 2),
    });
    if (result.canceled) {
      if (result.error) alert(result.error);
      return result;
    }
    const filePath = String(result.path || '');
    if (!filePath) throw new Error('The save dialog did not return a file path');
    const name = filePath.split(/[\\/]/).pop().replace(/\.(json|qlabel)$/i, '');
    draft.name = name;
    const saved = await saveTemplate(name, draft);
    if (!saved?.ok) throw new Error(saved?.error || 'Could not save label');
    await reloadTemplates();
    if (clearUnsavedBeforeSelect) clearUnsavedBeforeSelect();
    await selectTemplate(saved.file);
    if (finalizeSavedCopy) finalizeSavedCopy(saved);
    setEditorStatus('ok', 'Saved successfully: ' + filePath);
    return { ...result, name, saved };
  }

  return { saveAs };
});
