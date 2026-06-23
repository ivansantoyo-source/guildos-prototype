"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { pageTransition } from "@/lib/animations";
import StoreNav from "@/components/storefront/StoreNav";
import type { ShopkeeperMessage } from "@/lib/types";

// ============================================================
// MOCK SHOPKEEPER RESPONSES (keyword-based demo mode)
// ============================================================
const MOCK_RESPONSES: Record<string, string> = {
  rpg: "Ah, RPGs! We have some classics in stock. Let me check... We've got **Chrono Trigger** (SNES, $199.99 LOOSE), **EarthBound** (SNES CIB, $379.99 — a true grail!), and **Super Mario RPG** (SNES, $89.99). Our {@link TRON_99} customer just picked up a copy of **Skies of Arcadia** for Dreamcast too! Stop by and take a look — I'd recommend Chrono Trigger first if you're new to retro JRPGs.",
  rare: "Ah, a hunter of rare prey! Our rarest item right now is **Panzer Dragoon Saga** for the Sega Saturn — CIB at $899.99. That's a legendary-tier item with only 1 in stock. We also have **EarthBound** CIB for $379.99 and **Chrono Trigger** LOOSE at $199.99. These are all actively price-spiking, so don't wait too long!",
  price: "Let me check our current pricing trends... We've got **Chrono Trigger** at $199.99 (market: $185.00, ⬆️ trending up), **EarthBound** CIB at $379.99 (market: $350.00), and **Panzer Dragoon Saga** at $899.99 (market: $850.00, ⬆️ price spike active!). Great time to buy before prices climb further. Anything specific catch your eye?",
  deal: "Deals? You've come to the right place! We've got **Super Mario RPG** for just $89.99 (save $5 vs. market), **Metal Gear Solid** CIB at $39.99, and **Sonic the Hedgehog 2** CIB at $29.99. Pro tip: check our bounty board! If you find a game we're hunting, you can earn serious store credit. Our active bounties include **Stadium Events** (NES) at $37,500 credit!",
  nintendo: "Nintendo fan, excellent taste! Our Nintendo selection includes **EarthBound** (SNES CIB, $379.99), **Chrono Trigger** (SNES LOOSE, $199.99), **Super Mario RPG** (SNES, $89.99), **The Legend of Zelda: Ocarina of Time** (N64 CIB, $99.99), and an **N64 Console** (LOOSE, $84.99). We also have a **Nintendo 64** in stock!",
  sega: "SEGA! We've got a **Sonic the Hedgehog 2** CIB for $29.99, and the crown jewel — **Panzer Dragoon Saga** for Saturn at $899.99 (legendary!). We also have a **Dreamcast Console** in stock. Sega fans, you know what's up! 🦔",
  sony: "PlayStation collector, nice! We've got **Chrono Cross** (PS1 CIB, $49.99), **Metal Gear Solid** (PS1 CIB, $39.99), and a **Silent Hill 2** (PS2) that just came in. The PS1 era is a goldmine for JRPGs. Come check out our selection!",
  bounties: "The bounty board is active! We're currently hunting: **Stadium Events** (NES) — $37,500 store credit (the holy grail!), **Mega Man X3** (SNES) — $375, **Suikoden II** (PS1) — $315. We also have limit buy orders active. Check the Bounty Board for full details!",
  credit: "Store credit can be earned by fulfilling bounties, trading in games, and participating in events. Our top hunter **TRON_99** has earned $4,850 in credit! Current store credit balance can be used toward any purchase. Want to check your balance or find a bounty to work on?",
};

const DEFAULT_RESPONSE = "Great question! **Time Warp Gaming** has a fantastic selection of retro games and consoles. We specialize in SNES, NES, N64, Genesis, PS1, and Dreamcast titles with conditions ranging from NEW to CIB to LOOSE. Our current inventory includes several legendary items and active price spikes. Feel free to ask about specific games, platforms, prices, or what we'd recommend! 🎮";

const SUGGESTED_PROMPTS = [
  { label: "🎮 What RPGs do you have?", query: "What RPGs do you have in stock?" },
  { label: "💎 What's the rarest item?", query: "What's the rarest item you have?" },
  { label: "💰 Any deals today?", query: "Any deals or discounts today?" },
  { label: "📜 Active bounties?", query: "Tell me about the active bounties" },
  { label: "🦔 Sega games?", query: "What Sega games do you have?" },
];

// ============================================================
// MARKDOWN CONTENT RENDERER
// ============================================================
function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="text-[11px] bg-muted px-1 py-0.5 rounded text-gold font-mono">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ============================================================
// TYPING INDICATOR
// ============================================================
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
          🤖 SHOPKEEPER
        </span>
        <div className="flex gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CUSTOMER AI CHAT PAGE
