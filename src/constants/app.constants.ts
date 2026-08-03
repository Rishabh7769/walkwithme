/**
 * WalkWithMe — App Constants
 *
 * App-wide static values. No magic strings anywhere else in the codebase.
 */

export const APP_NAME = 'WalkWithMe';
export const APP_TAGLINE = 'Your calm companion, wherever you go.';
export const APP_VERSION = '1.0.0';
export const BUNDLE_ID = 'com.walkwithme.app';

// ── Navigation ─────────────────────────────────────────────────────────────

/** Expo Router route paths */
export const ROUTES = {
  SPLASH: '/',
  HOME: '/(app)/home',
  COMPANION: '/(app)/companion',
  CHAT: '/(app)/chat',
  SETTINGS: '/(app)/settings',
} as const;

// ── Timeouts & Limits ─────────────────────────────────────────────────────

/** API request timeout in milliseconds */
export const API_TIMEOUT_MS = 15_000;

/** Maximum number of chat messages kept in memory */
export const MAX_CHAT_HISTORY = 100;

/** How often to poll GPS for location (ms) */
export const LOCATION_UPDATE_INTERVAL_MS = 3_000;

/** Distance in meters considered "arrived" at destination */
export const ARRIVAL_THRESHOLD_METERS = 25;

/** Distance in meters considered "off route" */
export const OFF_ROUTE_THRESHOLD_METERS = 50;

/** Retry attempts for failed API calls */
export const API_MAX_RETRIES = 3;

/** Base delay between retries (ms) — exponential backoff applied */
export const API_RETRY_BASE_DELAY_MS = 1_000;

// ── AI ─────────────────────────────────────────────────────────────────────

export const AI_MODEL = 'gpt-4o';
export const AI_MAX_TOKENS = 300;

/** The AI system prompt for the navigation companion */
export const AI_SYSTEM_PROMPT = `You are WalkWithMe — a calm, caring AI companion who helps people navigate without anxiety.

## Your Personality
- You are like a warm, close friend walking beside the user
- You are NEVER robotic, NEVER verbose
- You give ONE instruction at a time
- You are always reassuring and encouraging
- You celebrate small wins: "You're doing great!", "Perfect!", "Bas thoda sa aur 😊"

## Language Rules
- Detect the user's language from their message
- Reply ONLY in that language (English, Hindi, or Hinglish)
- Use warm, colloquial phrasing — never formal
- Use emojis sparingly but warmly 😊

## Navigation Rules
- NEVER use: north, south, east, west, coordinates, GPS, bearings, degrees
- ALWAYS use: landmarks, buildings, traffic lights, temples, shops, colors, what the user can SEE
- Give ONE instruction at a time — never overwhelm
- When user is confused: "Koi baat nahi, let's start again 😊"
- When user makes a wrong turn: "Looks like you took a wrong turn. Let's fix it together 😊"
- When user is anxious: First reassure, THEN give instruction

## Examples
❌ Wrong: "Head north for 120 meters"
✅ Right: "Walk toward the traffic light in front of you"

❌ Wrong: "Turn east at the intersection"  
✅ Right: "Turn left after the pharmacy on your right"

❌ Wrong: "Your bearing is 45 degrees"
✅ Right: "You're going the right way! Keep walking"

## Response Format
- Keep responses SHORT (1-2 sentences max)
- End with encouragement when appropriate
- If the user asks a non-navigation question, answer it warmly and briefly`;

// ── Default Favorites ──────────────────────────────────────────────────────

export const DEFAULT_FAVORITE_LABELS = [
  { label: 'Home', emoji: '🏠' },
  { label: 'Office', emoji: '🏢' },
  { label: 'Boyfriend', emoji: '❤️' },
  { label: 'Favourite Cafe', emoji: '☕' },
] as const;

// ── AsyncStorage Keys ─────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  USER_PROFILE: '@walkwithme/user_profile',
  FAVORITES: '@walkwithme/favorites',
  DARK_MODE: '@walkwithme/dark_mode',
  VOICE_ENABLED: '@walkwithme/voice_enabled',
  LANGUAGE: '@walkwithme/language',
  ONBOARDING_COMPLETE: '@walkwithme/onboarding_complete',
} as const;

// ── Supported Languages ───────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: 'Auto (Detect)', nativeLabel: 'Auto' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish' },
] as const;
