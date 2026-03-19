import { formatDate, formatTime, isPast } from '../util/dates.js';
import { escapeHtml } from '../util/sanitize.js';
import { setEventDetail } from '../router.js';

export function renderListView(container, events, timezone, config) {
  config = config || {};
  const locale = config.locale;
  const i18n = config.i18n || {};
  const allDayLabel = i18n.allDay || 'All Day';

  const list = document.createElement('div');
  list.className = 'ogcal-list';

  for (const event of events) {
    const item = document.createElement('div');
    item.className = 'ogcal-list-item' + (isPast(event.start) ? ' ogcal-list-item--past' : '');
    item.addEventListener('click', () => {
      if (config.onEventClick) {
        const result = config.onEventClick(event, 'list');
        if (result === false) return;
      }
      setEventDetail(event.id);
    });
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (config.onEventClick) {
          const result = config.onEventClick(event, 'list');
          if (result === false) return;
        }
        setEventDetail(event.id);
      }
    });

    const dateStr = formatDate(event.start, timezone, locale);
    const timeStr = event.allDay ? allDayLabel : formatTime(event.start, timezone, locale);

    item.innerHTML = `
      <div class="ogcal-list-date">
        <div class="ogcal-list-date-day">${dateStr}</div>
        <div class="ogcal-list-date-time">${timeStr}</div>
      </div>
      <div class="ogcal-list-info">
        <div class="ogcal-list-title">${escapeHtml(event.title)}</div>
        ${event.location ? `<div class="ogcal-list-location">${escapeHtml(event.location)}</div>` : ''}
      </div>
    `;

    list.appendChild(item);
  }

  container.innerHTML = '';
  container.appendChild(list);
}
