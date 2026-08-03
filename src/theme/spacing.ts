/**
 * WalkWithMe — Spacing System
 *
 * Based on a 4px base unit. All spacing values are multiples of 4.
 * This creates a consistent visual rhythm across the entire app.
 */

export const spacing = {
  /** 2px — hairline, dividers */
  px: 1,
  '0.5': 2,
  /** 4px — micro gaps */
  1: 4,
  /** 6px */
  1.5: 6,
  /** 8px — small component internal spacing */
  2: 8,
  /** 10px */
  2.5: 10,
  /** 12px — compact padding */
  3: 12,
  /** 14px */
  3.5: 14,
  /** 16px — default padding */
  4: 16,
  /** 20px */
  5: 20,
  /** 24px — generous padding */
  6: 24,
  /** 28px */
  7: 28,
  /** 32px — section spacing */
  8: 32,
  /** 40px */
  10: 40,
  /** 48px — large section spacing */
  12: 48,
  /** 64px — screen-level padding */
  16: 64,
  /** 80px — hero spacing */
  20: 80,
  /** 96px */
  24: 96,
} as const;

export const borderRadius = {
  none: 0,
  /** 4px — subtle rounding */
  sm: 4,
  /** 8px — inputs, small cards */
  md: 8,
  /** 12px — cards */
  lg: 12,
  /** 16px — modals, large cards */
  xl: 16,
  /** 24px — companion message bubble */
  '2xl': 24,
  /** 32px — large pill buttons */
  '3xl': 32,
  /** 9999px — fully rounded (pills, avatars) */
  full: 9999,
} as const;

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** Very subtle, used for inner cards */
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  /** Standard card shadow */
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  /** Floating action button shadow */
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  /** AI companion bubble — glowing indigo shadow */
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  /** Danger / wrong turn */
  glowRose: {
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadow;
