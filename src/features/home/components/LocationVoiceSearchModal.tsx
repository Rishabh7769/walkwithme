/**
 * WalkWithMe — Google Maps Style Hands-Free Voice Search Engine
 *
 * Captures ANY spoken place name worldwide in India (or anywhere) using real-time
 * Speech-to-Text transcription and automatically launches turn-by-turn navigation!
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

  useEffect(() => {
    if (!visible) return;

    setSpokenText('');
    setStatusMessage('Listening... Speak any destination now');

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

    // Start Web Speech API Recognition
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Indian English / Hindi locale

          recognition.onstart = () => {
            setStatusMessage('Listening... Speak any place name now!');
          };

          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcript += event.results[i][0].transcript;
            }
            const cleanTranscript = transcript.trim();
            if (cleanTranscript) {
              setSpokenText(cleanTranscript);
              setStatusMessage(`Transcribed: "${cleanTranscript}"`);
            }
          };

          recognition.onerror = (err: any) => {
            console.warn('[VoiceSearch] Recognition error:', err);
            if (err.error === 'not-allowed') {
              setStatusMessage('Microphone access denied. Please allow mic in browser.');
            } else {
              setStatusMessage('Listening... Speak clearly or type below.');
            }
          };

          recognition.onend = () => {};

          recognition.start();
        } catch (e) {
          console.warn('[VoiceSearch] Failed to start speech recognition:', e);
          setStatusMessage('Type any destination below to navigate.');
        }
      } else {
        setStatusMessage('Speech API unavailable. Type any destination below.');
      }
    }

    return () => {
      pulseLoop.stop();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
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
            accessibilityLabel="Tap mic to start search"
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
            <Text style={styles.transcriptLabel}>Spoken Location:</Text>
            <TextInput
              style={styles.transcriptInput}
              placeholder="Say any place (e.g. Connaught Place, Semra Lucknow)..."
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
    color: 'rgba(255, 255, 255, 0.75)',
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
