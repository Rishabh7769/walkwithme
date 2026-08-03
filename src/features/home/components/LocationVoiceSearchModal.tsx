/**
 * WalkWithMe — Voice Search Modal
 *
 * Platform strategy:
 *   - Web: uses browser SpeechRecognition API (Chrome, Edge, Safari).
 *     No getUserMedia pre-call (Chrome manages its own audio context for SpeechRecognition).
 *   - Native (Expo Go): expo-av cannot transcribe speech — it only records audio files.
 *     We therefore fall back to a clear text input with a retry button.
 *     Users can type their destination or pick from quick shortcuts.
 *
 * No hardcoded destinations. Navigate Now button is disabled until user provides input.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles, spacing, borderRadius, shadow } from '@/theme';

interface LocationVoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (locationText: string) => void;
}

type VoiceState = 'idle' | 'listening' | 'transcribed' | 'error' | 'unsupported';

export function LocationVoiceSearchModal({
  visible,
  onClose,
  onSelectLocation,
}: LocationVoiceSearchModalProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [destinationText, setDestinationText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const recognitionRef = useRef<any>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // ── Pulse animation ──────────────────────────────────────────────────────
  const startPulse = () => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        ]),
      ]),
    );
    pulseLoopRef.current = loop;
    loop.start();
  };

  const stopPulse = () => {
    pulseLoopRef.current?.stop();
    pulseScale.setValue(1);
    pulseOpacity.setValue(0.6);
  };

  // ── Web SpeechRecognition ────────────────────────────────────────────────
  const startWebSpeechRecognition = () => {
    if (Platform.OS !== 'web') return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceState('unsupported');
      setStatusMessage('Speech recognition is not supported in this browser.\nType your destination below.');
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.continuous = false;      // Stop after one utterance
    recognition.interimResults = true;   // Show partial results
    recognition.lang = 'en-IN';          // Indian English (handles Hindi accents too)
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceState('listening');
      setStatusMessage('Listening... Speak your destination now');
      startPulse();
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const text = transcript.trim();
      if (text) {
        setDestinationText(text);
        setStatusMessage(`Heard: "${text}"`);
        setVoiceState('transcribed');
      }
    };

    recognition.onerror = (event: any) => {
      stopPulse();
      console.warn('[VoiceSearch] SpeechRecognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceState('error');
        setStatusMessage('Microphone permission denied.\nPlease allow microphone access in your browser settings, then try again.');
      } else if (event.error === 'no-speech') {
        setVoiceState('idle');
        setStatusMessage('No speech detected. Tap the mic button and speak.');
      } else if (event.error === 'network') {
        setVoiceState('error');
        setStatusMessage('Speech recognition needs an internet connection. Type your destination below.');
      } else {
        setVoiceState('idle');
        setStatusMessage('Could not hear you. Tap the mic and try again.');
      }
    };

    recognition.onend = () => {
      stopPulse();
      if (voiceState !== 'transcribed') {
        setVoiceState('idle');
      }
    };

    try {
      recognition.start();
    } catch (e) {
      stopPulse();
      setVoiceState('error');
      setStatusMessage('Could not start speech recognition. Type your destination below.');
      console.warn('[VoiceSearch] recognition.start() failed:', e);
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    stopPulse();
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      stopRecognition();
      setDestinationText('');
      setVoiceState('idle');
      setStatusMessage('');
      return;
    }

    // On web, auto-start speech recognition when modal opens
    if (Platform.OS === 'web') {
      setStatusMessage('Tap the mic to speak your destination');
      setVoiceState('idle');
    } else {
      // Native: expo-av cannot do STT, inform user
      setVoiceState('unsupported');
      setStatusMessage('Voice-to-text is not available in Expo Go.\nType your destination below and tap Navigate Now.');
    }

    return () => {
      stopRecognition();
    };
  }, [visible]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMicPress = () => {
    if (voiceState === 'listening') {
      stopRecognition();
      setVoiceState('idle');
      setStatusMessage('Tap the mic to speak your destination');
    } else {
      startWebSpeechRecognition();
    }
  };

  const handleNavigate = () => {
    const text = destinationText.trim();
    if (!text) return;
    stopRecognition();
    onSelectLocation(text);
    onClose();
  };

  const handleClose = () => {
    stopRecognition();
    onClose();
  };

  if (!visible) return null;

  const micIcon = voiceState === 'listening' ? '⏹' : '🎤';
  const micLabel = voiceState === 'listening' ? 'Tap to stop' : 'Tap to speak';
  const canNavigate = destinationText.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['rgba(8,9,13,0.97)', 'rgba(20,22,34,0.98)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>🎤 Voice Search</Text>

          {/* Status message */}
          {statusMessage ? (
            <Text style={styles.status}>{statusMessage}</Text>
          ) : null}

          {/* Mic button — only shown on web */}
          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={handleMicPress}
              style={styles.micContainer}
              activeOpacity={0.8}
              accessibilityLabel={micLabel}
            >
              <Animated.View
                style={[
                  styles.micRing,
                  { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                ]}
              />
              <LinearGradient
                colors={voiceState === 'listening' ? ['#F43F5E', '#F59E0B'] : ['#10B981', '#F59E0B']}
                style={styles.micOrb}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.micEmoji}>{micIcon}</Text>
              </LinearGradient>
              <Text style={styles.micLabel}>{micLabel}</Text>
            </TouchableOpacity>
          )}

          {/* Text input — always visible */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>DESTINATION</Text>
            <TextInput
              style={styles.textInput}
              value={destinationText}
              onChangeText={setDestinationText}
              placeholder="Type or speak a place name..."
              placeholderTextColor="rgba(245,158,11,0.4)"
              autoFocus={Platform.OS !== 'web'}
              returnKeyType="search"
              onSubmitEditing={handleNavigate}
              accessibilityLabel="Destination input"
            />
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNavigate}
              style={[styles.navigateBtn, !canNavigate && styles.navigateBtnDisabled]}
              disabled={!canNavigate}
              accessibilityLabel="Navigate to destination"
            >
              <LinearGradient
                colors={canNavigate ? ['#10B981', '#F59E0B'] : ['#2A2D40', '#2A2D40']}
                style={styles.navigateGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.navigateText, !canNavigate && styles.navigateTextDisabled]}>
                  Navigate Now →
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[6],
  },

  title: {
    ...textStyles.screenTitle,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: spacing[3],
    textAlign: 'center',
  },

  status: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: spacing[5],
    lineHeight: 20,
    fontSize: 14,
  },

  micContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },

  micRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16,185,129,0.2)',
  },

  micOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },

  micEmoji: {
    fontSize: 34,
  },

  micLabel: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing[3],
    fontSize: 12,
  },

  inputWrapper: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: '#F59E0B',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[6],
  },

  inputLabel: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: spacing[1],
  },

  textInput: {
    ...textStyles.bodyMedium,
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '700',
    padding: 0,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },

  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    ...textStyles.button,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },

  navigateBtn: {
    flex: 2,
    height: 52,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },

  navigateBtnDisabled: {
    opacity: 0.5,
  },

  navigateGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navigateText: {
    ...textStyles.button,
    color: '#08090D',
    fontSize: 16,
    fontWeight: '800',
  },

  navigateTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
});
