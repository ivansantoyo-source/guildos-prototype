"use client";

import { useCallback, useEffect } from "react";
import {
  useActivityFeed,
  useInventoryRealtime,
  useBountyRealtime,
  useFactionRealtime,
  useBountyStatsRealtime,
  useLfgRealtime,
  useLfgParticipantsRealtime,
} from "@/lib/hooks/useRealtime";
import { useGuildStore } from "@/lib/store/useGuildStore";

// ============================================================================
// RealtimeProvider — Routes between production subscriptions and demo
// ============================================================================

/**
 * RealtimeProvider wires Supabase Realtime subscriptions to the Zustand store.
 *
 * In demo mode, uses a SINGLE unified ticker (~8.5s) that replaces 7 concurrent
 * independent intervals with a coordinated batch, preventing UI jank on
 * entry-level devices.  It only simulates events for tables the current page
 * actually views, and checks navigator.hardwareConcurrency to skip simulation
 * on devices with fewer than 4 cores.
 *
 * Production mode: live Supabase Realtime channels into the store.
 *
 * Silent catch: if Supabase Realtime isn't enabled on the project yet, the
 * hooks log a warning and set status to "disconnected" — no crashes.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const demoMode = useGuildStore((s) => s.demoMode);

  if (demoMode) {
    return <DemoRealtimeProvider>{children}</DemoRealtimeProvider>;
  }

  return <RealtimeSubscriber>{children}</RealtimeSubscriber>;
}

// ============================================================================
// DemoRealtimeProvider — Unified ticker replaces 7 concurrent intervals
// ============================================================================

/** Skip demo simulation on devices with fewer than this many logical cores. */
const MIN_CORES = 4;

/** Single unified tick interval for demo event generation. */
const TICKER_MS = 8500;

/** Stagger (ms) between table events within one tick to avoid store thundering herd. */
const STAGGER_MS = 80;

type DemoTable =
  | "activity"
  | "inventory"
  | "bounties"
  | "faction_standings"
  | "bounty_stats"
  | "nexus_lfgs"
  | "nexus_lfg_participants";

const PAGE_TABLE_MAP: Record<string, DemoTable[]> = {
  "/dashboard":    ["activity", "inventory", "bounties", "faction_standings", "nexus_lfgs"],
  "/inventory":    ["inventory", "activity"],
  "/bounty-board": ["bounties", "bounty_stats", "activity"],
  "/nexus":        ["nexus_lfgs", "nexus_lfg_participants", "activity"],
  "/shopkeeper":   ["activity"],
  "/analytics":    ["inventory", "bounties", "faction_standings", "activity"],
  "/pos":          ["inventory", "activity"],
  "/potions":      ["activity"],
  "/profile":      ["activity"],
  "/settings":     [],
  "/agent":        [],
};

const DEFAULT_TABLES: DemoTable[] = ["activity"];

/** Return the tables relevant to the given URL pathname. */
function tablesForPage(pathname: string): DemoTable[] {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const [pattern, tables] of Object.entries(PAGE_TABLE_MAP)) {
    if (clean === pattern || clean.endsWith(pattern)) return tables;
  }
  // Fallback: match by last path segment
  const segments = clean.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const key = `/${segments[i]}`;
    const hit = PAGE_TABLE_MAP[key];
    if (hit) return hit;
  }
  return DEFAULT_TABLES;
}

