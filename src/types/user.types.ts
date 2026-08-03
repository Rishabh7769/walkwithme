/**
 * WalkWithMe — User Types
 */

export type Language = 'auto' | 'en' | 'hi' | 'hinglish';

export interface UserProfile {
  id: string;
  displayName: string;
  languagePreference: Language;
  voiceEnabled: boolean;
  darkMode: boolean;
  createdAt: string;
}

export interface FavoritePlace {
  id: string;
  label: string;
  emoji: string;
  address: string;
  placeId: string;
  latitude: number;
  longitude: number;
}

/** Default favorites shown on home screen */
export const DEFAULT_FAVORITES: Omit<FavoritePlace, 'id' | 'placeId' | 'latitude' | 'longitude'>[] = [
  { label: 'Home', emoji: '🏠', address: '' },
  { label: 'Office', emoji: '🏢', address: '' },
  { label: 'Boyfriend', emoji: '❤️', address: '' },
  { label: 'Favourite Cafe', emoji: '☕', address: '' },
];
