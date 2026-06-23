// ============================================================================
// GUILDOS — Vitality Quests System
// QR-based health challenges: stretch, hydration, mindfulness
// ============================================================================

import type { VitalityQuest, VitalityCompletion } from '@/lib/types';

interface QuestCooldown {
  questId: string;
  availableAt: string;
}

/**
 * Get quests available for a profile (not on cooldown, active quests).
 */
export function getAvailableQuests(
  quests: VitalityQuest[],
  completions: VitalityCompletion[],
  cooldowns: QuestCooldown[],
): VitalityQuest[] {
  const now = Date.now();

  return quests.filter((quest) => {
    if (!quest.is_active) return false;

    // Check cooldown
    const cooldown = cooldowns.find((c) => c.questId === quest.id);
    if (cooldown && new Date(cooldown.availableAt).getTime() > now) {
      return false;
    }

    return true;
  });
}

/**
 * Validate a QR code hash against a quest.
 */
export function validateQuestQR(quest: VitalityQuest, scannedHash: string): boolean {
  return quest.qr_code_hash === scannedHash;
}

/**
 * Calculate cooldown end time for a quest.
 */
export function getCooldownEnd(quest: VitalityQuest): string {
  return new Date(Date.now() + quest.cooldown_minutes * 60 * 1000).toISOString();
}

/**
 * Calculate time remaining on a cooldown in minutes.
 */
export function getCooldownRemaining(cooldown: QuestCooldown): number {
  const remaining = new Date(cooldown.availableAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 60000));
}

/**
 * Get today's quest completion count for a profile.
 */
export function getTodaysCompletions(completions: VitalityCompletion[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return completions.filter(
    (c) => new Date(c.completed_at).getTime() >= today.getTime(),
  ).length;
}

/**
 * Demo vitality quests.
 */
export function getDemoQuests(): VitalityQuest[] {
  return [
    {
      id: 'vq-001',
      organization_id: 'demo-time-warp-001',
      name: 'Neck Rolls',
      description: 'Stand up and do 10 slow neck rolls in each direction. Your spine will thank you.',
      quest_type: 'STRETCH',
      xp_reward: 50,
      stamina_restore: 20,
      cooldown_minutes: 60,
      qr_code_hash: 'stretch-neck-001',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'vq-002',
      organization_id: 'demo-time-warp-001',
      name: 'Hydration Station',
      description: 'Drink 16oz of water. Scan the QR at the hydration station to verify.',
      quest_type: 'HYDRATION',
      xp_reward: 30,
      stamina_restore: 25,
      cooldown_minutes: 90,
      qr_code_hash: 'hydrate-water-001',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'vq-003',
      organization_id: 'demo-time-warp-001',
      name: 'Power Stance',
      description: 'Stand with feet shoulder-width, hands on hips, chest out. Hold for 2 minutes. Power poses boost testosterone and confidence.',
      quest_type: 'POSTURE_CHECK',
      xp_reward: 40,
      stamina_restore: 15,
      cooldown_minutes: 120,
      qr_code_hash: 'posture-power-001',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'vq-004',
      organization_id: 'demo-time-warp-001',
      name: 'Eye Rest — 20/20/20',
      description: 'Look at something 20 feet away for 20 seconds. Reduces digital eye strain.',
      quest_type: 'EYE_REST',
      xp_reward: 20,
      stamina_restore: 10,
      cooldown_minutes: 30,
      qr_code_hash: 'eyes-rest-001',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'vq-005',
      organization_id: 'demo-time-warp-001',
      name: 'Social Reset',
      description: 'Introduce yourself to someone new in the store. Gaming is better with friends.',
      quest_type: 'SOCIAL',
      xp_reward: 50,
      stamina_restore: 30,
      cooldown_minutes: 180,
      qr_code_hash: 'social-greet-001',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'vq-006',
      organization_id: 'demo-time-warp-001',
      name: 'Breath of Fire',
      description: 'Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 5 times.',
      quest_type: 'MINDFULNESS',
      xp_reward: 35,
      stamina_restore: 20,
      cooldown_minutes: 60,
      qr_code_hash: 'mindful-breath-001',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];
}