/** Deterministic-looking demo ID — no crypto dependency. */
function demoId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Generate and dispatch a single demo event for `table` using current store state. */
function fireDemoEvent(table: DemoTable): void {
  const store = useGuildStore.getState();
  const ts = new Date();
  const base = {
    id: demoId(),
    created_at: ts.toISOString(),
    updated_at: ts.toISOString(),
  };
  const eventRoll = Math.random(); // 60-25-15 split

  switch (table) {
    case "activity": {
      store.addActivity({
        ...base,
        type: (["SCAN", "SALE", "BOUNTY", "SCORE", "TRADE_IN", "GRAIL"] as const)[
          Math.floor(Math.random() * 6)
        ],
        title: "Demo Activity",
        description: `Simulated at ${ts.toLocaleTimeString()}`,
        value: Math.round(Math.random() * 500 * 100) / 100,
        timestamp: ts.toISOString(),
      });
      break;
    }
    case "inventory": {
      if (eventRoll < 0.6) {
        store.addInventoryItem({
          ...base,
          organization_id: "demo-org-001",
          item_name: `Demo Item #${Math.floor(Math.random() * 999)}`,
          platform: (["SNES", "NES", "GENESIS", "PS1", "N64", "SATURN"] as const)[
            Math.floor(Math.random() * 6)
          ],
          condition: (["CIB", "LOOSE", "NEW", "SCRAP"] as const)[
            Math.floor(Math.random() * 4)
          ],
          market_value: Math.round(Math.random() * 800 * 100) / 100,
          scrap_value: Math.round(Math.random() * 50 * 100) / 100,
          stock_count: Math.floor(Math.random() * 3) + 1,
          is_legendary: Math.random() < 0.12,
          price_spike_flag: false,
          tags: [],
          status: "ACTIVE",
        } as never);
      } else if (eventRoll < 0.85) {
        store.updateInventoryItem(base.id, {
          market_value: Math.round(Math.random() * 800 * 100) / 100,
          stock_count: Math.floor(Math.random() * 3) + 1,
        } as never);
      } else {
        store.removeInventoryItem(base.id);
      }
      break;
    }
    case "bounties": {
      if (eventRoll < 0.6) {
        store.addBounty({
          ...base,
          organization_id: "demo-org-001",
          target_item_name: `Bounty Target #${Math.floor(Math.random() * 999)}`,
          platform: (["SNES", "NES", "PS1", "DREAMCAST"] as const)[
            Math.floor(Math.random() * 4)
          ],
          base_market_price: Math.round(Math.random() * 2000 * 100) / 100,
          scarcity_mult: Math.random() * 3 + 1,
          store_credit_value: Math.round(Math.random() * 5000 * 100) / 100,
          status: "ACTIVE",
        } as never);
      } else if (eventRoll < 0.85) {
        store.updateBounty(base.id, {
          store_credit_value: Math.round(Math.random() * 5000 * 100) / 100,
          status: Math.random() < 0.25 ? "FULFILLED" : "ACTIVE",
        } as never);
      } else {
        store.removeBounty(base.id);
      }
      break;
    }
    case "faction_standings": {
      const factionNames = ["SEGA_SYNDICATE", "NINTENDO_NOMADS", "SONY_SENTINELS"] as const;
      const current = store.factionStandings;
      const record = {
        ...base,
        organization_id: "demo-org-001",
        faction: factionNames[Math.floor(Math.random() * 3)],
        total_points: Math.round(Math.random() * 1000 * 100) / 100 + 3000,
        is_winner: false,
        discount_active: false,
        month: 6,
        year: 2026,
      };
      const idx = current.findIndex((fs: any) => fs.id === record.id);
      if (idx >= 0) {
        const updated = [...current];
        updated[idx] = { ...updated[idx], ...record };
        store.setFactionStandings(updated as never);
      } else {
        store.setFactionStandings([...current, record] as never);
      }
      break;
    }
    case "bounty_stats": {
      const currentBs = store.bountyStats;
      const record = {
        ...base,
        organization_id: "demo-org-001",
        profile_id: `usr-demo-${Math.floor(Math.random() * 5) + 1}`,
        hunter_tag: `HUNTER_${Math.floor(Math.random() * 9999)}`,
        total_fulfilled: Math.floor(Math.random() * 50),
        total_earned: Math.round(Math.random() * 5000 * 100) / 100,
        current_claims: Math.floor(Math.random() * 3),
        reputation_score: Math.round(Math.random() * 1000 * 100) / 100,
      };
      const idx = currentBs.findIndex((bs: any) => bs.id === record.id);
      if (idx >= 0) {
        const updated = [...currentBs];
        updated[idx] = { ...updated[idx], ...record };
        store.setBountyStats(updated as never);
      } else {
        store.setBountyStats([...currentBs, record] as never);
      }
      break;
    }
    case "nexus_lfgs": {
      if (eventRoll < 0.6) {
        store.addLfgLobby({
          ...base,
          organization_id: "demo-time-warp-001",
          creator_id: "usr-001",
          game_title: (["GoldenEye 007", "Super Smash Bros.", "Street Fighter III", "Mario Kart 64", "Tekken 3"] as const)[
            Math.floor(Math.random() * 5)
          ],
          description: "Demo lobby -- all skill levels welcome!",
          console_type: (["N64", "GAMECUBE", "DREAMCAST", "PS1"] as const)[
            Math.floor(Math.random() * 4)
          ],
          player_slots_total: 4,
          player_slots_filled: Math.floor(Math.random() * 3) + 1,
          max_spectators: 4,
          lobby_status: Math.random() < 0.3 ? "IN_PROGRESS" : "OPEN",
          start_time: new Date(Date.now() + Math.random() * 86400000).toISOString(),
        });
      } else {
        store.updateLfgLobby(base.id, {
          player_slots_filled: Math.floor(Math.random() * 3) + 1,
          lobby_status: Math.random() < 0.3 ? "IN_PROGRESS" : "OPEN",
        } as never);
      }
      break;
    }
    case "nexus_lfg_participants": {
      const lobbyId = `lfg-demo-${Math.floor(Math.random() * 3) + 1}`;
      if (eventRoll < 0.6) {
        store.addLfgParticipant(lobbyId, {
          ...base,
          lobby_id: lobbyId,
          profile_id: `usr-demo-${Math.floor(Math.random() * 5) + 1}`,
          profile_tag: (["TRON_99", "PIXEL_QUEEN", "NEO_GEO", "ARCADE_FURY", "LOOT_GOBLIN"] as const)[
            Math.floor(Math.random() * 5)
          ],
          status: "JOINED",
          joined_at: ts.toISOString(),
        });
      } else {
        store.removeLfgParticipant(
          lobbyId,
          `usr-demo-${Math.floor(Math.random() * 5) + 1}`,
        );
      }
      break;
    }
  }
}

