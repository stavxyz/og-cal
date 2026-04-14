// src/ui/sticky.js

const ALL_ON = { header: true, viewSelector: true, tagFilter: true };
const ALL_OFF = { header: false, viewSelector: false, tagFilter: false };

/** Resolve a sticky config value (boolean or object) into a normalized { header, viewSelector, tagFilter } object. */
export function resolveSticky(value) {
  if (value === false) return { ...ALL_OFF };
  if (value === true || value === undefined || value === null || typeof value !== 'object') {
    return { ...ALL_ON };
  }
  return {
    header: value.header !== false,
    viewSelector: value.viewSelector !== false,
    tagFilter: value.tagFilter !== false,
  };
}

/** Apply or remove the already-sticky CSS class on header, selector, and tag filter containers. */
export function applyStickyClasses(stickyConfig, headerContainer, selectorContainer, tagFilterContainer) {
  const containers = [
    [stickyConfig.header, headerContainer],
    [stickyConfig.viewSelector, selectorContainer],
    [stickyConfig.tagFilter, tagFilterContainer],
  ];
  for (const [enabled, container] of containers) {
    container.classList.toggle('already-sticky', enabled);
  }
}

/** Recalculate top offsets for sticky-positioned elements so they stack correctly. */
export function updateStickyOffsets(stickyConfig, headerContainer, selectorContainer, tagFilterContainer) {
  let offset = 0;

  if (stickyConfig.header && headerContainer.classList.contains('already-sticky')) {
    headerContainer.style.top = offset + 'px';
    offset += headerContainer.offsetHeight;
  }

  if (stickyConfig.viewSelector && selectorContainer.classList.contains('already-sticky')) {
    selectorContainer.style.top = offset + 'px';
    offset += selectorContainer.offsetHeight;
  }

  if (stickyConfig.tagFilter && tagFilterContainer.classList.contains('already-sticky')) {
    tagFilterContainer.style.top = offset + 'px';
  }
}
