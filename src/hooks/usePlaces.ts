/**
 * WalkWithMe — React Query Hooks for Google Places
 *
 * Hooks:
 * - usePlaceAutocomplete: Debounced predictions search
 * - usePlaceDetails: Fetch place details by placeId
 * - useNearbyLandmarks: Fetch landmarks surrounding current location
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPlacePredictions, getPlaceDetails, getNearbyLandmarks } from '@/services/maps';
import { useUserStore } from '@/store/useUserStore';
import type { Coordinates, PlacePrediction, PlaceDetailsResponse } from '@/types';

/**
 * Custom debounced value hook
 */
function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook for Google Places Autocomplete predictions with debouncing.
 */
export function usePlaceAutocomplete(query: string) {
  const debouncedQuery = useDebounce(query, 300);
  const { profile } = useUserStore();

  return useQuery<PlacePrediction[]>({
    queryKey: ['places', 'autocomplete', debouncedQuery, profile.languagePreference],
    queryFn: async ({ signal }) => {
      return getPlacePredictions(debouncedQuery, profile.languagePreference, signal);
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}

/**
 * Hook for fetching full details for a place_id.
 */
export function usePlaceDetails(placeId: string | null) {
  const { profile } = useUserStore();

  return useQuery<PlaceDetailsResponse | null>({
    queryKey: ['places', 'details', placeId, profile.languagePreference],
    queryFn: async () => {
      if (!placeId) return null;
      return getPlaceDetails(placeId, profile.languagePreference);
    },
    enabled: Boolean(placeId),
    staleTime: 10 * 60 * 1000, // Cache details for 10 minutes
  });
}

/**
 * Hook for fetching nearby landmarks for AI guidance context.
 */
export function useNearbyLandmarks(coordinates: Coordinates | null) {
  return useQuery<string[]>({
    queryKey: ['places', 'nearby', coordinates?.latitude, coordinates?.longitude],
    queryFn: async () => {
      if (!coordinates) return [];
      return getNearbyLandmarks(coordinates);
    },
    enabled: Boolean(coordinates),
    staleTime: 5 * 60 * 1000,
  });
}
