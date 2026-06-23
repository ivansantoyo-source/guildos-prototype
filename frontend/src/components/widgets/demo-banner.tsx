"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { playClick } from "@/lib/audio/sounds";

// ============================================================================
// GUILDOS — Demo Mode Banner
// Premium interactive banner shown in demo mode.
// Provides clear Call-to-Action for potential customers.
// ============================================================================

const DEMO_TIPS = [
  { icon: "📦", text: "Browse 10 retro gaming items in the Inventory Matrix — including 3 Legendary drops" },
  { icon: "📜", text: "Check out 4 active bounties with auto-calculated store credit values" },
  { icon: "🏟️", text: "Join 3 live LFG lobbies and explore the Ghost Data arcade leaderboard" },
  { icon: "🤖", text: "Chat with the AI Shopkeeper — ask about games, prices, or history" },
  { icon: "⚔️", text: "Watch the Faction War tracker — see which faction is leading this month" },
];

export function DemoBanner() {
  const demoMode = useGuildStore((s) => s.demoMode);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips every 5 seconds
  useEffect(() => {
    if (!demoMode || isDismissed) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DEMO_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [demoMode, isDismissed]);

  const handleDismiss = useCallback(() => {
    playClick();
    setIsDismissed(true);
    setTimeout(() => setIsVisible(false), 300);
  }, []);

  if (!demoMode || !isVisible) return null;

  const currentTip = DEMO_TIPS[tipIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="border-b border-gold/20 bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: Status badge */}
          <div className="flex items-center gap-3 shrink-0">
            <motion.span
              className="text-sm"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              ⚡
            </motion.span>
            <span className="text-xs font-bold text-gold uppercase tracking-wider">
              Demo Mode Active
            </span>
            <span className="hidden sm:inline text-[10px] text-gold/50 border border-gold/20 rounded-full px-2 py-0.5">
              Phantom Data
            </span>
          </div>

          {/* Center: Rotating tip */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tipIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm">{currentTip.icon}</span>
                <span className="text-xs text-gold/70 truncate">{currentTip.text}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/login"
              className="text-[10px] px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold hover:bg-primary/30 transition-colors whitespace-nowrap"
            >
              🚀 Sign Up Free
            </a>
            <button
              onClick={handleDismiss}
              className="text-[10px] text-gold/40 hover:text-gold/80 transition-colors px-1"
              aria-label="Dismiss demo banner"
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
