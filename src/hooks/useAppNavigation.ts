/**
 * WalkWithMe — App Navigation Hook
 *
 * Single source of truth for ALL navigation in the app.
 * No screen should call router.push() directly — use this hook instead.
 *
 * Benefits:
 * - Type-safe navigation
 * - Navigation side-effects (store updates) happen here, not in screens
 * - Easy to test (mock this hook in tests)
 * - Easy to change routes without touching every screen
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useChatStore } from '@/store/useChatStore';
import type { PlaceResult } from '@/types';

export function useAppNavigation() {
  const router = useRouter();
  const { setIsLoadingRoute, endTrip, reset } = useNavigationStore();
  const { clearMessages } = useChatStore();

  /**
   * Navigate to the Companion screen to start active navigation.
   * Always sets the destination in the store BEFORE navigating,
   * so Companion can read it immediately without a flash of empty state.
   */
  const startTrip = useCallback(
    (destination: PlaceResult) => {
      setIsLoadingRoute(true);
      // Navigation store will be populated by the route service in M4.
      // For now, we signal loading and navigate — the companion screen
      // will display a loading state while the route is being fetched.
      router.push({
        pathname: '/(app)/companion',
        params: {
          destinationName: destination.name,
          destinationPlaceId: destination.placeId,
          destinationAddress: destination.address,
        },
      });
    },
    [router, setIsLoadingRoute],
  );

  /**
   * Navigate to the Chat screen from Companion.
   * Passes the current trip context so the AI knows what's happening.
   */
  const openChat = useCallback(() => {
    router.push('/(app)/chat');
  }, [router]);

  /**
   * Navigate back from Chat to Companion.
   */
  const backToCompanion = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/companion');
    }
  }, [router]);

  /**
   * End the active trip and return to Home.
   * Clears trip state from the store.
   */
  const goHome = useCallback(() => {
    endTrip();
    router.replace('/(app)/home');
  }, [router, endTrip]);

  /**
   * End the trip AND clear chat history (used when user taps "New Trip").
   */
  const startFresh = useCallback(() => {
    reset();
    clearMessages();
    router.replace('/(app)/home');
  }, [router, reset, clearMessages]);

  /**
   * Navigate to Settings.
   */
  const openSettings = useCallback(() => {
    router.push('/(app)/settings');
  }, [router]);

  /**
   * Go back one screen. Falls back to Home if no history.
   */
  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/home');
    }
  }, [router]);

  return {
    startTrip,
    openChat,
    backToCompanion,
    goHome,
    startFresh,
    openSettings,
    goBack,
  };
}
