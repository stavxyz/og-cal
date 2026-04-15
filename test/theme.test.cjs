const { describe, it, before } = require("node:test");
const assert = require("node:assert");

require("./setup-dom.cjs");

let resolveTheme, applyTheme;

before(async () => {
  const mod = await import("../src/theme.js");
  resolveTheme = mod.resolveTheme;
  applyTheme = mod.applyTheme;
});

describe("resolveTheme", () => {
  it("returns defaults when theme is undefined", () => {
    const result = resolveTheme(undefined);
    assert.strictEqual(result.layout, "clean");
    assert.strictEqual(result.orientation, "vertical");
    assert.strictEqual(result.imagePosition, "left");
    assert.strictEqual(result.palette, "light");
    assert.deepStrictEqual(result.overrides, {});
  });

  it("returns defaults when theme is empty object", () => {
    const result = resolveTheme({});
    assert.strictEqual(result.layout, "clean");
    assert.strictEqual(result.palette, "light");
    assert.deepStrictEqual(result.overrides, {});
  });

  it("expands string shorthand to layout", () => {
    const result = resolveTheme("hero");
    assert.strictEqual(result.layout, "hero");
    assert.strictEqual(result.orientation, "vertical");
    assert.strictEqual(result.palette, "light");
  });

  it("parses full object", () => {
    const result = resolveTheme({
      layout: "badge",
      orientation: "horizontal",
      imagePosition: "alternating",
      palette: "dark",
    });
    assert.strictEqual(result.layout, "badge");
    assert.strictEqual(result.orientation, "horizontal");
    assert.strictEqual(result.imagePosition, "alternating");
    assert.strictEqual(result.palette, "dark");
  });

  it("separates CSS custom property overrides", () => {
    const result = resolveTheme({
      layout: "hero",
      primary: "#ff0000",
      radius: "0px",
      fontFamily: "Georgia, serif",
    });
    assert.strictEqual(result.layout, "hero");
    assert.deepStrictEqual(result.overrides, {
      primary: "#ff0000",
      radius: "0px",
      fontFamily: "Georgia, serif",
    });
  });

  it("falls back to defaults for unknown layout", () => {
    const result = resolveTheme({ layout: "nonexistent" });
    assert.strictEqual(result.layout, "clean");
  });

  it("falls back to defaults for unknown palette", () => {
    const result = resolveTheme({ palette: "neon" });
    assert.strictEqual(result.palette, "light");
  });

  it("ignores orientation for compact layout", () => {
    const result = resolveTheme({
      layout: "compact",
      orientation: "horizontal",
    });
    assert.strictEqual(result.orientation, "vertical");
  });

  it("ignores imagePosition when orientation is vertical", () => {
    const result = resolveTheme({
      orientation: "vertical",
      imagePosition: "right",
    });
    assert.strictEqual(result.imagePosition, "left");
  });
});

describe("applyTheme", () => {
  function makeEl() {
    return document.createElement("div");
  }

  it("sets data-layout attribute on element", () => {
    const el = makeEl();
    applyTheme(el, { layout: "hero" }, []);
    assert.strictEqual(el.dataset.layout, "hero");
  });

  it("sets data-palette attribute on element", () => {
    const el = makeEl();
    applyTheme(el, { palette: "dark" }, []);
    assert.strictEqual(el.dataset.palette, "dark");
  });

  it("sets data-orientation attribute on element", () => {
    const el = makeEl();
    applyTheme(el, { orientation: "horizontal" }, []);
    assert.strictEqual(el.dataset.orientation, "horizontal");
  });

  it("sets data-imagePosition attribute on element", () => {
    const el = makeEl();
    applyTheme(el, { orientation: "horizontal", imagePosition: "right" }, []);
    assert.strictEqual(el.dataset.imagePosition, "right");
  });

  it("applies CSS custom property overrides", () => {
    const el = makeEl();
    applyTheme(el, { primary: "#ff0000", radius: "4px" }, []);
    assert.strictEqual(
      el.style.getPropertyValue("--already-primary"),
      "#ff0000",
    );
    assert.strictEqual(el.style.getPropertyValue("--already-radius"), "4px");
  });

  it("clears previous CSS overrides not in new config", () => {
    const el = makeEl();
    const result1 = applyTheme(el, { primary: "#ff0000" }, []);
    assert.strictEqual(
      el.style.getPropertyValue("--already-primary"),
      "#ff0000",
    );
    applyTheme(el, {}, result1.overrideKeys);
    assert.strictEqual(el.style.getPropertyValue("--already-primary"), "");
  });

  it("returns resolved theme object and overrideKeys array", () => {
    const el = makeEl();
    const result = applyTheme(el, { layout: "badge", primary: "#aabbcc" }, []);
    assert.strictEqual(result.layout, "badge");
    assert.ok(Array.isArray(result.overrideKeys));
    assert.ok(result.overrideKeys.includes("--already-primary"));
  });

  it("accepts string shorthand", () => {
    const el = makeEl();
    applyTheme(el, "hero", []);
    assert.strictEqual(el.dataset.layout, "hero");
  });
});
