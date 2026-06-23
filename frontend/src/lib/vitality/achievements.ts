"use client";

// ============================================================================
// GUILDOS — Achievement Unlock Engine
// Defines unlock conditions and checks after any XP-awarding action
// ============================================================================

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  /** Function that returns true if the achievement should unlock */
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  inventoryScans: number;
  bountiesFulfilled: number;
  totalSpend: number;
  factionContribution: number;
  legendaryItemsOwned: number;
  lfgsHosted: number;
  hasTopScore: boolean;
  konamiCodeUsed: boolean;
  vitalityQuestsCompleted: number;
  potionsOrdered: number;
  stationsBooked: number;
}

export interface UnlockedAchievement {
  definition: AchievementDefinition;
  unlockedAt: string;
}

/** All 8 achievement definitions */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-scan',
    name: 'First Scan',
    description: 'Scan your first item into inventory',
    rarity: 'common',
    icon: '📷',
    xpReward: 100,
    check: (s) => s.inventoryScans >= 1,
  },
  {
    id: 'bounty-hunter',
    name: 'Bounty Hunter',
    description: 'Fulfill 5 bounties',
    rarity: 'rare',
    icon: '🎯',
    xpReward: 250,
    check: (s) => s.bountiesFulfilled >= 5,
  },
  {
    id: 'gold-hoarder',
    name: 'Gold Hoarder',
    description: 'Reach $5,000 in total spend',
    rarity: 'rare',
    icon: '🪙',
    xpReward: 300,
    check: (s) => s.totalSpend >= 5000,
  },
  {
    id: 'faction-champion',
    name: 'Faction Champion',
    description: 'Contribute 10,000 points to your faction',
    rarity: 'epic',
    icon: '⚔️',
    xpReward: 500,
    check: (s) => s.factionContribution >= 10000,
  },
  {
    id: 'legendary-collector',
    name: 'Legendary Collector',
    description: 'Own 10 legendary items',
    rarity: 'legendary',
    icon: '👑',
    xpReward: 500,
    check: (s) => s.legendaryItemsOwned >= 10,
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Host 10 LFG lobbies',
    rarity: 'rare',
    icon: '🦋',
    xpReward: 200,
    check: (s) => s.lfgsHosted >= 10,
  },
  {
    id: 'high-score',
    name: 'High Score',
    description: 'Claim the #1 spot on any scoreboard',
    rarity: 'epic',
    icon: '🏆',
    xpReward: 500,
    check: (s) => s.hasTopScore,
  },
  {
    id: 'konami-seeker',
    name: 'Konami Seeker',
    description: 'Activate the Konami Code',
    rarity: 'legendary',
    icon: '🎮',
    xpReward: 100,
    check: (s) => s.konamiCodeUsed,
  },
];

/**
 * Check all achievements against current stats, returning newly unlocked ones.
 */
export function checkAchievements(
  stats: AchievementStats,
  alreadyUnlocked: string[],
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(
    (ach) => !alreadyUnlocked.includes(ach.id) && ach.check(stats),
  );
}

/**
 * Get achievement by ID.
 */
export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Demo achievement stats (simulates a mid-level player).
 */
export function getDemoAchievementStats(): AchievementStats {
  return {
    inventoryScans: 12,
    bountiesFulfilled: 3,
    totalSpend: 1250,
    factionContribution: 4500,
    legendaryItemsOwned: 3,
    lfgsHosted: 2,
    hasTopScore: false,
    konamiCodeUsed: true,
    vitalityQuestsCompleted: 7,
    potionsOrdered: 4,
    stationsBooked: 5,
  };
}
