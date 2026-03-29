import { describe, it, expect } from "vitest";
import { RADIUS_PRESETS } from "./radius-presets";
import type { RadiusPreset } from "../types";

describe("RADIUS_PRESETS", () => {
  const presetNames = Object.keys(RADIUS_PRESETS) as RadiusPreset[];

  it("has 4 entries: sharp, default, rounded, pill", () => {
    expect(presetNames).toHaveLength(4);
    expect(presetNames).toContain("sharp");
    expect(presetNames).toContain("default");
    expect(presetNames).toContain("rounded");
    expect(presetNames).toContain("pill");
  });

  it("all entries have all 7 keys", () => {
    const keys = ["none", "sm", "md", "lg", "xl", "xxl", "pill"] as const;
    for (const name of presetNames) {
      for (const key of keys) {
        expect(RADIUS_PRESETS[name]).toHaveProperty(key);
      }
    }
  });

  it("none is always 0", () => {
    for (const name of presetNames) {
      expect(RADIUS_PRESETS[name].none).toBe(0);
    }
  });

  it("sharp has pill=0, others have pill=999", () => {
    expect(RADIUS_PRESETS.sharp.pill).toBe(0);
    expect(RADIUS_PRESETS.default.pill).toBe(999);
    expect(RADIUS_PRESETS.rounded.pill).toBe(999);
    expect(RADIUS_PRESETS.pill.pill).toBe(999);
  });

  it("all values are non-negative", () => {
    for (const name of presetNames) {
      const values = Object.values(RADIUS_PRESETS[name]);
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
