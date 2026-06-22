"use client";

import { useEffect, useRef, useCallback } from "react";

// ============================================================================
// GUILDOS — Particle / Confetti System
// Canvas-based confetti explosion with physics simulation
// Triggered by: legendary drop, level-up, bounty fulfilled, faction win, Konami
// ============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  opacity: number;
  fadeSpeed: number;
  gravity: number;
  shape: "rect" | "circle" | "star" | "triangle";
}

export type ConfettiColor =
  | "gold"
  | "legendary"
  | "green"
  | "sega"
  | "nintendo"
  | "sony"
  | "rainbow";

const COLOR_MAP: Record<ConfettiColor, string[]> = {
  gold: ["#FFD700", "#FFA500", "#FFC125", "#FFF4B0", "#DAA520"],
  legendary: ["#9B59B6", "#8E44AD", "#D7BDE2", "#AF7AC5", "#BB8FCE"],
  green: ["#2ECC71", "#27AE60", "#82E0AA", "#58D68D", "#1ABC9C"],
  sega: ["#3498DB", "#2980B9", "#85C1E9", "#5DADE2", "#1F618D"],
  nintendo: ["#E74C3C", "#C0392B", "#F1948A", "#EC7063", "#922B21"],
  sony: ["#9B59B6", "#7D3C98", "#C39BD3", "#A569BD", "#6C3483"],
  rainbow: [
    "#FF0000",
    "#FF7F00",
    "#FFFF00",
    "#00FF00",
    "#0000FF",
    "#4B0082",
    "#9400D3",
  ],
};

// --- Imperative trigger (call from anywhere) ---

export function triggerConfetti(
  color: ConfettiColor = "gold",
  count = 80,
  originX?: number,
  originY?: number
) {
  const event = new CustomEvent("guildos:confetti", {
    detail: { color, count, originX, originY },
  });
  window.dispatchEvent(event);
}

// --- Canvas renderer component (mount once in layout) ---

export function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  const spawnParticles = useCallback(
    (
      color: ConfettiColor,
      count: number,
      originX?: number,
      originY?: number
    ) => {
      if (prefersReducedMotion.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const colors = COLOR_MAP[color] || COLOR_MAP.gold;
      const w = canvas.width;
      const h = canvas.height;
      const cx = originX ?? w / 2;
      const cy = originY ?? h / 3;

      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 14 + 4;
        newParticles.push({
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
          vy: Math.sin(angle) * speed * (0.3 + Math.random() * 0.3) - 6,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          size: Math.random() * 8 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 1,
          fadeSpeed: Math.random() * 0.012 + 0.004,
          gravity: 0.12 + Math.random() * 0.08,
          shape: (["rect", "circle", "star", "triangle"] as const)[
            Math.floor(Math.random() * 4)
          ],
        });
      }
      particlesRef.current.push(...newParticles);
    },
    []
  );

  // Listen for confetti events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        color: ConfettiColor;
        count: number;
        originX?: number;
        originY?: number;
      };
      spawnParticles(detail.color, detail.count, detail.originX, detail.originY);
    };
    window.addEventListener("guildos:confetti", handler);
    return () => window.removeEventListener("guildos:confetti", handler);
  }, [spawnParticles]);

  // Canvas setup and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Remove faded particles
      particlesRef.current = particlesRef.current.filter(
        (p) => p.opacity > 0
      );

      for (const p of particlesRef.current) {
        // Physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.fadeSpeed;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) {
          p.vx *= -0.5;
          p.x = p.x < 0 ? 0 : canvas.width;
        }
        if (p.y > canvas.height) {
          p.vy *= -0.3;
          p.y = canvas.height - 2;
        }

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          const points = 5;
          const outerR = p.size / 2;
          const innerR = outerR * 0.4;
          ctx.beginPath();
          for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === "triangle") {
          const s = p.size / 2;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(-s, s);
          ctx.lineTo(s, s);
          ctx.closePath();
          ctx.fill();
        } else {
          // rect (default)
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[90]"
      aria-hidden="true"
    />
  );
}

// --- React hook for imperative usage ---

export function useConfetti() {
  return {
    fire: (color: ConfettiColor = "gold", count = 80) =>
      triggerConfetti(color, count),
    fireLegendary: () => triggerConfetti("legendary", 120),
    fireLevelUp: () => triggerConfetti("green", 100),
    fireFactionWin: (faction: string) => {
      const colorMap: Record<string, ConfettiColor> = {
        SEGA_SYNDICATE: "sega",
        NINTENDO_NOMADS: "nintendo",
        SONY_SENTINELS: "sony",
      };
      triggerConfetti(colorMap[faction] || "rainbow", 100);
    },
    fireKonami: () => triggerConfetti("rainbow", 150),
  };
}
