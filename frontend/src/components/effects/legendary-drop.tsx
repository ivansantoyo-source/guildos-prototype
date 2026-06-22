"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { triggerConfetti } from "./confetti";

// ============================================================================
// GUILDOS — Legendary Drop Effect
// Golden light rays emanating from center
// Floating particle dust, item name/value with gold glow
// Typewriter "LEGENDARY ACQUIRED" text
// Triggers IoT simulation (logged to console)
// Auto-dismiss after 5 seconds or click to dismiss
// ============================================================================

export interface LegendaryDropData {
  itemName: string;
  marketValue: number;
  platform: string;
  condition: string;
  itemId?: string;
}

const LEGENDARY_EVENT = "guildos:legendary-drop";

/**
 * Trigger a legendary drop celebration from anywhere.
 */
export function triggerLegendaryDrop(data: LegendaryDropData) {
  const event = new CustomEvent(LEGENDARY_EVENT, { detail: data });
  window.dispatchEvent(event);
}

// --- Typewriter text effect ---

function TypewriterText({
  text,
  speed = 50,
  className = "",
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span className="animate-pulse text-gold/70">|</span>
      )}
    </span>
  );
}

// --- Golden ray lines ---

function GoldenRays() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div
            className="w-[2px] h-[300px] bg-gradient-to-b from-gold/40 via-gold/10 to-transparent rounded-full animate-golden-ray origin-bottom"
            style={{
              transform: `translateY(-150px) rotate(${i * 30}deg)`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: "1.5s",
            }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes animate-golden-ray {
          0% { opacity: 0; transform: translateY(-150px) rotate(var(--rotation)) scaleY(0.3); }
          50% { opacity: 1; }
          100% { opacity: 0.2; transform: translateY(-150px) rotate(var(--rotation)) scaleY(1); }
        }
        .animate-golden-ray {
          animation: animate-golden-ray 3s ease-in-out infinite;
          --rotation: 0deg;
        }
        .animate-golden-ray:nth-child(odd) {
          animation-direction: reverse;
        }
      `}</style>
    </div>
  );
}

// --- Dust particles ---

interface DustParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
}

function FloatingDust() {
  const [particles, setParticles] = useState<DustParticle[]>([]);

  useEffect(() => {
    const p = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      size: 2 + Math.random() * 5,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 4,
      driftX: (Math.random() - 0.5) * 60,
    }));
    setParticles(p);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-gold/40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `legendary-dust-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            filter: "blur(0.5px)",
            "--drift-x": `${p.driftX}px`,
          } as React.CSSProperties}
        />
      ))}
      <style jsx>{`
        @keyframes legendary-dust-float {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.2; }
          25% { transform: translateY(-15px) translateX(calc(var(--drift-x) * 0.3)) scale(1.2); opacity: 0.8; }
          50% { transform: translateY(-35px) translateX(calc(var(--drift-x) * 0.6)) scale(1.5); opacity: 0.6; }
          75% { transform: translateY(-50px) translateX(calc(var(--drift-x) * 0.8)) scale(0.8); opacity: 0.3; }
          100% { transform: translateY(-70px) translateX(var(--drift-x)) scale(0.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// --- Main component ---

export function LegendaryDropOverlay() {
  const [data, setData] = useState<LegendaryDropData | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LegendaryDropData>).detail;
      setData(detail);
      setVisible(true);
      setDismissed(false);

      // Fire gold confetti
      triggerConfetti("gold", 120);

      // IoT simulation — styled console logging
      console.log(
        `%c═══════════════════════════════════════`,
        "color: #FFD700"
      );
      console.log(
        `%c  LEGENDARY DROP DETECTED`,
        "color: #FFD700; font-size: 16px; font-weight: bold;"
      );
      console.log(
        `%c  ${detail.itemName} %c— %c$${detail.marketValue}`,
        "color: #FFD700; font-weight: bold;",
        "color: white;",
        "color: #FFA500; font-weight: bold;"
      );
      console.log(
        `%c  Platform: ${detail.platform} | Condition: ${detail.condition}`,
        "color: #B8860B; font-style: italic;"
      );
      console.log(
        `%c  >>> IoT Trigger <<<  Light: Pulsing #FFD700 for 3s | Audio: legendary_drop.mp3`,
        "color: #8E44AD; font-weight: bold; font-size: 12px;"
      );
      console.log(
        `%c═══════════════════════════════════════`,
        "color: #FFD700"
      );

      // Auto-dismiss
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setData(null), 500);
      }, 5000);
    };

    window.addEventListener(LEGENDARY_EVENT, handler);
    return () => {
      window.removeEventListener(LEGENDARY_EVENT, handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => setData(null), 500);
    }, 300);
  }, []);

  if (!data) return null;

  return (
    <div
      className={`fixed inset-0 z-[95] flex items-center justify-center transition-all duration-500 cursor-pointer ${
        visible && !dismissed ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${dismissed ? "scale-95" : ""}`}
      onClick={handleDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Golden light rays */}
      <GoldenRays />

      {/* Floating dust */}
      <FloatingDust />

      {/* Center card */}
      <div
        className="relative bg-card/95 border-2 border-gold/40 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-[0_0_80px_oklch(0.82_0.16_85/30%),0_0_160px_oklch(0.82_0.16_85/15%)] animate-in zoom-in-95 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="absolute top-3 right-3 text-muted-foreground hover:text-gold transition-colors text-lg"
          aria-label="Dismiss"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="text-5xl mb-2 animate-bounce">💎</div>

        {/* Typewriter title */}
        <h2 className="text-2xl font-bold mb-2 h-8">
          <TypewriterText
            text="LEGENDARY ACQUIRED"
            speed={60}
            className="text-gold text-glow-gold"
          />
        </h2>

        {/* Item info card */}
        <div className="bg-gold/10 border border-gold/20 rounded-lg p-5 my-4">
          <p className="text-xl font-bold text-gold text-glow-gold">
            {data.itemName}
          </p>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="bg-gold/10 px-2 py-0.5 rounded">
              {data.platform}
            </span>
            <span className="bg-gold/10 px-2 py-0.5 rounded">
              {data.condition}
            </span>
          </div>
          <p className="text-4xl font-bold text-gold mt-3 text-glow-gold">
            ${data.marketValue.toLocaleString()}
          </p>
        </div>

        {/* IoT indicator */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-legendary/60 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-legendary animate-pulse" />
          <span>IoT trigger fired — lights pulsing</span>
        </div>

        <p className="text-[10px] text-muted-foreground/50">
          Click anywhere to dismiss
        </p>
      </div>
    </div>
  );
}
