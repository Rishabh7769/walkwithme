/**
 * WalkWithMe — Route Tracking Engine
 *
 * Evaluates real-time GPS position updates against active trip steps.
 * Performs automatic step advancement when reaching a landmark/waypoint,
 * and triggers off-route detection.
 */

import { haversineDistance, isNearPoint, isOffRoute } from '@/utils';
import type { Coordinates, ActiveTrip, NavigationStep } from '@/types';

export interface RouteEngineEvaluation {
  shouldAdvanceStep: boolean;
  isOffRoute: boolean;
  distanceToStepEndMeters: number;
}

/**
 * Evaluates the user's current GPS position against the active trip.
 */
export function evaluateLocationTick(
  userCoords: Coordinates,
  trip: ActiveTrip | null,
): RouteEngineEvaluation {
  if (!trip || trip.status !== 'active') {
    return {
      shouldAdvanceStep: false,
      isOffRoute: false,
      distanceToStepEndMeters: 0,
    };
  }

  const currentStep: NavigationStep | undefined = trip.steps[trip.currentStepIndex];

  if (!currentStep) {
    return {
      shouldAdvanceStep: false,
      isOffRoute: false,
      distanceToStepEndMeters: 0,
    };
  }

  const distanceToEnd = haversineDistance(userCoords, currentStep.endCoordinates);

  // Check if within 15 meters of step end point → auto advance step
  const reachedStep = isNearPoint(userCoords, currentStep.endCoordinates, 15);

  // Check if off-route (> 50 meters away from all step points)
  const allStepCoords = trip.steps.map((s) => s.endCoordinates);
  const offRoute = isOffRoute(userCoords, allStepCoords, 50);

  return {
    shouldAdvanceStep: reachedStep,
    isOffRoute: offRoute,
    distanceToStepEndMeters: Math.round(distanceToEnd),
  };
}
