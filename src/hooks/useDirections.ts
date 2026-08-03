/**
 * WalkWithMe — React Query Hooks for Directions
 *
 * Provides useFetchRoute and useReplanRoute hooks.
 * Automatically updates useNavigationStore upon successful route generation.
 */

import { useMutation } from '@tanstack/react-query';
import { getWalkingDirections, type GetDirectionsParams } from '@/services/maps';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUserStore } from '@/store/useUserStore';
import type { ActiveTrip } from '@/types';

/**
 * Mutation hook for requesting walking directions.
 * Automatically sets activeTrip in useNavigationStore.
 */
export function useFetchRoute() {
  const { setActiveTrip, setIsLoadingRoute } = useNavigationStore();
  const { profile } = useUserStore();

  return useMutation<ActiveTrip, Error, Omit<GetDirectionsParams, 'language'>>({
    mutationFn: async (params) => {
      setIsLoadingRoute(true);
      const trip = await getWalkingDirections({
        ...params,
        language: profile.languagePreference,
      });
      return trip;
    },
    onSuccess: (trip) => {
      setActiveTrip(trip);
      setIsLoadingRoute(false);
    },
    onError: (error) => {
      console.warn('[useFetchRoute] Error fetching route:', error);
      setIsLoadingRoute(false);
    },
  });
}

/**
 * Mutation hook for recalculating a route after taking a wrong turn.
 */
export function useReplanRoute() {
  const { setActiveTrip, setIsRerouting } = useNavigationStore();
  const { profile } = useUserStore();

  return useMutation<ActiveTrip, Error, Omit<GetDirectionsParams, 'language'>>({
    mutationFn: async (params) => {
      setIsRerouting(true);
      const trip = await getWalkingDirections({
        ...params,
        language: profile.languagePreference,
      });
      return trip;
    },
    onSuccess: (trip) => {
      setActiveTrip({
        ...trip,
        status: 'active',
      });
      setIsRerouting(false);
    },
    onError: (error) => {
      console.warn('[useReplanRoute] Error replanning route:', error);
      setIsRerouting(false);
    },
  });
}
