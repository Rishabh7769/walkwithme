/**
 * WalkWithMe — Chat Screen with AI Companion
 *
 * Features:
 * - Prominent text input bar with quick prompt chips
 * - Full hands-free voice input via microphone
 * - Real-time spoken voice response output
 * - Multi-lingual support (English, Hindi, Hinglish)
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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';
import { useChatStore } from '@/store/useChatStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUserStore } from '@/store/useUserStore';
import { useAppNavigation, useBackHandler, useAIChat } from '@/hooks';
import { VoiceInputModal } from '@/features/chat';
import type { ChatMessage } from '@/types';

// ── Quick Prompt Chips Pool ────────────────────────────────────────────────

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

// ── Message Bubble ─────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAI,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarEmoji}>🤖</Text>
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAI,
        ]}
      >
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {message.content}
        </Text>

        <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeAI]}>
          {formattedTime}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Typing Indicator ───────────────────────────────────────────────────────

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ]),
      );

    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 150);
    const a3 = animateDot(dot3, 300);

    a1.start(); a2.start(); a3.start();

    return () => {
      a1.stop(); a2.stop(); a3.stop();
    };
  }, []);

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

// ── Welcome Empty State ────────────────────────────────────────────────────

function WelcomeState({ onSelectPrompt, language }: { onSelectPrompt: (p: string) => void; language: string }) {
  let prompts = QUICK_PROMPTS_EN;
  let title = "How can I help you walk today?";
  let subtitle = "Ask anything about your route, landmarks around you, or just talk to stay calm while walking.";

  if (language === 'hi') {
    prompts = QUICK_PROMPTS_HI;
    title = "मैं आपकी कैसे मदद कर सकता हूँ?";
    subtitle = "अपने रास्ते, आसपास की जगहों के बारे में पूछें, या चलते समय शांत महसूस करने के लिए बात करें।";
  } else if (language === 'hinglish') {
    prompts = QUICK_PROMPTS_HINGLISH;
    title = "Main aapki kaise help karoon?";
    subtitle = "Apne raste, landmarks ke bare mein poochho, ya walking ke dauran relax feel karne ke liye baat karo.";
  }

  return (
    <View style={styles.welcomeContainer}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.15)', 'rgba(139, 92, 246, 0.05)']}
        style={styles.welcomeCard}
      >
        <Text style={styles.welcomeEmoji}>🚶‍♀️🤖</Text>
        <Text style={styles.welcomeTitle}>{title}</Text>
        <Text style={styles.welcomeSubtitle}>{subtitle}</Text>
      </LinearGradient>

      <Text style={styles.promptsHeader}>Tap to ask instantly:</Text>
      <View style={styles.promptsGrid}>
        {prompts.map((prompt, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.promptChip}
            onPress={() => onSelectPrompt(prompt)}
            activeOpacity={0.7}
          >
            <Text style={styles.promptChipText}>💡 {prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main Chat Screen ───────────────────────────────────────────────────────

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { messages, isAIThinking, addUserMessage } = useChatStore();
  const { activeTrip, getCurrentStep, getRemainingSteps } = useNavigationStore();
  const { profile } = useUserStore();
  const { backToCompanion, goHome } = useAppNavigation();
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
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const sendTextToAI = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const userMsg = addUserMessage(cleanText);
    const updatedMessages = [...messages, userMsg];

    const currentStep = getCurrentStep();
    const remainingSteps = getRemainingSteps();

    aiChatMutation.mutate({
      messages: updatedMessages,
      context: {
        currentInstruction: currentStep?.humanInstruction,
        destinationName: activeTrip?.destination.name,
        remainingSteps,
        isOnRoute: activeTrip?.isOnRoute ?? true,
      },
    });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    sendTextToAI(text);
  };

  const handleVoiceInput = () => {
    setIsVoiceModalOpen(true);
  };

  const handleSendVoiceText = (transcription: string) => {
    sendTextToAI(transcription);
  };

  const handleBackPress = () => {
    if (activeTrip?.status === 'active') {
      backToCompanion();
    } else {
      goHome();
    }
  };

  const activePrompts = profile.languagePreference === 'hi'
    ? QUICK_PROMPTS_HI
    : profile.languagePreference === 'hinglish'
    ? QUICK_PROMPTS_HINGLISH
    : QUICK_PROMPTS_EN;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing[4]) }]}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.aiInfo}>
          <View style={styles.aiIconWrapper}>
            <Text style={styles.aiIcon}>🤖</Text>
          </View>

          <View>
            <Text style={styles.aiName}>WalkWithMe AI</Text>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Always listening & guiding</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.messageListEmpty,
        ]}
        ListEmptyComponent={
          <WelcomeState
            onSelectPrompt={(p) => sendTextToAI(p)}
            language={profile.languagePreference}
          />
        }
        ListFooterComponent={
          isAIThinking ? (
            <View style={[styles.bubbleRow, styles.bubbleRowAI]}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarEmoji}>🤖</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleAI]}>
                <TypingIndicator />
              </View>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Horizontal Suggestions Bar */}
      {messages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScrollView}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {activePrompts.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.miniChip}
              onPress={() => sendTextToAI(p)}
            >
              <Text style={styles.miniChipText}>💡 {p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Prominent Input Bar */}
      <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom + spacing[2], spacing[4]) }]}>
        <View style={styles.inputRow}>
          {/* TextInput */}
          <TextInput
            style={styles.textInput}
            placeholder={profile.languagePreference === 'hi' ? "संदेश टाइप करें..." : profile.languagePreference === 'hinglish' ? "Message type karein..." : "Type a message..."}
            placeholderTextColor={colors.dark.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            accessibilityLabel="Type your message to the AI companion"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          {/* Voice Microphone Button */}
          <TouchableOpacity
            onPress={handleVoiceInput}
            style={styles.voiceButton}
            accessibilityLabel="Voice microphone input"
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.voiceGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.voiceEmoji}>🎤</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            disabled={!inputText.trim()}
            accessibilityLabel="Send text message"
          >
            <LinearGradient
              colors={inputText.trim() ? colors.gradients.primary : ['#2D2D3D', '#2D2D3D']}
              style={styles.sendButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hands-free Voice Input Modal */}
      <VoiceInputModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSendVoiceText={handleSendVoiceText}
      />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    gap: spacing[3],
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },

  backIcon: {
    fontSize: 18,
    color: colors.dark.text,
  },

  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },

  aiIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },

  aiIcon: { fontSize: 22 },

  aiName: {
    ...textStyles.bodyMedium,
    color: colors.dark.text,
  },

  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: 2,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  onlineText: {
    ...textStyles.caption,
    color: colors.dark.textSecondary,
  },

  // ── Messages ─────────────────────────────────────────────────────────────

  messageList: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },

  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  bubbleRow: {
    flexDirection: 'row',
    marginBottom: spacing[3],
    alignItems: 'flex-end',
    gap: spacing[2],
  },

  bubbleRowUser: {
    justifyContent: 'flex-end',
  },

  bubbleRowAI: {
    justifyContent: 'flex-start',
  },

  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  aiAvatarEmoji: { fontSize: 16 },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius['2xl'],
  },

  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },

  bubbleAI: {
    backgroundColor: colors.dark.card,
    borderBottomLeftRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },

  bubbleText: {
    ...textStyles.body,
    lineHeight: 22,
  },

  bubbleTextUser: {
    color: '#FFFFFF',
  },

  bubbleTextAI: {
    color: colors.dark.text,
  },

  bubbleTime: {
    ...textStyles.caption,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  bubbleTimeUser: {
    color: 'rgba(255,255,255,0.7)',
  },

  bubbleTimeAI: {
    color: colors.dark.textSecondary,
  },

  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primaryLight,
  },

  // ── Empty State ──────────────────────────────────────────────────────────

  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },

  welcomeCard: {
    width: '100%',
    padding: spacing[6],
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },

  welcomeEmoji: { fontSize: 44, marginBottom: spacing[3] },

  welcomeTitle: {
    ...textStyles.sectionHeader,
    color: colors.dark.text,
    textAlign: 'center',
    marginBottom: spacing[2],
  },

  welcomeSubtitle: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  promptsHeader: {
    ...textStyles.bodyMedium,
    color: colors.dark.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: spacing[3],
  },

  promptsGrid: {
    width: '100%',
    gap: spacing[2],
  },

  promptChip: {
    backgroundColor: colors.dark.card,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },

  promptChipText: {
    ...textStyles.body,
    color: colors.dark.text,
  },

  // ── Suggestions Scroll ────────────────────────────────────────────────────

  chipsScrollView: {
    maxHeight: 46,
    backgroundColor: colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },

  chipsScrollContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },

  miniChip: {
    backgroundColor: colors.dark.card,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },

  miniChipText: {
    ...textStyles.caption,
    color: colors.dark.text,
  },

  // ── Input ─────────────────────────────────────────────────────────────────

  inputArea: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    backgroundColor: colors.dark.surface,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  textInput: {
    flex: 1,
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    ...textStyles.body,
    color: colors.dark.text,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    minHeight: 48,
    maxHeight: 100,
  },

  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.glow,
  },

  voiceGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  voiceEmoji: {
    fontSize: 22,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },

  sendButtonDisabled: {
    opacity: 0.4,
  },

  sendButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
