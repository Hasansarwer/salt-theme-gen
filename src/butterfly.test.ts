import { describe, it, expect } from "vitest";
import { deriveColors } from "./butterfly";
import { hexToOklch, contrastRatio } from "./color-math";
import { expectValidHex } from "./test-helpers";

const PRIMARY = "#1e90ff"; // dodger blue

// ─── deriveColors — light mode ──────────────────────────────────────

describe("deriveColors - light mode", () => {
  const colors = deriveColors(PRIMARY, "light");

  it("returns object with all 17 SemanticColors keys", () => {
    const expectedKeys = [
      "primary", "secondary", "background", "surface", "text",
      "muted", "border", "danger", "success", "warning", "info",
      "onPrimary", "onSecondary", "onDanger", "onSuccess", "onWarning", "onInfo",
    ];
    for (const key of expectedKeys) {
      expect(colors).toHaveProperty(key);
    }
  });

  it("all 17 values are valid hex strings", () => {
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("primary has L approximately 0.55", () => {
    const lch = hexToOklch(colors.primary);
    expect(lch.L).toBeCloseTo(0.55, 1);
  });

  it("secondary hue is approximately primaryH + 60", () => {
    const primaryLch = hexToOklch(colors.primary);
    const secondaryLch = hexToOklch(colors.secondary);
    const expectedH = (primaryLch.H + 60) % 360;
    expect(secondaryLch.H).toBeCloseTo(expectedH, 0);
  });

  it("secondary chroma is approximately primaryC * 0.85", () => {
    const primaryLch = hexToOklch(PRIMARY);
    const secondaryLch = hexToOklch(colors.secondary);
    expect(secondaryLch.C).toBeCloseTo(primaryLch.C * 0.85, 1);
  });

  it("background has L approximately 0.97", () => {
    const lch = hexToOklch(colors.background);
    expect(lch.L).toBeCloseTo(0.97, 1);
  });

  it("surface is near pure white (L ~ 1.0)", () => {
    const lch = hexToOklch(colors.surface);
    expect(lch.L).toBeCloseTo(1.0, 1);
  });

  it("text has L approximately 0.13 (near black)", () => {
    const lch = hexToOklch(colors.text);
    expect(lch.L).toBeCloseTo(0.13, 1);
  });

  it("danger hue is approximately 25", () => {
    const lch = hexToOklch(colors.danger);
    expect(lch.H).toBeCloseTo(25, 0);
  });

  it("success hue is approximately 145", () => {
    const lch = hexToOklch(colors.success);
    expect(lch.H).toBeCloseTo(145, 0);
  });

  it("warning hue is approximately 80", () => {
    const lch = hexToOklch(colors.warning);
    expect(lch.H).toBeCloseTo(80, 0);
  });

  it("info hue is approximately 235", () => {
    const lch = hexToOklch(colors.info);
    expect(lch.H).toBeCloseTo(235, 0);
  });
});

// ─── deriveColors — dark mode ───────────────────────────────────────

describe("deriveColors - dark mode", () => {
  const colors = deriveColors(PRIMARY, "dark");

  it("primary has L approximately 0.72", () => {
    const lch = hexToOklch(colors.primary);
    expect(lch.L).toBeCloseTo(0.72, 1);
  });

  it("secondary has L approximately 0.74", () => {
    const lch = hexToOklch(colors.secondary);
    expect(lch.L).toBeCloseTo(0.74, 1);
  });

  it("background has L approximately 0.15 (dark)", () => {
    const lch = hexToOklch(colors.background);
    expect(lch.L).toBeCloseTo(0.15, 1);
  });

  it("surface has L approximately 0.20", () => {
    const lch = hexToOklch(colors.surface);
    expect(lch.L).toBeCloseTo(0.20, 1);
  });

  it("text has L approximately 0.97 (near white)", () => {
    const lch = hexToOklch(colors.text);
    expect(lch.L).toBeCloseTo(0.97, 1);
  });

  it("dark mode background is darker than light mode background", () => {
    const lightColors = deriveColors(PRIMARY, "light");
    const darkBgL = hexToOklch(colors.background).L;
    const lightBgL = hexToOklch(lightColors.background).L;
    expect(darkBgL).toBeLessThan(lightBgL);
  });

  it("dark mode text is lighter than light mode text", () => {
    const lightColors = deriveColors(PRIMARY, "light");
    const darkTextL = hexToOklch(colors.text).L;
    const lightTextL = hexToOklch(lightColors.text).L;
    expect(darkTextL).toBeGreaterThan(lightTextL);
  });

  it("all values are valid hex strings", () => {
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("same primary produces different outputs for light vs dark", () => {
    const lightColors = deriveColors(PRIMARY, "light");
    expect(colors.primary).not.toBe(lightColors.primary);
    expect(colors.background).not.toBe(lightColors.background);
  });
});

// ─── deriveColors — secondary override ──────────────────────────────

describe("deriveColors - secondary override", () => {
  it("secondary matches override when provided", () => {
    const colors = deriveColors(PRIMARY, "light", "#ff00ff");
    expect(colors.secondary).toBe("#ff00ff");
  });

  it("other colors are unaffected by secondary override", () => {
    const withOverride = deriveColors(PRIMARY, "light", "#ff00ff");
    const without = deriveColors(PRIMARY, "light");
    expect(withOverride.primary).toBe(without.primary);
    expect(withOverride.background).toBe(without.background);
    expect(withOverride.danger).toBe(without.danger);
  });

  it("onSecondary is derived from the overridden color", () => {
    const colors = deriveColors(PRIMARY, "light", "#ff00ff");
    // onSecondary should be a valid hex derived from the override, not the auto-secondary
    expectValidHex(colors.onSecondary);
    // Verify it's different from what we'd get without override
    const noOverride = deriveColors(PRIMARY, "light");
    expect(colors.onSecondary).not.toBe(noOverride.onSecondary);
  });

  it("works in dark mode with override", () => {
    const colors = deriveColors(PRIMARY, "dark", "#00ff00");
    expect(colors.secondary).toBe("#00ff00");
    expectValidHex(colors.onSecondary);
  });
});

// ─── deriveColors — intent colors auto-corrected on background ──────

describe("deriveColors - intent colors meet WCAG AA on background", () => {
  const intents = ["danger", "success", "warning", "info"] as const;

  it("light mode: all intent colors meet 4.5:1 against background", () => {
    const colors = deriveColors(PRIMARY, "light");
    for (const intent of intents) {
      const ratio = contrastRatio(colors[intent], colors.background);
      expect(ratio, `${intent} on background`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("dark mode: all intent colors meet 4.5:1 against background", () => {
    const colors = deriveColors(PRIMARY, "dark");
    for (const intent of intents) {
      const ratio = contrastRatio(colors[intent], colors.background);
      expect(ratio, `${intent} on background`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("achromatic primary: intent colors still meet 4.5:1", () => {
    const colors = deriveColors("#808080", "light");
    for (const intent of intents) {
      const ratio = contrastRatio(colors[intent], colors.background);
      expect(ratio, `${intent} on background`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("intent hues are preserved after auto-correction", () => {
    const colors = deriveColors(PRIMARY, "light");
    const expectedHues = { danger: 25, success: 145, warning: 80, info: 235 };
    for (const intent of intents) {
      const lch = hexToOklch(colors[intent]);
      expect(lch.H).toBeCloseTo(expectedHues[intent], 0);
    }
  });
});

// ─── deriveColors — edge cases ──────────────────────────────────────

describe("deriveColors - edge cases", () => {
  it("achromatic primary (gray) produces valid colors", () => {
    const colors = deriveColors("#808080", "light");
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("very dark primary produces valid colors", () => {
    const colors = deriveColors("#111111", "light");
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("very light primary produces valid colors", () => {
    const colors = deriveColors("#eeeeee", "light");
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("high-chroma primary produces valid colors", () => {
    const colors = deriveColors("#ff0000", "light");
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });
});
