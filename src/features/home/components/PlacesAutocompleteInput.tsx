/**
 * WalkWithMe — Places Autocomplete Input Component (Gold & Emerald Glass Theme - NO BLUE)
 *
 * Renders a luxury dark glassmorphic search bar with live autocomplete prediction list
 * and a 🎤 Voice Search button for hands-free Indian location queries.
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';
import { usePlaceAutocomplete } from '@/hooks';
import { getPlacePredictions } from '@/services/maps';
import { LocationVoiceSearchModal } from './LocationVoiceSearchModal';
import type { PlacePrediction } from '@/types';

interface PlacesAutocompleteInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSelectPrediction: (prediction: PlacePrediction) => void;
  placeholder?: string;
}

export function PlacesAutocompleteInput({
  query,
  onQueryChange,
  onSelectPrediction,
  placeholder = 'Search places in India (e.g. Semra Lucknow)...',
}: PlacesAutocompleteInputProps) {
  const { data: predictions = [], isLoading } = usePlaceAutocomplete(query);
  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleFocus = () => {
    Animated.timing(inputBorderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(inputBorderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleVoiceSearchResult = async (transcription: string) => {
    const cleanStr = transcription.trim();
    if (!cleanStr) return;

    onQueryChange(cleanStr);
    setIsVoiceModalOpen(false);

    // Auto-fetch prediction and launch direct navigation (Google Maps Voice Search behavior)
    try {
      const results = await getPlacePredictions(cleanStr);
      if (results.length > 0) {
        onSelectPrediction(results[0]!);
      }
    } catch (e) {
      console.warn('[PlacesInput] Auto voice navigation error:', e);
    }
  };

  const borderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(245, 158, 11, 0.3)', '#10B981'],
  });

  const showDropdown = query.trim().length >= 2 && (predictions.length > 0 || isLoading);

  return (
    <View style={styles.container}>
      {/* Search Input Box */}
      <Animated.View style={[styles.searchWrapper, { borderColor }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="rgba(194, 197, 220, 0.4)"
          value={query}
          onChangeText={onQueryChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          accessibilityLabel="Search for an Indian place or address"
        />

        {/* Clear Button */}
        {query.length > 0 ? (
          <TouchableOpacity
            onPress={() => onQueryChange('')}
            style={styles.clearButton}
            accessibilityLabel="Clear search input"
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}

        {/* Voice Search Microphone Button */}
        <TouchableOpacity
          onPress={() => setIsVoiceModalOpen(true)}
          style={styles.voiceSearchBtn}
          accessibilityLabel="Voice search location"
        >
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : null}
      </Animated.View>

      {/* Autocomplete Dropdown List */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {isLoading && predictions.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Searching places in India...</Text>
            </View>
          ) : (
            predictions.map((prediction, index) => (
              <TouchableOpacity
                key={prediction.placeId}
                style={[
                  styles.predictionItem,
                  index < predictions.length - 1 && styles.predictionItemBorder,
                ]}
                onPress={() => onSelectPrediction(prediction)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${prediction.structuredFormatting.mainText}`}
              >
                <View style={styles.pinWrapper}>
                  <Text style={styles.pinIcon}>📍</Text>
                </View>

                <View style={styles.predictionTextWrapper}>
                  <Text style={styles.mainText} numberOfLines={1}>
                    {prediction.structuredFormatting.mainText}
                  </Text>
                  {Boolean(prediction.structuredFormatting.secondaryText) && (
                    <Text style={styles.secondaryText} numberOfLines={1}>
                      {prediction.structuredFormatting.secondaryText}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Voice Search Listening Modal */}
      <LocationVoiceSearchModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSelectLocation={handleVoiceSearchResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10,
    marginBottom: spacing[4],
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 28, 40, 0.95)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    paddingHorizontal: spacing[4],
    paddingVertical: Platform.OS === 'ios' ? spacing[3.5] : spacing[2],
    ...shadow.glow,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: spacing[2],
  },

  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.dark.text,
    padding: 0,
  },

  clearButton: {
    padding: spacing[1],
    marginRight: spacing[2],
  },

  clearIcon: {
    fontSize: 14,
    color: colors.dark.textTertiary,
  },

  voiceSearchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },

  voiceIcon: {
    fontSize: 16,
  },

  loader: {
    marginLeft: spacing[2],
  },

  // ── Dropdown ──────────────────────────────────────────────────────────────

  dropdown: {
    backgroundColor: 'rgba(26, 28, 40, 0.98)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    marginTop: spacing[2],
    overflow: 'hidden',
    ...shadow.glow,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },

  loadingText: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
  },

  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    gap: spacing[3],
  },

  predictionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },

  pinWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pinIcon: {
    fontSize: 16,
  },

  predictionTextWrapper: {
    flex: 1,
  },

  mainText: {
    ...textStyles.bodyMedium,
    color: colors.dark.text,
    fontSize: 15,
  },

  secondaryText: {
    ...textStyles.caption,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
});
