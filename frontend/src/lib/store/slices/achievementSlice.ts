import type { StateCreator } from 'zustand';
import type { GuildState } from '../storeTypes';

export interface AchievementSlice {
  unlockedAchievements: string[];
  unlockAchievement: (id: string) => void;
  setUnlockedAchievements: (ids: string[]) => void;
}

export const createAchievementSlice: StateCreator<GuildState, [], [], AchievementSlice> = (set) => ({
  unlockedAchievements: [],

  unlockAchievement: (id) =>
    set((state) => ({
      unlockedAchievements: state.unlockedAchievements.includes(id)
        ? state.unlockedAchievements
        : [...state.unlockedAchievements, id],
    })),
  setUnlockedAchievements: (ids) => set({ unlockedAchievements: ids }),
});
