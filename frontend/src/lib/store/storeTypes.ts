import type { AuthSlice } from './slices/authSlice';
import type { UISlice } from './slices/uiSlice';
import type { InventorySlice } from './slices/inventorySlice';
import type { BountySlice } from './slices/bountySlice';
import type { NexusSlice } from './slices/nexusSlice';
import type { NotificationSlice } from './slices/notificationSlice';
import type { DashboardSlice } from './slices/dashboardSlice';
import type { ShopkeeperSlice } from './slices/shopkeeperSlice';
import type { StationSlice } from './slices/stationSlice';
import type { WalletSlice } from './slices/walletSlice';
import type { VitalitySlice } from './slices/vitalitySlice';
import type { PotionSlice } from './slices/potionSlice';
import type { AchievementSlice } from './slices/achievementSlice';
import type { CustomerStorefrontSlice } from './slices/customerStorefrontSlice';
import type { POSSlice } from './slices/posSlice';
import type { AgentSlice } from './slices/agentSlice';

export type GuildState = AuthSlice &
  UISlice &
  InventorySlice &
  BountySlice &
  NexusSlice &
  NotificationSlice &
  DashboardSlice &
  ShopkeeperSlice &
  StationSlice &
  WalletSlice &
  VitalitySlice &
  PotionSlice &
  AchievementSlice &
  CustomerStorefrontSlice &
  POSSlice &
  AgentSlice;

export type {
  AuthSlice,
  UISlice,
  InventorySlice,
  BountySlice,
  NexusSlice,
  NotificationSlice,
  DashboardSlice,
  ShopkeeperSlice,
  StationSlice,
  WalletSlice,
  VitalitySlice,
  PotionSlice,
  AchievementSlice,
  CustomerStorefrontSlice,
  POSSlice,
  AgentSlice,
};
