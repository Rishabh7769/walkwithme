/**
 * WalkWithMe — Chat Screen (Lovable Ultra-Premium AI Companion UI)
 *
 * Full multi-lingual AI companion conversation interface with:
 * - Sparkles companion header with active walk context pill
 * - Glowing emerald AI message bubbles & dark obsidian user bubbles
 * - Built-in hands-free Voice Input modal (🎤) & live TTS speech playback
 * - Quick prompt chips (English, Hindi, Hinglish)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { textStyles, spacing, borderRadius, shadow } from '@/theme';
import { useChatStore } from '@/store/useChatStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUserStore } from '@/store/useUserStore';
import { useAppNavigation, useBackHandler, useAIChat, useSpeech } from '@/hooks';
import { VoiceInputModal } from '@/features/chat';
import type { ChatMessage } from '@/types';

// Quick Prompts
const QUICK_PROMPTS_EN = [
  "Am I going the right way?",
  "Where am I right now?",
  "I'm confused, please guide me",
  "How far is my destination?",
];

const QUICK_PROMPTS_HI = [
  "क्या मैं सही रास्ते पर जा रहा हूँ?",
  "मैं अभी कहाँ हूँ?",
  "मुझे रास्ते में भ्रम हो रहा है",
  "मंज़िल कितनी दूर है?",
];

const QUICK_PROMPTS_HINGLISH = [
  "Kya main sahi raste pe hoon?",
  "Main abhi kahan hoon?",
  "Main confuse hoon, help me",
  "Destination kitni door hai?",
];

// Message Bubble
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI, { opacity: fadeAnim }]}>
      {!isUser && (
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeEmoji}>✨</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {message.content}
        </Text>
      </View>
    </Animated.View>
  );
}

// Typing Indicator
function TypingIndicator() {
  const dot = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dot, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeEmoji}>✨</Text>
      </View>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.dot, { opacity: dot }]} />
        <Animated.View style={[styles.dot, { opacity: dot }]} />
        <Animated.View style={[styles.dot, { opacity: dot }]} />
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { messages, isAIThinking, addUserMessage } = useChatStore();
  const { activeTrip, getCurrentStep, getRemainingSteps } = useNavigationStore();
  const { profile } = useUserStore();
  const { backToCompanion } = useAppNavigation();
  const { speak } = useSpeech();
  const aiChatMutation = useAIChat();

  const [inputText, setInputText] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleBack = useCallback((): boolean => {
    if (activeTrip?.status === 'active') {
      backToCompanion();
      return true;
    }
    return false;
  }, [activeTrip, backToCompanion]);

  useBackHandler(handleBack);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendTextToAI = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setInputText('');
    const userMsg = addUserMessage(cleanText);
    const updatedMessages = [...messages, userMsg];

    const currentStep = getCurrentStep();
    const remainingSteps = getRemainingSteps();

    aiChatMutation.mutate(
      {
        messages: updatedMessages,
        context: {
          currentInstruction: currentStep?.humanInstruction,
          destinationName: activeTrip?.destination.name,
          remainingSteps,
          isOnRoute: activeTrip?.isOnRoute ?? true,
        },
      },
      {
        onSuccess: (response) => {
          if (response.message) {
            speak(response.message);
          }
        },
      },
    );
  };

  const getPrompts = () => {
    if (profile.languagePreference === 'hi') return QUICK_PROMPTS_HI;
    if (profile.languagePreference === 'hinglish') return QUICK_PROMPTS_HINGLISH;
    return QUICK_PROMPTS_EN;
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.sparkleIcon}>✨</Text>
          <Text style={styles.headerTitle}>Ask your companion</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {activeTrip ? `Active trip → ${activeTrip.destination.name}` : 'Always walking right beside you'}
        </Text>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={isAIThinking ? <TypingIndicator /> : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>How can I help you walk today?</Text>
            <Text style={styles.emptySubtitle}>
              Ask anything about your route, landmarks around you, or just talk to stay calm.
            </Text>
            <View style={styles.promptsGrid}>
              {getPrompts().map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.promptPill}
                  onPress={() => sendTextToAI(p)}
                >
                  <Text style={styles.promptText}>💡 {p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {/* Input Bar */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing[3] }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type quietly or ask a question..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendTextToAI(inputText)}
            returnKeyType="send"
          />

          {/* Voice Input Button */}
          <TouchableOpacity
            style={styles.voiceIconBtn}
            onPress={() => setIsVoiceModalOpen(true)}
            accessibilityLabel="Voice chat"
          >
            <Text style={styles.voiceEmoji}>🎤</Text>
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            style={styles.sendIconBtn}
            onPress={() => sendTextToAI(inputText)}
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendEmoji}>➔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice Chat Modal */}
      <VoiceInputModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSendVoiceText={(voiceText) => sendTextToAI(voiceText)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0D14',
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    backgroundColor: 'rgba(22, 25, 38, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sparkleIcon: {
    fontSize: 18,
  },
  headerTitle: {
    ...textStyles.screenTitle,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing[2.5],
    gap: spacing[2],
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAI: {
    justifyContent: 'flex-start',
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeEmoji: {
    fontSize: 14,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  bubbleUser: {
    backgroundColor: 'rgba(32, 35, 51, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bubbleAI: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    ...shadow.md,
  },
  bubbleText: {
    ...textStyles.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTextAI: {
    color: '#FFFFFF',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginVertical: spacing[2],
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  emptyTitle: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing[1.5],
    lineHeight: 18,
  },
  promptsGrid: {
    width: '100%',
    marginTop: spacing[6],
    gap: spacing[2.5],
  },
  promptPill: {
    backgroundColor: 'rgba(22, 25, 38, 0.7)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  promptText: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontSize: 13,
  },
  inputContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    backgroundColor: '#0B0D14',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 25, 38, 0.9)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  textInput: {
    flex: 1,
    ...textStyles.body,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: spacing[1],
  },
  voiceIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceEmoji: {
    fontSize: 16,
  },
  sendIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendEmoji: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
