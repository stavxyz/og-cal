# Image Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fullscreen lightbox overlay to the gallery so users can tap images to view them at full screen size, with gallery navigation and multiple dismiss methods.

**Architecture:** The lightbox is a fixed-position overlay appended to `document.body` (not nested inside the gallery) so it can fill the entire viewport. The gallery's `renderGallery` function is extended to add a magnifying glass badge and a click handler that opens the lightbox. The lightbox manages its own image state, prev/next navigation, keyboard handling, and dismiss behavior. All styles go in `already-cal.css`.

**Tech Stack:** Vanilla JS (DOM API), CSS, node:test + jsdom for testing.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/views/lightbox.js` | Create | Lightbox DOM creation, open/close, navigation, keyboard/focus management |
| `src/views/detail.js` | Modify | Add magnifying glass badge to gallery, wire click → open lightbox |
| `already-cal.css` | Modify | Lightbox overlay, controls, badge, responsive styles |
| `test/views/lightbox.test.js` | Create | Lightbox unit tests |
| `test/views/detail.test.js` | Modify | Test badge presence and click-to-open |

---

### Task 1: Lightbox module — DOM structure and open/close

**Files:**
- Create: `test/views/lightbox.test.js`
- Create: `src/views/lightbox.js`

- [ ] **Step 1: Write failing tests for lightbox creation and open/close**

```js
// test/views/lightbox.test.js
require('../setup-dom.js');
const { describe, it, before, afterEach } = require('node:test');
const assert = require('node:assert');

let openLightbox;

before(async () => {
  const mod = await import('../../src/views/lightbox.js');
  openLightbox = mod.openLightbox;
});

afterEach(() => {
  document.querySelector('.already-lightbox')?.remove();
});

