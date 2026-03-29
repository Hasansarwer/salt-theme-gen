import { describe, it, expect } from "vitest";
import { FONT_SIZE_PRESETS } from "./font-size-presets";
import type { FontSizePreset } from "../types";

describe("FONT_SIZE_PRESETS", () => {
  const presetNames = Object.keys(FONT_SIZE_PRESETS) as FontSizePreset[];
  const keys = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"] as const;

  it("has 4 entries: small, default, large, editorial", () => {
    expect(presetNames).toHaveLength(4);
    expect(presetNames).toContain("small");
    expect(presetNames).toContain("default");
    expect(presetNames).toContain("large");
    expect(presetNames).toContain("editorial");
  });

  it("values increase monotonically within each preset", () => {
    for (const name of presetNames) {
      const scale = FONT_SIZE_PRESETS[name];
      const values = keys.map((k) => scale[k]);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    }
  });

  it("small xs <= default xs <= large xs", () => {
    expect(FONT_SIZE_PRESETS.small.xs).toBeLessThanOrEqual(FONT_SIZE_PRESETS.default.xs);
    expect(FONT_SIZE_PRESETS.default.xs).toBeLessThanOrEqual(FONT_SIZE_PRESETS.large.xs);
  });

  it("all values are positive integers", () => {
    for (const name of presetNames) {
      const values = Object.values(FONT_SIZE_PRESETS[name]);
      for (const v of values) {
        expect(v).toBeGreaterThan(0);
        expect(Number.isInteger(v)).toBe(true);
      }
    }
  });
});
