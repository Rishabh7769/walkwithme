/**
 * WalkWithMe — Custom AI Hooks
 *
 * React Query mutations for AI Chat, Companion reassurances, and GPT-4o Vision.
 * Automatically triggers Text-To-Speech audio output on AI responses!
 */

import { useMutation } from '@tanstack/react-query';
import { sendAIChat, fetchAICompanionMessage, analyzeImageWithVision } from '@/services/ai';
import { speakText } from '@/services/voice';
import { useChatStore } from '@/store/useChatStore';
import { useUserStore } from '@/store/useUserStore';
import type { ChatMessage, ChatRequest, ChatResponse, CompanionResponse } from '@/types';

interface SendChatParams {
  messages: ChatMessage[];
  context?: ChatRequest['context'];
}

/**
 * Hook for sending user messages to the AI and streaming/storing the response with spoken voice.
 */
export function useAIChat() {
  const { addAIMessage, setIsAIThinking, setLastDetectedLanguage } = useChatStore();
  const { profile } = useUserStore();

  return useMutation<ChatResponse, Error, SendChatParams>({
    mutationFn: async ({ messages, context }) => {
      setIsAIThinking(true);
      return sendAIChat(messages, profile.languagePreference, context);
    },
    onSuccess: (data) => {
      addAIMessage(data.message, data.mood);
      setLastDetectedLanguage(data.detectedLanguage);
      setIsAIThinking(false);

      // Speak response aloud if voice is enabled
      if (profile.voiceEnabled && data.message) {
        speakText(data.message, profile.languagePreference);
      }
    },
    onError: (error) => {
      console.warn('[useAIChat] Error in AI Chat:', error);
      const fallbackMsg = profile.languagePreference === 'hi'
        ? "कोई बात नहीं 😊 मैं आपके साथ हूँ।"
        : profile.languagePreference === 'hinglish'
        ? "Koi baat nahi 😊 Main aapke saath hoon."
        : "Koi baat nahi, I'm still right here with you 😊";

      addAIMessage(fallbackMsg, 'reassuring');
      setIsAIThinking(false);

      if (profile.voiceEnabled) {
        speakText(fallbackMsg, profile.languagePreference);
      }
    },
  });
}

interface FetchCompanionParams {
  currentInstruction: string;
  destinationName: string;
  landmarks?: string[];
  isOnRoute?: boolean;
}

/**
 * Hook for requesting a companion reassurance message.
 */
export function useAICompanionMessage() {
  const { profile } = useUserStore();

  return useMutation<CompanionResponse, Error, FetchCompanionParams>({
    mutationFn: async ({ currentInstruction, destinationName, landmarks, isOnRoute }) => {
      return fetchAICompanionMessage(
        currentInstruction,
        destinationName,
        landmarks,
        profile.languagePreference,
        isOnRoute ?? true,
      );
    },
    onSuccess: (data) => {
      if (profile.voiceEnabled && data.reassuranceText) {
        speakText(data.reassuranceText, profile.languagePreference);
      }
    },
  });
}

/**
 * Hook for GPT-4o Vision visual landmark analysis.
 */
export function useAIVision() {
  const { profile } = useUserStore();

  return useMutation({
    mutationFn: async ({ base64Image, prompt }: { base64Image: string; prompt?: string }) => {
      return analyzeImageWithVision(base64Image, prompt, profile.languagePreference);
    },
    onSuccess: (data) => {
      if (profile.voiceEnabled && data.visualGuidance) {
        speakText(data.visualGuidance, profile.languagePreference);
      }
    },
  });
}
