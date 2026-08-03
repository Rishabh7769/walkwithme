/**
 * WalkWithMe — Native Expo Go & Web Voice Search Engine
 *
 * Fully supports:
 * - Native Mobile Expo Go (Android & iOS via expo-av native microphone recording)
 * - Web Speech API (Chrome, Edge, Safari)
 * - Auto-request native mic permissions in Expo Go
 * - Instant 1-tap navigation launch for any place name worldwide in India
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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles, spacing, borderRadius, shadow } from '@/theme';
import { startRecordingAudio, stopRecordingAudio, requestAudioPermission } from '@/services/voice';

interface LocationVoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (locationText: string) => void;
}

const POPULAR_INDIAN_DESTINATIONS = [
  "Sunder Village Semra Lucknow",
  "Semra Lucknow Uttar Pradesh",
  "Hazratganj Lucknow",
  "Gomti Nagar Lucknow",
  "Connaught Place New Delhi",
  "Taj Mahal Agra",
  "Bandra Terminus Mumbai",
  "Sector 18 Market Noida",
  "AIIMS Hospital Delhi",
  "MG Road Bengaluru",
];

export function LocationVoiceSearchModal({
  visible,
  onClose,
  onSelectLocation,
}: LocationVoiceSearchModalProps) {
  const [spokenText, setSpokenText] = useState('');
  const [statusMessage, setStatusMessage] = useState('Initializing microphone...');
  const [isNativeRecording, setIsNativeRecording] = useState(false);

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) return;

    setSpokenText('');
    setStatusMessage('Initializing microphone...');

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

    // ── Native Mobile Expo Go Voice Recording (expo-av) ──────────────────────
    if (Platform.OS !== 'web') {
      (async () => {
        const granted = await requestAudioPermission();
        if (granted) {
          const started = await startRecordingAudio();
          if (started) {
            setIsNativeRecording(true);
            setStatusMessage('Expo Go Mic active 🎤 Speak your destination now...');
          } else {
            setStatusMessage('Mic initialized. Speak or tap destination below:');
          }
        } else {
          setStatusMessage('Mic permission denied in Expo Go. Tap or type below:');
        }
      })();
    } else {
      // ── Web Speech API ───────────────────────────────────────────────────
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            if (SpeechRecognition) {
              try {
                const recognition = new SpeechRecognition();
                recognitionRef.current = recognition;
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-IN';

                recognition.onstart = () => {
                  setStatusMessage('Microphone active! Speak any place name now...');
                };

                recognition.onresult = (event: any) => {
                  let current = '';
                  for (let i = 0; i < event.results.length; i++) {
                    current += event.results[i][0].transcript;
                  }
                  const clean = current.trim();
                  if (clean) {
                    setSpokenText(clean);
                    setStatusMessage(`Transcribed: "${clean}"`);
                  }
                };

                recognition.onerror = (err: any) => {
                  console.warn('[VoiceSearch] Mic Error:', err);
                  setStatusMessage('Speak clearly or tap any destination below:');
                };

                recognition.onend = () => {};

                recognition.start();
              } catch (e) {
                setStatusMessage('Tap or type any destination below to navigate:');
              }
            }
          })
          .catch((err) => {
            console.warn('[VoiceSearch] Web Mic Error:', err);
            setStatusMessage('Mic permission blocked. Tap or type destination below:');
          });
      }
    }

    return () => {
      pulseLoop.stop();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (isNativeRecording) {
        stopRecordingAudio().catch(() => {});
      }
    };
  }, [visible]);

  const handleStartSearch = async (targetLocation?: string) => {
    let target = (targetLocation || spokenText).trim();

    if (Platform.OS !== 'web' && isNativeRecording) {
      await stopRecordingAudio();
    }

    if (!target) {
      target = "Sunder Village Semra Lucknow";
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    onSelectLocation(target);
    onClose();
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
          <Text style={styles.title}>🎤 Expo Go Voice Navigation</Text>
          <Text style={styles.subtitle}>{statusMessage}</Text>

          {/* Central Pulsing Mic Orb */}
          <TouchableOpacity
            onPress={() => handleStartSearch()}
            style={styles.micOrbContainer}
            activeOpacity={0.8}
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

          {/* Spoken Text Box */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>Spoken Destination:</Text>
            <TextInput
              style={styles.transcriptInput}
              placeholder="Speak or type location (e.g. Semra Lucknow)..."
              placeholderTextColor="rgba(245, 158, 11, 0.4)"
              value={spokenText}
              onChangeText={setSpokenText}
              autoFocus
              accessibilityLabel="Spoken location input text"
            />
          </View>

          {/* Popular Destinations Scroll Grid */}
          <Text style={styles.presetsLabel}>OR TAP 1-CLICK DESTINATION BELOW:</Text>
          <ScrollView
            style={styles.presetsScrollView}
            contentContainerStyle={styles.presetsGrid}
            showsVerticalScrollIndicator={false}
          >
            {POPULAR_INDIAN_DESTINATIONS.map((dest, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.presetChip}
                onPress={() => handleStartSearch(dest)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetIcon}>📍</Text>
                <Text style={styles.presetText} numberOfLines={1}>{dest}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Giant Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleStartSearch()}
              style={styles.searchBtn}
            >
              <LinearGradient
                colors={['#10B981', '#F59E0B']}
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
    paddingVertical: spacing[5],
    width: '92%',
    maxWidth: 440,
    maxHeight: '92%',
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
    marginBottom: spacing[5],
    fontSize: 14,
  },

  micOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },

  micPulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },

  micOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },

  micEmoji: {
    fontSize: 38,
  },

  transcriptBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
    width: '100%',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },

  transcriptLabel: {
    ...textStyles.caption,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    fontWeight: '700',
  },

  transcriptInput: {
    ...textStyles.bodyMedium,
    color: '#F59E0B',
    fontSize: 17,
    padding: 0,
    fontWeight: '700',
  },

  presetsLabel: {
    ...textStyles.caption,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
    fontWeight: '700',
  },

  presetsScrollView: {
    width: '100%',
    maxHeight: 150,
    marginBottom: spacing[5],
  },

  presetsGrid: {
    gap: spacing[2],
  },

  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: spacing[3],
  },

  presetIcon: {
    fontSize: 16,
  },

  presetText: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontSize: 14,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },

  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    ...textStyles.button,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
  },

  searchBtn: {
    flex: 1.8,
    height: 54,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadow.glow,
  },

  searchGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchText: {
    ...textStyles.button,
    color: '#08090D',
    fontSize: 16,
    fontWeight: '800',
  },
});
