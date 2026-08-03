/**
 * WalkWithMe — Types Index
 *
 * Single import point for all TypeScript types.
 *
 * Usage:
 *   import type { ChatMessage, ActiveTrip, UserProfile } from '@/types';
 */

export type * from './user.types';
export type * from './navigation.types';
export type * from './ai.types';
export type * from './api.types';

// Re-export non-type values from user.types
export { DEFAULT_FAVORITES } from './user.types';
