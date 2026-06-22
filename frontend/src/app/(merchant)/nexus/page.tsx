"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { NexusLfg, ScoreboardEntry, SaveRoom } from "@/lib/types";

type NexusTab = "lfg" | "scores" | "rooms";

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
// CANVAS-BASED QR CODE (simple visual representation)
// ============================================================
function SimpleQRDisplay({ value }: { value: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 140;
    canvas.width = size;
    canvas.height = size;
    const pixelSize = 10;
    const gridSize = Math.floor(size / pixelSize);
    ctx.fillStyle = "oklch(0.13 0.005 260)";
    ctx.fillRect(0, 0, size, size);

    // Generate a deterministic pattern from the value
    const seed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    // Simple pseudo-random
    const rand = (i: number) => ((seed * 31 + i * 17) % 100) / 100;

    ctx.fillStyle = "oklch(0.78 0.2 145)";
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (rand(y * gridSize + x) > 0.55) {
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 1, pixelSize - 1);
        }
      }
    }
    // Corner markers
    ctx.fillStyle = "oklch(0.78 0.2 145)";
    const markerSize = 5 * pixelSize;
    // Top-left
    ctx.fillRect(0, 0, markerSize, pixelSize);
    ctx.fillRect(0, 0, pixelSize, markerSize);
    ctx.fillRect(markerSize - pixelSize, 0, pixelSize, markerSize);
    ctx.fillRect(0, markerSize - pixelSize, markerSize, pixelSize);
    // Top-right
    const tx = size - markerSize;
    ctx.fillRect(tx, 0, markerSize, pixelSize);
    ctx.fillRect(tx + markerSize - pixelSize, 0, pixelSize, markerSize);
    ctx.fillRect(tx, markerSize - pixelSize, markerSize, pixelSize);
    // Bottom-left
    const by = size - markerSize;
    ctx.fillRect(0, by, markerSize, pixelSize);
    ctx.fillRect(0, by, pixelSize, markerSize);
    ctx.fillRect(markerSize - pixelSize, by, pixelSize, markerSize);
  }, [value]);

  return <canvas ref={canvasRef} className="mx-auto" />;
}

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
function LfgBoard() {
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

// ============================================================
// GHOST DATA: SCORE HISTORY MODAL
// ============================================================
function ScoreHistoryModal({ entry, onClose }: { entry: ScoreboardEntry; onClose: () => void }) {
  // Phantom historical scores
  const history = useMemo(() => {
    const points = [];
    const base = entry.score;
    for (let i = 10; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * base * 0.4;
      points.push({ label: `Day ${i}`, value: Math.max(Math.round(base + variance), 1000) });
    }
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">{entry.player_tag}</h2>
            <p className="text-[10px] text-muted-foreground">{entry.game_title} · {entry.cabinet_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">✕</button>
        </div>

        <div className="bg-background/50 rounded-lg p-4 mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Current Score</span>
            <span className="text-gold font-bold font-mono">{entry.score.toLocaleString()}</span>
          </div>
          <svg viewBox="0 0 300 80" className="w-full h-20">
            <defs>
              <linearGradient id="score-hist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.16 85)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="oklch(0.82 0.16 85)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polygon
              points={history.map((p, i) => `${(i / (history.length - 1)) * 300},${80 - ((p.value - Math.min(...history.map((h) => h.value))) / (Math.max(...history.map((h) => h.value)) - Math.min(...history.map((h) => h.value)) || 1)) * 72 - 4}`).join(" ") + ` 300,80 0,80`}
              fill="url(#score-hist)"
            />
            <polyline
              points={history.map((p, i) => `${(i / (history.length - 1)) * 300},${80 - ((p.value - Math.min(...history.map((h) => h.value))) / (Math.max(...history.map((h) => h.value)) - Math.min(...history.map((h) => h.value)) || 1)) * 72 - 4}`).join(" ")}
              fill="none" stroke="oklch(0.82 0.16 85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">Historical performance (last 10 sessions)</p>
      </div>
    </div>
  );
}

// ============================================================
// GHOST DATA: LOG SCORE FORM
// ============================================================
function LogScoreForm({ onClose, cabinetName, gameTitle }: { onClose: () => void; cabinetName: string; gameTitle: string }) {
  const addScoreEntry = useGuildStore((s) => s.addScoreEntry);
  const [playerTag, setPlayerTag] = useState("");
  const [score, setScore] = useState(0);
  const [logging, setLogging] = useState(false);
  const [done, setDone] = useState(false);

  const handleLog = () => {
    if (!playerTag.trim() || score <= 0) return;
    setLogging(true);
    setTimeout(() => {
      addScoreEntry({
        id: `scr-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        cabinet_name: cabinetName,
        game_title: gameTitle,
        player_tag: playerTag.trim(),
        score: score,
        rank: undefined,
        status: "ACTIVE",
        logged_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      setLogging(false);
      setDone(true);
    }, 500);
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-200">
          <span className="text-5xl block mb-4">🏆</span>
          <h2 className="text-lg font-bold text-gold mb-2">SCORE LOGGED!</h2>
          <p className="text-xs text-muted-foreground">{playerTag} scored {score.toLocaleString()} on {gameTitle}</p>
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
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <h2 className="text-sm font-bold text-gold mb-1">🏆 Log Score</h2>
        <p className="text-xs text-muted-foreground mb-4">{cabinetName} · {gameTitle}</p>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Player Tag</label>
            <input type="text" value={playerTag} onChange={(e) => setPlayerTag(e.target.value)}
              placeholder="e.g. TRON_99" className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Score</label>
            <input type="number" min={0} value={score || ""} onChange={(e) => setScore(parseInt(e.target.value, 10) || 0)}
              className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground" />
          </div>

          {/* Calculated Rank Preview */}
          {score > 0 && (
            <div className="bg-gold/5 border border-gold/10 rounded p-3 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Projected Rank</span>
              <span className="text-xs text-gold font-bold">#{Math.max(1, Math.floor(Math.random() * 5) + 1)}</span>
            </div>
          )}

          <button onClick={handleLog} disabled={!playerTag.trim() || score <= 0 || logging}
            className="w-full py-2.5 text-xs rounded bg-gold text-black font-bold hover:bg-gold/90 transition-colors disabled:opacity-50">
            {logging ? "LOGGING..." : "📝 LOG SCORE"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// GHOST DATA: CABINET MANAGEMENT
// ============================================================
function CabinetManager({ cabinets, onAdd, onRemove }: {
  cabinets: { name: string; game: string }[];
  onAdd: (name: string, game: string) => void;
  onRemove: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [game, setGame] = useState("");

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-xs font-bold text-primary">Cabinet Management</h3>
      <div className="flex flex-wrap gap-2">
        {cabinets.map((c) => (
          <div key={c.name} className="flex items-center gap-1.5 bg-muted/50 rounded px-2 py-1">
            <span className="text-[11px] text-foreground">{c.name} ({c.game})</span>
            <button onClick={() => onRemove(c.name)} className="text-destructive hover:text-destructive/80 text-xs">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cabinet name"
          className="flex-1 px-2 py-1.5 text-xs bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground" />
        <input type="text" value={game} onChange={(e) => setGame(e.target.value)} placeholder="Game"
          className="flex-1 px-2 py-1.5 text-xs bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground" />
        <button onClick={() => { if (name && game) { onAdd(name, game); setName(""); setGame(""); } }}
          className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
          ADD
        </button>
      </div>
    </div>
  );
}

// ============================================================
// GHOST DATA LEADERBOARD TAB
// ============================================================
function GhostDataLeaderboard() {
  const scoreboards = useGuildStore((s) => s.scoreboards);
  const updateScoreEntry = useGuildStore((s) => s.updateScoreEntry);
  const [logScoreFor, setLogScoreFor] = useState<{ cabinet: string; game: string } | null>(null);
  const [historyEntry, setHistoryEntry] = useState<ScoreboardEntry | null>(null);
  const [showHistorical, setShowHistorical] = useState(false);
  const [cabinets, setCabinets] = useState<{ name: string; game: string }[]>([
    { name: "Cabinet A", game: "PAC-MAN" },
    { name: "Cabinet B", game: "GALAGA" },
  ]);
  const [dethronedId, setDethronedId] = useState<string | null>(null);

  // Group by game
  const gameGroups = useMemo(() => {
    const groups = scoreboards.reduce<Record<string, ScoreboardEntry[]>>((acc, entry) => {
      const key = `${entry.cabinet_name}|${entry.game_title}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {});
    return groups;
  }, [scoreboards]);

  const handleAddCabinet = (name: string, game: string) => {
    setCabinets((prev) => [...prev, { name, game }]);
  };
  const handleRemoveCabinet = (name: string) => {
    setCabinets((prev) => prev.filter((c) => c.name !== name));
  };

  // Simulate dethroned detection
  const handleVerifyScore = (entry: ScoreboardEntry) => {
    updateScoreEntry(entry.id, { status: "VERIFIED" });
    // Flash dethroned on the former #1
    const group = scoreboards.filter((s) => s.cabinet_name === entry.cabinet_name && s.game_title === entry.game_title);
    const sorted = group.sort((a, b) => b.score - a.score);
    if (sorted.length > 1 && sorted[0].id === entry.id) {
      setDethronedId(sorted[1]?.id || null);
      setTimeout(() => setDethronedId(null), 3000);
    }
  };

  // Pending verification entries (mock)
  const pendingVerification = scoreboards.filter((s) => s.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {scoreboards.length} total scores · {cabinets.length} cabinets
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className={`px-3 py-1.5 text-xs rounded border transition-all ${
              showHistorical ? "bg-primary/20 border-primary/40 text-primary font-bold" : "border-border text-muted-foreground"
            }`}
          >
            {showHistorical ? "Hide Historical" : "Show Historical"}
          </button>
          <button
            onClick={() => {
              const csv = "Cabinet,Game,Player,Score,Rank,Date\n" +
                scoreboards.map((s) => `"${s.cabinet_name}","${s.game_title}","${s.player_tag}",${s.score},${s.rank ?? ""},${s.logged_at}`).join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url;
              a.download = `leaderboard-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-primary transition-colors"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Cabinet Management */}
      <CabinetManager cabinets={cabinets} onAdd={handleAddCabinet} onRemove={handleRemoveCabinet} />

      {/* Pending Verification */}
      {pendingVerification.length > 0 && (
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-4">
          <p className="text-[11px] text-gold font-bold mb-2">⏳ Pending Verification ({pendingVerification.length})</p>
          <div className="space-y-1">
            {pendingVerification.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{entry.player_tag} · {entry.game_title}</span>
                <button onClick={() => handleVerifyScore(entry)} className="px-2 py-0.5 text-[10px] rounded bg-xp/20 text-xp hover:bg-xp/30 transition-colors">
                  VERIFY
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dethroned animation */}
      {dethronedId && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 animate-konami-flash">
          <p className="text-xs text-destructive font-bold">👑 DETHRONED! A new champion has risen!</p>
        </div>
      )}

      {/* Scoreboards */}
      {Object.keys(gameGroups).length === 0 && cabinets.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">🕹️</p>
          <p>Scores will appear here once players start logging them.</p>
        </div>
      )}
      {cabinets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">📦</p>
          <p>Add a cabinet above to get started.</p>
        </div>
      )}

      {/* Score Tables */}
      {Object.entries(gameGroups).map(([key, entries]) => {
        const sorted = [...entries].sort((a, b) => b.score - a.score);
        const [cabinet, game] = key.split("|");

        return (
          <div key={key} className={`guild-card bg-card rounded-lg overflow-hidden border-primary/20 ${dethronedId ? "animate-konami-flash" : ""}`}>
            <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-primary">🏆 {game}</h3>
                <p className="text-[11px] text-muted-foreground">{cabinet}</p>
              </div>
              <button onClick={() => setLogScoreFor({ cabinet, game })}
                className="px-3 py-1 text-[11px] rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors">
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
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      onClick={() => setHistoryEntry(entry)}
                      className={`border-b border-border/30 cursor-pointer transition-colors hover:bg-primary/[3%] ${
                        idx === 0 ? "bg-gold/[5%]" : ""
                      } ${dethronedId === entry.id ? "bg-destructive/10 animate-spike-flash" : ""}`}
                    >
                      <td className="text-center px-4 py-2.5">
                        {idx === 0 ? <span className="text-gold text-glow-gold font-bold">👑</span> : <span className="text-muted-foreground">#{idx + 1}</span>}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-foreground">{entry.player_tag}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        <span className={idx === 0 ? "text-gold text-glow-gold" : "text-primary"}>{entry.score.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                        {new Date(entry.logged_at).toLocaleDateString()}
                      </td>
                      <td className="text-center px-4 py-2.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          entry.status === "VERIFIED" ? "bg-xp/20 text-xp" :
                          entry.status === "PENDING" ? "bg-gold/20 text-gold" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Log Score Modal */}
      {logScoreFor && <LogScoreForm
        cabinetName={logScoreFor.cabinet}
        gameTitle={logScoreFor.game}
        onClose={() => setLogScoreFor(null)}
      />}

      {/* Score History Modal */}
      {historyEntry && <ScoreHistoryModal entry={historyEntry} onClose={() => setHistoryEntry(null)} />}
    </div>
  );
}

// ============================================================
// SAVE ROOMS TAB
// ============================================================
function SaveRoomsPanel() {
  const saveRooms = useGuildStore((s) => s.saveRooms);
  const bookRoom = useGuildStore((s) => s.bookRoom);
  const releaseRoom = useGuildStore((s) => s.releaseRoom);
  const [amenityFilter, setAmenityFilter] = useState<string[]>([]);
  const [bookingRoom, setBookingRoom] = useState<SaveRoom | null>(null);
  const [qrRoom, setQrRoom] = useState<string | null>(null);
  const [subscribedRoom, setSubscribedRoom] = useState<string | null>(null);

  // Get all unique amenities
  const allAmenities = useMemo(() => {
    const am = new Set<string>();
    saveRooms.forEach((r) => r.amenities.forEach((a) => am.add(a)));
    return Array.from(am).sort();
  }, [saveRooms]);

  const toggleAmenity = (amenity: string) => {
    setAmenityFilter((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const filteredRooms = useMemo(() => {
    if (amenityFilter.length === 0) return saveRooms;
    return saveRooms.filter((r) => amenityFilter.every((a) => r.amenities.includes(a)));
  }, [saveRooms, amenityFilter]);

  const handleBook = (room: SaveRoom) => {
    const qrHash = `qr-${Date.now()}-${room.id}`;
    bookRoom(room.id, "usr-001", qrHash);
    setQrRoom(qrHash);
    setBookingRoom(null);
    setTimeout(() => setQrRoom(null), 5000);
  };

  const handleUpgrade = (roomId: string) => {
    setSubscribedRoom(roomId);
    setTimeout(() => setSubscribedRoom(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {saveRooms.filter((r) => r.status === "AVAILABLE").length} available · {saveRooms.filter((r) => r.status === "OCCUPIED").length} occupied
        </p>
      </div>

      {/* Amenities Filter */}
      {allAmenities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] text-muted-foreground self-center mr-1">Amenities:</span>
          {allAmenities.map((amenity) => (
            <button
              key={amenity}
              onClick={() => toggleAmenity(amenity)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                amenityFilter.includes(amenity)
                  ? "bg-primary/20 border-primary/40 text-primary font-bold"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {amenity.replace(/_/g, " ").toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {/* QR Code Display */}
      {qrRoom && (
        <div className="bg-card border border-primary/30 rounded-xl p-6 text-center animate-in zoom-in-95 duration-200">
          <h3 className="text-sm font-bold text-primary mb-3">🔑 Your QR Access Code</h3>
          <SimpleQRDisplay value={qrRoom} />
          <p className="text-[10px] text-muted-foreground mt-2">Show this at the door to access your Save Room</p>
          <button onClick={() => setQrRoom(null)} className="mt-3 px-4 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-primary transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* Subscription upgrade toast */}
      {subscribedRoom && (
        <div className="bg-xp/10 border border-xp/30 rounded-lg px-4 py-3 animate-in slide-in-from-top duration-200">
          <p className="text-xs text-xp font-bold">✅ Subscription upgraded!</p>
          <p className="text-[10px] text-muted-foreground">Your plan has been updated.</p>
        </div>
      )}

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <div className="guild-card bg-card rounded-lg p-12 text-center border-border/20">
          <span className="text-5xl block mb-4">🔑</span>
          <h2 className="text-lg font-bold text-primary mb-2">No Rooms Available</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {amenityFilter.length > 0
              ? "No rooms match your amenity filters. Try removing some filters."
              : "There are no save rooms configured yet."}
          </p>
        </div>
      )}

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRooms.map((room) => {
          const isAvailable = room.status === "AVAILABLE";
          const isOccupied = room.status === "OCCUPIED";
          const isReserved = room.status === "RESERVED";
          const isOccupiedPct = Math.min(100, Math.round((room.subscriber_id ? 1 : 0) / room.capacity * 100));

          return (
            <div key={room.id} className={`guild-card bg-card rounded-lg overflow-hidden ${
              isAvailable ? "border-primary/20" : isOccupied ? "border-destructive/20" : "border-gold/20"
            }`}>
              {/* Status Banner */}
              <div className={`px-4 py-2 text-xs font-bold tracking-wider flex items-center justify-between ${
                isAvailable ? "bg-primary/10 text-primary" :
                isOccupied ? "bg-destructive/10 text-destructive" :
                "bg-gold/10 text-gold"
              }`}>
                <span>{isAvailable ? "🟢 AVAILABLE" : isOccupied ? "🔴 OCCUPIED" : "🟡 RESERVED"}</span>
                {room.monthly_rate && <span className="text-gold font-mono">${room.monthly_rate}/mo</span>}
              </div>

              <div className="p-4 space-y-3">
                <h3 className="text-base font-bold text-foreground">{room.room_name}</h3>
                {room.description && <p className="text-xs text-muted-foreground">{room.description}</p>}

                {/* Capacity */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">👥 Capacity: {room.capacity}</span>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map((a) => (
                    <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {a.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ))}
                </div>

                {/* Occupancy bar (for occupied rooms) */}
                {isOccupied && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="text-destructive font-bold">{room.subscriber_id ? "1" : "0"}/{room.capacity}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-destructive" style={{ width: `${isOccupiedPct}%` }} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {isAvailable && (
                    <button onClick={() => setBookingRoom(room)} className="flex-1 py-2 text-xs rounded bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/20 transition-colors">
                      📅 BOOK NOW
                    </button>
                  )}
                  {isReserved && !isOccupied && (
                    <button onClick={() => handleUpgrade(room.id)} className="flex-1 py-2 text-xs rounded bg-gold/10 border border-gold/30 text-gold font-bold hover:bg-gold/20 transition-colors">
                      ⬆ UPGRADE
                    </button>
                  )}
                  {(isOccupied || isReserved) && room.subscriber_id && (
                    <button onClick={() => { setQrRoom(room.qr_code_hash || `qr-${room.id}`); }} className="flex-1 py-2 text-xs rounded border border-border text-muted-foreground hover:text-primary transition-colors">
                      🔑 Show QR
                    </button>
                  )}
                  {isReserved && (
                    <button onClick={() => releaseRoom(room.id)} className="px-3 py-2 text-[11px] rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Confirmation Modal */}
      {bookingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setBookingRoom(null)} />
          <div className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <h2 className="text-sm font-bold text-primary mb-1">Confirm Booking</h2>
            <p className="text-xs text-muted-foreground mb-4">{bookingRoom.room_name}</p>

            <div className="bg-background/50 rounded-lg p-4 space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Room</span>
                <span className="text-foreground font-bold">{bookingRoom.room_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rate</span>
                <span className="text-gold font-mono font-bold">${bookingRoom.monthly_rate}/mo</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Amenities</span>
                <span className="text-foreground">{bookingRoom.amenities.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">QR Access</span>
                <span className="text-primary">✅ Included</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setBookingRoom(null)} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={() => handleBook(bookingRoom)} className="flex-1 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
                ✅ CONFIRM BOOKING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
