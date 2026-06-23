"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const LfgBoard = dynamic(() => import("@/components/nexus/lfg-board"), {
  loading: () => <TabSkeleton />,
  ssr: false,
});
const GhostDataLeaderboard = dynamic(() => import("@/components/nexus/ghost-data-leaderboard"), {
  loading: () => <TabSkeleton />,
  ssr: false,
});
const SaveRoomsPanel = dynamic(() => import("@/components/nexus/save-rooms-panel"), {
  loading: () => <TabSkeleton />,
  ssr: false,
});

type NexusTab = "lfg" | "scores" | "rooms";

// ============================================================
// MAIN NEXUS PAGE
// ============================================================
export default function NexusPage() {
  const [activeTab, setActiveTab] = useState<NexusTab>("lfg");

  const tabs: { id: NexusTab; label: string; icon: string }[] = [
    { id: "lfg", label: "LFG Board", icon: "🎮" },
    { id: "scores", label: "Ghost Data", icon: "🏆" },
    { id: "rooms", label: "Save Rooms", icon: "🔑" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary text-glow-green">🏟️ THE NEXUS</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Community hub · LFG matchmaking · Arcade leaderboards · Space rentals
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "lfg" && <LfgBoard />}
      {activeTab === "scores" && <GhostDataLeaderboard />}
      {activeTab === "rooms" && <SaveRoomsPanel />}
    </div>
  );
}

// ============================================================
// TAB SKELETON (loading state)
// ============================================================
function TabSkeleton() {
  return (
    <div className="guild-card bg-card rounded-lg p-8 border-border/20 animate-pulse space-y-3">
      <div className="h-5 w-36 bg-muted rounded" />
      <div className="h-4 w-64 bg-muted rounded" />
      <div className="h-3 w-48 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-muted/50 rounded" />
        ))}
      </div>
    </div>
  );
}
