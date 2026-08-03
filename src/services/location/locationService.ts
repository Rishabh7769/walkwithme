/**
 * WalkWithMe — Location Tracking Service
 *
 * Wraps expo-location for live GPS tracking and position fixes.
 */

import * as Location from 'expo-location';
import type { Coordinates } from '@/types';

export interface LocationSubscription {
  remove: () => void;
}

/**
 * Requests location permission from the device.
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('[LocationService] Permission request failed:', error);
    return false;
  }
}

/**
 * Gets a single high-accuracy position fix for current location.
 */
export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.warn('[LocationService] Get current location failed:', error);
    return null;
  }
}

/**
 * Subscribes to live GPS location updates.
 */
export async function watchLocationCoordinates(
  onLocationUpdate: (coords: Coordinates) => void,
): Promise<LocationSubscription | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000, // Update every 2 seconds
        distanceInterval: 3,  // Update every 3 meters
      },
      (location) => {
        onLocationUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      },
    );

    return subscription;
  } catch (error) {
    console.warn('[LocationService] Watch position failed:', error);
    return null;
  }
}
