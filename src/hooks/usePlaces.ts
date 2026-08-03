/**
 * WalkWithMe — Instant Places Autocomplete Hook
 *
 * Provides real-time instant place prediction search as soon as 1 character is typed!
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPlacePredictions, getPlaceDetails, getNearbyLandmarks } from '@/services/maps';
import { useUserStore } from '@/store/useUserStore';
import type { Coordinates, PlacePrediction, PlaceDetailsResponse } from '@/types';

function useDebounce<T>(value: T, delayMs = 100): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook for Places Autocomplete predictions with instant 100ms response.
 */
export function usePlaceAutocomplete(query: string) {
  const debouncedQuery = useDebounce(query, 100);
  const { profile } = useUserStore();

  return useQuery<PlacePrediction[]>({
    queryKey: ['places', 'autocomplete', debouncedQuery, profile.languagePreference],
    queryFn: async ({ signal }) => {
      return getPlacePredictions(debouncedQuery, profile.languagePreference, signal);
    },
    enabled: debouncedQuery.trim().length >= 1,
    staleTime: 30 * 1000,
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
    staleTime: 10 * 60 * 1000,
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