// ============================================================
export default function CustomerChatPage({ params }: { params: { tenant: string } }) {
  const tenant = params.tenant;
  const storeName = tenant.replace(/-/g, " ");

  const inventory = useGuildStore((s) => s.inventory);
  const demoMode = useGuildStore((s) => s.demoMode);

  const [messages, setMessages] = useState<ShopkeeperMessage[]>([
    {
      id: "greeting",
      role: "assistant",
      content: "Greetings, traveler! I'm the **Time Warp Gaming** Shopkeeper AI. Ask me about our inventory, prices, rare finds, or anything retro-gaming! What can I help you with today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const getMockResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("rpg") || q.includes("jrpg")) return MOCK_RESPONSES.rpg;
    if (q.includes("rare") || q.includes("grail") || q.includes("rarest")) return MOCK_RESPONSES.rare;
    if (q.includes("price") || q.includes("cost") || q.includes("value") || q.includes("worth")) return MOCK_RESPONSES.price;
    if (q.includes("deal") || q.includes("discount") || q.includes("sale") || q.includes("save")) return MOCK_RESPONSES.deal;
    if (q.includes("nintendo") || q.includes("nes") || q.includes("snes") || q.includes("n64")) return MOCK_RESPONSES.nintendo;
    if (q.includes("sega") || q.includes("genesis") || q.includes("dreamcast") || q.includes("saturn")) return MOCK_RESPONSES.sega;
    if (q.includes("sony") || q.includes("playstation") || q.includes("ps1") || q.includes("ps2")) return MOCK_RESPONSES.sony;
    if (q.includes("bounty") || q.includes("quest") || q.includes("hunt")) return MOCK_RESPONSES.bounties;
    if (q.includes("credit") || q.includes("wallet") || q.includes("balance")) return MOCK_RESPONSES.credit;
    if (q.includes("hello") || q.includes("hi ") || q.includes("hey")) return "Hey there! Welcome to **Time Warp Gaming**! I'm your AI shopkeeper. Browse our catalog, ask about any game, or check out our active bounties. What brings you in today? 🎮";
    return DEFAULT_RESPONSE;
  };

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: ShopkeeperMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: query.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    // In demo mode, use keyword-matched mock responses with streaming animation
    if (demoMode) {
      const response = getMockResponse(query);
      const messageId = `ai-${Date.now()}`;

      // Simulate streaming
      let charIndex = 0;
      const streamInterval = setInterval(() => {
        charIndex += 3; // Simulate 3 chars per tick
        const chunk = response.slice(0, charIndex);
        setStreamingContent(chunk);

        if (charIndex >= response.length) {
          clearInterval(streamInterval);
          setStreamingContent("");
          setMessages((prev) => [
            ...prev,
            {
              id: messageId,
              role: "assistant",
              content: response,
              timestamp: new Date().toISOString(),
            },
          ]);
          setIsLoading(false);
        }
      }, 30);

      return;
    }

    // Production: try API call
    try {
      const res = await fetch("/api/ai/shopkeeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage.content,
          inventory: inventory.slice(0, 20).map((i) => ({
            item_name: i.item_name,
            platform: i.platform,
            market_value: i.market_value,
            stock_count: i.stock_count,
            condition: i.condition,
            tags: i.tags,
          })),
          messages: messages.slice(-6),
        }),
      });

      const data = await res.json();
      const reply = data.reply || "Hmm, the signal is fuzzy. Try again, traveler.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "⚠️ Connection to the Oracle has been interrupted. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, demoMode, inventory, messages]);

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-background text-foreground flex flex-col"
    >
      <StoreNav tenant={tenant} storeName={storeName} />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-xl font-bold text-primary text-glow-green">🤖 Shopkeeper AI</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ask me anything about our inventory!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-neon-pulse" />
            <span className="text-[11px] text-primary">ONLINE</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary/15 border border-primary/20 text-foreground"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {msg.role === "user" ? "YOU" : "🤖 SHOPKEEPER"}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {msg.role === "assistant" ? (
                  <MarkdownContent content={msg.content} />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isLoading && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg px-4 py-3 bg-card border border-border text-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    🤖 SHOPKEEPER
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-neon-pulse" />
                </div>
                <MarkdownContent content={streamingContent} />
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && !streamingContent && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {!isLoading && messages.length <= 2 && (
          <div className="flex flex-wrap gap-2 pb-3 shrink-0">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => {
                  setInput(prompt.query);
                  setTimeout(() => sendMessage(prompt.query), 100);
                }}
                className="px-3 py-1.5 text-xs rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        )}

        {/* Inventory context */}
        <div className="pb-1 shrink-0">
          <p className="text-[10px] text-muted-foreground">
            📦 {inventory.length} items in stock · Demo Shopkeeper AI
          </p>
        </div>

        {/* Input Area */}
        <div className="border-t border-border pt-4 shrink-0">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask the Shopkeeper about our inventory..."
              className="flex-1 px-4 py-3 text-sm bg-card border border-border rounded-xl guild-input text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 text-sm rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
