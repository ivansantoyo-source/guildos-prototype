"use client";

import { useState, useEffect, useRef } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { cn } from "@/lib/utils";

// ============================================================================
// GUILDOS — Faction War Real-Time Tracker
// Three progress bars with animated widths
// Live updating numbers (simulated with setInterval in demo mode)
// Crown indicator on current leader
// "X days until resolution" countdown
// Faction logos/colors prominently displayed
// Shows how YOUR faction is doing highlighted
// Percentage of total
// ============================================================================

type FactionKey = "SEGA_SYNDICATE" | "NINTENDO_NOMADS" | "SONY_SENTINELS";

const FACTION_META: Record<
  FactionKey,
  {
    label: string;
    shortLabel: string;
    icon: string;
    color: string;
    bg: string;
    border: string;
    glow: string;
  }
> = {
  SEGA_SYNDICATE: {
    label: "Sega Syndicate",
    shortLabel: "Sega",
    icon: "🔵",
    color: "bg-faction-sega",
    bg: "bg-faction-sega/15",
    border: "border-faction-sega/30",
    glow: "shadow-[0_0_12px_oklch(0.6_0.2_250/20%)]",
  },
  NINTENDO_NOMADS: {
    label: "Nintendo Nomads",
    shortLabel: "Nintendo",
    icon: "🔴",
    color: "bg-faction-nintendo",
    bg: "bg-faction-nintendo/15",
    border: "border-faction-nintendo/30",
    glow: "shadow-[0_0_12px_oklch(0.62_0.24_25/20%)]",
  },
  SONY_SENTINELS: {
    label: "Sony Sentinels",
    shortLabel: "Sony",
    icon: "🟣",
    color: "bg-faction-sony",
    bg: "bg-faction-sony/15",
    border: "border-faction-sony/30",
    glow: "shadow-[0_0_12px_oklch(0.55_0.15_260/20%)]",
  },
};

// Demo user faction — in a real app this comes from the user's profile
const YOUR_FACTION: FactionKey = "SEGA_SYNDICATE";

// Resolution date for the current faction war
const WAR_END_DATE = new Date("2026-07-01T00:00:00Z");

