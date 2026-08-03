/**
 * WalkWithMe — API Types
 *
 * Generic API response wrappers and error types.
 * All API calls return these shapes — no raw axios responses leak into components.
 */

// ── Generic wrappers ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: ApiErrorCode;
  statusCode: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Error codes ───────────────────────────────────────────────────────────

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'AI_ERROR'
  | 'MAPS_ERROR'
  | 'LOCATION_ERROR'
  | 'UNKNOWN';

// ── Places API ───────────────────────────────────────────────────────────

export interface PlacePrediction {
  placeId: string;
  description: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
  };
}

export interface PlaceAutocompleteResponse {
  predictions: PlacePrediction[];
}

export interface PlaceDetailsResponse {
  placeId: string;
  name: string;
  formattedAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// ── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
