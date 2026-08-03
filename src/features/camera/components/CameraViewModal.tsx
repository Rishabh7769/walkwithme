/**
 * WalkWithMe — Camera View Finder & GPT Vision Modal Component
 *
 * Provides a camera viewfinder interface for capturing photos of surroundings.
 * Sends captured photos to GPT-4o Vision for visual landmark analysis.
 */

import { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';
import { pickImageFromGallery } from '@/services/camera';
import { useAIVision } from '@/hooks';

interface CameraViewModalProps {
  visible: boolean;
  onClose: () => void;
  onVisionResult?: (guidance: string) => void;
}

export function CameraViewModal({ visible, onClose, onVisionResult }: CameraViewModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  const visionMutation = useAIVision();

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
        if (photo) {
          setCapturedUri(photo.uri);
          setCapturedBase64(photo.base64 ?? null);
        }
      } catch (error) {
        console.warn('[CameraViewModal] Take picture error:', error);
      }
    }
  };

  const handlePickGallery = async () => {
    const asset = await pickImageFromGallery();
    if (asset) {
      setCapturedUri(asset.uri);
      setCapturedBase64(asset.base64 ?? null);
    }
  };

  const handleAnalyzeWithAI = () => {
    // Generate base64 or fallback mock
    const b64 = capturedBase64 ?? 'mock-base64';

    visionMutation.mutate(
      { base64Image: b64, prompt: 'Where am I? What landmarks do you see?' },
      {
        onSuccess: (result) => {
          if (onVisionResult) {
            onVisionResult(result.visualGuidance);
          }
        },
      },
    );
  };

  const handleReset = () => {
    setCapturedUri(null);
    setCapturedBase64(null);
    visionMutation.reset();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Permission Request Screen */}
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionEmoji}>📷</Text>
            <Text style={styles.permissionTitle}>Camera Access Needed</Text>
            <Text style={styles.permissionSubtitle}>
              WalkWithMe needs camera access so the AI can help identify landmarks around you.
            </Text>
            <TouchableOpacity onPress={requestPermission} style={styles.grantButton}>
              <LinearGradient colors={colors.gradients.primary} style={styles.grantGradient}>
                <Text style={styles.grantText}>Grant Camera Access</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closePermissionButton}>
              <Text style={styles.closePermissionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : capturedUri ? (
          /* Preview & Vision Result Screen */
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="cover" />

            {/* Vision Result Card Overlay */}
            {visionMutation.data ? (
              <View style={styles.resultCard}>
                <LinearGradient colors={['rgba(30,27,75,0.95)', 'rgba(10,10,15,0.98)']} style={StyleSheet.absoluteFill} />
                <Text style={styles.resultEmoji}>🤖</Text>
                <Text style={styles.resultText}>{visionMutation.data.visualGuidance}</Text>
                <TouchableOpacity onPress={onClose} style={styles.doneButton}>
                  <LinearGradient colors={colors.gradients.success} style={styles.doneGradient}>
                    <Text style={styles.doneText}>Got it! Thanks 😊</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* Action Overlay */
              <View style={styles.previewActions}>
                <TouchableOpacity onPress={handleReset} style={styles.retakeButton}>
                  <Text style={styles.retakeText}>Retake 🔄</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAnalyzeWithAI}
                  disabled={visionMutation.isPending}
                  style={styles.analyzeButton}
                >
                  <LinearGradient colors={colors.gradients.primary} style={styles.analyzeGradient}>
                    {visionMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.analyzeText}>Ask AI Where I Am 🤖</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* Live Viewfinder */
          <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

            {/* Header Overlay */}
            <View style={styles.topHeader}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Point at surroundings</Text>
            </View>

            {/* Shutter controls Overlay */}
            <View style={styles.bottomControls}>
              <TouchableOpacity onPress={handlePickGallery} style={styles.galleryButton}>
                <Text style={styles.galleryIcon}>🖼️</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleTakePicture} style={styles.shutterButton}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>

              <View style={{ width: 44 }} />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    backgroundColor: colors.dark.background,
  },

  permissionEmoji: { fontSize: 64, marginBottom: spacing[4] },

  permissionTitle: {
    ...textStyles.screenTitle,
    color: colors.dark.text,
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  permissionSubtitle: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[8],
  },

  grantButton: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing[4],
    ...shadow.glow,
  },

  grantGradient: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },

  grantText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },

  closePermissionButton: { padding: spacing[3] },

  closePermissionText: {
    ...textStyles.button,
    color: colors.dark.textSecondary,
  },

  // ── Preview ───────────────────────────────────────────────────────────────

  previewContainer: {
    flex: 1,
    position: 'relative',
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  previewActions: {
    position: 'absolute',
    bottom: spacing[8],
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    gap: spacing[3],
  },

  retakeButton: {
    backgroundColor: 'rgba(10,10,15,0.85)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retakeText: {
    ...textStyles.button,
    color: colors.dark.text,
  },

  analyzeButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadow.glow,
  },

  analyzeGradient: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },

  analyzeText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },

  // ── Result overlay ────────────────────────────────────────────────────────

  resultCard: {
    position: 'absolute',
    bottom: spacing[8],
    left: spacing[4],
    right: spacing[4],
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    overflow: 'hidden',
    alignItems: 'center',
    ...shadow.lg,
  },

  resultEmoji: { fontSize: 36, marginBottom: spacing[3] },

  resultText: {
    ...textStyles.companionMessage,
    color: colors.dark.text,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 26,
  },

  doneButton: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },

  doneGradient: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },

  doneText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },

  // ── Viewfinder ───────────────────────────────────────────────────────────

  cameraContainer: { flex: 1 },

  topHeader: {
    position: 'absolute',
    top: spacing[10],
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeIcon: { fontSize: 18, color: '#FFFFFF' },

  headerTitle: {
    ...textStyles.bodyMedium,
    color: '#FFFFFF',
  },

  bottomControls: {
    position: 'absolute',
    bottom: spacing[10],
    left: spacing[8],
    right: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  galleryIcon: { fontSize: 20 },

  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },

  shutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
  },
});
