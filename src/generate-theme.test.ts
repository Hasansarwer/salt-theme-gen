import { describe, it, expect } from "vitest";
import { generateTheme } from "./generate-theme";
import { contrastRatio, hexToOklch } from "./color-math";
import { SPACING_PRESETS } from "./presets/spacing-presets";
import { RADIUS_PRESETS } from "./presets/radius-presets";
import { FONT_SIZE_PRESETS } from "./presets/font-size-presets";
import { NATURE_PRESETS } from "./presets/nature-presets";
import { expectValidHex } from "./test-helpers";
import type { ThemePreset } from "./types";

const presetNames = Object.keys(NATURE_PRESETS) as ThemePreset[];

// ─── defaults ───────────────────────────────────────────────────────

describe("generateTheme - defaults", () => {
  const theme = generateTheme();

  it("returns { light, dark } when called with no arguments", () => {
    expect(theme).toHaveProperty("light");
    expect(theme).toHaveProperty("dark");
  });

  it("light.mode === 'light' and dark.mode === 'dark'", () => {
    expect(theme.light.mode).toBe("light");
    expect(theme.dark.mode).toBe("dark");
  });

  it("default fontLevel is 16", () => {
    expect(theme.light.fontLevel).toBe(16);
    expect(theme.dark.fontLevel).toBe(16);
  });

  it("default spacing matches SPACING_PRESETS.default", () => {
    expect(theme.light.spacing).toEqual(SPACING_PRESETS.default);
  });

  it("default radius matches RADIUS_PRESETS.default", () => {
    expect(theme.light.radius).toEqual(RADIUS_PRESETS.default);
  });

  it("default fontSizes matches FONT_SIZE_PRESETS.default", () => {
    expect(theme.light.fontSizes).toEqual(FONT_SIZE_PRESETS.default);
  });

  it("light.colors has all 21 keys", () => {
    const keys = [
      "primary", "secondary", "tertiary", "quaternary", "background", "surface", "text",
      "muted", "border", "danger", "success", "warning", "info",
      "onPrimary", "onSecondary", "onTertiary", "onQuaternary", "onDanger", "onSuccess", "onWarning", "onInfo",
    ];
    for (const key of keys) {
      expect(theme.light.colors).toHaveProperty(key);
    }
  });

  it("surfaceElevation has card, elevated, modal, popover", () => {
    const keys = ["card", "elevated", "modal", "popover"];
    for (const key of keys) {
      expect(theme.light.surfaceElevation).toHaveProperty(key);
      expect(theme.dark.surfaceElevation).toHaveProperty(key);
      expectValidHex(theme.light.surfaceElevation[key as keyof typeof theme.light.surfaceElevation]);
      expectValidHex(theme.dark.surfaceElevation[key as keyof typeof theme.dark.surfaceElevation]);
    }
  });

  it("default preset is ocean (hue=235)", () => {
    const primaryLch = hexToOklch(theme.light.colors.primary);
    // Ocean preset hue is 235
    expect(primaryLch.H).toBeCloseTo(235, 0);
  });
});

// ─── primary color input ────────────────────────────────────────────

describe("generateTheme - primary color input", () => {
  it("accepts hex string", () => {
    const theme = generateTheme({ primary: "#ff0000" });
    expectValidHex(theme.light.colors.primary);
  });

  it("accepts 3-digit hex", () => {
    const theme = generateTheme({ primary: "#f00" });
    expectValidHex(theme.light.colors.primary);
  });

  it("accepts rgb()", () => {
    const theme = generateTheme({ primary: "rgb(255, 0, 0)" });
    expectValidHex(theme.light.colors.primary);
  });

  it("accepts CSS name", () => {
    const theme = generateTheme({ primary: "teal" });
    expectValidHex(theme.light.colors.primary);
  });

  it("throws on invalid color", () => {
    expect(() => generateTheme({ primary: "notacolor" })).toThrow();
  });
});

// ─── preset input ───────────────────────────────────────────────────

describe("generateTheme - preset input", () => {
  it.each(presetNames)("preset '%s' generates a valid theme", (preset) => {
    const theme = generateTheme({ preset });
    expectValidHex(theme.light.colors.primary);
    expectValidHex(theme.dark.colors.primary);
    expect(theme.light.mode).toBe("light");
    expect(theme.dark.mode).toBe("dark");
  });

  it("unknown preset throws", () => {
    expect(() => generateTheme({ preset: "nonexistent" as ThemePreset })).toThrow("Unknown preset");
  });

  it("preset primary uses L=0.55", () => {
    const theme = generateTheme({ preset: "ocean" });
    const lch = hexToOklch(theme.light.colors.primary);
    expect(lch.L).toBeCloseTo(0.55, 1);
  });
});

// ─── secondary override ─────────────────────────────────────────────

describe("generateTheme - secondary override", () => {
  it("secondary override is used in both modes", () => {
    const theme = generateTheme({ primary: "#1e90ff", secondary: "#ff00ff" });
    expect(theme.light.colors.secondary).toBe("#ff00ff");
    expect(theme.dark.colors.secondary).toBe("#ff00ff");
  });

  it("secondary override accepts CSS name", () => {
    const theme = generateTheme({ primary: "#1e90ff", secondary: "coral" });
    expectValidHex(theme.light.colors.secondary);
  });

  it("onSecondary is derived from the overridden secondary", () => {
    const theme = generateTheme({ primary: "#1e90ff", secondary: "#ff00ff" });
    expectValidHex(theme.light.colors.onSecondary);
    // Should differ from auto-derived secondary's on-color
    const noOverride = generateTheme({ primary: "#1e90ff" });
    expect(theme.light.colors.onSecondary).not.toBe(noOverride.light.colors.onSecondary);
  });
});

