/**
 * WalkWithMe — Root Layout
 *
 * Sets up:
 * - Inter font loading (with safe fallback rendering)
 * - React Query provider
 * - Global navigation structure (Expo Router)
 * - Safe area provider
 */

import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';

// Prevent native splash from hiding until layout mounts
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = Font.useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            {/* Splash / initial route */}
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            {/* Main app group */}
            <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
            {/* 404 */}
            <Stack.Screen name="+not-found" options={{ animation: 'fade' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