describe('openLightbox', () => {
  it('creates a lightbox overlay on document.body', () => {
    openLightbox(['https://a.com/1.jpg'], 0, 'Alt text');
    const overlay = document.querySelector('.already-lightbox');
    assert.ok(overlay);
    assert.strictEqual(overlay.getAttribute('role'), 'dialog');
    assert.strictEqual(overlay.getAttribute('aria-modal'), 'true');
  });

  it('displays the image at the given start index', () => {
    openLightbox(['https://a.com/1.jpg', 'https://a.com/2.jpg'], 1, 'Alt');
    const img = document.querySelector('.already-lightbox-img');
    assert.strictEqual(img.src, 'https://a.com/2.jpg');
  });

  it('has a close button', () => {
    openLightbox(['https://a.com/1.jpg'], 0, 'Alt');
    const closeBtn = document.querySelector('.already-lightbox-close');
    assert.ok(closeBtn);
    assert.strictEqual(closeBtn.getAttribute('aria-label'), 'Close');
  });

  it('removes overlay when close button is clicked', () => {
    openLightbox(['https://a.com/1.jpg'], 0, 'Alt');
    document.querySelector('.already-lightbox-close').click();
    assert.strictEqual(document.querySelector('.already-lightbox'), null);
  });

  it('removes overlay when backdrop is clicked', () => {
    openLightbox(['https://a.com/1.jpg'], 0, 'Alt');
    const overlay = document.querySelector('.already-lightbox');
    overlay.click();
    assert.strictEqual(document.querySelector('.already-lightbox'), null);
  });

  it('removes overlay when image is clicked', () => {
    openLightbox(['https://a.com/1.jpg'], 0, 'Alt');
    document.querySelector('.already-lightbox-img').click();
    assert.strictEqual(document.querySelector('.already-lightbox'), null);
  });

  it('does NOT close when prev/next button is clicked', () => {
    openLightbox(['https://a.com/1.jpg', 'https://a.com/2.jpg'], 0, 'Alt');
    document.querySelector('.already-lightbox-next').click();
    assert.ok(document.querySelector('.already-lightbox'));
  });

  it('removes overlay on Escape key', () => {
    openLightbox(['https://a.com/1.jpg'], 0, 'Alt');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.strictEqual(document.querySelector('.already-lightbox'), null);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/views/lightbox.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Implement lightbox module**

```js
// src/views/lightbox.js
import { createElement } from './helpers.js';

export function openLightbox(images, startIndex, altText) {
  // Prevent duplicates
  document.querySelector('.already-lightbox')?.remove();

  let current = startIndex;

  const overlay = createElement('div', 'already-lightbox', {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Image viewer',
  });

  const img = document.createElement('img');
  img.className = 'already-lightbox-img';
  img.src = images[current];
  img.alt = altText;

  const closeBtn = createElement('button', 'already-lightbox-close', { 'aria-label': 'Close' });
  closeBtn.textContent = '\u00d7';

  function close() {
    overlay.remove();
    document.removeEventListener('keydown', onKeydown);
  }

  function goTo(idx) {
    current = (idx + images.length) % images.length;
    img.src = images[current];
    if (counterEl) counterEl.textContent = `${current + 1} / ${images.length}`;
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { close(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { goTo(current - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); e.preventDefault(); }
  }

  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  img.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  overlay.addEventListener('click', close);

  document.addEventListener('keydown', onKeydown);

  overlay.appendChild(closeBtn);
  overlay.appendChild(img);

  // Navigation (multi-image only)
  let counterEl = null;
  if (images.length > 1) {
    const prevBtn = createElement('button', 'already-lightbox-prev', { 'aria-label': 'Previous image' });
    prevBtn.textContent = '\u2039';
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); });

    const nextBtn = createElement('button', 'already-lightbox-next', { 'aria-label': 'Next image' });
    nextBtn.textContent = '\u203a';
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); });

    counterEl = createElement('div', 'already-lightbox-counter');
    counterEl.textContent = `${current + 1} / ${images.length}`;

    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
    overlay.appendChild(counterEl);
  }

  document.body.appendChild(overlay);
  closeBtn.focus();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/views/lightbox.test.js`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/lightbox.js test/views/lightbox.test.js
git commit -m "feat: add lightbox module with open/close and navigation"
```

---

### Task 2: Lightbox navigation tests

**Files:**
- Modify: `test/views/lightbox.test.js`

- [ ] **Step 1: Add navigation tests**

Append to the `describe('openLightbox', ...)` block in `test/views/lightbox.test.js`:

```js
  it('navigates to next image on next button click', () => {
    openLightbox(['https://a.com/1.jpg', 'https://a.com/2.jpg', 'https://a.com/3.jpg'], 0, 'Alt');
    document.querySelector('.already-lightbox-next').click();
    assert.strictEqual(document.querySelector('.already-lightbox-img').src, 'https://a.com/2.jpg');
    assert.strictEqual(document.querySelector('.already-lightbox-counter').textContent, '2 / 3');
  });

  it('navigates to previous image on prev button click', () => {
    openLightbox(['https://a.com/1.jpg', 'https://a.com/2.jpg'], 1, 'Alt');
    document.querySelector('.already-lightbox-prev').click();
    assert.strictEqual(document.querySelector('.already-lightbox-img').src, 'https://a.com/1.jpg');
  });

  it('wraps around from last to first image', () => {
    openLightbox(['https://a.com/1.jpg', 'https://a.com/2.jpg'], 1, 'Alt');
    document.querySelector('.already-lightbox-next').click();
    assert.strictEqual(document.querySelector('.already-lightbox-img').src, 'https://a.com/1.jpg');
  });

  it('navigates via ArrowRight key', () => {
    openLightbox(['https://a.com/1.jpg', 'https://a.com/2.jpg'], 0, 'Alt');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    assert.strictEqual(document.querySelector('.already-lightbox-img').src, 'https://a.com/2.jpg');
  });

  it('navigates via ArrowLeft key', () => {
    openLightbox(['https://a.com/1.jpg', 'https://a.com/2.jpg'], 1, 'Alt');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    assert.strictEqual(document.querySelector('.already-lightbox-img').src, 'https://a.com/1.jpg');
  });

  it('hides nav controls for single image', () => {
    openLightbox(['https://a.com/1.jpg'], 0, 'Alt');
    assert.strictEqual(document.querySelector('.already-lightbox-prev'), null);
    assert.strictEqual(document.querySelector('.already-lightbox-next'), null);
    assert.strictEqual(document.querySelector('.already-lightbox-counter'), null);
  });
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `node --test test/views/lightbox.test.js`
Expected: All 14 tests PASS (the implementation from Task 1 already handles these)

- [ ] **Step 3: Commit**

```bash
git add test/views/lightbox.test.js
git commit -m "test: add lightbox navigation and edge case tests"
```

---

### Task 3: Gallery badge and click-to-open wiring

**Files:**
- Modify: `src/views/detail.js`
- Modify: `test/views/detail.test.js`

- [ ] **Step 1: Add tests for the magnifying glass badge and lightbox trigger**

Append to the `describe('renderDetailView', ...)` block in `test/views/detail.test.js`:

```js
  it('shows magnifying glass badge on gallery image', () => {
    const container = document.createElement('div');
    const event = { ...baseEvent, image: 'https://a.com/1.jpg', images: ['https://a.com/1.jpg'] };
    renderDetailView(container, event, 'UTC', () => {}, {});
    const badge = container.querySelector('.already-detail-gallery-zoom');
    assert.ok(badge, 'zoom badge should be present');
  });

  it('opens lightbox when gallery image is clicked', () => {
    const container = document.createElement('div');
    const event = { ...baseEvent, image: 'https://a.com/1.jpg', images: ['https://a.com/1.jpg'] };
    renderDetailView(container, event, 'UTC', () => {}, {});
    container.querySelector('.already-detail-gallery-img').click();
    const lightbox = document.querySelector('.already-lightbox');
    assert.ok(lightbox, 'lightbox should open on image click');
    // Clean up
    lightbox.remove();
  });

  it('opens lightbox at correct index for multi-image gallery', () => {
    const container = document.createElement('div');
    const event = { ...baseEvent, images: ['https://a.com/1.jpg', 'https://a.com/2.jpg'], image: 'https://a.com/1.jpg' };
    renderDetailView(container, event, 'UTC', () => {}, {});
    // Navigate to second image
    container.querySelector('.already-detail-gallery-next').click();
    // Click image to open lightbox
    container.querySelector('.already-detail-gallery-img').click();
    const lightboxImg = document.querySelector('.already-lightbox-img');
    assert.strictEqual(lightboxImg.src, 'https://a.com/2.jpg');
    // Clean up
    document.querySelector('.already-lightbox').remove();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/views/detail.test.js`
Expected: FAIL — no `.already-detail-gallery-zoom` element, no lightbox opens

- [ ] **Step 3: Add badge and click handler to renderGallery in detail.js**

At the top of `src/views/detail.js`, add the import:

```js
import { openLightbox } from './lightbox.js';
```

In the `renderGallery` function, after `gallery.appendChild(imgEl);` (line 27), add the magnifying glass badge and click handler:

```js
  // Magnifying glass zoom badge
  const zoomBadge = createElement('div', 'already-detail-gallery-zoom', { 'aria-hidden': 'true' });
  zoomBadge.textContent = '\u2315';
  gallery.appendChild(zoomBadge);

  // Click image to open lightbox
  imgEl.style.cursor = 'zoom-in';
  imgEl.addEventListener('click', () => {
    openLightbox(loadedImages, current, altText);
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/views/detail.test.js`
Expected: All tests PASS (existing + 3 new)

- [ ] **Step 5: Run full test suite**

Run: `node --test test/*.test.js test/views/*.test.js`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/views/detail.js test/views/detail.test.js
git commit -m "feat: add zoom badge and click-to-open lightbox in gallery"
```

---

### Task 4: Lightbox CSS

**Files:**
- Modify: `already-cal.css`

- [ ] **Step 1: Add lightbox styles**

Append the following after the gallery counter styles (after line 767 — the `.already-detail-gallery-counter` block) in `already-cal.css`:

```css
/* Lightbox zoom badge on gallery */
.already-detail-gallery-zoom {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.875rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* Lightbox overlay */
.already-lightbox {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
}

.already-lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: zoom-out;
}

.already-lightbox-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.already-lightbox-close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.already-lightbox-prev,
.already-lightbox-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.already-lightbox-prev:hover,
.already-lightbox-next:hover {
  background: rgba(0, 0, 0, 0.7);
}

.already-lightbox-prev {
  left: 0.75rem;
}

.already-lightbox-next {
  right: 0.75rem;
}

.already-lightbox-counter {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: Verify the build works**

Run: `npm run build`
Expected: Build complete, no errors

- [ ] **Step 3: Commit**

```bash
git add already-cal.css
git commit -m "style: add lightbox overlay, controls, and zoom badge CSS"
```

---

### Task 5: Build and final verification

**Files:**
- Modify: `dist/*` (rebuilt)

- [ ] **Step 1: Run full test suite**

Run: `node --test test/*.test.js test/views/*.test.js`
Expected: All tests PASS

- [ ] **Step 2: Rebuild dist**

Run: `npm run build`
Expected: Build complete

- [ ] **Step 3: Commit dist**

```bash
git add dist/
git commit -m "build: rebuild dist with image lightbox"
```

- [ ] **Step 4: Manual verification checklist**

Open `dev.html` in a browser and verify:
- [ ] Magnifying glass badge visible in top-left corner of gallery image
- [ ] Clicking gallery image opens fullscreen lightbox
- [ ] Image fills viewport on dark backdrop
- [ ] ✕ button closes lightbox
- [ ] Clicking backdrop closes lightbox
- [ ] Clicking the zoomed image closes lightbox
- [ ] Escape key closes lightbox
- [ ] Prev/next arrows navigate multi-image galleries
- [ ] Arrow keys navigate in lightbox
- [ ] Counter shows correct position
- [ ] Single-image events: no prev/next or counter in lightbox
