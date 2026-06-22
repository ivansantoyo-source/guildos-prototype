"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useConfetti } from "./confetti";
import { XPBar } from "../widgets/xp-bar";

// ============================================================================
// GUILDOS — Level-Up Celebration Effect
// Full-screen overlay when user levels up (Peasant → Retro Mage → Time Lord)
// Central card with glow, new level name, new perks unlocked
// Particle burst from center - Auto-dismiss after 4 seconds
// ============================================================================

export interface LevelUpData {
  oldTier: string;
  newTier: string;
  xpEarned: number;
  newPerks: string[];
  currentXP: number;
}

const LEVEL_UP_EVENT = "guildos:level-up";

/**
 * Trigger a level-up celebration from anywhere in the app.
 */
export function triggerLevelUp(data: LevelUpData) {
  const event = new CustomEvent(LEVEL_UP_EVENT, { detail: data });
  window.dispatchEvent(event);
}

const TIER_NAMES: Record<string, string> = {
  PEASANT: "Peasant",
  RETRO_MAGE: "Retro Mage",
  TIME_LORD: "Time Lord",
};

const TIER_ICONS: Record<string, string> = {
  PEASANT: "👤",
  RETRO_MAGE: "🧙",
  TIME_LORD: "⏳",
};

const TIER_PERKS: Record<string, string[]> = {
  RETRO_MAGE: [
    "Access to Save Room reservations",
    "+5% trade-in credit bonus",
    "Exclusive Retro Mage badge on profile",
  ],
  TIME_LORD: [
    "Priority bounty board access",
    "+10% store credit on all trade-ins",
    "Time Lord VIP lounge access",
    "Custom profile title & glow effect",
  ],
};

// --- Floating XP orb particle (CSS-based) ---

function FloatingOrbs() {
  const [orbs, setOrbs] = useState<
    { id: number; x: number; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    const newOrbs = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      size: 4 + Math.random() * 8,
    }));
    setOrbs(newOrbs);
  }, []);

  return (
    <>
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full bg-xp/40"
          style={{
            left: `${orb.x}%`,
            bottom: "-10px",
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            animation: `level-orb-float 3s ease-in-out ${orb.delay}s infinite`,
            filter: "blur(1px)",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes level-orb-float {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.6; }
          50% { transform: translateY(-200px) scale(1.5); opacity: 0.8; }
          80% { opacity: 0.3; }
          100% { transform: translateY(-400px) scale(0.5); opacity: 0; }
        }
      `}</style>
    </>
  );
}

// --- Main Component ---

export function LevelUpOverlay() {
  const [data, setData] = useState<LevelUpData | null>(null);
  const [visible, setVisible] = useState(false);
  const confetti = useConfetti();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LevelUpData>).detail;
      setData(detail);
      setVisible(true);

      // Fire confetti burst from center
      confetti.fireLevelUp();

      // Auto-dismiss
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setData(null), 500);
      }, 4000);
    };

    window.addEventListener(LEVEL_UP_EVENT, handler);
    return () => {
      window.removeEventListener(LEVEL_UP_EVENT, handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [confetti]);

  if (!data) return null;

  const tierName = TIER_NAMES[data.newTier] || data.newTier;
  const oldTierName = TIER_NAMES[data.oldTier] || data.oldTier;
  const perks = data.newPerks.length > 0 ? data.newPerks : (TIER_PERKS[data.newTier] || []);

  return (
    <div
      className={`fixed inset-0 z-[95] flex items-center justify-center transition-all duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Orb particles */}
      <FloatingOrbs />

      {/* Card */}
      <div className="relative bg-card border-2 border-xp/40 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-[0_0_60px_oklch(0.7_0.2_170/30%),0_0_120px_oklch(0.7_0.2_170/15%)] animate-in zoom-in-95 duration-500">
        {/* Close button */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => setData(null), 500);
          }}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors text-lg"
          aria-label="Dismiss"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="text-6xl mb-2 animate-bounce">
          {TIER_ICONS[data.newTier] || "⭐"}
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-xp animate-neon-pulse mb-1">
          LEVEL UP!
        </h2>

        {/* Tier transition */}
        <p className="text-sm text-muted-foreground mb-4">
          {oldTierName} <span className="text-foreground/40">→</span>{" "}
          <span className="text-xp font-semibold text-lg">{tierName}</span>
        </p>

        {/* XP earned flash */}
        <div className="inline-block bg-xp/15 border border-xp/20 rounded-lg px-4 py-1 mb-4">
          <span className="text-xp text-sm font-bold">
            +{data.xpEarned.toLocaleString()} XP
          </span>
        </div>

        {/* XP Progress bar */}
        <div className="mb-4 px-2">
          <XPBar
            currentXP={data.currentXP}
            levelTier={data.newTier}
            size="sm"
            animated
          />
        </div>

        {/* Perks unlocked */}
        {perks.length > 0 && (
          <div className="bg-xp/10 border border-xp/20 rounded-lg p-3 mb-2">
            <p className="text-[10px] text-xp/70 uppercase tracking-wider mb-2 font-semibold">
              PERKS UNLOCKED
            </p>
            <div className="space-y-1.5">
              {perks.map((perk, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-foreground/80"
                >
                  <span className="text-xp shrink-0">✦</span>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/50 mt-3">
          Power surging through the guild...
        </p>
      </div>
    </div>
  );
}
