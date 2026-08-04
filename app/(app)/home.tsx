/**
 * WalkWithMe — Home Screen (Lovable Ultra-Premium Design)
 *
 * Ultra-glassmorphic header with:
 * - "Good Afternoon" & "Ready when you are" greeting
 * - Pulsing "High Accuracy GPS" pill
 * - Floating Places Autocomplete search input with voice button & real-time predictions dropdown
 * - Quick Favourites pill grid
 * - Recent Walks horizontal carousel
 * - Primary CTA "Start walking with me" button
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { textStyles, spacing, borderRadius } from '@/theme';
import { useUserStore } from '@/store/useUserStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useAppNavigation } from '@/hooks';
import { getPlaceDetails, getWalkingDirections } from '@/services/maps';
import { getCurrentCoordinates } from '@/services/location';
import { PlacesAutocompleteInput, EditFavoriteModal } from '@/features/home';
import type { FavoritePlace, PlacePrediction, PlaceResult } from '@/types';

const { width } = Dimensions.get('window');

// Recent walks mock data matching Lovable UI design
const RECENT_WALKS = [
  { id: '1', name: 'Metro Station', meta: '1.1 km • 14 min', icon: '🚶‍♂️' },
  { id: '2', name: 'Night Pharmacy', meta: '600 m • 8 min', icon: '💊' },
  { id: '3', name: 'Riverside Loop', meta: '2.4 km • 30 min', icon: '🌳' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, profile } = useUserStore();
  const { activeTrip, setActiveTrip, reset } = useNavigationStore();
  const { startTrip, openSettings } = useAppNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingFavorite, setEditingFavorite] = useState<FavoritePlace | null>(null);

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    const details = await getPlaceDetails(prediction.placeId);
    const destination: PlaceResult = {
      placeId: prediction.placeId,
      name: details?.name ?? prediction.structuredFormatting.mainText,
      address: details?.formattedAddress ?? prediction.description,
      coordinates: details?.coordinates ?? { latitude: 0, longitude: 0 },
    };

    // Get real GPS coordinates for origin
    const gpsCoords = await getCurrentCoordinates();
    const originCoords = gpsCoords ?? { latitude: destination.coordinates.latitude, longitude: destination.coordinates.longitude };

    const origin: PlaceResult = {
      placeId: 'current-loc',
      name: 'Current Location',
      address: 'Your current location',
      coordinates: originCoords,
    };

    const trip = await getWalkingDirections({
      origin,
      destination,
      language: profile.languagePreference,
    });

    setActiveTrip(trip);
    startTrip(destination);
  };

  const handleFavoritePress = async (favorite: FavoritePlace) => {
    if (!favorite.address || !favorite.placeId) {
      setEditingFavorite(favorite);
      return;
    }

    const details = await getPlaceDetails(favorite.placeId);
    const destination: PlaceResult = {
      placeId: favorite.placeId,
      name: favorite.label,
      address: favorite.address,
      coordinates: details?.coordinates ?? { latitude: 0, longitude: 0 },
    };

    const gpsCoords = await getCurrentCoordinates();
    const originCoords = gpsCoords ?? destination.coordinates;

    const origin: PlaceResult = {
      placeId: 'current-loc',
      name: 'Current Location',
      address: 'Your current location',
      coordinates: originCoords,
    };

    const trip = await getWalkingDirections({
      origin,
      destination,
      language: profile.languagePreference,
    });

    setActiveTrip(trip);
    startTrip(destination);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[3] }]}>
      {/* Mesh Background Ambient Glows */}
      <View style={styles.meshGlowTop} />
      <View style={styles.meshGlowRight} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={styles.greetingText}>GOOD AFTERNOON</Text>
            <Text style={styles.headerTitle}>Ready when you are</Text>
            
            {/* GPS Pill Badge */}
            <View style={styles.gpsPill}>
              <View style={styles.gpsPulseDot} />
              <Text style={styles.gpsPillText}>High Accuracy GPS Active</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.settingsBtn} onPress={openSettings} activeOpacity={0.8}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ── Active Trip Banner (if any) ─────────────────────────────────── */}
        {activeTrip && activeTrip.status === 'active' && (
          <View style={styles.activeBanner}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.25)', 'rgba(245, 158, 11, 0.15)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.activeBannerContent}>
              <Text style={styles.activeBannerEmoji}>🚶‍♀️</Text>
              <View style={styles.activeBannerText}>
                <Text style={styles.activeBannerTitle}>Active Walking Trip</Text>
                <Text style={styles.activeBannerSubtitle} numberOfLines={1}>
                  → {activeTrip.destination.name}
                </Text>
              </View>
            </View>
            <View style={styles.activeBannerActions}>
              <TouchableOpacity
                onPress={() => startTrip(activeTrip.destination)}
                style={styles.resumeBtn}
              >
                <Text style={styles.resumeBtnText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => reset()} style={styles.endBtn}>
                <Text style={styles.endBtnText}>End</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Search Input ────────────────────────────────────────────────── */}
        <View style={styles.searchSection}>
          <PlacesAutocompleteInput
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSelectPrediction={handleSelectPrediction}
            placeholder="Where are we walking today?"
          />
        </View>

        {/* ── Quick Favourites ────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK FAVOURITES</Text>
        </View>

        <View style={styles.favoritesGrid}>
          {favorites.map((favorite) => (
            <TouchableOpacity
              key={favorite.id}
              style={styles.favoritePill}
              onPress={() => handleFavoritePress(favorite)}
              onLongPress={() => setEditingFavorite(favorite)}
              activeOpacity={0.8}
            >
              <Text style={styles.favoritePillEmoji}>{favorite.emoji}</Text>
              <Text style={styles.favoritePillLabel} numberOfLines={1}>
                {favorite.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Walks Carousel ────────────────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: spacing[6] }]}>
          <Text style={styles.sectionTitle}>RECENT WALKS</Text>
          <Text style={styles.sectionSubtext}>Last 7 days</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
          {RECENT_WALKS.map((item) => (
            <View key={item.id} style={styles.recentCard}>
              <View style={styles.recentIconBadge}>
                <Text style={styles.recentIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.recentCardTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.recentCardMeta}>{item.meta}</Text>
              <TouchableOpacity
                style={styles.walkAgainBtn}
                onPress={() => setSearchQuery(item.name)}
              >
                <Text style={styles.walkAgainText}>Walk again →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* ── CTA Button ───────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.startWalkBtn}
          onPress={() => {
            if (favorites.length > 0) handleFavoritePress(favorites[0]!);
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.startWalkGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.startWalkText}>Start walking with me</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.ctaSubtitle}>Your companion stays with you the whole way.</Text>
      </ScrollView>

      {/* Edit Favorite Modal */}
      <EditFavoriteModal
        favorite={editingFavorite}
        visible={editingFavorite !== null}
        onClose={() => setEditingFavorite(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0D14',
  },
  meshGlowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    borderRadius: 120,
  },
  meshGlowRight: {
    position: 'absolute',
    top: 100,
    right: -40,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 100,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  headerTextCol: {
    flex: 1,
  },
  greetingText: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: '700',
  },
  headerTitle: {
    ...textStyles.heroHeading,
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 2,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 25, 38, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    alignSelf: 'flex-start',
    marginTop: spacing[2.5],
    gap: spacing[2],
  },
  gpsPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  gpsPillText: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 25, 38, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },

  // ── Active Banner ────────────────────────────────────────────────────────
  activeBanner: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    padding: spacing[4],
    marginBottom: spacing[5],
    overflow: 'hidden',
  },
  activeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  activeBannerEmoji: {
    fontSize: 22,
  },
  activeBannerText: {
    flex: 1,
  },
  activeBannerTitle: {
    ...textStyles.bodyMedium,
    color: '#10B981',
    fontWeight: '700',
    fontSize: 14,
  },
  activeBannerSubtitle: {
    ...textStyles.caption,
    color: '#FFFFFF',
    fontSize: 13,
  },
  activeBannerActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  resumeBtn: {
    backgroundColor: '#10B981',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  resumeBtnText: {
    ...textStyles.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  endBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  endBtnText: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },

  searchSection: {
    zIndex: 100,
  },

  // ── Favourites ───────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  sectionSubtext: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2.5],
  },
  favoritePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 25, 38, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    width: (width - spacing[5] * 2 - spacing[2.5]) / 2,
    gap: spacing[2.5],
  },
  favoritePillEmoji: {
    fontSize: 16,
  },
  favoritePillLabel: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // ── Recent Walks ─────────────────────────────────────────────────────────
  carouselContainer: {
    gap: spacing[3],
    paddingRight: spacing[5],
  },
  recentCard: {
    width: 170,
    backgroundColor: 'rgba(22, 25, 38, 0.7)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing[3.5],
  },
  recentIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIcon: {
    fontSize: 16,
  },
  recentCardTitle: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginTop: spacing[2.5],
  },
  recentCardMeta: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  walkAgainBtn: {
    marginTop: spacing[3],
  },
  walkAgainText: {
    ...textStyles.caption,
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── CTA Button ────────────────────────────────────────────────────────────
  startWalkBtn: {
    marginTop: spacing[8],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  startWalkGradient: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWalkText: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  ctaSubtitle: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
