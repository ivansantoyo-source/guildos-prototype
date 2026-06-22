"use client";

import React, { useState } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { NexusLfg, ScoreboardEntry } from "@/lib/types";

type NexusTab = "lfg" | "scores" | "rooms";

export default function NexusPage() {
  const [activeTab, setActiveTab] = useState<NexusTab>("lfg");

  const tabs: { id: NexusTab; label: string; icon: string }[] = [
    { id: "lfg", label: "LFG Board", icon: "🎮" },
    { id: "scores", label: "Ghost Data", icon: "🏆" },
    { id: "rooms", label: "Save Rooms", icon: "🔑" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary text-glow-green">🏟️ THE NEXUS</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Community hub · LFG matchmaking · Arcade leaderboards · Space rentals
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "lfg" && <LfgBoard />}
      {activeTab === "scores" && <GhostDataLeaderboard />}
      {activeTab === "rooms" && <SaveRooms />}
    </div>
  );
}

// === LFG BOARD ===
function LfgBoard() {
  const lobbies = useGuildStore((s) => s.lfgLobbies);
  const openLobbies = lobbies.filter((l) => l.lobby_status === "OPEN");
  const activeLobbies = lobbies.filter((l) => l.lobby_status === "IN_PROGRESS");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {openLobbies.length} open · {activeLobbies.length} in progress
        </p>
        <button
          className="px-4 py-1.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          id="btn-create-lobby"
        >
          + CREATE LOBBY
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lobbies.map((lobby) => (
          <LobbyCard key={lobby.id} lobby={lobby} />
        ))}
        {lobbies.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p className="text-lg mb-1">🎮</p>
            <p>No active lobbies. Create one to find players.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LobbyCard({ lobby }: { lobby: NexusLfg }) {
  const isOpen = lobby.lobby_status === "OPEN";
  const isFull = lobby.player_slots_filled >= lobby.player_slots_total;
  const fillPercent = (lobby.player_slots_filled / lobby.player_slots_total) * 100;

  return (
    <div className={`guild-card bg-card rounded-lg overflow-hidden ${
      isOpen ? "border-primary/20" : "border-gold/20"
    }`}>
      <div className={`px-4 py-2 text-xs font-bold tracking-wider flex items-center justify-between ${
        isOpen ? "bg-primary/10 text-primary" : "bg-gold/10 text-gold"
      }`}>
        <span>{isOpen ? "🟢 OPEN" : "🔶 IN PROGRESS"}</span>
        {lobby.console_type && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/30">{lobby.console_type}</span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-base font-bold text-foreground">{lobby.game_title}</h3>
        {lobby.description && (
          <p className="text-xs text-muted-foreground">{lobby.description}</p>
        )}

        {/* Player Slots */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Players</span>
            <span className={isFull ? "text-gold font-bold" : "text-primary"}>
              {lobby.player_slots_filled}/{lobby.player_slots_total}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull ? "bg-gold" : "bg-primary"
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Start Time */}
        {lobby.start_time && (
          <p className="text-[11px] text-muted-foreground">
            ⏰ {new Date(lobby.start_time).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}

        {/* Join Button */}
        {isOpen && !isFull && (
          <button className="w-full py-2 text-xs rounded bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/20 transition-colors">
            JOIN LOBBY
          </button>
        )}
      </div>
    </div>
  );
}

// === GHOST DATA LEADERBOARD ===
function GhostDataLeaderboard() {
  const scoreboards = useGuildStore((s) => s.scoreboards);

  // Group by game
  const gameGroups = scoreboards.reduce<Record<string, ScoreboardEntry[]>>((acc, entry) => {
    const key = `${entry.cabinet_name}|${entry.game_title}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(gameGroups).map(([key, entries]) => {
        const sorted = [...entries].sort((a, b) => b.score - a.score);
        const [cabinet, game] = key.split("|");

        return (
          <div key={key} className="guild-card bg-card rounded-lg overflow-hidden border-primary/20">
            <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-primary">🏆 {game}</h3>
                <p className="text-[11px] text-muted-foreground">{cabinet}</p>
              </div>
              <button className="px-3 py-1 text-[11px] rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors">
                LOG SCORE
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground w-16">Rank</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">Player Tag</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">Score</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-border/30 ${
                        idx === 0 ? "bg-gold/[5%]" : ""
                      }`}
                    >
                      <td className="text-center px-4 py-2.5">
                        {idx === 0 ? (
                          <span className="text-gold text-glow-gold font-bold">👑</span>
                        ) : (
                          <span className="text-muted-foreground">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-foreground">
                        {entry.player_tag}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        <span className={idx === 0 ? "text-gold text-glow-gold" : "text-primary"}>
                          {entry.score.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                        {new Date(entry.logged_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {Object.keys(gameGroups).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">🕹️</p>
          <p>No scoreboards configured. Add a cabinet to get started.</p>
        </div>
      )}
    </div>
  );
}

// === SAVE ROOMS ===
function SaveRooms() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Physical space rental management</p>
      </div>

      {/* Placeholder rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          { name: "Save Room Alpha", status: "AVAILABLE", amenities: ["CRT Display", "Couch", "Premium WiFi"], rate: 15 },
          { name: "Save Room Beta", status: "OCCUPIED", amenities: ["4K Display", "Bean Bags", "Sound System"], rate: 20 },
          { name: "Save Room Omega", status: "RESERVED", amenities: ["Dual CRTs", "Tournament Setup", "Streaming Rig"], rate: 35 },
        ].map((room) => (
          <div key={room.name} className={`guild-card bg-card rounded-lg overflow-hidden ${
            room.status === "AVAILABLE" ? "border-primary/20" : room.status === "OCCUPIED" ? "border-destructive/20" : "border-gold/20"
          }`}>
            <div className={`px-4 py-2 text-xs font-bold tracking-wider ${
              room.status === "AVAILABLE" ? "bg-primary/10 text-primary" :
              room.status === "OCCUPIED" ? "bg-destructive/10 text-destructive" :
              "bg-gold/10 text-gold"
            }`}>
              {room.status === "AVAILABLE" ? "🟢" : room.status === "OCCUPIED" ? "🔴" : "🟡"} {room.status}
            </div>
            <div className="p-4 space-y-3">
              <h3 className="text-base font-bold text-foreground">{room.name}</h3>
              <div className="flex flex-wrap gap-1">
                {room.amenities.map((a) => (
                  <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gold font-mono font-bold">${room.rate}/mo</span>
                {room.status === "AVAILABLE" && (
                  <button className="px-3 py-1 text-[11px] rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors">
                    RESERVE
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
