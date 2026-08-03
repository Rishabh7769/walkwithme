/**
 * WalkWithMe — Chat Store
 *
 * Manages the chat conversation history between the user and AI companion.
 * Persisted across sessions so users can review past conversations.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ChatMessage, CompanionMood, Language } from '@/types';
import { STORAGE_KEYS, MAX_CHAT_HISTORY } from '@/constants';
import { safeStorage } from '@/utils';

// ── State Interface ────────────────────────────────────────────────────────

interface ChatState {
  messages: ChatMessage[];
  isAIThinking: boolean;
  lastDetectedLanguage: Language;
  streamingMessageId: string | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  addUserMessage: (content: string, contentType?: ChatMessage['contentType']) => ChatMessage;
  addAIMessage: (content: string, mood?: CompanionMood) => ChatMessage;
  updateStreamingMessage: (id: string, content: string) => void;
  finalizeStreamingMessage: (id: string, mood?: CompanionMood) => void;
  setIsAIThinking: (thinking: boolean) => void;
  setLastDetectedLanguage: (language: Language) => void;
  clearMessages: () => void;
  getLastNMessages: (n: number) => ChatMessage[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isAIThinking: false,
      lastDetectedLanguage: 'auto',
      streamingMessageId: null,

      addMessage: (message) =>
        set((state) => {
          const updated = [...state.messages, message];
          // Cap history to prevent memory bloat
          if (updated.length > MAX_CHAT_HISTORY) {
            return { messages: updated.slice(updated.length - MAX_CHAT_HISTORY) };
          }
          return { messages: updated };
        }),

      addUserMessage: (content, contentType = 'text') => {
        const message: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          contentType,
          createdAt: new Date().toISOString(),
        };
        get().addMessage(message);
        return message;
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      addAIMessage: (content, _mood: CompanionMood = 'guiding') => {
        const message: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content,
          contentType: 'text',
          createdAt: new Date().toISOString(),
        };
        get().addMessage(message);
        return message;
      },

      updateStreamingMessage: (id, content) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, content, isStreaming: true } : msg,
          ),
        })),

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      finalizeStreamingMessage: (id: string, _mood?: CompanionMood) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, isStreaming: false } : msg,
          ),
          streamingMessageId: null,
          isAIThinking: false,
        })),

      setIsAIThinking: (thinking) =>
        set({ isAIThinking: thinking }),

      setLastDetectedLanguage: (language) =>
        set({ lastDetectedLanguage: language }),

      clearMessages: () =>
        set({ messages: [] }),

      getLastNMessages: (n) => {
        const { messages } = get();
        return messages.slice(-n);
      },
    }),
    {
      name: STORAGE_KEYS.USER_PROFILE + '/chat',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Only persist last 50 messages
        lastDetectedLanguage: state.lastDetectedLanguage,
      }),
    },
  ),
);
