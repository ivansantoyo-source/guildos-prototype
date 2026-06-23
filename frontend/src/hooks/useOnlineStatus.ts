// ============================================================================
// GUILDOS — useOnlineStatus Hook
// Detects network connectivity changes using navigator.onLine + window events.
// Returns isOnline boolean that updates in real-time when connectivity changes.
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Tracks the browser's online/offline status in real-time.
 *
 * Uses `navigator.onLine` for initial detection and listens for `online` / `offline`
 * window events for live updates. Handles edge cases where the user is on a
 * local-only network (returns `true` but requests may still fail — the caller
 * should still catch fetch errors).
 *
 * @returns An object with:
 *   - `isOnline` (boolean): Whether the browser reports network connectivity
 *   - `wasEverOffline` (boolean): Whether the connection was ever lost during this session
 *   - `lastOfflineAt` (string | null): ISO timestamp of the last offline event
 *
 * @example
 * const { isOnline, wasEverOffline } = useOnlineStatus();
 * if (!isOnline) return <OfflineBanner />;
 */
export function useOnlineStatus(): {
  isOnline: boolean;
  wasEverOffline: boolean;
  lastOfflineAt: string | null;
} {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasEverOffline, setWasEverOffline] = useState(false);
  const [lastOfflineAt, setLastOfflineAt] = useState<string | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasEverOffline(true);
    setLastOfflineAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Re-check on mount (edge case: navigator.onLine changes between render and mount)
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Periodic re-check as a fallback (every 30 seconds)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      const currentOnline = navigator.onLine;
      setIsOnline(currentOnline);
      if (!currentOnline) {
        setWasEverOffline(true);
        setLastOfflineAt(new Date().toISOString());
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline, wasEverOffline, lastOfflineAt };
}
