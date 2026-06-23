import type { StateCreator } from 'zustand';
import type { Notification } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface NotificationSlice {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
}

export const createNotificationSlice: StateCreator<GuildState, [], [], NotificationSlice> = (set) => ({
  notifications: [],

  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ),
    })),
});
