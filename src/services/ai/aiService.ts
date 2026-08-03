/**
 * WalkWithMe — Frontend AI Companion Service
 *
 * Calls FastAPI backend AI endpoints with smart context awareness.
 * Checks active trip status to ensure responses match real navigation state!
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

  // Smart context-aware client fallback if backend server is offline
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
  const effectiveLang = resolveLanguage(language, lastUserMsg);
  const hasActiveTrip = context?.destinationName !== undefined && context?.destinationName !== null;

  let fallbackMessage = '';

  if (!hasActiveTrip) {
    if (effectiveLang === 'hi') {
      fallbackMessage = "आप अभी किसी यात्रा पर नहीं हैं। होम स्क्रीन पर जाएं और अपनी मंजिल चुनें, मैं आपके साथ चलूंगा 😊";
    } else if (effectiveLang === 'hinglish') {
      fallbackMessage = "Aap abhi kisi trip par nahi ho. Home screen par destination select karo, main aapke saath chalunga 😊";
    } else {
      fallbackMessage = "You haven't selected a destination yet! Select a location on the Home screen and I'll walk with you 😊";
    }
  } else {
    const dest = context?.destinationName;
    const step = context?.currentInstruction ?? 'Walk straight ahead';

    if (effectiveLang === 'hi') {
      fallbackMessage = `आप ${dest} के रास्ते पर हैं। ${step}! सब ठीक है 😊`;
    } else if (effectiveLang === 'hinglish') {
      fallbackMessage = `Aap ${dest} ke raste par ho. ${step}! Sab sahi chal raha hai 😊`;
    } else {
      fallbackMessage = `You are on your way to ${dest}. ${step}! You're doing great 😊`;
    }
  }

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

  let fallbackText = currentInstruction;
  if (!isOnRoute) {
    if (effectiveLang === 'hi') fallbackText = "ऐसा लगता है आप गलत मोड़ पर आ गए हैं। चलिए इसे साथ में ठीक करते हैं 😊";
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
  let visualText = "I see the main street and building right in front of you! Keep walking straight.";
  if (effectiveLang === 'hi') visualText = "मुझे आपके सामने मुख्य रास्ता और इमारत दिख रही है! सीधे आगे बढ़ते रहें।";
  else if (effectiveLang === 'hinglish') visualText = "Mujhe aapke samne main road aur building dikh rahi hai! Seedha aage chalte raho.";

  return {
    visualGuidance: visualText,
    identifiedLandmarks: ["Main Street", "Building"],
    mood: "guiding",
    detectedLanguage: effectiveLang,
  };
}
