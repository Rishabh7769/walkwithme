/**
 * WalkWithMe — Not Found Screen
 *
 * Shown when the user navigates to an unknown route.
 * Designed to be calm — not alarming.
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={colors.gradients.darkBackground}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.title}>Hmm, lost?</Text>
        <Text style={styles.subtitle}>
          Koi baat nahi 😊{'\n'}
          This page doesn't exist, but I can get you back on track.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(app)/home')}
          accessibilityRole="button"
          accessibilityLabel="Go back to home screen"
        >
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Take me home 🏠</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },

  emoji: {
    fontSize: 64,
    marginBottom: spacing[6],
  },

  title: {
    ...textStyles.screenTitle,
    color: colors.dark.text,
    marginBottom: spacing[4],
    textAlign: 'center',
  },

  subtitle: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing[8],
  },

  button: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadow.glow,
  },

  buttonGradient: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },

  buttonText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
});
