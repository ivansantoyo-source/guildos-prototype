"use client";

import React, { useState, useMemo } from "react";
import type { BountyStats } from "@/lib/types";

// ============================================================================
// BOUNTY HUNTER LEADERBOARD
// Sortable table with rank badges, glass card styling, gold accents
// Top 3 hunters get special styling with trophies
// ============================================================================

interface LeaderboardProps {
  hunters: BountyStats[];
  currentProfileId?: string;
  onSelect?: (hunter: BountyStats) => void;
  isLoading?: boolean;
}

type SortKey = "total_fulfilled" | "total_earned" | "reputation_score";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "total_fulfilled", label: "Bounties" },
  { key: "total_earned", label: "Earnings" },
  { key: "reputation_score", label: "Reputation" },
];

const RANK_BADGES = ["🥇", "🥈", "🥉"];

const BountyLeaderboard = React.memo(({
  hunters,
  currentProfileId,
  onSelect,
  isLoading = false,
}: LeaderboardProps) => {
  const [sortBy, setSortBy] = useState<SortKey>("reputation_score");

  const sorted = useMemo(() => {
    return [...hunters].sort((a, b) => {
      switch (sortBy) {
        case "total_fulfilled":
          return b.total_fulfilled - a.total_fulfilled;
        case "total_earned":
          return b.total_earned - a.total_earned;
        case "reputation_score":
          return b.reputation_score - a.reputation_score;
        default:
          return b.reputation_score - a.reputation_score;
      }
    });
  }, [hunters, sortBy]);

  if (isLoading) {
    return (
      <div className="guild-card bg-card border border-gold/20 rounded-xl overflow-hidden">
        <div className="bg-gold/10 px-4 py-3 border-b border-gold/10">
          <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-2 w-16 bg-muted/50 rounded" />
              </div>
              <div className="h-4 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hunters.length === 0) {
    return (
      <div className="guild-card bg-card border border-gold/20 rounded-xl overflow-hidden">
        <div className="bg-gold/10 px-4 py-3 border-b border-gold/10">
          <h3 className="text-sm font-bold text-gold">🏆 Bounty Hunter Leaderboard</h3>
        </div>
        <div className="p-6 text-center">
          <span className="text-4xl block mb-2">🎯</span>
          <p className="text-xs text-muted-foreground">No hunters yet. The first bounty claim starts the leaderboard!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guild-card bg-card border border-gold/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gold/10 px-4 py-3 border-b border-gold/10">
        <h3 className="text-sm font-bold text-gold">🏆 Bounty Hunter Leaderboard</h3>
      </div>

      {/* Sort Controls */}
      <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground uppercase">Sort:</span>
        <div className="flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                sortBy === opt.key
                  ? "bg-gold/20 border border-gold/30 text-gold font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Rows */}
      <div className="divide-y divide-border/30">
        {sorted.map((hunter, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const isCurrentUser = hunter.profile_id === currentProfileId;

          return (
            <div
              key={hunter.id}
              onClick={() => onSelect?.(hunter)}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isCurrentUser
                  ? "bg-gold/5 hover:bg-gold/10"
                  : "hover:bg-muted/30"
              } ${onSelect ? "cursor-pointer" : ""}`}
            >
              {/* Rank */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isTop3
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "bg-muted text-muted-foreground"
              }`}>
                {isTop3 ? RANK_BADGES[rank - 1] : rank}
              </div>

              {/* Hunter Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-bold truncate ${
                    isTop3 ? "text-gold" : "text-foreground"
                  }`}>
                    {hunter.hunter_tag}
                  </span>
                  {isCurrentUser && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary font-bold">YOU</span>
                  )}
                  {isTop3 && rank === 1 && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-gold/20 text-gold font-bold">#1</span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {hunter.total_fulfilled} bounties fulfilled
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="text-sm font-bold text-gold font-mono">
                  ${hunter.total_earned.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {hunter.reputation_score} rep
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
export default BountyLeaderboard;
