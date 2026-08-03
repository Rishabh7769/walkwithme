/**
 * WalkWithMe — Splash / Entry Screen
 *
 * Shows the animated WalkWithMe logo and branding,
 * then redirects to the Home screen after a brief pause.
 */

import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, textStyles, spacing } from '@/theme';
import { APP_NAME, APP_TAGLINE } from '@/constants';

const { width, height } = Dimensions.get('window');

export default function SplashEntry() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Guaranteed redirection timer to Home screen
    const redirectTimer = setTimeout(() => {
      router.replace('/(app)/home');
    }, 1800);

    // 2. Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();

    // 3. Gentle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(dotScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    ).start();

    return () => clearTimeout(redirectTimer);
  }, [logoOpacity, logoScale, taglineOpacity, dotScale]);

  return (
    <LinearGradient
      colors={colors.gradients.splash}
      style={styles.container}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      {/* Background ambient circles */}
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      {/* Logo area */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Icon */}
        <Animated.View
          style={[styles.iconWrapper, { transform: [{ scale: dotScale }] }]}
        >
          <Text style={styles.iconEmoji}>🚶‍♀️</Text>
        </Animated.View>

        {/* App name */}
        <Text style={styles.appName}>{APP_NAME}</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity }}>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.background,
  },

  ambientTop: {
    position: 'absolute',
    top: -height * 0.15,
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },

  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },

  iconEmoji: {
    fontSize: 52,
  },

  appName: {
    ...textStyles.splashTitle,
    color: colors.dark.text,
    textAlign: 'center',
  },

  tagline: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
    marginTop: spacing[2],
  },
});
