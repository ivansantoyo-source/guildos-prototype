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

  // --- Actions: Data ---
  setInventory: (items: InventoryItem[]) => void;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  setBounties: (bounties: Bounty[]) => void;
  setLfgLobbies: (lobbies: NexusLfg[]) => void;
  setScoreboards: (scores: ScoreboardEntry[]) => void;
  setSaveRooms: (rooms: SaveRoom[]) => void;
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
      setBounties: (bounties) => set({ bounties }),
      setLfgLobbies: (lobbies) => set({ lfgLobbies: lobbies }),
      setScoreboards: (scores) => set({ scoreboards: scores }),
      setSaveRooms: (rooms) => set({ saveRooms: rooms }),
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
      }),
    }
  )
);
