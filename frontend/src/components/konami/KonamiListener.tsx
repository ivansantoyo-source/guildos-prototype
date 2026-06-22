"use client";

import { useEffect, useState, useCallback } from "react";

export function KonamiListener() {
  const [isActive, setIsActive] = useState(false);
  const [discountCode, setDiscountCode] = useState("");

  const generateCode = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "1UP-";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }, []);

  useEffect(() => {
    const konamiSequence = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a",
    ];
    let inputBuffer: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      inputBuffer.push(e.key);
      inputBuffer = inputBuffer.slice(-konamiSequence.length);

      if (JSON.stringify(inputBuffer) === JSON.stringify(konamiSequence)) {
        const code = generateCode();
        setDiscountCode(code);
        setIsActive(true);
        inputBuffer = [];

        // Record the discount code via API
        fetch('/api/discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            discount_percent: 10.0,
            source: 'KONAMI',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        }).catch(() => {
          // Silent fail — discount still works client-side in demo mode
        });

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          setIsActive(false);
        }, 8000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [generateCode]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center animate-konami-flash">
      {/* Scanline overlay */}
      <div className="absolute inset-0 crt-overlay" />

      {/* Popup */}
      <div className="relative pointer-events-auto bg-black/95 border-2 border-primary p-8 rounded-xl shadow-[0_0_60px_oklch(0.78_0.3_145/40%),0_0_120px_oklch(0.78_0.3_145/15%)] text-center max-w-md mx-4 animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={() => setIsActive(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors text-lg pointer-events-auto"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-5xl mb-3">🕹️</div>
        <h2 className="text-3xl font-bold text-primary text-glow-green mb-1 animate-neon-pulse">
          CHEAT ACTIVATED!
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          ↑ ↑ ↓ ↓ ← → ← → B A
        </p>

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Your discount code:</p>
          <p className="text-2xl font-mono font-bold text-gold text-glow-gold tracking-widest">
            {discountCode}
          </p>
          <p className="text-xs text-primary/70 mt-1">10% off your next trade-in</p>
        </div>

        <p className="text-[11px] text-muted-foreground/60">
          Single-use code · Expires in 24 hours
        </p>
      </div>
    </div>
  );
}
