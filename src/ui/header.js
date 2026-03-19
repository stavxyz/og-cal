import { escapeHtml } from '../util/sanitize.js';

export function renderHeader(container, calendarData, config) {
  if (!config.showHeader) {
    container.innerHTML = '';
    return;
  }

  const name = calendarData?.name || '';
  const description = calendarData?.description || '';
  if (!name && !description) {
    container.innerHTML = '';
    return;
  }

  const i18n = config.i18n || {};
  const subscribeLabel = i18n.subscribe || 'Subscribe';

  // Build subscribe URL: explicit config, or auto-generate from Google Calendar ID
  let subscribeUrl = config.subscribeUrl || null;
  if (!subscribeUrl && config.google?.calendarId) {
    const cid = btoa(config.google.calendarId).replace(/=+$/, '');
    subscribeUrl = `https://calendar.google.com/calendar/u/0?cid=${cid}`;
  }
  // For pre-loaded data, try to build from calendarId in the data
  if (!subscribeUrl && calendarData?.calendarId) {
    const cid = btoa(calendarData.calendarId).replace(/=+$/, '');
    subscribeUrl = `https://calendar.google.com/calendar/u/0?cid=${cid}`;
  }

  const header = document.createElement('div');
  header.className = 'ogcal-header';

  const textCol = document.createElement('div');
  textCol.className = 'ogcal-header-text';

  if (name) {
    const h = document.createElement('h2');
    h.className = 'ogcal-header-name';
    h.textContent = name;
    textCol.appendChild(h);
  }

  if (description) {
    const p = document.createElement('p');
    p.className = 'ogcal-header-description';
    p.textContent = description;
    textCol.appendChild(p);
  }

  header.appendChild(textCol);

  if (subscribeUrl) {
    const btn = document.createElement('a');
    btn.className = 'ogcal-header-subscribe';
    btn.href = subscribeUrl;
    btn.target = '_blank';
    btn.rel = 'noopener';
    // Calendar icon SVG + label
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 1v2M11 1v2M2 6h12M3 3h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8v4M6 10h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> ${escapeHtml(subscribeLabel)}`;
    header.appendChild(btn);
  }

  container.innerHTML = '';
  container.appendChild(header);
}
