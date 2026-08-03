/**
 * WalkWithMe — Navigation Store
 *
 * Manages the active trip state — origin, destination, steps,
 * current step index, GPS tracking, and on/off route status.
 *
 * This is the single source of truth for the Companion screen.
 */

import { create } from 'zustand';
import type { ActiveTrip, Coordinates, NavigationStep, TripStatus } from '@/types';

// ── State Interface ────────────────────────────────────────────────────────

interface NavigationState {
  // Current active trip (null when idle)
  activeTrip: ActiveTrip | null;

  // User's current GPS location
  currentLocation: Coordinates | null;

  // Whether location permission has been granted
  locationPermissionGranted: boolean;

  // Whether the AI companion is currently speaking
  isSpeaking: boolean;

  // Loading states
  isLoadingRoute: boolean;
  isRerouting: boolean;

  // Actions
  setActiveTrip: (trip: ActiveTrip) => void;
  updateCurrentLocation: (coordinates: Coordinates) => void;
  setCurrentLocation: (coordinates: Coordinates) => void;
  advanceToNextStep: () => void;
  setTripStatus: (status: TripStatus) => void;
  setOnRoute: (isOnRoute: boolean) => void;
  setIsOnRoute: (isOnRoute: boolean) => void;
  setLocationPermission: (granted: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsLoadingRoute: (loading: boolean) => void;
  setIsRerouting: (rerouting: boolean) => void;
  endTrip: () => void;
  reset: () => void;

  // Computed selectors (not reactive — call in component)
  getCurrentStep: () => NavigationStep | null;
  getRemainingSteps: () => number;
  getProgressPercent: () => number;
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useNavigationStore = create<NavigationState>()((set, get) => ({
  activeTrip: null,
  currentLocation: null,
  locationPermissionGranted: false,
  isSpeaking: false,
  isLoadingRoute: false,
  isRerouting: false,

  setActiveTrip: (trip) =>
    set({ activeTrip: trip, isLoadingRoute: false, isRerouting: false }),

  updateCurrentLocation: (coordinates) =>
    set({ currentLocation: coordinates }),

  setCurrentLocation: (coordinates) =>
    set({ currentLocation: coordinates }),

  advanceToNextStep: () =>
    set((state) => {
      if (!state.activeTrip) return state;
      const nextIndex = state.activeTrip.currentStepIndex + 1;
      const isLastStep = nextIndex >= state.activeTrip.steps.length;

      return {
        activeTrip: {
          ...state.activeTrip,
          currentStepIndex: isLastStep
            ? state.activeTrip.currentStepIndex
            : nextIndex,
          status: isLastStep ? 'completed' : 'active',
        },
      };
    }),

  setTripStatus: (status) =>
    set((state) => {
      if (!state.activeTrip) return state;
      return { activeTrip: { ...state.activeTrip, status } };
    }),

  setOnRoute: (isOnRoute) =>
    set((state) => {
      if (!state.activeTrip) return state;
      return { activeTrip: { ...state.activeTrip, isOnRoute } };
    }),

  setIsOnRoute: (isOnRoute) =>
    set((state) => {
      if (!state.activeTrip) return state;
      return { activeTrip: { ...state.activeTrip, isOnRoute } };
    }),

  setLocationPermission: (granted) =>
    set({ locationPermissionGranted: granted }),

  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),

  setIsLoadingRoute: (loading) => set({ isLoadingRoute: loading }),

  setIsRerouting: (rerouting) => set({ isRerouting: rerouting }),

  endTrip: () =>
    set((state) => {
      if (!state.activeTrip) return state;
      return {
        activeTrip: {
          ...state.activeTrip,
          status: 'cancelled',
        },
      };
    }),

  reset: () =>
    set({
      activeTrip: null,
      currentLocation: null,
      isSpeaking: false,
      isLoadingRoute: false,
      isRerouting: false,
    }),

  // ── Computed ─────────────────────────────────────────────────────────────

  getCurrentStep: () => {
    const { activeTrip } = get();
    if (!activeTrip) return null;
    return activeTrip.steps[activeTrip.currentStepIndex] ?? null;
  },

  getRemainingSteps: () => {
    const { activeTrip } = get();
    if (!activeTrip) return 0;
    return activeTrip.steps.length - activeTrip.currentStepIndex - 1;
  },

  getProgressPercent: () => {
    const { activeTrip } = get();
    if (!activeTrip || activeTrip.steps.length === 0) return 0;
    return Math.round(
      (activeTrip.currentStepIndex / activeTrip.steps.length) * 100,
    );
  },
}));
