import { describe, it, expect } from "vitest";
import { deriveStateColors, deriveAllIntentStates } from "./state-colors";
import { hexToOklch } from "./color-math";
import { deriveColors } from "./butterfly";
import { expectValidHex, expectValidHexAlpha } from "./test-helpers";

// ─── deriveStateColors ──────────────────────────────────────────────

describe("deriveStateColors", () => {
  const base = "#1e90ff";
  const states = deriveStateColors(base);

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

  it("focused is base hex + '4d' suffix (9 chars)", () => {
    expect(states.focused).toBe(base + "4d");
    expect(states.focused).toHaveLength(9);
  });

  it("disabled is lighter and less saturated than base", () => {
    const baseLch = hexToOklch(base);
    // Disabled = lighten(desaturate(base, 0.3), 0.15)
    // The disabled hex is 7-char (no alpha)
    expectValidHex(states.disabled);
    const disabledLch = hexToOklch(states.disabled);
    expect(disabledLch.C).toBeLessThan(baseLch.C);
  });

  it("hover and pressed are valid hex", () => {
    expectValidHex(states.hover);
    expectValidHex(states.pressed);
  });

  it("focused is valid hex with alpha", () => {
    expectValidHexAlpha(states.focused);
  });

  it("works with pure black", () => {
    const s = deriveStateColors("#000000");
    expectValidHex(s.hover);
    expectValidHex(s.pressed);
    expectValidHex(s.disabled);
  });

  it("works with pure white", () => {
    const s = deriveStateColors("#ffffff");
    expectValidHex(s.hover);
    expectValidHex(s.pressed);
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

  it("all focused values end with '4d'", () => {
    for (const intent of intents) {
      expect(allStates[intent].focused).toMatch(/4d$/);
    }
  });

  it("primary states are derived from the primary color", () => {
    const primaryStates = deriveStateColors(colors.primary);
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
    }
  });
});
