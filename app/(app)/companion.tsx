/**
 * WalkWithMe — Companion Screen (Milestone 2)
 *
 * Milestone 2 upgrades:
 * - Reads destination from Expo Router search params AND from navigation store
 * - Android back button shows a confirmation dialog before ending trip
 * - Step advancement via "Next Step" button (GPS advancement in M8)
 * - Full-screen mode when trip is active (tab bar hides)
 * - Progress bar shows trip completion percentage
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUserStore } from '@/store/useUserStore';
import { useChatStore } from '@/store/useChatStore';
import { useAppNavigation, useBackHandler, useSpeech, useLiveLocation, useAIChat } from '@/hooks';
import { CameraViewModal } from '@/features/camera';
import { toWalkingTime, translateInstruction } from '@/utils';

const { width, height } = Dimensions.get('window');

// ── Route Params ──────────────────────────────────────────────────────────

interface CompanionParams {
  destinationName?: string;
  destinationPlaceId?: string;
  destinationAddress?: string;
}

// ── Breathing Orb ─────────────────────────────────────────────────────────

function BreathingOrb({ isOnRoute }: { isOnRoute: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1.15, duration: 2200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.6, duration: 2200, useNativeDriver: true }),
        ]),
      ]),
    );
    breathe.start();
    return () => breathe.stop();
  }, [scaleAnim, opacityAnim]);

  const gradientColors = isOnRoute ? colors.gradients.success : colors.gradients.warmth;

  return (
    <View style={styles.orbContainer}>
      <Animated.View
        style={[
          styles.orbGlow,
          {
            backgroundColor: isOnRoute
              ? 'rgba(20, 184, 166, 0.18)'
              : 'rgba(244, 63, 94, 0.18)',
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <LinearGradient
        colors={gradientColors}
        style={styles.orb}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.orbIcon}>🚶‍♀️</Text>
      </LinearGradient>
    </View>
  );
}

// ── Action Button ─────────────────────────────────────────────────────────

interface ActionButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger' | 'primary';
  accessibilityLabel: string;
}

function ActionButton({ emoji, label, onPress, variant = 'default', accessibilityLabel }: ActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.91, useNativeDriver: true, tension: 300, friction: 10 }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();

  return (
    <Animated.View style={[styles.actionButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.actionButton,
          variant === 'danger' && styles.actionButtonDanger,
          variant === 'primary' && styles.actionButtonPrimary,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={1}
      >
        <Text style={styles.actionButtonEmoji}>{emoji}</Text>
        <Text
          style={[
            styles.actionButtonLabel,
            variant === 'danger' && styles.actionButtonLabelDanger,
            variant === 'primary' && styles.actionButtonLabelPrimary,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Companion Screen ──────────────────────────────────────────────────────

export default function CompanionScreen() {
  const insets = useSafeAreaInsets();
  const rawParams = useLocalSearchParams();
  const params: CompanionParams = {
    destinationName: rawParams.destinationName as string | undefined,
    destinationPlaceId: rawParams.destinationPlaceId as string | undefined,
    destinationAddress: rawParams.destinationAddress as string | undefined,
  };
  const {
    activeTrip,
    getCurrentStep,
    getRemainingSteps,
    getProgressPercent,
    advanceToNextStep,
    endTrip,
  } = useNavigationStore();
  const { profile } = useUserStore();
  const { openChat, goHome } = useAppNavigation();
  const { speak } = useSpeech();

  // Enable live GPS tracking & auto-advancement during active trips
  useLiveLocation(activeTrip?.status === 'active');

  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(24)).current;

  const currentStep = getCurrentStep();
  const remainingSteps = getRemainingSteps();
  const progressPercent = getProgressPercent();
  const isOnRoute = activeTrip?.isOnRoute ?? true;

  const rawInstruction = currentStep?.humanInstruction ?? '';
  const translatedInstruction = translateInstruction(rawInstruction, profile.languagePreference);

  // Animate message in & speak instruction aloud when step changes
  useEffect(() => {
    messageOpacity.setValue(0);
    messageTranslateY.setValue(24);

    Animated.parallel([
      Animated.timing(messageOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(messageTranslateY, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();

    if (translatedInstruction) {
      speak(translatedInstruction);
    }
  }, [currentStep?.id, translatedInstruction, messageOpacity, messageTranslateY, speak]);

  // ── Android back handler ─────────────────────────────────────────────────

  const handleBack = useCallback((): boolean => {
    if (activeTrip?.status === 'active') {
      Alert.alert(
        'End Trip?',
        'Are you sure you want to end this trip?',
        [
          { text: 'Keep Walking', style: 'cancel' },
          {
            text: 'End Trip',
            style: 'destructive',
            onPress: () => {
              endTrip();
              goHome();
            },
          },
        ],
      );
      return true; // Handled — don't let Android go back
    }
    return false;
  }, [activeTrip, endTrip, goHome]);

  useBackHandler(handleBack);

  // ── Destination name (from params or store) ──────────────────────────────

  const destinationName =
    params.destinationName ??
    activeTrip?.destination.name ??
    'Your Destination';

  // ── AI message logic ─────────────────────────────────────────────────────

  const companionMessage = (() => {
    if (!activeTrip) {
      if (profile.languagePreference === 'hi') return "नमस्ते! आप आज कहाँ जाना चाहते हैं?";
      if (profile.languagePreference === 'hinglish') return "Namaste! Aap aaj kahan jaana chahte ho?";
      return "Ready when you are! Select a destination to begin.";
    }
    if (activeTrip.status === 'completed') {
      if (profile.languagePreference === 'hi') return `आप ${destinationName} पहुँच गए! 🎉`;
      if (profile.languagePreference === 'hinglish') return `Aap ${destinationName} pahunch gaye! 🎉`;
      return `You reached ${destinationName}! 🎉`;
    }
    if (activeTrip.status === 'rerouting' || !isOnRoute) {
      if (profile.languagePreference === 'hi') return "कोई बात नहीं — चलिए नया रास्ता ढूंढते हैं 😊";
      if (profile.languagePreference === 'hinglish') return "Koi baat nahi — chalo naya rasta dhoondhte hain 😊";
      return "Looks like you took a wrong turn. Let's fix it together 😊";
    }
    if (remainingSteps === 0) {
      if (profile.languagePreference === 'hi') return `बस पहुँचने वाले हैं! ${destinationName} बहुत पास है 😊`;
      if (profile.languagePreference === 'hinglish') return `Bas pahunchne wale hain! ${destinationName} bahut paas hai 😊`;
      return `Almost there! ${destinationName} is very close 😊`;
    }
    return translatedInstruction || (profile.languagePreference === 'hi' ? "आप सही रास्ते पर हैं! आगे बढ़ते रहें।" : profile.languagePreference === 'hinglish' ? "Aap sahi raste pe ho! Aage chalte raho." : "You're on the right track! Keep walking.");
  })();

  const statusText = (() => {
    if (!activeTrip) return 'Ready when you are';
    if (activeTrip.status === 'completed') return 'Trip complete! 🎊';
    if (activeTrip.status === 'rerouting') return 'Recalculating...';
    if (!isOnRoute) return '⚠️ Off route';
    if (remainingSteps === 0) return 'Almost there!';
    return `${remainingSteps} step${remainingSteps !== 1 ? 's' : ''} remaining`;
  })();

  const walkingTimeText = (() => {
    if (!activeTrip) return '';
    const remaining = activeTrip.steps
      .slice(activeTrip.currentStepIndex)
      .reduce((sum, s) => sum + s.distanceMeters, 0);
    return toWalkingTime(remaining);
  })();

  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const { addUserMessage } = useChatStore();
  const aiChatMutation = useAIChat();

  const handleTalk = () => openChat();

  const handleCamera = () => {
    setIsCameraOpen(true);
  };

  const handleConfused = () => {
    const userMsgText = profile.languagePreference === 'hi'
      ? "मैं भ्रमित हूँ! मुझे क्या करना चाहिए?"
      : profile.languagePreference === 'hinglish'
      ? "Main confuse hoon! Mujhe kya karna chahiye?"
      : "I am confused right now! Where should I turn?";

    const userMsg = addUserMessage(userMsgText);

    // Call dynamic AI API with exact trip & step context
    aiChatMutation.mutate({
      messages: [userMsg],
      context: {
        currentInstruction: translatedInstruction || currentStep?.humanInstruction,
        destinationName: activeTrip?.destination.name,
        remainingSteps,
        isOnRoute: activeTrip?.isOnRoute ?? true,
      },
    });

    openChat();
  };

  const handleEndTrip = () => {
    Alert.alert(
      'End Trip?',
      'Are you sure you want to end this trip?',
      [
        { text: 'Keep Walking', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: () => {
            endTrip();
            goHome();
          },
        },
      ],
    );
  };

  const handleNextStep = () => {
    advanceToNextStep();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.dark.background, colors.dark.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing[2] }]}>
        <View style={styles.destinationRow}>
          <Text style={styles.destinationIcon}>📍</Text>
          <Text style={styles.destinationText} numberOfLines={1}>
            {destinationName}
          </Text>
          {walkingTimeText.length > 0 && (
            <View style={styles.walkingTimeBadge}>
              <Text style={styles.walkingTimeText}>{walkingTimeText}</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        {activeTrip && (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${Math.max(3, progressPercent)}%` },
              ]}
            />
          </View>
        )}
      </View>

      {/* Main content */}
      <ScrollView
        contentContainerStyle={[
          styles.mainContent,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {/* Breathing orb */}
        <BreathingOrb isOnRoute={isOnRoute} />

        {/* AI Message */}
        <Animated.View
          style={[
            styles.messageContainer,
            !isOnRoute && styles.messageContainerOffRoute,
            {
              opacity: messageOpacity,
              transform: [{ translateY: messageTranslateY }],
            },
          ]}
        >
          <Text style={styles.companionMessage}>{companionMessage}</Text>
        </Animated.View>

        {/* Status strip */}
        <View
          style={[styles.statusStrip, !isOnRoute && styles.statusStripOffRoute]}
          accessibilityLabel={`Navigation status: ${statusText}`}
        >
          <Text style={styles.statusDot}>{isOnRoute ? '🟢' : '🔴'}</Text>
          <Text style={[styles.statusText, !isOnRoute && styles.statusTextOffRoute]}>
            {statusText}
          </Text>
        </View>

        {/* DEV: Next Step button — shows current step advancement (replaces GPS in M8) */}
        {activeTrip?.status === 'active' && (
          <TouchableOpacity
            style={styles.nextStepButton}
            onPress={handleNextStep}
            accessibilityLabel="Advance to next navigation step"
          >
            <Text style={styles.nextStepText}>
              ▶ Next Step{' '}
              <Text style={styles.nextStepHint}>(demo only — GPS in M8)</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Action buttons */}
        <View style={styles.actionsGrid}>
          <ActionButton
            emoji="🎤"
            label="Talk"
            onPress={handleTalk}
            variant="primary"
            accessibilityLabel="Talk to AI companion"
          />
          <ActionButton
            emoji="📷"
            label="Camera"
            onPress={handleCamera}
            accessibilityLabel="Use camera for visual guidance"
          />
          <ActionButton
            emoji="😵"
            label="I'm Confused"
            onPress={handleConfused}
            accessibilityLabel="I am confused, open chat for help"
          />
          <ActionButton
            emoji="🏁"
            label="End Trip"
            onPress={handleEndTrip}
            variant="danger"
            accessibilityLabel="End this navigation trip"
          />
        </View>
      </ScrollView>

      {/* Camera & GPT Vision Viewfinder Modal */}
      <CameraViewModal
        visible={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },

  // ── Top bar ──────────────────────────────────────────────────────────────

  topBar: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },

  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },

  destinationIcon: { fontSize: 16 },

  destinationText: {
    ...textStyles.bodyMedium,
    color: colors.dark.textSecondary,
    flex: 1,
  },

  walkingTimeBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },

  walkingTimeText: {
    ...textStyles.caption,
    color: colors.primaryLight,
    fontFamily: 'Inter_500Medium',
  },

  progressTrack: {
    height: 4,
    backgroundColor: colors.dark.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: borderRadius.full,
  },

  // ── Main content ──────────────────────────────────────────────────────────

  mainContent: {
    alignItems: 'center',
    paddingTop: spacing[8],
    paddingHorizontal: spacing[4],
    minHeight: height * 0.75,
    justifyContent: 'space-between',
  },

  // ── Orb ──────────────────────────────────────────────────────────────────

  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },

  orbGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
  },

  orb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },

  orbIcon: { fontSize: 38 },

  // ── Message ───────────────────────────────────────────────────────────────

  messageContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: spacing[5],
    ...shadow.glow,
  },

  messageContainerOffRoute: {
    borderColor: 'rgba(244, 63, 94, 0.35)',
    ...shadow.glowRose,
  },

  companionMessage: {
    ...textStyles.companionMessage,
    color: colors.dark.text,
    textAlign: 'center',
  },

  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginBottom: spacing[4],
  },

  statusStripOffRoute: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },

  statusDot: { fontSize: 14 },

  statusText: {
    ...textStyles.label,
    color: '#10B981',
    textTransform: 'none',
    fontSize: 14,
    letterSpacing: 0,
    fontWeight: '700',
  },

  statusTextOffRoute: { color: '#F43F5E' },

  // ── Next step ─────────────────────────────────────────────────────────────

  nextStepButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    marginBottom: spacing[4],
  },

  nextStepText: {
    ...textStyles.caption,
    color: '#F59E0B',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
  },

  nextStepHint: {
    color: colors.dark.textTertiary,
    fontWeight: '400',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    width: '100%',
    justifyContent: 'center',
  },

  actionButtonWrapper: {
    width: (width - spacing[4] * 2 - spacing[3] * 3) / 2,
  },

  actionButton: {
    backgroundColor: 'rgba(32, 35, 51, 0.95)',
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing[5],
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    ...shadow.glow,
  },

  actionButtonPrimary: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },

  actionButtonDanger: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },

  actionButtonEmoji: { fontSize: 32, marginBottom: spacing[2] },

  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  actionButtonLabelPrimary: { color: '#10B981' },
  actionButtonLabelDanger: { color: '#F43F5E' },
});
