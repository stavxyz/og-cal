import { defineType, get, registerBuiltIn } from "../registry.js";
import { render as badge } from "./badge/badge.js";
import { render as clean } from "./clean/clean.js";
import { render as compact } from "./compact/compact.js";
import { render as hero } from "./hero/hero.js";

defineType("layout", (name, fn) => {
  if (typeof fn !== "function") {
    throw new Error(`Layout "${name}" must be a function`);
  }
});

registerBuiltIn("layout", "clean", clean);
registerBuiltIn("layout", "hero", hero);
registerBuiltIn("layout", "badge", badge);
registerBuiltIn("layout", "compact", compact);

export function getLayout(name) {
  return get("layout", name, clean);
}
