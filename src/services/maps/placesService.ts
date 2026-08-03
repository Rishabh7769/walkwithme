/**
 * WalkWithMe — Places Service
 *
 * Search strategy (in priority order):
 *   1. Google Places Autocomplete proxied via the Render backend (key is server-side, no billing block)
 *   2. OpenStreetMap Nominatim (free, no key, worldwide)
 *   3. Empty — NEVER return fake/hardcoded places
 *
 * All search results are worldwide — no forced India restriction.
 */

import axios from 'axios';
import { API_BASE_URL } from '@/constants';
import type { PlacePrediction, PlaceDetailsResponse, Coordinates } from '@/types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// ── In-memory cache to avoid repeat lookups ───────────────────────────────
const detailsCache: Record<string, PlaceDetailsResponse> = {};

// ── Helper: strip HTML tags from Google instruction strings ───────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Google Places Autocomplete via backend proxy
// ─────────────────────────────────────────────────────────────────────────
async function fetchGooglePredictions(
  query: string,
  language: string,
  signal?: AbortSignal,
): Promise<PlacePrediction[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/places/autocomplete`, {
      params: { input: query, language },
      signal,
      timeout: 8000,
    });

    const predictions = response.data?.predictions ?? response.data;
    if (Array.isArray(predictions) && predictions.length > 0) {
      return predictions.map((p: any) => ({
        placeId: p.place_id ?? p.placeId,
        description: p.description,
        structuredFormatting: {
          mainText: p.structured_formatting?.main_text ?? p.structuredFormatting?.mainText ?? p.description,
          secondaryText: p.structured_formatting?.secondary_text ?? p.structuredFormatting?.secondaryText ?? '',
        },
      }));
    }
  } catch (err) {
    if (axios.isCancel(err)) return [];
    console.warn('[PlacesService] Backend autocomplete failed:', err);
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────
// 2. OpenStreetMap Nominatim (free, worldwide, no key)
// ─────────────────────────────────────────────────────────────────────────
async function fetchNominatimPredictions(
  query: string,
  signal?: AbortSignal,
): Promise<PlacePrediction[]> {
  try {
    const response = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 8,
        'accept-language': 'en',
      },
      headers: { 'User-Agent': 'WalkWithMe/1.0 (navigation assistant)' },
      signal,
      timeout: 8000,
    });

    if (!Array.isArray(response.data) || response.data.length === 0) return [];

    return response.data.map((item: any) => {
      const osmId = `osm-${item.osm_type}-${item.osm_id}`;
      const mainName = stripHtml(item.name || item.display_name.split(',')[0] || query);
      const secondary = item.display_name.split(',').slice(1).join(',').trim();
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);

      // Cache coordinates so getPlaceDetails() is instant for Nominatim results
      detailsCache[osmId] = {
        placeId: osmId,
        name: mainName,
        formattedAddress: item.display_name,
        coordinates: {
          latitude: isNaN(lat) ? 0 : lat,
          longitude: isNaN(lon) ? 0 : lon,
        },
      };

      return {
        placeId: osmId,
        description: item.display_name,
        structuredFormatting: {
          mainText: mainName,
          secondaryText: secondary,
        },
      };
    });
  } catch (err) {
    if (axios.isCancel(err)) return [];
    console.warn('[PlacesService] Nominatim search failed:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Public: getPlacePredictions
// ─────────────────────────────────────────────────────────────────────────
export async function getPlacePredictions(
  query: string,
  language = 'en',
  signal?: AbortSignal,
): Promise<PlacePrediction[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  console.log(`[PlacesService] Searching: "${trimmed}"`);

  // 1. Try backend-proxied Google Places first
  const googleResults = await fetchGooglePredictions(trimmed, language, signal);
  if (googleResults.length > 0) {
    console.log(`[PlacesService] Google returned ${googleResults.length} results`);
    return googleResults;
  }

  // 2. Fall back to Nominatim (worldwide, free)
  const osmResults = await fetchNominatimPredictions(trimmed, signal);
  if (osmResults.length > 0) {
    console.log(`[PlacesService] Nominatim returned ${osmResults.length} results`);
    return osmResults;
  }

  console.warn(`[PlacesService] No results found for: "${trimmed}"`);
  return [];
}

// ─────────────────────────────────────────────────────────────────────────
// Public: getPlaceDetails
// ─────────────────────────────────────────────────────────────────────────
export async function getPlaceDetails(
  placeId: string,
  language = 'en',
): Promise<PlaceDetailsResponse | null> {
  if (!placeId) return null;

  // Return from cache if available (Nominatim results are pre-cached)
  if (detailsCache[placeId]) {
    return detailsCache[placeId];
  }

  // For Google place_ids, call backend proxy
  if (!placeId.startsWith('osm-')) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/places/details`, {
        params: { place_id: placeId, language },
        timeout: 8000,
      });

      const result = response.data?.result ?? response.data;
      if (result) {
        const details: PlaceDetailsResponse = {
          placeId: result.place_id ?? placeId,
          name: result.name ?? result.formatted_address,
          formattedAddress: result.formatted_address ?? '',
          coordinates: {
            latitude: result.geometry?.location?.lat ?? 0,
            longitude: result.geometry?.location?.lng ?? 0,
          },
        };
        detailsCache[placeId] = details;
        return details;
      }
    } catch (err) {
      console.warn('[PlacesService] Backend place details failed:', err);
    }
  }

  // If we have it cached from Nominatim lookup, return it; otherwise null
  return detailsCache[placeId] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// Public: getNearbyLandmarks
// ─────────────────────────────────────────────────────────────────────────
export async function getNearbyLandmarks(
  coordinates: Coordinates,
  _radiusMeters = 150,
): Promise<string[]> {
  try {
    const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: {
        lat: coordinates.latitude,
        lon: coordinates.longitude,
        format: 'json',
        addressdetails: 1,
      },
      headers: { 'User-Agent': 'WalkWithMe/1.0' },
      timeout: 6000,
    });

    if (response.data?.address) {
      const addr = response.data.address;
      const landmarks: string[] = [];
      if (addr.amenity) landmarks.push(addr.amenity);
      if (addr.shop) landmarks.push(`${addr.shop} shop`);
      if (addr.road) landmarks.push(addr.road);
      if (addr.suburb) landmarks.push(addr.suburb);
      if (addr.city || addr.town || addr.village)
        landmarks.push(addr.city ?? addr.town ?? addr.village);
      if (landmarks.length > 0) return landmarks.slice(0, 4);
    }
  } catch (err) {
    console.warn('[PlacesService] Reverse geocode failed:', err);
  }
  return [];
}
