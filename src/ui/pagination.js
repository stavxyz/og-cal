// src/ui/pagination.js
import { isPast } from '../util/dates.js';

/** Slice events into a paginated window, splitting past and future when showPast is true. */
export function paginateEvents(events, showPast, pageSize, paginationState) {
  if (!events || events.length === 0) {
    return { visible: [], hasMoreFuture: false, hasMorePast: false, remainingFuture: 0, remainingPast: 0 };
  }

  if (!showPast) {
    const limit = pageSize + paginationState.futureCount;
    const visible = events.slice(0, limit);
    const remainingFuture = Math.max(0, events.length - limit);
    return {
      visible,
      hasMoreFuture: remainingFuture > 0,
      hasMorePast: false,
      remainingFuture,
      remainingPast: 0,
    };
  }

  // showPast is true — split into past and future using shared isPast logic
  const past = [];
  const future = [];
  for (const event of events) {
    if (isPast(event.end || event.start)) {
      past.push(event);
    } else {
      future.push(event);
    }
  }

  // Past events: reverse chronological (most recent past first)
  const pastReversed = [...past].reverse();
  const pastLimit = pageSize + paginationState.pastCount;
  const visiblePast = pastReversed.slice(0, pastLimit);
  const remainingPast = Math.max(0, pastReversed.length - pastLimit);

  // Future events: chronological (soonest first)
  const futureLimit = pageSize + paginationState.futureCount;
  const visibleFuture = future.slice(0, futureLimit);
  const remainingFuture = Math.max(0, future.length - futureLimit);

  // Combine: past (re-reversed to chronological for display) + future
  const visiblePastChronological = [...visiblePast].reverse();
  const visible = [...visiblePastChronological, ...visibleFuture];

  return {
    visible,
    hasMoreFuture: remainingFuture > 0,
    hasMorePast: remainingPast > 0,
    remainingFuture,
    remainingPast,
  };
}

/**
 * Renders "Show earlier" and "Load more" buttons into the given containers.
 * Click behavior is provided via callbacks so this stays decoupled from app state.
 */
export function renderPaginationButtons(topContainer, bottomContainer, paginated, i18n, callbacks) {
  topContainer.innerHTML = '';
  bottomContainer.innerHTML = '';

  if (paginated.hasMorePast) {
    const btn = document.createElement('button');
    btn.className = 'already-show-earlier';
    btn.textContent = `${i18n.showEarlier || 'Show earlier'} (${paginated.remainingPast} remaining)`;
    btn.addEventListener('click', callbacks.onShowEarlier);
    topContainer.appendChild(btn);
  }

  if (paginated.hasMoreFuture) {
    const btn = document.createElement('button');
    btn.className = 'already-load-more';
    btn.textContent = `${i18n.loadMore || 'Load more'} (${paginated.remainingFuture} remaining)`;
    btn.addEventListener('click', callbacks.onLoadMore);
    bottomContainer.appendChild(btn);
  }
}
