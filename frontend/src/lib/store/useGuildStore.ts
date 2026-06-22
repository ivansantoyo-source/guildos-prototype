import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Organization,
  Profile,
  InventoryItem,
  Bounty,
  NexusLfg,
  ScoreboardEntry,
  SaveRoom,
  FactionStanding,
  Notification,
  DashboardStats,
  ActivityEvent,
  ShopkeeperMessage,
} from '@/lib/types';

interface GuildState {
  // --- Auth & Tenant ---
  tenant: Organization | null;
  user: Profile | null;
  isAuthenticated: boolean;
  demoMode: boolean;

  // --- UI State ---
  sidebarCollapsed: boolean;
  activeModule: string;
  shopkeeperOpen: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;

  // --- Domain Data ---
  inventory: InventoryItem[];
  bounties: Bounty[];
  lfgLobbies: NexusLfg[];
  scoreboards: ScoreboardEntry[];
  saveRooms: SaveRoom[];
  factionStandings: FactionStanding[];
  notifications: Notification[];
  dashboardStats: DashboardStats;
  activityFeed: ActivityEvent[];
  shopkeeperMessages: ShopkeeperMessage[];

  // --- Actions: Auth ---
  setTenant: (tenant: Organization | null) => void;
  setUser: (user: Profile | null) => void;
  setDemoMode: (enabled: boolean) => void;
  logout: () => void;

  // --- Actions: UI ---
  toggleSidebar: () => void;
  setActiveModule: (module: string) => void;
  toggleShopkeeper: () => void;
  toggleSound: () => void;
  setReducedMotion: (enabled: boolean) => void;

