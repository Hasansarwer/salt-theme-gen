import { describe, it, expect } from "vitest";
import { SPACING_PRESETS } from "./spacing-presets";
import type { SpacingPreset } from "../types";

describe("SPACING_PRESETS", () => {
  const presetNames = Object.keys(SPACING_PRESETS) as SpacingPreset[];
  const keys = ["none", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

  it("has 4 entries: compact, default, relaxed, spacious", () => {
    expect(presetNames).toHaveLength(4);
    expect(presetNames).toContain("compact");
    expect(presetNames).toContain("default");
    expect(presetNames).toContain("relaxed");
    expect(presetNames).toContain("spacious");
  });

  it("all entries have all 7 keys", () => {
    for (const name of presetNames) {
      for (const key of keys) {
        expect(SPACING_PRESETS[name]).toHaveProperty(key);
      }
    }
  });

  it("none is always 0", () => {
    for (const name of presetNames) {
      expect(SPACING_PRESETS[name].none).toBe(0);
    }
  });

  it("values increase monotonically within each preset", () => {
    for (const name of presetNames) {
      const scale = SPACING_PRESETS[name];
      const values = keys.map((k) => scale[k]);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    }
  });

  it("compact values are <= spacious values for each key", () => {
    for (const key of keys) {
      expect(SPACING_PRESETS.compact[key]).toBeLessThanOrEqual(SPACING_PRESETS.spacious[key]);
    }
  });
});
