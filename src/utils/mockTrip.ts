/**
 * WalkWithMe — Mock Trip Factory
 *
 * Used in Milestone 2 to demonstrate the Companion screen working
 * end-to-end before the real Google Maps / AI integration (M3–M5).
 *
 * REPLACE IN MILESTONE 4 with real route data from the Directions API.
 *
 * The mock trip simulates a real walk through a neighbourhood:
 * - Realistic landmark-based instructions (no cardinal directions)
 * - Multiple steps
 * - Realistic distances and durations
 */

import type { ActiveTrip, NavigationStep, PlaceResult } from '@/types';

function makeStep(
  id: string,
  humanInstruction: string,
  distanceMeters: number,
  durationSeconds: number,
  maneuver: string | null,
  endLat: number,
  endLng: number,
): NavigationStep {
  return {
    id,
    humanInstruction,
    rawInstruction: humanInstruction, // Mock: same as human-friendly
    distanceMeters,
    durationSeconds,
    maneuver,
    endCoordinates: { latitude: endLat, longitude: endLng },
    landmarks: [],
  };
}

/**
 * Creates a mock active trip for demonstration/testing.
 * The destination is customizable so it shows the user's real chosen place.
 */
export function createMockTrip(
  destination: PlaceResult,
  originLat = 28.6139,
  originLng = 77.209,
): ActiveTrip {
  const mockOrigin: PlaceResult = {
    placeId: 'mock-origin',
    name: 'Your Location',
    address: 'Current location',
    coordinates: { latitude: originLat, longitude: originLng },
  };

  const steps: NavigationStep[] = [
    makeStep(
      'step-1',
      'Walk straight ahead toward the traffic signal in front of you.',
      180,
      130,
      'straight',
      originLat + 0.0015,
      originLng,
    ),
    makeStep(
      'step-2',
      'Turn left after the pharmacy on your right.',
      90,
      65,
      'turn-left',
      originLat + 0.0015,
      originLng - 0.001,
    ),
    makeStep(
      'step-3',
      'Keep walking toward the large blue building ahead.',
      220,
      160,
      'straight',
      originLat + 0.003,
      originLng - 0.001,
    ),
    makeStep(
      'step-4',
      'Turn right at the corner with the tea stall.',
      110,
      80,
      'turn-right',
      originLat + 0.003,
      originLng + 0.001,
    ),
    makeStep(
      'step-5',
      `You've arrived! ${destination.name} is right here. 🎉`,
      30,
      20,
      null,
      destination.coordinates.latitude,
      destination.coordinates.longitude,
    ),
  ];

  const totalDistance = steps.reduce((sum, s) => sum + s.distanceMeters, 0);
  const totalDuration = steps.reduce((sum, s) => sum + s.durationSeconds, 0);

  return {
    id: `mock-trip-${Date.now()}`,
    origin: mockOrigin,
    destination,
    steps,
    currentStepIndex: 0,
    status: 'active',
    startedAt: new Date().toISOString(),
    totalDistanceMeters: totalDistance,
    totalDurationSeconds: totalDuration,
    isOnRoute: true,
  };
}
