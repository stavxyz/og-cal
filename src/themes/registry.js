import { defineType, get, has, registerBuiltIn } from "../registry.js";
// Ensure layout registry is initialized before validating layout string references
import "../layouts/registry.js";

export const VALID_PALETTES = new Set(["light", "dark", "warm", "cool"]);
export const VALID_ORIENTATIONS = new Set(["vertical", "horizontal"]);
export const VALID_IMAGE_POSITIONS = new Set(["left", "right", "alternating"]);

const VALID_BUNDLE_KEYS = new Set([
  "layout",
  "defaults",
  "constraints",
  "overrides",
]);
const DIMENSION_KEYS = new Set(["orientation", "imagePosition", "palette"]);
const DIMENSION_VALIDATORS = {
  orientation: VALID_ORIENTATIONS,
  imagePosition: VALID_IMAGE_POSITIONS,
  palette: VALID_PALETTES,
};

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

const themeNames = [];

function validateBundle(name, bundle) {
  if (!isPlainObject(bundle)) {
    throw new Error(`Theme "${name}": bundle must be a plain object`);
  }

  for (const key of Object.keys(bundle)) {
    if (!VALID_BUNDLE_KEYS.has(key)) {
      throw new Error(`Theme "${name}": unknown key "${key}"`);
    }
  }

  if (bundle.layout !== undefined) {
    if (
      typeof bundle.layout !== "function" &&
      typeof bundle.layout !== "string"
    ) {
      throw new Error(
        `Theme "${name}": layout must be a function or string, got ${typeof bundle.layout}`,
      );
    }
    if (typeof bundle.layout === "string" && !has("layout", bundle.layout)) {
      throw new Error(
        `Theme "${name}": layout "${bundle.layout}" is not a registered layout`,
      );
    }
  }

  for (const section of ["defaults", "constraints"]) {
    if (bundle[section] !== undefined) {
      if (!isPlainObject(bundle[section])) {
        throw new Error(`Theme "${name}": ${section} must be a plain object`);
      }
      for (const [key, value] of Object.entries(bundle[section])) {
        if (!DIMENSION_KEYS.has(key)) {
          throw new Error(`Theme "${name}": unknown ${section} key "${key}"`);
        }
        if (!DIMENSION_VALIDATORS[key].has(value)) {
          throw new Error(
            `Theme "${name}": invalid ${section} value "${value}" for "${key}"`,
          );
        }
      }
    }
  }

  if (bundle.overrides !== undefined) {
    if (!isPlainObject(bundle.overrides)) {
      throw new Error(`Theme "${name}": overrides must be a plain object`);
    }
  }
}

defineType("theme", validateBundle);

const BUILT_IN_THEMES = [
  ["clean", { layout: "clean" }],
  ["hero", { layout: "hero" }],
  ["badge", { layout: "badge" }],
  ["compact", { layout: "compact", constraints: { orientation: "vertical" } }],
];

for (const [name, bundle] of BUILT_IN_THEMES) {
  registerBuiltIn("theme", name, bundle);
  themeNames.push(name);
}

export function getTheme(name) {
  return get("theme", name);
}

export function getThemeNames() {
  return [...themeNames];
}

export function addThemeName(name) {
  if (!themeNames.includes(name)) {
    themeNames.push(name);
  }
}
