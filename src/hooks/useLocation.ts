/**
 * WalkWithMe — Custom Live Location & Navigation Hook
 *
 * Subscribes to device GPS updates, updates current user position in state,
 * performs automatic step progression when reaching landmarks, and triggers
 * rerouting when off-route.
 */

import { useEffect, useRef } from 'react';
import { watchLocationCoordinates, evaluateLocationTick } from '@/services/location';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useReplanRoute } from '@/hooks/useDirections';
import type { Coordinates } from '@/types';

export function useLiveLocation(enabled = true) {
  const {
    activeTrip,
    setCurrentLocation,
    advanceToNextStep,
    setIsOnRoute,
  } = useNavigationStore();

  const replanMutation = useReplanRoute();
  const lastReplanTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    let subscription: { remove: () => void } | null = null;

    const startWatching = async () => {
      subscription = await watchLocationCoordinates((coords: Coordinates) => {
        setCurrentLocation(coords);

        // Evaluate location against active trip
        if (activeTrip && activeTrip.status === 'active') {
          const evalResult = evaluateLocationTick(coords, activeTrip);

          // Auto-advance step when reaching step end point
          if (evalResult.shouldAdvanceStep) {
            advanceToNextStep();
          }

          // Off-route handling
          if (evalResult.isOffRoute) {
            setIsOnRoute(false);
            const now = Date.now();
            // Throttle rerouting calls to once every 15 seconds max
            if (now - lastReplanTime.current > 15_000 && !replanMutation.isPending) {
              lastReplanTime.current = now;
              replanMutation.mutate({
                origin: coords,
                destination: activeTrip.destination,
              });
            }
          } else {
            setIsOnRoute(true);
          }
        }
      });
    };

    startWatching();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, activeTrip?.id, activeTrip?.currentStepIndex, activeTrip?.status]);
}
