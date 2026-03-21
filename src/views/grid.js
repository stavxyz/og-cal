import { formatDateShort, formatTime, isPast } from '../util/dates.js';
import { escapeHtml } from '../util/sanitize.js';
import { setEventDetail } from '../router.js';

export function renderGridView(container, events, timezone, config) {
  config = config || {};
  const locale = config.locale;
  const i18n = config.i18n || {};
  const allDayLabel = i18n.allDay || 'All Day';

  const grid = document.createElement('div');
  grid.className = 'ogcal-grid';

  for (const event of events) {
    const card = document.createElement('div');
    card.className = 'ogcal-grid-card' + (isPast(event.start) ? ' ogcal-grid-card--past' : '');
    card.addEventListener('click', () => {
      if (config.onEventClick) {
        const result = config.onEventClick(event, 'grid');
        if (result === false) return;
      }
      setEventDetail(event.id);
    });
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (config.onEventClick) {
          const result = config.onEventClick(event, 'grid');
          if (result === false) return;
        }
        setEventDetail(event.id);
      }
    });

    const dateStr = formatDateShort(event.start, timezone, locale);
    const timeStr = event.allDay ? '' : ` · ${formatTime(event.start, timezone, locale)}`;
    // onerror hides the image container if the URL fails to load (e.g. unshared Drive files)
    const imageHtml = event.image
      ? `<div class="ogcal-grid-image"><img src="${event.image}" alt="${escapeHtml(event.title)}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
      : '';

    card.innerHTML = `
      ${imageHtml}
      <div class="ogcal-grid-body">
        <div class="ogcal-grid-title">${escapeHtml(event.title)}</div>
        <div class="ogcal-grid-meta">${dateStr}${timeStr}</div>
        ${event.location ? `<div class="ogcal-grid-location">${escapeHtml(event.location)}</div>` : ''}
      </div>
    `;

    grid.appendChild(card);
  }

  container.innerHTML = '';
  container.appendChild(grid);
}
