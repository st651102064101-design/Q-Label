(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TableDividerLive = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** Pure geometry for a Word-style table line resize (no content-fit, no bake). */
  function applyTableLineGeometry(element, axis, items, result, original) {
    const horizontal = axis === 'columns';
    const model = element.table_model;
    if (horizontal) model.autoWidth = false;
    else model.autoHeight = false;
    const total = Math.max(1, items.reduce((sum, item) => sum + Number(item.size), 0));
    if (horizontal) {
      element.width_mm = Math.max(total, original.width + Number(result.tableDelta || 0));
      element.x_mm = result.edge === 'start' ? original.x + (original.width - element.width_mm) : original.x;
      element.height_mm = original.height;
      element.y_mm = original.y;
    } else {
      element.height_mm = Math.max(total, original.height + Number(result.tableDelta || 0));
      element.y_mm = result.edge === 'start' ? original.y + (original.height - element.height_mm) : original.y;
      element.width_mm = original.width;
      element.x_mm = original.x;
    }
    return { horizontal, total };
  }

  /**
   * One live divider frame: apply geometry + paintLive only.
   * Must never call bake or drawEditorCanvas (those hitch every RAF).
   */
  function paintDividerLiveFrame(hooks, ctx) {
    const calls = { bake: 0, draw: 0, fit: 0, ensure: 0, live: 0 };
    applyTableLineGeometry(ctx.element, ctx.axis, ctx.items, ctx.result, ctx.original);
    hooks.paintLive?.(ctx);
    hooks.paintSelection?.(ctx);
    calls.live += 1;
    return calls;
  }

  /** After pointerup: content-fit once, then bake + full canvas draw once. */
  function commitDividerGesture(hooks, ctx) {
    const calls = { bake: 0, draw: 0, fit: 0, ensure: 0 };
    if (ctx.axis === 'columns') {
      hooks.fitRowsToContent?.(ctx.element);
      calls.fit += 1;
    } else {
      hooks.ensureContentFits?.(ctx.element);
      calls.ensure += 1;
    }
    hooks.bake?.(ctx.element);
    calls.bake += 1;
    hooks.drawEditorCanvas?.();
    calls.draw += 1;
    return calls;
  }

  return { applyTableLineGeometry, paintDividerLiveFrame, commitDividerGesture };
});
