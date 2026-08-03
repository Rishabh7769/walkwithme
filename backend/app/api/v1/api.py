"""
WalkWithMe Backend — API v1 Router Aggregator
"""

from fastapi import APIRouter
from app.api.v1.routes import ai, places

api_router = APIRouter()
api_router.include_router(ai.router, prefix="/ai", tags=["AI Companion"])
api_router.include_router(places.router, prefix="/places", tags=["Places"])

