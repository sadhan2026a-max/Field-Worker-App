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

export const colors = {
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
} as const;

export type AppColors = typeof colors;

// Main App Design Token compatibility
export const Colors = {
  light: {
    primary: palette.green,
    blackText: "#000",
    greenText: palette.green,
    whiteText: "#FFF",
    redText: "#DB4437",
    background: "#FFF",
    icon: "#000",
    tabIconDefault: "#687076",
    button: palette.green,
    track: palette.greenLight,
    pink: '#ff5862',
    gray: '#E8E6EA',
    recievedMessage: '#FFc4c4',
    sentMessage: '#ffc3d3',
  },
  dark: {
    primary: palette.green,
    blackText: "#000",
    greenText: palette.green,
    whiteText: "#FFF",
    redText: "#DB4437",
    background: "#FFF",
    icon: "#000",
    tabIconDefault: "#687076",
    button: palette.green,
    track: palette.greenLight,
    white: "#FFFFFF",
    pink: '#ff5862',
    gray: '#E8E6EA',
    recievedMessage: '#FFc4c4',
    sentMessage: '#ffc3d3',
  },
};
