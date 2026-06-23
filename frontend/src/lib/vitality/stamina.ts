"use client";

// ============================================================================
// GUILDOS — Stamina System
// Vitality Protocol: stamina drain, debuff application, regen
// ============================================================================

export type DebuffType = 'SEDENTARY' | 'DEHYDRATION' | 'FATIGUE' | 'SCREEN_FATIGUE';

export interface StaminaState {
  stamina: number;
  maxStamina: number;
  debuffType: DebuffType | null;
  debuffUntil: string | null;
  consecutiveHours: number;
  lastActivityAt: string | null;
}

/** Hours of consecutive activity before SEDENTARY debuff kicks in */
const SEDENTARY_THRESHOLD_HOURS = 3;

/** Stamina drain per hour of active use */
const STAMINA_DRAIN_PER_HOUR = 15;

/** Stamina regen per hour of inactivity */
const STAMINA_REGEN_PER_HOUR = 20;

/**
 * Calculate current stamina based on last activity and consecutive hours.
 * Called every 5 minutes to tick the stamina system.
 */
export function calculateStamina(state: StaminaState): StaminaState {
  const now = Date.now();
  const lastActivity = state.lastActivityAt ? new Date(state.lastActivityAt).getTime() : now;
  const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

  let { stamina, consecutiveHours, debuffType, debuffUntil } = state;

  // Check if debuff has expired
  if (debuffType && debuffUntil && new Date(debuffUntil).getTime() < now) {
    debuffType = null;
    debuffUntil = null;
  }

  if (hoursSinceActivity < 0.08) {
    // Active within last 5 minutes — draining
    consecutiveHours += 5 / 60;
    stamina = Math.max(0, stamina - STAMINA_DRAIN_PER_HOUR * (5 / 60));

    // Apply SEDENTARY debuff after 3+ consecutive hours
    if (consecutiveHours >= SEDENTARY_THRESHOLD_HOURS && !debuffType) {
      debuffType = 'SEDENTARY';
      debuffUntil = new Date(now + 30 * 60 * 1000).toISOString(); // 30 min debuff
    }
  } else {
    // Inactive — regenerating
    consecutiveHours = Math.max(0, consecutiveHours - (5 / 60));
    stamina = Math.min(state.maxStamina, stamina + STAMINA_REGEN_PER_HOUR * Math.min(hoursSinceActivity, 0.5));
  }

  return {
    stamina: Math.round(stamina),
    maxStamina: state.maxStamina,
    debuffType,
    debuffUntil,
    consecutiveHours,
    lastActivityAt: state.lastActivityAt,
  };
}

/**
 * Apply a specific debuff type to the profile.
 */
export function applyDebuff(
  state: StaminaState,
  debuff: DebuffType,
  durationMinutes: number = 30,
): StaminaState {
  return {
    ...state,
    debuffType: debuff,
    debuffUntil: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
  };
}

/**
 * Clear active debuff (after completing a vitality quest).
 */
export function clearDebuff(state: StaminaState): StaminaState {
  return {
    ...state,
    debuffType: null,
    debuffUntil: null,
  };
}

/**
 * Check if a debuff should prevent XP earning.
 */
export function isXPEarningBlocked(state: StaminaState): boolean {
  if (!state.debuffType || !state.debuffUntil) return false;
  return new Date(state.debuffUntil).getTime() > Date.now();
}

/**
 * Get stamina regen rate (points per hour) based on current state.
 */
export function getStaminaRegenRate(state: StaminaState): number {
  if (state.debuffType === 'FATIGUE') return STAMINA_REGEN_PER_HOUR * 0.5;
  return STAMINA_REGEN_PER_HOUR;
}

/**
 * Get stamina color for UI rendering.
 */
export function getStaminaColor(stamina: number, maxStamina: number): string {
  const pct = stamina / maxStamina;
  if (pct > 0.6) return '#22c55e'; // green
  if (pct > 0.3) return '#eab308'; // yellow
  return '#ef4444'; // red
}

/**
 * Demo mode: simulate stamina state.
 */
export function getDemoStaminaState(): StaminaState {
  return {
    stamina: 72,
    maxStamina: 100,
    debuffType: null,
    debuffUntil: null,
    consecutiveHours: 1.5,
    lastActivityAt: new Date().toISOString(),
  };
}
