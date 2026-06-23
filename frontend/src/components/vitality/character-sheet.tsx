"use client";

import React from 'react';
import { motion } from 'framer-motion';
import StaminaBar from './stamina-bar';
import { xpToNextTier, getTierPerks, type LevelTier } from '@/lib/vitality/xp-engine';
import { type DebuffType } from '@/lib/vitality/stamina';
import { Brain, Heart, Sparkles, Sword, Star, Crown } from 'lucide-react';

interface CharacterSheetProps {
  profile: {
    id: string;
    display_name: string;
    level_tier: string;
    xp_points: number;
    faction?: string;
    total_spend: number;
    mind_stat: number;
    body_stat: number;
    soul_stat: number;
    stamina: number;
    maxStamina: number;
    debuffType: DebuffType | null;
    debuffUntil: string | null;
    purchase_tags?: string[];
    hydration_count: number;
    stretch_count: number;
  };
  onClearDebuff?: () => void;
  className?: string;
}

const TIER_ICONS: Record<string, string> = {
  PEASANT: '🌱',
  RETRO_MAGE: '🧙',
  TIME_LORD: '👑',
};

const FACTION_COLORS: Record<string, string> = {
  SEGA_SYNDICATE: '#3b82f6',
  NINTENDO_NOMADS: '#ef4444',
  SONY_SENTINELS: '#a855f7',
};

/** SVG Hexagon stat display */
function StatHex({ value, label, icon: Icon, color, size = 60 }: { value: number; label: string; icon: React.ElementType; color: string; size?: number }) {
  const maxStat = 20;
  const pct = (value / maxStat) * 100;
  const center = size / 2;
  const radius = (size / 2) * 0.65;

  // Hexagon points
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background hex */}
        <polygon
          points={hexPoints}
          fill="none"
          stroke={`${color}33`}
          strokeWidth={2}
        />
        {/* Fill based on stat value */}
        <motion.polygon
          points={hexPoints}
          fill={`${color}22`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          clipPath={`polygon(0 ${size - (size * pct) / 100}px, ${size}px ${size - (size * pct) / 100}px, ${size}px ${size}px, 0 ${size}px)`}
          style={{ clipPath: `inset(${size - (size * pct) / 100}px 0 0 0)` }}
        />
        {/* Glow */}
        <polygon
          points={hexPoints}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.6}
          style={{ filter: `drop-shadow(0 0 3px ${color}88)` }}
        />
        {/* Value text */}
        <text
          x={center}
          y={center + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-bold"
          fill={color}
        >
          {value}
        </text>
      </svg>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function CharacterSheet({ profile, onClearDebuff, className = '' }: CharacterSheetProps) {
  const { tier, xpNeeded, progress } = xpToNextTier(profile.xp_points);
  const perks = getTierPerks(profile.level_tier as LevelTier);
  const factionColor = FACTION_COLORS[profile.faction ?? ''] ?? '#888';
  const tierIcon = TIER_ICONS[profile.level_tier] ?? '🌱';

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header — RPG Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--glass-bg)] backdrop-blur-xl overflow-hidden"
      >
        {/* Background glow */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: factionColor }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{tierIcon}</span>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{profile.display_name}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">
                {profile.level_tier.replace('_', ' ')}
              </span>
              {profile.faction && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${factionColor}22`, color: factionColor, border: `1px solid ${factionColor}44` }}>
                  {profile.faction.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-[var(--text-secondary)]">Total Spend</div>
            <div className="text-[var(--gold-primary)] font-bold text-lg">
              ${profile.total_spend.toLocaleString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mind / Body / Soul */}
      <div className="flex justify-center gap-6 p-4 rounded-xl bg-[var(--bg-secondary)]/50">
        <StatHex value={profile.mind_stat} label="MIND" icon={Brain} color="#60a5fa" />
        <StatHex value={profile.body_stat} label="BODY" icon={Heart} color="#f87171" />
        <StatHex value={profile.soul_stat} label="SOUL" icon={Sparkles} color="#c084fc" />
      </div>

      {/* XP Progress */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)]/50 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">
            {profile.xp_points.toLocaleString()} XP
          </span>
          <span className="text-[var(--text-tertiary)]">
            {xpNeeded > 0 ? `${xpNeeded.toLocaleString()} XP to next tier` : 'MAX LEVEL'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--gold-primary), var(--gold-secondary))' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
          <span>{tier.replace('_', ' ')}</span>
          {tier !== 'TIME_LORD' && (
            <span>{tier === 'PEASANT' ? 'RETRO_MAGE' : 'TIME_LORD'} ({(tier === 'PEASANT' ? 10000 : 25000).toLocaleString()})</span>
          )}
        </div>
      </div>

      {/* Stamina */}
      <StaminaBar
        stamina={profile.stamina}
        maxStamina={profile.maxStamina}
        debuffType={profile.debuffType}
        debuffUntil={profile.debuffUntil}
        onClearDebuff={onClearDebuff}
      />

      {/* Perks */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          <Crown className="w-3 h-3 inline mr-1" />
          Tier Perks
        </h4>
        <div className="space-y-1.5">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <Star className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
              {perk}
            </div>
          ))}
        </div>
      </div>

      {/* Vitality Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)]/50">
          <div className="text-[var(--text-secondary)] text-xs mb-1">Hydration</div>
          <div className="text-[var(--neon-primary)] font-bold">{profile.hydration_count} refills today</div>
        </div>
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)]/50">
          <div className="text-[var(--text-secondary)] text-xs mb-1">Stretches</div>
          <div className="text-[var(--neon-primary)] font-bold">{profile.stretch_count} completed today</div>
        </div>
      </div>

      {/* Purchase Tags */}
      {profile.purchase_tags && profile.purchase_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.purchase_tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]"
            >
              #{tag.toLowerCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
