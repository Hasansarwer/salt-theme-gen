# salt-theme-gen

OKLCH-based design system generator for React Native. Generate complete light + dark themes from a single color.

## Install

```bash
npm install salt-theme-gen
```

Zero dependencies — pure TypeScript color math.

## Quick Start

```typescript
import { generateTheme } from "salt-theme-gen";

// From a hex color
const theme = generateTheme({ primary: "#0E9D8E" });

// From a preset
const theme = generateTheme({ preset: "ocean" });

// With scale customization
const theme = generateTheme({
  preset: "sunset",
  spacing: "compact",
  radius: "rounded",
  fontSize: "large",
});
```

### Output

```typescript
theme.light.colors   // 17 semantic colors (primary, secondary, background, surface, text, ...)
theme.dark.colors    // Same 17 keys, adjusted for dark mode
theme.light.spacing  // { none, xs, sm, md, lg, xl, xxl }
theme.light.radius   // { none, sm, md, lg, xl, xxl, pill }
theme.light.fontSizes // { xs, sm, md, lg, xl, xxl, 3xl }
theme.light.states   // Hover, pressed, focused, disabled per intent
theme.light.accessibility // WCAG contrast report for all color pairs
```

## Nature Presets (20)

| Preset | Hue | Description |
|--------|-----|-------------|
| peacock | 175 | Teal-green |
| ocean | 235 | Deep blue |
| forest | 145 | Natural green |
| sunset | 45 | Warm orange |
| cherry-blossom | 340 | Soft pink |
| arctic | 200 | Ice blue |
| desert | 35 | Sandy gold |
| lavender | 280 | Purple |
| emerald | 155 | Rich green |
| coral-reef | 15 | Coral |
| midnight | 250 | Dark indigo |
| autumn | 25 | Burnt orange |
| rose-gold | 10 | Warm rose |
| sapphire | 225 | Royal blue |
| mint | 165 | Fresh mint |
| volcano | 5 | Fiery red |
| twilight | 265 | Violet |
| honey | 50 | Golden amber |
| storm | 215 | Steel blue |
| aurora | 135 | Northern lights green |

## Scale Presets

**Spacing:** `compact` | `default` | `relaxed` | `spacious`
**Radius:** `sharp` | `default` | `rounded` | `pill`
**Font size:** `small` | `default` | `large` | `editorial`

Or pass a custom scale object:

```typescript
generateTheme({
  primary: "#2563eb",
  spacing: { none: 0, xs: 2, sm: 4, md: 8, lg: 12, xl: 16, xxl: 24 },
});
```

## API

### `generateTheme(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `primary` | `string` | — | HEX, RGB, or CSS named color |
| `preset` | `ThemePreset` | `"ocean"` | Nature preset (used if no `primary`) |
| `secondary` | `string` | auto-derived | Override the secondary color |
| `spacing` | `SpacingPreset \| SpacingScale` | `"default"` | Spacing scale |
| `fontSize` | `FontSizePreset \| FontSizeScale` | `"default"` | Font size scale |
| `radius` | `RadiusPreset \| RadiusScale` | `"default"` | Border radius scale |
| `fontLevel` | `number` | `16` | Base font level (8–18) |

### Color Utilities

For advanced use cases — all operate in OKLCH perceptual color space:

```typescript
import {
  parseColor,       // Accept HEX, RGB, CSS names → RGB
  hexToOklch,       // HEX → OKLCH
  oklchToHex,       // OKLCH → HEX (with gamut clamping)
  contrastRatio,    // WCAG contrast ratio between two hex colors
  meetsWcagAA,      // Check if contrast ≥ 4.5
  darken,           // Reduce lightness
  lighten,          // Increase lightness
  desaturate,       // Reduce chroma
  adjustHue,        // Rotate hue
} from "salt-theme-gen";
```

## Use with react-native-salt

```tsx
import { SaltProvider } from "react-native-salt";
import { generateTheme } from "salt-theme-gen";

const theme = generateTheme({ preset: "forest" });

export default function App() {
  return (
    <SaltProvider lightTheme={theme.light} darkTheme={theme.dark}>
      {/* Your app */}
    </SaltProvider>
  );
}
```

## How It Works

1. Parse primary color → OKLCH (perceptually uniform color space)
2. Apply the **Butterfly Rule** — derive 17 semantic colors by shifting lightness, chroma, and hue
3. Auto-generate `onPrimary`, `onDanger`, etc. with WCAG AA contrast guarantee
4. Derive interactive states (hover, pressed, focused, disabled) per intent
5. Produce accessibility report with contrast ratios for all color pairs

## License

MIT
