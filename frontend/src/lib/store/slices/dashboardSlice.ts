import type { StateCreator } from 'zustand';
import type { DashboardStats, ActivityEvent } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface DashboardSlice {
  dashboardStats: DashboardStats;
  activityFeed: ActivityEvent[];
  setDashboardStats: (stats: DashboardStats) => void;
  setActivityFeed: (events: ActivityEvent[]) => void;
  addActivity: (event: ActivityEvent) => void;
}

const defaultStats: DashboardStats = {
  goldFarmed: 0,
  legendaryDrops: 0,
  lootDepleted: 0,
  activeBounties: 0,
  priceSpikeAlerts: 0,
  activeLobbies: 0,
};

export const createDashboardSlice: StateCreator<GuildState, [], [], DashboardSlice> = (set) => ({
  dashboardStats: defaultStats,
  activityFeed: [],

  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setActivityFeed: (events) => set({ activityFeed: events }),
  addActivity: (event) =>
    set((state) => ({ activityFeed: [event, ...state.activityFeed] })),
});
