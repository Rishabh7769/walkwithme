/**
 * WalkWithMe — Safe Cross-Platform Storage Adapter
 *
 * Provides a universal storage engine for Zustand persistence that safely handles:
 * - Native Android & iOS (AsyncStorage)
 * - Web Browsers (window.localStorage)
 * - Environments where native storage modules are null/undefined
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const inMemoryStorage = new Map<string, string>();

export const safeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(name);
        }
      } catch (error) {
        // Ignore localStorage error
      }
      return inMemoryStorage.get(name) ?? null;
    }

    try {
      const value = await AsyncStorage.getItem(name);
      return value;
    } catch (error) {
      return inMemoryStorage.get(name) ?? null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(name, value);
          return;
        }
      } catch (error) {
        // Ignore localStorage error
      }
      inMemoryStorage.set(name, value);
      return;
    }

    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      inMemoryStorage.set(name, value);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(name);
          return;
        }
      } catch (error) {
        // Ignore localStorage error
      }
      inMemoryStorage.delete(name);
      return;
    }

    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      inMemoryStorage.delete(name);
    }
  },
};
