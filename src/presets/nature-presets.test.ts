import { describe, it, expect } from "vitest";
import { NATURE_PRESETS } from "./nature-presets";
import { oklchToHex } from "../color-math";
import type { ThemePreset } from "../types";

describe("NATURE_PRESETS", () => {
  const presetNames = Object.keys(NATURE_PRESETS) as ThemePreset[];

  it("has exactly 20 entries", () => {
    expect(presetNames).toHaveLength(20);
  });

  it("all hue values are between 0 and 360", () => {
    for (const name of presetNames) {
      const { hue } = NATURE_PRESETS[name];
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThanOrEqual(360);
    }
  });

  it("all chroma values are between 0 and 0.5", () => {
    for (const name of presetNames) {
      const { chroma } = NATURE_PRESETS[name];
      expect(chroma).toBeGreaterThan(0);
      expect(chroma).toBeLessThan(0.5);
    }
  });

  it("all entries have required fields", () => {
    for (const name of presetNames) {
      const preset = NATURE_PRESETS[name];
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("hue");
      expect(preset).toHaveProperty("chroma");
      expect(preset).toHaveProperty("description");
    }
  });

  it("every preset name matches its key", () => {
    for (const name of presetNames) {
      expect(NATURE_PRESETS[name].name).toBe(name);
    }
  });

  it("ocean is the default preset with expected values", () => {
    expect(NATURE_PRESETS.ocean.hue).toBe(235);
    expect(NATURE_PRESETS.ocean.chroma).toBe(0.13);
  });

  it("every preset converts to a valid hex", () => {
    for (const name of presetNames) {
      const { hue, chroma } = NATURE_PRESETS[name];
      const hex = oklchToHex({ L: 0.55, C: chroma, H: hue });
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("no two presets have identical hue+chroma", () => {
    const pairs = presetNames.map((n) => `${NATURE_PRESETS[n].hue}-${NATURE_PRESETS[n].chroma}`);
    const unique = new Set(pairs);
    expect(unique.size).toBe(presetNames.length);
  });
});
