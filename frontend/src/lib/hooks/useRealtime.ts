"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";

// ============================================================================
// GUILDOS — Real-Time Supabase Subscription Hook
// Generic hook for Supabase real-time subscriptions
// Handles INSERT, UPDATE, DELETE events
// Auto-reconnect on connection loss
// In demo mode, simulates events with random intervals
// Returns connection status
// ============================================================================

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";
type RealtimeCallback<T = unknown> = (
  event: RealtimeEvent,
  payload: T
) => void;

export interface UseRealtimeOptions<T = unknown> {
  /** Supabase table name */
  table: string;
  /** Optional Postgres filter (e.g. "status=eq.ACTIVE") */
  filter?: string;
  /** Callback fired on each event */
  callback: RealtimeCallback<T>;
  /** Whether to simulate events in demo mode */
  demoSimulate?: boolean;
  /** Base interval between demo events (ms) */
  demoInterval?: number;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// ============================================================================
// Generic Realtime Subscription Hook
// ============================================================================

export function useRealtimeSubscription<T = Record<string, unknown>>({
  table,
  filter,
  callback,
  demoSimulate = true,
  demoInterval = 8000,
}: UseRealtimeOptions<T>): {
  status: ConnectionStatus;
  isDemo: boolean;
} {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const demoMode = useGuildStore((s) => s.demoMode);
  const callbackRef = useRef<RealtimeCallback<T>>(callback);
  const reconnectingRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const maxRetries = 5;

  // Keep callback ref fresh
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Generate demo payloads based on table
  const getDemoPayload = useCallback((): T => {
    const base = {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    switch (table) {
      case "activity_feed":
      case "activity":
        return {
          ...base,
          type: (["SCAN", "SALE", "BOUNTY", "SCORE", "TRADE_IN", "GRAIL"] as const)[
            Math.floor(Math.random() * 6)
          ],
          title: `Activity: ${table}`,
          description: `Simulated event at ${new Date().toLocaleTimeString()}`,
          value: Math.round(Math.random() * 500 * 100) / 100,
          timestamp: new Date().toISOString(),
        } as unknown as T;
      case "inventory":
        return {
          ...base,
          item_name: `Demo Item #${Math.floor(Math.random() * 999)}`,
          platform: (["SNES", "NES", "GENESIS", "PS1", "N64", "SATURN"] as const)[
            Math.floor(Math.random() * 6)
          ],
          market_value: Math.round(Math.random() * 800 * 100) / 100,
          is_legendary: Math.random() < 0.12,
          stock_count: Math.floor(Math.random() * 3) + 1,
          status: "ACTIVE",
          condition: (["CIB", "LOOSE", "NEW", "SCRAP"] as const)[
            Math.floor(Math.random() * 4)
          ],
        } as unknown as T;
      case "bounties":
        return {
          ...base,
          target_item_name: `Bounty Target #${Math.floor(Math.random() * 999)}`,
          platform: (["SNES", "NES", "PS1", "DREAMCAST"] as const)[
            Math.floor(Math.random() * 4)
          ],
          store_credit_value: Math.round(Math.random() * 5000 * 100) / 100,
          status: Math.random() < 0.25 ? "FULFILLED" : "ACTIVE",
          base_market_price: Math.round(Math.random() * 2000 * 100) / 100,
        } as unknown as T;
      case "scoreboard":
        return {
          ...base,
          player_tag: `PLAYER_${Math.floor(Math.random() * 9999)}`,
          score: Math.floor(Math.random() * 9999999),
          game_title: (["PAC-MAN", "GALAGA", "DONKEY_KONG", "STREET_FIGHTER"] as const)[
            Math.floor(Math.random() * 4)
          ],
          cabinet_name: (["Cabinet A", "Cabinet B", "Cabinet C"] as const)[
            Math.floor(Math.random() * 3)
          ],
        } as unknown as T;
      case "faction_standings":
        return {
          ...base,
          faction: (["SEGA_SYNDICATE", "NINTENDO_NOMADS", "SONY_SENTINELS"] as const)[
            Math.floor(Math.random() * 3)
          ],
          total_points: Math.round(Math.random() * 1000 * 100) / 100 + 3000,
          month: 6,
          year: 2026,
        } as unknown as T;
      default:
        return {
          ...base,
          table,
          data: `Demo data for ${table}`,
          value: Math.random(),
        } as unknown as T;
    }
  }, [table]);

  // --- Demo mode simulation ---
  useEffect(() => {
    if (!demoMode || !demoSimulate) return;

    setStatus("connecting");
    const connectTimer = setTimeout(() => {
      if (mountedRef.current) setStatus("connected");
    }, 500);

    demoIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;

      // Random event type: 60% INSERT, 25% UPDATE, 15% DELETE
      const rand = Math.random();
      let eventType: RealtimeEvent;
      if (rand < 0.6) eventType = "INSERT";
      else if (rand < 0.85) eventType = "UPDATE";
      else eventType = "DELETE";

      const payload = getDemoPayload();

      // Add jitter to timing
      const jitter = (Math.random() - 0.5) * 2000;

      setTimeout(() => {
        if (mountedRef.current) {
          callbackRef.current(eventType, payload);
        }
      }, Math.max(0, jitter + 500));
    }, demoInterval);

    return () => {
      clearTimeout(connectTimer);
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, [demoMode, demoSimulate, demoInterval, getDemoPayload]);

  // --- Real Supabase subscription ---
  useEffect(() => {
    if (demoMode) return;

    let aborted = false;

    const connectRealtime = async () => {
      try {
        if (aborted) return;
        setStatus("connecting");

        // Dynamic import avoids SSR issues
        const { createClient } = await import("@supabase/supabase-js");

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn(
            "[useRealtime] No Supabase credentials found — subscription unavailable"
          );
          setStatus("disconnected");
          return;
        }

        if (aborted) return;

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const channel = supabase
          .channel(`realtime-${table}-${Date.now()}`)
          .on(
            "postgres_changes" as any,
            {
              event: "*",
              schema: "public",
              table,
              filter: filter || undefined,
            },
            (payload: any) => {
              if (!mountedRef.current) return;
              const eventType = payload.eventType.toUpperCase() as RealtimeEvent;
              callbackRef.current(eventType, payload.new as T);
            }
          )
          .subscribe((status: string) => {
            if (aborted) return;
            if (status === "SUBSCRIBED") {
              setStatus("connected");
              retryCountRef.current = 0;
              reconnectingRef.current = false;
            } else if (status === "CHANNEL_ERROR") {
              setStatus("error");
              scheduleReconnect();
            }
          });

        subscriptionRef.current = {
          unsubscribe: () => {
            supabase.removeChannel(channel);
          },
        };
      } catch (error) {
        if (!aborted) {
          console.error("[useRealtime] Connection error:", error);
          setStatus("error");
          scheduleReconnect();
        }
      }
    };

    const scheduleReconnect = () => {
      if (reconnectingRef.current || retryCountRef.current >= maxRetries) {
        setStatus("disconnected");
        return;
      }
      reconnectingRef.current = true;
      retryCountRef.current++;

      const delay = Math.min(
        1000 * Math.pow(2, retryCountRef.current),
        30000
      );

      setTimeout(() => {
        reconnectingRef.current = false;
        if (!aborted) connectRealtime();
      }, delay);
    };

    connectRealtime();

    return () => {
      aborted = true;
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [table, filter, demoMode]);

  return { status, isDemo: demoMode && demoSimulate };
}

// ============================================================================
// Domain-Specific Convenience Hooks
// ============================================================================

/**
 * Subscribe to activity feed events.
 * Dispatches a custom DOM event `guildos:activity` for the LiveTicker.
 */
export function useActivityFeed(onActivity?: (event: unknown) => void) {
  const demoMode = useGuildStore((s) => s.demoMode);

  const callback = useCallback(
    (_eventType: RealtimeEvent, payload: unknown) => {
      if (onActivity) onActivity(payload);

      // Dispatch DOM event for other components (LiveTicker)
      window.dispatchEvent(
        new CustomEvent("guildos:activity", { detail: payload })
      );
    },
    [onActivity]
  );

  return useRealtimeSubscription({
    table: "activity_feed",
    callback,
    demoSimulate: demoMode,
  });
}

/**
 * Subscribe to inventory real-time updates.
 */
export function useInventoryRealtime(
  onChange?: (data: { eventType: RealtimeEvent; payload: unknown }) => void
) {
  const demoMode = useGuildStore((s) => s.demoMode);

  const callback = useCallback(
    (eventType: RealtimeEvent, payload: unknown) => {
      if (onChange) onChange({ eventType, payload });
    },
    [onChange]
  );

  return useRealtimeSubscription({
    table: "inventory",
    callback,
    demoSimulate: demoMode,
    demoInterval: 12000,
  });
}

/**
 * Subscribe to bounty board real-time updates.
 */
export function useBountyRealtime(
  onChange?: (data: { eventType: RealtimeEvent; payload: unknown }) => void
) {
  const demoMode = useGuildStore((s) => s.demoMode);

  const callback = useCallback(
    (eventType: RealtimeEvent, payload: unknown) => {
      if (onChange) onChange({ eventType, payload });
    },
    [onChange]
  );

  return useRealtimeSubscription({
    table: "bounties",
    callback,
    demoSimulate: demoMode,
    demoInterval: 15000,
  });
}

/**
 * Subscribe to faction standings updates.
 */
export function useFactionRealtime(
  onChange?: (data: { eventType: RealtimeEvent; payload: unknown }) => void
) {
  const demoMode = useGuildStore((s) => s.demoMode);

  const callback = useCallback(
    (eventType: RealtimeEvent, payload: unknown) => {
      if (onChange) onChange({ eventType, payload });
    },
    [onChange]
  );

  return useRealtimeSubscription({
    table: "faction_standings",
    callback,
    demoSimulate: demoMode,
    demoInterval: 20000,
  });
}
