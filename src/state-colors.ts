import { darken, desaturate, lighten, mix } from "./color-math";
import type { StateColors, IntentStates, SemanticColors } from "./types";

/**
 * Derive 4 interactive states for a single color.
 * All operations in OKLCH space for perceptual uniformity.
 * Focused state is blended with background at 30% to produce a solid color.
 */
export function deriveStateColors(baseHex: string, backgroundHex: string): StateColors {
  return {
    hover: darken(baseHex, 0.08),
    pressed: darken(baseHex, 0.15),
    focused: mix(backgroundHex, baseHex, 0.3),
    disabled: lighten(desaturate(baseHex, 0.3), 0.15),
  };
}

/**
 * Derive state colors for all 6 intent colors.
 * 6 intents × 4 states = 24 state colors.
 */
export function deriveAllIntentStates(colors: SemanticColors): IntentStates {
  const bg = colors.background;
  return {
    primary: deriveStateColors(colors.primary, bg),
    secondary: deriveStateColors(colors.secondary, bg),
    danger: deriveStateColors(colors.danger, bg),
    success: deriveStateColors(colors.success, bg),
    warning: deriveStateColors(colors.warning, bg),
    info: deriveStateColors(colors.info, bg),
  };
}
