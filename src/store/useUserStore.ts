/**
 * WalkWithMe — User Store
 *
 * Manages user profile, language preference, voice settings, and dark mode.
 * Persisted to AsyncStorage via zustand/middleware.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Language, UserProfile, FavoritePlace } from '@/types';
import { STORAGE_KEYS, DEFAULT_FAVORITE_LABELS } from '@/constants';
import { safeStorage } from '@/utils';

// ── State Interface ────────────────────────────────────────────────────────

interface UserState {
  // Profile
  profile: UserProfile;

  // Favorites
  favorites: FavoritePlace[];

  // Actions
  updateLanguage: (language: Language) => void;
  toggleVoice: () => void;
  toggleDarkMode: () => void;
  updateDisplayName: (name: string) => void;

  // Favorites actions
  addFavorite: (favorite: FavoritePlace) => void;
  updateFavorite: (id: string, updates: Partial<FavoritePlace>) => void;
  removeFavorite: (id: string) => void;
  getFavoriteByLabel: (label: string) => FavoritePlace | undefined;
}

// ── Default profile ────────────────────────────────────────────────────────

const defaultProfile: UserProfile = {
  id: 'local-user',
  displayName: 'You',
  languagePreference: 'auto',
  voiceEnabled: true,
  darkMode: true, // Dark mode by default — easier to read outside
  createdAt: new Date().toISOString(),
};

const defaultFavorites: FavoritePlace[] = DEFAULT_FAVORITE_LABELS.map((f, index) => ({
  id: `default-${index}`,
  label: f.label,
  emoji: f.emoji,
  address: '',
  placeId: '',
  latitude: 0,
  longitude: 0,
}));

// ── Store ─────────────────────────────────────────────────────────────────

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      favorites: defaultFavorites,

      updateLanguage: (language) =>
        set((state) => ({
          profile: { ...state.profile, languagePreference: language },
        })),

      toggleVoice: () =>
        set((state) => ({
          profile: { ...state.profile, voiceEnabled: !state.profile.voiceEnabled },
        })),

      toggleDarkMode: () =>
        set((state) => ({
          profile: { ...state.profile, darkMode: !state.profile.darkMode },
        })),

      updateDisplayName: (name) =>
        set((state) => ({
          profile: { ...state.profile, displayName: name },
        })),

      addFavorite: (favorite) =>
        set((state) => ({
          favorites: [...state.favorites, favorite],
        })),

      updateFavorite: (id, updates) =>
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.id === id ? { ...f, ...updates } : f,
          ),
        })),

      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),

      getFavoriteByLabel: (label) =>
        get().favorites.find((f) => f.label.toLowerCase() === label.toLowerCase()),
    }),
    {
      name: STORAGE_KEYS.USER_PROFILE,
      storage: createJSONStorage(() => safeStorage),
      // Only persist these specific fields
      partialize: (state) => ({
        profile: state.profile,
        favorites: state.favorites,
      }),
    },
  ),
);
