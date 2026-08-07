export const palette = {
  green: '#1FA855',
  greenDark: '#168A44',
  greenLight: '#E7F7ED',
  blue: '#2E7DF7',
  blueLight: '#E9F1FF',
  orange: '#F4A227',
  orangeLight: '#FEF3E0',
  purple: '#8B5CF6',
  purpleLight: '#F1EBFE',
  red: '#E44C4C',
  redLight: '#FCEAEA',
  slate: '#111827',
  white: '#FFFFFF',
  grey900: '#101828',
  grey700: '#374151',
  grey500: '#6B7280',
  grey300: '#D1D5DB',
  grey200: '#E5E7EB',
  grey100: '#F3F4F6',
  grey50: '#F9FAFB',
} as const;

export const lightColors = {
  primary: palette.green,
  primaryDark: palette.greenDark,
  primaryLight: palette.greenLight,

  background: '#FFFFFF',
  surface: palette.white,
  border: palette.grey200,

  textPrimary: palette.grey900,
  textSecondary: palette.grey500,
  textInverse: palette.white,

  info: palette.blue,
  infoLight: palette.blueLight,
  warning: palette.orange,
  warningLight: palette.orangeLight,
  accent: palette.purple,
  accentLight: palette.purpleLight,
  danger: palette.red,
  dangerLight: palette.redLight,

  status: {
    pending: { text: palette.orange, bg: palette.orangeLight },
    accepted: { text: palette.purple, bg: palette.purpleLight },
    enRoute: { text: palette.blue, bg: palette.blueLight },
    arrived: { text: palette.grey700, bg: palette.grey100 },
    inProgress: { text: palette.blue, bg: palette.blueLight },
    completed: { text: palette.green, bg: palette.greenLight },
    cancelled: { text: palette.red, bg: palette.redLight },
  },
};

export const darkColors = {
  ...lightColors,
  background: '#121212',
  surface: '#1E1E1E',
  border: '#333333',

  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textInverse: '#000000',

  primaryLight: '#0d4a25',
  infoLight: '#0b2b5e',
  warningLight: '#5c3905',
  accentLight: '#321f5e',
  dangerLight: '#571818',

  status: {
    pending: { text: '#ffcc80', bg: '#5c3905' },
    accepted: { text: '#d1c4e9', bg: '#321f5e' },
    enRoute: { text: '#90caf9', bg: '#0b2b5e' },
    arrived: { text: '#e0e0e0', bg: '#424242' },
    inProgress: { text: '#90caf9', bg: '#0b2b5e' },
    completed: { text: '#a5d6a7', bg: '#0d4a25' },
    cancelled: { text: '#ef9a9a', bg: '#571818' },
  },
};

// Keeping 'colors' export pointing to lightColors to avoid breaking files that haven't been refactored yet.
export const colors = lightColors;

export type AppColors = {
  [K in keyof typeof lightColors]: any;
};
