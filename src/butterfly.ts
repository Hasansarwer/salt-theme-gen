import { hexToOklch, oklchToHex, clampOklch, lighten, mix } from "./color-math";
import { deriveOnColor, autoCorrectContrast } from "./on-colors";
import type { OKLCH, SemanticColors, SurfaceElevation } from "./types";

// ─── OKLCH Butterfly Rule ────────────────────────────────────────────
// Derives all 12 base colors + 7 "on" colors from a single primary.
// All derivation happens in OKLCH space for perceptual uniformity.

type DerivationRule = {
  L: number | ((primary: OKLCH) => number);
  C: number | ((primary: OKLCH) => number);
  H: number | ((primary: OKLCH) => number);
};

/**
 * Adjust L based on hue to compensate for perceptual brightness differences.
 * Yellow (H≈90°) appears brighter at the same L → lower L to compensate.
 * Blue (H≈265°) appears darker at the same L → raise L to compensate.
 */
export function adaptiveL(baseL: number, hue: number, amplitude: number = 0.05): number {
  const offset = -amplitude * Math.cos(((hue - 90) * Math.PI) / 180);
  return Math.max(0, Math.min(1, baseL + offset));
}

/**
 * Hue-aware secondary offset. Warm hues (red≈0°) get larger offsets (up to 120°)
 * because +60° produces colors that are perceptually too similar (red→orange).
 * Cool hues (cyan≈180°) keep 60° where analogous harmony works well.
 */
export function secondaryHueOffset(primaryH: number): number {
  const h = ((primaryH % 360) + 360) % 360;
  const t = (1 + Math.cos((h * Math.PI) / 180)) / 2; // 1 at H=0, 0 at H=180
  return 60 + 60 * t; // 60° (cool) → 120° (warm)
}

const LIGHT_RULES: Record<string, DerivationRule> = {
  primary:    { L: (p) => adaptiveL(0.55, p.H),        C: (p) => p.C,        H: (p) => p.H },
  secondary:  { L: (p) => { const sh = p.H + secondaryHueOffset(p.H); return adaptiveL(0.58, sh); },   C: (p) => p.C * 0.85, H: (p) => p.H + secondaryHueOffset(p.H) },
  tertiary:   { L: (p) => { const th = p.H + 2 * secondaryHueOffset(p.H); return adaptiveL(0.55, th); }, C: (p) => p.C * 0.75, H: (p) => (p.H + 2 * secondaryHueOffset(p.H)) % 360 },
  background: { L: 0.97,  C: (p) => p.C * 0.03, H: (p) => p.H },
  surface:    { L: 1.00,  C: 0,                 H: (p) => p.H },
  text:       { L: 0.13,  C: (p) => p.C * 0.05, H: (p) => p.H },
  muted:      { L: 0.55,  C: (p) => p.C * 0.12, H: (p) => p.H },
  border:     { L: 0.88,  C: (p) => p.C * 0.05, H: (p) => p.H },
  danger:     { L: 0.55,  C: 0.18,              H: 25 },
  success:    { L: 0.55,  C: 0.16,              H: 145 },
  warning:    { L: 0.62,  C: 0.16,              H: 80 },
  info:       { L: 0.55,  C: 0.14,              H: 235 },
};

