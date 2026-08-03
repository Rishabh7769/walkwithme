/**
 * WalkWithMe — Places Autocomplete Input Component
 *
 * Renders an animated search bar with a live prediction dropdown list.
 */

import { useRef } from 'react';
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
  placeholder = 'Search for a place...',
}: PlacesAutocompleteInputProps) {
  const { data: predictions = [], isLoading } = usePlaceAutocomplete(query);
  const inputBorderAnim = useRef(new Animated.Value(0)).current;

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

  const borderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.dark.border, colors.primary],
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
          placeholderTextColor={colors.dark.placeholder}
          value={query}
          onChangeText={onQueryChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          accessibilityLabel="Search for a place or address"
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : query.length > 0 ? (
          <TouchableOpacity
            onPress={() => onQueryChange('')}
            style={styles.clearButton}
            accessibilityLabel="Clear search input"
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {/* Autocomplete Dropdown List */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {isLoading && predictions.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Searching places...</Text>
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
                <Text style={styles.pinIcon}>📍</Text>
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
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    paddingHorizontal: spacing[4],
    paddingVertical: Platform.OS === 'ios' ? spacing[4] : spacing[2],
    ...shadow.md,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: spacing[3],
  },

  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.dark.text,
    padding: 0,
  },

  clearButton: {
    padding: spacing[1],
  },

  clearIcon: {
    fontSize: 14,
    color: colors.dark.textTertiary,
  },

  loader: {
    marginLeft: spacing[2],
  },

  // ── Dropdown ──────────────────────────────────────────────────────────────

  dropdown: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginTop: spacing[2],
    overflow: 'hidden',
    ...shadow.lg,
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
    borderBottomColor: colors.dark.borderSubtle,
  },

  pinIcon: {
    fontSize: 18,
  },

  predictionTextWrapper: {
    flex: 1,
  },

  mainText: {
    ...textStyles.bodyMedium,
    color: colors.dark.text,
  },

  secondaryText: {
    ...textStyles.caption,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
});
