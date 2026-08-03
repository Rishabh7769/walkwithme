/**
 * WalkWithMe — App Group Layout (Milestone 2)
 *
 * Upgrades from M1: trip-aware tab bar, offline banner, pulsing indicator.
 */

import { useEffect, useRef } from 'react';
import { Tabs, usePathname } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadow, textStyles } from '@/theme';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useNetworkStatus } from '@/hooks';

// ── Tab config ────────────────────────────────────────────────────────────

const TABS = [
  { name: 'home', emoji: '🏠', label: 'Home' },
  { name: 'companion', emoji: '🚶‍♀️', label: 'Walking' },
  { name: 'chat', emoji: '💬', label: 'Chat' },
  { name: 'settings', emoji: '⚙️', label: 'Settings' },
] as const;

// ── Pulsing dot (active trip indicator) ───────────────────────────────────

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.dotContainer}>
      <Animated.View style={[styles.dotRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.dotCore} />
    </View>
  );
}

// ── Offline Banner ────────────────────────────────────────────────────────

function OfflineBanner() {
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.offlineBanner, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={styles.offlineIcon}>📡</Text>
      <Text style={styles.offlineText}>
        No internet — some features may not work
      </Text>
    </Animated.View>
  );
}

// ── Custom Tab Bar ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TabBarProps = Record<string, any>;

function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { activeTrip } = useNavigationStore();
  const { isConnected, isLoaded } = useNetworkStatus();

  const hasTripActive = activeTrip?.status === 'active' || activeTrip?.status === 'rerouting';

  // Hide tab bar on full-screen companion (active navigation)
  // The companion tab can still be reached via tab press
  const isFullscreenCompanion =
    pathname.includes('/companion') && hasTripActive;

  if (isFullscreenCompanion) return null;

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
      {/* Offline banner — shown above tab bar */}
      {isLoaded && !isConnected && <OfflineBanner />}

      <View style={styles.tabBar}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(state.routes as any[]).map((route: { name: string }, index: number) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;

          const isFocused = state.index === index;
          const isCompanionTab = route.name === 'companion';
          const showPulse = isCompanionTab && hasTripActive;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.name,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.name}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isFocused }}
            >
              {/* Active pill background */}
              {isFocused && <View style={styles.activePill} />}

              {/* Trip-active pill on companion */}
              {showPulse && !isFocused && (
                <View style={styles.activeTripPill} />
              )}

              {/* Emoji icon */}
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                {tab.emoji}
              </Text>

              {/* Label */}
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>

              {/* Pulsing dot on companion when trip is active */}
              {showPulse && <PulsingDot />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── App Layout ────────────────────────────────────────────────────────────

export default function AppLayout() {
  return (
    <Tabs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="companion" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    backgroundColor: 'transparent',
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: colors.dark.border,
    ...shadow.lg,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: borderRadius.xl,
    position: 'relative',
  },

  activePill: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },

  activeTripPill: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
  },

  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
    opacity: 0.5,
  },

  tabIconActive: { opacity: 1 },

  tabLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textTertiary,
    letterSpacing: 0.3,
  },

  tabLabelActive: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },

  // ── Pulsing dot ────────────────────────────────────────────────────────

  dotContainer: {
    position: 'absolute',
    top: 6,
    right: 12,
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dotRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },

  dotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  // ── Offline banner ─────────────────────────────────────────────────────

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },

  offlineIcon: { fontSize: 14 },

  offlineText: {
    ...textStyles.caption,
    color: colors.warning,
    fontFamily: 'Inter_500Medium',
  },
});
