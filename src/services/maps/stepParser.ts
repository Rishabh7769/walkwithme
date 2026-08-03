/**
 * WalkWithMe — Navigation Step Parser & Sanitizer
 *
 * Transforms raw Google Directions API step objects into human-friendly,
 * cardinal-direction-free navigation steps.
 *
 * UX PHILOSOPHY ENFORCEMENT:
 * - NO "north", "south", "east", "west"
 * - NO "bearing 45 degrees"
 * - NO raw HTML markup
 * - YES landmark-based phrasing
 */

import type { NavigationStep, Coordinates } from '@/types';
import { sanitizeInstruction, maneuverToFriendly } from '@/utils';

export interface RawGoogleStep {
  html_instructions: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  end_location: { lat: number; lng: number };
  maneuver?: string;
  travel_mode: string;
}

/**
 * Parses and sanitizes a single raw Google Maps direction step.
 */
export function parseGoogleStep(rawStep: RawGoogleStep, index: number): NavigationStep {
  const rawHtml = rawStep.html_instructions ?? '';
  
  // 1. Strip HTML and remove cardinal directions / GPS jargon
  let cleaned = sanitizeInstruction(rawHtml);

  // 2. If instruction is empty or generic, fall back to maneuver description
  if (!cleaned || cleaned.length < 3) {
    const maneuverText = maneuverToFriendly(rawStep.maneuver ?? null);
    cleaned = `${maneuverText} and keep walking.`;
  }

  const endCoords: Coordinates = {
    latitude: rawStep.end_location?.lat ?? 0,
    longitude: rawStep.end_location?.lng ?? 0,
  };

  return {
    id: `step-${index + 1}-${Date.now()}`,
    humanInstruction: cleaned,
    rawInstruction: rawHtml,
    distanceMeters: rawStep.distance?.value ?? 50,
    durationSeconds: rawStep.duration?.value ?? 30,
    maneuver: rawStep.maneuver ?? null,
    endCoordinates: endCoords,
    landmarks: [],
  };
}

/**
 * Parses an array of raw Google Maps steps into clean NavigationStep entities.
 */
export function parseGoogleSteps(rawSteps: RawGoogleStep[]): NavigationStep[] {
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) return [];
  return rawSteps.map((step, index) => parseGoogleStep(step, index));
}
