import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Organization,
  Profile,
  InventoryItem,
  Bounty,
  NexusLfg,
  NexusLfgParticipant,
  ScoreboardEntry,
  SaveRoom,
  FactionStanding,
  Notification,
  DashboardStats,
  ActivityEvent,
  ShopkeeperMessage,
  ArbitrageMatch,
  BountyStats,
  Station,
  StationBooking,
  Wallet,
  WalletTransaction,
  VitalityQuest,
  VitalityCompletion,
  PotionMenuItem,
  PotionOrder,
  Cart,
  CartItem,
  Order,
  POSCartItem,
  POSSession,
  POSTransaction,
  AgentMessage,
  AgentSession,
  AIToolCall,
} from '@/lib/types';
import type { DebuffType } from '@/lib/vitality/stamina';

interface GuildState {
  // --- Auth & Tenant ---
  tenant: Organization | null;
  user: Profile | null;
  isAuthenticated: boolean;
  demoMode: boolean;

  // --- UI State ---
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  activeModule: string;
  shopkeeperOpen: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;

  // --- Domain Data ---
  inventory: InventoryItem[];
  bounties: Bounty[];
  arbitrageMatches: ArbitrageMatch[];
  bountyStats: BountyStats[];
  lfgLobbies: NexusLfg[];
  scoreboards: ScoreboardEntry[];
  saveRooms: SaveRoom[];
  factionStandings: FactionStanding[];
  notifications: Notification[];
  dashboardStats: DashboardStats;
  activityFeed: ActivityEvent[];
  shopkeeperMessages: ShopkeeperMessage[];

  // --- Stations (Live Tavern) ---
  stations: Station[];
  stationBookings: StationBooking[];

  // --- Wallets ---
  wallet: Wallet | null;
  walletTransactions: WalletTransaction[];

  // --- Stamina & Debuffs (Vitality Protocol) ---
  stamina: number;
  maxStamina: number;
  debuffType: DebuffType | null;
  debuffUntil: string | null;
  consecutiveHours: number;
  lastActivityAt: string | null;

  // --- Character Stats ---
  mindStat: number;
  bodyStat: number;
  soulStat: number;

  // --- XP (runtime tracking) ---
  xpEarnedThisSession: number;

  // --- Vitality Quests ---
  vitalityQuests: VitalityQuest[];
  vitalityCompletions: VitalityCompletion[];

  // --- Potions ---
  potionsMenu: PotionMenuItem[];
  potionOrders: PotionOrder[];
  potionCart: { item: PotionMenuItem; qty: number; toStation: boolean; stationName?: string }[];

  // --- Achievements ---
  unlockedAchievements: string[];

  // --- LFG Participants ---
  lfgParticipants: Record<string, NexusLfgParticipant[]>;

  // --- Customer Storefront ---
  cart: Cart | null;
  customerOrders: Order[];
  storefrontConfig: {
    store_name: string;
    tagline: string;
    enable_customer_chat: boolean;
    show_prices: boolean;
  } | null;

  // --- POS System ---
  posCart: POSCartItem[];
  posSession: POSSession | null;
  posTransactions: POSTransaction[];

  // --- Agentic AI ---
  agentSession: AgentSession | null;
  agentMessages: AgentMessage[];

  // --- Actions: Auth ---
  setTenant: (tenant: Organization | null) => void;
  setUser: (user: Profile | null) => void;
  setDemoMode: (enabled: boolean) => void;
  logout: () => void;

  // --- Actions: UI ---
  toggleSidebar: () => void;
  setSidebarHidden: (hidden: boolean) => void;
  toggleSidebarHidden: () => void;
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
  updateBounty: (id: string, updates: Partial<Bounty>) => void;
  claimBounty: (id: string, profileId: string, hunterTag: string) => void;
  updateFulfillmentStatus: (id: string, status: string) => void;
  addLimitOrder: (bounty: Bounty) => void;
  setArbitrageMatches: (matches: ArbitrageMatch[]) => void;
  setBountyStats: (stats: BountyStats[]) => void;
  updateLfgLobby: (id: string, updates: Partial<NexusLfg>) => void;
  applyStoreCredit: (amount: number) => { success: boolean; error?: string };
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
  addActivity: (event: ActivityEvent) => void;
  addShopkeeperMessage: (message: ShopkeeperMessage) => void;
  updateShopkeeperMessage: (id: string, updates: Partial<ShopkeeperMessage>) => void;
  clearShopkeeperMessages: () => void;

