"""
WalkWithMe Backend — AI Request & Response Models
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessageItem(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., description="Message text content")


class TripContext(BaseModel):
    currentInstruction: Optional[str] = None
    destinationName: Optional[str] = None
    remainingSteps: Optional[int] = None
    isOnRoute: Optional[bool] = True


class ChatRequest(BaseModel):
    messages: List[ChatMessageItem]
    language: str = "auto"
    context: Optional[TripContext] = None


class ChatResponse(BaseModel):
    message: str
    mood: str = "guiding"
    detectedLanguage: str = "en"


class CompanionRequest(BaseModel):
    currentInstruction: str
    destinationName: Optional[str] = None
    userLocation: Optional[dict] = None
    nearbyLandmarks: Optional[List[str]] = None
    language: str = "auto"
    isOnRoute: bool = True


class CompanionResponse(BaseModel):
    reassuranceText: str
    mood: str = "guiding"
    detectedLanguage: str = "en"


class AnalyzeImageRequest(BaseModel):
    imageBase64: Optional[str] = Field(None, description="Base64 encoded photo")
    imageUrl: Optional[str] = Field(None, description="Remote image URL")
    userPrompt: Optional[str] = "Where am I? What landmarks do you see?"
    language: str = "auto"
    context: Optional[TripContext] = None


class AnalyzeImageResponse(BaseModel):
    visualGuidance: str
    identifiedLandmarks: List[str] = []
    mood: str = "guiding"
    detectedLanguage: str = "en"
