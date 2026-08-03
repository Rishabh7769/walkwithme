/**
 * WalkWithMe — Chat Screen
 *
 * A warm, calming conversation interface with the AI companion.
 *
 * Supports:
 * - Text messages
 * - Voice input (Milestone 6)
 * - Image input (Milestone 7)
 * - Streaming AI responses
 *
 * Design intent: Feels like WhatsApp, but warmer and calmer.
 * The AI bubble has a soft glow. No harsh colors.
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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';
import { useChatStore } from '@/store/useChatStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useAppNavigation, useBackHandler, useAIChat } from '@/hooks';
import { VoiceInputModal } from '@/features/chat';
import type { ChatMessage } from '@/types';

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
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* AI avatar */}
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarEmoji}>🤖</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {/* AI gradient border */}
        {!isUser && (
          <LinearGradient
            colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.05)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        {message.isStreaming ? (
          <TypingIndicator />
        ) : (
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
            {message.content}
          </Text>
        )}

        <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAI]}>
          {formattedTime}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.typingContainer}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

// ── Welcome state ─────────────────────────────────────────────────────────

function WelcomeState() {
  return (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeEmoji}>💬</Text>
      <Text style={styles.welcomeTitle}>Talk to me!</Text>
      <Text style={styles.welcomeSubtitle}>
        Ask anything — directions, landmarks, or just say you're confused.
        I'll help you out 😊
      </Text>
    </View>
  );
}

// ── Chat Screen ───────────────────────────────────────────────────────────

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { messages, isAIThinking, addUserMessage } = useChatStore();
  const { activeTrip, getCurrentStep, getRemainingSteps } = useNavigationStore();
  const { backToCompanion, goHome } = useAppNavigation();
  const aiChatMutation = useAIChat();

  const [inputText, setInputText] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Android back — go back to companion if trip active, else home
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
    const userMsg = addUserMessage(text);
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

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
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

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={[colors.dark.background, colors.dark.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          accessibilityRole="button"
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
              <Text style={styles.onlineText}>
                {activeTrip?.status === 'active' ? `Going to ${activeTrip.destination.name}` : 'Always here for you'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.messageListEmpty,
        ]}
        ListEmptyComponent={<WelcomeState />}
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

      {/* Input area */}
      <View
        style={[
          styles.inputArea,
          { paddingBottom: Math.max(insets.bottom, spacing[4]) },
        ]}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.dark.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            accessibilityLabel="Type your message to the AI companion"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          {/* Voice button */}
          <TouchableOpacity
            onPress={handleVoiceInput}
            style={styles.iconButton}
            accessibilityLabel="Voice input"
          >
            <Text style={styles.iconButtonEmoji}>🎤</Text>
          </TouchableOpacity>

          {/* Send button */}
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            disabled={!inputText.trim()}
            accessibilityLabel="Send message"
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

      {/* Voice Input Modal */}
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

  // ── Header ──────────────────────────────────────────────────────────────

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
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    flexShrink: 0,
  },

  aiAvatarEmoji: { fontSize: 16 },

  bubble: {
    maxWidth: '75%',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    overflow: 'hidden',
  },

  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },

  bubbleAI: {
    backgroundColor: colors.dark.card,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderBottomLeftRadius: borderRadius.sm,
    ...shadow.sm,
  },

  bubbleText: {
    ...textStyles.chatMessage,
    lineHeight: 22,
  },

  bubbleTextUser: {
    color: '#FFFFFF',
  },

  bubbleTextAI: {
    color: colors.dark.text,
  },

  timestamp: {
    ...textStyles.caption,
    marginTop: spacing[1],
    textAlign: 'right',
  },

  timestampUser: {
    color: 'rgba(255,255,255,0.6)',
  },

  timestampAI: {
    color: colors.dark.textTertiary,
  },

  // ── Typing indicator ──────────────────────────────────────────────────────

  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing[1],
  },

  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // ── Welcome ───────────────────────────────────────────────────────────────

  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
  },

  welcomeEmoji: {
    fontSize: 52,
    marginBottom: spacing[4],
  },

  welcomeTitle: {
    ...textStyles.screenTitle,
    color: colors.dark.text,
    marginBottom: spacing[3],
    textAlign: 'center',
  },

  welcomeSubtitle: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
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
    alignItems: 'flex-end',
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
    borderColor: colors.dark.border,
    maxHeight: 120,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },

  iconButtonEmoji: { fontSize: 20 },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 18,
    color: '#FFFFFF',
  },
});
