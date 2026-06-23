import type { StateCreator } from 'zustand';
import type { InventoryItem } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface InventorySlice {
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeInventoryItem: (id: string) => void;
  batchUpdateInventoryItems: (ids: string[], updates: Partial<InventoryItem>) => void;
}

export const createInventorySlice: StateCreator<GuildState, [], [], InventorySlice> = (set) => ({
  inventory: [],

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
});
