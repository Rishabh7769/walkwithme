/**
 * WalkWithMe — Places Autocomplete Input
 *
 * Renders a search bar with:
 * - Real-time place predictions (triggers on first character)
 * - 🎤 Voice search button
 * - Dropdown with proper zIndex so it overlays content below
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
  placeholder = 'Search any place (city, landmark, address)...',
}: PlacesAutocompleteInputProps) {
  const { data: predictions = [], isLoading } = usePlaceAutocomplete(query);
  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleFocus = () => {
    Animated.timing(inputBorderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(inputBorderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleVoiceResult = async (transcription: string) => {
    const text = transcription.trim();
    if (!text) return;
    onQueryChange(text);
    setIsVoiceModalOpen(false);

    // Auto-navigate on voice selection: fetch top prediction and fire
    const results = await getPlacePredictions(text);
    if (results.length > 0) {
      onSelectPrediction(results[0]!);
    }
  };

  const borderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(245,158,11,0.3)', '#10B981'],
  });

  // Show dropdown when there is a query AND there are results (or it's loading)
  const showDropdown = query.trim().length >= 1 && (predictions.length > 0 || isLoading);

  return (
    <View style={styles.root}>
      {/* Input Row */}
      <Animated.View style={[styles.inputRow, { borderColor }]}>
        <Text style={styles.searchIcon}>🔍</Text>

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(200,202,220,0.38)"
          value={query}
          onChangeText={onQueryChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search places"
        />

        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => onQueryChange('')}
            style={styles.clearBtn}
            accessibilityLabel="Clear search"
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setIsVoiceModalOpen(true)}
          style={styles.voiceBtn}
          accessibilityLabel="Voice search"
        >
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : null}
      </Animated.View>

      {/* Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {isLoading && predictions.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            predictions.map((p, idx) => (
              <TouchableOpacity
                key={p.placeId}
                style={[styles.predRow, idx < predictions.length - 1 && styles.predRowBorder]}
                onPress={() => {
                  onQueryChange(p.structuredFormatting.mainText);
                  onSelectPrediction(p);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Navigate to ${p.structuredFormatting.mainText}`}
              >
                <View style={styles.pinBadge}>
                  <Text style={styles.pinIcon}>📍</Text>
                </View>
                <View style={styles.predText}>
                  <Text style={styles.predMain} numberOfLines={1}>
                    {p.structuredFormatting.mainText}
                  </Text>
                  {p.structuredFormatting.secondaryText ? (
                    <Text style={styles.predSub} numberOfLines={1}>
                      {p.structuredFormatting.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <LocationVoiceSearchModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSelectLocation={handleVoiceResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    zIndex: 100,
    marginBottom: spacing[4],
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1C28',
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    paddingHorizontal: spacing[4],
    paddingVertical: Platform.OS === 'ios' ? spacing[3.5] : spacing[2.5],
    ...shadow.glow,
  },

  searchIcon: {
    fontSize: 17,
    marginRight: spacing[2],
  },

  input: {
    flex: 1,
    ...textStyles.body,
    color: '#FFFFFF',
    fontSize: 16,
    padding: 0,
  },

  clearBtn: {
    padding: spacing[1.5],
    marginRight: spacing[1],
  },

  clearIcon: {
    fontSize: 13,
    color: colors.dark.textTertiary,
  },

  voiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  voiceIcon: {
    fontSize: 16,
  },

  loader: {
    marginLeft: spacing[2],
  },

  // ── Dropdown ────────────────────────────────────────────────────────────

  dropdown: {
    backgroundColor: '#1E2030',
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: '#F59E0B',
    marginTop: spacing[2],
    overflow: 'hidden',
    zIndex: 9999,
    // Android elevation
    elevation: 20,
    // iOS shadow
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
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

  predRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    gap: spacing[3],
  },

  predRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },

  pinBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pinIcon: {
    fontSize: 16,
  },

  predText: {
    flex: 1,
  },

  predMain: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  predSub: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    fontSize: 12,
  },
});
