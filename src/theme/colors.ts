/**
 * WalkWithMe — Luxury Gold & Emerald Dark Design System (NO BLUE)
 *
 * Theme Philosophy:
 * - Primary: Vivid Emerald Jade (#10B981, #059669) & Champagne Gold (#F59E0B, #D97706)
 * - Surfaces: Rich Midnight Obsidian (#08090D, #11131C, #1A1C29)
 * - Accent: Coral Rose (#F43F5E) & Warm Amber (#FBBF24)
 * - ZERO BLUE elements anywhere!
 */

export const palette = {
  // Emerald Jade
  emerald300: '#6EE7B7',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald950: '#022C22',

  // Champagne Gold & Warm Amber
  gold300: '#FDE68A',
  gold400: '#FBBF24',
  gold500: '#F59E0B',
  gold600: '#D97706',
  gold700: '#B45309',

  // Coral Rose & Sunset Warmth
  rose400: '#FB7185',
  rose500: '#F43F5E',
  rose600: '#E11D48',

  // Midnight Obsidian Neutrals (NO BLUE)
  obsidian950: '#08090D',
  obsidian900: '#11131C',
  obsidian850: '#181A26',
  obsidian800: '#202333',
  obsidian750: '#2A2D40',
  obsidian700: '#363952',
  obsidian600: '#4D506B',
  obsidian400: '#9497B0',
  obsidian300: '#C2C5DC',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const colors = {
  primary: palette.emerald500,
  primaryLight: palette.emerald400,
  primaryDark: palette.emerald700,

  secondary: palette.gold500,
  secondaryLight: palette.gold400,
  secondaryDark: palette.gold700,

  accent: palette.gold400,

  success: palette.emerald500,
  successLight: palette.emerald400,
  successText: palette.emerald400,

  error: palette.rose500,
  errorLight: palette.rose400,
  errorText: palette.rose500,

  warning: palette.gold500,

  dark: {
    background: palette.obsidian950,
    surface: palette.obsidian900,
    surfaceElevated: palette.obsidian850,
    card: palette.obsidian800,
    cardHover: palette.obsidian750,
    border: 'rgba(245, 158, 11, 0.3)', // Gold Champagne Border
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    divider: 'rgba(255, 255, 255, 0.08)',

    text: palette.white,
    textSecondary: palette.obsidian300,
    textTertiary: palette.obsidian400,
    textDisabled: palette.obsidian600,
    textInverse: palette.obsidian950,

    placeholder: 'rgba(194, 197, 220, 0.4)',

    aiMessage: palette.obsidian800,
    aiMessageBorder: 'rgba(16, 185, 129, 0.3)',
    aiMessageText: palette.emerald300,
  },

  light: {
    background: palette.obsidian950,
    surface: palette.obsidian900,
    surfaceElevated: palette.obsidian850,
    card: palette.obsidian800,
    cardHover: palette.obsidian750,
    border: 'rgba(245, 158, 11, 0.3)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    divider: 'rgba(255, 255, 255, 0.08)',

    text: palette.white,
    textSecondary: palette.obsidian300,
    textTertiary: palette.obsidian400,
    textDisabled: palette.obsidian600,
    textInverse: palette.obsidian950,

    placeholder: 'rgba(194, 197, 220, 0.4)',

    aiMessage: palette.obsidian800,
    aiMessageBorder: 'rgba(16, 185, 129, 0.3)',
    aiMessageText: palette.emerald300,
  },

  gradients: {
    primary: [palette.emerald500, palette.gold500] as [string, string],
    primarySubtle: ['rgba(16,185,129,0.15)', 'rgba(245,158,11,0.15)'] as [string, string],
    goldGlow: [palette.gold500, palette.gold700] as [string, string],
    emeraldGlow: [palette.emerald400, palette.emerald600] as [string, string],
    warmth: [palette.gold400, palette.rose500] as [string, string],
    success: [palette.emerald400, palette.emerald600] as [string, string],
    darkBackground: [palette.obsidian950, palette.obsidian900] as [string, string],
    splash: [palette.obsidian950, palette.emerald950] as [string, string],
    card: ['rgba(32,35,51,0.95)', 'rgba(24,26,38,0.95)'] as [string, string],
  },
} as const;

export type ColorKey = keyof typeof colors;
