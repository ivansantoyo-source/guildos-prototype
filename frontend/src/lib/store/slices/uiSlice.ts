import type { StateCreator } from 'zustand';
import type { GuildState } from '../storeTypes';

export interface UISlice {
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  activeModule: string;
  shopkeeperOpen: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
  toggleSidebar: () => void;
  setSidebarHidden: (hidden: boolean) => void;
  toggleSidebarHidden: () => void;
  setActiveModule: (module: string) => void;
  toggleShopkeeper: () => void;
  toggleSound: () => void;
  setReducedMotion: (enabled: boolean) => void;
}

export const createUISlice: StateCreator<GuildState, [], [], UISlice> = (set) => ({
  sidebarCollapsed: false,
  sidebarHidden: false,
  activeModule: 'dashboard',
  shopkeeperOpen: false,
  soundEnabled: true,
  reducedMotion: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed, sidebarHidden: false })),
  setSidebarHidden: (hidden) => set({ sidebarHidden: hidden }),
  toggleSidebarHidden: () => set((state) => ({ sidebarHidden: !state.sidebarHidden })),
  setActiveModule: (module) => set({ activeModule: module }),
  toggleShopkeeper: () => set((state) => ({ shopkeeperOpen: !state.shopkeeperOpen })),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
});