export function FactionWarLive() {
  const standings = useGuildStore((s) => s.factionStandings);
  const [animatedPoints, setAnimatedPoints] = useState<Record<string, number>>(
    {}
  );
  const [displayPoints, setDisplayPoints] = useState<Record<string, string>>(
    {}
  );
  const [timeLeft, setTimeLeft] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStandingsRef = useRef(standings);

  // Initialize animated points from standings
  useEffect(() => {
    if (standings.length > 0) {
      setAnimatedPoints((prev) => {
        const next: Record<string, number> = { ...prev };
        standings.forEach((s) => {
          if (next[s.faction] === undefined) {
            next[s.faction] = s.total_points;
          }
        });
        return next;
      });
    }
  }, [standings]);

  // Animate point counters ticking up
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAnimatedPoints((prev) => {
        const next = { ...prev };
        standings.forEach((s) => {
          const current = next[s.faction] ?? s.total_points;
          const target = s.total_points;
          const diff = target - current;
          // Move 5% toward target each tick, plus small random drift
          const drift = (Math.random() - 0.5) * 8;
          next[s.faction] = Math.max(0, current + diff * 0.05 + drift);
        });
        return next;
      });
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [standings]);

  // Update display strings (only when values change enough)
  useEffect(() => {
    const newDisplay: Record<string, string> = {};
    standings.forEach((s) => {
      const val = animatedPoints[s.faction] ?? s.total_points;
      newDisplay[s.faction] = Math.round(val).toLocaleString();
    });
    setDisplayPoints(newDisplay);
  }, [animatedPoints, standings]);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = WAR_END_DATE.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("Resolution NOW");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      setTimeLeft(`${days}d ${hours}h`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  if (standings.length === 0) {
    return (
      <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70">
            Faction War
          </h3>
          <span className="text-lg">⚔️</span>
        </div>
        <p className="text-xs text-muted-foreground text-center py-6">
          No faction data available. Join a faction to participate!
        </p>
      </div>
    );
  }

  const sorted = [...standings].sort(
    (a, b) => b.total_points - a.total_points
  );
  const maxPoints = Math.max(...sorted.map((s) => s.total_points), 1);
  const totalPoints = sorted.reduce(
    (sum, s) => sum + (animatedPoints[s.faction] ?? s.total_points),
    0
  );
  const leader = sorted[0];

  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70 flex items-center gap-2">
          <span>Faction War</span>
          <span className="text-[10px] bg-amber-950/30 text-gold px-1.5 py-0.5 rounded">
            Season 2
          </span>
        </h3>
        <span className="text-lg">⚔️</span>
      </div>

      {/* Countdown & total */}
      <div className="flex justify-between text-[10px] text-muted-foreground mb-4 pb-3 border-b border-border/20">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {timeLeft} until resolution
        </span>
        <span>
          {Math.round(totalPoints).toLocaleString()} total points
        </span>
      </div>

      {/* Progress bars */}
      <div className="space-y-4">
        {sorted.map((standing) => {
          const faction = standing.faction as FactionKey;
          const meta =
            FACTION_META[faction] ?? {
              label: faction,
              shortLabel: faction,
              icon: "⬜",
              color: "bg-muted",
              bg: "bg-muted/15",
              border: "border-muted/30",
              glow: "",
            };
          const isYours = faction === YOUR_FACTION;
          const isLeader = standing.is_winner;
          const animPoints =
            animatedPoints[faction] ?? standing.total_points;
          const widthPct = (animPoints / maxPoints) * 100;
          const pctOfTotal =
            totalPoints > 0 ? (animPoints / totalPoints) * 100 : 0;

          return (
            <div key={faction}>
              {/* Faction row header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{meta.icon}</span>
                  <span
                    className={cn(
                      "text-xs font-medium truncate",
                      isYours
                        ? "text-primary"
                        : "text-foreground/70",
                      isYours && "text-glow-green"
                    )}
                  >
                    {meta.shortLabel}
                  </span>
                  {isYours && (
                    <span className="ml-0.5 text-[8px] bg-primary/15 text-primary px-1 py-0.5 rounded uppercase font-bold tracking-wider">
                      YOU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isLeader && (
                    <span className="text-xs" title="Current leader">
                      👑
                    </span>
                  )}
                  <span className="text-xs font-mono text-foreground/80 tabular-nums">
                    {displayPoints[faction] ?? Math.round(animPoints).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">
                    {pctOfTotal.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-3 rounded-full overflow-hidden bg-muted/30">
                {/* Animated fill */}
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    meta.color,
                    isYours && meta.glow,
                    isLeader &&
                      "shadow-[0_0_8px_oklch(0.82_0.16_85/30%)]"
                  )}
                  style={{ width: `${widthPct}%` }}
                />
                {/* Ruler marks */}
                {[25, 50, 75].map((mark) => (
                  <div
                    key={mark}
                    className="absolute top-0 bottom-0 w-px bg-border/20"
                    style={{ left: `${mark}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Winner/Loser info */}
      <div className="mt-4 pt-3 border-t border-border/20 flex justify-between items-center text-[10px] text-muted-foreground">
        <span>
          <span className="text-gold font-semibold">{leader.is_winner ? "👑" : "📈"}</span>{" "}
          {FACTION_META[leader.faction as FactionKey]?.shortLabel ?? leader.faction} leading
        </span>
        <span className="text-[9px]">
          {YOUR_FACTION === leader.faction
            ? "Your faction is in the lead!"
            : `${FACTION_META[YOUR_FACTION]?.shortLabel ?? YOUR_FACTION} needs ${
                Math.round(leader.total_points - (animatedPoints[YOUR_FACTION] ?? 0))
                  .toLocaleString()
              } more points`}
        </span>
      </div>
    </div>
  );
}
