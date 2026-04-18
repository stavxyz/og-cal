# Already Format Language (AFL) & Comments — Design Spec

## Goal

Name the description format that already-cal understands ("Already Format Language" / AFL), add comment support (`// ` line syntax), and document AFL as a cohesive format.

## Background

already-cal processes event descriptions through a rich pipeline: directive extraction, image/link/attachment URL extraction, format detection (HTML/markdown/plain text), and sanitization. This pipeline has no name — it's described piecemeal across multiple doc files. Issue #38 asks us to name it, add comment support, and document it.

## What is AFL

AFL (Already Format Language) is the name for the description format already-cal understands. It's a superset that combines:

- **Base format**: plain text, HTML, or markdown (auto-detected)
- **Directives**: `#already:` tokens for platform links, images, tags, flags
- **URL extraction**: image URLs, platform URLs, file attachment URLs — automatically detected and surfaced
- **Comments**: `// ` prefixed lines, stripped before rendering

AFL isn't a new parser or file format — it's a name for what already-cal already does, plus comments. The purpose is to give it an identity so it can be documented and referenced as a cohesive thing.

## Comment Syntax

### Rules

- `// ` at the start of a line (optional leading whitespace), followed by a space, then anything
- Comment lines are fully stripped — never rendered to visitors
- Consecutive `// ` lines form multi-line comments

### Examples

```
// This is a comment — stripped entirely, never rendered
// #already:instagram:foo — directive is disabled
//not a comment (no space after //)
Visit us at https://example.com // this is NOT a comment (mid-line)

// reminder: confirm venue before publishing
// TODO: add flyer image once designed
Join us for the annual fundraiser!
#already:tag:fundraiser
```

### Regex

```
/^[ \t]*\/\/ .*/gm
```

Multiline flag. Matches lines starting with optional whitespace (`[ \t]*`), then `// ` (two slashes followed by a space), then any content (`.*`).

### Edge cases

- `&amp;` is decoded to `&` before matching, consistent with all other extractors
- `// ` with nothing after the space (bare comment prefix) is a valid comment — stripped
- Comment lines are fully removed including the trailing newline, so they don't leave blank lines in rendered output
- `https://example.com` — the `://` in URLs is never line-leading, so no false positives
- `//foo` (no space) is NOT a comment — the space after `//` is required

## Implementation

### New file: `src/util/comments.js`

Exports a single function:

```js
export function stripComments(description) { ... }
```

Takes a description string, returns the string with all comment lines removed.

### Extraction order change in `enrichEvent()` (`src/data.js`)

Comments are stripped as the very first step, before all other extraction:

1. **Comments** — `// ` lines removed (NEW)
2. Directives — `#already:` tokens extracted
3. Images — image URLs extracted
4. Links — platform URLs extracted
5. Attachments — file URLs extracted
6. Format detection — HTML/markdown/plain text

This order means `// #already:instagram:foo` works as expected — the entire line is removed before directive extraction runs, so the directive is never processed.

### Tests: `test/comments.test.cjs`

Test cases:
- Basic comment stripping (`// hello` → removed)
- Leading whitespace (`  // hello` → removed)
- No space after slashes (`//hello` → preserved)
- Mid-line slashes (`text // more text` → preserved)
- URL preservation (`https://example.com` → preserved)
- Commented-out directive (`// #already:tag:foo` → removed, directive not processed)
- Multiple consecutive comments
- Mixed comments and content
- Empty comment (`// ` with trailing space only)
- `&amp;` decoding before matching
- Blank line cleanup (no orphaned blank lines after stripping)

## Documentation

### New file: `docs/afl.md`

The single reference for the AFL format. Structure:

1. **What is AFL** — one-paragraph intro
2. **Base formats** — plain text, HTML, markdown auto-detection rules
3. **Comments** — `// ` syntax, examples, use cases (internal notes + commenting out content)
4. **Directives** — brief summary with link to `docs/directives.md`
5. **URL extraction** — summary of automatic image/link/attachment detection with link to `docs/event-schema.md`
6. **Processing order** — the full pipeline diagram

### Updates to existing docs

- **README.md** — Add "AFL" mention in the description rendering / directives area. Add `docs/afl.md` to the Documentation table.
- **`docs/architecture.md`** — Update the Data Pipeline section to show comments as the first extraction step. Reference AFL by name.
- **`docs/event-schema.md`** — The Description Rendering section links to `docs/afl.md` instead of duplicating format detection details.

- **`docs/development.md`** — Add `comments.js` to the `src/util/` file tree.

### No changes needed

- `docs/directives.md` — stays as-is (comprehensive, referenced from `afl.md`)
- `docs/configuration.md` — no AFL-specific config options
- `CONTRIBUTING.md` — no changes needed
