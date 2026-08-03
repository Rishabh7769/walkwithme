/**
 * WalkWithMe — AI Types
 *
 * Covers: chat messages, AI responses, companion states, language detection.
 */

import type { Language } from './user.types';

// ── Message roles ──────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageContentType = 'text' | 'voice' | 'image';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  contentType: MessageContentType;
  /** If contentType is 'image', this holds the local URI or remote URL */
  imageUri?: string;
  /** Timestamp ISO string */
  createdAt: string;
  /** True while streaming from API */
  isStreaming?: boolean;
}

// ── Companion AI state ────────────────────────────────────────────────────

/**
 * The emotional/functional tone of the AI's current message.
 * Used to select animations, colors, and voice tone.
 */
export type CompanionMood =
  | 'guiding'        // Normal instruction: "Walk toward the signal"
  | 'reassuring'     // Positive: "You're doing great!"
  | 'correcting'     // Wrong turn: "Let's fix this together"
  | 'celebrating'    // Arrived: "You made it! 🎉"
  | 'waiting'        // Waiting for user: "Take your time"
  | 'thinking';      // AI is processing

export interface CompanionMessage {
  text: string;
  mood: CompanionMood;
  detectedLanguage: Language;
}

// ── API Request / Response ────────────────────────────────────────────────

export interface ChatRequest {
  messages: Array<{ role: MessageRole; content: string }>;
  language: Language;
  /** Current trip context injected by client */
  context?: {
    currentInstruction?: string;
    destinationName?: string;
    remainingSteps?: number;
    isOnRoute?: boolean;
  };
}

export interface ChatResponse {
  message: string;
  mood: CompanionMood;
  detectedLanguage: Language;
}

export interface CompanionRequest {
  currentInstruction: string;
  destinationName?: string;
  userLocation: { latitude: number; longitude: number };
  nearbyLandmarks: string[];
  language: Language;
  previousMessages: Array<{ role: MessageRole; content: string }>;
}

export interface CompanionResponse {
  reassuranceText: string;
  mood: CompanionMood;
  detectedLanguage: Language;
}