  // --- Actions: Stations ---
  setStations: (stations: Station[]) => void;
  addStation: (station: Station) => void;
  updateStation: (id: string, updates: Partial<Station>) => void;
  removeStation: (id: string) => void;
  setStationBookings: (bookings: StationBooking[]) => void;
  addStationBooking: (booking: StationBooking) => void;
  updateStationBooking: (id: string, updates: Partial<StationBooking>) => void;

  // --- Actions: Wallets ---
  setWallet: (wallet: Wallet | null) => void;
  setWalletTransactions: (transactions: WalletTransaction[]) => void;
  addWalletTransaction: (txn: WalletTransaction) => void;

  // --- Actions: Stamina & Debuffs ---
  setStamina: (stamina: number) => void;
  setDebuff: (type: DebuffType, until: string) => void;
  clearDebuff: () => void;

  // --- Actions: Character Stats ---
  setCharacterStats: (mind: number, body: number, soul: number) => void;

  // --- Actions: XP ---
  addXP: (amount: number, source: string) => void;

  // --- Actions: Vitality Quests ---
  setVitalityQuests: (quests: VitalityQuest[]) => void;
  addVitalityCompletion: (completion: VitalityCompletion) => void;

  // --- Actions: Potions ---
  setPotionsMenu: (items: PotionMenuItem[]) => void;
  addToPotionCart: (item: PotionMenuItem) => void;
  removeFromPotionCart: (itemId: string) => void;
  clearPotionCart: () => void;
  setPotionOrders: (orders: PotionOrder[]) => void;
  addPotionOrder: (order: PotionOrder) => void;

  // --- Actions: Achievements ---
  unlockAchievement: (id: string) => void;
  setUnlockedAchievements: (ids: string[]) => void;

  // --- Actions: LFG Participants ---
  setLfgParticipants: (lobbyId: string, participants: NexusLfgParticipant[]) => void;
  addLfgParticipant: (lobbyId: string, participant: NexusLfgParticipant) => void;
  removeLfgParticipant: (lobbyId: string, profileId: string) => void;

