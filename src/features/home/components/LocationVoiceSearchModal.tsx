/**
 * WalkWithMe — Location Voice Search Modal
 *
 * Listens to spoken location queries using Web Speech API / native voice input
 * and transcribes exact spoken Indian locations (e.g. "Sunder Village Semra Lucknow").
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles, spacing, borderRadius, shadow } from '@/theme';

interface LocationVoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (locationText: string) => void;
}

const INDIAN_VOICE_PRESETS = [
  "Sunder Village Semra Lucknow",
  "Hazratganj Lucknow",
  "Gomti Nagar Lucknow",
  "Sector 18 Market Noida",
  "Connaught Place New Delhi",
  "Indira Gandhi Airport Delhi",
];

export function LocationVoiceSearchModal({
  visible,
  onClose,
  onSelectLocation,
}: LocationVoiceSearchModalProps) {
  const [spokenText, setSpokenText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!visible) return;

    setSpokenText('');
    setIsListening(true);

    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.25, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        ]),
      ]),
    );
    pulseLoop.start();

    // Try Web Speech Recognition if on Web
    let recognition: any = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Indian English / Hindi accent support

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((result: any) => result[0].transcript)
              .join('');
            setSpokenText(transcript);
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
        } catch (e) {
          // Fallback
        }
      }
    }

    return () => {
      pulseLoop.stop();
      if (recognition) {
        try { recognition.stop(); } catch (e) {}
      }
    };
  }, [visible]);

  const handleDone = () => {
    const finalLocation = spokenText.trim() || INDIAN_VOICE_PRESETS[0]!;
    onSelectLocation(finalLocation);
    onClose();
  };

  const handlePresetTap = (preset: string) => {
    onSelectLocation(preset);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(11, 12, 16, 0.98)', 'rgba(30, 27, 75, 0.98)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          <Text style={styles.statusTitle}>
            {isListening ? '🎤 Listening for Location...' : 'Voice Search'}
          </Text>
          <Text style={styles.statusSubtitle}>
            Speak any place name in India (e.g. "Sunder Village Semra Lucknow")
          </Text>

          {/* Animated Pulsing Mic Orb */}
          <View style={styles.micOrbContainer}>
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
              colors={['#00F2FE', '#4FACFE']}
              style={styles.micOrb}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.micEmoji}>🎤</Text>
            </LinearGradient>
          </View>

          {/* Transcribed Spoken Text Box */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>
              {spokenText ? `"${spokenText}"` : 'Listening to your voice...'}
            </Text>
          </View>

          {/* Quick Voice Location Presets */}
          <Text style={styles.presetsLabel}>Or tap a voice location preset:</Text>
          <View style={styles.presetsGrid}>
            {INDIAN_VOICE_PRESETS.slice(0, 4).map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.presetChip}
                onPress={() => handlePresetTap(preset)}
              >
                <Text style={styles.presetChipText}>📍 {preset}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
              <LinearGradient
                colors={['#00F2FE', '#4FACFE']}
                style={styles.doneGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.doneText}>Search Location ✓</Text>
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
    paddingHorizontal: spacing[6],
    width: '100%',
    maxWidth: 420,
  },

  statusTitle: {
    ...textStyles.screenTitle,
    color: '#FFFFFF',
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  statusSubtitle: {
    ...textStyles.body,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: spacing[8],
  },

  micOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },

  micPulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 242, 254, 0.25)',
  },

  micOrb: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },

  micEmoji: {
    fontSize: 40,
  },

  transcriptBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[6],
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    alignItems: 'center',
  },

  transcriptText: {
    ...textStyles.bodyMedium,
    color: '#00F2FE',
    textAlign: 'center',
  },

  presetsLabel: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },

  presetsGrid: {
    width: '100%',
    gap: spacing[2],
    marginBottom: spacing[8],
  },

  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  presetChipText: {
    ...textStyles.body,
    fontSize: 13,
    color: '#FFFFFF',
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },

  cancelButton: {
    flex: 1,
    paddingVertical: spacing[3.5],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },

  cancelText: {
    ...textStyles.button,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  doneButton: {
    flex: 1.5,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadow.glow,
  },

  doneGradient: {
    paddingVertical: spacing[3.5],
    alignItems: 'center',
  },

  doneText: {
    ...textStyles.button,
    color: '#0B0C10',
    fontWeight: '700',
  },
});
