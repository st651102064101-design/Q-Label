'use strict';
(function (root) {
  /** BarTender shows CR50 as CR-50 in the wizard; catalog keys stay canonical (mfg.stk). */
  function formatStockDisplayName(name) {
    const s = String(name || '');
    const cr = s.match(/^CR(\d+)$/i);
    if (cr) return `CR-${cr[1]}`;
    return s;
  }

  function isZebraFamilyPrinter(printerName) {
    const n = String(printerName || '').toLowerCase();
    return /zdesigner|zebra|\bzt\d|\bzd\d/.test(n);
  }

  function pickManufacturer(manufacturers, preferred) {
    for (const name of preferred) {
      if (manufacturers.includes(name)) return name;
    }
    return manufacturers[0] || '';
  }

  /**
   * Predefined stocks are the full BarTender mfg.stk catalog for every printer
   * (AnyDesk, PDF, Zebra, …). The driver is not the stock list source; only the
   * default Category row differs slightly by printer family.
   */
  function defaultStockCategoryForPrinter(printerName, catalog) {
    const manufacturers = catalog?.getManufacturers?.() || [];
    if (isZebraFamilyPrinter(printerName)) {
      return pickManufacturer(manufacturers, ['Standard Card Sizes', 'Zebra Technologies Inc.']);
    }
    return pickManufacturer(manufacturers, ['AOne', 'Avery Standard', 'Avery International']);
  }

  /** Keep catalog order (BarTender category dropdown is the full manufacturer list). */
  function sortManufacturersForPrinter(manufacturers, _printerName) {
    return manufacturers.slice();
  }

  root.StockCatalogUi = Object.freeze({
    formatStockDisplayName,
    defaultStockCategoryForPrinter,
    sortManufacturersForPrinter,
    isZebraFamilyPrinter,
  });
})(typeof window === 'undefined' ? globalThis : window);
