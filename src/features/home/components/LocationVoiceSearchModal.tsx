/**
 * WalkWithMe — High-Precision Voice Search Engine (Google Maps Hands-Free Speech)
 *
 * Features:
 * - Requests browser microphone audio permissions explicitly via getUserMedia({ audio: true })
 * - Uses Web Speech API with full transcript accumulation across all Chrome, Edge & Safari browsers
 * - Auto-submits navigation as soon as speech finishes, or allows 1-tap giant mic button trigger!
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles, spacing, borderRadius, shadow } from '@/theme';

interface LocationVoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (locationText: string) => void;
}

export function LocationVoiceSearchModal({
  visible,
  onClose,
  onSelectLocation,
}: LocationVoiceSearchModalProps) {
  const [spokenText, setSpokenText] = useState('');
  const [statusMessage, setStatusMessage] = useState('Listening... Speak any place name now');

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) return;

    setSpokenText('');
    setStatusMessage('Requesting microphone access...');

    // Pulse animation for central mic orb
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.3, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        ]),
      ]),
    );
    pulseLoop.start();

    // Start Web Speech API Recognition with Microphone Permission
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      // Request browser audio permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            mediaStreamRef.current = stream;
            setStatusMessage('Microphone active. Speak your destination now!');

            if (SpeechRecognition) {
              try {
                const recognition = new SpeechRecognition();
                recognitionRef.current = recognition;
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'en-IN'; // Indian English / Hindi accent support

                recognition.onstart = () => {
                  setStatusMessage('Listening... Speak any place name now!');
                };

                recognition.onresult = (event: any) => {
                  let fullTranscript = '';
                  for (let i = 0; i < event.results.length; i++) {
                    fullTranscript += event.results[i][0].transcript;
                  }
                  const cleanTranscript = fullTranscript.trim();
                  if (cleanTranscript) {
                    setSpokenText(cleanTranscript);
                    setStatusMessage(`Transcribed: "${cleanTranscript}"`);

                    // If final speech segment detected, auto-launch navigation!
                    if (event.results[0] && event.results[0].isFinal) {
                      setTimeout(() => {
                        onSelectLocation(cleanTranscript);
                        onClose();
                      }, 500);
                    }
                  }
                };

                recognition.onerror = (err: any) => {
                  console.warn('[VoiceSearch] Recognition error:', err);
                  setStatusMessage('Listening... Speak clearly or type your destination below.');
                };

                recognition.onend = () => {
                  setStatusMessage('Speech ended. Tap Navigate Now below.');
                };

                recognition.start();
              } catch (e) {
                console.warn('[VoiceSearch] Failed to initialize SpeechRecognition:', e);
              }
            }
          })
          .catch((err) => {
            console.warn('[VoiceSearch] Mic access denied:', err);
            setStatusMessage('Microphone access blocked. Please allow mic permissions in your browser.');
          });
      }
    }

    return () => {
      pulseLoop.stop();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((track: any) => track.stop());
        } catch (e) {}
      }
    };
  }, [visible]);

  const handleStartSearch = (textToSearch?: string) => {
    const target = (textToSearch || spokenText).trim();
    if (target) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      onSelectLocation(target);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(8, 9, 13, 0.98)', 'rgba(26, 28, 40, 0.99)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          <Text style={styles.title}>🎤 Google Maps Voice Search</Text>
          <Text style={styles.subtitle}>{statusMessage}</Text>

          {/* Central Pulsing Mic Orb */}
          <TouchableOpacity
            onPress={() => handleStartSearch()}
            style={styles.micOrbContainer}
            activeOpacity={0.8}
            accessibilityLabel="Tap mic to search spoken text"
          >
            <Animated.View
              style={[
                styles.micPulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <LinearGradient
              colors={['#10B981', '#F59E0B']}
              style={styles.micOrb}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.micEmoji}>🎤</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Live Transcribed Spoken Text Input Box */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>Spoken Location (Live):</Text>
            <TextInput
              style={styles.transcriptInput}
              placeholder="Speak any destination (e.g. Connaught Place, Semra Lucknow)..."
              placeholderTextColor="rgba(245, 158, 11, 0.4)"
              value={spokenText}
              onChangeText={setSpokenText}
              multiline
              accessibilityLabel="Transcribed spoken location input"
            />
          </View>

          {/* Giant Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleStartSearch()}
              style={[styles.searchBtn, !spokenText.trim() && styles.searchBtnDisabled]}
              disabled={!spokenText.trim()}
            >
              <LinearGradient
                colors={spokenText.trim() ? ['#10B981', '#F59E0B'] : ['#2A2D40', '#2A2D40']}
                style={styles.searchGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.searchText}>Navigate Now ➔</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[6],
    width: '92%',
    maxWidth: 440,
  },

  title: {
    ...textStyles.screenTitle,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  subtitle: {
    ...textStyles.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing[8],
  },

  micOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },

  micPulseRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },

  micOrb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },

  micEmoji: {
    fontSize: 42,
  },

  transcriptBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    marginBottom: spacing[8],
    width: '100%',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },

  transcriptLabel: {
    ...textStyles.caption,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    fontWeight: '700',
  },

  transcriptInput: {
    ...textStyles.bodyMedium,
    color: '#F59E0B',
    fontSize: 18,
    padding: 0,
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },

  cancelBtn: {
    flex: 1,
    height: 58,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    ...textStyles.button,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },

  searchBtn: {
    flex: 1.8,
    height: 58,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadow.glow,
  },

  searchBtnDisabled: {
    opacity: 0.5,
  },

  searchGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchText: {
    ...textStyles.button,
    color: '#08090D',
    fontSize: 17,
    fontWeight: '800',
  },
});
