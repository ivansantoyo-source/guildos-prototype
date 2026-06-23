import type { StateCreator } from 'zustand';
import type { Organization, Profile } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface AuthSlice {
  tenant: Organization | null;
  user: Profile | null;
  isAuthenticated: boolean;
  demoMode: boolean;
  setTenant: (tenant: Organization | null) => void;
  setUser: (user: Profile | null) => void;
  setDemoMode: (enabled: boolean) => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<GuildState, [], [], AuthSlice> = (set) => ({
  tenant: null,
  user: null,
  isAuthenticated: false,
  demoMode: true,

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
});
