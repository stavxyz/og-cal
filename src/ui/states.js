/** Render the loading state (custom renderer or default pulse animation). */
export function renderLoading(container, config) {
  if (config?.renderLoading) {
    const result = config.renderLoading();
    if (typeof result === "string") {
      container.innerHTML = result;
    } else if (
      result instanceof HTMLElement ||
      result instanceof DocumentFragment
    ) {
      container.innerHTML = "";
      container.appendChild(result);
    }
    return;
  }
  container.innerHTML = `
    <div class="already-loading">
      <div class="already-loading-pulse"></div>
      <div class="already-loading-pulse"></div>
      <div class="already-loading-pulse"></div>
    </div>`;
}

/** Render the empty state when no events match (custom renderer or default). */
export function renderEmpty(container, hasPastEvents, onShowPast, config) {
  const i18n = config?.i18n || {};
  const noUpcomingEvents = i18n.noUpcomingEvents || "No upcoming events.";
  const showPastEvents = i18n.showPastEvents || "Show past events";

  if (config?.renderEmpty) {
    const result = config.renderEmpty({ hasPastEvents });
    if (typeof result === "string") {
      container.innerHTML = result;
    } else if (
      result instanceof HTMLElement ||
      result instanceof DocumentFragment
    ) {
      container.innerHTML = "";
      container.appendChild(result);
    }
    return;
  }

  const pastLink = hasPastEvents
    ? `<button class="already-empty-past-link" onclick="this.dispatchEvent(new CustomEvent('already:show-past', { bubbles: true }))">${showPastEvents}</button>`
    : "";
  container.innerHTML = `
    <div class="already-empty">
      <div class="already-empty-icon">📅</div>
      <p>${noUpcomingEvents}</p>
      ${pastLink}
    </div>`;
  if (hasPastEvents) {
    container
      .querySelector(".already-empty-past-link")
      ?.addEventListener("click", onShowPast);
  }
}

/** Render the error state with retry button (custom renderer or default). */
export function renderError(container, message, onRetry, config) {
  const i18n = config?.i18n || {};
  const couldNotLoad = i18n.couldNotLoad || "Could not load events.";
  const retry = i18n.retry || "Retry";

  if (config?.renderError) {
    const result = config.renderError({ message });
    if (typeof result === "string") {
      container.innerHTML = result;
    } else if (
      result instanceof HTMLElement ||
      result instanceof DocumentFragment
    ) {
      container.innerHTML = "";
      container.appendChild(result);
    }
    return;
  }

  container.innerHTML = `
    <div class="already-error">
      <p>${couldNotLoad}</p>
      <button class="already-error-retry">${retry}</button>
    </div>`;
  container
    .querySelector(".already-error-retry")
    ?.addEventListener("click", onRetry);
}
