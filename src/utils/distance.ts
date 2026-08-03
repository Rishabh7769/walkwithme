/**
 * WalkWithMe — Distance Utilities
 *
 * Converts raw distances into calm, human-readable formats.
 * NEVER exposes meters/kilometers directly to the user.
 */

import type { Coordinates } from '@/types';

// ── Haversine Distance ─────────────────────────────────────────────────────

/**
 * Calculates the straight-line distance between two GPS coordinates
 * using the Haversine formula. Returns distance in meters.
 */
export function haversineDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (from.latitude * Math.PI) / 180;
  const φ2 = (to.latitude * Math.PI) / 180;
  const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
  const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ── Human-readable conversions ────────────────────────────────────────────

/**
 * Converts meters to a calm, human-friendly phrase.
 * Never says "meters" or "kilometers" — uses walking time instead.
 *
 * @example
 * toWalkingTime(80)  → "less than a minute away"
 * toWalkingTime(300) → "about 4 minutes of walking"
 * toWalkingTime(1500) → "about 18 minutes of walking"
 */
export function toWalkingTime(meters: number): string {
  // Average walking speed: 1.4 m/s = 84 m/min
  const minutesRaw = meters / 84;

  if (minutesRaw < 1) return 'less than a minute away';
  if (minutesRaw < 2) return 'about 1 minute of walking';

  const minutes = Math.round(minutesRaw);
  if (minutes < 60) return `about ${minutes} minutes of walking`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `about ${hours} hour${hours > 1 ? 's' : ''} of walking`;
  return `about ${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minutes of walking`;
}

/**
 * Converts seconds to a human-friendly time phrase.
 */
export function toDurationPhrase(seconds: number): string {
  if (seconds < 60) return 'less than a minute';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Checks if user is close enough to a step endpoint to advance.
 * @param userLocation - Current GPS position
 * @param stepEndCoordinates - End coordinates of the current step
 * @param thresholdMeters - Distance threshold (default 20m)
 */
export function isNearPoint(
  userLocation: Coordinates,
  stepEndCoordinates: Coordinates,
  thresholdMeters = 20,
): boolean {
  return haversineDistance(userLocation, stepEndCoordinates) <= thresholdMeters;
}

/**
 * Checks if user has deviated off their planned route.
 * @param userLocation - Current GPS position
 * @param routePoints - Array of coordinates along the route
 * @param thresholdMeters - Off-route threshold (default 50m)
 */
export function isOffRoute(
  userLocation: Coordinates,
  routePoints: Coordinates[],
  thresholdMeters = 50,
): boolean {
  if (routePoints.length === 0) return false;

  const minDistance = Math.min(
    ...routePoints.map((point) => haversineDistance(userLocation, point)),
  );

  return minDistance > thresholdMeters;
}
