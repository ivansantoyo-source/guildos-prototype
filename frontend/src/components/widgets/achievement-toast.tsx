"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// GUILDOS — Achievement Toast System
// Xbox/PlayStation-style achievement popup
// Slides in from top, stays 5 seconds, slides out
// Icon + title + description
// Rarity colors: Common (gray), Rare (blue), Epic (purple), Legendary (gold)
// ============================================================================

export type AchievementRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
}

const RARITY_CONFIG: Record<
  AchievementRarity,
  {
    label: string;
    bg: string;
    text: string;
    iconBorder: string;
    accent: string;
    glow: string;
    sound: string;
  }
> = {
  common: {
    label: "COMMON",
    bg: "bg-muted/10 border-muted/30",
    text: "text-muted-foreground",
    iconBorder: "border-muted/30",
    accent: "bg-muted/20",
    glow: "",
    sound: "achievement_common.mp3",
  },
  rare: {
    label: "RARE",
    bg: "bg-blue-950/30 border-blue-500/30",
    text: "text-blue-400",
    iconBorder: "border-blue-500/30",
    accent: "bg-blue-500/20",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    sound: "achievement_rare.mp3",
  },
  epic: {
    label: "EPIC",
    bg: "bg-purple-950/30 border-purple-500/30",
    text: "text-purple-400",
    iconBorder: "border-purple-500/30",
    accent: "bg-purple-500/20",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
    sound: "achievement_epic.mp3",
  },
  legendary: {
    label: "LEGENDARY",
    bg: "bg-amber-950/30 border-gold/40",
    text: "text-gold",
    iconBorder: "border-gold/40",
    accent: "bg-gold/20",
    glow: "shadow-[0_0_30px_oklch(0.82_0.16_85/25%)]",
    sound: "achievement_legendary.mp3",
  },
};

const ACHIEVEMENT_EVENT = "guildos:achievement";

/**
 * Trigger an achievement toast from anywhere in the app.
 */
export function triggerAchievement(achievement: Achievement) {
  const event = new CustomEvent(ACHIEVEMENT_EVENT, { detail: achievement });
  window.dispatchEvent(event);
}

// --- Notification sound effect (browser AudioContext) ---

function playAchievementSound(rarity: AchievementRarity) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different tones per rarity
    const freqMap: Record<AchievementRarity, number[]> = {
      common: [523, 659],
      rare: [523, 659, 784],
      epic: [523, 659, 784, 1047],
      legendary: [440, 554, 659, 880, 1047],
    };

    const freqs = freqMap[rarity] || freqMap.common;
    const noteDuration = 0.12;

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * noteDuration);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * noteDuration);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * noteDuration + noteDuration
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * noteDuration);
      osc.stop(ctx.currentTime + i * noteDuration + noteDuration);
    });
  } catch {
    // Audio not available — silent fail
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AchievementToast = React.memo(() => {
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [visible, setVisible] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  const queueRef = useRef<Achievement[]>([]);
  const processingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }
    processingRef.current = true;
    const next = queueRef.current.shift()!;
    setCurrent(next);
    setAnimatingOut(false);

    // Play sound based on rarity
    playAchievementSound(next.rarity);

    // Trigger slide-in
    requestAnimationFrame(() => {
      setVisible(true);
    });

    // Auto-dismiss after 5 seconds
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAnimatingOut(true);
      setTimeout(() => {
        setVisible(false);
        setAnimatingOut(false);
        setTimeout(showNext, 300);
      }, 500);
    }, 5000);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const achievement = (e as CustomEvent<Achievement>).detail;
      queueRef.current.push(achievement);
      if (!processingRef.current) showNext();
    };
    window.addEventListener(ACHIEVEMENT_EVENT, handler);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, handler);
  }, [showNext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!current) return null;

  const config = RARITY_CONFIG[current.rarity];

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[99] transition-all duration-500 ease-out",
        visible && !animatingOut
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-12"
      )}
      style={{
        transform:
          visible && !animatingOut
            ? "translateY(0)"
            : "translateY(-120%)",
      }}
    >
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border max-w-sm",
          config.bg,
          config.glow
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "w-11 h-11 rounded-lg border flex items-center justify-center text-lg shrink-0 bg-background/50",
            config.iconBorder
          )}
        >
          {current.icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider font-bold",
                config.text
              )}
            >
              {config.label}
            </span>
            <span className="text-[9px] text-muted-foreground/60 font-medium">
              ACHIEVEMENT
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {current.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
            {current.description}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setAnimatingOut(true);
            setTimeout(() => {
              setVisible(false);
              setAnimatingOut(false);
              setTimeout(showNext, 300);
            }, 500);
          }}
          className="text-muted-foreground/40 hover:text-foreground transition-colors text-xs shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
});
