"use client";

import { useCallback } from "react";
import {
  useActivityFeed,
  useInventoryRealtime,
  useBountyRealtime,
  useFactionRealtime,
} from "@/lib/hooks/useRealtime";
import { useGuildStore } from "@/lib/store/useGuildStore";

/**
 * RealtimeProvider wires Supabase Realtime subscriptions to the Zustand store.
 *
 * In demo mode (store.demoMode === true), this is a no-op — phantom data is
 * loaded by the merchant layout's useEffect and the hooks simulate their own
 * demo events if demoSimulate is enabled. Production data flows from live
 * Supabase Realtime channels into the store automatically.
 *
 * Silent catch: if Supabase Realtime isn't enabled on the project yet, the
 * hooks log a warning and set status to "disconnected" — no crashes.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const demoMode = useGuildStore((s) => s.demoMode);

  // Demo mode keeps using phantom data — skip live subscriptions entirely
  if (demoMode) return <>{children}</>;

  return <RealtimeSubscriber>{children}</RealtimeSubscriber>;
}

function RealtimeSubscriber({ children }: { children: React.ReactNode }) {
  const addActivity = useGuildStore((s) => s.addActivity);
  const addInventoryItem = useGuildStore((s) => s.addInventoryItem);
  const updateInventoryItem = useGuildStore((s) => s.updateInventoryItem);
  const removeInventoryItem = useGuildStore((s) => s.removeInventoryItem);
  const addBounty = useGuildStore((s) => s.addBounty);
  const updateBounty = useGuildStore((s) => s.updateBounty);
  const removeBounty = useGuildStore((s) => s.removeBounty);
  const setFactionStandings = useGuildStore((s) => s.setFactionStandings);

  // --- Activity Feed ---
  useActivityFeed(
    useCallback(
      (event: unknown) => {
        addActivity(event as never);
      },
      [addActivity],
    ),
  );

  // --- Inventory ---
  useInventoryRealtime(
    useCallback(
      (change: { eventType: string; payload: unknown }) => {
        const record = change.payload as Record<string, unknown>;
        const id = String(record.id ?? "");
        switch (change.eventType) {
          case "INSERT":
            addInventoryItem(record as never);
            break;
          case "UPDATE":
            updateInventoryItem(id, record as never);
            break;
          case "DELETE":
            removeInventoryItem(record.id as string);
            break;
        }
      },
      [addInventoryItem, updateInventoryItem, removeInventoryItem],
    ),
  );

  // --- Bounties ---
  useBountyRealtime(
    useCallback(
      (change: { eventType: string; payload: unknown }) => {
        const record = change.payload as Record<string, unknown>;
        const id = String(record.id ?? "");
        switch (change.eventType) {
          case "INSERT":
            addBounty(record as never);
            break;
          case "UPDATE":
            updateBounty(id, record as never);
            break;
          case "DELETE":
            removeBounty(record.id as string);
            break;
        }
      },
      [addBounty, updateBounty, removeBounty],
    ),
  );

  // --- Faction Standings ---
  // Realtime delivers individual rows; merge into the existing array.
  useFactionRealtime(
    useCallback(
      (change: { eventType: string; payload: unknown }) => {
        if (change.eventType === "INSERT" || change.eventType === "UPDATE") {
          const record = change.payload as Record<string, unknown>;
          const current = useGuildStore.getState().factionStandings;
          const idx = current.findIndex((fs) => fs.id === record.id);
          if (idx >= 0) {
            const updated = [...current];
            updated[idx] = { ...updated[idx], ...record } as never;
            setFactionStandings(updated);
          } else {
            setFactionStandings([...current, record] as never);
          }
        }
      },
      [setFactionStandings],
    ),
  );

  return <>{children}</>;
}
