/**
 * Decode the HTML entity `&amp;` to `&`.
 * Google Calendar HTML-encodes ampersands in description text; all AFL
 * extractors need a decoded string to reliably match URLs and directives.
 * Idempotent — calling it on already-decoded text is a no-op.
 */
export function decodeAmp(text) {
  return text.replace(/&amp;/g, "&");
}
