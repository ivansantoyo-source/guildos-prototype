"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ActivityEvent } from "@/lib/types";

// ============================================================================
// GUILDOS — Live Activity Ticker
// Horizontal scrolling ticker at top of dashboard
// Shows recent events in real-time
// New events slide in from right
// Pauses on hover
// Color-coded by event type
// ============================================================================

const TYPE_STYLES: Record<
  string,
  { icon: string; color: string; bg: string; border: string }
> = {
  GRAIL: {
    icon: "💎",
    color: "text-legendary",
    bg: "bg-legendary/12",
    border: "border-legendary/25",
  },
  SCAN: {
    icon: "📸",
    color: "text-primary",
    bg: "bg-primary/12",
    border: "border-primary/25",
  },
  BOUNTY: {
    icon: "📜",
    color: "text-xp",
    bg: "bg-xp/12",
    border: "border-xp/25",
  },
  SALE: {
    icon: "💰",
    color: "text-gold",
    bg: "bg-gold/12",
    border: "border-gold/25",
  },
  SCORE: {
    icon: "🏆",
    color: "text-primary",
    bg: "bg-primary/12",
    border: "border-primary/25",
  },
  TRADE_IN: {
    icon: "🔄",
    color: "text-muted-foreground",
    bg: "bg-muted/12",
    border: "border-muted/25",
  },
};

interface TickerItem {
  id: string;
  icon: string;
  text: string;
  color: string;
  bg: string;
  border: string;
}

const DEMO_MESSAGES: TickerItem[] = [
  {
    id: "demo-1",
    icon: "💎",
    text: "TRON_99 just scanned EarthBound ($350)",
    color: "text-legendary",
    bg: "bg-legendary/12",
    border: "border-legendary/25",
  },
  {
    id: "demo-2",
    icon: "📜",
    text: "NEO_GEO fulfilled PowerStone 2 bounty ($150)",
    color: "text-xp",
    bg: "bg-xp/12",
    border: "border-xp/25",
  },
  {
    id: "demo-3",
    icon: "💰",
    text: "Sonic 2 sold for $29.99",
    color: "text-gold",
    bg: "bg-gold/12",
    border: "border-gold/25",
  },
  {
    id: "demo-4",
    icon: "🏆",
    text: "PIXEL_QUEEN scored 985,000 on GALAGA",
    color: "text-primary",
    bg: "bg-primary/12",
    border: "border-primary/25",
  },
  {
    id: "demo-5",
    icon: "🔄",
    text: "N64 Console traded in ($75.00)",
    color: "text-muted-foreground",
    bg: "bg-muted/12",
    border: "border-muted/25",
  },
  {
    id: "demo-6",
    icon: "💎",
    text: "Chrono Trigger price spike detected (+22%)",
    color: "text-legendary",
    bg: "bg-legendary/12",
    border: "border-legendary/25",
  },
  {
    id: "demo-7",
    icon: "📜",
    text: "New bounty posted: Stadium Events ($37,500)",
    color: "text-xp",
    bg: "bg-xp/12",
    border: "border-xp/25",
  },
  {
    id: "demo-8",
    icon: "💰",
    text: "Save Room Omega reserved by PIXEL_QUEEN",
    color: "text-gold",
    bg: "bg-gold/12",
    border: "border-gold/25",
  },
  {
    id: "demo-9",
    icon: "💎",
    text: "Panzer Dragoon Saga — Legendary drop! ($850)",
    color: "text-legendary",
    bg: "bg-legendary/12",
    border: "border-legendary/25",
  },
  {
    id: "demo-10",
    icon: "🏆",
    text: "TRON_99 posted 1,245,500 on PAC-MAN",
    color: "text-primary",
    bg: "bg-primary/12",
    border: "border-primary/25",
  },
];

export function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [animatingIn, setAnimatingIn] = useState(false);
  const indexRef = useRef(0);
  const tickerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Convert activity events to ticker items
  const eventToItem = useCallback((event: ActivityEvent): TickerItem => {
    const style = TYPE_STYLES[event.type] || {
      icon: "📌",
      color: "text-muted-foreground",
      bg: "bg-muted/12",
      border: "border-muted/25",
    };
    return {
      id: event.id,
      icon: style.icon,
      text: event.description,
      color: style.color,
      bg: style.bg,
      border: style.border,
    };
  }, []);

  // Add a new item with slide-in animation
  const addItem = useCallback((item: TickerItem) => {
    setAnimatingIn(true);
    setItems((prev) => {
      const next = [...prev, item];
      // Keep max 50 items
      return next.length > 50 ? next.slice(-50) : next;
    });
    setTimeout(() => setAnimatingIn(false), 500);
  }, []);

  // Demo mode: push events on interval
  useEffect(() => {
    // Seed initial items
    const initial = DEMO_MESSAGES.slice(0, 5);
    setItems(initial);
    indexRef.current = 5;

    tickerTimerRef.current = setInterval(() => {
      const msg = DEMO_MESSAGES[indexRef.current % DEMO_MESSAGES.length];
      indexRef.current++;
      addItem(msg);
    }, 5000);

    return () => {
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    };
  }, [addItem]);

  // Listen for real events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      addItem(eventToItem(detail as ActivityEvent));
    };
    window.addEventListener("guildos:activity", handler);
    return () => window.removeEventListener("guildos:activity", handler);
  }, [addItem, eventToItem]);

  if (items.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden bg-card/80 border-y border-primary/10 h-9"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Leading glow gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      {/* Scrolling container */}
      <div className="flex items-center h-full overflow-hidden">
        <div
          className="flex items-center gap-3 px-4 whitespace-nowrap"
          style={{
            animation: isPaused
              ? "none"
              : `ticker-scroll ${Math.max(20, items.length * 3)}s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {/* Duplicate items for seamless loop */}
          {[...items, ...items].map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] ${item.bg} ${item.border} border shrink-0`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={item.color}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
