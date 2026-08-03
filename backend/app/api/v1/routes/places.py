"""
WalkWithMe Backend — Places API Routes

Proxies Google Places Autocomplete and Details requests server-side so that
the API key is never exposed to the client. Falls back to OpenStreetMap Nominatim
if the key is not set or Google returns an error.
"""

import httpx
from fastapi import APIRouter, HTTPException, Query
from app.core.config import settings

router = APIRouter()

GOOGLE_AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
GOOGLE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_HEADERS = {"User-Agent": "WalkWithMe/1.0 (navigation assistant)"}


@router.get("/autocomplete")
async def autocomplete_places(
    input: str = Query(..., min_length=1, description="Search query"),
    language: str = Query("en", description="Language code"),
):
    """
    Returns place predictions for the given input query.
    Uses Google Places if API key is configured, otherwise Nominatim.
    """
    if not input.strip():
        return {"predictions": []}

    # 1. Try Google Places Autocomplete
    if settings.GOOGLE_MAPS_KEY and "your_google" not in settings.GOOGLE_MAPS_KEY:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    GOOGLE_AUTOCOMPLETE_URL,
                    params={
                        "input": input,
                        "key": settings.GOOGLE_MAPS_KEY,
                        "language": language,
                    },
                )
                data = resp.json()

            if data.get("status") == "OK" and data.get("predictions"):
                print(f"[Places] Google returned {len(data['predictions'])} results for '{input}'")
                return {"predictions": data["predictions"]}
            else:
                print(f"[Places] Google Places status: {data.get('status')} — falling back to Nominatim")
        except Exception as e:
            print(f"[Places] Google Places error: {e} — falling back to Nominatim")

    # 2. Fall back to OpenStreetMap Nominatim
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                NOMINATIM_SEARCH_URL,
                params={
                    "q": input,
                    "format": "json",
                    "addressdetails": 1,
                    "limit": 8,
                    "accept-language": language,
                },
                headers=NOMINATIM_HEADERS,
            )
            items = resp.json()

        if not isinstance(items, list) or len(items) == 0:
            return {"predictions": []}

        predictions = []
        for item in items:
            main_name = item.get("name") or item.get("display_name", "").split(",")[0]
            secondary = ", ".join(item.get("display_name", "").split(",")[1:]).strip()
            predictions.append({
                "place_id": f"osm-{item.get('osm_type')}-{item.get('osm_id')}",
                "description": item.get("display_name", ""),
                "structured_formatting": {
                    "main_text": main_name,
                    "secondary_text": secondary,
                },
                "_osm": {
                    "lat": item.get("lat"),
                    "lon": item.get("lon"),
                },
            })

        print(f"[Places] Nominatim returned {len(predictions)} results for '{input}'")
        return {"predictions": predictions}

    except Exception as e:
        print(f"[Places] Nominatim error: {e}")
        raise HTTPException(status_code=502, detail="Place search temporarily unavailable")


@router.get("/details")
async def get_place_details(
    place_id: str = Query(..., description="Google Place ID or OSM ID"),
    language: str = Query("en", description="Language code"),
):
    """
    Returns detailed information (coordinates, address) for a place ID.
    """
    if place_id.startswith("osm-"):
        # Decode OSM ID and reverse geocode
        # Format: osm-{type}-{id}, e.g. osm-way-123456
        parts = place_id.split("-", 2)
        if len(parts) == 3:
            osm_type = parts[1]
            osm_id = parts[2]
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.get(
                        f"https://nominatim.openstreetmap.org/lookup",
                        params={
                            "osm_ids": f"{osm_type[0].upper()}{osm_id}",
                            "format": "json",
                            "addressdetails": 1,
                        },
                        headers=NOMINATIM_HEADERS,
                    )
                    items = resp.json()

                if isinstance(items, list) and items:
                    item = items[0]
                    return {
                        "result": {
                            "place_id": place_id,
                            "name": item.get("name") or item.get("display_name", "").split(",")[0],
                            "formatted_address": item.get("display_name", ""),
                            "geometry": {
                                "location": {
                                    "lat": float(item.get("lat", 0)),
                                    "lng": float(item.get("lon", 0)),
                                }
                            },
                        }
                    }
            except Exception as e:
                print(f"[Places] OSM lookup error: {e}")

        raise HTTPException(status_code=404, detail="OSM place not found")

    # Google place_id
    if not settings.GOOGLE_MAPS_KEY or "your_google" in settings.GOOGLE_MAPS_KEY:
        raise HTTPException(status_code=503, detail="Google Maps API key not configured")

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                GOOGLE_DETAILS_URL,
                params={
                    "place_id": place_id,
                    "fields": "place_id,name,formatted_address,geometry",
                    "key": settings.GOOGLE_MAPS_KEY,
                    "language": language,
                },
            )
            data = resp.json()

        if data.get("status") == "OK":
            return {"result": data["result"]}

        print(f"[Places] Google Details status: {data.get('status')}")
        raise HTTPException(status_code=404, detail="Place not found")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Places] Google Details error: {e}")
        raise HTTPException(status_code=502, detail="Place details temporarily unavailable")
