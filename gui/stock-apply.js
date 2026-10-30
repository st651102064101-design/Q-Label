'use strict';
(function (root) {
  function stockVisualCornerRadiusMm(stock) {
    if (!stock || stock.shape === 1) return 0;
    const max = Math.min(Number(stock.width_mm) / 2, Number(stock.height_mm) / 2);
    if (!(max > 0)) return 0;
    if (Number(stock.corners_or_hole) === 1 && Number(stock.border_or_diameter_mm) > 0) {
      return Math.min(max, Number(stock.border_or_diameter_mm));
    }
    if (Number(stock.placeholder_or_border_mm) > 0) {
      return Math.min(max, Number(stock.placeholder_or_border_mm));
    }
    // BarTender roll wizard preview uses ~1/8" corner arcs on die-cut rectangles
    // (calibrated against ADES AG 040312fo vs the prior 16% heuristic).
    if (stock.shape === 0 && String(stock.printer_type || 'Roll') === 'Roll') {
      const shortSide = Math.min(stock.width_mm, stock.height_mm);
      return Math.min(max, shortSide * 0.08, 3.175);
    }
    if (stock.shape === 0 && (String(stock.printer_type) === 'Card' || String(stock.printer_type) === 'Page')) {
      const shortSide = Math.min(stock.width_mm, stock.height_mm);
      return Math.min(max, shortSide * 0.08, 3.175);
    }
    return 0;
  }

  function resolveLabelShapeFromStock(stock) {
    if (!stock) return { label_shape: 'rectangle', corner_radius_mm: 0 };
    if (stock.shape === 1) return { label_shape: 'ellipse', corner_radius_mm: 0 };
    const corner_radius_mm = stockVisualCornerRadiusMm(stock);
    if (corner_radius_mm > 0) return { label_shape: 'rounded', corner_radius_mm };
    return { label_shape: 'rectangle', corner_radius_mm: 0 };
  }

  function applyCatalogStockToTemplate(template, stock) {
    if (!template || !stock) return template;
    const page = template.page || (template.page = { enabled: true, manual_template: false });
    page.enabled = true;
    page.manual_template = true;
    if (Number.isFinite(Number(stock.paper_width_mm))) page.width_mm = Number(stock.paper_width_mm);
    if (Number.isFinite(Number(stock.paper_height_mm))) page.height_mm = Number(stock.paper_height_mm);
    if (Number.isFinite(Number(stock.rows))) page.rows = Math.max(1, Number(stock.rows));
    if (Number.isFinite(Number(stock.columns))) page.columns = Math.max(1, Number(stock.columns));
    if (Number.isFinite(Number(stock.margin_left_mm))) page.left_mm = Number(stock.margin_left_mm);
    if (Number.isFinite(Number(stock.margin_right_mm))) page.right_mm = Number(stock.margin_right_mm);
    if (Number.isFinite(Number(stock.margin_top_mm))) page.top_mm = Number(stock.margin_top_mm);
    if (Number.isFinite(Number(stock.margin_bottom_mm))) page.bottom_mm = Number(stock.margin_bottom_mm);
    if (Number.isFinite(Number(stock.gap_x_mm))) page.gap_x_mm = Number(stock.gap_x_mm);
    if (Number.isFinite(Number(stock.gap_y_mm))) page.gap_y_mm = Number(stock.gap_y_mm);
    if (Number.isFinite(Number(stock.width_mm))) template.width_mm = Number(stock.width_mm);
    if (Number.isFinite(Number(stock.height_mm))) template.height_mm = Number(stock.height_mm);
    Object.assign(template, resolveLabelShapeFromStock(stock));
    template.stock = {
      ...(template.stock || {}),
      name: stock.name,
      manufacturer: stock.manufacturer,
      type: 'die-cut',
      liner_left_mm: Math.max(0, Number(stock.liner_left_mm) || 0),
      liner_right_mm: Math.max(0, Number(stock.liner_right_mm) || 0),
      printer_type: stock.printer_type || 'Roll',
      shape_code: stock.shape,
      corners_or_hole: stock.corners_or_hole,
      border_or_diameter_mm: stock.border_or_diameter_mm,
      paper_width_mm: page.width_mm,
      paper_height_mm: page.height_mm,
      rows: page.rows,
      columns: page.columns,
      margin_left_mm: page.left_mm,
      margin_top_mm: page.top_mm,
      margin_right_mm: page.right_mm,
      margin_bottom_mm: page.bottom_mm,
      gap_x_mm: page.gap_x_mm,
      gap_y_mm: page.gap_y_mm,
      width_mm: template.width_mm,
      height_mm: template.height_mm,
      shape: stock.shape,
    };
    template.media_tracking = 'Y';
    if (Number(stock.orientation) === 1) {
      const w = template.width_mm;
      template.width_mm = template.height_mm;
      template.height_mm = w;
    }
    return template;
  }

  function catalogStockFromTemplate(template) {
    const stock = template?.stock || {};
    const page = template?.page || {};
    if (!(Number(stock.paper_width_mm) > 0 && Number(stock.paper_height_mm) > 0)) return null;
    return {
      manufacturer: stock.manufacturer,
      name: stock.name,
      printer_type: stock.printer_type || 'Roll',
      paper_width_mm: Number(stock.paper_width_mm),
      paper_height_mm: Number(stock.paper_height_mm),
      width_mm: Number(stock.width_mm ?? template.width_mm),
      height_mm: Number(stock.height_mm ?? template.height_mm),
      rows: Number(stock.rows ?? page.rows ?? 1),
      columns: Number(stock.columns ?? page.columns ?? 1),
      margin_left_mm: Number(stock.margin_left_mm ?? page.left_mm ?? 0),
      margin_top_mm: Number(stock.margin_top_mm ?? page.top_mm ?? 0),
      margin_right_mm: Number(stock.margin_right_mm ?? page.right_mm ?? 0),
      margin_bottom_mm: Number(stock.margin_bottom_mm ?? page.bottom_mm ?? 0),
      gap_x_mm: Number(stock.gap_x_mm ?? page.gap_x_mm ?? 0),
      gap_y_mm: Number(stock.gap_y_mm ?? page.gap_y_mm ?? 0),
      shape: Number.isFinite(Number(stock.shape_code)) ? Number(stock.shape_code) : 0,
      corners_or_hole: Number(stock.corners_or_hole) || 0,
      border_or_diameter_mm: Number(stock.border_or_diameter_mm ?? template.corner_radius_mm) || 0,
      liner_left_mm: Number(stock.liner_left_mm) || 0,
      liner_right_mm: Number(stock.liner_right_mm) || 0,
      orientation: 0,
    };
  }

  root.StockApply = Object.freeze({
    applyCatalogStockToTemplate,
    catalogStockFromTemplate,
    stockVisualCornerRadiusMm,
    resolveLabelShapeFromStock,
  });
})(typeof window === 'undefined' ? globalThis : window);
