"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { NexusLfg } from "@/lib/types";
import { demoHref } from "@/lib/utils/url";

// ============================================================
// GAME SUGGESTIONS FOR AUTOCOMPLETE
// ============================================================
const GAME_SUGGESTIONS = [
  "GoldenEye 007", "Super Smash Bros. Melee", "Street Fighter III: 3rd Strike",
  "Mario Kart 64", "Mario Kart: Double Dash", "Halo: Combat Evolved",
  "Tekken 3", "SoulCalibur", "Time Crisis II", "Dance Dance Revolution",
  "NBA Jam", "NFL Blitz", "Perfect Dark", "Super Mario Party",
  "Worms Armageddon", "Crash Team Racing", "Tony Hawk's Pro Skater 2",
  "Mortal Kombat II", "Virtua Fighter 4", "Daytona USA",
];

// ============================================================
// LFG: CREATE LOBBY FORM
// ============================================================
function CreateLobbyForm({ onClose }: { onClose: () => void }) {
  const addLfgLobby = useGuildStore((s) => s.addLfgLobby);
  const [gameTitle, setGameTitle] = useState("");
  const [consoleType, setConsoleType] = useState("N64");
  const [slots, setSlots] = useState(4);
  const [startTime, setStartTime] = useState("");
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (gameTitle.length < 1) { setSuggestions([]); return; }
    const q = gameTitle.toLowerCase();
    setSuggestions(GAME_SUGGESTIONS.filter((g) => g.toLowerCase().includes(q)).slice(0, 5));
  }, [gameTitle]);

  const handleCreate = () => {
    if (!gameTitle.trim()) return;
    setCreating(true);
    setTimeout(() => {
      addLfgLobby({
        id: `lfg-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        creator_id: "usr-001",
        game_title: gameTitle.trim(),
        description: description || undefined,
        console_type: consoleType,
        player_slots_total: slots,
        player_slots_filled: 0,
        max_spectators: 4,
        start_time: startTime || undefined,
        lobby_status: "OPEN",
        created_at: new Date().toISOString(),
      });
      setCreating(false);
      setDone(true);
    }, 500);
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-200">
          <span className="text-5xl block mb-4">🎮</span>
          <h2 className="text-lg font-bold text-primary mb-2">LOBBY CREATED!</h2>
          <p className="text-xs text-muted-foreground">{gameTitle} is now open for players.</p>
          <button onClick={onClose} className="mt-6 px-6 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-primary">🎮 Create LFG Lobby</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">✕</button>
        </div>

        <div className="space-y-4">
          {/* Game Title with Autocomplete */}
          <div className="relative">
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Game Title</label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="e.g. GoldenEye 007"
              className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
              id="input-lobby-game"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg overflow-hidden shadow-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setGameTitle(s); setSuggestions([]); }}
                    className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Console */}
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Console</label>
            <select
              value={consoleType}
              onChange={(e) => setConsoleType(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded text-foreground"
            >
              {["N64", "GAMECUBE", "DREAMCAST", "PS1", "PS2", "SATURN", "SNES", "GENESIS", "PC"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Player Slots */}
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Player Slots</label>
            <input type="number" min={2} max={16} value={slots} onChange={(e) => setSlots(parseInt(e.target.value, 10) || 2)}
              className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground" />
          </div>

          {/* Start Time */}
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Start Time</label>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Casual or competitive? Any rules?"
              className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground resize-none" />
          </div>

          <button onClick={handleCreate} disabled={!gameTitle.trim() || creating}
            className="w-full py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {creating ? "CREATING..." : "➕ CREATE LOBBY"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LFG: LOBBY CARD
// ============================================================
function LobbyCard({ lobby, onJoin, onLeave, onSetReminder, hasJoined }: {
  lobby: NexusLfg; onJoin: () => void; onLeave: () => void; onSetReminder: () => void; hasJoined: boolean;
}) {
  const isOpen = lobby.lobby_status === "OPEN";
  const isFull = lobby.player_slots_filled >= lobby.player_slots_total;
  const fillPercent = (lobby.player_slots_filled / lobby.player_slots_total) * 100;

  // Phantom participant avatars
  const participantAvatars = [
    { tag: "TRON_99", color: "bg-faction-sega" },
    { tag: "PIXEL_QUEEN", color: "bg-faction-nintendo" },
    { tag: "NEO_GEO", color: "bg-faction-sony" },
    { tag: "ARCADE_FURY", color: "bg-primary" },
  ];

  return (
    <div className={`guild-card bg-card rounded-lg overflow-hidden ${isOpen ? "border-primary/20" : "border-gold/20"}`}>
      <div className={`px-4 py-2 text-xs font-bold tracking-wider flex items-center justify-between ${
        isOpen ? "bg-primary/10 text-primary" : "bg-gold/10 text-gold"
      }`}>
        <span>{isOpen ? "🟢 OPEN" : "🔶 IN PROGRESS"}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/30">{lobby.console_type}</span>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-base font-bold text-foreground">{lobby.game_title}</h3>
        {lobby.description && <p className="text-xs text-muted-foreground">{lobby.description}</p>}

        {/* Participant avatars */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: lobby.player_slots_filled }).map((_, i) => {
            const p = participantAvatars[i % participantAvatars.length];
            return (
              <div key={i} className={`w-6 h-6 rounded-full ${p.color} flex items-center justify-center text-[9px] text-white font-bold border border-border`} title={p.tag}>
                {p.tag[0]}
              </div>
            );
          })}
          {Array.from({ length: lobby.player_slots_total - lobby.player_slots_filled }).map((_, i) => (
            <div key={`empty-${i}`} className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] text-muted-foreground">
              ?
            </div>
          ))}
        </div>

        {/* Player Slots */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Players</span>
            <span className={isFull ? "text-gold font-bold" : "text-primary"}>{lobby.player_slots_filled}/{lobby.player_slots_total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-gold" : "bg-primary"}`} style={{ width: `${fillPercent}%` }} />
          </div>
        </div>

        {/* Start Time */}
        {lobby.start_time && (
          <p className="text-[11px] text-muted-foreground">
            ⏰ {new Date(lobby.start_time).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isOpen && !hasJoined && !isFull && (
            <button onClick={onJoin} className="flex-1 py-2 text-xs rounded bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/20 transition-colors">
              JOIN LOBBY
            </button>
          )}
          {isOpen && hasJoined && (
            <button onClick={onLeave} className="flex-1 py-2 text-xs rounded bg-destructive/10 border border-destructive/30 text-destructive font-bold hover:bg-destructive/20 transition-colors">
              LEAVE LOBBY
            </button>
          )}
          {isOpen && (
            <button onClick={onSetReminder} className="px-3 py-2 text-[11px] rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" title="Set Reminder">
              🔔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LFG: LOBBY CHAT
// ============================================================
function LobbyChat({ lobby, onClose }: { lobby: NexusLfg; onClose: () => void }) {
  const [messages, setMessages] = useState<{ user: string; text: string; time: string }[]>([
    { user: "TRON_99", text: "Anyone up for some rounds?", time: "2:30 PM" },
    { user: "PIXEL_QUEEN", text: "I'm in! Let me grab my controller.", time: "2:31 PM" },
    { user: "TRON_99", text: "No Oddjob, remember the rules!", time: "2:32 PM" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { user: "YOU", text: input.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-primary/10 px-4 py-3 flex items-center justify-between border-b border-border">
          <div>
            <p className="text-xs font-bold text-primary">💬 {lobby.game_title} Chat</p>
            <p className="text-[10px] text-muted-foreground">{lobby.player_slots_filled} players</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">✕</button>
        </div>

        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.user === "YOU" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.user === "YOU" ? "bg-primary/20" : "bg-background/50"}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-primary">{msg.user}</span>
                  <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                </div>
                <p className="text-xs text-foreground">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3 flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground" />
          <button onClick={sendMessage} disabled={!input.trim()}
            className="px-3 py-2 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LFG BOARD TAB
// ============================================================
export default function LfgBoard() {
  const lobbies = useGuildStore((s) => s.lfgLobbies);
  const joinLobby = useGuildStore((s) => s.joinLobby);
  const leaveLobby = useGuildStore((s) => s.leaveLobby);

  const [showCreate, setShowCreate] = useState(false);
  const [chatLobby, setChatLobby] = useState<NexusLfg | null>(null);
  const [joinedLobbyIds, setJoinedLobbyIds] = useState<Set<string>>(new Set(["lfg-001"]));
  const [gameFilter, setGameFilter] = useState("");
  const [consoleFilter, setConsoleFilter] = useState("ALL");
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const openLobbies = lobbies.filter((l) => l.lobby_status === "OPEN");
  const activeLobbies = lobbies.filter((l) => l.lobby_status === "IN_PROGRESS");

  const filteredLobbies = useMemo(() => {
    let items = [...lobbies];
    if (gameFilter) {
      const q = gameFilter.toLowerCase();
      items = items.filter((l) => l.game_title.toLowerCase().includes(q));
    }
    if (consoleFilter !== "ALL") {
      items = items.filter((l) => l.console_type === consoleFilter);
    }
    return items;
  }, [lobbies, gameFilter, consoleFilter]);

  const handleSetReminder = useCallback((id: string) => {
    setReminderToast(id);
    setTimeout(() => setReminderToast(null), 2500);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {reminderToast && (
        <div className="fixed top-4 right-4 z-50 bg-card border border-primary/30 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-right duration-200">
          <p className="text-xs text-primary font-bold">🔔 Reminder set!</p>
          <p className="text-[10px] text-muted-foreground">We&apos;ll notify you when it&apos;s time.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{openLobbies.length} open · {activeLobbies.length} in progress</p>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-1.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          id="btn-create-lobby">
          + CREATE LOBBY
        </button>
      </div>

      {/* LFG Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}
          placeholder="Filter by game title..."
          className="flex-1 min-w-[160px] px-3 py-2 text-xs bg-card border border-border rounded guild-input text-foreground placeholder:text-muted-foreground" />
        <select value={consoleFilter} onChange={(e) => setConsoleFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-card border border-border rounded text-foreground">
          {["ALL", "N64", "GAMECUBE", "DREAMCAST", "PS1", "PS2", "SATURN", "SNES", "GENESIS", "PC"].map((c) => (
            <option key={c} value={c}>{c === "ALL" ? "All Consoles" : c}</option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {filteredLobbies.length === 0 && (
        <div className="guild-card bg-card rounded-lg p-12 text-center border-border/20">
          <span className="text-5xl block mb-4">🎮</span>
          <h2 className="text-lg font-bold text-primary mb-2">No Lobbies Found</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {gameFilter || consoleFilter !== "ALL"
              ? "No lobbies match your filters. Try adjusting them."
              : "No active lobbies. Create one to find players."}
          </p>
          {!gameFilter && consoleFilter === "ALL" && (
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
              + CREATE FIRST LOBBY
            </button>
          )}
        </div>
      )}

      {/* Lobby Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLobbies.map((lobby) => (
          <div key={lobby.id} className="relative">
            {/* Chat button */}
            <button
              onClick={(e) => { e.stopPropagation(); setChatLobby(lobby); }}
              className="absolute top-2 right-2 z-10 w-6 h-6 rounded bg-background/80 border border-border flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
              title="Open lobby chat"
            >
              💬
            </button>
            <LobbyCard
              lobby={lobby}
              onJoin={() => { joinLobby(lobby.id); setJoinedLobbyIds((prev) => new Set(prev).add(lobby.id)); }}
              onLeave={() => { leaveLobby(lobby.id); setJoinedLobbyIds((prev) => { const next = new Set(prev); next.delete(lobby.id); return next; }); }}
              onSetReminder={() => handleSetReminder(lobby.id)}
              hasJoined={joinedLobbyIds.has(lobby.id)}
            />
          </div>
        ))}
      </div>

      {/* Create Lobby Modal */}
      {showCreate && <CreateLobbyForm onClose={() => setShowCreate(false)} />}

      {/* Lobby Chat Modal */}
      {chatLobby && <LobbyChat lobby={chatLobby} onClose={() => setChatLobby(null)} />}
    </div>
  );
}
