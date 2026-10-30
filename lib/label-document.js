'use strict';

const LABEL_DOCUMENT_EXTENSION = 'qlabel';

const LABEL_DOCUMENT_FILTER = {
  name: 'Q LABEL documents',
  extensions: [LABEL_DOCUMENT_EXTENSION],
};

function isLabelDocumentSave(options = {}) {
  if (options.documentKind === 'label') return true;
  const name = String(options.defaultName || '');
  return /\.qlabel$/i.test(name);
}

function labelDocumentSaveDialogOptions({ defaultName } = {}) {
  const ext = `.${LABEL_DOCUMENT_EXTENSION}`;
  let defaultPath = defaultName || `label${ext}`;
  if (!/\.(qlabel|json)$/i.test(defaultPath)) defaultPath += ext;
  return {
    defaultPath,
    filters: [
      LABEL_DOCUMENT_FILTER,
      { name: 'JSON documents', extensions: ['json'] },
      { name: 'All files', extensions: ['*'] },
    ],
  };
}

function normalizeSavedLabelDocumentPath(filePath) {
  const p = String(filePath || '');
  if (!p) return p;
  if (!/\.(qlabel|json)$/i.test(p)) return `${p}.${LABEL_DOCUMENT_EXTENSION}`;
  return p;
}

function basenameWithoutLabelExtension(filePath) {
  const base = String(filePath || '').split(/[\\/]/).pop() || '';
  return base.replace(/\.(json|qlabel)$/i, '');
}

module.exports = {
  LABEL_DOCUMENT_EXTENSION,
  LABEL_DOCUMENT_FILTER,
  isLabelDocumentSave,
  labelDocumentSaveDialogOptions,
  normalizeSavedLabelDocumentPath,
  basenameWithoutLabelExtension,
};
