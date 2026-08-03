"""
WalkWithMe Backend — OpenAI AI Companion & GPT Vision Service
"""

import random
from typing import List
from app.core.config import settings
from app.models.ai_models import (
    ChatMessageItem,
    TripContext,
    ChatResponse,
    CompanionResponse,
    AnalyzeImageRequest,
    AnalyzeImageResponse,
)

SYSTEM_PROMPT = """You are WalkWithMe — a calm, caring AI navigation companion.

## Mission
You are walking beside a user who struggles with spatial navigation and gets anxious while traveling.
Your job is to reassure them, keep them calm, and guide them with landmarks.

## Core Rules
1. NEVER use cardinal directions: north, south, east, west, northeast, southwest, etc.
2. NEVER use GPS jargon: bearings, coordinates, latitude, longitude, degrees.
3. ALWAYS use visible landmarks: buildings, shops, traffic lights, temples, metro exits, colors, tea stalls, obvious objects.
4. Keep responses SHORT (1 to 2 sentences max). You are speaking while they walk.

## Personality
- Warm, empathetic, close friend.
- Reassuring phrases: "Koi baat nahi 😊", "You're doing great", "Perfect", "Bas thoda sa aur", "Yes, that's the correct road."
- When user took a wrong turn: "Looks like you took the wrong turn. Let's fix it together 😊"
"""

VISION_SYSTEM_PROMPT = """You are WalkWithMe Vision AI.
Analyze the user's camera photo (landmarks, shop names, street signs, colors, traffic signals).
Reassure the user in 1-2 calm sentences. Tell them what you see and which direction to walk in.
STRICT RULE: NO cardinal directions (north/south/east/west). Use relative directions (front of you, to your right, after the red shop).
"""

MOCK_CHAT_RESPONSES = [
    ("You're doing great! Keep walking straight ahead toward the signal 😊", "guiding", "en"),
    ("Bilkul sahi chal rahe ho! Bas aage wala red building dekho.", "reassuring", "hinglish"),
    ("Koi baat nahi 😊 Let's get you back on track together.", "reassuring", "hinglish"),
    ("Yes, that's the correct road! You're almost there.", "reassuring", "en"),
]

MOCK_VISION_RESPONSES = [
    ("I see the coffee shop and the traffic signal right in front of you! Keep walking straight.", ["Coffee Shop", "Traffic Signal"]),
    ("Bilkul sahi jagah ho! I see the Metro Exit 2 on your left. Walk toward it.", ["Metro Exit 2", "Blue Building"]),
    ("I see the pharmacy sign ahead! You're on the right street.", ["Pharmacy Sign"]),
]


def detect_language(text: str) -> str:
    lower = text.lower() if hasattr(text, 'lower') else str(text).lower()
    devanagari = any('\u0900' <= char <= '\u097f' for char in text)
    if devanagari:
        return "hi"
    hinglish_words = ["koi", "baat", "nahi", "rasta", "chalo", "aage", "sahi", "bas", "haan"]
    if any(w in lower for w in hinglish_words):
        return "hinglish"
    return "en"


