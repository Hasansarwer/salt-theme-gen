import { parseColor, oklchToHex } from "./color-math";
import { deriveColors, deriveSurfaceElevation } from "./butterfly";
import { deriveAllIntentStates } from "./state-colors";
import { buildAccessibilityReport } from "./on-colors";
import { SPACING_PRESETS } from "./presets/spacing-presets";
import { RADIUS_PRESETS } from "./presets/radius-presets";
import { FONT_SIZE_PRESETS } from "./presets/font-size-presets";
import { NATURE_PRESETS } from "./presets/nature-presets";
import type {
  GenerateThemeOptions,
  GeneratedTheme,
  GeneratedThemeMode,
  FontLevel,
  SpacingPreset,
  FontSizePreset,
  RadiusPreset,
  SpacingScale,
  FontSizeScale,
  RadiusScale,
} from "./types";

/**
 * Generate a complete light + dark theme from minimal input.
 *
 * @example
 * // Minimal — just a color
 * const theme = generateTheme({ primary: "#0E9D8E" });
 *
 * @example
 * // From a preset
 * const theme = generateTheme({ preset: "peacock" });
 *
 * @example
 * // Full control
 * const theme = generateTheme({
 *   preset: "peacock",
 *   spacing: "relaxed",
 *   radius: "rounded",
 *   fontSize: "large",
 * });
 */
export function generateTheme(options: GenerateThemeOptions = {}): GeneratedTheme {
  // 1. Resolve primary color
  const primaryHex = resolvePrimary(options);

  // 2. Resolve secondary override
  const secondaryOverride = options.secondary
    ? parseColor(options.secondary)
    : undefined;

  // 3. Resolve scales
  const spacing = resolveScale<SpacingPreset, SpacingScale>(
    options.spacing,
    SPACING_PRESETS,
    "default"
  );
  const fontSize = resolveScale<FontSizePreset, FontSizeScale>(
    options.fontSize,
    FONT_SIZE_PRESETS,
    "default"
  );
  const radius = resolveScale<RadiusPreset, RadiusScale>(
    options.radius,
    RADIUS_PRESETS,
    "default"
  );

  // 4. Resolve fontLevel
  const fontLevel = Math.max(8, Math.min(18, options.fontLevel ?? 16)) as FontLevel;

  // 5. Generate both modes
  const light = generateMode("light", primaryHex, secondaryOverride, spacing, radius, fontSize, fontLevel);
  const dark = generateMode("dark", primaryHex, secondaryOverride, spacing, radius, fontSize, fontLevel);

  return { light, dark };
}

function generateMode(
  mode: "light" | "dark",
  primaryHex: string,
  secondaryOverride: string | undefined,
  spacing: SpacingScale,
  radius: RadiusScale,
  fontSizes: FontSizeScale,
  fontLevel: FontLevel
): GeneratedThemeMode {
  const colors = deriveColors(primaryHex, mode, secondaryOverride);
  const surfaceElevation = deriveSurfaceElevation(colors.surface, colors.primary, mode);
  const states = deriveAllIntentStates(colors);
  const accessibility = buildAccessibilityReport(colors);

  return {
    mode,
    colors,
    surfaceElevation,
    spacing,
    radius,
    fontSizes,
    fontLevel,
    states,
    accessibility,
  };
}

function resolvePrimary(options: GenerateThemeOptions): string {
  if (options.primary) {
    return parseColor(options.primary);
  }

  if (options.preset) {
    const preset = NATURE_PRESETS[options.preset];
    if (!preset) {
      throw new Error(
        `Unknown preset: "${options.preset}". Valid presets: ${Object.keys(NATURE_PRESETS).join(", ")}`
      );
    }
    // Convert preset hue+chroma to a primary HEX via OKLCH
    return oklchToHex({ L: 0.55, C: preset.chroma, H: preset.hue });
  }

  // Default: ocean preset
  const ocean = NATURE_PRESETS.ocean;
  return oklchToHex({ L: 0.55, C: ocean.chroma, H: ocean.hue });
}

function resolveScale<P extends string, S>(
  input: P | S | undefined,
  presets: Record<string, S>,
  defaultKey: string
): S {
  if (input === undefined) return presets[defaultKey];
  if (typeof input === "string") {
    const preset = presets[input];
    if (!preset) {
      throw new Error(`Unknown scale preset: "${input}"`);
    }
    return preset;
  }
  return input as S;
}
