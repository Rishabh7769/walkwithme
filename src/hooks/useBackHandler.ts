/**
 * WalkWithMe — Android Back Handler Hook
 *
 * Manages the Android hardware back button throughout the app.
 *
 * On Companion screen: confirms before ending the trip.
 * On Chat screen: goes back to Companion, not Home.
 * On Home screen: minimizes the app (default behavior).
 *
 * Usage:
 *   useBackHandler(() => {
 *     // return true  → back button handled (don't exit/go back)
 *     // return false → default behavior (let Android handle it)
 *   });
 */

import { useEffect } from 'react';
import { BackHandler } from 'react-native';

type BackHandlerCallback = () => boolean;

/**
 * @param handler - Called when back button is pressed.
 *   Return `true` to indicate you handled it (prevents default back action).
 *   Return `false` to let React Native handle it normally.
 * @param enabled - Set to false to temporarily disable this handler.
 */
export function useBackHandler(
  handler: BackHandlerCallback,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handler,
    );

    return () => subscription.remove();
  }, [handler, enabled]);
}
