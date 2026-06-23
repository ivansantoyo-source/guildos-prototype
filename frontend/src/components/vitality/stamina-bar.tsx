"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { getStaminaColor, type DebuffType } from '@/lib/vitality/stamina';
import { Zap, AlertTriangle } from 'lucide-react';

interface StaminaBarProps {
  stamina: number;
  maxStamina: number;
  debuffType: DebuffType | null;
  debuffUntil: string | null;
  onClearDebuff?: () => void;
  className?: string;
}

const DEBUFF_LABELS: Record<DebuffType, { icon: string; label: string; tip: string }> = {
  SEDENTARY: { icon: '💺', label: 'SEDENTARY', tip: 'Complete a stretch quest to clear' },
  DEHYDRATION: { icon: '💧', label: 'DEHYDRATED', tip: 'Visit the hydration station' },
  FATIGUE: { icon: '😴', label: 'FATIGUED', tip: 'Take a break and rest' },
  SCREEN_FATIGUE: { icon: '👁️', label: 'EYE STRAIN', tip: 'Do the 20/20/20 eye rest quest' },
};

export default function StaminaBar({
  stamina,
  maxStamina,
  debuffType,
  debuffUntil,
  onClearDebuff,
  className = '',
}: StaminaBarProps) {
  const pct = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));
  const color = getStaminaColor(stamina, maxStamina);
  const isLow = pct <= 30;
  const hasDebuff = debuffType !== null;

  const debuffInfo = debuffType ? DEBUFF_LABELS[debuffType] : null;
  const debuffExpired = debuffUntil ? new Date(debuffUntil).getTime() < Date.now() : true;
  const activeDebuff = hasDebuff && !debuffExpired;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4" style={{ color }} />
          <span className="text-[var(--text-secondary)] font-medium">STAMINA</span>
          <span className="text-[var(--text-primary)] font-bold tabular-nums">
            {Math.round(stamina)}/{maxStamina}
          </span>
        </div>
        {activeDebuff && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            DEBUFFED
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="relative h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            boxShadow: isLow
              ? `0 0 8px ${color}66, 0 0 16px ${color}33`
              : `0 0 4px ${color}44`,
          }}
          initial={{ width: 0 }}
          animate={{
            width: `${pct}%`,
            boxShadow: isLow
              ? [`0 0 8px ${color}66, 0 0 16px ${color}33`, `0 0 12px ${color}88, 0 0 24px ${color}55`, `0 0 8px ${color}66, 0 0 16px ${color}33`]
              : `0 0 4px ${color}44`,
          }}
          transition={{
            width: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
            boxShadow: isLow ? { repeat: Infinity, duration: 2 } : {},
          }}
        />
      </div>

      {/* Debuff Warning */}
      {activeDebuff && debuffInfo && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <span className="text-xl">{debuffInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-400">
              {debuffInfo.label} — No XP earned!
            </p>
            <p className="text-xs text-[var(--text-secondary)]">{debuffInfo.tip}</p>
          </div>
          {onClearDebuff && (
            <button
              onClick={onClearDebuff}
              className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--neon-primary)]/20 text-[var(--neon-primary)] border border-[var(--neon-primary)]/30 hover:bg-[var(--neon-primary)]/30 transition-colors"
            >
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              CLEAR
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
