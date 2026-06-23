"use client";

// ============================================================================
// GUILDOS — XP Engine
// Awards XP for all actions, checks level-up thresholds, logs transactions
// ============================================================================

import type { Profile } from '@/lib/types';

export type XPSource =
  | 'SCAN'
  | 'SALE'
  | 'BOUNTY_FULFILLED'
  | 'VITALITY_QUEST'
  | 'LFG_HOST'
  | 'ACHIEVEMENT'
  | 'DAILY_LOGIN'
  | 'FACTION_CONTRIBUTION'
  | 'POTION_PURCHASE'
  | 'STATION_BOOKING';

/** Base XP rewards per action type */
export const XP_REWARDS: Record<XPSource, number | ((value: number) => number)> = {
  SCAN: 10,
  SALE: (value) => Math.floor(value),
  BOUNTY_FULFILLED: 100,
  VITALITY_QUEST: 50,
  LFG_HOST: 75,
  ACHIEVEMENT: 0, // set per achievement
  DAILY_LOGIN: 25,
  FACTION_CONTRIBUTION: 25,
  POTION_PURCHASE: 15,
  STATION_BOOKING: 30,
};

/** Level tier thresholds (must match DB trigger) */
export const LEVEL_THRESHOLDS = {
  PEASANT: 0,
  RETRO_MAGE: 10000,
  TIME_LORD: 25000,
} as const;

export type LevelTier = keyof typeof LEVEL_THRESHOLDS;

/**
 * Calculate XP reward for a given source.
 */
export function calculateXPReward(source: XPSource, value: number = 0): number {
  const reward = XP_REWARDS[source];
  if (typeof reward === 'function') return reward(value);
  return reward;
}

/**
 * Determine level tier from XP points.
 */
export function getLevelTier(xpPoints: number): LevelTier {
  if (xpPoints >= LEVEL_THRESHOLDS.TIME_LORD) return 'TIME_LORD';
  if (xpPoints >= LEVEL_THRESHOLDS.RETRO_MAGE) return 'RETRO_MAGE';
  return 'PEASANT';
}

/**
 * Calculate XP needed to reach next tier.
 */
export function xpToNextTier(currentXP: number): { tier: LevelTier; xpNeeded: number; progress: number } {
  const currentTier = getLevelTier(currentXP);

  let nextThreshold: number;
  let prevThreshold: number;

  switch (currentTier) {
    case 'PEASANT':
      prevThreshold = LEVEL_THRESHOLDS.PEASANT;
      nextThreshold = LEVEL_THRESHOLDS.RETRO_MAGE;
      break;
    case 'RETRO_MAGE':
      prevThreshold = LEVEL_THRESHOLDS.RETRO_MAGE;
      nextThreshold = LEVEL_THRESHOLDS.TIME_LORD;
      break;
    case 'TIME_LORD':
      return { tier: 'TIME_LORD', xpNeeded: 0, progress: 100 };
  }

  const xpNeeded = nextThreshold - currentXP;
  const progress = ((currentXP - prevThreshold) / (nextThreshold - prevThreshold)) * 100;

  return { tier: currentTier, xpNeeded, progress: Math.min(100, Math.max(0, progress)) };
}

/**
 * Check if a level-up should occur and return the new tier.
 */
export function checkLevelUp(
  oldXP: number,
  newXP: number,
): { leveledUp: boolean; oldTier: LevelTier; newTier: LevelTier; xpGained: number } {
  const oldTier = getLevelTier(oldXP);
  const newTier = getLevelTier(newXP);
  return {
    leveledUp: oldTier !== newTier,
    oldTier,
    newTier,
    xpGained: newXP - oldXP,
  };
}

/**
 * Get perks for a given level tier.
 */
export function getTierPerks(tier: LevelTier): string[] {
  switch (tier) {
    case 'PEASANT':
      return ['Access to bounty board', 'Basic profile'];
    case 'RETRO_MAGE':
      return ['Save Room access', '+5% trade-in credit bonus', 'Retro Mage badge', 'Custom faction flair'];
    case 'TIME_LORD':
      return ['Priority bounty access', '+10% store credit on all trade-ins', 'VIP Lounge access', 'Custom title', 'Golden name glow'];
  }
}

/**
 * Demo XP transaction history.
 */
export function getDemoXPHistory(): Array<{ source: XPSource; amount: number; timestamp: string }> {
  const now = Date.now();
  return [
    { source: 'DAILY_LOGIN', amount: 25, timestamp: new Date(now - 3600000).toISOString() },
    { source: 'SCAN', amount: 10, timestamp: new Date(now - 7200000).toISOString() },
    { source: 'SALE', amount: 35, timestamp: new Date(now - 10800000).toISOString() },
    { source: 'VITALITY_QUEST', amount: 50, timestamp: new Date(now - 14400000).toISOString() },
    { source: 'BOUNTY_FULFILLED', amount: 100, timestamp: new Date(now - 86400000).toISOString() },
  ];
}
