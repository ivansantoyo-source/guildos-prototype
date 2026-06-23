import type { StateCreator } from 'zustand';
import type { VitalityQuest, VitalityCompletion } from '@/lib/types';
import type { DebuffType } from '@/lib/vitality/stamina';
import type { GuildState } from '../storeTypes';

export interface VitalitySlice {
  stamina: number;
  maxStamina: number;
  debuffType: DebuffType | null;
  debuffUntil: string | null;
  consecutiveHours: number;
  lastActivityAt: string | null;
  mindStat: number;
  bodyStat: number;
  soulStat: number;
  xpEarnedThisSession: number;
  vitalityQuests: VitalityQuest[];
  vitalityCompletions: VitalityCompletion[];
  setStamina: (stamina: number) => void;
  setDebuff: (type: DebuffType, until: string) => void;
  clearDebuff: () => void;
  setCharacterStats: (mind: number, body: number, soul: number) => void;
  addXP: (amount: number, source: string) => void;
  setVitalityQuests: (quests: VitalityQuest[]) => void;
  addVitalityCompletion: (completion: VitalityCompletion) => void;
}

export const createVitalitySlice: StateCreator<GuildState, [], [], VitalitySlice> = (set) => ({
  stamina: 100,
  maxStamina: 100,
  debuffType: null,
  debuffUntil: null,
  consecutiveHours: 0,
  lastActivityAt: null,
  mindStat: 5,
  bodyStat: 5,
  soulStat: 5,
  xpEarnedThisSession: 0,
  vitalityQuests: [],
  vitalityCompletions: [],

  setStamina: (stamina) => set({ stamina }),
  setDebuff: (type, until) => set({ debuffType: type, debuffUntil: until }),
  clearDebuff: () => set({ debuffType: null, debuffUntil: null }),
  setCharacterStats: (mind, body, soul) =>
    set({ mindStat: mind, bodyStat: body, soulStat: soul }),
  addXP: (amount, _source) =>
    set((state) => ({
      xpEarnedThisSession: state.xpEarnedThisSession + amount,
    })),
  setVitalityQuests: (quests) => set({ vitalityQuests: quests }),
  addVitalityCompletion: (completion) =>
    set((state) => ({
      vitalityCompletions: [...state.vitalityCompletions, completion],
    })),
});
