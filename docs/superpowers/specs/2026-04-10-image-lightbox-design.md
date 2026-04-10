# Image Lightbox Design Spec

## Problem

Gallery images in the detail view are too small to read on mobile, especially flyers and text-heavy images. Pinch-to-zoom works but there's no built-in way to enlarge images for readability.

## Solution

A fullscreen lightbox overlay activated by tapping a gallery image. The lightbox displays the image at maximum viewport size on a dark backdrop, with full gallery navigation (prev/next/keyboard) and multiple dismiss methods.

## Interaction Flow

1. User sees gallery image with a 🔍+ magnifying glass badge in the corner
2. User taps the image (or clicks on desktop)
3. Fullscreen lightbox overlay appears with the image filling the viewport
4. User can browse other images via prev/next arrows or keyboard
5. User dismisses via: tap image, tap backdrop, ✕ button, or Escape key
6. Gallery returns to the same image position

## Visual Elements

### Magnifying glass badge
- Always visible on the gallery image
- Positioned in a corner (opposite the counter if present)
- Semi-transparent dark background pill, white icon — matches the gallery counter style
- `cursor: zoom-in` on desktop

### Lightbox overlay
- Dark semi-transparent backdrop covering entire viewport (`position: fixed`, full width/height)
- Image displayed with `object-fit: contain`, filling available space with padding for controls
- `cursor: zoom-out` on the image (desktop)
- `z-index` above all other page content

### Close button
- ✕ in top-right corner
- White text on semi-transparent dark pill (consistent with gallery controls)

### Prev/next arrows
- Same visual style as gallery arrows (dark semi-transparent circles)
- Positioned at vertical center, left/right edges
- Only shown for multi-image galleries

### Counter
- Same style as gallery counter (bottom-right, dark pill)
- Shows current position (e.g. "2 / 4")
- Only shown for multi-image galleries

## Dismiss Methods

All four coexist:
1. **✕ close button** — explicit, accessible, always visible
2. **Tap dark backdrop** — standard lightbox convention
3. **Escape key** — expected desktop keyboard shortcut
4. **Tap the image itself** — symmetric with tap-to-open; most intuitive

## Keyboard Navigation

- **← →** — previous/next image
- **Escape** — close lightbox

## Accessibility

- `role="dialog"` + `aria-modal="true"` on the lightbox container
- `aria-label` describing the lightbox purpose
- Focus trapped within the lightbox (close button → image → prev/next)
- Focus returns to the gallery image on close

## Scope Exclusions

- No pinch-to-zoom or pan within the lightbox (future enhancement)
- No swipe gestures for mobile prev/next (future enhancement)
- No open/close animations (keep it snappy, can add later)

## Files Affected

- `src/views/detail.js` — lightbox DOM creation and event handling in `renderGallery`
- `already-cal.css` — lightbox overlay, controls, badge, and responsive styles
- Tests for lightbox behavior