const DARK_RULES: Record<string, DerivationRule> = {
  primary:    { L: (p) => adaptiveL(0.72, p.H, 0.04),       C: (p) => p.C,       H: (p) => p.H },
  secondary:  { L: (p) => { const sh = p.H + secondaryHueOffset(p.H); return adaptiveL(0.74, sh, 0.04); },  C: (p) => p.C * 0.8, H: (p) => p.H + secondaryHueOffset(p.H) },
  tertiary:   { L: (p) => { const th = p.H + 2 * secondaryHueOffset(p.H); return adaptiveL(0.72, th, 0.04); }, C: (p) => p.C * 0.7, H: (p) => (p.H + 2 * secondaryHueOffset(p.H)) % 360 },
  background: { L: 0.15,  C: (p) => p.C * 0.04, H: (p) => p.H },
  surface:    { L: 0.20,  C: (p) => p.C * 0.06, H: (p) => p.H },
  text:       { L: 0.97,  C: (p) => p.C * 0.03, H: (p) => p.H },
  muted:      { L: 0.65,  C: (p) => p.C * 0.12, H: (p) => p.H },
  border:     { L: 0.30,  C: (p) => p.C * 0.05, H: (p) => p.H },
  danger:     { L: 0.72,  C: 0.16,              H: 25 },
  success:    { L: 0.72,  C: 0.14,              H: 145 },
  warning:    { L: 0.75,  C: 0.14,              H: 80 },
  info:       { L: 0.72,  C: 0.12,              H: 235 },
};

function resolveValue(
  rule: number | ((primary: OKLCH) => number),
  primary: OKLCH
): number {
  return typeof rule === "function" ? rule(primary) : rule;
}

function applyRule(
  rule: DerivationRule,
  primary: OKLCH
): OKLCH {
  return clampOklch({
    L: resolveValue(rule.L, primary),
    C: resolveValue(rule.C, primary),
    H: resolveValue(rule.H, primary),
  });
}

/**
 * Derive all 19 semantic colors from a primary HEX using the OKLCH butterfly rule.
 */
export function deriveColors(
  primaryHex: string,
  mode: "light" | "dark",
  secondaryOverride?: string,
  tertiaryOverride?: string
): SemanticColors {
  const primary = hexToOklch(primaryHex);
  const rules = mode === "light" ? LIGHT_RULES : DARK_RULES;

  // Derive 12 base colors
  const base: Record<string, string> = {};
  for (const [key, rule] of Object.entries(rules)) {
    base[key] = oklchToHex(applyRule(rule, primary));
  }

  // Override secondary/tertiary if provided
  if (secondaryOverride) {
    base.secondary = secondaryOverride;
  }
  if (tertiaryOverride) {
    base.tertiary = tertiaryOverride;
  }

  // Auto-correct intent colors against background for WCAG AA (4.5:1)
  const intentKeys = ["danger", "success", "warning", "info"] as const;
  for (const key of intentKeys) {
    base[key] = autoCorrectContrast(base[key], base.background, 4.5);
  }

  // Derive 7 "on" colors with WCAG auto-correction
  const onPrimary = deriveOnColor(base.primary);
  const onSecondary = deriveOnColor(base.secondary);
  const onTertiary = deriveOnColor(base.tertiary);
  const onDanger = deriveOnColor(base.danger);
  const onSuccess = deriveOnColor(base.success);
  const onWarning = deriveOnColor(base.warning);
  const onInfo = deriveOnColor(base.info);

  return {
    primary: base.primary,
    secondary: base.secondary,
    tertiary: base.tertiary,
    background: base.background,
    surface: base.surface,
    text: base.text,
    muted: base.muted,
    border: base.border,
    danger: base.danger,
    success: base.success,
    warning: base.warning,
    info: base.info,
    onPrimary,
    onSecondary,
    onTertiary,
    onDanger,
    onSuccess,
    onWarning,
    onInfo,
  };
}

/**
 * Derive 4 surface elevation levels for visual depth.
 * Dark mode: progressively lighten the base surface.
 * Light mode: tint the base surface with primary at increasing ratios.
 */
export function deriveSurfaceElevation(
  surface: string,
  primary: string,
  mode: "light" | "dark"
): SurfaceElevation {
  if (mode === "dark") {
    return {
      card:     lighten(surface, 0.03),
      elevated: lighten(surface, 0.06),
      modal:    lighten(surface, 0.10),
      popover:  lighten(surface, 0.14),
    };
  }
  // Light mode: subtle primary tinting
  return {
    card:     mix(surface, primary, 0.02),
    elevated: mix(surface, primary, 0.04),
    modal:    mix(surface, primary, 0.06),
    popover:  mix(surface, primary, 0.08),
  };
}
