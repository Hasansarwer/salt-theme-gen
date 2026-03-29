import { hexToOklch, oklchToHex, clampOklch, lighten, mix } from "./color-math";
import { deriveOnColor, autoCorrectContrast } from "./on-colors";
import type { OKLCH, SemanticColors, SurfaceElevation } from "./types";

// ─── OKLCH Butterfly Rule ────────────────────────────────────────────
// Derives all 11 base colors + 6 "on" colors from a single primary.
// All derivation happens in OKLCH space for perceptual uniformity.

type DerivationRule = {
  L: number | ((primaryL: number) => number);
  C: number | ((primaryC: number) => number);
  H: number | ((primaryH: number) => number);
};

const LIGHT_RULES: Record<string, DerivationRule> = {
  primary:    { L: 0.55,  C: (C) => C,        H: (H) => H },
  secondary:  { L: 0.58,  C: (C) => C * 0.85, H: (H) => H + 60 },
  background: { L: 0.97,  C: (C) => C * 0.03, H: (H) => H },
  surface:    { L: 1.00,  C: 0,               H: (H) => H },
  text:       { L: 0.13,  C: (C) => C * 0.05, H: (H) => H },
  muted:      { L: 0.55,  C: (C) => C * 0.12, H: (H) => H },
  border:     { L: 0.88,  C: (C) => C * 0.05, H: (H) => H },
  danger:     { L: 0.55,  C: 0.18,            H: 25 },
  success:    { L: 0.55,  C: 0.16,            H: 145 },
  warning:    { L: 0.62,  C: 0.16,            H: 80 },
  info:       { L: 0.55,  C: 0.14,            H: 235 },
};

const DARK_RULES: Record<string, DerivationRule> = {
  primary:    { L: 0.72,  C: (C) => C,        H: (H) => H },
  secondary:  { L: 0.74,  C: (C) => C * 0.8,  H: (H) => H + 60 },
  background: { L: 0.15,  C: (C) => C * 0.04, H: (H) => H },
  surface:    { L: 0.20,  C: (C) => C * 0.06, H: (H) => H },
  text:       { L: 0.97,  C: (C) => C * 0.03, H: (H) => H },
  muted:      { L: 0.65,  C: (C) => C * 0.12, H: (H) => H },
  border:     { L: 0.30,  C: (C) => C * 0.05, H: (H) => H },
  danger:     { L: 0.72,  C: 0.16,            H: 25 },
  success:    { L: 0.72,  C: 0.14,            H: 145 },
  warning:    { L: 0.75,  C: 0.14,            H: 80 },
  info:       { L: 0.72,  C: 0.12,            H: 235 },
};

function resolveValue(
  rule: number | ((input: number) => number),
  input: number
): number {
  return typeof rule === "function" ? rule(input) : rule;
}

function applyRule(
  rule: DerivationRule,
  primary: OKLCH
): OKLCH {
  return clampOklch({
    L: resolveValue(rule.L, primary.L),
    C: resolveValue(rule.C, primary.C),
    H: resolveValue(rule.H, primary.H),
  });
}

/**
 * Derive all 17 semantic colors from a primary HEX using the OKLCH butterfly rule.
 */
export function deriveColors(
  primaryHex: string,
  mode: "light" | "dark",
  secondaryOverride?: string
): SemanticColors {
  const primary = hexToOklch(primaryHex);
  const rules = mode === "light" ? LIGHT_RULES : DARK_RULES;

  // Derive 11 base colors
  const base: Record<string, string> = {};
  for (const [key, rule] of Object.entries(rules)) {
    base[key] = oklchToHex(applyRule(rule, primary));
  }

  // Override secondary if provided
  if (secondaryOverride) {
    base.secondary = secondaryOverride;
  }

  // Auto-correct intent colors against background for WCAG AA (4.5:1)
  const intentKeys = ["danger", "success", "warning", "info"] as const;
  for (const key of intentKeys) {
    base[key] = autoCorrectContrast(base[key], base.background, 4.5);
  }

  // Derive 6 "on" colors with WCAG auto-correction
  const onPrimary = deriveOnColor(base.primary);
  const onSecondary = deriveOnColor(base.secondary);
  const onDanger = deriveOnColor(base.danger);
  const onSuccess = deriveOnColor(base.success);
  const onWarning = deriveOnColor(base.warning);
  const onInfo = deriveOnColor(base.info);

  return {
    primary: base.primary,
    secondary: base.secondary,
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
