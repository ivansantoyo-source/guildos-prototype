import type { StateCreator } from 'zustand';
import type { ShopkeeperMessage } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface ShopkeeperSlice {
  shopkeeperMessages: ShopkeeperMessage[];
  addShopkeeperMessage: (message: ShopkeeperMessage) => void;
  updateShopkeeperMessage: (id: string, updates: Partial<ShopkeeperMessage>) => void;
  clearShopkeeperMessages: () => void;
}

export const createShopkeeperSlice: StateCreator<GuildState, [], [], ShopkeeperSlice> = (set) => ({
  shopkeeperMessages: [],

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
});
