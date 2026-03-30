import { darken, desaturate, lighten, mix, contrastRatio } from "./color-math";
import { autoCorrectContrast } from "./on-colors";
import type { StateColors, IntentStates, SemanticColors } from "./types";

/**
 * Derive 4 interactive states for a single color.
 * All operations in OKLCH space for perceptual uniformity.
 * Focused state is blended with background at 30% to produce a solid color.
 * Disabled state is verified for 3:1 contrast against background (WCAG non-text UI).
 */
export function deriveStateColors(baseHex: string, backgroundHex: string): StateColors {
  let disabled = lighten(desaturate(baseHex, 0.3), 0.15);
  if (contrastRatio(disabled, backgroundHex) < 3) {
    disabled = autoCorrectContrast(disabled, backgroundHex, 3);
  }
  return {
    hover: darken(baseHex, 0.08),
    pressed: darken(baseHex, 0.15),
    focused: mix(backgroundHex, baseHex, 0.3),
    disabled,
  };
}

/**
 * Derive state colors for all 8 intent colors.
 * 8 intents × 4 states = 32 state colors.
 */
export function deriveAllIntentStates(colors: SemanticColors): IntentStates {
  const bg = colors.background;
  return {
    primary: deriveStateColors(colors.primary, bg),
    secondary: deriveStateColors(colors.secondary, bg),
    tertiary: deriveStateColors(colors.tertiary, bg),
    quaternary: deriveStateColors(colors.quaternary, bg),
    danger: deriveStateColors(colors.danger, bg),
    success: deriveStateColors(colors.success, bg),
    warning: deriveStateColors(colors.warning, bg),
    info: deriveStateColors(colors.info, bg),
  };
}
