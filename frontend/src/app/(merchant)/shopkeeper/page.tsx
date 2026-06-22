"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { ShopkeeperMessage } from "@/lib/types";

const SYSTEM_GREETING: ShopkeeperMessage = {
  id: "sys-greeting",
  role: "assistant",
  content:
    "Greetings, traveler! Welcome to the Guild. I am the Synthetic Shopkeeper — your encyclopedic guide to everything retro-gaming. Ask me about our current stock, game history, hardware variants, or trade-in values. How may I assist you today?",
  timestamp: new Date().toISOString(),
};

export default function ShopkeeperPage() {
  const messages = useGuildStore((s) => s.shopkeeperMessages);
  const addMessage = useGuildStore((s) => s.addShopkeeperMessage);
  const inventory = useGuildStore((s) => s.inventory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting on first mount
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      addMessage(SYSTEM_GREETING);
    }
  }, [messages.length, addMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ShopkeeperMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/shopkeeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage.content,
          tenantId: "demo-time-warp-001",
          inventory: inventory.slice(0, 20).map((i) => ({
            item_name: i.item_name,
            platform: i.platform,
            market_value: i.market_value,
            stock_count: i.stock_count,
            condition: i.condition,
          })),
        }),
      });

      const data = await res.json();
      const aiMessage: ShopkeeperMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Hmm, the signal is fuzzy. Try again, traveler.",
        timestamp: new Date().toISOString(),
      };
      addMessage(aiMessage);
    } catch {
      addMessage({
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Connection to the Oracle has been interrupted. Please try again.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">🤖 SYNTHETIC SHOPKEEPER</h1>
          <p className="text-xs text-muted-foreground mt-1">
            DeepSeek-V3 · Encyclopedic retro-gaming clerk · Inventory-aware
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-neon-pulse" />
          <span className="text-[11px] text-primary">ONLINE</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary/15 border border-primary/20 text-foreground"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {/* Role Label */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {msg.role === "user" ? "YOU" : "🤖 SHOPKEEPER"}
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                🤖 SHOPKEEPER
              </span>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries */}
      <div className="flex flex-wrap gap-2 px-4">
        {[
          { label: "💰 Check Prices", query: "What are the current market prices looking like?" },
          { label: "🎮 Recommend a JRPG", query: "Can you recommend a good JRPG from our inventory?" },
          { label: "💎 Rarest Item?", query: "What's the rarest item we have in stock?" },
          { label: "⚔️ Faction Wars", query: "Tell me about the faction wars!" },
          { label: "🔧 Scrap Yard", query: "What's in the scrap yard?" },
          { label: "⬆️⬆️⬇️⬇️", query: "Konami Code?" },
        ].map((pill) => (
          <button
            key={pill.label}
            onClick={() => {
              setInput(pill.query);
              // Small delay so the user can see what they're about to send
              setTimeout(() => {
                const syntheticEvent = {
                  key: 'Enter',
                  preventDefault: () => {},
                } as React.KeyboardEvent<HTMLInputElement>;
                // Directly send the query
                const userMessage: ShopkeeperMessage = {
                  id: `usr-${Date.now()}`,
                  role: "user",
                  content: pill.query,
                  timestamp: new Date().toISOString(),
                };
                useGuildStore.getState().addShopkeeperMessage(userMessage);
                // Trigger send via fetch
                setIsLoading(true);
                const sendPillQuery = async () => {
                  try {
                    const res = await fetch("/api/ai/shopkeeper", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        query: pill.query,
                        tenantId: "demo-time-warp-001",
                        inventory: useGuildStore.getState().inventory.slice(0, 20).map((i) => ({
                          item_name: i.item_name,
                          platform: i.platform,
                          market_value: i.market_value,
                          stock_count: i.stock_count,
                          condition: i.condition,
                        })),
                      }),
                    });
                    const data = await res.json();
                    useGuildStore.getState().addShopkeeperMessage({
                      id: `ai-${Date.now()}`,
                      role: "assistant",
                      content: data.reply || "Hmm, the signal is fuzzy. Try again, traveler.",
                      timestamp: new Date().toISOString(),
                    });
                  } catch {
                    useGuildStore.getState().addShopkeeperMessage({
                      id: `err-${Date.now()}`,
                      role: "assistant",
                      content: "⚠️ Connection to the Oracle has been interrupted. Please try again.",
                      timestamp: new Date().toISOString(),
                    });
                  } finally {
                    setIsLoading(false);
                  }
                };
                sendPillQuery();
              }, 200);
            }}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-50"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask the Shopkeeper anything..."
            className="flex-1 px-4 py-3 text-sm bg-card border border-border rounded-lg guild-input text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
            id="input-shopkeeper-query"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            id="btn-shopkeeper-send"
          >
            SEND
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Responses are AI-generated. Stock queries reference your live inventory data.
        </p>
      </div>
    </div>
  );
}
