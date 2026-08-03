/**
 * WalkWithMe — Voice Input Modal Component
 *
 * Full-screen modal overlay with animated pulsing microphone and sound wave
 * for hands-free voice input in Chat mode.
 */

import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';
import { useVoiceRecorder } from '@/hooks';

interface VoiceInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSendVoiceText: (text: string) => void;
}

export function VoiceInputModal({ visible, onClose, onSendVoiceText }: VoiceInputModalProps) {
  const { start, stop } = useVoiceRecorder();

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  // Sound wave bar animations
  const bar1Height = useRef(new Animated.Value(16)).current;
  const bar2Height = useRef(new Animated.Value(28)).current;
  const bar3Height = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      start();

      // Pulsing mic orb animation
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

      // Waveform animation
      const waveAnim = (bar: Animated.Value, min: number, max: number, duration: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, { toValue: max, duration, useNativeDriver: false }),
            Animated.timing(bar, { toValue: min, duration, useNativeDriver: false }),
          ]),
        );

      const w1 = waveAnim(bar1Height, 10, 36, 400);
      const w2 = waveAnim(bar2Height, 16, 48, 300);
      const w3 = waveAnim(bar3Height, 12, 32, 500);

      w1.start(); w2.start(); w3.start();

      return () => {
        pulseLoop.stop();
        w1.stop(); w2.stop(); w3.stop();
      };
    }
  }, [visible]);

  const handleDone = async () => {
    await stop();
    // In dev / mock, generate speech transcript based on common user phrases
    const sampleVoicePhrases = [
      "Am I going the right way?",
      "Which side is the pharmacy on?",
      "I am confused, please help me",
      "Is the metro station near?",
    ];
    const phrase = sampleVoicePhrases[Math.floor(Math.random() * sampleVoicePhrases.length)] ?? sampleVoicePhrases[0]!;
    onSendVoiceText(phrase);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(10,10,15,0.95)', 'rgba(30,27,75,0.98)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.statusTitle}>Listening to you...</Text>
          <Text style={styles.statusSubtitle}>Speak naturally. I'm right here.</Text>

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
              colors={colors.gradients.primary}
              style={styles.micOrb}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.micEmoji}>🎤</Text>
            </LinearGradient>
          </View>

          {/* Sound Wave Bars */}
          <View style={styles.waveformContainer}>
            <Animated.View style={[styles.waveBar, { height: bar1Height }]} />
            <Animated.View style={[styles.waveBar, { height: bar2Height }]} />
            <Animated.View style={[styles.waveBar, { height: bar3Height }]} />
            <Animated.View style={[styles.waveBar, { height: bar2Height }]} />
            <Animated.View style={[styles.waveBar, { height: bar1Height }]} />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.doneGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.doneText}>Done ✓</Text>
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
    paddingHorizontal: spacing[8],
    width: '100%',
  },

  statusTitle: {
    ...textStyles.screenTitle,
    color: colors.dark.text,
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  statusSubtitle: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[10],
  },

  micOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },

  micPulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
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

  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    height: 60,
    marginBottom: spacing[10],
  },

  waveBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing[4],
    width: '100%',
    paddingHorizontal: spacing[4],
  },

  cancelButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
  },

  cancelText: {
    ...textStyles.button,
    color: colors.dark.textSecondary,
  },

  doneButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadow.glow,
  },

  doneGradient: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },

  doneText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
});
