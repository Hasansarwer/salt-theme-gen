import { darken, desaturate, lighten } from "./color-math";
import type { StateColors, IntentStates, SemanticColors } from "./types";

/**
 * Derive 4 interactive states for a single color.
 * All operations in OKLCH space for perceptual uniformity.
 */
export function deriveStateColors(baseHex: string): StateColors {
  return {
    hover: darken(baseHex, 0.08),
    pressed: darken(baseHex, 0.15),
    focused: baseHex + "4d", // 30% opacity suffix for focus ring
    disabled: lighten(desaturate(baseHex, 0.3), 0.15),
  };
}

/**
 * Derive state colors for all 6 intent colors.
 * 6 intents × 4 states = 24 state colors.
 */
export function deriveAllIntentStates(colors: SemanticColors): IntentStates {
  return {
    primary: deriveStateColors(colors.primary),
    secondary: deriveStateColors(colors.secondary),
    danger: deriveStateColors(colors.danger),
    success: deriveStateColors(colors.success),
    warning: deriveStateColors(colors.warning),
    info: deriveStateColors(colors.info),
  };
}
