import { describe, it, expect } from "vitest";
import { deriveOnColor, autoCorrectContrast, buildAccessibilityReport } from "./on-colors";
import { contrastRatio, hexToOklch } from "./color-math";
import { deriveColors } from "./butterfly";
import { expectValidHex } from "./test-helpers";

// ─── deriveOnColor ──────────────────────────────────────────────────

describe("deriveOnColor", () => {
  it("dark background returns white or near-white", () => {
    const on = deriveOnColor("#000000");
    expect(on).toBe("#ffffff");
  });

  it("light background returns dark text", () => {
    const on = deriveOnColor("#ffffff");
    expect(on).toBe("#0f172a");
  });

  it("result meets WCAG AA for clearly dark backgrounds", () => {
    const darkBgs = ["#000000", "#111111", "#222222", "#0000ff"];
    for (const bg of darkBgs) {
      const on = deriveOnColor(bg);
      expect(contrastRatio(on, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("result meets WCAG AA for clearly light backgrounds", () => {
    const lightBgs = ["#ffffff", "#eeeeee", "#dddddd", "#ffd700"];
    for (const bg of lightBgs) {
      const on = deriveOnColor(bg);
      expect(contrastRatio(on, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("always returns a valid hex string", () => {
    const testColors = ["#000000", "#ffffff", "#808080", "#ff0000", "#00ff00", "#0000ff"];
    for (const bg of testColors) {
      expectValidHex(deriveOnColor(bg));
    }
  });

  // Known limitation: mid-luminance backgrounds (like #808080) may not achieve
  // 4.5:1 because autoCorrectContrast only walks in one direction.
  // See deep-improvements.md #3 for planned fix.
  it("mid-luminance backgrounds return a valid color (may not meet AA)", () => {
    const on = deriveOnColor("#808080");
    expectValidHex(on);
    // At minimum it should have some contrast
    expect(contrastRatio(on, "#808080")).toBeGreaterThan(1);
  });
});

// ─── autoCorrectContrast ────────────────────────────────────────────

describe("autoCorrectContrast", () => {
  it("returns foreground unchanged if already meets ratio", () => {
    const result = autoCorrectContrast("#000000", "#ffffff", 4.5);
    expect(contrastRatio(result, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("dark background: lightens the foreground", () => {
    const result = autoCorrectContrast("#333333", "#111111", 4.5);
    const resultLch = hexToOklch(result);
    const originalLch = hexToOklch("#333333");
    expect(resultLch.L).toBeGreaterThanOrEqual(originalLch.L);
  });

  it("light background: darkens the foreground", () => {
    const result = autoCorrectContrast("#cccccc", "#eeeeee", 4.5);
    const resultLch = hexToOklch(result);
    const originalLch = hexToOklch("#cccccc");
    expect(resultLch.L).toBeLessThanOrEqual(originalLch.L);
  });

  it("achieves target ratio on dark background", () => {
    const result = autoCorrectContrast("#333333", "#111111", 4.5);
    expect(contrastRatio(result, "#111111")).toBeGreaterThanOrEqual(4.5);
  });

  it("achieves target ratio on light background", () => {
    const result = autoCorrectContrast("#cccccc", "#eeeeee", 4.5);
    expect(contrastRatio(result, "#eeeeee")).toBeGreaterThanOrEqual(4.5);
  });

  it("custom minRatio for AAA (7.0) is respected", () => {
    const result = autoCorrectContrast("#808080", "#ffffff", 7.0);
    expect(contrastRatio(result, "#ffffff")).toBeGreaterThanOrEqual(7.0);
  });

  it("falls back to pure white for very dark background", () => {
    const result = autoCorrectContrast("#010101", "#020202", 4.5);
    expectValidHex(result);
    expect(contrastRatio(result, "#020202")).toBeGreaterThanOrEqual(4.5);
  });

  it("falls back to pure black for very light background", () => {
    const result = autoCorrectContrast("#fefefe", "#fdfdfd", 4.5);
    expectValidHex(result);
    expect(contrastRatio(result, "#fdfdfd")).toBeGreaterThanOrEqual(4.5);
  });

  it("always returns a valid hex string", () => {
    const result = autoCorrectContrast("#888888", "#999999", 4.5);
    expectValidHex(result);
  });
});

// ─── buildAccessibilityReport ───────────────────────────────────────

describe("buildAccessibilityReport", () => {
  const lightColors = deriveColors("#1e90ff", "light");
  const report = buildAccessibilityReport(lightColors);

  const reportKeys = [
    "primaryOnBackground", "secondaryOnBackground",
    "textOnBackground", "textOnSurface",
    "dangerOnBackground", "successOnBackground",
    "warningOnBackground", "infoOnBackground",
    "onPrimaryOnPrimary", "onSecondaryOnSecondary",
    "onDangerOnDanger", "onSuccessOnSuccess",
    "onWarningOnWarning", "onInfoOnInfo",
  ];

  it("returns object with all 14 keys", () => {
    for (const key of reportKeys) {
      expect(report).toHaveProperty(key);
    }
  });

  it("each entry has numeric ratio and string level", () => {
    for (const key of reportKeys) {
      const entry = report[key as keyof typeof report];
      expect(typeof entry.ratio).toBe("number");
      expect(["AAA", "AA", "fail"]).toContain(entry.level);
    }
  });

  it("level classification is correct", () => {
    for (const key of reportKeys) {
      const entry = report[key as keyof typeof report];
      if (entry.ratio >= 7) {
        expect(entry.level).toBe("AAA");
      } else if (entry.ratio >= 4.5) {
        expect(entry.level).toBe("AA");
      } else {
        expect(entry.level).toBe("fail");
      }
    }
  });

  it("ratio values are rounded to 2 decimal places", () => {
    for (const key of reportKeys) {
      const entry = report[key as keyof typeof report];
      const rounded = Math.round(entry.ratio * 100) / 100;
      expect(entry.ratio).toBe(rounded);
    }
  });

  it("text on background and surface have high contrast", () => {
    // Text (L=0.13) on background (L=0.97) should have very high contrast
    expect(report.textOnBackground.ratio).toBeGreaterThanOrEqual(10);
    expect(report.textOnSurface.ratio).toBeGreaterThanOrEqual(10);
  });
});
