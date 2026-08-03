/**
 * WalkWithMe — API Constants
 *
 * All API URLs and endpoint paths.
 * The base URL comes from environment variables — never hardcoded.
 */

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

/** Backend base URL — set in .env.local as EXPO_PUBLIC_API_BASE_URL */
export const API_BASE_URL: string =
  (process.env.EXPO_PUBLIC_API_BASE_URL as string) ??
  extra.apiBaseUrl ??
  'http://localhost:8000';

/** Google Maps API Key — set in .env.local as EXPO_PUBLIC_GOOGLE_MAPS_KEY */
export const GOOGLE_MAPS_KEY: string =
  (process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY as string) ??
  extra.googleMapsKey ??
  '';

// ── API Route Paths ────────────────────────────────────────────────────────

export const API_PATHS = {
  // Places
  PLACES_AUTOCOMPLETE: '/api/v1/places/autocomplete',
  PLACES_DETAILS: '/api/v1/places/details',
  PLACES_NEARBY: '/api/v1/places/nearby',

  // Navigation
  NAVIGATION_ROUTE: '/api/v1/navigation/route',
  NAVIGATION_STEP_GUIDANCE: '/api/v1/navigation/step/guidance',
  NAVIGATION_REPLAN: '/api/v1/navigation/replan',

  // AI
  AI_CHAT: '/api/v1/ai/chat',
  AI_COMPANION: '/api/v1/ai/companion',
  AI_ANALYZE_IMAGE: '/api/v1/ai/analyze-image',
  AI_VISION: '/api/v1/ai/analyze-image',

  // Users
  USERS_ME: '/api/v1/users/me',
  USERS_FAVORITES: '/api/v1/users/me/favorites',
  USERS_TRIPS: '/api/v1/users/me/trips',
} as const;

/** Google Places Autocomplete URL (called directly, not via backend) */
export const GOOGLE_PLACES_AUTOCOMPLETE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json';

/** Google Places Details URL */
export const GOOGLE_PLACES_DETAILS_URL =
  'https://maps.googleapis.com/maps/api/place/details/json';
