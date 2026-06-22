"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// GUILDOS — XP Bar Animation
// Animated XP progress bar
// Shows current tier, XP to next tier
// Glow pulse when XP changes
// Used in profile and after trade-ins
// ============================================================================

const TIER_THRESHOLDS: Record<
  string,
  { min: number; max: number; label: string; icon: string }
> = {
  PEASANT: { min: 0, max: 9999, label: "Peasant", icon: "👤" },
  RETRO_MAGE: { min: 10000, max: 24999, label: "Retro Mage", icon: "🧙" },
  TIME_LORD: { min: 25000, max: Infinity, label: "Time Lord", icon: "⏳" },
};

export interface XPBarProps {
  /** Current XP points */
  currentXP: number;
  /** Current level tier key */
  levelTier?: string;
  /** Whether to glow-pulse on XP change */
  animated?: boolean;
  /** Whether to show tier labels and XP count */
  showLabel?: boolean;
  /** Bar height size */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

export function XPBar({
  currentXP,
  levelTier = "PEASANT",
  animated = true,
  showLabel = true,
  size = "md",
  className,
}: XPBarProps) {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const [glow, setGlow] = useState(false);
  const prevXPRef = useRef(currentXP);
  const animFrameRef = useRef<number>(0);

  // Animate XP counter changes and trigger glow
  useEffect(() => {
    if (prevXPRef.current !== currentXP) {
      // Trigger glow pulse
      setGlow(true);
      const glowTimer = setTimeout(() => setGlow(false), 1500);

      // Animate numeric counter
      const startVal = prevXPRef.current;
      const diff = currentXP - startVal;
      const duration = diff > 1000 ? 2000 : 1000; // faster for small changes
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayXP(Math.round(startVal + diff * eased));
        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);

      prevXPRef.current = currentXP;
      return () => {
        clearTimeout(glowTimer);
        cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [currentXP]);

  // Determine tier info
  const tiers = Object.entries(TIER_THRESHOLDS);
  const currentTierInfo = tiers.find(([key]) => key === levelTier) ?? tiers[0];
  const currentTier = currentTierInfo[1];
  const nextTierIndex =
    tiers.findIndex(([key]) => key === levelTier) + 1;
  const nextTier =
    nextTierIndex < tiers.length ? tiers[nextTierIndex][1] : null;

  // Calculate progress within current tier
  const tierXP = currentXP - currentTier.min;
  const tierMax = nextTier ? nextTier.min - currentTier.min : 1;
  const rawProgress = (tierXP / tierMax) * 100;
  const progressPct = Math.min(Math.max(rawProgress, 0), 100);

  // Size classes
  const barHeight: Record<string, string> = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const fontSize: Record<string, string> = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Label row */}
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs shrink-0">
              {currentTier.icon}
            </span>
            <span
              className={cn(
                "font-semibold text-xp truncate",
                fontSize[size]
              )}
            >
              {currentTier.label}
            </span>
            {nextTier && (
              <span
                className={cn(
                  "text-muted-foreground/40 hidden sm:inline",
                  fontSize[size]
                )}
              >
                → {nextTier.label}
              </span>
            )}
          </div>
          <span
            className={cn(
              "text-muted-foreground font-mono tabular-nums",
              fontSize[size]
            )}
          >
            {displayXP.toLocaleString()}
            <span className="text-muted-foreground/40"> XP</span>
          </span>
        </div>
      )}

      {/* XP bar track */}
      <div
        className={cn(
          "w-full bg-muted/40 rounded-full overflow-hidden",
          barHeight[size]
        )}
      >
        {/* Animated fill */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            "bg-gradient-to-r from-xp/80 to-xp",
            glow &&
              animated &&
              "shadow-[0_0_8px_oklch(0.7_0.2_170/50%),0_0_20px_oklch(0.7_0.2_170/25%)]"
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* XP to next tier */}
      {showLabel && nextTier && (
        <div className="flex justify-between mt-0.5">
          <span className={cn("text-muted-foreground/40", fontSize[size])}>
            {nextTier
              ? `${(tierMax - tierXP).toLocaleString()} XP to ${nextTier.label}`
              : "Max level reached"}
          </span>
          <span className={cn("text-muted-foreground/40 tabular-nums", fontSize[size])}>
            {Math.round(progressPct)}%
          </span>
        </div>
      )}
    </div>
  );
}
