"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { triggerConfetti } from "../effects/confetti";

// ============================================================================
// GUILDOS — Enhanced Konami Code 2.0
// Multiple cheat codes with unique visual effects:
//   • Classic Konami: ↑↑↓↓←→←→BA — 10% discount code
//   • IDDQD: God mode toggle (demo bypass)
//   • IDKFA: Unlock all features temporarily
//   • NES / GB / SNES: Platform-specific easter eggs
// Tracks discovered cheats with counter
// ============================================================================

interface CheatDefinition {
  /** Key sequence to activate (lowercase) */
  sequence: string[];
  /** Display name */
  name: string;
  /** Description shown on activation */
  description: string;
  /** Icon shown in popup */
  icon: string;
  /** Effect handler */
  effect: () => void;
  /** Whether this code can be stacked (true = stays active) */
  persistent?: boolean;
}

export function KonamiListener() {
  const [isActive, setIsActive] = useState(false);
  const [currentCheat, setCurrentCheat] = useState<{
    name: string;
    icon: string;
    description: string;
    isKonami: boolean;
    discountCode?: string;
  } | null>(null);
  const [discoveredCheats, setDiscoveredCheats] = useState<Set<string>>(
    new Set()
  );
  const [godMode, setGodMode] = useState(false);
  const [allUnlocked, setAllUnlocked] = useState(false);
  const [showHud, setShowHud] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateCode = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "1UP-";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }, []);

  // --- Define all cheat codes ---
  const cheatCodes: CheatDefinition[] = [
    {
      sequence: [
        "arrowup",
        "arrowup",
        "arrowdown",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "arrowleft",
        "arrowright",
        "b",
        "a",
      ],
      name: "KONAMI CODE",
      icon: "🕹️",
      description: "10% off your next trade-in",
      effect: () => {
        const code = generateCode();
        setCurrentCheat({
          name: "KONAMI CODE",
          icon: "🕹️",
          description: "10% off your next trade-in",
          isKonami: true,
          discountCode: code,
        });
        setIsActive(true);
        triggerConfetti("rainbow", 150);

        // Record the discount code via API
        fetch("/api/discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            discount_percent: 10.0,
            source: "KONAMI",
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          }),
        }).catch(() => {
          // Silent fail in demo mode
        });
      },
    },
    {
      sequence: ["i", "d", "d", "q", "d"],
      name: "IDDQD",
      icon: "🛡️",
      description: "GOD MODE: Demo restrictions bypassed",
      persistent: true,
      effect: () => {
        setGodMode(true);
        setCurrentCheat({
          name: "IDDQD",
          icon: "🛡️",
          description: "GOD MODE: Demo restrictions bypassed",
          isKonami: false,
        });
        setIsActive(true);
        setShowHud(true);
        triggerConfetti("legendary", 100);

        console.log(
          `%c═══════════════════════════════════════`,
          "color: #9B59B6"
        );
        console.log(
          `%c  IDDQD — GOD MODE ACTIVATED`,
          "color: #9B59B6; font-size: 16px; font-weight: bold;"
        );
        console.log(
          `%c  All demo restrictions bypassed.`,
          "color: #D7BDE2; font-style: italic;"
        );
        console.log(
          `%c═══════════════════════════════════════`,
          "color: #9B59B6"
        );
      },
    },
    {
      sequence: ["i", "d", "k", "f", "a"],
      name: "IDKFA",
      icon: "🔓",
      description: "ALL FEATURES UNLOCKED",
      persistent: true,
      effect: () => {
        setAllUnlocked(true);
        setCurrentCheat({
          name: "IDKFA",
          icon: "🔓",
          description: "ALL FEATURES UNLOCKED",
          isKonami: false,
        });
        setIsActive(true);
        setShowHud(true);
        triggerConfetti("rainbow", 120);

        console.log(
          `%c═══════════════════════════════════════`,
          "color: #FF69B4"
        );
        console.log(
          `%c  IDKFA — ALL FEATURES UNLOCKED`,
          "color: #FF69B4; font-size: 16px; font-weight: bold;"
        );
        console.log(
          `%c  Premium features temporarily available.`,
          "color: #FFB6C1; font-style: italic;"
        );
        console.log(
          `%c═══════════════════════════════════════`,
          "color: #FF69B4"
        );
      },
    },
    {
      sequence: ["n", "e", "s"],
      name: "NES",
      icon: "🕹️",
      description: "It's dangerous to go alone! Take this.",
      effect: () => {
        setCurrentCheat({
          name: "NES",
          icon: "🕹️",
          description: "It's dangerous to go alone! Take this.",
          isKonami: false,
        });
        setIsActive(true);
        triggerConfetti("nintendo", 80);

        console.log(
          `%c[NES] %c▲ ▲ ■ ■ ◆ ◆ ★ ★ ● ●`,
          "color: #E74C3C; font-size: 14px; font-weight: bold;",
          "color: #C0392B;"
        );
        console.log(
          `%c[NES] %cNintendo Entertainment System easter egg found!`,
          "color: #E74C3C;",
          "color: white; font-style: italic;"
        );
      },
    },
    {
      sequence: ["g", "b"],
      name: "GB",
      icon: "🎮",
      description: "Pocket-sized power activated!",
      effect: () => {
        setCurrentCheat({
          name: "GB",
          icon: "🎮",
          description: "Pocket-sized power activated!",
          isKonami: false,
        });
        setIsActive(true);
        triggerConfetti("green", 60);

        console.log(
          `%c[GB] %cDMG-01 MODE ENGAGED`,
          "color: #2ECC71; font-size: 14px; font-weight: bold;",
          "color: #9B59B6;"
        );
        console.log(
          `%c[GB] %c4 shades of green — the way it was meant to be played.`,
          "color: #2ECC71;",
          "color: #82E0AA; font-style: italic;"
        );
      },
    },
    {
      sequence: ["s", "n", "e", "s"],
      name: "SNES",
      icon: "🎮",
      description: "Mode 7 rendering enabled",
      effect: () => {
        setCurrentCheat({
          name: "SNES",
          icon: "🎮",
          description: "Mode 7 rendering enabled",
          isKonami: false,
        });
        setIsActive(true);
        triggerConfetti("sega", 80);

        console.log(
          `%c[SNES] %cMODE 7 ACTIVATED`,
          "color: #3498DB; font-size: 14px; font-weight: bold;",
          "color: #5DADE2;"
        );
        console.log(
          `%c[SNES] %cNow with 16-bit rotation and scaling effects!`,
          "color: #3498DB;",
          "color: white; font-style: italic;"
        );
      },
    },
  ];

  // --- Keydown handler ---
  useEffect(() => {
    // Per-cheat input buffers
    const buffers: Record<string, string[]> = {};
    cheatCodes.forEach((cheat) => {
      buffers[cheat.name] = [];
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Skip if already in a popup
      if (document.querySelector(".cheat-popup-active")) return;

      cheatCodes.forEach((cheat) => {
        const buf = buffers[cheat.name];
        buf.push(key);
        // Keep buffer trimmed to sequence length
        while (buf.length > cheat.sequence.length) buf.shift();

        // Check for match
        if (
          buf.length === cheat.sequence.length &&
          buf.every((k, i) => k === cheat.sequence[i])
        ) {
          // Track discovered cheat
          setDiscoveredCheats((prev) => {
            const next = new Set(prev);
            next.add(cheat.name);
            return next;
          });

          // Fire the effect
          cheat.effect();
          buf.length = 0;

          // Auto-dismiss popup
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setIsActive(false);
            setTimeout(() => setCurrentCheat(null), 300);
          }, 8000);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // --- Per-cheat visual styles ---
  const getCheatStyles = (name: string) => {
    switch (name) {
      case "IDDQD":
        return {
          border: "border-legendary/50",
          shadow:
            "shadow-[0_0_60px_oklch(0.65_0.25_300/30%),0_0_120px_oklch(0.65_0.25_300/15%)]",
          title: "text-legendary text-glow-legendary",
          gradient: "from-legendary/20 via-transparent to-legendary/5",
        };
      case "IDKFA":
        return {
          border: "border-pink-500/50",
          shadow:
            "shadow-[0_0_60px_rgba(236,72,153,0.3),0_0_120px_rgba(236,72,153,0.15)]",
          title: "text-pink-400",
          gradient: "from-pink-500/20 via-transparent to-pink-500/5",
        };
      case "NES":
        return {
          border: "border-faction-nintendo/50",
          shadow:
            "shadow-[0_0_60px_oklch(0.62_0.24_25/30%),0_0_120px_oklch(0.62_0.24_25/15%)]",
          title: "text-faction-nintendo",
          gradient: "from-faction-nintendo/20 via-transparent to-faction-nintendo/5",
        };
      case "GB":
        return {
          border: "border-xp/50",
          shadow:
            "shadow-[0_0_60px_oklch(0.7_0.2_170/30%),0_0_120px_oklch(0.7_0.2_170/15%)]",
          title: "text-xp",
          gradient: "from-xp/20 via-transparent to-xp/5",
        };
      case "SNES":
        return {
          border: "border-faction-sega/50",
          shadow:
            "shadow-[0_0_60px_oklch(0.6_0.2_250/30%),0_0_120px_oklch(0.6_0.2_250/15%)]",
          title: "text-faction-sega",
          gradient: "from-faction-sega/20 via-transparent to-faction-sega/5",
        };
      default:
        return {
          border: "border-primary/40",
          shadow:
            "shadow-[0_0_60px_oklch(0.78_0.3_145/30%),0_0_120px_oklch(0.78_0.3_145/15%)]",
          title: "text-primary text-glow-green",
          gradient: "from-primary/20 via-transparent to-primary/5",
        };
    }
  };

  return (
    <>
      {/* ============ PERMANENT HUD BADGES ============ */}
      {showHud && (
        <div className="fixed top-2 left-2 z-[101] flex gap-2 pointer-events-none">
          {godMode && (
            <div className="bg-legendary/20 border border-legendary/40 rounded px-2 py-1 text-[10px] text-legendary font-bold animate-neon-pulse pointer-events-auto">
              🛡️ GOD MODE
            </div>
          )}
          {allUnlocked && (
            <div className="bg-pink-500/20 border border-pink-500/40 rounded px-2 py-1 text-[10px] text-pink-400 font-bold animate-neon-pulse pointer-events-auto">
              🔓 ALL UNLOCKED
            </div>
          )}
        </div>
      )}

      {/* ============ CHEATS DISCOVERED COUNTER ============ */}
      {discoveredCheats.size > 0 && !isActive && (
        <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 bg-background/60 border border-primary/10 rounded-full px-2.5 py-1 text-[9px] text-muted-foreground/40 select-none pointer-events-none backdrop-blur-sm">
          <span className="text-[10px]">🎮</span>
          <span>
            {discoveredCheats.size} cheat{discoveredCheats.size !== 1 ? "s" : ""}{" "}
            discovered
          </span>
        </div>
      )}

      {/* ============ CHEAT ACTIVATION POPUP ============ */}
      {isActive && currentCheat && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center cheat-popup-active">
          {/* Scanline overlay */}
          <div className="absolute inset-0 crt-overlay" />

          {/* Cheat-specific background glow */}
          {(() => {
            const s = getCheatStyles(currentCheat.name);
            return (
              <div
                className={`absolute inset-0 bg-gradient-radial ${s.gradient} opacity-40`}
              />
            );
          })()}

          {/* Popup card */}
          <div
            className={`relative pointer-events-auto bg-black/95 border-2 ${getCheatStyles(currentCheat.name).border} p-8 rounded-xl ${getCheatStyles(currentCheat.name).shadow} text-center max-w-md mx-4 animate-in zoom-in-95 duration-300`}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsActive(false);
                setTimeout(() => setCurrentCheat(null), 300);
              }}
              className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors text-lg pointer-events-auto"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Icon */}
            <div className="text-5xl mb-3">{currentCheat.icon}</div>

            {/* Title */}
            <h2
              className={`text-3xl font-bold mb-1 ${getCheatStyles(currentCheat.name).title}`}
            >
              {currentCheat.name}
            </h2>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4">
              {currentCheat.description}
            </p>

            {/* Discount code (Konami only) */}
            {currentCheat.isKonami && currentCheat.discountCode && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Your discount code:
                </p>
                <p className="text-2xl font-mono font-bold text-gold text-glow-gold tracking-widest">
                  {currentCheat.discountCode}
                </p>
                <p className="text-xs text-primary/70 mt-1">
                  10% off your next trade-in
                </p>
              </div>
            )}

            {/* Cheats discovered progress */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <span className="text-[10px] text-muted-foreground/50">
                {discoveredCheats.size} / {cheatCodes.length} cheats discovered
              </span>
              {/* Mini progress bar */}
              {discoveredCheats.size > 0 && (
                <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${(discoveredCheats.size / cheatCodes.length) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