  // --- Actions: Customer Storefront ---
  setCart: (cart: Cart | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  applyDiscountToCart: (code: string, amount: number) => void;
  setCustomerOrders: (orders: Order[]) => void;
  addCustomerOrder: (order: Order) => void;
  updateCustomerOrder: (id: string, updates: Partial<Order>) => void;
  setStorefrontConfig: (config: { store_name: string; tagline: string; enable_customer_chat: boolean; show_prices: boolean } | null) => void;

  // --- Actions: POS ---
  addToPOSCart: (item: POSCartItem) => void;
  removeFromPOSCart: (itemId: string) => void;
  updatePOSCartItemQty: (itemId: string, qty: number) => void;
  clearPOSCart: () => void;
  setPOSSession: (session: POSSession | null) => void;
  closePOSSession: (endingCash: number, notes?: string) => void;
  addPOSTransaction: (transaction: POSTransaction) => void;

  // --- Actions: Agentic AI ---
  setAgentSession: (session: AgentSession | null) => void;
  addAgentMessage: (message: AgentMessage) => void;
  updateAgentMessage: (id: string, updates: Partial<AgentMessage>) => void;
  addAgentToolCall: (messageId: string, toolCall: AIToolCall) => void;
  updateAgentToolCall: (messageId: string, toolCallId: string, updates: Partial<AIToolCall>) => void;
  clearAgentSession: () => void;
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
      sidebarHidden: false,
      activeModule: 'dashboard',
      shopkeeperOpen: false,
      soundEnabled: true,
      reducedMotion: false,
      inventory: [],
      bounties: [],
      arbitrageMatches: [],
      bountyStats: [],
      lfgLobbies: [],
      scoreboards: [],
      saveRooms: [],
      factionStandings: [],
      notifications: [],
      dashboardStats: defaultStats,
      activityFeed: [],
      shopkeeperMessages: [],
      stations: [],
      stationBookings: [],
      wallet: null,
      walletTransactions: [],
      stamina: 100,
      maxStamina: 100,
      debuffType: null,
      debuffUntil: null,
      consecutiveHours: 0,
      lastActivityAt: null,
      mindStat: 5,
      bodyStat: 5,
      soulStat: 5,
      xpEarnedThisSession: 0,
      vitalityQuests: [],
      vitalityCompletions: [],
      potionsMenu: [],
      potionOrders: [],
      potionCart: [],
      unlockedAchievements: [],
      lfgParticipants: {},

      // --- Customer Storefront initial state ---
      cart: null,
      customerOrders: [],
      storefrontConfig: null,

      // --- POS initial state ---
      posCart: [],
      posSession: null,
      posTransactions: [],

      // --- Agentic AI initial state ---
      agentSession: null,
      agentMessages: [],

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
          arbitrageMatches: [],
          bountyStats: [],
          notifications: [],
          shopkeeperMessages: [],
          wallet: null,
          walletTransactions: [],
        }),

      // --- UI Actions ---
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed, sidebarHidden: false })),
      setSidebarHidden: (hidden) => set({ sidebarHidden: hidden }),
      toggleSidebarHidden: () =>
        set((state) => ({ sidebarHidden: !state.sidebarHidden })),
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
      updateBounty: (id, updates) =>
        set((state) => ({
          bounties: state.bounties.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),
      claimBounty: (id, profileId, hunterTag) =>
        set((state) => ({
          bounties: state.bounties.map((b) =>
            b.id === id
              ? {
                  ...b,
                  fulfillment_status: 'CLAIMED',
                  claimed_by: hunterTag,
                  fulfilled_by_profile: profileId,
                  claimed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
        })),
      updateFulfillmentStatus: (id, status) =>
        set((state) => ({
          bounties: state.bounties.map((b) =>
            b.id === id
              ? {
                  ...b,
                  fulfillment_status: status as any,
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
        })),
      addLimitOrder: (bounty) =>
        set((state) => ({
          bounties: [bounty, ...state.bounties],
        })),
      setArbitrageMatches: (matches) => set({ arbitrageMatches: matches }),
      setBountyStats: (stats) => set({ bountyStats: stats }),
      updateLfgLobby: (id, updates) =>
        set((state) => ({
          lfgLobbies: state.lfgLobbies.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),
      applyStoreCredit: (amount): { success: boolean; error?: string } => {
        const state = useGuildStore.getState();
        const wallet = state.wallet;

        if (!wallet) {
          return { success: false, error: "No wallet found" };
        }

        if (wallet.balance < amount) {
          return {
            success: false,
            error: `Insufficient balance. Have $${wallet.balance.toFixed(2)}, need $${amount.toFixed(2)}`,
          };
        }

        const now = new Date().toISOString();
        const transaction: WalletTransaction = {
          id: `wtxn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          wallet_id: wallet.id,
          profile_id: wallet.profile_id,
          type: "DEBIT_PURCHASE",
          amount,
          description: "Store credit purchase",
          reference_type: "store_credit",
          created_at: now,
        };

        set({
          wallet: {
            ...wallet,
            balance: Math.round((wallet.balance - amount) * 100) / 100,
            total_spent: Math.round((wallet.total_spent + amount) * 100) / 100,
            updated_at: now,
          },
          walletTransactions: [transaction, ...state.walletTransactions],
        });

        return { success: true };
      },
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
      addActivity: (event) =>
        set((state) => ({ activityFeed: [event, ...state.activityFeed] })),
      addShopkeeperMessage: (message) =>
        set((state) => ({
          shopkeeperMessages: [...state.shopkeeperMessages, message],
        })),
      updateShopkeeperMessage: (id, updates) =>
        set((state) => ({
          shopkeeperMessages: state.shopkeeperMessages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      clearShopkeeperMessages: () => set({ shopkeeperMessages: [] }),

      // --- Station Actions ---
      setStations: (stations) => set({ stations }),
      addStation: (station) =>
        set((state) => ({ stations: [...state.stations, station] })),
      updateStation: (id, updates) =>
        set((state) => ({
          stations: state.stations.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      removeStation: (id) =>
        set((state) => ({
          stations: state.stations.filter((s) => s.id !== id),
        })),
      setStationBookings: (bookings) => set({ stationBookings: bookings }),
      addStationBooking: (booking) =>
        set((state) => ({
          stationBookings: [...state.stationBookings, booking],
        })),
      updateStationBooking: (id, updates) =>
        set((state) => ({
          stationBookings: state.stationBookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      // --- Wallet Actions ---
      setWallet: (wallet) => set({ wallet }),
      setWalletTransactions: (transactions) =>
        set({ walletTransactions: transactions }),
      addWalletTransaction: (txn) =>
        set((state) => ({
          walletTransactions: [txn, ...state.walletTransactions],
        })),

      // --- Stamina Actions ---
      setStamina: (stamina) => set({ stamina }),
      setDebuff: (type, until) =>
        set({ debuffType: type, debuffUntil: until }),
      clearDebuff: () => set({ debuffType: null, debuffUntil: null }),

      // --- Character Stats Actions ---
      setCharacterStats: (mind, body, soul) =>
        set({ mindStat: mind, bodyStat: body, soulStat: soul }),

      // --- XP Actions ---
      addXP: (amount, _source) =>
        set((state) => ({
          xpEarnedThisSession: state.xpEarnedThisSession + amount,
        })),

      // --- Vitality Quest Actions ---
      setVitalityQuests: (quests) => set({ vitalityQuests: quests }),
      addVitalityCompletion: (completion) =>
        set((state) => ({
          vitalityCompletions: [...state.vitalityCompletions, completion],
        })),

      // --- Potion Actions ---
      setPotionsMenu: (items) => set({ potionsMenu: items }),
      addToPotionCart: (item) =>
        set((state) => {
          const existing = state.potionCart.find(
            (c) => c.item.id === item.id
          );
          if (existing) {
            return {
              potionCart: state.potionCart.map((c) =>
                c.item.id === item.id
                  ? { ...c, qty: c.qty + 1 }
                  : c
              ),
            };
          }
          return {
            potionCart: [
              ...state.potionCart,
              {
                item,
                qty: 1,
                toStation: false,
              },
            ],
          };
        }),
      removeFromPotionCart: (itemId) =>
        set((state) => ({
          potionCart: state.potionCart.filter(
            (c) => c.item.id !== itemId
          ),
        })),
      clearPotionCart: () => set({ potionCart: [] }),
      setPotionOrders: (orders) => set({ potionOrders: orders }),
      addPotionOrder: (order) =>
        set((state) => ({
          potionOrders: [...state.potionOrders, order],
        })),

      // --- Achievement Actions ---
      unlockAchievement: (id) =>
        set((state) => ({
          unlockedAchievements: state.unlockedAchievements.includes(id)
            ? state.unlockedAchievements
            : [...state.unlockedAchievements, id],
        })),
      setUnlockedAchievements: (ids) =>
        set({ unlockedAchievements: ids }),

      // --- LFG Participant Actions ---
      setLfgParticipants: (lobbyId, participants) =>
        set((state) => ({
          lfgParticipants: {
            ...state.lfgParticipants,
            [lobbyId]: participants,
          },
        })),
      addLfgParticipant: (lobbyId, participant) =>
        set((state) => ({
          lfgParticipants: {
            ...state.lfgParticipants,
            [lobbyId]: [
              ...(state.lfgParticipants[lobbyId] || []),
              participant,
            ],
          },
        })),
      removeLfgParticipant: (lobbyId, profileId) =>
        set((state) => ({
          lfgParticipants: {
            ...state.lfgParticipants,
            [lobbyId]: (
              state.lfgParticipants[lobbyId] || []
            ).filter((p) => p.profile_id !== profileId),
          },
        })),

      // --- Customer Storefront Actions ---
      setCart: (cart) => set({ cart }),
      addToCart: (item) =>
        set((state) => {
          const existingCart = state.cart;
          if (!existingCart) {
            const newCart: Cart = {
              id: `cart-${Date.now()}`,
              organization_id: state.tenant?.id ?? 'demo-time-warp-001',
              profile_id: state.user?.id,
              items: [item],
              subtotal: item.price * item.quantity,
              discount_amount: 0,
              total: item.price * item.quantity,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            return { cart: newCart };
          }
          const existingIdx = existingCart.items.findIndex(
            (i) => i.inventory_id === item.inventory_id
          );
          let newItems: CartItem[];
          if (existingIdx >= 0) {
            newItems = existingCart.items.map((i, idx) =>
              idx === existingIdx
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            newItems = [...existingCart.items, item];
          }
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const total = Math.max(0, subtotal - existingCart.discount_amount);
          return {
            cart: {
              ...existingCart,
              items: newItems,
              subtotal: Math.round(subtotal * 100) / 100,
              total: Math.round(total * 100) / 100,
              updated_at: new Date().toISOString(),
            },
          };
        }),
      removeFromCart: (itemId) =>
        set((state) => {
          if (!state.cart) return { cart: null };
          const newItems = state.cart.items.filter((i) => i.id !== itemId);
          if (newItems.length === 0) return { cart: null };
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const total = Math.max(0, subtotal - state.cart.discount_amount);
          return {
            cart: {
              ...state.cart,
              items: newItems,
              subtotal: Math.round(subtotal * 100) / 100,
              total: Math.round(total * 100) / 100,
              updated_at: new Date().toISOString(),
            },
          };
        }),
      updateCartItemQty: (itemId, qty) =>
        set((state) => {
          if (!state.cart) return state;
          if (qty <= 0) {
            const newItems = state.cart.items.filter((i) => i.id !== itemId);
            if (newItems.length === 0) return { cart: null };
            const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            return {
              cart: {
                ...state.cart,
                items: newItems,
                subtotal: Math.round(subtotal * 100) / 100,
                total: Math.round(Math.max(0, subtotal - state.cart.discount_amount) * 100) / 100,
                updated_at: new Date().toISOString(),
              },
            };
          }
          const newItems = state.cart.items.map((i) =>
            i.id === itemId ? { ...i, quantity: qty } : i
          );
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return {
            cart: {
              ...state.cart,
              items: newItems,
              subtotal: Math.round(subtotal * 100) / 100,
              total: Math.round(Math.max(0, subtotal - state.cart.discount_amount) * 100) / 100,
              updated_at: new Date().toISOString(),
            },
          };
        }),
      clearCart: () => set({ cart: null }),
      applyDiscountToCart: (code, amount) =>
        set((state) => {
          if (!state.cart) return state;
          const total = Math.max(0, state.cart.subtotal - amount);
          return {
            cart: {
              ...state.cart,
              discount_code: code,
              discount_amount: amount,
              total: Math.round(total * 100) / 100,
              updated_at: new Date().toISOString(),
            },
          };
        }),
      setCustomerOrders: (orders) => set({ customerOrders: orders }),
      addCustomerOrder: (order) =>
        set((state) => ({ customerOrders: [order, ...state.customerOrders] })),
      updateCustomerOrder: (id, updates) =>
        set((state) => ({
          customerOrders: state.customerOrders.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),
      setStorefrontConfig: (config) => set({ storefrontConfig: config }),

      // --- POS Actions ---
      addToPOSCart: (item) =>
        set((state) => {
          const existing = state.posCart.find((i) => i.inventory_id === item.inventory_id);
          if (existing) {
            return {
              posCart: state.posCart.map((i) =>
                i.inventory_id === item.inventory_id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { posCart: [...state.posCart, item] };
        }),
      removeFromPOSCart: (itemId) =>
        set((state) => ({
          posCart: state.posCart.filter((i) => i.id !== itemId),
        })),
      updatePOSCartItemQty: (itemId, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { posCart: state.posCart.filter((i) => i.id !== itemId) };
          }
          return {
            posCart: state.posCart.map((i) =>
              i.id === itemId ? { ...i, quantity: qty } : i
            ),
          };
        }),
      clearPOSCart: () => set({ posCart: [] }),
      setPOSSession: (session) => set({ posSession: session }),
      closePOSSession: (endingCash, notes) =>
        set((state) => {
          if (!state.posSession) return state;
          const now = new Date().toISOString();
          return {
            posSession: {
              ...state.posSession,
              closed_at: now,
              ending_cash: endingCash,
              status: 'CLOSED' as const,
              notes,
            },
          };
        }),
      addPOSTransaction: (transaction) =>
        set((state) => ({
          posTransactions: [transaction, ...state.posTransactions],
          posCart: [],
        })),

      // --- Agentic AI Actions ---
      setAgentSession: (session) => set({ agentSession: session }),
      addAgentMessage: (message) =>
        set((state) => ({
          agentMessages: [...state.agentMessages, message],
        })),
      updateAgentMessage: (id, updates) =>
        set((state) => ({
          agentMessages: state.agentMessages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      addAgentToolCall: (messageId, toolCall) =>
        set((state) => ({
          agentMessages: state.agentMessages.map((m) =>
            m.id === messageId
              ? { ...m, tool_calls: [...(m.tool_calls || []), toolCall] }
              : m
          ),
        })),
      updateAgentToolCall: (messageId, toolCallId, updates) =>
        set((state) => ({
          agentMessages: state.agentMessages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  tool_calls: (m.tool_calls || []).map((tc) =>
                    tc.id === toolCallId ? { ...tc, ...updates } : tc
                  ),
                }
              : m
          ),
        })),
      clearAgentSession: () => set({ agentSession: null, agentMessages: [] }),
    }),
    {
      name: 'guildos-store',
      partialize: (state) => ({
        demoMode: state.demoMode,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarHidden: state.sidebarHidden,
        activeModule: state.activeModule,
        soundEnabled: state.soundEnabled,
        reducedMotion: state.reducedMotion,
        shopkeeperMessages: state.shopkeeperMessages,
        stamina: state.stamina,
        unlockedAchievements: state.unlockedAchievements,
        vitalityCompletions: state.vitalityCompletions,
      }),
    }
  )
);
