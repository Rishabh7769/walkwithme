/**
 * WalkWithMe — Network Status Hook
 *
 * Detects when the user loses internet connectivity.
 * This is critical for a navigation app — the AI needs internet,
 * and we need to warn the user kindly (not just crash).
 *
 * Future M8: will trigger offline route caching.
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  /** True if we know the status (false during initial load) */
  isLoaded: boolean;
}

const INITIAL_STATE: NetworkStatus = {
  isConnected: true, // Optimistic default — avoids flash of offline banner
  isInternetReachable: null,
  connectionType: null,
  isLoaded: false,
};

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(INITIAL_STATE);

  const updateStatus = useCallback((state: NetInfoState) => {
    setStatus({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
      isLoaded: true,
    });
  }, []);

  useEffect(() => {
    // Get current status immediately
    NetInfo.fetch().then(updateStatus);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(updateStatus);

    return unsubscribe;
  }, [updateStatus]);

  return status;
}
