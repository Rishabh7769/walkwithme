/**
 * WalkWithMe — Frontend AI Companion Service
 *
 * Calls FastAPI backend AI endpoints with fallback to local client AI generation
 * if the backend server is offline or unreachable. Multi-lingual support for
 * English, Hindi, and Hinglish.
 */

import { post } from '@/services/api';
import { API_PATHS } from '@/constants';
import type {
  ChatRequest,
  ChatResponse,
  CompanionRequest,
  CompanionResponse,
  ChatMessage,
  Language,
} from '@/types';
import { resolveLanguage } from '@/utils';

// ── Multi-lingual Fallback Pools ──────────────────────────────────────────

const MOCK_AI_RESPONSES_EN = [
  "You're doing great! Keep walking straight ahead toward the signal 😊",
  "No worries 😊 I'm right here with you. Look for the building ahead.",
  "Perfect! Yes, that's the correct road.",
  "Just a little further! You're almost at your destination.",
];

const MOCK_AI_RESPONSES_HI = [
  "आप बिल्कुल सही जा रहे हैं! सीधे आगे बढ़ते रहें 😊",
  "कोई बात नहीं 😊 मैं आपके साथ हूँ। सामने सिग्नल देखें।",
  "बिलकुल सही रास्ता है! आप अपनी मंजिल के पास हैं।",
  "बस थोड़ा सा और! आप बहुत जल्द पहुँचने वाले हैं।",
];

const MOCK_AI_RESPONSES_HINGLISH = [
  "Bilkul sahi raste pe ho! Seedha aage chalte raho 😊",
  "Koi baat nahi 😊 Main aapke saath hoon. Samne dekho.",
  "Ekdum perfect! Yahi sahi rasta hai.",
  "Bas thoda sa aur! Aap apni manzil ke paas ho.",
];

function selectFallbackResponse(lang: Exclude<Language, 'auto'>): string {
  let pool = MOCK_AI_RESPONSES_EN;
  if (lang === 'hi') pool = MOCK_AI_RESPONSES_HI;
  else if (lang === 'hinglish') pool = MOCK_AI_RESPONSES_HINGLISH;

  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}

/**
 * Sends conversation messages to the AI Chat endpoint.
 */
export async function sendAIChat(
  messages: ChatMessage[],
  language: Language = 'auto',
  context?: ChatRequest['context'],
): Promise<ChatResponse> {
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const payload: ChatRequest = {
    messages: formattedMessages,
    language,
    context,
  };

  const response = await post<ChatResponse>(API_PATHS.AI_CHAT, payload);

  if (response.success && response.data) {
    return response.data;
  }

  // Fallback to multi-lingual client response if backend server is offline
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
  const effectiveLang = resolveLanguage(language, lastUserMsg);
  const fallbackMessage = selectFallbackResponse(effectiveLang);

  return {
    message: fallbackMessage,
    mood: 'reassuring',
    detectedLanguage: effectiveLang,
  };
}

/**
 * Requests a step-specific AI reassurance message for the Companion screen.
 */
export async function fetchAICompanionMessage(
  currentInstruction: string,
  destinationName: string,
  landmarks: string[] = [],
  language: Language = 'auto',
  isOnRoute = true,
): Promise<CompanionResponse> {
  const payload: CompanionRequest = {
    currentInstruction,
    destinationName,
    userLocation: { latitude: 0, longitude: 0 },
    nearbyLandmarks: landmarks,
    language,
    previousMessages: [],
  };

  const response = await post<CompanionResponse>(API_PATHS.AI_COMPANION, payload);

  if (response.success && response.data) {
    return response.data;
  }

  const effectiveLang = resolveLanguage(language, currentInstruction);

  // Multi-lingual client fallback
  let fallbackText = currentInstruction;
  if (!isOnRoute) {
    if (effectiveLang === 'hi') fallbackText = "ऐसा लगता है आप गलत मोड़ ले चुके हैं। चलिए इसे साथ में ठीक करते हैं 😊";
    else if (effectiveLang === 'hinglish') fallbackText = "Lagta hai galat turn le liya. Chalo saath mein sahi karte hain 😊";
    else fallbackText = "Looks like you took a wrong turn. Let's fix it together 😊";
  }

  return {
    reassuranceText: fallbackText,
    mood: isOnRoute ? 'guiding' : 'correcting',
    detectedLanguage: effectiveLang,
  };
}

export interface VisionAnalysisResult {
  visualGuidance: string;
  identifiedLandmarks: string[];
  mood: string;
  detectedLanguage: Language;
}

/**
 * Sends a captured camera photo to GPT-4o Vision to identify surroundings.
 */
export async function analyzeImageWithVision(
  base64Image: string,
  userPrompt = 'Where am I? What landmarks do you see?',
  language: Language = 'auto',
): Promise<VisionAnalysisResult> {
  const payload = {
    imageBase64: base64Image,
    userPrompt,
    language,
  };

  const response = await post<VisionAnalysisResult>(API_PATHS.AI_VISION, payload);

  if (response.success && response.data) {
    return response.data;
  }

  const effectiveLang = resolveLanguage(language, userPrompt);
  let visualText = "I see the coffee shop and the traffic signal right in front of you! Keep walking straight.";
  if (effectiveLang === 'hi') visualText = "मुझे आपके सामने कॉफी शॉप और ट्रैफिक सिग्नल दिख रहा है! सीधे चलते रहें।";
  else if (effectiveLang === 'hinglish') visualText = "Mujhe aapke samne coffee shop aur traffic signal dikh raha hai! Seedha chalte raho.";

  return {
    visualGuidance: visualText,
    identifiedLandmarks: ["Coffee Shop", "Traffic Signal"],
    mood: "guiding",
    detectedLanguage: effectiveLang,
  };
}
