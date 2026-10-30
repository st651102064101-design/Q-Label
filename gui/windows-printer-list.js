'use strict';

(function exposeWindowsPrinterList(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WindowsPrinterList = api;
})(typeof globalThis === 'object' ? globalThis : this, () => {
  function comparePrinterNames(left, right) {
    return String(left || '').localeCompare(String(right || ''), undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  }

  function sortPrinterNames(names) {
    return [...names].sort(comparePrinterNames);
  }

  function defaultPrinterDisplayLabel(defaultQueueName) {
    const name = String(defaultQueueName || '').trim();
    if (!name) return '';
    return `Default (currently ${name})`;
  }

  function resolveWindowsPrinterQueueName(displayName) {
    const text = String(displayName || '').trim();
    const match = text.match(/^Default \(currently (.+)\)$/);
    return match ? match[1].trim() : text;
  }

  /** Installed queues plus BarTender-style Default row, sorted like the native wizard. */
  function buildBarTenderPrinterList(installedNames, defaultQueueName) {
    const sorted = sortPrinterNames(
      [...new Set((installedNames || []).map((name) => String(name || '').trim()).filter(Boolean))],
    );
    const label = defaultPrinterDisplayLabel(defaultQueueName);
    if (!label || !defaultQueueName || !sorted.includes(defaultQueueName)) return sorted;
    if (sorted.includes(label)) return sorted;
    return sortPrinterNames([...sorted, label]);
  }

  function normalizeWindowsPrinterNames(stdout) {
    return sortPrinterNames(
      String(stdout || '')
        .split(/\r?\n/)
        .map((name) => name.trim())
        .filter(Boolean),
    );
  }

  function fillPrinterSelect(select, displayNames, selectedValue) {
    if (!select) return '';
    let names = Array.isArray(displayNames) ? displayNames.slice() : [];
    const selected = String(selectedValue || '').trim();
    if (selected && !names.includes(selected)) names = sortPrinterNames([...names, selected]);
    const doc = select.ownerDocument || select.document;
    select.replaceChildren(
      ...names.map((name) => {
        const option = doc.createElement('option');
        option.value = name;
        option.textContent = name;
        return option;
      }),
    );
    const value = selected && names.includes(selected) ? selected : names[0] || '';
    if (value) select.value = value;
    return select.value;
  }

  return {
    comparePrinterNames,
    sortPrinterNames,
    defaultPrinterDisplayLabel,
    resolveWindowsPrinterQueueName,
    buildBarTenderPrinterList,
    normalizeWindowsPrinterNames,
    fillPrinterSelect,
  };
});
