import { describe, it, expect } from "vitest";
import { deriveStateColors, deriveAllIntentStates } from "./state-colors";
import { hexToOklch } from "./color-math";
import { deriveColors } from "./butterfly";
import { expectValidHex } from "./test-helpers";

// ─── deriveStateColors ──────────────────────────────────────────────

describe("deriveStateColors", () => {
  const base = "#1e90ff";
  const bg = "#f5f5f5";
  const states = deriveStateColors(base, bg);

  it("returns object with hover, pressed, focused, disabled", () => {
    expect(states).toHaveProperty("hover");
    expect(states).toHaveProperty("pressed");
    expect(states).toHaveProperty("focused");
    expect(states).toHaveProperty("disabled");
  });

  it("hover is darker than base", () => {
    const baseLch = hexToOklch(base);
    const hoverLch = hexToOklch(states.hover);
    expect(hoverLch.L).toBeLessThan(baseLch.L);
  });

  it("pressed is darker than hover", () => {
    const hoverLch = hexToOklch(states.hover);
    const pressedLch = hexToOklch(states.pressed);
    expect(pressedLch.L).toBeLessThan(hoverLch.L);
  });

  it("focused is a solid 7-char hex (no alpha suffix)", () => {
    expectValidHex(states.focused);
    expect(states.focused).toHaveLength(7);
  });

  it("focused L is between base and background", () => {
    const baseLch = hexToOklch(base);
    const bgLch = hexToOklch(bg);
    const focusedLch = hexToOklch(states.focused);
    const minL = Math.min(baseLch.L, bgLch.L);
    const maxL = Math.max(baseLch.L, bgLch.L);
    expect(focusedLch.L).toBeGreaterThanOrEqual(minL - 0.01);
    expect(focusedLch.L).toBeLessThanOrEqual(maxL + 0.01);
  });

  it("disabled is lighter and less saturated than base", () => {
    const baseLch = hexToOklch(base);
    expectValidHex(states.disabled);
    const disabledLch = hexToOklch(states.disabled);
    expect(disabledLch.C).toBeLessThan(baseLch.C);
  });

  it("all states are valid hex", () => {
    expectValidHex(states.hover);
    expectValidHex(states.pressed);
    expectValidHex(states.focused);
    expectValidHex(states.disabled);
  });

  it("works with pure black on white bg", () => {
    const s = deriveStateColors("#000000", "#ffffff");
    expectValidHex(s.hover);
    expectValidHex(s.pressed);
    expectValidHex(s.focused);
    expectValidHex(s.disabled);
  });

  it("works with pure white on dark bg", () => {
    const s = deriveStateColors("#ffffff", "#1a1a1a");
    expectValidHex(s.hover);
    expectValidHex(s.pressed);
    expectValidHex(s.focused);
    expectValidHex(s.disabled);
  });
});

// ─── deriveAllIntentStates ──────────────────────────────────────────

describe("deriveAllIntentStates", () => {
  const colors = deriveColors("#1e90ff", "light");
  const allStates = deriveAllIntentStates(colors);
  const intents = ["primary", "secondary", "danger", "success", "warning", "info"] as const;

  it("returns object with all 6 intent keys", () => {
    for (const intent of intents) {
      expect(allStates).toHaveProperty(intent);
    }
  });

  it("each intent has all 4 state keys", () => {
    for (const intent of intents) {
      expect(allStates[intent]).toHaveProperty("hover");
      expect(allStates[intent]).toHaveProperty("pressed");
      expect(allStates[intent]).toHaveProperty("focused");
      expect(allStates[intent]).toHaveProperty("disabled");
    }
  });

  it("total of 24 state color values", () => {
    let count = 0;
    for (const intent of intents) {
      count += Object.keys(allStates[intent]).length;
    }
    expect(count).toBe(24);
  });

  it("all hover values are valid hex strings", () => {
    for (const intent of intents) {
      expectValidHex(allStates[intent].hover);
    }
  });

  it("all focused values are solid hex (no alpha)", () => {
    for (const intent of intents) {
      expectValidHex(allStates[intent].focused);
      expect(allStates[intent].focused).toHaveLength(7);
    }
  });

  it("primary states match deriveStateColors with background", () => {
    const primaryStates = deriveStateColors(colors.primary, colors.background);
    expect(allStates.primary.hover).toBe(primaryStates.hover);
    expect(allStates.primary.pressed).toBe(primaryStates.pressed);
    expect(allStates.primary.focused).toBe(primaryStates.focused);
    expect(allStates.primary.disabled).toBe(primaryStates.disabled);
  });

  it("works with dark mode colors", () => {
    const darkColors = deriveColors("#1e90ff", "dark");
    const darkStates = deriveAllIntentStates(darkColors);
    for (const intent of intents) {
      expectValidHex(darkStates[intent].hover);
      expectValidHex(darkStates[intent].focused);
    }
  });
});
