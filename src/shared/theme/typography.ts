import { palette } from './colors';
import { FontFamily } from './FontFamily';
import { FontSize } from './FontSize';

export const typography = {
  h1: { fontSize: FontSize.extraLarge, fontFamily: FontFamily.bold, color: palette.grey900 },
  h2: { fontSize: FontSize.large, fontFamily: FontFamily.bold, color: palette.grey900 },
  h3: { fontSize: FontSize.medium, fontFamily: FontFamily.semiBold, color: palette.grey900 },
  body: { fontSize: FontSize.small, fontFamily: FontFamily.regular, color: palette.grey900 },
  bodyMedium: { fontSize: FontSize.small, fontFamily: FontFamily.medium, color: palette.grey900 },
  caption: { fontSize: FontSize.regular, fontFamily: FontFamily.regular, color: palette.grey500 },
  label: { fontSize: FontSize.extraSmall, fontFamily: FontFamily.medium, color: palette.grey500 },
};
