# Sidhahisab Design System
> Extracted from the main **sidhahisab** app — use this as the reference for the **rider** app.

---

## 🎨 Colors

### Brand / Primary

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#a64cf2` | Brand purple — buttons, headings, active states |
| `primaryDark` | `#8b3dcd` | Pressed / darker variant |
| `primaryLight` | `#f3e8ff` | Backgrounds, chips, tags |

### Palette (raw base colors)

| Name | Hex |
|---|---|
| `green` | `#1FA855` |
| `greenDark` | `#168A44` |
| `greenLight` | `#E7F7ED` |
| `blue` | `#2E7DF7` |
| `blueLight` | `#E9F1FF` |
| `orange` | `#F4A227` |
| `orangeLight` | `#FEF3E0` |
| `purple` | `#8B5CF6` |
| `purpleLight` | `#F1EBFE` |
| `red` | `#E44C4C` |
| `redLight` | `#FCEAEA` |
| `slate` | `#111827` |
| `white` | `#FFFFFF` |

### Greyscale

| Name | Hex |
|---|---|
| `grey900` | `#101828` |
| `grey700` | `#374151` |
| `grey500` | `#6B7280` |
| `grey300` | `#D1D5DB` |
| `grey200` | `#E5E7EB` |
| `grey100` | `#F3F4F6` |
| `grey50` | `#F9FAFB` |

### Semantic Color Tokens

| Token | Value | Hex |
|---|---|---|
| `background` | `grey50` | `#F9FAFB` |
| `surface` | `white` | `#FFFFFF` |
| `border` | `grey200` | `#E5E7EB` |
| `textPrimary` | `grey900` | `#101828` |
| `textSecondary` | `grey500` | `#6B7280` |
| `textInverse` | `white` | `#FFFFFF` |
| `info` | `blue` | `#2E7DF7` |
| `infoLight` | `blueLight` | `#E9F1FF` |
| `warning` | `orange` | `#F4A227` |
| `warningLight` | `orangeLight` | `#FEF3E0` |
| `accent` | `purple` | `#8B5CF6` |
| `accentLight` | `purpleLight` | `#F1EBFE` |
| `danger` | `red` | `#E44C4C` |
| `dangerLight` | `redLight` | `#FCEAEA` |

### Legacy Colors (from main app `Colors` object — kept for compatibility)

| Token | Hex |
|---|---|
| `blackText` | `#000000` |
| `whiteText` | `#FFFFFF` |
| `redText` | `#DB4437` |
| `button` | `#76CABB` (teal button) |
| `track` | `#FFE9F1` |
| `pink` | `#ff5862` |
| `gray` | `#E8E6EA` |
| `recievedMessage` | `#FFc4c4` |
| `sentMessage` | `#ffc3d3` |
| `tabIconDefault` | `#687076` |

### Status Colors (order/delivery status chips)

| Status | Text Color | Background |
|---|---|---|
| Pending | `#F4A227` | `#FEF3E0` |
| In Progress | `#2E7DF7` | `#E9F1FF` |
| Completed | `#1FA855` | `#E7F7ED` |
| Cancelled | `#E44C4C` | `#FCEAEA` |

### Toast / Notification Colors

| Type | Accent Bar | Title Color | Subtitle Color |
|---|---|---|---|
| Success | `#10b981` | `#1e293b` | `#64748b` |
| Error | `#ef4444` | `#1e293b` | `#64748b` |
| Info | `#3b82f6` | `#1e293b` | `#64748b` |

---

## 🔤 Fonts

### Font Family

The app uses the **Inter** font family with 4 weights:

| Token | Font Face Name |
|---|---|
| `FontFamily.regular` | `InterRegular` |
| `FontFamily.medium` | `InterMedium` |
| `FontFamily.semiBold` | `InterSemiBold` |
| `FontFamily.bold` | `InterBold` |

> **Note:** `SpaceMono` (`SpaceMono-Regular.ttf`) is also loaded in `_layout.tsx` but not used in design tokens.

### Font Sizes (responsive — % of screen width/height)

| Token | Helper | Approx. px (360px wide) |
|---|---|---|
| `FontSize.extraSmall` | `wp(3)` | ~10.8 px |
| `FontSize.regular` | `wp(3.5)` | ~12.6 px |
| `FontSize.small` | `wp(4)` | ~14.4 px |
| `FontSize.medium` | `wp(4.5)` | ~16.2 px |
| `FontSize.large` | `wp(5)` | ~18 px |
| `FontSize.extraLarge` | `hp(3.5)` | ~28 px (height-based) |

