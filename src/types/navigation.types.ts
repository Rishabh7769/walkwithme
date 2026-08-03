/**
 * WalkWithMe — Navigation & Trip Types
 *
 * "Navigation" here refers to trip navigation, not React Navigation routing.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

/**
 * A single step in a navigation route.
 * Raw Google Maps data is ALWAYS translated before reaching this type.
 * We NEVER store cardinal directions here.
 */
export interface NavigationStep {
  id: string;
  /** Human-friendly instruction: "Turn left after the red building" */
  humanInstruction: string;
  /** Raw Google Maps HTML instruction (for internal processing only) */
  rawInstruction: string;
  /** Distance in meters for this step */
  distanceMeters: number;
  /** Duration in seconds for this step */
  durationSeconds: number;
  /** Maneuver type from Google Maps (turn-left, turn-right, etc.) */
  maneuver: string | null;
  /** End coordinates of this step */
  endCoordinates: Coordinates;
  /** Nearby landmarks identified by AI for this step */
  landmarks: string[];
}

export type TripStatus = 'idle' | 'planning' | 'active' | 'rerouting' | 'completed' | 'cancelled';

export interface ActiveTrip {
  id: string;
  origin: PlaceResult;
  destination: PlaceResult;
  steps: NavigationStep[];
  currentStepIndex: number;
  status: TripStatus;
  startedAt: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  /** Whether the user is currently on the correct path */
  isOnRoute: boolean;
}

export interface RouteRequest {
  originCoordinates: Coordinates;
  destinationPlaceId: string;
  language: string;
}

export interface RouteResponse {
  trip: ActiveTrip;
}
