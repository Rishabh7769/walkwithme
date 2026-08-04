/**
 * WalkWithMe — Companion Screen (Lovable Ultra-Premium Design)
 *
 * Full real-time AI walking guidance UI with:
 * - Animated AuraOrb (breathing glass core + equalizer waveform)
 * - Header status card with progress bar, ETA, and distance
 * - Next Step Card with landmark guidance & reassurance pills
 * - Floating action dock (Hold to Speak, Camera Vision, Chat Drawer, Speech toggle)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { textStyles, spacing, borderRadius, shadow } from '@/theme';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUserStore } from '@/store/useUserStore';
import { useAppNavigation, useBackHandler, useSpeech, useLiveLocation } from '@/hooks';
import { CameraViewModal } from '@/features/camera';
import { AuraOrb } from '@/features/companion/components/AuraOrb';
import { toWalkingTime, translateInstruction } from '@/utils';

interface CompanionParams {
  destinationName?: string;
  destinationPlaceId?: string;
  destinationAddress?: string;
}

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
    getProgressPercent,
    advanceToNextStep,
    endTrip,
  } = useNavigationStore();

  const { profile } = useUserStore();
  const { openChat, goHome } = useAppNavigation();
  const { speak, isSpeaking, stop } = useSpeech();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHoldingMic, setIsHoldingMic] = useState(false);

  // Enable live GPS tracking & auto-advancement during active trips
  useLiveLocation(activeTrip?.status === 'active');

  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(24)).current;

  const currentStep = getCurrentStep();
  const progressPercent = getProgressPercent();
  const isOnRoute = activeTrip?.isOnRoute ?? true;

  const rawInstruction = currentStep?.humanInstruction ?? '';
  const translatedInstruction = translateInstruction(rawInstruction, profile.languagePreference);

  // Speak instruction aloud when step changes
  useEffect(() => {
    messageOpacity.setValue(0);
    messageTranslateY.setValue(24);

    Animated.parallel([
      Animated.timing(messageOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(messageTranslateY, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();

    if (translatedInstruction && !isMuted) {
      speak(translatedInstruction);
    }
  }, [currentStep?.id, translatedInstruction, messageOpacity, messageTranslateY, speak, isMuted]);

  // Back handler for Android
  const handleBack = useCallback((): boolean => {
    if (activeTrip?.status === 'active') {
      Alert.alert(
        'End Walk?',
        'Are you sure you want to end your current walking trip?',
        [
          { text: 'Keep Walking', style: 'cancel' },
          {
            text: 'End Walk',
            style: 'destructive',
            onPress: () => {
              endTrip();
              goHome();
            },
          },
        ],
      );
      return true;
    }
    return false;
  }, [activeTrip, endTrip, goHome]);

  useBackHandler(handleBack);

  const destinationName =
    params.destinationName ??
    activeTrip?.destination.name ??
    'Your Destination';

  // Reassurance message logic
  const reassuranceText = (() => {
    if (!activeTrip) {
      return "Ready when you are! Select a destination on Home screen to start.";
    }
    if (activeTrip.status === 'completed') {
      return `You reached ${destinationName}! 🎉`;
    }
    if (!isOnRoute) {
      return "Looks like you took a wrong turn. Let's fix it together 😊";
    }
    return `You're doing great! ${toWalkingTime(activeTrip.totalDurationSeconds)} away 😊`;
  })();

  const handleEndTrip = () => {
    Alert.alert(
      'End Walk?',
      'Are you sure you want to stop navigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Walk',
          style: 'destructive',
          onPress: () => {
            endTrip();
            goHome();
          },
        },
      ],
    );
  };

  const toggleMute = () => {
    if (!isMuted) {
      stop();
      setIsMuted(true);
    } else {
      setIsMuted(false);
      if (translatedInstruction) speak(translatedInstruction);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[3], paddingBottom: insets.bottom + spacing[4] }]}>
      {/* Mesh Background Ambient Glow */}
      <View style={styles.meshGlowTop} />
      <View style={styles.meshGlowBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Top Header Status Card ──────────────────────────────────────── */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextCol}>
              <View style={styles.onRouteBadge}>
                <View style={[styles.pulseDot, !isOnRoute && styles.pulseDotWarning]} />
                <Text style={[styles.onRouteText, !isOnRoute && styles.onRouteTextWarning]}>
                  {isOnRoute ? 'ON ROUTE' : 'RE-ROUTING'}
                </Text>
              </View>
              <Text style={styles.destinationTitle} numberOfLines={1}>
                {destinationName}
              </Text>
              <Text style={styles.metaSubtitle}>
                {activeTrip ? `${Math.round(activeTrip.totalDistanceMeters)} m • ${toWalkingTime(activeTrip.totalDurationSeconds)}` : 'No active route'}
              </Text>
            </View>

            <TouchableOpacity style={styles.endWalkBtn} onPress={handleEndTrip} activeOpacity={0.8}>
              <Text style={styles.endWalkText}>✕ End walk</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(5, progressPercent)}%` }]} />
          </View>
        </View>

        {/* ── Center Aura Orb ───────────────────────────────────────────── */}
        <View style={styles.auraSection}>
          <AuraOrb
            speaking={isSpeaking || isHoldingMic}
            size={200}
            mode={isHoldingMic ? 'listening' : !isOnRoute ? 'correcting' : 'guiding'}
          />

          {/* Next Step Instruction Card */}
          <Animated.View
            style={[
              styles.instructionCard,
              {
                opacity: messageOpacity,
                transform: [{ translateY: messageTranslateY }],
              },
            ]}
          >
            <Text style={styles.stepHeaderLabel}>NEXT STEP</Text>
            <Text style={styles.instructionText}>
              {translatedInstruction || 'Walk straight ahead towards your destination.'}
            </Text>

            {currentStep?.landmarks && currentStep.landmarks.length > 0 ? (
              <Text style={styles.landmarkSubtitle}>
                📍 Near {currentStep.landmarks.join(', ')}
              </Text>
            ) : null}
          </Animated.View>

          {/* Reassurance Pill */}
          <View style={styles.reassurancePill}>
            <View style={styles.reassuranceDot} />
            <Text style={styles.reassuranceText}>{reassuranceText}</Text>
          </View>

          {/* Next Step Manual Advance Button */}
          {activeTrip?.status === 'active' && (
            <TouchableOpacity style={styles.nextStepBtn} onPress={advanceToNextStep} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(245, 158, 11, 0.2)']} style={styles.nextStepGradient}>
                <Text style={styles.nextStepBtnText}>Next Step →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── Bottom Floating Dock ──────────────────────────────────────────── */}
      <View style={styles.dockContainer}>
        <View style={styles.dockInner}>
          {/* Hold / Press to Speak Button */}
          <TouchableOpacity
            style={[styles.micDockBtn, isHoldingMic && styles.micDockBtnActive]}
            onPressIn={() => setIsHoldingMic(true)}
            onPressOut={() => {
              setIsHoldingMic(false);
              openChat();
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.micIcon}>🎤</Text>
            <Text style={styles.micText}>{isHoldingMic ? 'Listening...' : 'Hold to speak'}</Text>
          </TouchableOpacity>

          {/* Camera Vision Icon */}
          <TouchableOpacity
            style={styles.dockIconBtn}
            onPress={() => setIsCameraOpen(true)}
            accessibilityLabel="Camera vision"
          >
            <Text style={styles.dockEmoji}>📷</Text>
          </TouchableOpacity>

          {/* Quick Chat Icon */}
          <TouchableOpacity
            style={styles.dockIconBtn}
            onPress={openChat}
            accessibilityLabel="Quick chat"
          >
            <Text style={styles.dockEmoji}>💬</Text>
          </TouchableOpacity>

          {/* Mute/Unmute Guidance Icon */}
          <TouchableOpacity
            style={[styles.dockIconBtn, isMuted && styles.dockIconBtnActive]}
            onPress={toggleMute}
            accessibilityLabel="Mute audio guidance"
          >
            <Text style={styles.dockEmoji}>{isMuted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Vision Modal */}
      <CameraViewModal visible={isCameraOpen} onClose={() => setIsCameraOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0D14',
  },
  meshGlowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 110,
  },
  meshGlowBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 125,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: 110,
  },

  // ── Header Card ──────────────────────────────────────────────────────────
  headerCard: {
    backgroundColor: 'rgba(22, 25, 38, 0.75)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing[4],
    ...shadow.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  headerTextCol: {
    flex: 1,
  },
  onRouteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  pulseDotWarning: {
    backgroundColor: '#F43F5E',
  },
  onRouteText: {
    ...textStyles.caption,
    color: '#10B981',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  onRouteTextWarning: {
    color: '#F43F5E',
  },
  destinationTitle: {
    ...textStyles.screenTitle,
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: spacing[1],
  },
  metaSubtitle: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  endWalkBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  endWalkText: {
    ...textStyles.caption,
    color: '#F43F5E',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    marginTop: spacing[3.5],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },

  // ── Aura Section ──────────────────────────────────────────────────────────
  auraSection: {
    alignItems: 'center',
    marginTop: spacing[6],
  },
  instructionCard: {
    backgroundColor: 'rgba(22, 25, 38, 0.75)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing[5],
    width: '100%',
    alignItems: 'center',
    marginTop: spacing[5],
    ...shadow.md,
  },
  stepHeaderLabel: {
    ...textStyles.caption,
    color: '#F59E0B',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  instructionText: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: 24,
  },
  landmarkSubtitle: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    marginTop: spacing[2],
  },
  reassurancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[2],
    marginTop: spacing[3.5],
    gap: spacing[2],
  },
  reassuranceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  reassuranceText: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontSize: 12,
  },
  nextStepBtn: {
    marginTop: spacing[4],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  nextStepGradient: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  nextStepBtnText: {
    ...textStyles.bodyMedium,
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },

  // ── Bottom Dock ───────────────────────────────────────────────────────────
  dockContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: spacing[5],
    right: spacing[5],
  },
  dockInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 25, 38, 0.92)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: spacing[2],
    gap: spacing[2],
    ...shadow.md,
  },
  micDockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: borderRadius.full,
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  micDockBtnActive: {
    backgroundColor: '#F59E0B',
  },
  micIcon: {
    fontSize: 16,
  },
  micText: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  dockIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockIconBtnActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  dockEmoji: {
    fontSize: 16,
  },
});
