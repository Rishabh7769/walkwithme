/**
 * WalkWithMe — Edit Favorite Modal Component
 *
 * Allows users to set or edit the address/location for favorite places
 * (Home, Office, Boyfriend, Favourite Cafe, or custom).
 */

import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';
import { useUserStore } from '@/store/useUserStore';
import { getPlaceDetails } from '@/services/maps';
import { PlacesAutocompleteInput } from './PlacesAutocompleteInput';
import type { FavoritePlace, PlacePrediction } from '@/types';

interface EditFavoriteModalProps {
  favorite: FavoritePlace | null;
  visible: boolean;
  onClose: () => void;
}

export function EditFavoriteModal({ favorite, visible, onClose }: EditFavoriteModalProps) {
  const { updateFavorite } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!favorite) return null;

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    try {
      const details = await getPlaceDetails(prediction.placeId);
      if (details) {
        updateFavorite(favorite.id, {
          address: details.formattedAddress,
          placeId: details.placeId,
          latitude: details.coordinates.latitude,
          longitude: details.coordinates.longitude,
        });
      } else {
        updateFavorite(favorite.id, {
          address: prediction.description,
          placeId: prediction.placeId,
        });
      }
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.warn('[EditFavoriteModal] Error updating favorite:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>{favorite.emoji}</Text>
            <View style={styles.headerText}>
              <Text style={styles.title}>Set address for {favorite.label}</Text>
              <Text style={styles.subtitle}>Search for a location to save as favorite</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Autocomplete Input */}
          <PlacesAutocompleteInput
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSelectPrediction={handleSelectPrediction}
            placeholder={`Search location for ${favorite.label}...`}
          />

          {favorite.address ? (
            <View style={styles.currentAddressCard}>
              <Text style={styles.currentLabel}>Current Saved Location:</Text>
              <Text style={styles.currentAddress}>{favorite.address}</Text>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.75)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.dark.border,
    minHeight: 380,
    ...shadow.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
    gap: spacing[3],
  },

  emoji: {
    fontSize: 32,
  },

  headerText: {
    flex: 1,
  },

  title: {
    ...textStyles.sectionHeader,
    color: colors.dark.text,
  },

  subtitle: {
    ...textStyles.caption,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeIcon: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },

  currentAddressCard: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginTop: spacing[2],
  },

  currentLabel: {
    ...textStyles.caption,
    color: colors.primaryLight,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },

  currentAddress: {
    ...textStyles.body,
    color: colors.dark.text,
  },
});
