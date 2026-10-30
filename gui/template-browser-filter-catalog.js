'use strict';

(() => {
  const FILTER_IMAGE_CDN = 'https://bartender-images-cdn.bartendercloud.com';
  const FILTER_CATEGORY_ORDER = ['Standards and Technology', 'Industries', 'Shapes and Orientation'];
  const REMOTE_JSON = {
    'Standards and Technology': `${FILTER_IMAGE_CDN}/Filters/Production/Standards-Technology.json`,
    Industries: `${FILTER_IMAGE_CDN}/Filters/Production/Industries.json`,
    'Shapes and Orientation': `${FILTER_IMAGE_CDN}/Filters/Production/FilterItems.json`,
  };
  const LOCAL_JSON = {
    'Standards and Technology': 'assets/template-browser/filters/standards.json',
    Industries: 'assets/template-browser/filters/industries.json',
    'Shapes and Orientation': 'assets/template-browser/filters/shapes.json',
  };

  function encodeCdnPath(relativePath) {
    return String(relativePath || '')
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  function filterCategoryIconUrl(categoryName) {
    return `${FILTER_IMAGE_CDN}/FilterIcons/${encodeURIComponent(categoryName)}.svg`;
  }

  function filterItemIconUrl(iconRelative) {
    return `${FILTER_IMAGE_CDN}/${encodeCdnPath(iconRelative)}`;
  }

  async function readJson(url) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Filter catalog request failed (${response.status})`);
    return response.json();
  }

  async function loadCategory(name) {
    try {
      return await readJson(REMOTE_JSON[name]);
    } catch {
      return readJson(LOCAL_JSON[name]);
    }
  }

  let cache = null;
  async function loadCategories() {
    if (cache) return cache;
    const entries = await Promise.all(FILTER_CATEGORY_ORDER.map(async (name) => [name, await loadCategory(name)]));
    cache = Object.fromEntries(entries);
    return cache;
  }

  window.QLabelTemplateBrowserFilters = {
    FILTER_IMAGE_CDN,
    FILTER_CATEGORY_ORDER,
    filterCategoryIconUrl,
    filterItemIconUrl,
    loadCategories,
  };
})();
