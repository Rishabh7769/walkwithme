"""
WalkWithMe Backend — AI API Route Handlers
"""

from fastapi import APIRouter, HTTPException
from app.models.ai_models import (
    ChatRequest,
    ChatResponse,
    CompanionRequest,
    CompanionResponse,
    AnalyzeImageRequest,
    AnalyzeImageResponse,
)
from app.services.ai_service import AIService

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Conversational AI Chat Endpoint.
    Accepts messages array, user language preference, and trip context.
    Returns AI response message, mood, and detected language.
    """
    try:
        response = await AIService.generate_chat_response(
            messages=request.messages,
            language_pref=request.language,
            context=request.context,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/companion", response_model=CompanionResponse)
async def companion_endpoint(request: CompanionRequest):
    """
    Companion Screen AI Guidance Endpoint.
    Generates a calm, landmark-based instruction for the user's active step.
    """
    try:
        response = await AIService.generate_companion_message(
            current_instruction=request.currentInstruction,
            destination_name=request.destinationName or "Destination",
            landmarks=request.nearbyLandmarks,
            language_pref=request.language,
            is_on_route=request.isOnRoute,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image_endpoint(request: AnalyzeImageRequest):
    """
    GPT-4o Vision Image Analysis Endpoint.
    Analyzes photo taken by camera or uploaded from gallery to identify landmarks.
    """
    try:
        response = await AIService.analyze_image_vision(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
