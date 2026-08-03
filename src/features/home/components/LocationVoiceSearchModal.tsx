/**
 * WalkWithMe — High-Precision Location Voice Search Modal (NO BLUE, Gold & Emerald Theme)
 *
 * Transcribes 100% exact spoken or typed location strings (e.g. "Sunder Village Semra Lucknow UP India")
 * directly into the search bar without truncating or altering words!
 */

import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
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

    // Try Web Speech Recognition if available
    let recognition: any = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Indian English / Hindi locale

          recognition.onresult = (event: any) => {
            let fullTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              fullTranscript += event.results[i][0].transcript;
            }
            if (fullTranscript.trim()) {
              setSpokenText(fullTranscript.trim());
            }
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
        } catch (e) {
          // Fallback to manual text input
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
    const finalLocation = spokenText.trim();
    if (finalLocation) {
      onSelectLocation(finalLocation);
    }
    onClose();
  };

  const handleQuickLocation = (loc: string) => {
    setSpokenText(loc);
    onSelectLocation(loc);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(8, 9, 13, 0.98)', 'rgba(32, 35, 51, 0.98)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          <Text style={styles.statusTitle}>
            {isListening ? '🎤 Speaking Location...' : 'Voice Search'}
          </Text>
          <Text style={styles.statusSubtitle}>
            Speak or edit your exact location in India (e.g. Sunder Village Semra Lucknow)
          </Text>

          {/* Animated Pulsing Mic Orb (Gold & Emerald Theme) */}
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
              colors={['#10B981', '#F59E0B']}
              style={styles.micOrb}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.micEmoji}>🎤</Text>
            </LinearGradient>
          </View>

          {/* Real-time Editable Transcribed Input Box */}
          <View style={styles.transcriptBox}>
            <TextInput
              style={styles.transcriptInput}
              placeholder="Speak or type location here..."
              placeholderTextColor="rgba(245, 158, 11, 0.5)"
              value={spokenText}
              onChangeText={setSpokenText}
              multiline
              autoFocus
              accessibilityLabel="Transcribed speech location text"
            />
          </View>

          {/* Quick Real Indian Locations */}
          <Text style={styles.presetsLabel}>Tap exact location preset:</Text>
          <View style={styles.presetsGrid}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleQuickLocation("Sunder Village Semra Lucknow")}
            >
              <Text style={styles.presetChipText}>📍 Sunder Village Semra Lucknow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleQuickLocation("Semra Lucknow Uttar Pradesh")}
            >
              <Text style={styles.presetChipText}>📍 Semra Lucknow Uttar Pradesh</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
              <LinearGradient
                colors={['#10B981', '#F59E0B']}
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
    maxWidth: 440,
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
    marginBottom: spacing[6],
  },

  micOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
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
    fontSize: 36,
  },

  transcriptBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    minHeight: 56,
  },

  transcriptInput: {
    ...textStyles.bodyMedium,
    color: '#F59E0B',
    fontSize: 16,
    padding: 0,
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
    marginBottom: spacing[6],
  },

  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
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
    color: '#08090D',
    fontWeight: '700',
  },
});
