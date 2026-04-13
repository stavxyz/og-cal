// test/ui/sticky.test.js
require('../setup-dom.js');
const { describe, it, before } = require('node:test');
const assert = require('node:assert');

let resolveSticky;

before(async () => {
  const mod = await import('../../src/ui/sticky.js');
  resolveSticky = mod.resolveSticky;
});

describe('resolveSticky', () => {
  it('returns all true when config is true', () => {
    const result = resolveSticky(true);
    assert.deepStrictEqual(result, { header: true, viewSelector: true, tagFilter: true });
  });

  it('returns all true when config is undefined', () => {
    const result = resolveSticky(undefined);
    assert.deepStrictEqual(result, { header: true, viewSelector: true, tagFilter: true });
  });

  it('returns all false when config is false', () => {
    const result = resolveSticky(false);
    assert.deepStrictEqual(result, { header: false, viewSelector: false, tagFilter: false });
  });

  it('accepts granular object', () => {
    const result = resolveSticky({ header: false, viewSelector: true, tagFilter: true });
    assert.deepStrictEqual(result, { header: false, viewSelector: true, tagFilter: true });
  });

  it('defaults missing keys to true in granular object', () => {
    const result = resolveSticky({ header: false });
    assert.deepStrictEqual(result, { header: false, viewSelector: true, tagFilter: true });
  });

  it('returns all true for non-boolean, non-object values', () => {
    const result = resolveSticky('yes');
    assert.deepStrictEqual(result, { header: true, viewSelector: true, tagFilter: true });
  });
});