// ─── scale presets ──────────────────────────────────────────────────

describe("generateTheme - scale presets", () => {
  it("spacing 'compact' uses compact values", () => {
    const theme = generateTheme({ spacing: "compact" });
    expect(theme.light.spacing).toEqual(SPACING_PRESETS.compact);
  });

  it("spacing custom object is passed through", () => {
    const custom = { none: 0, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 };
    const theme = generateTheme({ spacing: custom });
    expect(theme.light.spacing).toEqual(custom);
  });

  it("radius 'pill' uses pill values", () => {
    const theme = generateTheme({ radius: "pill" });
    expect(theme.light.radius).toEqual(RADIUS_PRESETS.pill);
  });

  it("fontSize 'editorial' uses editorial values", () => {
    const theme = generateTheme({ fontSize: "editorial" });
    expect(theme.light.fontSizes).toEqual(FONT_SIZE_PRESETS.editorial);
  });

  it("unknown scale preset throws", () => {
    expect(() => generateTheme({ spacing: "nonexistent" as any })).toThrow("Unknown scale preset");
  });
});

// ─── fontLevel ──────────────────────────────────────────────────────

describe("generateTheme - fontLevel", () => {
  it("default fontLevel is 16", () => {
    const theme = generateTheme();
    expect(theme.light.fontLevel).toBe(16);
  });

  it("respects provided fontLevel", () => {
    const theme = generateTheme({ fontLevel: 12 });
    expect(theme.light.fontLevel).toBe(12);
  });

  it("clamps below minimum to 8", () => {
    const theme = generateTheme({ fontLevel: 5 });
    expect(theme.light.fontLevel).toBe(8);
  });

  it("clamps above maximum to 18", () => {
    const theme = generateTheme({ fontLevel: 25 });
    expect(theme.light.fontLevel).toBe(18);
  });
});

// ─── output structure ───────────────────────────────────────────────

describe("generateTheme - output structure", () => {
  const theme = generateTheme();

  it("light and dark modes have identical structure", () => {
    const lightKeys = Object.keys(theme.light).sort();
    const darkKeys = Object.keys(theme.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it("states object has 8 intents with 4 states each", () => {
    const intents = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
    const stateKeys = ["hover", "pressed", "focused", "disabled"];
    for (const intent of intents) {
      for (const state of stateKeys) {
        expect(theme.light.states[intent as keyof typeof theme.light.states]).toHaveProperty(state);
      }
    }
  });

  it("accessibility object has 18 entries", () => {
    expect(Object.keys(theme.light.accessibility)).toHaveLength(18);
  });

  it("all color values in output match hex format", () => {
    for (const value of Object.values(theme.light.colors)) {
      expectValidHex(value);
    }
    for (const value of Object.values(theme.dark.colors)) {
      expectValidHex(value);
    }
  });
});

// ─── harmony option ─────────────────────────────────────────────────

describe("generateTheme - harmony option", () => {
  it("complementary harmony produces valid theme", () => {
    const theme = generateTheme({ primary: "#1e90ff", harmony: "complementary" });
    for (const v of Object.values(theme.light.colors)) {
      expectValidHex(v);
    }
  });

  it("tetradic harmony produces valid theme in both modes", () => {
    const theme = generateTheme({ primary: "#ff0000", harmony: "tetradic" });
    expectValidHex(theme.light.colors.quaternary);
    expectValidHex(theme.dark.colors.quaternary);
  });

  it("harmony + quaternary override: override wins", () => {
    const theme = generateTheme({ primary: "#1e90ff", harmony: "triadic", quaternary: "#abcdef" });
    expect(theme.light.colors.quaternary).toBe("#abcdef");
    expect(theme.dark.colors.quaternary).toBe("#abcdef");
  });

  it("all harmonies pass WCAG AA for on-colors across all presets", () => {
    const harmonies = ["complementary", "triadic", "split-complementary", "tetradic", "monochromatic"] as const;
    for (const harmony of harmonies) {
      const theme = generateTheme({ primary: "#1e90ff", harmony });
      for (const mode of [theme.light, theme.dark]) {
        expect(contrastRatio(mode.colors.onQuaternary, mode.colors.quaternary)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

// ─── WCAG compliance across all presets ─────────────────────────────

describe("generateTheme - WCAG compliance", () => {
  const onColorPairs = [
    ["onPrimary", "primary"],
    ["onSecondary", "secondary"],
    ["onTertiary", "tertiary"],
    ["onQuaternary", "quaternary"],
    ["onDanger", "danger"],
    ["onSuccess", "success"],
    ["onWarning", "warning"],
    ["onInfo", "info"],
  ] as const;

  it.each(presetNames)("all on-colors meet WCAG AA for preset '%s'", (preset) => {
    const theme = generateTheme({ preset });
    for (const mode of [theme.light, theme.dark]) {
      for (const [on, bg] of onColorPairs) {
        const ratio = contrastRatio(mode.colors[on], mode.colors[bg]);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
