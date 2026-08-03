/**
 * WalkWithMe — Camera & Image Picker Service
 *
 * Wraps expo-camera and expo-image-picker for capturing photos
 * and picking images from device library for GPT Vision analysis.
 */

import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

export interface CapturedImageResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
}

/**
 * Requests device camera permission.
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { granted } = await Camera.requestCameraPermissionsAsync();
    return granted;
  } catch (error) {
    console.warn('[CameraService] Camera permission error:', error);
    return false;
  }
}

/**
 * Requests photo gallery permission.
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  try {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return granted;
  } catch (error) {
    console.warn('[CameraService] Media library permission error:', error);
    return false;
  }
}

/**
 * Opens image gallery picker to select a photo of surroundings.
 */
export async function pickImageFromGallery(): Promise<CapturedImageResult | null> {
  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        width: asset.width,
        height: asset.height,
      };
    }

    return null;
  } catch (error) {
    console.warn('[CameraService] Gallery pick error:', error);
    return null;
  }
}
