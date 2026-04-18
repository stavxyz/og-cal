const { describe, it, before } = require("node:test");
const assert = require("node:assert");

let decodeAmp;

before(async () => {
  const mod = await import("../src/util/html-entities.js");
  decodeAmp = mod.decodeAmp;
});

describe("decodeAmp", () => {
  it("decodes &amp; to &", () => {
    assert.strictEqual(decodeAmp("a &amp; b"), "a & b");
  });

  it("decodes multiple occurrences", () => {
    assert.strictEqual(decodeAmp("&amp;&amp;&amp;"), "&&&");
  });

  it("is idempotent on already-decoded text", () => {
    assert.strictEqual(decodeAmp("a & b"), "a & b");
  });

  it("leaves other entities alone", () => {
    assert.strictEqual(decodeAmp("&lt;tag&gt;"), "&lt;tag&gt;");
  });

  it("passes through empty string", () => {
    assert.strictEqual(decodeAmp(""), "");
  });
});
