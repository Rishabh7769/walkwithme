/**
 * WalkWithMe — Home Screen (1:1 Exact Lovable Design System Match)
 *
 * Pixel-perfect match to Lovable mockup:
 * - "GOOD AFTERNOON" + "Ready when you are" gradient title
 * - "• High Accuracy GPS" status pill badge
 * - Top-right action icons: Settings button + "AR" Avatar circle
 * - Full glass search bar with 🔍 search icon, "Where are we walking today?" placeholder, and 🎤 mic button
 * - Quick Favourites 2x2 grid (🏠 Home, 🏢 Work, ☕ Favourite Cafe, ❤️ Partner's Place) + "+ Add favourite" dotted button
 * - Recent Walks horizontal carousel with footprints badge and "Walk again >" link
 * - Bottom emerald "Start walking with me" CTA button & companion subtext
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

// 1:1 Match to Lovable Mockup Favourites
const DEFAULT_LOVABLE_FAVORITES: FavoritePlace[] = [
  { id: '1', label: 'Home', emoji: '🏠', address: '', placeId: '', latitude: 0, longitude: 0 },
  { id: '2', label: 'Work', emoji: '🏢', address: '', placeId: '', latitude: 0, longitude: 0 },
  { id: '3', label: 'Favourite Cafe', emoji: '☕', address: '', placeId: '', latitude: 0, longitude: 0 },
  { id: '4', label: "Partner's Place", emoji: '❤️', address: '', placeId: '', latitude: 0, longitude: 0 },
];

// 1:1 Match to Lovable Mockup Recent Walks
const RECENT_WALKS = [
  { id: '1', name: 'Metro Station', meta: '1.1 km • 14 min', tint: 'emerald' },
  { id: '2', name: 'Night Pharmacy', meta: '600 m • 8 min', tint: 'gold' },
  { id: '3', name: 'Riverside Loop', meta: '2.4 km • 30 min', tint: 'emerald' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, profile } = useUserStore();
  const { activeTrip, setActiveTrip, reset } = useNavigationStore();
  const { startTrip, openSettings } = useAppNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingFavorite, setEditingFavorite] = useState<FavoritePlace | null>(null);

  // Combine user favorites or fall back to Lovable exact 4 items
  const displayFavorites = favorites && favorites.length >= 4 ? favorites : DEFAULT_LOVABLE_FAVORITES;

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    const details = await getPlaceDetails(prediction.placeId);
    const destination: PlaceResult = {
      placeId: prediction.placeId,
      name: details?.name ?? prediction.structuredFormatting.mainText,
      address: details?.formattedAddress ?? prediction.description,
      coordinates: details?.coordinates ?? { latitude: 0, longitude: 0 },
    };

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
      {/* Background Mesh Glows */}
      <View style={styles.meshGlowTopLeft} />
      <View style={styles.meshGlowTopRight} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.greetingText}>GOOD AFTERNOON</Text>
            <Text style={styles.headerTitle}>Ready when you are</Text>
            
            {/* High Accuracy GPS Pill */}
            <View style={styles.gpsPill}>
              <View style={styles.gpsPulseDot} />
              <Text style={styles.gpsPillText}>High Accuracy GPS</Text>
            </View>
          </View>

          {/* Right Action Icons: Settings + AR Avatar */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconCircle} onPress={openSettings} activeOpacity={0.8}>
              <Text style={styles.iconCircleSymbol}>⚙️</Text>
            </TouchableOpacity>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>AR</Text>
            </View>
          </View>
        </View>

        {/* ── Active Trip Banner (if route active) ───────────────────────── */}
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
              <TouchableOpacity onPress={() => startTrip(activeTrip.destination)} style={styles.resumeBtn}>
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

        {/* ── Quick Favourites Section ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK FAVOURITES</Text>
        </View>

        {/* 2x2 Favorites Grid */}
        <View style={styles.favoritesGrid}>
          {displayFavorites.map((fav) => (
            <TouchableOpacity
              key={fav.id}
              style={styles.favoritePill}
              onPress={() => handleFavoritePress(fav)}
              onLongPress={() => setEditingFavorite(fav)}
              activeOpacity={0.8}
            >
              <Text style={styles.favoriteEmoji}>{fav.emoji}</Text>
              <Text style={styles.favoriteLabel} numberOfLines={1}>
                {fav.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* "+ Add favourite" Dotted Button */}
        <TouchableOpacity
          style={styles.addFavoriteBtn}
          onPress={() => {
            const newFav: FavoritePlace = { id: `fav-${Date.now()}`, label: 'New Place', emoji: '📍', address: '', placeId: '', latitude: 0, longitude: 0 };
            setEditingFavorite(newFav);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.addFavoriteText}>+ Add favourite</Text>
        </TouchableOpacity>

        {/* ── Recent Walks Carousel ────────────────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: spacing[7] }]}>
          <Text style={styles.sectionTitle}>RECENT WALKS</Text>
          <Text style={styles.sectionSubtext}>Last 7 days</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
          {RECENT_WALKS.map((item) => (
            <View key={item.id} style={styles.recentCard}>
              <View style={[styles.footprintBadge, item.tint === 'gold' && styles.footprintBadgeGold]}>
                <Text style={styles.footprintIcon}>👣</Text>
              </View>
              <Text style={styles.recentCardTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.recentCardMeta}>{item.meta}</Text>
              <TouchableOpacity
                style={styles.walkAgainBtn}
                onPress={() => setSearchQuery(item.name)}
              >
                <Text style={styles.walkAgainText}>Walk again ❯</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* ── CTA Button ───────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.startWalkBtn}
          onPress={() => {
            if (displayFavorites.length > 0) handleFavoritePress(displayFavorites[0]!);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.startWalkText}>Start walking with me</Text>
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
    backgroundColor: '#0B0D14', // Exact Lovable dark obsidian background
  },
  meshGlowTopLeft: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 125,
  },
  meshGlowTopRight: {
    position: 'absolute',
    top: -30,
    right: -50,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 110,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[6],
    marginTop: spacing[1],
  },
  headerTitleGroup: {
    flex: 1,
  },
  greetingText: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    backgroundColor: 'rgba(22, 25, 38, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    alignSelf: 'flex-start',
    marginTop: spacing[3],
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(22, 25, 38, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSymbol: {
    fontSize: 16,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.caption,
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
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
    marginBottom: spacing[2],
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
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    backgroundColor: 'rgba(22, 25, 38, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    width: (width - spacing[5] * 2 - spacing[2.5]) / 2,
    gap: spacing[2.5],
  },
  favoriteEmoji: {
    fontSize: 16,
  },
  favoriteLabel: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  addFavoriteBtn: {
    marginTop: spacing[3],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFavoriteText: {
    ...textStyles.bodyMedium,
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Recent Walks ─────────────────────────────────────────────────────────
  carouselContainer: {
    gap: spacing[3],
    paddingRight: spacing[5],
  },
  recentCard: {
    width: 170,
    backgroundColor: 'rgba(22, 25, 38, 0.75)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing[4],
  },
  footprintBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footprintBadgeGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  footprintIcon: {
    fontSize: 16,
  },
  recentCardTitle: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginTop: spacing[3],
  },
  recentCardMeta: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    marginTop: 2,
  },
  walkAgainBtn: {
    marginTop: spacing[3.5],
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
    backgroundColor: '#10B981', // Exact solid vibrant emerald pill from mockup
    borderRadius: borderRadius.full,
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  startWalkText: {
    ...textStyles.bodyMedium,
    color: '#0B0D14', // Dark obsidian text inside bright green button matching mockup
    fontWeight: '700',
    fontSize: 15,
  },
  ctaSubtitle: {
    ...textStyles.caption,
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing[2.5],
  },
});
