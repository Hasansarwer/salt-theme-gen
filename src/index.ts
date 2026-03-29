// ─── Main Function ───────────────────────────────────────────────────
export { generateTheme } from "./generate-theme";

// ─── Types ───────────────────────────────────────────────────────────
export type {
  GenerateThemeOptions,
  GeneratedTheme,
  GeneratedThemeMode,
  SemanticColors,
  StateColors,
  IntentStates,
  SurfaceElevation,
  AccessibilityReport,
  ContrastEntry,
  ThemePreset,
  SpacingPreset,
  FontSizePreset,
  RadiusPreset,
  SpacingScale,
  RadiusScale,
  FontSizeScale,
  NaturePresetData,
  RGB,
  Oklab,
  OKLCH,
  FontLevel,
} from "./types";

// ─── Preset Data (for UI pickers, iteration) ────────────────────────
export { NATURE_PRESETS } from "./presets/nature-presets";
export { SPACING_PRESETS } from "./presets/spacing-presets";
export { RADIUS_PRESETS } from "./presets/radius-presets";
export { FONT_SIZE_PRESETS } from "./presets/font-size-presets";

// ─── Color Math Utilities (for advanced consumers) ───────────────────
export {
  parseColor,
  hexToOklch,
  oklchToHex,
  hexToRgb,
  rgbToHex,
  relativeLuminance,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAALarge,
  darken,
  lighten,
  desaturate,
  adjustHue,
  setLightness,
  setChroma,
  isValidHex,
  normalizeHex,
  gamutClamp,
  mix,
} from "./color-math";

// ─── Color Derivation (for consumers who want partial control) ───────
export { deriveColors, deriveSurfaceElevation } from "./butterfly";
export { deriveOnColor, autoCorrectContrast } from "./on-colors";
export { deriveStateColors, deriveAllIntentStates } from "./state-colors";

// ─── Validation (for deserialized themes) ────────────────────────────
export { parseThemeJSON } from "./validate";
