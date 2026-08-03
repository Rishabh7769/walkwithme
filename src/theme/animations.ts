/**
 * WalkWithMe — Animation Constants
 *
 * All animations are gentle and purposeful.
 * Never flashy. The user is often anxious — animations should calm, not startle.
 */

export const duration = {
  /** Instant — for opacity flips */
  instant: 100,
  /** Fast — micro interactions */
  fast: 150,
  /** Normal — most transitions */
  normal: 250,
  /** Slow — page transitions, companion message appear */
  slow: 400,
  /** Gentle — breathing animations, pulse */
  gentle: 800,
  /** Very gentle — splash, loading */
  veryGentle: 1200,
} as const;

export const easing = {
  /** Standard ease-out — most UI transitions */
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  /** Spring feel — button presses */
  spring: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number],
  /** Linear — progress bars */
  linear: [0, 0, 1, 1] as [number, number, number, number],
  /** Ease in-out — modal/drawer */
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;
