"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { ScoreboardEntry } from "@/lib/types";

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
export default function GhostDataLeaderboard() {
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
