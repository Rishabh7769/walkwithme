/**
 * WalkWithMe — Typography System
 *
 * Using Inter — Google's most legible screen font.
 * Designed for calm readability. Large AI messages must be
 * impossible to misread, even while walking.
 */

export const fontFamily = {
  // Inter variants loaded via expo-font + @expo-google-fonts/inter
  thin: 'Inter_100Thin',
  extraLight: 'Inter_200ExtraLight',
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
} as const;

export const fontSize = {
  // xs → 11px   — Labels, badges, timestamps
  xs: 11,
  // sm → 13px   — Secondary body, captions
  sm: 13,
  // md → 15px   — Primary body text (default)
  md: 15,
  // lg → 17px   — Slightly emphasized body
  lg: 17,
  // xl → 20px   — Section headers
  xl: 20,
  // '2xl' → 24px  — Screen titles
  '2xl': 24,
  // '3xl' → 30px  — Large headings
  '3xl': 30,
  // '4xl' → 36px  — Hero text (home screen "Where do you want to go?")
  '4xl': 36,
  // '5xl' → 44px  — AI companion message (MUST be large & readable while walking)
  '5xl': 44,
  // '6xl' → 52px  — Splash / very large display
  '6xl': 52,
} as const;

export const fontWeight = {
  thin: '100' as const,
  extraLight: '200' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
  loose: 1.85,
} as const;

export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.6,
} as const;

// ── Semantic text styles ─────────────────────────────────────────────────────
// Used directly in components for consistent typography

export const textStyles = {
  /** Splash screen app name */
  splashTitle: {
    fontFamily: fontFamily.black,
    fontSize: fontSize['5xl'],
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize['5xl'] * lineHeight.tight,
  },

  /** Home screen "Where do you want to go?" */
  heroHeading: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize['3xl'] * lineHeight.snug,
  },

  /** AI companion message — must be readable while walking */
  companionMessage: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize['3xl'],
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize['3xl'] * lineHeight.relaxed,
  },

  /** AI companion sub-message */
  companionStatus: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.lg * lineHeight.relaxed,
  },

  /** Screen titles */
  screenTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize['2xl'] * lineHeight.snug,
  },

  /** Section headers */
  sectionHeader: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    letterSpacing: letterSpacing.normal,
  },

  /** Primary body */
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.md * lineHeight.normal,
  },

  /** Body medium weight */
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.md * lineHeight.normal,
  },

  /** Chat messages */
  chatMessage: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.lg * lineHeight.relaxed,
  },

  /** Labels, chips */
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },

  /** Captions, timestamps */
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.xs * lineHeight.relaxed,
  },

  /** Button text */
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    letterSpacing: letterSpacing.wide,
  },

  /** Large button */
  buttonLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    letterSpacing: letterSpacing.normal,
  },
} as const;

export type TextStyleKey = keyof typeof textStyles;