/** Demo mode: single unified ticker, hardware-concurrency check, page-aware tables. */
function DemoRealtimeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1) Hardware concurrency check — skip simulation entirely on low-end devices
    if (
      typeof navigator !== "undefined" &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency < MIN_CORES
    ) {
      console.log(
        `[DemoRealtime] Skipping simulation on low-end device (${navigator.hardwareConcurrency} cores)`,
      );
      return;
    }

    // 2) Page-aware table selection — only simulate tables the current page views
    const activeTables = tablesForPage(
      typeof window !== "undefined" ? window.location.pathname : "",
    );
    if (activeTables.length === 0) return;

    // 3) Single unified ticker — coordinated batch every ~8.5s
    const ticker = setInterval(() => {
      activeTables.forEach((table, index) => {
        setTimeout(() => {
          fireDemoEvent(table);
        }, index * STAGGER_MS);
      });
    }, TICKER_MS);

    return () => clearInterval(ticker);
  }, []); // mount once; never re-run

  return <>{children}</>;
}

// ============================================================================
// RealtimeSubscriber — Production Supabase Realtime subscriptions (unchanged)
// ============================================================================

function RealtimeSubscriber({ children }: { children: React.ReactNode }) {
  const addActivity = useGuildStore((s) => s.addActivity);
  const addInventoryItem = useGuildStore((s) => s.addInventoryItem);
  const updateInventoryItem = useGuildStore((s) => s.updateInventoryItem);
  const removeInventoryItem = useGuildStore((s) => s.removeInventoryItem);
  const addBounty = useGuildStore((s) => s.addBounty);
  const updateBounty = useGuildStore((s) => s.updateBounty);
  const removeBounty = useGuildStore((s) => s.removeBounty);
  const setFactionStandings = useGuildStore((s) => s.setFactionStandings);
  const setBountyStats = useGuildStore((s) => s.setBountyStats);
  const addLfgLobby = useGuildStore((s) => s.addLfgLobby);
  const updateLfgLobby = useGuildStore((s) => s.updateLfgLobby);
  const addLfgParticipant = useGuildStore((s) => s.addLfgParticipant);
  const removeLfgParticipant = useGuildStore((s) => s.removeLfgParticipant);

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

  // --- Bounty Stats (Leaderboard) ---
  useBountyStatsRealtime(
    useCallback(
      (change: { eventType: string; payload: unknown }) => {
        if (change.eventType === "INSERT" || change.eventType === "UPDATE") {
          const record = change.payload as Record<string, unknown>;
          const current = useGuildStore.getState().bountyStats;
          const idx = current.findIndex((bs) => bs.id === record.id);
          if (idx >= 0) {
            const updated = [...current];
            updated[idx] = { ...updated[idx], ...record } as never;
            setBountyStats(updated);
          } else {
            setBountyStats([...current, record] as never);
          }
        }
      },
      [setBountyStats],
    ),
  );

  // --- LFG Lobbies ---
  useLfgRealtime(
    useCallback(
      (change: { eventType: string; payload: unknown }) => {
        const record = change.payload as Record<string, unknown>;
        const id = String(record.id ?? "");
        switch (change.eventType) {
          case "INSERT":
            addLfgLobby(record as never);
            break;
          case "UPDATE":
            updateLfgLobby(id, record as never);
            break;
          case "DELETE":
            // Remove lobby by joining the store state — no dedicated remove action needed
            // The store filters out deleted ones during sync
            break;
        }
      },
      [addLfgLobby, updateLfgLobby],
    ),
  );

  // --- LFG Participants ---
  useLfgParticipantsRealtime(
    useGuildStore.getState().lfgLobbies[0]?.id ?? "",
    useCallback(
      (change: { eventType: string; payload: unknown }) => {
        const record = change.payload as Record<string, unknown>;
        const lobbyId = String(record.lobby_id ?? "");
        switch (change.eventType) {
          case "INSERT":
            addLfgParticipant(lobbyId, record as never);
            break;
          case "DELETE":
            removeLfgParticipant(lobbyId, String(record.profile_id ?? ""));
            break;
        }
      },
      [addLfgParticipant, removeLfgParticipant],
    ),
  );

  return <>{children}</>;
}