  // --- Actions: Data ---
  setInventory: (items: InventoryItem[]) => void;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeInventoryItem: (id: string) => void;
  batchUpdateInventoryItems: (ids: string[], updates: Partial<InventoryItem>) => void;
  setBounties: (bounties: Bounty[]) => void;
  addBounty: (bounty: Bounty) => void;
  fulfillBounty: (id: string, fulfilled_by: string) => void;
  removeBounty: (id: string) => void;
  setLfgLobbies: (lobbies: NexusLfg[]) => void;
  addLfgLobby: (lobby: NexusLfg) => void;
  joinLobby: (id: string) => void;
  leaveLobby: (id: string) => void;
  setScoreboards: (scores: ScoreboardEntry[]) => void;
  addScoreEntry: (entry: ScoreboardEntry) => void;
  updateScoreEntry: (id: string, updates: Partial<ScoreboardEntry>) => void;
  setSaveRooms: (rooms: SaveRoom[]) => void;
  bookRoom: (id: string, subscriber_id: string, qr_hash: string) => void;
  releaseRoom: (id: string) => void;
  addSaveRoom: (room: SaveRoom) => void;
  setFactionStandings: (standings: FactionStanding[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setActivityFeed: (events: ActivityEvent[]) => void;
  addShopkeeperMessage: (message: ShopkeeperMessage) => void;
  clearShopkeeperMessages: () => void;
}

const defaultStats: DashboardStats = {
  goldFarmed: 0,
  legendaryDrops: 0,
  lootDepleted: 0,
  activeBounties: 0,
  priceSpikeAlerts: 0,
  activeLobbies: 0,
};

export const useGuildStore = create<GuildState>()(
  persist(
    (set) => ({
      // --- Initial State ---
      tenant: null,
      user: null,
      isAuthenticated: false,
      demoMode: true, // Start in demo mode by default
      sidebarCollapsed: false,
      activeModule: 'dashboard',
      shopkeeperOpen: false,
      soundEnabled: true,
      reducedMotion: false,
      inventory: [],
      bounties: [],
      lfgLobbies: [],
      scoreboards: [],
      saveRooms: [],
      factionStandings: [],
      notifications: [],
      dashboardStats: defaultStats,
      activityFeed: [],
      shopkeeperMessages: [],

      // --- Auth Actions ---
      setTenant: (tenant) => set({ tenant }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setDemoMode: (enabled) => set({ demoMode: enabled }),
      logout: () =>
        set({
          user: null,
          tenant: null,
          isAuthenticated: false,
          inventory: [],
          bounties: [],
          notifications: [],
          shopkeeperMessages: [],
        }),

      // --- UI Actions ---
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setActiveModule: (module) => set({ activeModule: module }),
      toggleShopkeeper: () =>
        set((state) => ({ shopkeeperOpen: !state.shopkeeperOpen })),
      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),

      // --- Data Actions ---
      setInventory: (items) => set({ inventory: items }),
      addInventoryItem: (item) =>
        set((state) => ({ inventory: [item, ...state.inventory] })),
      updateInventoryItem: (id, updates) =>
        set((state) => ({
          inventory: state.inventory.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      removeInventoryItem: (id) =>
        set((state) => ({
          inventory: state.inventory.filter((item) => item.id !== id),
        })),
      batchUpdateInventoryItems: (ids, updates) =>
        set((state) => ({
          inventory: state.inventory.map((item) =>
            ids.includes(item.id) ? { ...item, ...updates } : item
          ),
        })),
      setBounties: (bounties) => set({ bounties }),
      addBounty: (bounty) =>
        set((state) => ({ bounties: [bounty, ...state.bounties] })),
      fulfillBounty: (id, fulfilled_by) =>
        set((state) => ({
          bounties: state.bounties.map((b) =>
            b.id === id
              ? { ...b, status: 'FULFILLED' as const, fulfilled_by, fulfilled_at: new Date().toISOString() }
              : b
          ),
        })),
      removeBounty: (id) =>
        set((state) => ({
          bounties: state.bounties.filter((b) => b.id !== id),
        })),
      setLfgLobbies: (lobbies) => set({ lfgLobbies: lobbies }),
      addLfgLobby: (lobby) =>
        set((state) => ({ lfgLobbies: [lobby, ...state.lfgLobbies] })),
      joinLobby: (id) =>
        set((state) => ({
          lfgLobbies: state.lfgLobbies.map((l) =>
            l.id === id
              ? { ...l, player_slots_filled: Math.min(l.player_slots_filled + 1, l.player_slots_total) }
              : l
          ),
        })),
      leaveLobby: (id) =>
        set((state) => ({
          lfgLobbies: state.lfgLobbies.map((l) =>
            l.id === id
              ? { ...l, player_slots_filled: Math.max(l.player_slots_filled - 1, 0) }
              : l
          ),
        })),
      setScoreboards: (scores) => set({ scoreboards: scores }),
      addScoreEntry: (entry) =>
        set((state) => ({ scoreboards: [...state.scoreboards, entry] })),
      updateScoreEntry: (id, updates) =>
        set((state) => ({
          scoreboards: state.scoreboards.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      setSaveRooms: (rooms) => set({ saveRooms: rooms }),
      bookRoom: (id, subscriber_id, qr_hash) =>
        set((state) => ({
          saveRooms: state.saveRooms.map((r) =>
            r.id === id
              ? { ...r, status: 'RESERVED' as const, subscriber_id, qr_code_hash: qr_hash }
              : r
          ),
        })),
      releaseRoom: (id) =>
        set((state) => ({
          saveRooms: state.saveRooms.map((r) =>
            r.id === id
              ? { ...r, status: 'AVAILABLE' as const, subscriber_id: undefined, qr_code_hash: undefined }
              : r
          ),
        })),
      addSaveRoom: (room) =>
        set((state) => ({ saveRooms: [...state.saveRooms, room] })),
      setFactionStandings: (standings) => set({ factionStandings: standings }),
      setNotifications: (notifications) => set({ notifications }),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          ),
        })),
      setDashboardStats: (stats) => set({ dashboardStats: stats }),
      setActivityFeed: (events) => set({ activityFeed: events }),
      addShopkeeperMessage: (message) =>
        set((state) => ({
          shopkeeperMessages: [...state.shopkeeperMessages, message],
        })),
      clearShopkeeperMessages: () => set({ shopkeeperMessages: [] }),
    }),
    {
      name: 'guildos-store',
      partialize: (state) => ({
        demoMode: state.demoMode,
        sidebarCollapsed: state.sidebarCollapsed,
        activeModule: state.activeModule,
        soundEnabled: state.soundEnabled,
        reducedMotion: state.reducedMotion,
        shopkeeperMessages: state.shopkeeperMessages,
      }),
    }
  )
);
