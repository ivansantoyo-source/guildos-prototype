import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GuildState } from './storeTypes';

// Import all slice creators
import { createAuthSlice } from './slices/authSlice';
import { createUISlice } from './slices/uiSlice';
import { createInventorySlice } from './slices/inventorySlice';
import { createBountySlice } from './slices/bountySlice';
import { createNexusSlice } from './slices/nexusSlice';
import { createNotificationSlice } from './slices/notificationSlice';
import { createDashboardSlice } from './slices/dashboardSlice';
import { createShopkeeperSlice } from './slices/shopkeeperSlice';
import { createStationSlice } from './slices/stationSlice';
import { createWalletSlice } from './slices/walletSlice';
import { createVitalitySlice } from './slices/vitalitySlice';
import { createPotionSlice } from './slices/potionSlice';
import { createAchievementSlice } from './slices/achievementSlice';
import { createCustomerStorefrontSlice } from './slices/customerStorefrontSlice';
import { createPOSSlice } from './slices/posSlice';
import { createAgentSlice } from './slices/agentSlice';

/**
 * Composed Zustand store built from domain-specific slices.
 *
 * All 16 slices are composed into a single store with persist middleware.
 * Components can import from this combined store or from individual slice
 * files for tree-shaking benefits.
 *
 * Persisted fields: demo mode, UI preferences, shopkeeper messages, stamina, achievements.
 */
export const useGuildStore = create<GuildState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createUISlice(...a),
      ...createInventorySlice(...a),
      ...createBountySlice(...a),
      ...createNexusSlice(...a),
      ...createNotificationSlice(...a),
      ...createDashboardSlice(...a),
      ...createShopkeeperSlice(...a),
      ...createStationSlice(...a),
      ...createWalletSlice(...a),
      ...createVitalitySlice(...a),
      ...createPotionSlice(...a),
      ...createAchievementSlice(...a),
      ...createCustomerStorefrontSlice(...a),
      ...createPOSSlice(...a),
      ...createAgentSlice(...a),
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

export type { GuildState } from './storeTypes';
