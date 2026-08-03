/**
 * WalkWithMe — Modern Electric Glassmorphic Color Palette
 */

export const palette = {
  cyan400: '#38BDF8',
  cyan500: '#00F2FE',
  blue500: '#4FACFE',
  blue600: '#2563EB',

  purple500: '#8B5CF6',
  purple600: '#7C3AED',
  purple900: '#4C1D95',
  purple950: '#1E1B4B',

  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',

  amber400: '#FBBF24',
  amber500: '#F59E0B',
  rose300: '#FDA4AF',
  rose500: '#F43F5E',
  rose600: '#E11D48',

  darkBg: '#0A0B10',
  darkSurface: '#12131C',
  darkCard: '#1A1C28',
  darkCardHover: '#232536',
  darkBorder: 'rgba(99, 102, 241, 0.25)',
  darkBorderSubtle: 'rgba(255, 255, 255, 0.08)',

  textPrimary: '#FFFFFF',
  textSecondary: '#C0C0CC',
  textMuted: '#858599',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const colors = {
  primary: palette.cyan500,
  primaryLight: palette.cyan400,
  primaryDark: palette.blue600,

  secondary: palette.purple500,
  secondaryLight: palette.purple500,
  secondaryDark: palette.purple900,

  accent: palette.amber400,

  success: palette.emerald500,
  successLight: palette.emerald400,
  successText: palette.emerald400,

  error: palette.rose500,
  errorLight: palette.rose300,
  errorText: palette.rose500,

  warning: palette.amber500,

  dark: {
    background: palette.darkBg,
    surface: palette.darkSurface,
    surfaceElevated: palette.darkCard,
    card: palette.darkCard,
    cardHover: palette.darkCardHover,
    border: palette.darkBorder,
    borderSubtle: palette.darkBorderSubtle,
    divider: palette.darkBorderSubtle,

    text: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textTertiary: palette.textMuted,
    textDisabled: '#4A4A5A',
    textInverse: palette.darkBg,

    placeholder: 'rgba(192, 192, 204, 0.4)',

    aiMessage: palette.darkCard,
    aiMessageBorder: palette.darkBorder,
    aiMessageText: palette.cyan400,
  },

  light: {
    background: palette.darkBg,
    surface: palette.darkSurface,
    surfaceElevated: palette.darkCard,
    card: palette.darkCard,
    cardHover: palette.darkCardHover,
    border: palette.darkBorder,
    borderSubtle: palette.darkBorderSubtle,
    divider: palette.darkBorderSubtle,

    text: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textTertiary: palette.textMuted,
    textDisabled: '#4A4A5A',
    textInverse: palette.darkBg,

    placeholder: 'rgba(192, 192, 204, 0.4)',

    aiMessage: palette.darkCard,
    aiMessageBorder: palette.darkBorder,
    aiMessageText: palette.cyan400,
  },

  gradients: {
    primary: [palette.cyan500, palette.blue500] as [string, string],
    primarySubtle: ['rgba(0,242,254,0.15)', 'rgba(79,172,254,0.15)'] as [string, string],
    purpleNeon: [palette.purple600, palette.cyan500] as [string, string],
    warmth: [palette.amber400, palette.rose500] as [string, string],
    success: [palette.emerald400, palette.cyan500] as [string, string],
    darkBackground: [palette.darkBg, palette.darkSurface] as [string, string],
    splash: [palette.purple950, palette.darkBg] as [string, string],
    card: ['rgba(26,28,40,0.9)', 'rgba(18,19,28,0.9)'] as [string, string],
  },
} as const;

export type ColorKey = keyof typeof colors;
