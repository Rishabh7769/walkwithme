/**
 * WalkWithMe — Home Screen (Luxury Emerald & Gold Redesign)
 *
 * Features:
 * - Real-time India Places Autocomplete search bar with 🎤 Voice Search
 * - Luxury Glassmorphic Favorite Place cards with giant touch targets
 * - Instant Navigation start with clear distance & duration estimates
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
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';
import { useUserStore } from '@/store/useUserStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useAppNavigation } from '@/hooks';
import { getPlaceDetails, getWalkingDirections } from '@/services/maps';
import { getCurrentCoordinates } from '@/services/location';
import { PlacesAutocompleteInput, EditFavoriteModal } from '@/features/home';
import type { FavoritePlace, PlacePrediction, PlaceResult } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing[4] * 2 - spacing[3]) / 2;

// ── Active Trip Banner ────────────────────────────────────────────────────

interface ActiveTripBannerProps {
  destinationName: string;
  onResume: () => void;
  onEnd: () => void;
}

function ActiveTripBanner({ destinationName, onResume, onEnd }: ActiveTripBannerProps) {
  return (
    <View style={styles.activeBanner}>
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.25)', 'rgba(245, 158, 11, 0.15)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.activeBannerContent}>
        <View style={styles.activeBannerEmojiWrapper}>
          <Text style={styles.activeBannerEmoji}>🚶‍♀️</Text>
        </View>
        <View style={styles.activeBannerText}>
          <Text style={styles.activeBannerTitle}>Active Walking Trip</Text>
          <Text style={styles.activeBannerSubtitle} numberOfLines={1}>
            → {destinationName}
          </Text>
        </View>
      </View>
      <View style={styles.activeBannerActions}>
        <TouchableOpacity onPress={onResume} style={styles.resumeButton}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.resumeButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.resumeButtonText}>Resume</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onEnd} style={styles.endBannerButton}>
          <Text style={styles.endBannerButtonText}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Favorite Place Card ───────────────────────────────────────────────────

interface FavoriteCardProps {
  favorite: FavoritePlace;
  onPress: (favorite: FavoritePlace) => void;
  onLongPress: (favorite: FavoritePlace) => void;
}

function FavoriteCard({ favorite, onPress, onLongPress }: FavoriteCardProps) {
  const hasAddress = favorite.address.length > 0;

  return (
    <TouchableOpacity
      onPress={() => onPress(favorite)}
      onLongPress={() => onLongPress(favorite)}
      style={[styles.favoriteCard, !hasAddress && styles.favoriteCardEmpty]}
      accessibilityRole="button"
      accessibilityLabel={`Favorite ${favorite.label}${hasAddress ? `: ${favorite.address}` : ', tap to set address'}`}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          hasAddress
            ? ['rgba(32, 35, 51, 0.95)', 'rgba(24, 26, 38, 0.95)']
            : ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.02)']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.favoriteEmojiWrapper}>
        <Text style={styles.favoriteEmoji}>{favorite.emoji}</Text>
      </View>
      <Text style={styles.favoriteLabel} numberOfLines={1}>{favorite.label}</Text>
      {hasAddress ? (
        <Text style={styles.favoriteAddress} numberOfLines={2}>{favorite.address}</Text>
      ) : (
        <Text style={styles.favoriteAddPlaceholder}>+ Tap to set</Text>
      )}
    </TouchableOpacity>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, profile } = useUserStore();
  const { activeTrip, setActiveTrip, reset } = useNavigationStore();
  const { startTrip } = useAppNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingFavorite, setEditingFavorite] = useState<FavoritePlace | null>(null);

  const hasTripActive = activeTrip?.status === 'active' || activeTrip?.status === 'rerouting';

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    const details = await getPlaceDetails(prediction.placeId);
    const destination: PlaceResult = {
      placeId: prediction.placeId,
      name: details?.name ?? prediction.structuredFormatting.mainText,
      address: details?.formattedAddress ?? prediction.description,
      coordinates: details?.coordinates ?? { latitude: 0, longitude: 0 },
    };

    // Get real GPS coordinates for the origin
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

  const handleFavoriteLongPress = (favorite: FavoritePlace) => {
    setEditingFavorite(favorite);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + spacing[3], spacing[6]),
            paddingBottom: Math.max(insets.bottom + spacing[6], spacing[8]),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Luxury Hero Banner */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.15)', 'rgba(245, 158, 11, 0.1)']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.greetingText}>
              {profile.languagePreference === 'hi' ? 'नमस्ते 🙏' : profile.languagePreference === 'hinglish' ? 'Namaste 🙏' : 'Welcome back 👋'}
            </Text>
            <Text style={styles.heroTitle}>Where are you walking to?</Text>
            <Text style={styles.heroSubtitle}>
              Search any place in India or tap 🎤 Voice Search to walk with AI guidance
            </Text>
          </LinearGradient>
        </View>

        {/* Active Trip Resume Banner */}
        {hasTripActive && activeTrip && (
          <ActiveTripBanner
            destinationName={activeTrip.destination.name}
            onResume={() => startTrip(activeTrip.destination)}
            onEnd={reset}
          />
        )}

        {/* Places Search Bar with 🎤 Voice Search */}
        <PlacesAutocompleteInput
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSelectPrediction={handleSelectPrediction}
          placeholder="Search places in India (e.g. Sunder Village Semra)..."
        />

        {/* Favorites Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Places</Text>
          <Text style={styles.sectionSubtitle}>Tap to walk • Hold to edit</Text>
        </View>

        <View style={styles.favoritesGrid}>
          {favorites.map((fav) => (
            <FavoriteCard
              key={fav.id}
              favorite={fav}
              onPress={handleFavoritePress}
              onLongPress={handleFavoriteLongPress}
            />
          ))}
        </View>
      </ScrollView>

      {/* Edit Favorite Modal */}
      {editingFavorite && (
        <EditFavoriteModal
          visible={Boolean(editingFavorite)}
          favorite={editingFavorite}
          onClose={() => setEditingFavorite(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },

  scrollContent: {
    paddingHorizontal: spacing[4],
  },

  heroBanner: {
    marginBottom: spacing[5],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    ...shadow.glow,
  },

  heroGradient: {
    padding: spacing[5],
  },

  greetingText: {
    ...textStyles.caption,
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '700',
    marginBottom: spacing[1],
  },

  heroTitle: {
    ...textStyles.screenTitle,
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: spacing[2],
  },

  heroSubtitle: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
    lineHeight: 22,
  },

  // Active Trip Banner
  activeBanner: {
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[5],
    padding: spacing[4],
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#10B981',
    ...shadow.glow,
  },

  activeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },

  activeBannerEmojiWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeBannerEmoji: { fontSize: 24 },

  activeBannerText: { flex: 1 },

  activeBannerTitle: {
    ...textStyles.bodyMedium,
    color: '#10B981',
    fontWeight: '700',
  },

  activeBannerSubtitle: {
    ...textStyles.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  activeBannerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },

  resumeButton: {
    flex: 2,
    height: 46,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },

  resumeButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resumeButtonText: {
    ...textStyles.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  endBannerButton: {
    flex: 1,
    height: 46,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  endBannerButtonText: {
    ...textStyles.button,
    color: '#F43F5E',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },

  sectionTitle: {
    ...textStyles.sectionHeader,
    fontSize: 20,
    color: '#FFFFFF',
  },

  sectionSubtitle: {
    ...textStyles.caption,
    color: colors.dark.textSecondary,
  },

  // Favorites Grid
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },

  favoriteCard: {
    width: CARD_WIDTH,
    height: 125,
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadow.glow,
  },

  favoriteCardEmpty: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  favoriteEmojiWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  favoriteEmoji: { fontSize: 20 },

  favoriteLabel: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  favoriteAddress: {
    ...textStyles.caption,
    color: colors.dark.textSecondary,
    fontSize: 12,
  },

  favoriteAddPlaceholder: {
    ...textStyles.caption,
    color: '#F59E0B',
    fontWeight: '700',
  },
});
