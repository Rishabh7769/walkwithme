/**
 * WalkWithMe — Central Color System
 *
 * Philosophy: Calming, warm, trustworthy. Never harsh or alarming.
 * The palette evokes the feeling of a gentle friend, not a robotic app.
 *
 * Primary: Soft indigo-violet (calm, trustworthy, modern)
 * Accent:  Warm amber (attention, warmth, encouragement)
 * Success: Soft teal-green (reassurance, "you're on track")
 * Error:   Soft rose (gentle alert, not panic)
 */

export const palette = {
  // Indigo — Primary brand color
  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo200: '#C7D2FE',
  indigo300: '#A5B4FC',
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',
  indigo800: '#3730A3',
  indigo900: '#312E81',
  indigo950: '#1E1B4B',

  // Violet — Secondary / AI messages
  violet50: '#F5F3FF',
  violet100: '#EDE9FE',
  violet200: '#DDD6FE',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet600: '#7C3AED',
  violet700: '#6D28D9',
  violet800: '#5B21B6',
  violet900: '#4C1D95',
  violet950: '#2E1065',

  // Amber — Warmth / encouragement
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber300: '#FCD34D',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',

  // Teal — Success / correct path
  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal200: '#99F6E4',
  teal400: '#2DD4BF',
  teal500: '#14B8A6',
  teal600: '#0D9488',

  // Rose — Gentle error / wrong turn
  rose50: '#FFF1F2',
  rose100: '#FFE4E6',
  rose300: '#FDA4AF',
  rose500: '#F43F5E',
  rose600: '#E11D48',

  // Neutrals — Dark mode first
  neutral950: '#0A0A0F',
  neutral900: '#111118',
  neutral850: '#16161E',
  neutral800: '#1C1C28',
  neutral750: '#232330',
  neutral700: '#2D2D3D',
  neutral600: '#3D3D52',
  neutral500: '#6B6B80',
  neutral400: '#9898A8',
  neutral300: '#C0C0CC',
  neutral200: '#DDDDE6',
  neutral100: '#EFEFF5',
  neutral50: '#F8F8FC',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const colors = {
  // ── Brand ─────────────────────────────────────────────
  primary: palette.indigo500,
  primaryLight: palette.indigo400,
  primaryDark: palette.indigo700,
  primarySubtle: palette.indigo100,

  secondary: palette.violet500,
  secondaryLight: palette.violet400,
  secondaryDark: palette.violet700,
  secondarySubtle: palette.violet100,

  accent: palette.amber400,
  accentLight: palette.amber300,
  accentDark: palette.amber600,

  // ── Semantic ───────────────────────────────────────────
  success: palette.teal500,
  successLight: palette.teal400,
  successSubtle: palette.teal50,
  successText: palette.teal600,

  error: palette.rose500,
  errorLight: palette.rose300,
  errorSubtle: palette.rose50,
  errorText: palette.rose600,

  warning: palette.amber500,
  warningSubtle: palette.amber50,

  // ── AI Message Colors ──────────────────────────────────
  aiMessage: palette.violet50,
  aiMessageBorder: palette.violet200,
  aiMessageText: palette.violet900,

  // ── Dark Mode Surfaces ─────────────────────────────────
  dark: {
    background: palette.neutral950,
    surface: palette.neutral900,
    surfaceElevated: palette.neutral850,
    card: palette.neutral800,
    cardHover: palette.neutral750,
    border: palette.neutral700,
    borderSubtle: palette.neutral800,
    divider: palette.neutral800,

    text: palette.neutral50,
    textSecondary: palette.neutral300,
    textTertiary: palette.neutral500,
    textDisabled: palette.neutral600,
    textInverse: palette.neutral950,

    placeholder: palette.neutral600,

    aiMessage: palette.neutral800,
    aiMessageBorder: palette.indigo800,
    aiMessageText: palette.indigo300,
  },

  // ── Light Mode Surfaces ────────────────────────────────
  light: {
    background: palette.neutral50,
    surface: palette.white,
    surfaceElevated: palette.white,
    card: palette.white,
    cardHover: palette.neutral100,
    border: palette.neutral200,
    borderSubtle: palette.neutral100,
    divider: palette.neutral100,

    text: palette.neutral950,
    textSecondary: palette.neutral600,
    textTertiary: palette.neutral400,
    textDisabled: palette.neutral300,
    textInverse: palette.white,

    placeholder: palette.neutral400,

    aiMessage: palette.violet50,
    aiMessageBorder: palette.violet200,
    aiMessageText: palette.violet900,
  },

  // ── Gradients (used as arrays for LinearGradient) ─────
  gradients: {
    primary: [palette.indigo500, palette.violet600] as [string, string],
    primarySubtle: [palette.indigo50, palette.violet50] as [string, string],
    warmth: [palette.amber400, palette.rose500] as [string, string],
    success: [palette.teal400, palette.indigo500] as [string, string],
    darkBackground: [palette.neutral950, palette.neutral900] as [string, string],
    splash: [palette.indigo950, palette.violet950] as [string, string],
    card: [palette.neutral900, palette.neutral850] as [string, string],
  },
} as const;

export type ColorKey = keyof typeof colors;
