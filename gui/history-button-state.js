'use strict';

function updateUndoRedoButtons(undoStack, redoStack, undoButton, redoButton, quickUndoButton, quickRedoButton) {
  if (undoButton) undoButton.disabled = !undoStack?.length;
  if (redoButton) redoButton.disabled = !redoStack?.length;
  if (quickUndoButton) quickUndoButton.disabled = !undoStack?.length;
  if (quickRedoButton) quickRedoButton.disabled = !redoStack?.length;
}

if (typeof window !== 'undefined') window.HistoryButtonState = { updateUndoRedoButtons };
if (typeof module !== 'undefined' && module.exports) module.exports = { updateUndoRedoButtons };
