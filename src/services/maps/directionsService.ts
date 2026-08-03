/**
 * WalkWithMe — Free Walking Directions Service (OSRM & Google Directions)
 *
 * Provides 100% FREE real-world walking routes worldwide using OSRM Foot Routing Engine,
 * requiring NO API keys, NO credit cards, and NO payments!
 */

import axios from 'axios';
import { GOOGLE_MAPS_KEY } from '@/constants';
import type { ActiveTrip, PlaceResult, Coordinates, NavigationStep } from '@/types';
import { parseGoogleSteps } from './stepParser';
import { createMockTrip, toGoogleMapsLanguage } from '@/utils';

export interface GetDirectionsParams {
  origin: PlaceResult | Coordinates;
  destination: PlaceResult;
  language?: string;
}

const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const OSRM_FOOT_ROUTE_URL = 'https://router.project-osrm.org/route/v1/foot';

// ── Helper to convert OSRM step maneuvers into Google-like raw steps ──────

function convertOSRMStepToRaw(osrmStep: any): any {
  const distance = osrmStep.distance ?? 50;
  const duration = osrmStep.duration ?? 30;
  const name = osrmStep.name ? `on ${osrmStep.name}` : '';
  const modifier = osrmStep.maneuver?.modifier ?? '';
  const type = osrmStep.maneuver?.type ?? 'turn';

  let rawInstruction = `Walk straight ${name}`.trim();

  if (type.includes('turn')) {
    if (modifier.includes('left')) rawInstruction = `Turn left ${name}`.trim();
    else if (modifier.includes('right')) rawInstruction = `Turn right ${name}`.trim();
  } else if (type.includes('roundabout')) {
    rawInstruction = `At the roundabout, take exit ${name}`.trim();
  } else if (type.includes('arrive')) {
    rawInstruction = `Arrive at your destination ${name}`.trim();
  }

  const location = osrmStep.maneuver?.location;
  const endLat = location ? location[1] : 0;
  const endLng = location ? location[0] : 0;

  return {
    html_instructions: rawInstruction,
    distance: { text: `${Math.round(distance)} m`, value: Math.round(distance) },
    duration: { text: `${Math.round(duration)} s`, value: Math.round(duration) },
    end_location: { lat: endLat, lng: endLng },
    maneuver: modifier ? `turn-${modifier}` : type,
    travel_mode: 'WALKING',
  };
}

/**
 * Fetches 100% FREE real-world walking directions from OSRM Foot Router.
 */
async function fetchFreeOSRMRoute(
  originCoords: Coordinates,
  destination: PlaceResult,
): Promise<ActiveTrip | null> {
  try {
    const url = `${OSRM_FOOT_ROUTE_URL}/${originCoords.longitude},${originCoords.latitude};${destination.coordinates.longitude},${destination.coordinates.latitude}`;

    const response = await axios.get(url, {
      params: {
        overview: 'full',
        steps: 'true',
        geometries: 'geojson',
      },
    });

    if (response.data?.code === 'Ok' && response.data.routes?.[0]) {
      const route = response.data.routes[0];
      const leg = route.legs?.[0];
      const osrmSteps = leg?.steps ?? [];

      const rawSteps = osrmSteps.map(convertOSRMStepToRaw);
      const parsedSteps: NavigationStep[] = parseGoogleSteps(rawSteps);

      const originPlace: PlaceResult = {
        placeId: 'current-origin',
        name: 'Current Location',
        address: 'Your location',
        coordinates: originCoords,
      };

      return {
        id: `trip-osrm-${Date.now()}`,
        origin: originPlace,
        destination,
        steps: parsedSteps.length > 0 ? parsedSteps : createMockTrip(destination).steps,
        currentStepIndex: 0,
        status: 'active',
        startedAt: new Date().toISOString(),
        totalDistanceMeters: Math.round(route.distance ?? 500),
        totalDurationSeconds: Math.round(route.duration ?? 300),
        isOnRoute: true,
      };
    }

    return null;
  } catch (error) {
    console.warn('[DirectionsService] OSRM route error, using fallback:', error);
    return null;
  }
}

/**
 * Fetches human-friendly walking directions.
 * Uses Google Directions if API key is present, or OSRM (100% FREE, NO KEY NEEDED).
 */
export async function getWalkingDirections({
  origin,
  destination,
  language = 'en',
}: GetDirectionsParams): Promise<ActiveTrip> {
  const originCoords: Coordinates = 'coordinates' in origin
    ? origin.coordinates
    : 'latitude' in origin
    ? (origin as Coordinates)
    : destination.coordinates ?? { latitude: 26.8467, longitude: 80.9462 };

  // If Google Maps key is configured, try Google Directions
  if (GOOGLE_MAPS_KEY && !GOOGLE_MAPS_KEY.includes('your_google')) {
    try {
      const originStr = `${originCoords.latitude},${originCoords.longitude}`;
      const destinationStr = destination.placeId && !destination.placeId.startsWith('osm-')
        ? `place_id:${destination.placeId}`
        : `${destination.coordinates.latitude},${destination.coordinates.longitude}`;

      const response = await axios.get(GOOGLE_DIRECTIONS_URL, {
        params: {
          origin: originStr,
          destination: destinationStr,
          mode: 'walking',
          key: GOOGLE_MAPS_KEY,
          language: toGoogleMapsLanguage(language as any),
        },
      });

      if (response.data?.status === 'OK' && response.data.routes?.[0]?.legs?.[0]) {
        const leg = response.data.routes[0].legs[0];
        const rawSteps = leg.steps ?? [];
        const parsedSteps = parseGoogleSteps(rawSteps);

        const originPlace: PlaceResult = {
          placeId: 'current-origin',
          name: leg.start_address ?? 'Starting Point',
          address: leg.start_address ?? '',
          coordinates: {
            latitude: leg.start_location?.lat ?? originCoords.latitude,
            longitude: leg.start_location?.lng ?? originCoords.longitude,
          },
        };

        return {
          id: `trip-${Date.now()}`,
          origin: originPlace,
          destination,
          steps: parsedSteps,
          currentStepIndex: 0,
          status: 'active',
          startedAt: new Date().toISOString(),
          totalDistanceMeters: leg.distance?.value ?? 0,
          totalDurationSeconds: leg.duration?.value ?? 0,
          isOnRoute: true,
        };
      }
    } catch (error) {
      console.warn('[DirectionsService] Google Directions error, trying OSRM:', error);
    }
  }

  // 100% FREE Real Walking Directions via OSRM Foot Engine
  const osrmTrip = await fetchFreeOSRMRoute(originCoords, destination);
  if (osrmTrip) return osrmTrip;

  // Mock trip fallback
  return createMockTrip(destination, originCoords.latitude, originCoords.longitude);
}