---

## 📐 Typography Styles (pre-composed)

| Style | Font Size Token | Font Family | Color |
|---|---|---|---|
| `h1` | `extraLarge` | `bold` | `grey900` #101828 |
| `h2` | `large` | `bold` | `grey900` #101828 |
| `h3` | `medium` | `semiBold` | `grey900` #101828 |
| `body` | `small` | `regular` | `grey900` #101828 |
| `bodyMedium` | `small` | `medium` | `grey900` #101828 |
| `caption` | `regular` | `regular` | `grey500` #6B7280 |
| `label` | `extraSmall` | `medium` | `grey500` #6B7280 |

---

## 📏 Spacing

| Token | Value (dp) |
|---|---|
| `spacing.xs` | 4 |
| `spacing.sm` | 8 |
| `spacing.md` | 12 |
| `spacing.lg` | 16 |
| `spacing.xl` | 20 |
| `spacing.xxl` | 24 |
| `spacing.xxxl` | 32 |

---

## 🔘 Border Radius

### Legacy tokens (`Borders`)

| Token | Value |
|---|---|
| `Borders.radius1` | 8 |
| `Borders.radius2` | 16 |
| `Borders.radius3` | 20 |
| `Borders.circle` | 90 (circular buttons / avatars) |

### New tokens (`radius`)

| Token | Value |
|---|---|
| `radius.sm` | 8 |
| `radius.md` | 12 |
| `radius.lg` | 16 |
| `radius.xl` | 20 |
| `radius.full` | 999 (pill shape) |

---

## 🧩 Component Style Reference

### Button (`RnButton`)

| Property | Value |
|---|---|
| Height | `hp(6.5)` |
| Width | `wp(92)` |
| Background | `#76CABB` (teal) |
| Border Radius | 90 (full circle) |
| Text Color | `#FFFFFF` |
| Text Font | `InterSemiBold` |
| Text Size | `FontSize.medium` -> wp(4.5) |
| Disabled BG | `gray` |
| Shadow | elevation 6, opacity 0.27 |

### Input (`RnInput`)

| Property | Value |
|---|---|
| Height | `hp(6.5)` |
| Border Color | `#ddd` |
| Border Width | 1.5 |
| Border Radius | 8 (`Borders.radius1`) |
| Text Size | `FontSize.small` -> wp(4) |
| Error Color | `#DB4437` |
| Error Size | `FontSize.extraSmall` -> wp(3) |
| Horizontal Padding | `wp(4)` |

### Header (`PrimaryHeader`)

| Property | Value |
|---|---|
| Title Font Size | `FontSize.extraLarge` -> hp(3.5) |
| Title Font Weight | `bold` |
| Title Color | `#a64cf2` (brand purple) |
| Left/Right Icon Color | `#DB4437` (redText) |
| Icon Button Size | `wp(9)` x `wp(9)` |
| Icon Button Radius | 90 (circle) |
| Vertical Padding | `hp(2)` |

---

## 📱 Dimension Helpers

```ts
import { Dimensions, PixelRatio, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// Width percentage -> pixels
export const wp = (widthPercent: number) =>
  PixelRatio.roundToNearestPixel(width * widthPercent / 100);

// Height percentage -> pixels
export const hp = (heightPercent: number) =>
  PixelRatio.roundToNearestPixel(height * heightPercent / 100);

export const isIos = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
```

---

## 🗂 Theme File Locations (Rider App)

All tokens live in `src/shared/theme/`:

| File | Exports |
|---|---|
| `colors.ts` | `palette`, `colors`, `Colors`, `AppColors` |
| `FontFamily.ts` | `FontFamily` |
| `FontSize.ts` | `FontSize` |
| `typography.ts` | `typography` |
| `spacing.ts` | `spacing`, `radius` |
| `Borders.ts` | `Borders` |
| `Dimensions.ts` | `wp`, `hp`, `widthSize`, `heightSize`, `isIos`, `isAndroid` |
| `index.ts` | Re-exports **all** of the above |

> **Single import for everything:**
> ```ts
> import { colors, FontFamily, FontSize, spacing, radius, typography, wp, hp, Borders } from '@/shared/theme';
> ```
