/**
 * WalkWithMe — AuraOrb Component (Lovable Ultra-Premium UI)
 *
 * Multi-layer glassmorphic breathing orb with animated audio equalizer waveform bars.
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles, spacing } from '@/theme';

interface AuraOrbProps {
  speaking?: boolean;
  size?: number;
  mode?: 'guiding' | 'listening' | 'correcting';
}

export function AuraOrb({ speaking = true, size = 190, mode = 'guiding' }: AuraOrbProps) {
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Equalizer bar heights
  const barAnims = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0.4)),
  ).current;

  useEffect(() => {
    // Breathing loop
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1.0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    breathe.start();

    // Slow continuous aura rotation
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    rotate.start();

    // Equalizer wave animation
    const waveLoops = barAnims.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 350 + index * 80,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.25,
            duration: 350 + index * 80,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    if (speaking) {
      waveLoops.forEach((l) => l.start());
    } else {
      waveLoops.forEach((l) => l.stop());
      barAnims.forEach((anim) => anim.setValue(0.3));
    }

    return () => {
      breathe.stop();
      rotate.stop();
      waveLoops.forEach((l) => l.stop());
    };
  }, [speaking]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getGradientColors = (): [string, string, string] => {
    if (mode === 'correcting') return ['#F43F5E', '#FB7185', '#E11D48'];
    if (mode === 'listening') return ['#F59E0B', '#FBBF24', '#D97706'];
    return ['#10B981', '#F59E0B', '#059669']; // Emerald Gold default
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Rotating Aura Ring */}
      <Animated.View
        style={[
          styles.outerAura,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ rotate: spin }, { scale: breatheAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.25)', 'rgba(245, 158, 11, 0.25)', 'rgba(5, 150, 105, 0.1)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Middle Glass Boundary */}
      <View style={[styles.middleRing, { width: size * 0.76, height: size * 0.76, borderRadius: (size * 0.76) / 2 }]} />

      {/* Inner Breathing Core */}
      <Animated.View
        style={[
          styles.innerCore,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: (size * 0.6) / 2,
            transform: [{ scale: breatheAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
        />

        {/* Center Waveform & Label */}
        <View style={styles.centerContent}>
          <View style={styles.waveformRow}>
            {barAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    transform: [{ scaleY: speaking ? anim : 0.3 }],
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.modeLabel}>
            {mode === 'listening' ? 'LISTENING' : mode === 'correcting' ? 'HELPING' : 'GUIDING'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerAura: {
    position: 'absolute',
    overflow: 'hidden',
  },
  middleRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(22, 25, 38, 0.4)',
  },
  innerCore: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 22,
    gap: 3,
  },
  waveBar: {
    width: 3.5,
    height: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  modeLabel: {
    ...textStyles.caption,
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 1.8,
    marginTop: spacing[1.5],
    textTransform: 'uppercase',
    opacity: 0.9,
    fontWeight: '700',
  },
});
