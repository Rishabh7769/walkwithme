/**
 * WalkWithMe — Home Screen (Milestone 3: Google Places)
 *
 * Milestone 3 Upgrades:
 * - Real-time Google Places Autocomplete dropdown search
 * - Selecting any place prediction fetches coordinates & starts navigation
 * - Favorite place management:
 *   - Tap unconfigured favorite → opens EditFavoriteModal
 *   - Tap configured favorite → starts navigation immediately
 *   - Long-press any favorite → opens EditFavoriteModal to reconfigure
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
        colors={['rgba(20,184,166,0.15)', 'rgba(99,102,241,0.1)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.activeBannerContent}>
        <Text style={styles.activeBannerEmoji}>🚶‍♀️</Text>
        <View style={styles.activeBannerText}>
          <Text style={styles.activeBannerTitle}>Trip in Progress</Text>
          <Text style={styles.activeBannerSubtitle} numberOfLines={1}>
            → {destinationName}
          </Text>
        </View>
      </View>
      <View style={styles.activeBannerActions}>
        <TouchableOpacity onPress={onResume} style={styles.resumeButton}>
          <LinearGradient
            colors={colors.gradients.success}
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
      {hasAddress && (
        <LinearGradient
          colors={['rgba(99,102,241,0.25)', 'rgba(139,92,246,0.08)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Text style={styles.favoriteEmoji}>{favorite.emoji}</Text>
      <Text style={styles.favoriteLabel} numberOfLines={1}>{favorite.label}</Text>
      {hasAddress ? (
        <Text style={styles.favoriteAddress} numberOfLines={2}>{favorite.address}</Text>
      ) : (
        <Text style={styles.favoriteAddPlaceholder}>Tap to set</Text>
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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    const details = await getPlaceDetails(prediction.placeId);
    const destination: PlaceResult = {
      placeId: prediction.placeId,
      name: details?.name ?? prediction.structuredFormatting.mainText,
      address: details?.formattedAddress ?? prediction.description,
      coordinates: details?.coordinates ?? { latitude: 28.6139, longitude: 77.2090 },
    };

    const trip = await getWalkingDirections({
      origin: { latitude: 28.6139, longitude: 77.2090 },
      destination,
    });
    setActiveTrip(trip);
    startTrip(destination);
  };

  const handleFavoritePress = async (favorite: FavoritePlace) => {
    if (!favorite.address) {
      setEditingFavorite(favorite);
      return;
    }

    const destination: PlaceResult = {
      placeId: favorite.placeId || `fav-${favorite.id}`,
      name: favorite.label,
      address: favorite.address,
      coordinates: { latitude: favorite.latitude || 28.6139, longitude: favorite.longitude || 77.2090 },
    };

    const trip = await getWalkingDirections({
      origin: { latitude: 28.6139, longitude: 77.2090 },
      destination,
    });
    setActiveTrip(trip);
    startTrip(destination);
  };

  const handleFavoriteLongPress = (favorite: FavoritePlace) => {
    setEditingFavorite(favorite);
  };

  const handleResumeTrip = () => {
    if (!activeTrip) return;
    startTrip(activeTrip.destination);
  };

  const handleEndActiveTrip = () => {
    reset();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.dark.background, colors.dark.surface]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.ambientGlow} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {profile.displayName} 👋
          </Text>
          <Text style={styles.heroHeading}>
            Where do you{'\n'}want to go?
          </Text>
        </View>

        {/* Active trip banner */}
        {hasTripActive && activeTrip && (
          <ActiveTripBanner
            destinationName={activeTrip.destination.name}
            onResume={handleResumeTrip}
            onEnd={handleEndActiveTrip}
          />
        )}

        {/* Autocomplete Input */}
        <PlacesAutocompleteInput
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSelectPrediction={handleSelectPrediction}
          placeholder="Search for a place..."
        />

        {/* Favorites */}
        <View style={styles.favoritesSection}>
          <View style={styles.favoritesHeader}>
            <Text style={styles.sectionTitle}>Your Favourites</Text>
            <Text style={styles.sectionHint}>Long press to edit</Text>
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
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            I guide you with landmarks — no confusing directions.
          </Text>
        </View>
      </ScrollView>

      {/* Edit Favorite Address Modal */}
      <EditFavoriteModal
        favorite={editingFavorite}
        visible={Boolean(editingFavorite)}
        onClose={() => setEditingFavorite(null)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },

  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },

  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },

  header: { marginBottom: spacing[5] },

  greeting: {
    ...textStyles.bodyMedium,
    color: colors.dark.textSecondary,
    marginBottom: spacing[2],
  },

  heroHeading: {
    ...textStyles.heroHeading,
    color: colors.dark.text,
  },

  // ── Active trip banner ────────────────────────────────────────────────────

  activeBanner: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    overflow: 'hidden',
    gap: spacing[3],
  },

  activeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  activeBannerEmoji: { fontSize: 28 },

  activeBannerText: { flex: 1 },

  activeBannerTitle: {
    ...textStyles.bodyMedium,
    color: colors.successText,
    marginBottom: 2,
  },

  activeBannerSubtitle: {
    ...textStyles.caption,
    color: colors.dark.textSecondary,
  },

  activeBannerActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },

  resumeButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  resumeButtonGradient: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },

  resumeButtonText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },

  endBannerButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  endBannerButtonText: {
    ...textStyles.button,
    color: colors.error,
  },

  // ── Favorites ────────────────────────────────────────────────────────────

  favoritesSection: { marginBottom: spacing[6] },

  favoritesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing[4],
  },

  sectionTitle: {
    ...textStyles.sectionHeader,
    color: colors.dark.text,
  },

  sectionHint: {
    ...textStyles.caption,
    color: colors.dark.textTertiary,
  },

  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },

  favoriteCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
    ...shadow.sm,
  },

  favoriteCardEmpty: {
    borderStyle: 'dashed',
    opacity: 0.7,
  },

  favoriteEmoji: { fontSize: 28, marginBottom: spacing[2] },

  favoriteLabel: {
    ...textStyles.bodyMedium,
    color: colors.dark.text,
    marginBottom: spacing[1],
  },

  favoriteAddress: {
    ...textStyles.caption,
    color: colors.dark.textSecondary,
  },

  favoriteAddPlaceholder: {
    ...textStyles.caption,
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
  },

  // ── Tip ───────────────────────────────────────────────────────────────────

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    gap: spacing[3],
  },

  tipIcon: { fontSize: 20 },

  tipText: {
    flex: 1,
    ...textStyles.body,
    color: colors.dark.textSecondary,
  },
});
