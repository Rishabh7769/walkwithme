/**
 * WalkWithMe — Theme Index
 *
 * Single import point for the entire design system.
 * Never import directly from sub-files in components — always import from here.
 *
 * Usage:
 *   import { colors, spacing, textStyles, borderRadius } from '@/theme';
 */

export { colors, palette } from './colors';
export type { ColorKey } from './colors';

export {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
} from './typography';
export type { TextStyleKey } from './typography';

export { spacing, borderRadius, shadow } from './spacing';
export type { SpacingKey, BorderRadiusKey, ShadowKey } from './spacing';

export { duration, easing } from './animations';
