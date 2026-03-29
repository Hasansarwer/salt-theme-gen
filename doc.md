# CLAUDE.md — salt-theme-gen

> Complete reference for AI assistants. Read this before generating code, answering questions, or modifying this package.

## 1. Philosophy

This package answers one question: **"Given a single color, what should every other color in a mobile app be?"**

Design systems fail when humans hand-pick 17+ colors and hope they harmonize. This library replaces manual color picking with **perceptual color math** — one primary color in, a complete light + dark theme out.

Core beliefs:

- **One input, full output.** A user provides a hex color (or picks a nature preset). The library derives 17 semantic colors, 24 interactive states, and a WCAG accessibility report — for both light and dark modes.
- **Perceptual, not numerical.** All color derivation happens in OKLCH, a perceptually uniform color space. "Make it 20% darker" means 20% *visually* darker, not 20% numerically lower in some arbitrary channel.
- **Accessibility is not optional.** Every `onX` color (text on colored backgrounds) is guaranteed to meet WCAG AA contrast (4.5:1). If the initial pick fails, the library auto-corrects by walking the lightness axis.
- **Zero dependencies.** Pure TypeScript math. No native modules, no runtime dependencies. Works in any JS environment.
- **React Native first.** Output format matches the `Theme` type of `react-native-salt` (the companion UI kit). Colors are HEX strings (React Native doesn't support oklch() CSS functions). Spacing/radius/fontSize are plain number objects.

## 2. Architecture

```
src/
├── index.ts              # Public API surface — re-exports everything
├── types.ts              # All TypeScript types (no runtime code)
├── generate-theme.ts     # Entry point: generateTheme() orchestrator
├── color-math.ts         # Pure math: color space conversions, WCAG, manipulation
├── butterfly.ts          # The Butterfly Rule: derives 17 semantic colors
├── on-colors.ts          # "on" color derivation + WCAG auto-correction
├── state-colors.ts       # Interactive states (hover, pressed, focused, disabled)
└── presets/
    ├── index.ts           # Re-exports all preset data
    ├── nature-presets.ts  # 20 nature-inspired hue+chroma pairs
    ├── spacing-presets.ts # 4 spacing scales (compact → spacious)
    ├── radius-presets.ts  # 4 radius scales (sharp → pill)
    └── font-size-presets.ts # 4 font size scales (small → editorial)
```

### Data flow

```
User input (hex / preset / options)
        │
        ▼
  generateTheme()                    ← generate-theme.ts
        │
        ├─ resolvePrimary()          Parse hex or lookup preset → primary HEX
        ├─ resolveScale() ×3         Resolve spacing/radius/fontSize presets
        │
        ├─ generateMode("light")
        │   ├─ deriveColors()        ← butterfly.ts   (17 semantic colors)
        │   ├─ deriveAllIntentStates()← state-colors.ts (6×4 = 24 states)
        │   └─ buildAccessibilityReport() ← on-colors.ts (14 contrast checks)
        │
        └─ generateMode("dark")
            └─ (same pipeline, different lightness rules)
        │
        ▼
  { light: GeneratedThemeMode, dark: GeneratedThemeMode }
```

### Module responsibilities

| Module | Does | Does NOT |
|--------|------|----------|
| `color-math.ts` | Color space math, conversions, WCAG formulas, gamut clamping | Know about themes, semantic names, or presets |
| `butterfly.ts` | Map one primary → 17 named colors using OKLCH rules | Handle states, accessibility, or presets |
| `on-colors.ts` | Pick white/dark text for colored backgrounds, auto-correct for WCAG | Generate base colors |
| `state-colors.ts` | Derive hover/pressed/focused/disabled variants | Know about semantic names |
| `generate-theme.ts` | Orchestrate everything, resolve presets, combine into output | Contain any math |
| `presets/*.ts` | Store static data tables | Contain logic |

## 3. The Color Math

### 3.1 Color spaces used

**sRGB** (0–255 per channel) — Input/output format. React Native uses HEX strings.

**Linear RGB** (0–1 per channel) — Intermediate. Required because sRGB has a nonlinear gamma curve. All matrix math must happen in linear space.

**Oklab** (L: 0–1, a: ±0.4, b: ±0.4) — Perceptually uniform Cartesian space designed by Björn Ottosson (2020). L = lightness, a = green-red axis, b = blue-yellow axis.

**OKLCH** (L: 0–1, C: 0–~0.4, H: 0–360) — Polar form of Oklab. L = lightness, C = chroma (saturation intensity), H = hue angle. This is the primary working space for all derivation.

### 3.2 Conversion pipeline

```
HEX → sRGB → Linear RGB → Oklab → OKLCH
                                      ↕  (all derivation here)
HEX ← sRGB ← Linear RGB ← Oklab ← OKLCH
```

Each step:

1. **HEX → sRGB**: Parse hex string to {r, g, b} integers 0–255.
2. **sRGB → Linear RGB**: Apply inverse sRGB transfer function (gamma decoding).
   - `c ≤ 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055)^2.4`
3. **Linear RGB → Oklab**: Matrix multiply using Ottosson's optimized 3×3 matrices (skips XYZ intermediate). Cube-root nonlinearity applied to LMS cone responses.
4. **Oklab → OKLCH**: Cartesian-to-polar conversion. `C = √(a² + b²)`, `H = atan2(b, a)`.

Reverse is the exact inverse of each step.

### 3.3 Why OKLCH, not HSL

HSL is perceptually non-uniform. HSL lightness 50% for yellow (#FFFF00) and blue (#0000FF) look drastically different. OKLCH L=0.5 looks equally "mid-tone" regardless of hue. This means:

- Shifting hue by 60° gives a secondary that *feels* equally vibrant
- Setting L=0.55 for all intent colors (danger, success, warning, info) makes them visually balanced
- Darkening by 0.08 for hover states produces consistent perceived changes across all hues

### 3.4 Gamut clamping

OKLCH can represent colors outside the sRGB gamut (especially high-chroma blues and greens). When converting back to HEX, out-of-gamut colors are clamped via **binary search on the chroma axis**:

```
If oklchToLinearRgb() gives r,g,b outside [0,1]:
  Binary search: reduce C (chroma) until in-gamut
  25 iterations → precision < 0.000003% of original chroma
  Lightness and hue are preserved; only saturation is reduced
```

This is mathematically optimal — it finds the closest in-gamut color along the chroma dimension while preserving the intended lightness and hue.

### 3.5 WCAG contrast

Contrast ratio follows the WCAG 2.x specification exactly:

```
relativeLuminance = 0.2126·R + 0.7152·G + 0.0722·B   (linear RGB)
contrastRatio = (L_lighter + 0.05) / (L_darker + 0.05)
```

- **AA normal text**: ratio ≥ 4.5
- **AA large text**: ratio ≥ 3.0
- **AAA**: ratio ≥ 7.0

Note: WCAG contrast is calculated in sRGB/linear-RGB space (per spec), NOT in OKLCH. OKLCH is used for color derivation; WCAG is used for validation.

## 4. The Butterfly Rule

The heart of the package. Named because the derivation rules fan out symmetrically from the primary color like butterfly wings on the OKLCH color wheel.

### 4.1 What it derives

From one primary (L, C, H), it produces 11 base colors + 6 "on" colors = **17 semantic colors**.

### 4.2 Light mode rules

| Color | L | C | H | Rationale |
|-------|---|---|---|-----------|
| primary | 0.55 | = primary C | = primary H | Fixed mid-tone lightness for readability |
| secondary | 0.58 | primary C × 0.85 | primary H + 60° | Complementary hue, slightly lighter and less saturated |
| background | 0.97 | primary C × 0.03 | = primary H | Near-white with a barely visible tint of the primary |
| surface | 1.00 | 0 | = primary H | Pure white (cards, modals) |
| text | 0.13 | primary C × 0.05 | = primary H | Near-black with subtle warm/cool tint |
| muted | 0.55 | primary C × 0.12 | = primary H | Low-saturation mid-tone for secondary text |
| border | 0.88 | primary C × 0.05 | = primary H | Light gray with minimal tint |
| danger | 0.55 | 0.18 | 25° | Fixed red-orange, high chroma for urgency |
| success | 0.55 | 0.16 | 145° | Fixed green |
| warning | 0.62 | 0.16 | 80° | Fixed yellow-orange, slightly lighter for readability |
| info | 0.55 | 0.14 | 235° | Fixed blue |

### 4.3 Dark mode rules

| Color | L | C | H | Rationale |
|-------|---|---|---|-----------|
| primary | 0.72 | = primary C | = primary H | Lifted to 0.72 for contrast on dark backgrounds |
| secondary | 0.74 | primary C × 0.8 | primary H + 60° | Slightly lighter than primary |
| background | 0.15 | primary C × 0.04 | = primary H | Near-black with subtle tint |
| surface | 0.20 | primary C × 0.06 | = primary H | Slightly elevated card surface |
| text | 0.97 | primary C × 0.03 | = primary H | Near-white with tint |
| muted | 0.65 | primary C × 0.12 | = primary H | Lighter muted for dark backgrounds |
| border | 0.30 | primary C × 0.05 | = primary H | Dark gray border |
| danger | 0.72 | 0.16 | 25° | Same hue, lifted lightness |
| success | 0.72 | 0.14 | 145° | Same pattern |
| warning | 0.75 | 0.14 | 80° | Same pattern |
| info | 0.72 | 0.12 | 235° | Same pattern |

### 4.4 Key design decisions

- **Primary-relative vs. fixed**: Background, surface, text, muted, border are derived *relative* to the primary's chroma (C × factor). This gives them a subtle tint that matches the primary. Intent colors (danger/success/warning/info) use *fixed* hue and chroma because they must be universally recognizable regardless of the primary.
- **Secondary = H + 60°**: 60° provides enough contrast to distinguish from primary without clashing. The 0.85/0.8 chroma reduction prevents it from competing visually.
- **Intent lightness L=0.55 (light) / L=0.72 (dark)**: Chosen to reliably achieve WCAG AA contrast against the background in both modes. Warning uses L=0.62/0.75 because yellow hues need extra lightness to remain readable.

## 5. "On" Colors and Accessibility

### 5.1 "on" color derivation

For each intent color (primary, secondary, danger, success, warning, info), an "on" color is the text/icon color placed directly on that background.

Algorithm:
1. Measure the background's relative luminance
2. Pick candidate: luminance > 0.5 → dark text (`#0f172a`), otherwise → white (`#ffffff`)
3. Check WCAG AA (ratio ≥ 4.5)
4. If it fails, run `autoCorrectContrast()`:
   - Walk the OKLCH lightness axis in 0.01 steps toward higher contrast
   - Direction: lighten if background is dark, darken if background is light
   - Stop at the first L value that achieves ratio ≥ 4.5
   - Fallback: pure white or pure black

This guarantees WCAG AA for every `onX` color in every theme.

### 5.2 Accessibility report

The output includes a `ContrastEntry` for 14 critical color pairs:
- 6 intent colors on background (e.g., primary on background)
- 2 text pairs (text on background, text on surface)
- 6 "on" colors on their parent (e.g., onPrimary on primary)

Each entry has `{ ratio: number, level: "AAA" | "AA" | "fail" }`.

## 6. Interactive State Colors

For each of the 6 intent colors, 4 states are derived:

| State | Operation | Rationale |
|-------|-----------|-----------|
| hover | darken by 0.08 L | Subtle darkening, visible feedback |
| pressed | darken by 0.15 L | Stronger depression effect |
| focused | base color + `4d` alpha suffix (30% opacity) | Semi-transparent ring/glow |
| disabled | desaturate to 30% chroma, then lighten by 0.15 | Washed-out, clearly inactive |

Total: 6 intents × 4 states = **24 state colors** per theme mode.

## 7. Nature Presets

20 presets mapped to OKLCH hue + chroma values inspired by natural phenomena:

| Preset | Hue | Chroma | Character |
|--------|-----|--------|-----------|
| peacock | 175° | 0.15 | High-chroma teal, vibrant |
| ocean | 235° | 0.13 | Deep blue, default preset |
| forest | 145° | 0.14 | Natural green |
| sunset | 45° | 0.16 | Warm orange |
| cherry-blossom | 350° | 0.12 | Soft pink |
| arctic | 230° | 0.08 | Low-chroma ice blue, muted |
| desert | 60° | 0.13 | Sandy warm tones |
| lavender | 300° | 0.10 | Gentle purple |
| emerald | 155° | 0.16 | Rich saturated green |
| coral-reef | 25° | 0.16 | Warm coral |
| midnight | 260° | 0.10 | Deep indigo |
| autumn | 50° | 0.15 | Burnt orange |
| rose-gold | 15° | 0.08 | Low-chroma warm pink, elegant |
| sapphire | 255° | 0.15 | Rich blue |
| mint | 165° | 0.10 | Cool fresh green |
| volcano | 30° | 0.18 | Highest chroma, fiery red-orange |
| twilight | 290° | 0.10 | Dusk purple |
| honey | 70° | 0.15 | Golden amber |
| storm | 245° | 0.04 | Lowest chroma, near-monochrome gray-blue |
| aurora | 155° | 0.13 | Northern lights green |

Presets are converted to a primary HEX via `oklchToHex({ L: 0.55, C: preset.chroma, H: preset.hue })`. This means the preset lightness is always 0.55 — only hue and chroma vary.

Chroma range across presets: 0.04 (storm) to 0.18 (volcano). This determines the "energy" of the palette — storm produces an almost grayscale UI, volcano produces vivid saturated colors.

## 8. Scale Presets

### Spacing (px values)

| Preset | none | xs | sm | md | lg | xl | xxl |
|--------|------|----|----|----|----|----|-----|
| compact | 0 | 2 | 4 | 8 | 12 | 16 | 24 |
| default | 0 | 4 | 8 | 12 | 16 | 24 | 32 |
| relaxed | 0 | 6 | 12 | 16 | 20 | 32 | 40 |
| spacious | 0 | 8 | 16 | 20 | 28 | 40 | 52 |

### Radius (px values)

| Preset | none | sm | md | lg | xl | xxl | pill |
|--------|------|----|----|----|----|----|------|
| sharp | 0 | 2 | 4 | 6 | 8 | 10 | 0 |
| default | 0 | 6 | 10 | 14 | 20 | 24 | 999 |
| rounded | 0 | 10 | 14 | 18 | 24 | 30 | 999 |
| pill | 0 | 14 | 18 | 24 | 30 | 40 | 999 |

Note: `sharp` sets `pill: 0` (no pill shape), all others use `999` (fully circular).

### Font sizes (px values)

| Preset | xs | sm | md | lg | xl | xxl | 3xl |
|--------|----|----|----|----|----|----|-----|
| small | 10 | 12 | 14 | 16 | 20 | 26 | 32 |
| default | 12 | 14 | 16 | 18 | 20 | 24 | 32 |
| large | 14 | 16 | 18 | 24 | 28 | 36 | 44 |
| editorial | 14 | 16 | 20 | 28 | 36 | 48 | 56 |

All scales accept either a preset string or a custom object with the same shape.

## 9. Output Shape

```typescript
type GeneratedTheme = {
  light: GeneratedThemeMode;
  dark: GeneratedThemeMode;
};

type GeneratedThemeMode = {
  mode: "light" | "dark";
  colors: SemanticColors;     // 17 HEX strings
  spacing: SpacingScale;      // 7 numbers
  radius: RadiusScale;        // 7 numbers
  fontSizes: FontSizeScale;   // 7 numbers
  fontLevel: FontLevel;       // 8–18
  states: IntentStates;       // 6 intents × 4 states = 24 HEX strings
  accessibility: AccessibilityReport; // 14 contrast entries
};
```

The output is a plain JSON-serializable object. No classes, no methods, no side effects. This makes it safe to:
- Serialize to AsyncStorage
- Pass through React Context
- Snapshot in tests
- Generate at build time or runtime

## 10. Integration with react-native-salt

```tsx
import { SaltProvider } from "react-native-salt";
import { generateTheme } from "salt-theme-gen";

const theme = generateTheme({ preset: "forest", radius: "rounded" });

<SaltProvider lightTheme={theme.light} darkTheme={theme.dark}>
  {children}
</SaltProvider>
```

The `GeneratedThemeMode` type is intentionally shaped to match `react-native-salt`'s `Theme` type. The `colors`, `spacing`, `radius`, and `fontSizes` keys align 1:1. The `states` and `accessibility` fields are extras that the UI kit doesn't consume directly but are available for custom components.

## 11. Public API Surface

### Primary function

- `generateTheme(options?)` — The only function most consumers need.

### Color utilities (advanced)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `parseColor` | `(input: string) → string` | Accept HEX, rgb(), CSS names → normalized HEX |
| `hexToOklch` | `(hex: string) → OKLCH` | Convert HEX to OKLCH |
| `oklchToHex` | `(lch: OKLCH) → string` | Convert OKLCH to HEX (with gamut clamping) |
| `contrastRatio` | `(hex1, hex2) → number` | WCAG contrast ratio |
| `meetsWcagAA` | `(fg, bg) → boolean` | Check ≥ 4.5 |
| `meetsWcagAALarge` | `(fg, bg) → boolean` | Check ≥ 3.0 |
| `darken` | `(hex, amount) → string` | Reduce L by amount |
| `lighten` | `(hex, amount) → string` | Increase L by amount |
| `desaturate` | `(hex, factor) → string` | Multiply C by factor |
| `adjustHue` | `(hex, degrees) → string` | Rotate H by degrees |
| `setLightness` | `(hex, L) → string` | Set absolute L (0–1) |
| `setChroma` | `(hex, C) → string` | Set absolute C |
| `gamutClamp` | `(lch: OKLCH) → OKLCH` | Clamp to sRGB gamut |

### Derivation functions (partial control)

| Function | Purpose |
|----------|---------|
| `deriveColors(primaryHex, mode, secondaryOverride?)` | Run Butterfly Rule only |
| `deriveOnColor(backgroundHex)` | Get WCAG-safe text color for any background |
| `autoCorrectContrast(fg, bg, minRatio?)` | Walk lightness to meet contrast target |
| `deriveStateColors(baseHex)` | Get hover/pressed/focused/disabled for one color |
| `deriveAllIntentStates(colors)` | Get states for all 6 intents |

### Preset data (for building UI pickers)

- `NATURE_PRESETS` — Record<ThemePreset, NaturePresetData>
- `SPACING_PRESETS` — Record<SpacingPreset, SpacingScale>
- `RADIUS_PRESETS` — Record<RadiusPreset, RadiusScale>
- `FONT_SIZE_PRESETS` — Record<FontSizePreset, FontSizeScale>

## 12. Constraints and Boundaries

- **No CSS oklch() output.** React Native doesn't support CSS color functions. All output is HEX strings.
- **No HSL anywhere.** The entire pipeline is sRGB ↔ Oklab ↔ OKLCH. HSL is avoided for perceptual accuracy.
- **No build step.** Ships raw TypeScript source. Metro (React Native bundler) handles TS natively. The `main` and `types` fields both point to `src/index.ts`.
- **No runtime dependencies.** Every function is pure math. No crypto, no platform APIs, no network.
- **Immutable output.** `generateTheme()` returns a new object every call. No caching, no mutation, no singletons.
- **HEX-in, HEX-out.** `parseColor()` accepts HEX, rgb(), and CSS names, but always normalizes to 6-digit lowercase HEX. All internal functions expect and return HEX.
- **fontLevel is pass-through.** It's clamped to 8–18 and included in the output but doesn't affect `fontSizes`. The UI kit uses it for dynamic scaling at runtime.