class AIService:
    @staticmethod
    async def generate_chat_response(
        messages: List[ChatMessageItem],
        language_pref: str = "auto",
        context: TripContext = None,
    ) -> ChatResponse:
        user_message = messages[-1].content if messages else "Hello"
        detected_lang = detect_language(user_message) if language_pref == "auto" else language_pref

        if not settings.OPENAI_API_KEY or "your_openai" in settings.OPENAI_API_KEY:
            text, mood, _ = random.choice(MOCK_CHAT_RESPONSES)
            return ChatResponse(message=text, mood=mood, detectedLanguage=detected_lang)

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            system_instruction = SYSTEM_PROMPT
            if context and context.destinationName:
                system_instruction += f"\nActive Trip Context: User walking to {context.destinationName}. Current step: {context.currentInstruction or 'Walking straight'}."

            formatted_messages = [{"role": "system", "content": system_instruction}]
            for msg in messages[-6:]:
                formatted_messages.append({"role": msg.role, "content": msg.content})

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=formatted_messages,
                max_tokens=200,
                temperature=0.7,
            )

            reply_text = response.choices[0].message.content.strip()
            return ChatResponse(
                message=reply_text,
                mood="reassuring" if "nahi" in reply_text.lower() or "great" in reply_text.lower() else "guiding",
                detectedLanguage=detected_lang,
            )
        except Exception as e:
            print(f"[AIService] OpenAI Error: {e}")
            text, mood, _ = random.choice(MOCK_CHAT_RESPONSES)
            return ChatResponse(message=text, mood=mood, detectedLanguage=detected_lang)

    @staticmethod
    async def generate_companion_message(
        current_instruction: str,
        destination_name: str,
        landmarks: List[str] = None,
        language_pref: str = "auto",
        is_on_route: bool = True,
    ) -> CompanionResponse:
        detected_lang = detect_language(current_instruction) if language_pref == "auto" else language_pref

        if not settings.OPENAI_API_KEY or "your_openai" in settings.OPENAI_API_KEY:
            if not is_on_route:
                return CompanionResponse(
                    reassuranceText="Looks like you took a wrong turn. Let's fix it together 😊",
                    mood="correcting",
                    detectedLanguage=detected_lang,
                )
            return CompanionResponse(reassuranceText=current_instruction, mood="guiding", detectedLanguage=detected_lang)

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            landmark_str = f" Nearby landmarks: {', '.join(landmarks)}." if landmarks else ""
            route_status = "User is on correct path." if is_on_route else "User taken a wrong turn, offer gentle correction."
            prompt = f"Destination: {destination_name}. Step: {current_instruction}.{landmark_str} {route_status} Reassure in 1 calm sentence."

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=100,
                temperature=0.7,
            )

            reply_text = response.choices[0].message.content.strip()
            return CompanionResponse(
                reassuranceText=reply_text,
                mood="correcting" if not is_on_route else "guiding",
                detectedLanguage=detected_lang,
            )
        except Exception as e:
            print(f"[AIService] OpenAI Error: {e}")
            return CompanionResponse(reassuranceText=current_instruction, mood="guiding", detectedLanguage=detected_lang)

    @staticmethod
    async def analyze_image_vision(request: AnalyzeImageRequest) -> AnalyzeImageResponse:
        detected_lang = detect_language(request.userPrompt or "") if request.language == "auto" else request.language

        if not settings.OPENAI_API_KEY or "your_openai" in settings.OPENAI_API_KEY:
            text, landmarks = random.choice(MOCK_VISION_RESPONSES)
            return AnalyzeImageResponse(
                visualGuidance=text,
                identifiedLandmarks=landmarks,
                mood="guiding",
                detectedLanguage=detected_lang,
            )

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            image_content = []
            if request.imageBase64:
                image_content = [{
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{request.imageBase64}"}
                }]
            elif request.imageUrl:
                image_content = [{
                    "type": "image_url",
                    "image_url": {"url": request.imageUrl}
                }]

            prompt_text = request.userPrompt or "Where am I? What landmarks do you see?"
            if request.context and request.context.destinationName:
                prompt_text += f" (User destination: {request.context.destinationName})"

            user_content = [{"type": "text", "text": prompt_text}] + image_content

            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": VISION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                max_tokens=250,
                temperature=0.5,
            )

            reply_text = response.choices[0].message.content.strip()
            return AnalyzeImageResponse(
                visualGuidance=reply_text,
                identifiedLandmarks=[],
                mood="guiding",
                detectedLanguage=detected_lang,
            )
        except Exception as e:
            print(f"[AIService] Vision Error: {e}")
            text, landmarks = random.choice(MOCK_VISION_RESPONSES)
            return AnalyzeImageResponse(
                visualGuidance=text,
                identifiedLandmarks=landmarks,
                mood="guiding",
                detectedLanguage=detected_lang,
            )
